import { query } from '../config/db.js';

/**
 * Inserta los metadatos de un nuevo archivo en la base de datos.
 */
export async function createFile({ usuarioId, carpetaId = null, nombre, tamano, tipo }) {
  const { rows } = await query(
    `INSERT INTO archivo (usuario_id, carpeta_id, nombre, tamano, tipo, fecha_subida)
     VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
     RETURNING id, usuario_id, carpeta_id, nombre, tamano, tipo, fecha_subida`,
    [usuarioId, carpetaId, nombre, tamano, tipo]
  );
  return rows[0];
}

/**
 * Busca un archivo por su identificador.
 */
export async function findFileById(id) {
  const { rows } = await query(
    'SELECT id, usuario_id, carpeta_id, nombre, tamano, tipo, fecha_subida FROM archivo WHERE id = $1',
    [id]
  );
  return rows[0] ?? null;
}

/**
 * Busca un archivo por su ID verificando pertenencia al usuario.
 */
export async function findFileByIdAndUser(id, usuarioId) {
  const { rows } = await query(
    `SELECT id, usuario_id, carpeta_id, nombre, tamano, tipo, fecha_subida
     FROM archivo
     WHERE id = $1 AND usuario_id = $2`,
    [id, usuarioId]
  );
  return rows[0] ?? null;
}

/**
 * Lista todos los archivos de un usuario en un directorio específico (raíz o subcarpeta).
 */
export async function findFilesByUser(usuarioId, carpetaId = null) {
  const { rows } = await query(
    `SELECT id, usuario_id, carpeta_id, nombre, tamano, tipo, fecha_subida
     FROM archivo
     WHERE usuario_id = $1 AND carpeta_id IS NOT DISTINCT FROM $2
     ORDER BY fecha_subida DESC, id DESC`,
    [usuarioId, carpetaId]
  );
  return rows;
}

/**
 * Lista los archivos más recientes de un usuario para la vista de "Recientes".
 */
export async function findRecentFilesByUser(usuarioId, limit = 10) {
  const { rows } = await query(
    `SELECT id, usuario_id, carpeta_id, nombre, tamano, tipo, fecha_subida
     FROM archivo
     WHERE usuario_id = $1
     ORDER BY fecha_subida DESC, id DESC
     LIMIT $2`,
    [usuarioId, limit]
  );
  return rows;
}

/**
 * Busca archivos por coincidencia en el nombre para la barra de búsqueda.
 */
export async function searchFilesByUser(usuarioId, term) {
  const { rows } = await query(
    `SELECT id, usuario_id, carpeta_id, nombre, tamano, tipo, fecha_subida
     FROM archivo
     WHERE usuario_id = $1 AND nombre ILIKE $2
     ORDER BY fecha_subida DESC, id DESC`,
    [usuarioId, `%${term}%`]
  );
  return rows;
}

/**
 * Renombra un archivo.
 */
export async function renameFile(id, usuarioId, nuevoNombre) {
  const { rows } = await query(
    `UPDATE archivo
     SET nombre = $1
     WHERE id = $2 AND usuario_id = $3
     RETURNING id, usuario_id, carpeta_id, nombre, tamano, tipo, fecha_subida`,
    [nuevoNombre, id, usuarioId]
  );
  return rows[0] ?? null;
}

/**
 * Elimina el registro de un archivo de la base de datos y devuelve sus metadatos.
 */
export async function deleteFile(id, usuarioId) {
  const { rows } = await query(
    `DELETE FROM archivo
     WHERE id = $1 AND usuario_id = $2
     RETURNING id, usuario_id, carpeta_id, nombre, tamano, tipo, fecha_subida`,
    [id, usuarioId]
  );
  return rows[0] ?? null;
}
