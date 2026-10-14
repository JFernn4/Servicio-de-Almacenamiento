import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import * as fileRepository from '../repositories/fileRepository.js';
import * as folderRepository from '../repositories/folderRepository.js';
import * as userRepository from '../repositories/userRepository.js';
import { config } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

const uploadDir = config.storage.uploadDir;

/**
 * Obtiene la ruta física absoluta de un archivo en el servidor a partir de sus metadatos.
 */
export function getPhysicalFilePath(archivo) {
  const extension = path.extname(archivo.nombre || '');
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

  try {
    // 3. Registrar metadatos en la base de datos
    const nuevoArchivo = await fileRepository.createFile({
      usuarioId,
      carpetaId: carpetaId || null,
      nombre: file.originalname,
      tamano: file.size,
      tipo: file.mimetype || 'application/octet-stream',
    });

    // 4. Mover el archivo físico al nombre definitivo con su ID único
    const targetPath = getPhysicalFilePath(nuevoArchivo);
    await fs.rename(file.path, targetPath);

    // 5. Incrementar el espacio consumido del usuario
    await userRepository.incrementConsumedSpace(usuarioId, file.size);

    return nuevoArchivo;
  } catch (error) {
    // Limpieza física preventiva si ocurrió algún fallo
    await fs.unlink(file.path).catch(() => {});
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
 * Elimina un archivo liberando el espacio consumido en la cuenta.
 */
export async function deleteFile(archivoId, usuarioId) {
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

  return { id: archivo.id, nombre: archivo.nombre, tamanoLiberado: archivo.tamano };
}

/**
 * Renombra un archivo existente.
 */
export async function renameFile(archivoId, usuarioId, nuevoNombre) {
  if (!nuevoNombre || !nuevoNombre.trim()) {
    throw new HttpError(400, 'El nuevo nombre no puede estar vacío.');
  }

  const archivo = await fileRepository.findFileByIdAndUser(archivoId, usuarioId);
  if (!archivo) {
    throw new HttpError(404, 'Archivo no encontrado o no tienes permisos para renombrarlo.');
  }

  const archivoActualizado = await fileRepository.renameFile(archivoId, usuarioId, nuevoNombre.trim());
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

  // 2. Eliminar la carpeta en la BD (las claves foráneas en cascada eliminan subcarpetas y registros de archivo)
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
