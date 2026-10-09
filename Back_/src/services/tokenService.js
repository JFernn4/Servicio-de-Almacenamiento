import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function signToken(user) {
  return jwt.sign(
    { id: user.id, correo: user.correo, nombre: user.nombre, rol: user.rol },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

/**
 * Devuelve el payload del token o lanza un error si es inválido/expirado.
 */
export function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}
