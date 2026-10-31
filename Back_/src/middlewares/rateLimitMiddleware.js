import { RATE_LIMIT_POLICIES } from '../config/constants.js';
import { HttpError } from '../utils/httpError.js';

const stores = new Set();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

/**
 * Crea un middleware de límite de intentos (Rate Limiter) en memoria con cabeceras estándar
 * X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset y Retry-After.
 *
 * @param {object} options
 * @param {number} options.windowMs Duración de la ventana en milisegundos
 * @param {number} options.maxAttempts Máximo de solicitudes permitidas en la ventana
 * @param {string} options.message Mensaje de error cuando se alcanza el límite (HTTP 429)
 * @param {boolean} [options.onlyFailedRequests=false] Si es true, un resultado exitoso (< 400) reinicia el contador de fallos de esa clave
 * @param {function} [options.keyGenerator] Función para construir la clave de rastreo
 */
export function createRateLimiter({
  windowMs,
  maxAttempts,
  message = 'Demasiadas solicitudes. Por favor intenta más tarde.',
  onlyFailedRequests = false,
  keyGenerator = (req) => getClientIp(req),
}) {
  const hits = new Map();
  stores.add(hits);

  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();

    // Limpieza ligera de entradas vencidas
    if (hits.size > 1000) {
      for (const [k, entry] of hits.entries()) {
        if (entry.resetTime <= now) {
          hits.delete(k);
        }
      }
    }

    const key = keyGenerator(req);
    let entry = hits.get(key);

    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      hits.set(key, entry);
    }

    const resetSeconds = Math.max(1, Math.ceil((entry.resetTime - now) / 1000));

    // Si ya superó el máximo permitido dentro de la ventana activa, bloquear de inmediato
    if (entry.count >= maxAttempts) {
      res.setHeader('X-RateLimit-Limit', String(maxAttempts));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', String(resetSeconds));
      res.setHeader('Retry-After', String(resetSeconds));
      return next(new HttpError(429, message));
    }

    entry.count += 1;
    const remaining = Math.max(0, maxAttempts - entry.count);

    res.setHeader('X-RateLimit-Limit', String(maxAttempts));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(resetSeconds));

    if (onlyFailedRequests) {
      res.on('finish', () => {
        if (res.statusCode < 400) {
          hits.delete(key);
        }
      });
    }

    return next();
  };
}

/**
 * Permite limpiar todos los contadores activos (útil para pruebas automatizadas).
 */
export function resetAllRateLimiters() {
  for (const store of stores) {
    store.clear();
  }
}

/**
 * Límite de intentos de inicio de sesión:
 * Bloquea tras 5 intentos fallidos en 15 minutos por combinación de IP + correo.
 * Si el usuario inicia sesión exitosamente antes de bloquearse, limpia su contador de fallos.
 */
export const loginRateLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_POLICIES.LOGIN.windowMs,
  maxAttempts: RATE_LIMIT_POLICIES.LOGIN.maxAttempts,
  onlyFailedRequests: true,
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    const correo =
      typeof req.body?.correo === 'string' ? req.body.correo.trim().toLowerCase() : 'anon';
    return `login:${ip}:${correo}`;
  },
  message:
    'Has superado el límite máximo de 5 intentos de inicio de sesión. Por seguridad, espera 15 minutos antes de volver a intentarlo.',
});

/**
 * Límite de solicitudes para recuperación de contraseña y reenvío de verificación:
 * Máximo 5 peticiones cada 15 minutos por IP.
 */
export const passwordResetRateLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_POLICIES.PASSWORD_RESET.windowMs,
  maxAttempts: RATE_LIMIT_POLICIES.PASSWORD_RESET.maxAttempts,
  onlyFailedRequests: false,
  keyGenerator: (req) => `pwd-reset:${getClientIp(req)}`,
  message:
    'Has solicitado demasiados enlaces en poco tiempo. Por favor espera 15 minutos antes de intentar nuevamente.',
});

/**
 * Límite de peticiones de subida de archivos en /api/storage/upload:
 * Máximo 30 operaciones de subida cada 15 minutos por usuario autenticado (o IP).
 */
export const uploadRateLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_POLICIES.UPLOAD.windowMs,
  maxAttempts: RATE_LIMIT_POLICIES.UPLOAD.maxAttempts,
  onlyFailedRequests: false,
  keyGenerator: (req) => `upload:${req.user?.id || getClientIp(req)}`,
  message:
    'Has alcanzado el límite de operaciones de subida por minuto. Por favor espera unos minutos antes de subir más archivos.',
});
