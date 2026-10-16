import { HttpError } from '../utils/httpError.js';

const asText = (value) => (typeof value === 'string' ? value.trim() : '');

/**
 * Valida un parámetro numérico de ruta (ID).
 */
export function validateId(paramValue, entityName = 'recurso') {
  const id = Number(paramValue);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `El identificador de ${entityName} debe ser un número entero válido.`);
  }
  return id;
}

/**
 * Valida los datos requeridos para la creación de una carpeta.
 */
export function validateCreateFolder(body = {}) {
  const nombre = asText(body.nombre);
  if (!nombre) {
    throw new HttpError(400, 'El nombre de la carpeta es obligatorio.');
  }
  if (nombre.length > 255) {
    throw new HttpError(400, 'El nombre de la carpeta no puede exceder los 255 caracteres.');
  }
  if (/[/\\]/.test(nombre)) {
    throw new HttpError(400, 'El nombre de la carpeta no puede contener barras (/ o \\).');
  }

  let carpetaPadreId = null;
  if (body.carpetaPadreId !== undefined && body.carpetaPadreId !== null && body.carpetaPadreId !== '') {
    carpetaPadreId = validateId(body.carpetaPadreId, 'carpeta superior');
  }

  return { nombre, carpetaPadreId };
}

/**
 * Valida los datos para renombrar un archivo o carpeta.
 */
export function validateRename(body = {}) {
  const nuevoNombre = asText(body.nuevoNombre || body.nombre);
  if (!nuevoNombre) {
    throw new HttpError(400, 'Debes proporcionar un nuevo nombre válido.');
  }
  if (nuevoNombre.length > 255) {
    throw new HttpError(400, 'El nuevo nombre no puede exceder los 255 caracteres.');
  }
  if (/[/\\]/.test(nuevoNombre)) {
    throw new HttpError(400, 'El nuevo nombre no puede contener barras (/ o \\).');
  }

  return { nuevoNombre };
}
