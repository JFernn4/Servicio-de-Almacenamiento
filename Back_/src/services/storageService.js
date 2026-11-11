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
    const carpeta = await folderRepository.findActiveFolderByIdAndUser(carpetaId, usuarioId);
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
 * Purga de la papelera todos los archivos cuya fecha_eliminacion tenga más de 30 días
 * (o los días de retención especificados), eliminando sus metadatos de PostgreSQL,
 * recalculando la cuota de cada usuario afectado y borrando los archivos físicos de disco/storage.
 */
export async function purgeExpiredTrash({ retentionDays = 30, usuarioId = null } = {}) {
  // 1. Carpetas vencidas en la papelera, con todo su contenido
  const carpetasVencidas = await folderRepository.findExpiredTrashFolders(retentionDays, usuarioId);
  let archivosCarpetas = 0;
  let bytesCarpetas = 0;
  for (const carpeta of carpetasVencidas) {
    const resultado = await permanentDeleteFolder(carpeta.id, carpeta.usuario_id);
    archivosCarpetas += resultado.archivosEliminados;
    bytesCarpetas += resultado.bytesLiberados;
  }

  // 2. Archivos vencidos enviados a la papelera de forma individual
  const eliminados = await fileRepository.purgeExpiredTrashFiles(retentionDays, usuarioId);

  if (eliminados.length > 0) {
    await fileStorage.removeMany(eliminados);
  }

  const totalBytesLiberados = eliminados.reduce((acc, f) => acc + Number(f.tamano || 0), 0) + bytesCarpetas;

  return {
    eliminadosCount: eliminados.length + archivosCarpetas,
    carpetasEliminadas: carpetasVencidas.length,
    bytesLiberados: totalBytesLiberados,
    archivos: eliminados.map((f) => ({
      id: f.id,
      nombre: f.nombre,
      tamano: Number(f.tamano),
      usuarioId: f.usuario_id,
    })),
  };
}

/**
 * Indica si un archivo está en la papelera (directamente o dentro de una carpeta en papelera).
 */
async function isInTrash(archivo) {
  if (archivo.en_papelera) return true;
  if (!archivo.carpeta_id) return false;
  return !(await folderRepository.findActiveFolderByIdAndUser(archivo.carpeta_id, archivo.usuario_id));
}

/**
 * Lista los elementos que se encuentran en la papelera del usuario (archivos y carpetas).
 * Antes de listarlos, ejecuta una purga pasiva automática de archivos vencidos (> 30 días).
 */
export async function getTrash(usuarioId) {
  await purgeExpiredTrash({ retentionDays: 30, usuarioId }).catch((err) => {
    console.error('[TrashAutoPurge] Error en purga pasiva para usuario', usuarioId, err.message);
  });
  const [archivos, carpetas] = await Promise.all([
    fileRepository.findTrashFilesByUser(usuarioId),
    folderRepository.findTrashFoldersByUser(usuarioId),
  ]);
  return { archivos, carpetas };
}

/**
 * Restaura un archivo de la papelera a su ubicación original. Si su carpeta
 * sigue en la papelera, el archivo vuelve a la raíz para que sea visible.
 */
export async function restoreFile(archivoId, usuarioId) {
  const archivo = await fileRepository.findFileByIdAndUser(archivoId, usuarioId);
  if (!archivo) {
    throw new HttpError(404, 'Archivo no encontrado.');
  }

  const carpetaOculta = Boolean(archivo.carpeta_id)
    && !(await folderRepository.findActiveFolderByIdAndUser(archivo.carpeta_id, usuarioId));

  return fileRepository.restoreFileFromTrash(archivoId, usuarioId, { moveToRoot: carpetaOculta });
}

/**
 * Vacía toda la papelera del usuario (archivos y carpetas con todo su contenido),
 * eliminando el contenido del almacenamiento y liberando la cuota.
 */
export async function emptyTrash(usuarioId) {
  // 1. Carpetas en la papelera, con todo su árbol
  const carpetas = await folderRepository.findTrashFoldersByUser(usuarioId);
  let bytesCarpetas = 0;
  let archivosCarpetas = 0;
  for (const carpeta of carpetas) {
    const resultado = await permanentDeleteFolder(carpeta.id, usuarioId);
    bytesCarpetas += resultado.bytesLiberados;
    archivosCarpetas += resultado.archivosEliminados;
  }

  // 2. Archivos enviados a la papelera de forma individual
  const eliminados = await fileRepository.deleteAllTrashFilesByUser(usuarioId);
  const bytesArchivos = eliminados.reduce((acc, f) => acc + Number(f.tamano || 0), 0);

  if (bytesArchivos > 0) {
    await userRepository.decrementConsumedSpace(usuarioId, bytesArchivos);
  }

  await fileStorage.removeMany(eliminados);

  return {
    eliminadosCount: eliminados.length + archivosCarpetas,
    carpetasEliminadas: carpetas.length,
    bytesLiberados: bytesArchivos + bytesCarpetas,
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
 * Mueve un archivo a otra carpeta (o a la raíz si carpetaId es null).
 */
export async function moveFile(archivoId, usuarioId, carpetaId = null) {
  const archivo = await fileRepository.findFileByIdAndUser(archivoId, usuarioId);
  if (!archivo) {
    throw new HttpError(404, 'Archivo no encontrado o no tienes permisos para moverlo.');
  }

  if (await isInTrash(archivo)) {
    throw new HttpError(400, 'No puedes mover un archivo que se encuentra en la papelera.');
  }

  let nombreDestino = 'Mi unidad';
  let targetFolderId = null;

  if (carpetaId !== null && carpetaId !== undefined && carpetaId !== '' && carpetaId !== 'root') {
    const carpeta = await folderRepository.findActiveFolderByIdAndUser(carpetaId, usuarioId);
    if (!carpeta) {
      throw new HttpError(404, 'La carpeta de destino no existe o no tienes acceso a ella.');
    }
    nombreDestino = carpeta.nombre;
    targetFolderId = carpeta.id;
  }

  if ((archivo.carpeta_id ?? null) === targetFolderId) {
    return {
      archivo,
      mensaje: `El archivo ya se encuentra en "${nombreDestino}".`,
    };
  }

  const archivoActualizado = await fileRepository.moveFile(archivoId, usuarioId, targetFolderId);
  return {
    archivo: archivoActualizado,
    mensaje: `Archivo movido exitosamente a "${nombreDestino}".`,
  };
}

/**
 * Obtiene todas las carpetas del usuario.
 */
export async function getAllFolders(usuarioId) {
  return folderRepository.findAllFoldersByUser(usuarioId);
}

/**
 * Lista el contenido de un directorio (carpetas y archivos contenidos).
 */
export async function getDirectoryContents(usuarioId, carpetaId = null) {
  let carpetaActual = null;

  if (carpetaId) {
    carpetaActual = await folderRepository.findActiveFolderByIdAndUser(carpetaId, usuarioId);
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
    const padre = await folderRepository.findActiveFolderByIdAndUser(carpetaPadreId, usuarioId);
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

  const carpeta = await folderRepository.findActiveFolderByIdAndUser(carpetaId, usuarioId);
  if (!carpeta) {
    throw new HttpError(404, 'Carpeta no encontrada.');
  }

  return folderRepository.renameFolder(carpetaId, usuarioId, nuevoNombre.trim());
}

/**
 * Envía una carpeta a la papelera. Sus subcarpetas y archivos no se tocan: quedan
 * ocultos y vuelven intactos al restaurarla. No libera cuota (igual que los archivos).
 */
export async function deleteFolder(carpetaId, usuarioId) {
  const carpeta = await folderRepository.findActiveFolderByIdAndUser(carpetaId, usuarioId);
  if (!carpeta) {
    throw new HttpError(404, 'Carpeta no encontrada.');
  }

  const enPapelera = await folderRepository.moveFolderToTrash(carpetaId, usuarioId);
  return { id: enPapelera.id, nombre: enPapelera.nombre, enPapelera: true };
}

/**
 * Restaura una carpeta de la papelera con todo su contenido. Si su carpeta
 * superior ya no está disponible, vuelve a la raíz.
 */
export async function restoreFolder(carpetaId, usuarioId) {
  const carpeta = await folderRepository.findFolderByIdAndUser(carpetaId, usuarioId);
  if (!carpeta || !carpeta.en_papelera) {
    throw new HttpError(404, 'La carpeta no se encuentra en la papelera.');
  }

  const padreOculto = Boolean(carpeta.carpeta_padre_id)
    && !(await folderRepository.findActiveFolderByIdAndUser(carpeta.carpeta_padre_id, usuarioId));

  return folderRepository.restoreFolderFromTrash(carpetaId, usuarioId, { moveToRoot: padreOculto });
}

/**
 * Elimina definitivamente una carpeta de la papelera, sus subcarpetas y sus archivos
 * (también del almacenamiento), liberando la cuota consumida.
 */
export async function permanentDeleteFolder(carpetaId, usuarioId) {
  const carpeta = await folderRepository.findFolderByIdAndUser(carpetaId, usuarioId);
  if (!carpeta || !carpeta.en_papelera) {
    throw new HttpError(404, 'La carpeta no se encuentra en la papelera.');
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

  return {
    id: carpeta.id,
    nombre: carpeta.nombre,
    archivosEliminados: archivosEnArbol.length,
    bytesLiberados: totalBytesLiberados,
  };
}

/**
 * Genera un enlace de invitación compartido para un archivo usando la vigencia dinámica
 * que otorga el Decorador de Suscripción del usuario (24h, 7d, 30d o 365d).
 */
export async function createShareInvitation(archivoId, usuarioId, { correoDestinatario } = {}) {
  const archivo = await fileRepository.findFileByIdAndUser(archivoId, usuarioId);
  if (!archivo || (await isInTrash(archivo))) {
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
  if (!archivo || (await isInTrash(archivo))) {
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
  if (!archivo || (await isInTrash(archivo))) {
    throw new HttpError(404, 'El archivo compartido ya no se encuentra disponible.');
  }

  return openStoredFile(archivo);
}
