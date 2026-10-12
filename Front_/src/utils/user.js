/**
 * Iniciales a partir del nombre ("Ana María López" -> "AM").
 */
export function getInitials(nombre = '') {
  const initials = nombre
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return initials || 'US';
}

/**
 * Formatea bytes en una unidad legible (B, KB, MB, GB, TB).
 */
export function formatBytes(bytes = 0) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${Number(value.toFixed(1))} ${units[unit]}`;
}

/**
 * Resumen de almacenamiento del usuario.
 * Se asume que `espacioDisponible` es el espacio libre restante.
 */
export function getStorageUsage(user) {
  const used = user?.espacioConsumido ?? 0;
  const free = user?.espacioDisponible ?? 0;
  const total = used + free;
  const percent = total > 0 ? Math.round((used / total) * 100) : 0;
  return { used, free, total, percent };
}
