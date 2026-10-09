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
