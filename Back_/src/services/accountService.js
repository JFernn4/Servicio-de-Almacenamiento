import * as userRepository from '../repositories/userRepository.js';
import {
  signPurposeToken,
  verifyPurposeToken,
  getPasswordFingerprint,
} from './tokenService.js';
import { hashPassword } from './passwordService.js';
import { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } from './emailService.js';
import { HttpError } from '../utils/httpError.js';
import {
  TOKEN_PURPOSES,
  EMAIL_VERIFICATION_EXPIRES_IN,
  PASSWORD_RESET_EXPIRES_IN,
} from '../config/constants.js';

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

  // Enviar correo de bienvenida tras confirmar exitosamente la cuenta
  sendWelcomeEmail(user.correo, user.nombre).catch((err) => {
    console.error('[EmailService] Error al enviar correo de bienvenida tras verificación:', err.message);
  });

  return { id: user.id, nombre: user.nombre, correo: user.correo, correoVerificado: true };
}

export async function resendVerification({ correo }) {
  const user = await userRepository.findByEmailWithPassword(correo);
  if (!user) {
    throw new HttpError(404, 'No se encontró ninguna cuenta registrada con este correo.');
  }

  if (user.correo_verificado) {
    throw new HttpError(400, 'Este correo ya se encuentra verificado.');
  }

  const verificationToken = signPurposeToken(user, TOKEN_PURPOSES.EMAIL_VERIFICATION, EMAIL_VERIFICATION_EXPIRES_IN);
  await sendVerificationEmail(user.correo, user.nombre, verificationToken);

  return { verificationToken };
}

/**
 * Envía el enlace de recuperación si el correo existe. No informa al llamador
 * si existía o no, para no revelar qué correos están registrados.
 */
export async function requestPasswordReset({ correo }) {
  const user = await userRepository.findByEmailWithPassword(correo);
  if (!user) {
    console.warn(`[PasswordReset] Solicitud de recuperación ignorada: correo no registrado "${correo}"`);
    return;
  }

  console.log(`[PasswordReset] Generando enlace de recuperación para "${user.nombre}" (${user.correo})`);
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

  const user = await userRepository.findByIdWithPassword(payload.id);
  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado.');
  }

  // Validar que el enlace sea de un solo uso comparando la huella de contraseña embebida
  const currentFingerprint = getPasswordFingerprint(user.contrasena_hash);
  if (!payload.pwd || payload.pwd !== currentFingerprint) {
    throw new HttpError(
      400,
      'Este enlace de recuperación ya fue utilizado o ha expirado. Por favor solicita uno nuevo.'
    );
  }

  const updated = await userRepository.updatePassword(payload.id, await hashPassword(nuevaContrasena));
  if (!updated) {
    throw new HttpError(404, 'Usuario no encontrado.');
  }
}
