import { verifyToken } from '../services/tokenService.js';
import { HttpError } from '../utils/httpError.js';

export function authenticateToken(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Acceso no autorizado. Se requiere un token de autenticación.'));
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new HttpError(401, 'Token inválido o expirado. Inicia sesión nuevamente.'));
  }
}
