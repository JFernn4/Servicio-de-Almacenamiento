import { HttpError } from '../utils/httpError.js';
import { ADMIN_ROLE, ADMIN_ACCESS_LEVEL, DEFAULT_ROLE, DEFAULT_ACCESS_LEVEL } from '../config/constants.js';

const asText = (value) => (typeof value === 'string' ? value.trim() : '');

/**
 * Valida un identificador numérico de ruta.
 */
export function validateId(paramValue, entityName = 'recurso') {
  const id = Number(paramValue);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `El identificador de ${entityName} debe ser un número entero válido.`);
  }
  return id;
}

/**
 * Valida los datos para crear un nuevo plan en el catálogo.
 */
export function validateCreatePlan(body = {}) {
  const nombre = asText(body.nombre);
  const descripcion = body.descripcion !== undefined && body.descripcion !== null ? asText(body.descripcion) : null;
  const precio = Number(body.precio);
  const vigenciaDias = Number(body.vigenciaDias ?? body.vigencia_dias);

  // Permite indicar capacidad en bytes (`capacidadAlmacenamiento`) o en GB (`capacidadGb`)
  let capacidadAlmacenamiento = Number(body.capacidadAlmacenamiento ?? body.capacidad_almacenamiento);
  if ((!Number.isFinite(capacidadAlmacenamiento) || capacidadAlmacenamiento <= 0) && body.capacidadGb !== undefined) {
    const gb = Number(body.capacidadGb);
    if (Number.isFinite(gb) && gb > 0) {
      capacidadAlmacenamiento = Math.round(gb * 1024 ** 3);
    }
  }

  if (!nombre) {
    throw new HttpError(400, 'El nombre del plan es obligatorio.');
  }
  if (nombre.length > 100) {
    throw new HttpError(400, 'El nombre del plan no puede exceder los 100 caracteres.');
  }
  if (!Number.isFinite(precio) || precio < 0) {
    throw new HttpError(400, 'El precio del plan debe ser un número mayor o igual a 0.');
  }
  if (!Number.isInteger(capacidadAlmacenamiento) || capacidadAlmacenamiento <= 0) {
    throw new HttpError(400, 'La capacidad de almacenamiento debe ser un número entero positivo en bytes (o indicar capacidadGb > 0).');
  }
  if (!Number.isInteger(vigenciaDias) || vigenciaDias <= 0) {
    throw new HttpError(400, 'La vigencia en días debe ser un número entero mayor a 0.');
  }

  const activo = body.activo === undefined ? true : Boolean(body.activo);

  return {
    nombre,
    descripcion,
    precio: Number(precio.toFixed(2)),
    capacidadAlmacenamiento,
    vigenciaDias,
    activo,
  };
}

/**
 * Valida los datos para actualizar un plan existente.
 */
export function validateUpdatePlan(body = {}) {
  const updates = {};

  if (body.nombre !== undefined) {
    const nombre = asText(body.nombre);
    if (!nombre || nombre.length > 100) {
      throw new HttpError(400, 'El nombre del plan debe tener entre 1 y 100 caracteres.');
    }
    updates.nombre = nombre;
  }

  if (body.descripcion !== undefined) {
    updates.descripcion = body.descripcion === null ? null : asText(body.descripcion);
  }

  if (body.precio !== undefined) {
    const precio = Number(body.precio);
    if (!Number.isFinite(precio) || precio < 0) {
      throw new HttpError(400, 'El precio del plan debe ser un número mayor o igual a 0.');
    }
    updates.precio = Number(precio.toFixed(2));
  }

  if (body.capacidadAlmacenamiento !== undefined || body.capacidad_almacenamiento !== undefined || body.capacidadGb !== undefined) {
    let cap = Number(body.capacidadAlmacenamiento ?? body.capacidad_almacenamiento);
    if ((!Number.isInteger(cap) || cap <= 0) && body.capacidadGb !== undefined) {
      const gb = Number(body.capacidadGb);
      if (Number.isFinite(gb) && gb > 0) {
        cap = Math.round(gb * 1024 ** 3);
      }
    }
    if (!Number.isInteger(cap) || cap <= 0) {
      throw new HttpError(400, 'La capacidad de almacenamiento debe ser un número positivo.');
    }
    updates.capacidadAlmacenamiento = cap;
  }

  if (body.vigenciaDias !== undefined || body.vigencia_dias !== undefined) {
    const vigenciaDias = Number(body.vigenciaDias ?? body.vigencia_dias);
    if (!Number.isInteger(vigenciaDias) || vigenciaDias <= 0) {
      throw new HttpError(400, 'La vigencia en días debe ser un número entero mayor a 0.');
    }
    updates.vigenciaDias = vigenciaDias;
  }

  if (body.activo !== undefined) {
    if (typeof body.activo !== 'boolean') {
      throw new HttpError(400, 'El campo activo debe ser un valor booleano (true o false).');
    }
    updates.activo = body.activo;
  }

  if (Object.keys(updates).length === 0) {
    throw new HttpError(400, 'Debes enviar al menos un campo para actualizar el plan.');
  }

  return updates;
}

/**
 * Valida los datos para que un Administrador actualice la cuenta o cuota de un cliente.
 */
export function validateUpdateUser(body = {}) {
  const updates = {};

  if (body.nombre !== undefined) {
    const nombre = asText(body.nombre);
    if (!nombre || nombre.length > 100) {
      throw new HttpError(400, 'El nombre del usuario debe tener entre 1 y 100 caracteres.');
    }
    updates.nombre = nombre;
  }

  if (body.rol !== undefined || body.tipoCuenta !== undefined) {
    const rawRol = asText(body.rol || body.tipoCuenta).toLowerCase();
    if (rawRol === 'administrador' || rawRol === 'admin') {
      updates.rolNombre = ADMIN_ROLE;
      updates.nivelAcceso = ADMIN_ACCESS_LEVEL;
    } else if (rawRol === 'usuario' || rawRol === 'cliente' || rawRol === 'estandar') {
      updates.rolNombre = DEFAULT_ROLE;
      updates.nivelAcceso = DEFAULT_ACCESS_LEVEL;
    } else {
      throw new HttpError(400, 'El rol especificado no es válido (usa "Administrador" o "Usuario").');
    }
  }

  if (body.correoVerificado !== undefined || body.correo_verificado !== undefined) {
    updates.correoVerificado = Boolean(body.correoVerificado ?? body.correo_verificado);
  }

  if (
    body.espacioDisponible !== undefined ||
    body.espacio_disponible !== undefined ||
    body.cuotaGb !== undefined
  ) {
    let bytes = Number(body.espacioDisponible ?? body.espacio_disponible);
    if ((!Number.isInteger(bytes) || bytes < 0) && body.cuotaGb !== undefined) {
      const gb = Number(body.cuotaGb);
      if (Number.isFinite(gb) && gb >= 0) {
        bytes = Math.round(gb * 1024 ** 3);
      }
    }
    if (!Number.isInteger(bytes) || bytes < 0) {
      throw new HttpError(400, 'La cuota de espacio disponible debe ser un número entero mayor o igual a 0.');
    }
    updates.espacioDisponible = bytes;
  }

  if (Object.keys(updates).length === 0) {
    throw new HttpError(400, 'Debes proporcionar al menos un campo para actualizar al usuario.');
  }

  return updates;
}
