import * as userRepository from '../repositories/userRepository.js';
import { signPurposeToken, verifyPurposeToken } from './tokenService.js';
import { hashPassword } from './passwordService.js';
import { sendPasswordResetEmail } from './emailService.js';
import { HttpError } from '../utils/httpError.js';
import { TOKEN_PURPOSES, PASSWORD_RESET_EXPIRES_IN } from '../config/constants.js';

// Verificación de correo y recuperación de contraseña mediante enlaces enviados por correo.

export async function verifyEmail({ token }) {
  const payload = verifyPurposeToken(token, TOKEN_PURPOSES.EMAIL_VERIFICATION);
  if (!payload) {
    throw new HttpError(400, 'El enlace de verificación es inválido o ha expirado.');
  }

  const user = await userRepository.markEmailVerified(payload.id);
  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado.');
  }

  return { id: user.id, nombre: user.nombre, correo: user.correo, correoVerificado: true };
}

/**
 * Envía el enlace de recuperación si el correo existe. No informa al llamador
 * si existía o no, para no revelar qué correos están registrados.
 */
export async function requestPasswordReset({ correo }) {
  const user = await userRepository.findByEmailWithPassword(correo);
  if (!user) return;

  const resetToken = signPurposeToken(user, TOKEN_PURPOSES.PASSWORD_RESET, PASSWORD_RESET_EXPIRES_IN);

  // En segundo plano: la respuesta no debe depender del envío del correo
  sendPasswordResetEmail(user.correo, user.nombre, resetToken).catch((err) => {
    console.error('[EmailService] Error al enviar correo de recuperación:', err.message);
  });
}

export async function resetPassword({ token, nuevaContrasena }) {
  const payload = verifyPurposeToken(token, TOKEN_PURPOSES.PASSWORD_RESET);
  if (!payload) {
    throw new HttpError(400, 'El enlace de recuperación es inválido o ha expirado. Por favor solicita uno nuevo.');
  }

  const updated = await userRepository.updatePassword(payload.id, await hashPassword(nuevaContrasena));
  if (!updated) {
    throw new HttpError(404, 'Usuario no encontrado.');
  }
}
