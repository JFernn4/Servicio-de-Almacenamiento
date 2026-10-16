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
  let value = Number(bytes) || 0;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${Number(value.toFixed(1))} ${units[unit]}`;
}

/**
 * Resumen de almacenamiento del usuario.
 * En el backend `espacioDisponible` representa la cuota total del plan (ej. 5 GB).
 */
export function getStorageUsage(user) {
  const used = Number(user?.espacioConsumido) || 0;
  const total = Number(user?.espacioDisponible) || 0;
  const free = Math.max(0, total - used);
  const percent = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return { used, free, total, percent };
}

/**
 * Devuelve etiqueta y color distintivo según la extensión o tipo MIME del archivo.
 */
export function getFileBadge(nombre = '') {
  const ext = (nombre.split('.').pop() || '').toLowerCase();
  const map = {
    pdf: { type: 'PDF', color: '#EF4444' },
    xls: { type: 'XLS', color: '#16A34A' },
    xlsx: { type: 'XLS', color: '#16A34A' },
    csv: { type: 'CSV', color: '#0284C7' },
    doc: { type: 'DOC', color: '#7D1535' },
    docx: { type: 'DOC', color: '#7D1535' },
    ppt: { type: 'PPT', color: '#EA580C' },
    pptx: { type: 'PPT', color: '#EA580C' },
    png: { type: 'IMG', color: '#9333EA' },
    jpg: { type: 'IMG', color: '#9333EA' },
    jpeg: { type: 'IMG', color: '#9333EA' },
    gif: { type: 'IMG', color: '#9333EA' },
    webp: { type: 'IMG', color: '#9333EA' },
    svg: { type: 'IMG', color: '#9333EA' },
    zip: { type: 'ZIP', color: '#CA8A04' },
    rar: { type: 'RAR', color: '#CA8A04' },
  };
  return map[ext] || { type: (ext.slice(0, 3) || 'ARC').toUpperCase(), color: '#64748B' };
}

/**
 * Convierte un registro de archivo del backend al formato esperado por FileTable.
 */
export function mapFileForTable(archivo) {
  const { type, color } = getFileBadge(archivo.nombre);
  const rawDate = archivo.en_papelera
    ? archivo.fecha_eliminacion || archivo.fecha_subida
    : archivo.fecha_subida;
  return {
    id: archivo.id,
    name: archivo.nombre,
    type,
    color,
    size: formatBytes(archivo.tamano),
    date: String(rawDate || '').slice(0, 10),
  };
}
