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

/**
 * Verifica que el usuario autenticado posea el rol de Administrador
 * (según el Diagrama de Actividad UML: "Verifica permisos de administrador").
 */
export function requireAdmin(req, res, next) {
  const rol = String(req.user?.rol || '').trim().toLowerCase();
  if (rol !== 'administrador') {
    return next(new HttpError(403, 'Acceso denegado. Se requieren permisos de Administrador.'));
  }
  next();
}
