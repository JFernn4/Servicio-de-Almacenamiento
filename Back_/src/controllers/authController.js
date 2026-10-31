import * as authService from '../services/authService.js';
import * as accountService from '../services/accountService.js';
import {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateForgotPassword,
  validateResetPassword,
} from '../validators/authValidator.js';

// Express 5 propaga automáticamente los errores de handlers async al errorHandler.

export async function register(req, res) {
  const session = await authService.register(validateRegister(req.body));
  res.status(201).json({
    message: 'Usuario registrado exitosamente. Se ha enviado un correo de verificación.',
    ...session,
  });
}

export async function login(req, res) {
  const session = await authService.login(validateLogin(req.body));
  res.status(200).json({ message: 'Inicio de sesión exitoso.', ...session });
}

export async function getProfile(req, res) {
  const user = await authService.getProfile(req.user.id);
  res.status(200).json({ user });
}

export async function verifyEmail(req, res) {
  const user = await accountService.verifyEmail(validateVerifyEmail(req.body, req.query));
  res.status(200).json({
    message: 'Correo electrónico verificado exitosamente. Tu cuenta ahora tiene acceso completo.',
    verified: true,
    user,
  });
}

export async function resendVerification(req, res) {
  const result = await accountService.resendVerification(validateForgotPassword(req.body));
  res.status(200).json({
    message: 'Correo de verificación reenviado exitosamente. Por favor revisa tu bandeja de entrada.',
    ...result,
  });
}

export async function forgotPassword(req, res) {
  await accountService.requestPasswordReset(validateForgotPassword(req.body));
  // Misma respuesta exista o no el correo, para no revelar qué cuentas hay
  res.status(200).json({
    message: 'Si el correo está registrado, se ha enviado un enlace de recuperación.',
  });
}

export async function resetPassword(req, res) {
  await accountService.resetPassword(validateResetPassword(req.body));
  res.status(200).json({
    message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.',
  });
}


