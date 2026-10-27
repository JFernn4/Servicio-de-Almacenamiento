import { query } from '../config/db.js';

// Columnas públicas del usuario + nombre del rol (nunca incluye el hash)
const PUBLIC_COLUMNS = `
  u.id, u.nombre, u.correo, u.fecha_registro, u.correo_verificado,
  u.nivel_acceso, u.espacio_consumido, u.espacio_disponible,
  r.nombre AS rol_nombre`;

const FROM_USER_WITH_ROLE = 'FROM usuario u JOIN rol r ON u.rol_id = r.id';

export async function findById(id) {
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS} ${FROM_USER_WITH_ROLE} WHERE u.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

/**
 * Busca por ID incluyendo el hash de contraseña (para validar vigencia de sesiones y tokens de uso único).
 */
export async function findByIdWithPassword(id) {
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS}, u.contrasena_hash ${FROM_USER_WITH_ROLE} WHERE u.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

/**
 * Busca por correo incluyendo el hash de contraseña (solo para autenticación).
 */
export async function findByEmailWithPassword(correo) {
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS}, u.contrasena_hash ${FROM_USER_WITH_ROLE} WHERE LOWER(u.correo) = $1`,
    [correo]
  );
  return rows[0] ?? null;
}

/**
 * Inserta un usuario con el rol indicado por nombre y devuelve su id.
 */
export async function create({ rolNombre, nombre, correo, contrasenaHash, nivelAcceso, espacioDisponible }) {
  const { rows } = await query(
    `INSERT INTO usuario (rol_id, nombre, correo, contrasena_hash, nivel_acceso, espacio_disponible)
     VALUES ((SELECT id FROM rol WHERE nombre = $1), $2, $3, $4, $5, $6)
     RETURNING id`,
    [rolNombre, nombre, correo, contrasenaHash, nivelAcceso, espacioDisponible]
  );
  return rows[0].id;
}

/**
 * Marca el correo como verificado. Devuelve { id, nombre, correo } o null si el usuario no existe.
 */
export async function markEmailVerified(id) {
  const { rows } = await query(
    'UPDATE usuario SET correo_verificado = TRUE WHERE id = $1 RETURNING id, nombre, correo',
    [id]
  );
  return rows[0] ?? null;
}

/**
 * Cambia la contraseña. Devuelve false si el usuario no existe.
 */
export async function updatePassword(id, contrasenaHash) {
  const { rowCount } = await query('UPDATE usuario SET contrasena_hash = $2 WHERE id = $1', [id, contrasenaHash]);
  return rowCount > 0;
}

/**
 * Consulta la cuota actual de almacenamiento del usuario.
 */
export async function getStorageQuota(id) {
  const { rows } = await query(
    'SELECT espacio_consumido, espacio_disponible FROM usuario WHERE id = $1',
    [id]
  );
  return rows[0] ?? null;
}

/**
 * Incrementa atómicamente el espacio consumido del usuario.
 */
export async function incrementConsumedSpace(id, bytes) {
  const { rows } = await query(
    `UPDATE usuario
     SET espacio_consumido = espacio_consumido + $1
     WHERE id = $2
     RETURNING espacio_consumido, espacio_disponible`,
    [bytes, id]
  );
  return rows[0] ?? null;
}

/**
 * Decrementa atómicamente el espacio consumido del usuario sin permitir valores negativos.
 */
export async function decrementConsumedSpace(id, bytes) {
  const { rows } = await query(
    `UPDATE usuario
     SET espacio_consumido = GREATEST(0, espacio_consumido - $1)
     WHERE id = $2
     RETURNING espacio_consumido, espacio_disponible`,
    [bytes, id]
  );
  return rows[0] ?? null;
}
