import * as storageService from '../services/storageService.js';
import { validateId, validateCreateFolder, validateRename } from '../validators/storageValidator.js';

/**
 * Procesa la subida de uno o múltiples archivos al espacio del usuario,
 * aplicando las políticas dinámicas de Multer según su Decorador de Suscripción.
 */
export async function uploadFile(req, res) {
  const usuarioId = req.user.id;
  const carpetaId = req.body.carpetaId ? validateId(req.body.carpetaId, 'carpeta') : null;

  const resultado = await storageService.uploadFile({
    usuarioId,
    carpetaId,
    file: req.file,
    files: req.files,
    planDecorado: req.planDecorado,
  });

  const count = resultado.archivos.length;
  res.status(201).json({
    message:
      count > 1
        ? `${count} archivos subidos exitosamente bajo el ${resultado.planAplicado.clase}.`
        : `Archivo subido exitosamente bajo el ${resultado.planAplicado.clase}.`,
    archivo: resultado.archivo,
    archivos: resultado.archivos,
    planAplicado: resultado.planAplicado,
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
 * Mueve un archivo a la papelera o lo elimina permanentemente si se indica ?permanent=true.
 */
export async function deleteFile(req, res) {
  const archivoId = validateId(req.params.id, 'archivo');
  const permanent = req.query.permanent === 'true';
  const resultado = await storageService.deleteFile(archivoId, req.user.id, { permanent });

  res.status(200).json({
    message: resultado.enPapelera
      ? 'Archivo movido a la papelera.'
      : 'Archivo eliminado permanentemente.',
    ...resultado,
  });
}

/**
 * Lista los archivos en la papelera del usuario.
 */
export async function getTrashFiles(req, res) {
  const archivos = await storageService.getTrashFiles(req.user.id);
  res.status(200).json({ archivos });
}

/**
 * Restaura un archivo desde la papelera.
 */
export async function restoreFile(req, res) {
  const archivoId = validateId(req.params.id, 'archivo');
  const archivo = await storageService.restoreFile(archivoId, req.user.id);

  res.status(200).json({
    message: 'Archivo restaurado exitosamente.',
    archivo,
  });
}

/**
 * Elimina permanentemente un archivo de la papelera y libera su espacio.
 */
export async function permanentDeleteFile(req, res) {
  const archivoId = validateId(req.params.id, 'archivo');
  const resultado = await storageService.permanentDeleteFile(archivoId, req.user.id);

  res.status(200).json({
    message: 'Archivo eliminado permanentemente.',
    ...resultado,
  });
}

/**
 * Vacía todos los archivos de la papelera del usuario.
 */
export async function emptyTrash(req, res) {
  const resultado = await storageService.emptyTrash(req.user.id);

  res.status(200).json({
    message: 'Papelera vaciada exitosamente.',
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

/**
 * Envía el archivo en modo inline para su visualización en el navegador ("Visualizar archivos").
 */
export async function viewFile(req, res) {
  const archivoId = validateId(req.params.id, 'archivo');
  const { physicalPath, nombre, tipo } = await storageService.getFileForDownload(archivoId, req.user.id);

  res.setHeader('Content-Type', tipo || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(nombre)}"`);
  res.sendFile(physicalPath);
}

/**
 * Genera un enlace de invitación compartido y opcionalmente lo envía por correo a otro usuario.
 */
export async function shareFile(req, res) {
  const archivoId = validateId(req.params.id, 'archivo');
  const correoDestinatario = req.body?.correoDestinatario || req.body?.correo || '';

  const resultado = await storageService.createShareInvitation(archivoId, req.user.id, {
    correoDestinatario,
  });

  res.status(200).json({
    message: resultado.destinatario
      ? `Invitación enviada exitosamente a ${resultado.destinatario.correo} (vigencia: ${resultado.vigenciaEnlace}).`
      : `Enlace de invitación generado exitosamente (vigencia: ${resultado.vigenciaEnlace}).`,
    ...resultado,
  });
}

/**
 * Obtiene los metadatos públicos de un archivo compartido mediante su token de invitación.
 */
export async function getSharedFileInfo(req, res) {
  const archivo = await storageService.getSharedFileInfo(req.params.token);
  res.status(200).json({ archivo });
}

/**
 * Descarga o visualiza (?inline=true) un archivo público/compartido mediante su token de invitación.
 */
export async function downloadSharedFile(req, res) {
  const { physicalPath, nombre, tipo } = await storageService.getSharedFileForDownload(req.params.token);

  if (req.query.inline === 'true') {
    res.setHeader('Content-Type', tipo || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(nombre)}"`);
    return res.sendFile(physicalPath);
  }

  return res.download(physicalPath, nombre);
}
