import { HttpError } from '../utils/httpError.js';
import { MIN_PASSWORD_LENGTH } from '../config/constants.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const asText = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeEmail = (value) => asText(value).toLowerCase();

/**
 * Valida y normaliza el cuerpo de /register. Lanza HttpError(400) si es inválido.
 */
export function validateRegister(body = {}) {
  const nombre = asText(body.nombre);
  const correo = normalizeEmail(body.correo);
  const contrasena = typeof body.contrasena === 'string' ? body.contrasena : '';

  if (!nombre || !correo || !contrasena) {
    throw new HttpError(400, 'Todos los campos son requeridos (nombre, correo, contraseña).');
  }
  if (!EMAIL_REGEX.test(correo)) {
    throw new HttpError(400, 'El formato del correo electrónico no es válido.');
  }
  if (contrasena.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(400, `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }

  return { nombre, correo, contrasena };
}

/**
 * Valida y normaliza el cuerpo de /login. Lanza HttpError(400) si es inválido.
 */
export function validateLogin(body = {}) {
  const correo = normalizeEmail(body.correo);
  const contrasena = typeof body.contrasena === 'string' ? body.contrasena : '';

  if (!correo || !contrasena) {
    throw new HttpError(400, 'Debes proporcionar tu correo y contraseña.');
  }

  return { correo, contrasena };
}
