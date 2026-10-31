import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * Genera una huella criptográfica corta (HMAC-SHA256) derivada del hash de contraseña actual.
 * Permite:
 * 1) Que un enlace de recuperación de contraseña quede invalidado automáticamente tras su primer uso.
 * 2) Que todas las sesiones JWT previas se cierren automáticamente al cambiar la contraseña.
 */
export function getPasswordFingerprint(contrasenaHash) {
  if (!contrasenaHash) return null;
  return crypto
    .createHmac('sha256', config.jwt.secret)
    .update(String(contrasenaHash))
    .digest('hex')
    .slice(0, 16);
}

/**
 * Token de sesión del usuario. Incluye la huella `pwd` de la contraseña actual
 * para invalidar sesiones anteriores si el usuario cambia su clave.
 */
export function signToken(user, contrasenaHash = null) {
  const pwd = getPasswordFingerprint(contrasenaHash ?? user.contrasena_hash);
  return jwt.sign(
    {
      id: user.id,
      correo: user.correo,
      nombre: user.nombre,
      rol: user.rol,
      ...(pwd ? { pwd } : {}),
    },
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
 * Si el objeto `user` incluye `contrasena_hash`, adjunta la huella `pwd` para garantizar un solo uso.
 */
export function signPurposeToken(user, tipo, expiresIn) {
  const pwd = getPasswordFingerprint(user.contrasena_hash);
  return jwt.sign(
    {
      id: user.id,
      correo: user.correo,
      tipo,
      ...(pwd ? { pwd } : {}),
    },
    config.jwt.secret,
    { expiresIn }
  );
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
