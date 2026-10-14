import * as storageService from '../services/storageService.js';
import { validateId, validateCreateFolder, validateRename } from '../validators/storageValidator.js';

/**
 * Procesa la subida de un archivo al espacio del usuario.
 */
export async function uploadFile(req, res) {
  const usuarioId = req.user.id;
  const carpetaId = req.body.carpetaId ? validateId(req.body.carpetaId, 'carpeta') : null;

  const archivo = await storageService.uploadFile({
    usuarioId,
    carpetaId,
    file: req.file,
  });

  res.status(201).json({
    message: 'Archivo subido exitosamente.',
    archivo,
  });
}

/**
 * Despacha la descarga de un archivo binario mediante streaming seguro.
 */
export async function downloadFile(req, res) {
  const archivoId = validateId(req.params.id, 'archivo');
  const { physicalPath, nombre } = await storageService.getFileForDownload(archivoId, req.user.id);

  res.download(physicalPath, nombre);
}

/**
 * Elimina un archivo y libera la cuota de almacenamiento correspondiente.
 */
export async function deleteFile(req, res) {
  const archivoId = validateId(req.params.id, 'archivo');
  const resultado = await storageService.deleteFile(archivoId, req.user.id);

  res.status(200).json({
    message: 'Archivo eliminado exitosamente.',
    ...resultado,
  });
}

/**
 * Renombra un archivo.
 */
export async function renameFile(req, res) {
  const archivoId = validateId(req.params.id, 'archivo');
  const { nuevoNombre } = validateRename(req.body);

  const archivo = await storageService.renameFile(archivoId, req.user.id, nuevoNombre);

  res.status(200).json({
    message: 'Archivo renombrado exitosamente.',
    archivo,
  });
}

/**
 * Lista las carpetas y archivos contenidos en el nivel solicitado (raíz o subcarpeta).
 */
export async function getDirectoryContents(req, res) {
  const carpetaId = req.query.carpetaId ? validateId(req.query.carpetaId, 'carpeta') : null;
  const contents = await storageService.getDirectoryContents(req.user.id, carpetaId);

  res.status(200).json(contents);
}

/**
 * Lista los archivos más recientes del usuario para la vista de "Recientes".
 */
export async function getRecentFiles(req, res) {
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const archivos = await storageService.getRecentFiles(req.user.id, limit);

  res.status(200).json({ archivos });
}

/**
 * Realiza una búsqueda de archivos por coincidencia en su nombre.
 */
export async function searchFiles(req, res) {
  const term = typeof req.query.q === 'string' ? req.query.q : '';
  const archivos = await storageService.searchFiles(req.user.id, term);

  res.status(200).json({ archivos });
}

/**
 * Crea una nueva carpeta en la raíz o dentro de otra carpeta.
 */
export async function createFolder(req, res) {
  const { nombre, carpetaPadreId } = validateCreateFolder(req.body);
  const carpeta = await storageService.createFolder({
    usuarioId: req.user.id,
    carpetaPadreId,
    nombre,
  });

  res.status(201).json({
    message: 'Carpeta creada exitosamente.',
    carpeta,
  });
}

/**
 * Renombra una carpeta existente.
 */
export async function renameFolder(req, res) {
  const carpetaId = validateId(req.params.id, 'carpeta');
  const { nuevoNombre } = validateRename(req.body);

  const carpeta = await storageService.renameFolder(carpetaId, req.user.id, nuevoNombre);

  res.status(200).json({
    message: 'Carpeta renombrada exitosamente.',
    carpeta,
  });
}

/**
 * Elimina una carpeta y todos sus contenidos liberando el espacio consumido.
 */
export async function deleteFolder(req, res) {
  const carpetaId = validateId(req.params.id, 'carpeta');
  const resultado = await storageService.deleteFolder(carpetaId, req.user.id);

  res.status(200).json({
    message: 'Carpeta y sus contenidos eliminados exitosamente.',
    ...resultado,
  });
}
