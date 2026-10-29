import fs from 'fs/promises';
import path from 'path';
import * as fileRepository from '../repositories/fileRepository.js';
import * as folderRepository from '../repositories/folderRepository.js';
import * as userRepository from '../repositories/userRepository.js';
import { signPurposeToken, verifyPurposeToken } from './tokenService.js';
import { sendShareInvitationEmail } from './emailService.js';
import { resolveUserPlanDecorator } from './subscriptionService.js';
import { config } from '../config/env.js';
import { fileStorage } from '../patterns/storageBridge/index.js';
import { effectiveMaxFileSize, fileTooLargeMessage } from '../utils/uploadLimits.js';
import { FORBIDDEN_FILE_EXTENSIONS, TOKEN_PURPOSES, FILE_SHARE_EXPIRES_IN } from '../config/constants.js';
import { HttpError } from '../utils/httpError.js';

/**
 * Entrega el contenido de un archivo para descarga o visualización.
 * El "dónde" (disco o Supabase) lo resuelve el patrón Bridge (fileStorage).
 */
async function openStoredFile(archivo) {
  const contenido = await fileStorage.open(archivo);
  if (!contenido) {
    throw new HttpError(404, 'El contenido del archivo no se encuentra en el almacenamiento.');
  }
  return {
    stream: contenido.stream,
    size: contenido.size ?? Number(archivo.tamano),
    nombre: archivo.nombre,
    tipo: archivo.tipo,
    tamano: archivo.tamano,
  };
}

/**
 * Procesa la carga de uno o varios archivos binarios validando cuotas según el Plan decorado
 * del usuario (Patrón Decorator) y persistiendo metadatos.
 */
export async function uploadFile({ usuarioId, carpetaId = null, file, files = [], planDecorado = null }) {
  const fileList = Array.isArray(files) && files.length > 0 ? files : file ? [file] : [];

  const cleanupTempFiles = async () => {
    await Promise.all(
      fileList.map((f) => (f?.path ? fs.unlink(f.path).catch(() => {}) : Promise.resolve()))
    );
  };

  if (fileList.length === 0) {
    throw new HttpError(400, 'Debes seleccionar al menos un archivo para subir.');
  }

  // 1. Resolver el Plan decorado si no fue inyectado por el middleware
  const activeDecorator =
    planDecorado || (await resolveUserPlanDecorator(usuarioId)).planDecorado;
  const politicaMulter = activeDecorator.obtenerPoliticaMulter();

  if (fileList.length > politicaMulter.maxFiles) {
    await cleanupTempFiles();
    throw new HttpError(
      400,
      `Tu plan actual (${activeDecorator.constructor.name}) permite subir máximo ${politicaMulter.maxFiles} archivo(s) por operación.`
    );
  }

  const maxFileSize = effectiveMaxFileSize(politicaMulter);
  for (const item of fileList) {
    if (item.size > maxFileSize) {
      await cleanupTempFiles();
      throw new HttpError(
        400,
        fileTooLargeMessage({ politica: politicaMulter, planName: activeDecorator.constructor.name, fileName: item.originalname })
      );
    }
  }

  // 2. Validar que la carpeta de destino exista y pertenezca al usuario (si no es la raíz)
  if (carpetaId) {
    const carpeta = await folderRepository.findFolderByIdAndUser(carpetaId, usuarioId);
    if (!carpeta) {
      await cleanupTempFiles();
      throw new HttpError(404, 'La carpeta especificada no existe o no tienes permisos para acceder a ella.');
    }
  }

  // 3. Validar cuota de almacenamiento disponible (usando la cuota del usuario sincronizada con su Plan decorado)
  const quota = await userRepository.getStorageQuota(usuarioId);
  if (!quota) {
    await cleanupTempFiles();
    throw new HttpError(404, 'Usuario no encontrado.');
  }

  const totalBatchBytes = fileList.reduce((acc, f) => acc + Number(f.size || 0), 0);
  const espacioConsumido = Number(quota.espacio_consumido);
  const espacioDisponible = Math.max(Number(quota.espacio_disponible), activeDecorator.almacenamiento());
  const nuevoConsumo = espacioConsumido + totalBatchBytes;

  if (nuevoConsumo > espacioDisponible) {
    await cleanupTempFiles();
    throw new HttpError(
      400,
      `Espacio de almacenamiento insuficiente en tu ${activeDecorator.constructor.name}. Disponible: ${Math.max(0, espacioDisponible - espacioConsumido)} bytes, requerido: ${totalBatchBytes} bytes.`
    );
  }

  const archivosCreados = [];
  const archivosGuardados = [];

  try {
    for (const item of fileList) {
      // 4. Registrar metadatos en la base de datos
      const nuevoArchivo = await fileRepository.createFile({
        usuarioId,
        carpetaId: carpetaId || null,
        nombre: item.originalname,
        tamano: item.size,
        tipo: item.mimetype || 'application/octet-stream',
      });
      archivosCreados.push(nuevoArchivo);

      // 5. Guardar el contenido en el almacenamiento configurado (patrón Bridge)
      await fileStorage.store(nuevoArchivo, item.path);
      archivosGuardados.push(nuevoArchivo);
    }

    // 6. Incrementar el espacio consumido del usuario
    await userRepository.incrementConsumedSpace(usuarioId, totalBatchBytes);

    return {
      archivo: archivosCreados[0],
      archivos: archivosCreados,
      planAplicado: activeDecorator.toJSON(),
    };
  } catch (error) {
    // Limpieza preventiva en el almacenamiento y la BD si ocurrió algún fallo intermedio
    await cleanupTempFiles();
    await fileStorage.removeMany(archivosGuardados);
    await Promise.all(
      archivosCreados.map((a) => fileRepository.deleteFile(a.id, usuarioId).catch(() => {}))
    );
    throw error;
  }
}

/**
 * Obtiene la información necesaria para despachar la descarga de un archivo.
 */
export async function getFileForDownload(archivoId, usuarioId) {
  const archivo = await fileRepository.findFileByIdAndUser(archivoId, usuarioId);
  if (!archivo) {
    throw new HttpError(404, 'Archivo no encontrado o no tienes permisos para descargarlo.');
  }

  return openStoredFile(archivo);
}

/**
 * Mueve un archivo a la papelera, o si ya estaba en la papelera (o se solicita borrado permanente)
 * lo elimina definitivamente liberando la cuota.
 */
export async function deleteFile(archivoId, usuarioId, { permanent = false } = {}) {
  const archivo = await fileRepository.findFileByIdAndUser(archivoId, usuarioId);
  if (!archivo) {
    throw new HttpError(404, 'Archivo no encontrado o no tienes permisos para eliminarlo.');
  }

  if (!permanent && !archivo.en_papelera) {
    const movido = await fileRepository.moveFileToTrash(archivoId, usuarioId);
    return {
      id: movido.id,
      nombre: movido.nombre,
      enPapelera: true,
      tamanoLiberado: 0,
    };
  }

  return permanentDeleteFile(archivoId, usuarioId);
}

/**
 * Elimina permanentemente un archivo de la base de datos y del disco, liberando cuota.
 */
export async function permanentDeleteFile(archivoId, usuarioId) {
  const archivo = await fileRepository.findFileByIdAndUser(archivoId, usuarioId);
  if (!archivo) {
    throw new HttpError(404, 'Archivo no encontrado o no tienes permisos para eliminarlo.');
  }

  // 1. Eliminar registro en base de datos
  await fileRepository.deleteFile(archivoId, usuarioId);

  // 2. Decrementar el espacio consumido del usuario
  await userRepository.decrementConsumedSpace(usuarioId, archivo.tamano);

  // 3. Eliminar el contenido del almacenamiento
  await fileStorage.remove(archivo);

  return {
    id: archivo.id,
    nombre: archivo.nombre,
    enPapelera: false,
    tamanoLiberado: Number(archivo.tamano),
  };
}

/**
 * Lista los archivos que se encuentran actualmente en la papelera del usuario.
 */
export async function getTrashFiles(usuarioId) {
  return fileRepository.findTrashFilesByUser(usuarioId);
}

/**
 * Restaura un archivo de la papelera a su ubicación original.
 */
export async function restoreFile(archivoId, usuarioId) {
  const archivo = await fileRepository.findFileByIdAndUser(archivoId, usuarioId);
  if (!archivo) {
    throw new HttpError(404, 'Archivo no encontrado.');
  }

  return fileRepository.restoreFileFromTrash(archivoId, usuarioId);
}

/**
 * Vacía toda la papelera del usuario eliminando los archivos físicos y liberando la cuota total.
 */
export async function emptyTrash(usuarioId) {
  const eliminados = await fileRepository.deleteAllTrashFilesByUser(usuarioId);
  const totalBytesLiberados = eliminados.reduce((acc, f) => acc + Number(f.tamano || 0), 0);

  if (totalBytesLiberados > 0) {
    await userRepository.decrementConsumedSpace(usuarioId, totalBytesLiberados);
  }

  await fileStorage.removeMany(eliminados);

  return {
    eliminadosCount: eliminados.length,
    bytesLiberados: totalBytesLiberados,
  };
}

/**
 * Renombra un archivo existente sincronizando su extensión física en disco si cambia.
 */
export async function renameFile(archivoId, usuarioId, nuevoNombre) {
  if (!nuevoNombre || !nuevoNombre.trim()) {
    throw new HttpError(400, 'El nuevo nombre no puede estar vacío.');
  }

  const archivo = await fileRepository.findFileByIdAndUser(archivoId, usuarioId);
  if (!archivo) {
    throw new HttpError(404, 'Archivo no encontrado o no tienes permisos para renombrarlo.');
  }

  let nombreFinal = nuevoNombre.trim();
  const extOriginal = path.extname(archivo.nombre || '');
  const extNueva = path.extname(nombreFinal);

  // Si el usuario omitió la extensión al renombrar, conservar la extensión original
  if (!extNueva && extOriginal) {
    nombreFinal = `${nombreFinal}${extOriginal}`;
  }

  const extFinal = path.extname(nombreFinal).toLowerCase();
  if (FORBIDDEN_FILE_EXTENSIONS.includes(extFinal)) {
    throw new HttpError(400, `El tipo de archivo (${extFinal}) no está permitido por motivos de seguridad.`);
  }

  if (nombreFinal.length > 255) {
    throw new HttpError(400, 'El nuevo nombre no puede exceder los 255 caracteres.');
  }

  // Si cambia la extensión, cambia la clave del contenido en el almacenamiento
  await fileStorage.changeExtension(archivo, extFinal);

  const archivoActualizado = await fileRepository.renameFile(archivoId, usuarioId, nuevoNombre ? nombreFinal : archivo.nombre);
  return archivoActualizado;
}

/**
 * Lista el contenido de un directorio (carpetas y archivos contenidos).
 */
export async function getDirectoryContents(usuarioId, carpetaId = null) {
  let carpetaActual = null;

  if (carpetaId) {
    carpetaActual = await folderRepository.findFolderByIdAndUser(carpetaId, usuarioId);
    if (!carpetaActual) {
      throw new HttpError(404, 'Carpeta no encontrada.');
    }
  }

  const [carpetas, archivos] = await Promise.all([
    folderRepository.findFoldersByUser(usuarioId, carpetaId),
    fileRepository.findFilesByUser(usuarioId, carpetaId),
  ]);

  return {
    carpetaActual,
    carpetas,
    archivos,
  };
}

/**
 * Lista los archivos más recientes del usuario.
 */
export async function getRecentFiles(usuarioId, limit = 10) {
  return fileRepository.findRecentFilesByUser(usuarioId, limit);
}

/**
 * Busca archivos por nombre dentro del espacio del usuario.
 */
export async function searchFiles(usuarioId, term) {
  if (!term || !term.trim()) {
    return [];
  }
  return fileRepository.searchFilesByUser(usuarioId, term.trim());
}

/**
 * Crea una nueva carpeta en la raíz o dentro de otra carpeta.
 */
export async function createFolder({ usuarioId, carpetaPadreId = null, nombre }) {
  if (!nombre || !nombre.trim()) {
    throw new HttpError(400, 'El nombre de la carpeta es obligatorio.');
  }

  if (carpetaPadreId) {
    const padre = await folderRepository.findFolderByIdAndUser(carpetaPadreId, usuarioId);
    if (!padre) {
      throw new HttpError(404, 'La carpeta superior especificada no existe.');
    }
  }

  return folderRepository.createFolder({
    usuarioId,
    carpetaPadreId: carpetaPadreId || null,
    nombre: nombre.trim(),
  });
}

/**
 * Renombra una carpeta.
 */
export async function renameFolder(carpetaId, usuarioId, nuevoNombre) {
  if (!nuevoNombre || !nuevoNombre.trim()) {
    throw new HttpError(400, 'El nuevo nombre no puede estar vacío.');
  }

  const carpeta = await folderRepository.findFolderByIdAndUser(carpetaId, usuarioId);
  if (!carpeta) {
    throw new HttpError(404, 'Carpeta no encontrada.');
  }

  return folderRepository.renameFolder(carpetaId, usuarioId, nuevoNombre.trim());
}

/**
 * Elimina una carpeta, sus subcarpetas y sus archivos en disco, liberando la cuota consumida.
 */
export async function deleteFolder(carpetaId, usuarioId) {
  const carpeta = await folderRepository.findFolderByIdAndUser(carpetaId, usuarioId);
  if (!carpeta) {
    throw new HttpError(404, 'Carpeta no encontrada.');
  }

  // 1. Obtener todos los archivos dentro del árbol jerárquico para borrar del disco y sumar espacio
  const archivosEnArbol = await folderRepository.findAllFilesInFolderRecursive(carpetaId, usuarioId);
  const totalBytesLiberados = archivosEnArbol.reduce((acc, f) => acc + Number(f.tamano || 0), 0);

  // 2. Eliminar explícitamente los registros de archivos del árbol y luego la carpeta en la BD
  await folderRepository.deleteFilesInFolderRecursive(carpetaId, usuarioId);
  await folderRepository.deleteFolder(carpetaId, usuarioId);

  // 3. Decrementar cuota consumida del usuario
  if (totalBytesLiberados > 0) {
    await userRepository.decrementConsumedSpace(usuarioId, totalBytesLiberados);
  }

  // 4. Eliminar del almacenamiento cada archivo que estaba en el árbol
  await fileStorage.removeMany(archivosEnArbol);

  return { id: carpeta.id, nombre: carpeta.nombre, bytesLiberados: totalBytesLiberados };
}

/**
 * Genera un enlace de invitación compartido para un archivo usando la vigencia dinámica
 * que otorga el Decorador de Suscripción del usuario (24h, 7d, 30d o 365d).
 */
export async function createShareInvitation(archivoId, usuarioId, { correoDestinatario } = {}) {
  const archivo = await fileRepository.findFileByIdAndUser(archivoId, usuarioId);
  if (!archivo || archivo.en_papelera) {
    throw new HttpError(404, 'Archivo no encontrado o no disponible para compartir.');
  }

  const remitente = await userRepository.findById(usuarioId);
  if (!remitente) {
    throw new HttpError(404, 'Usuario remitente no encontrado.');
  }

  let destinatario = null;
  const cleanCorreo = typeof correoDestinatario === 'string' ? correoDestinatario.trim().toLowerCase() : '';

  if (cleanCorreo) {
    destinatario = await userRepository.findByEmailWithPassword(cleanCorreo);
    if (!destinatario) {
      throw new HttpError(404, 'El usuario especificado no existe en el sistema.');
    }
  }

  const { planDecorado } = await resolveUserPlanDecorator(usuarioId);
  const vigenciaEnlace = planDecorado.obtenerPoliticaMulter().shareExpiresIn || FILE_SHARE_EXPIRES_IN;

  const shareToken = signPurposeToken(
    { id: archivo.id, correo: destinatario?.correo || remitente.correo },
    TOKEN_PURPOSES.FILE_SHARE,
    vigenciaEnlace
  );

  const shareUrl = `${config.frontendUrl}?mode=shared-file&token=${encodeURIComponent(shareToken)}`;

  if (destinatario) {
    sendShareInvitationEmail({
      correoDestinatario: destinatario.correo,
      nombreDestinatario: destinatario.nombre,
      nombreRemitente: remitente.nombre,
      nombreArchivo: archivo.nombre,
      token: shareToken,
    }).catch((err) => {
      console.error('[EmailService] Error al enviar invitación de archivo:', err.message);
    });
  }

  return {
    shareToken,
    shareUrl,
    vigenciaEnlace,
    planAplicado: planDecorado.constructor.name,
    destinatario: destinatario
      ? { id: destinatario.id, nombre: destinatario.nombre, correo: destinatario.correo }
      : null,
    archivo: {
      id: archivo.id,
      nombre: archivo.nombre,
      tamano: archivo.tamano,
      tipo: archivo.tipo,
    },
  };
}

/**
 * Consulta la información pública de un archivo compartido a partir de su token de invitación.
 */
export async function getSharedFileInfo(token) {
  const payload = verifyPurposeToken(token, TOKEN_PURPOSES.FILE_SHARE);
  if (!payload || !payload.id) {
    throw new HttpError(400, 'El enlace de invitación no es válido o ha expirado.');
  }

  const archivo = await fileRepository.findFileById(payload.id);
  if (!archivo || archivo.en_papelera) {
    throw new HttpError(404, 'El archivo compartido ya no se encuentra disponible.');
  }

  const propietario = await userRepository.findById(archivo.usuario_id);

  return {
    id: archivo.id,
    nombre: archivo.nombre,
    tamano: Number(archivo.tamano),
    tipo: archivo.tipo,
    fecha_subida: archivo.fecha_subida,
    propietario: propietario ? propietario.nombre : 'Usuario de VinCloud',
    invitadoCorreo: payload.correo || null,
  };
}

/**
 * Entrega el contenido de un archivo compartido validando su token de invitación.
 */
export async function getSharedFileForDownload(token) {
  const payload = verifyPurposeToken(token, TOKEN_PURPOSES.FILE_SHARE);
  if (!payload || !payload.id) {
    throw new HttpError(400, 'El enlace de invitación no es válido o ha expirado.');
  }

  const archivo = await fileRepository.findFileById(payload.id);
  if (!archivo || archivo.en_papelera) {
    throw new HttpError(404, 'El archivo compartido ya no se encuentra disponible.');
  }

  return openStoredFile(archivo);
}
