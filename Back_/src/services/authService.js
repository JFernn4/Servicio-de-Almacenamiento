import bcrypt from 'bcryptjs';
import * as userRepository from '../repositories/userRepository.js';
import { signToken } from './tokenService.js';
import { sendWelcomeEmail } from './emailService.js';
import { HttpError } from '../utils/httpError.js';
import {
  DEFAULT_ROLE,
  DEFAULT_ACCESS_LEVEL,
  DEFAULT_STORAGE_QUOTA_BYTES,
} from '../config/constants.js';

const BCRYPT_SALT_ROUNDS = 10;
const PG_UNIQUE_VIOLATION = '23505';

/**
 * Convierte una fila de BD en el usuario que se expone en la API.
 */
function toPublicUser(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    correo: row.correo,
    rol: row.rol_nombre,
    nivelAcceso: row.nivel_acceso,
    espacioConsumido: Number(row.espacio_consumido),
    espacioDisponible: Number(row.espacio_disponible),
    fechaRegistro: row.fecha_registro,
  };
}

function buildSession(row) {
  const user = toPublicUser(row);
  return { token: signToken(user), user };
}

export async function register({ nombre, correo, contrasena }) {
  const contrasenaHash = await bcrypt.hash(contrasena, BCRYPT_SALT_ROUNDS);

  let userId;
  try {
    userId = await userRepository.create({
      rolNombre: DEFAULT_ROLE,
      nombre,
      correo,
      contrasenaHash,
      nivelAcceso: DEFAULT_ACCESS_LEVEL,
      espacioDisponible: DEFAULT_STORAGE_QUOTA_BYTES,
    });
  } catch (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      throw new HttpError(409, 'Este correo electrónico ya se encuentra registrado.');
    }
    throw error;
  }

  const row = await userRepository.findById(userId);

  // En segundo plano: un fallo de correo no debe impedir el registro
  sendWelcomeEmail(row.correo, row.nombre).catch((err) => {
    console.error('[EmailService] Error al enviar correo de bienvenida:', err.message);
  });

  return buildSession(row);
}

export async function login({ correo, contrasena }) {
  const row = await userRepository.findByEmailWithPassword(correo);
  const isValid = row && (await bcrypt.compare(contrasena, row.contrasena_hash));

  if (!isValid) {
    throw new HttpError(401, 'Credenciales inválidas. Verifica tu correo y contraseña.');
  }

  return buildSession(row);
}

export async function getProfile(userId) {
  const row = await userRepository.findById(userId);
  if (!row) {
    throw new HttpError(404, 'Usuario no encontrado.');
  }
  return toPublicUser(row);
}
