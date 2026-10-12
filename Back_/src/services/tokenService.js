import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * Token de sesión del usuario.
 */
export function signToken(user) {
  return jwt.sign(
    { id: user.id, correo: user.correo, nombre: user.nombre, rol: user.rol },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

/**
 * Devuelve el payload de un token de sesión o lanza un error si es inválido/expirado.
 * Los tokens de los correos (verificación, recuperación) llevan `tipo` y no
 * sirven para iniciar sesión.
 */
export function verifyToken(token) {
  const payload = jwt.verify(token, config.jwt.secret);
  if (payload.tipo) {
    throw new Error('El token no es de sesión.');
  }
  return payload;
}

/**
 * Token para un enlace de correo. `tipo` es uno de TOKEN_PURPOSES.
 */
export function signPurposeToken(user, tipo, expiresIn) {
  return jwt.sign({ id: user.id, correo: user.correo, tipo }, config.jwt.secret, { expiresIn });
}

/**
 * Devuelve el payload si el token es válido, no expiró y es del tipo esperado;
 * en cualquier otro caso devuelve null.
 */
export function verifyPurposeToken(token, tipo) {
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    return payload.tipo === tipo ? payload : null;
  } catch {
    return null;
  }
}
