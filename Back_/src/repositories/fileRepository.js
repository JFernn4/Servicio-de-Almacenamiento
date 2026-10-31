import { query } from '../config/db.js';

const FILE_COLUMNS = 'id, usuario_id, carpeta_id, nombre, tamano, tipo, fecha_subida, en_papelera, fecha_eliminacion';

/**
 * Inserta los metadatos de un nuevo archivo en la base de datos.
 */
export async function createFile({ usuarioId, carpetaId = null, nombre, tamano, tipo }) {
  const { rows } = await query(
    `INSERT INTO archivo (usuario_id, carpeta_id, nombre, tamano, tipo, fecha_subida, en_papelera)
     VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, FALSE)
     RETURNING ${FILE_COLUMNS}`,
    [usuarioId, carpetaId, nombre, tamano, tipo]
  );
  return rows[0];
}

/**
 * Busca un archivo por su identificador.
 */
export async function findFileById(id) {
  const { rows } = await query(
    `SELECT ${FILE_COLUMNS} FROM archivo WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

/**
 * Busca un archivo por su ID verificando pertenencia al usuario.
 */
export async function findFileByIdAndUser(id, usuarioId) {
  const { rows } = await query(
    `SELECT ${FILE_COLUMNS}
     FROM archivo
     WHERE id = $1 AND usuario_id = $2`,
    [id, usuarioId]
  );
  return rows[0] ?? null;
}

/**
 * Lista todos los archivos activos (no en papelera) de un usuario en un directorio específico.
 */
export async function findFilesByUser(usuarioId, carpetaId = null) {
  const { rows } = await query(
    `SELECT ${FILE_COLUMNS}
     FROM archivo
     WHERE usuario_id = $1
       AND carpeta_id IS NOT DISTINCT FROM $2
       AND en_papelera = FALSE
     ORDER BY fecha_subida DESC, id DESC`,
    [usuarioId, carpetaId]
  );
  return rows;
}

/**
 * Lista los archivos activos más recientes de un usuario para la vista de "Recientes".
 */
export async function findRecentFilesByUser(usuarioId, limit = 10) {
  const { rows } = await query(
    `SELECT ${FILE_COLUMNS}
     FROM archivo
     WHERE usuario_id = $1 AND en_papelera = FALSE
     ORDER BY fecha_subida DESC, id DESC
     LIMIT $2`,
    [usuarioId, limit]
  );
  return rows;
}

/**
 * Busca archivos activos por coincidencia en el nombre para la barra de búsqueda.
 */
export async function searchFilesByUser(usuarioId, term) {
  const { rows } = await query(
    `SELECT ${FILE_COLUMNS}
     FROM archivo
     WHERE usuario_id = $1 AND en_papelera = FALSE AND nombre ILIKE $2
     ORDER BY fecha_subida DESC, id DESC`,
    [usuarioId, `%${term}%`]
  );
  return rows;
}

/**
 * Lista todos los archivos que se encuentran en la papelera del usuario.
 */
export async function findTrashFilesByUser(usuarioId) {
  const { rows } = await query(
    `SELECT ${FILE_COLUMNS}
     FROM archivo
     WHERE usuario_id = $1 AND en_papelera = TRUE
     ORDER BY fecha_eliminacion DESC NULLS LAST, id DESC`,
    [usuarioId]
  );
  return rows;
}

/**
 * Mueve un archivo a la papelera (borrado lógico).
 */
export async function moveFileToTrash(id, usuarioId) {
  const { rows } = await query(
    `UPDATE archivo
     SET en_papelera = TRUE, fecha_eliminacion = CURRENT_DATE
     WHERE id = $1 AND usuario_id = $2
     RETURNING ${FILE_COLUMNS}`,
    [id, usuarioId]
  );
  return rows[0] ?? null;
}

/**
 * Restaura un archivo desde la papelera.
 */
export async function restoreFileFromTrash(id, usuarioId) {
  const { rows } = await query(
    `UPDATE archivo
     SET en_papelera = FALSE, fecha_eliminacion = NULL
     WHERE id = $1 AND usuario_id = $2
     RETURNING ${FILE_COLUMNS}`,
    [id, usuarioId]
  );
  return rows[0] ?? null;
}

/**
 * Renombra un archivo.
 */
export async function renameFile(id, usuarioId, nuevoNombre) {
  const { rows } = await query(
    `UPDATE archivo
     SET nombre = $1
     WHERE id = $2 AND usuario_id = $3
     RETURNING ${FILE_COLUMNS}`,
    [nuevoNombre, id, usuarioId]
  );
  return rows[0] ?? null;
}

/**
 * Elimina permanentemente el registro de un archivo de la base de datos.
 */
export async function deleteFile(id, usuarioId) {
  const { rows } = await query(
    `DELETE FROM archivo
     WHERE id = $1 AND usuario_id = $2
     RETURNING ${FILE_COLUMNS}`,
    [id, usuarioId]
  );
  return rows[0] ?? null;
}

/**
 * Elimina permanentemente todos los archivos en la papelera de un usuario y los devuelve.
 */
export async function deleteAllTrashFilesByUser(usuarioId) {
  const { rows } = await query(
    `DELETE FROM archivo
     WHERE usuario_id = $1 AND en_papelera = TRUE
     RETURNING ${FILE_COLUMNS}`,
    [usuarioId]
  );
  return rows;
}
