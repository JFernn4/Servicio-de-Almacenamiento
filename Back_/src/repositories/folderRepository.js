import { query } from '../config/db.js';

/**
 * Inserta una nueva carpeta en la base de datos.
 */
export async function createFolder({ usuarioId, carpetaPadreId = null, nombre }) {
  const { rows } = await query(
    `INSERT INTO carpeta (usuario_id, carpeta_padre_id, nombre, fecha_creacion)
     VALUES ($1, $2, $3, CURRENT_DATE)
     RETURNING id, usuario_id, carpeta_padre_id, nombre, fecha_creacion`,
    [usuarioId, carpetaPadreId, nombre]
  );
  return rows[0];
}

/**
 * Busca una carpeta por su identificador.
 */
export async function findFolderById(id) {
  const { rows } = await query(
    'SELECT id, usuario_id, carpeta_padre_id, nombre, fecha_creacion FROM carpeta WHERE id = $1',
    [id]
  );
  return rows[0] ?? null;
}

/**
 * Busca una carpeta por ID verificando pertenencia al usuario.
 */
export async function findFolderByIdAndUser(id, usuarioId) {
  const { rows } = await query(
    `SELECT id, usuario_id, carpeta_padre_id, nombre, fecha_creacion
     FROM carpeta
     WHERE id = $1 AND usuario_id = $2`,
    [id, usuarioId]
  );
  return rows[0] ?? null;
}

/**
 * Lista las carpetas contenidas en un nivel dado (raíz o subcarpeta) junto con el conteo de elementos contenidos.
 */
export async function findFoldersByUser(usuarioId, carpetaPadreId = null) {
  await query('ALTER TABLE archivo ADD COLUMN IF NOT EXISTS en_papelera BOOLEAN NOT NULL DEFAULT FALSE');
  const { rows } = await query(
    `SELECT
       c.id,
       c.usuario_id,
       c.carpeta_padre_id,
       c.nombre,
       c.fecha_creacion,
       (
         (SELECT COUNT(*) FROM carpeta sub WHERE sub.carpeta_padre_id = c.id) +
         (SELECT COUNT(*) FROM archivo a WHERE a.carpeta_id = c.id AND a.en_papelera = FALSE)
       )::int AS total_elementos
     FROM carpeta c
     WHERE c.usuario_id = $1 AND c.carpeta_padre_id IS NOT DISTINCT FROM $2
     ORDER BY c.nombre ASC`,
    [usuarioId, carpetaPadreId]
  );
  return rows;
}

/**
 * Renombra una carpeta.
 */
export async function renameFolder(id, usuarioId, nuevoNombre) {
  const { rows } = await query(
    `UPDATE carpeta
     SET nombre = $1
     WHERE id = $2 AND usuario_id = $3
     RETURNING id, usuario_id, carpeta_padre_id, nombre, fecha_creacion`,
    [nuevoNombre, id, usuarioId]
  );
  return rows[0] ?? null;
}

/**
 * Elimina una carpeta y sus subcarpetas/archivos en cascada.
 */
export async function deleteFolder(id, usuarioId) {
  const { rows } = await query(
    `DELETE FROM carpeta
     WHERE id = $1 AND usuario_id = $2
     RETURNING id, usuario_id, carpeta_padre_id, nombre, fecha_creacion`,
    [id, usuarioId]
  );
  return rows[0] ?? null;
}

/**
 * Obtiene todos los archivos dentro de una carpeta y recursivamente en sus subcarpetas
 * (útil para calcular el espacio que se libera al borrar una carpeta con contenido).
 */
export async function findAllFilesInFolderRecursive(carpetaId, usuarioId) {
  const { rows } = await query(
    `WITH RECURSIVE jerarquia AS (
       SELECT id FROM carpeta WHERE id = $1 AND usuario_id = $2
       UNION ALL
       SELECT c.id FROM carpeta c
       INNER JOIN jerarquia j ON c.carpeta_padre_id = j.id
     )
     SELECT a.id, a.nombre, a.tamano
     FROM archivo a
     INNER JOIN jerarquia j ON a.carpeta_id = j.id
     WHERE a.usuario_id = $2`,
    [carpetaId, usuarioId]
  );
  return rows;
}

/**
 * Elimina todos los registros de archivos contenidos en una carpeta y sus subcarpetas.
 */
export async function deleteFilesInFolderRecursive(carpetaId, usuarioId) {
  await query(
    `WITH RECURSIVE jerarquia AS (
       SELECT id FROM carpeta WHERE id = $1 AND usuario_id = $2
       UNION ALL
       SELECT c.id FROM carpeta c
       INNER JOIN jerarquia j ON c.carpeta_padre_id = j.id
     )
     DELETE FROM archivo a
     USING jerarquia j
     WHERE a.carpeta_id = j.id AND a.usuario_id = $2`,
    [carpetaId, usuarioId]
  );
}

