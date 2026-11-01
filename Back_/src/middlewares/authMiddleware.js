import * as userRepository from '../repositories/userRepository.js';
import { verifyToken, getPasswordFingerprint } from '../services/tokenService.js';
import { HttpError } from '../utils/httpError.js';

export async function authenticateToken(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Acceso no autorizado. Se requiere un token de autenticación.'));
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return next(new HttpError(401, 'Token inválido o expirado. Inicia sesión nuevamente.'));
  }

  try {
    const currentUser = await userRepository.findByIdWithPassword(payload.id);
    if (!currentUser) {
      return next(new HttpError(401, 'La cuenta de usuario ya no existe. Inicia sesión nuevamente.'));
    }

    const currentFingerprint = getPasswordFingerprint(currentUser.contrasena_hash);
    if (payload.pwd && payload.pwd !== currentFingerprint) {
      return next(
        new HttpError(
          401,
          'Tu sesión ha expirado porque la contraseña de la cuenta fue modificada. Inicia sesión nuevamente.'
        )
      );
    }

    if (!currentUser.correo_verificado) {
      return next(
        new HttpError(
          403,
          'Debes verificar tu correo electrónico para acceder al sistema.'
        )
      );
    }

    req.user = {
      ...payload,
      rol: currentUser.rol_nombre || payload.rol,
    };
    return next();
  } catch (error) {
    return next(error);
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
