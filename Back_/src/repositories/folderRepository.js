import { query } from '../config/db.js';

const FOLDER_COLUMNS = 'id, usuario_id, carpeta_padre_id, nombre, fecha_creacion, en_papelera, fecha_eliminacion';

/**
 * CTE "ocultas": carpetas del usuario ($1) que están en la papelera y todas sus
 * descendientes. Su contenido no se borra, pero no debe verse ni usarse.
 */
export const HIDDEN_FOLDERS_CTE = `
  ocultas AS (
    SELECT id FROM carpeta WHERE usuario_id = $1 AND en_papelera = TRUE
    UNION
    SELECT c.id FROM carpeta c INNER JOIN ocultas o ON c.carpeta_padre_id = o.id
  )`;

/**
 * Inserta una nueva carpeta en la base de datos.
 */
export async function createFolder({ usuarioId, carpetaPadreId = null, nombre }) {
  const { rows } = await query(
    `INSERT INTO carpeta (usuario_id, carpeta_padre_id, nombre, fecha_creacion)
     VALUES ($1, $2, $3, CURRENT_DATE)
     RETURNING ${FOLDER_COLUMNS}`,
    [usuarioId, carpetaPadreId, nombre]
  );
  return rows[0];
}

/**
 * Busca una carpeta por su identificador.
 */
export async function findFolderById(id) {
  const { rows } = await query(`SELECT ${FOLDER_COLUMNS} FROM carpeta WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

/**
 * Busca una carpeta por ID verificando pertenencia al usuario (esté o no en la papelera).
 */
export async function findFolderByIdAndUser(id, usuarioId) {
  const { rows } = await query(
    `SELECT ${FOLDER_COLUMNS}
     FROM carpeta
     WHERE id = $1 AND usuario_id = $2`,
    [id, usuarioId]
  );
  return rows[0] ?? null;
}

/**
 * Busca una carpeta del usuario que esté visible: ni ella ni ninguna carpeta
 * superior están en la papelera. Devuelve null si no existe o está oculta.
 */
export async function findActiveFolderByIdAndUser(id, usuarioId) {
  const { rows } = await query(
    `WITH RECURSIVE ancestros AS (
       SELECT id, carpeta_padre_id, en_papelera FROM carpeta WHERE id = $1 AND usuario_id = $2
       UNION ALL
       SELECT c.id, c.carpeta_padre_id, c.en_papelera
       FROM carpeta c INNER JOIN ancestros a ON c.id = a.carpeta_padre_id
     )
     SELECT ${FOLDER_COLUMNS.split(', ').map((col) => `c.${col}`).join(', ')}
     FROM carpeta c
     WHERE c.id = $1 AND c.usuario_id = $2
       AND NOT EXISTS (SELECT 1 FROM ancestros WHERE en_papelera = TRUE)`,
    [id, usuarioId]
  );
  return rows[0] ?? null;
}

/**
 * Lista las carpetas visibles de un nivel (raíz o subcarpeta) con el conteo de elementos visibles.
 */
export async function findFoldersByUser(usuarioId, carpetaPadreId = null) {
  const { rows } = await query(
    `SELECT
       c.id,
       c.usuario_id,
       c.carpeta_padre_id,
       c.nombre,
       c.fecha_creacion,
       (
         (SELECT COUNT(*) FROM carpeta sub WHERE sub.carpeta_padre_id = c.id AND sub.en_papelera = FALSE) +
         (SELECT COUNT(*) FROM archivo a WHERE a.carpeta_id = c.id AND a.en_papelera = FALSE)
       )::int AS total_elementos
     FROM carpeta c
     WHERE c.usuario_id = $1
       AND c.carpeta_padre_id IS NOT DISTINCT FROM $2
       AND c.en_papelera = FALSE
     ORDER BY c.nombre ASC`,
    [usuarioId, carpetaPadreId]
  );
  return rows;
}

/**
 * Obtiene todas las carpetas del usuario.
 */
export async function findAllFoldersByUser(usuarioId) {
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
     WHERE c.usuario_id = $1
     ORDER BY c.nombre ASC`,
    [usuarioId]
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
     RETURNING ${FOLDER_COLUMNS}`,
    [nuevoNombre, id, usuarioId]
  );
  return rows[0] ?? null;
}

/**
 * Envía una carpeta a la papelera (borrado lógico). Su contenido no se modifica.
 */
export async function moveFolderToTrash(id, usuarioId) {
  const { rows } = await query(
    `UPDATE carpeta
     SET en_papelera = TRUE, fecha_eliminacion = CURRENT_DATE
     WHERE id = $1 AND usuario_id = $2 AND en_papelera = FALSE
     RETURNING ${FOLDER_COLUMNS}`,
    [id, usuarioId]
  );
  return rows[0] ?? null;
}

/**
 * Saca una carpeta de la papelera. Con `moveToRoot` la deja en la raíz
 * (cuando su carpeta superior ya no existe o sigue en la papelera).
 */
export async function restoreFolderFromTrash(id, usuarioId, { moveToRoot = false } = {}) {
  const { rows } = await query(
    `UPDATE carpeta
     SET en_papelera = FALSE,
         fecha_eliminacion = NULL,
         carpeta_padre_id = CASE WHEN $3 THEN NULL ELSE carpeta_padre_id END
     WHERE id = $1 AND usuario_id = $2 AND en_papelera = TRUE
     RETURNING ${FOLDER_COLUMNS}`,
    [id, usuarioId, moveToRoot]
  );
  return rows[0] ?? null;
}

/**
 * Carpetas que el usuario envió a la papelera, con lo que contienen (todo su árbol).
 * Las que están dentro de otra carpeta también en papelera no se listan aparte:
 * se restauran o eliminan junto con la superior.
 */
export async function findTrashFoldersByUser(usuarioId) {
  const { rows } = await query(
    `WITH RECURSIVE arbol AS (
       SELECT c.id AS raiz_id, c.id
       FROM carpeta c
       WHERE c.usuario_id = $1 AND c.en_papelera = TRUE
       UNION ALL
       SELECT a.raiz_id, c.id
       FROM carpeta c INNER JOIN arbol a ON c.carpeta_padre_id = a.id
     )
     SELECT
       c.id, c.nombre, c.carpeta_padre_id, c.fecha_creacion, c.fecha_eliminacion,
       (SELECT COUNT(*) FROM arbol t WHERE t.raiz_id = c.id AND t.id <> c.id)::int AS total_subcarpetas,
       (SELECT COUNT(*) FROM archivo f INNER JOIN arbol t ON f.carpeta_id = t.id WHERE t.raiz_id = c.id)::int AS total_archivos,
       (SELECT COALESCE(SUM(f.tamano), 0) FROM archivo f INNER JOIN arbol t ON f.carpeta_id = t.id WHERE t.raiz_id = c.id)::bigint AS tamano_total
     FROM carpeta c
     WHERE c.usuario_id = $1 AND c.en_papelera = TRUE
       AND NOT EXISTS (
         SELECT 1 FROM arbol t
         WHERE t.id = c.id AND t.raiz_id <> c.id
       )
     ORDER BY c.fecha_eliminacion DESC, c.nombre ASC`,
    [usuarioId]
  );
  return rows;
}

/**
 * Elimina una carpeta y sus subcarpetas/archivos en cascada.
 */
export async function deleteFolder(id, usuarioId) {
  const { rows } = await query(
    `DELETE FROM carpeta
     WHERE id = $1 AND usuario_id = $2
     RETURNING ${FOLDER_COLUMNS}`,
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
