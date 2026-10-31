import { config } from '../config/env.js';

const MB = 1024 * 1024;

/**
 * Tamaño máximo efectivo por archivo: el del plan del usuario (patrón Decorator),
 * recortado por el tope global del servidor (MAX_UPLOAD_MB) si existe.
 * Ej.: en Supabase gratis el tope es 50 MB aunque el plan permita 250 MB.
 */
export function effectiveMaxFileSize(politica) {
  const cap = config.storage.maxUploadBytes;
  return cap ? Math.min(politica.maxFileSizeBytes, cap) : politica.maxFileSizeBytes;
}

/**
 * true si el límite que aplica es el del servidor y no el del plan.
 */
export function isServerCapApplied(politica) {
  const cap = config.storage.maxUploadBytes;
  return Boolean(cap) && cap < politica.maxFileSizeBytes;
}

export const toMb = (bytes) => Number((bytes / MB).toFixed(0));

/**
 * Mensaje para un archivo que supera el límite, explicando si es del plan o del servidor.
 */
export function fileTooLargeMessage({ politica, planName, fileName }) {
  const limitMb = toMb(effectiveMaxFileSize(politica));
  const target = fileName ? `El archivo "${fileName}"` : 'El archivo';
  return isServerCapApplied(politica)
    ? `${target} excede el límite de ${limitMb} MB por archivo de este servidor.`
    : `${target} excede el límite de ${limitMb} MB permitido por tu plan (${planName}). Mejora tu suscripción para subir archivos más pesados.`;
}
