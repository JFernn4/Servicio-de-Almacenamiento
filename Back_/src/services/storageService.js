import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import * as fileRepository from '../repositories/fileRepository.js';
import * as folderRepository from '../repositories/folderRepository.js';
import * as userRepository from '../repositories/userRepository.js';
import { signPurposeToken, verifyPurposeToken } from './tokenService.js';
import { sendShareInvitationEmail } from './emailService.js';
import { config } from '../config/env.js';
import { FORBIDDEN_FILE_EXTENSIONS, TOKEN_PURPOSES, FILE_SHARE_EXPIRES_IN } from '../config/constants.js';
import { HttpError } from '../utils/httpError.js';

const uploadDir = config.storage.uploadDir;

/**
 * Obtiene la ruta física absoluta de un archivo en el servidor a partir de sus metadatos.
 */
export function getPhysicalFilePath(archivo) {
  const extension = path.extname(archivo.nombre || '').toLowerCase();
  return path.join(uploadDir, `${archivo.id}${extension}`);
}

/**
 * Procesa la carga de un archivo binario validando cuotas y persistiendo metadatos.
 */
export async function uploadFile({ usuarioId, carpetaId = null, file }) {
  if (!file) {
    throw new HttpError(400, 'Debes seleccionar un archivo para subir.');
  }

  // 1. Validar que la carpeta de destino exista y pertenezca al usuario (si no es la raíz)
  if (carpetaId) {
    const carpeta = await folderRepository.findFolderByIdAndUser(carpetaId, usuarioId);
    if (!carpeta) {
      await fs.unlink(file.path).catch(() => {});
      throw new HttpError(404, 'La carpeta especificada no existe o no tienes permisos para acceder a ella.');
    }
  }

  // 2. Validar cuota de almacenamiento disponible
  const quota = await userRepository.getStorageQuota(usuarioId);
  if (!quota) {
    await fs.unlink(file.path).catch(() => {});
    throw new HttpError(404, 'Usuario no encontrado.');
  }

  const espacioConsumido = Number(quota.espacio_consumido);
  const espacioDisponible = Number(quota.espacio_disponible);
  const nuevoConsumo = espacioConsumido + file.size;

  if (nuevoConsumo > espacioDisponible) {
    await fs.unlink(file.path).catch(() => {});
    throw new HttpError(
      400,
      `Espacio de almacenamiento insuficiente. Disponible: ${Math.max(0, espacioDisponible - espacioConsumido)} bytes, requerido: ${file.size} bytes.`
    );
  }

  let nuevoArchivo = null;
  let targetPath = null;

  try {
    // 3. Registrar metadatos en la base de datos
    nuevoArchivo = await fileRepository.createFile({
      usuarioId,
      carpetaId: carpetaId || null,
      nombre: file.originalname,
      tamano: file.size,
      tipo: file.mimetype || 'application/octet-stream',
    });

    // 4. Mover el archivo físico al nombre definitivo con su ID único
    targetPath = getPhysicalFilePath(nuevoArchivo);
    await fs.rename(file.path, targetPath);

    // 5. Incrementar el espacio consumido del usuario
    await userRepository.incrementConsumedSpace(usuarioId, file.size);

    return nuevoArchivo;
  } catch (error) {
    // Limpieza preventiva en disco y BD si ocurrió algún fallo intermedio
    await fs.unlink(file.path).catch(() => {});
    if (targetPath) {
      await fs.unlink(targetPath).catch(() => {});
    }
    if (nuevoArchivo?.id) {
      await fileRepository.deleteFile(nuevoArchivo.id, usuarioId).catch(() => {});
    }
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

  const physicalPath = getPhysicalFilePath(archivo);
  if (!fsSync.existsSync(physicalPath)) {
    throw new HttpError(404, 'El archivo físico no se encuentra en el servidor.');
  }

  return {
    physicalPath,
    nombre: archivo.nombre,
    tipo: archivo.tipo,
    tamano: archivo.tamano,
  };
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

  // 3. Eliminar el archivo físico en disco
  const physicalPath = getPhysicalFilePath(archivo);
  await fs.unlink(physicalPath).catch(() => {});

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

  await Promise.all(
    eliminados.map(async (arch) => {
      const physicalPath = getPhysicalFilePath(arch);
      await fs.unlink(physicalPath).catch(() => {});
    })
  );

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

  const oldPhysicalPath = getPhysicalFilePath(archivo);
  const newPhysicalPath = path.join(uploadDir, `${archivo.id}${extFinal}`);

  if (oldPhysicalPath !== newPhysicalPath && fsSync.existsSync(oldPhysicalPath)) {
    await fs.rename(oldPhysicalPath, newPhysicalPath);
  }

  const archivoActualizado = await fileRepository.renameFile(archivoId, usuarioId, nombreFinal);
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

  // 4. Eliminar del disco físico cada archivo que estaba en el árbol
  await Promise.all(
    archivosEnArbol.map(async (arch) => {
      const physicalPath = getPhysicalFilePath(arch);
      await fs.unlink(physicalPath).catch(() => {});
    })
  );

  return { id: carpeta.id, nombre: carpeta.nombre, bytesLiberados: totalBytesLiberados };
}

/**
 * Genera un enlace de invitación compartido para un archivo y, si se indica un destinatario,
 * valida que exista en el sistema y le envía el correo de invitación (Diagrama Invitación UML).
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

  const shareToken = signPurposeToken(
    { id: archivo.id, correo: destinatario?.correo || remitente.correo },
    TOKEN_PURPOSES.FILE_SHARE,
    FILE_SHARE_EXPIRES_IN
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
 * Obtiene la ruta física de un archivo compartido validando su token de invitación.
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

  const physicalPath = getPhysicalFilePath(archivo);
  if (!fsSync.existsSync(physicalPath)) {
    throw new HttpError(404, 'El archivo físico no se encuentra en el servidor.');
  }

  return {
    physicalPath,
    nombre: archivo.nombre,
    tipo: archivo.tipo,
    tamano: archivo.tamano,
  };
}
