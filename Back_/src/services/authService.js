import * as userRepository from '../repositories/userRepository.js';
import { signToken, signPurposeToken } from './tokenService.js';
import { hashPassword, verifyPassword } from './passwordService.js';
import { sendVerificationEmail } from './emailService.js';
import { HttpError } from '../utils/httpError.js';
import {
  DEFAULT_ROLE,
  DEFAULT_ACCESS_LEVEL,
  ADMIN_ROLE,
  ADMIN_ACCESS_LEVEL,
  DEFAULT_STORAGE_QUOTA_BYTES,
  TOKEN_PURPOSES,
  EMAIL_VERIFICATION_EXPIRES_IN,
} from '../config/constants.js';

const PG_UNIQUE_VIOLATION = '23505';

/**
 * Convierte una fila de BD en el usuario que se expone en la API.
 */
export function toPublicUser(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    correo: row.correo,
    rol: row.rol_nombre,
    correoVerificado: Boolean(row.correo_verificado),
    nivelAcceso: row.nivel_acceso,
    espacioConsumido: Number(row.espacio_consumido),
    espacioDisponible: Number(row.espacio_disponible),
    fechaRegistro: row.fecha_registro,
  };
}

function buildSession(row) {
  const user = toPublicUser(row);
  return { token: signToken(user, row.contrasena_hash), user };
}

export async function register({ nombre, correo, contrasena, tipoCuenta }) {
  const contrasenaHash = await hashPassword(contrasena);
  const esAdmin = tipoCuenta === 'administrador';

  let userId;
  try {
    userId = await userRepository.create({
      rolNombre: esAdmin ? ADMIN_ROLE : DEFAULT_ROLE,
      nombre,
      correo,
      contrasenaHash,
      nivelAcceso: esAdmin ? ADMIN_ACCESS_LEVEL : DEFAULT_ACCESS_LEVEL,
      espacioDisponible: DEFAULT_STORAGE_QUOTA_BYTES,
    });
  } catch (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      throw new HttpError(409, 'Este correo electrónico ya se encuentra registrado.');
    }
    throw error;
  }

  const row = await userRepository.findByIdWithPassword(userId);

  const verificationToken = signPurposeToken(row, TOKEN_PURPOSES.EMAIL_VERIFICATION, EMAIL_VERIFICATION_EXPIRES_IN);

  // Enviar correo de confirmación de cuenta
  sendVerificationEmail(row.correo, row.nombre, verificationToken).catch((err) => {
    console.error('[EmailService] Error al enviar correo de verificación:', err.message);
  });

  // No emitimos token de sesión para obligar la verificación por correo antes de ingresar
  const publicUser = toPublicUser(row);
  return {
    user: publicUser,
    verificationToken,
    requiresVerification: true,
  };
}

export async function login({ correo, contrasena, tipoCuenta }) {
  const row = await userRepository.findByEmailWithPassword(correo);
  const isValid = row && (await verifyPassword(contrasena, row.contrasena_hash));

  if (!isValid) {
    throw new HttpError(401, 'Credenciales inválidas. Verifica tu correo y contraseña.');
  }

  if (tipoCuenta === 'administrador' && String(row.rol_nombre || '').toLowerCase() !== 'administrador') {
    throw new HttpError(403, 'Acceso denegado. Esta cuenta no cuenta con permisos de Administrador.');
  }

  // La cuenta debe estar verificada por correo para poder iniciar sesión
  if (!row.correo_verificado) {
    throw new HttpError(
      403,
      'Debes verificar tu correo electrónico antes de ingresar. Por favor revisa tu bandeja de entrada o spam para activar tu cuenta.'
    );
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
