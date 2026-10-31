import * as adminRepository from '../repositories/adminRepository.js';
import { toPublicUser } from './authService.js';
import { fileStorage } from '../patterns/storageBridge/index.js';
import { HttpError } from '../utils/httpError.js';

const PG_UNIQUE_VIOLATION = '23505';

function toPublicPlan(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    precio: Number(row.precio),
    capacidadAlmacenamiento: Number(row.capacidad_almacenamiento),
    vigenciaDias: Number(row.vigencia_dias),
    activo: Boolean(row.activo),
    ...(row.suscripciones_activas !== undefined
      ? { suscripcionesActivas: Number(row.suscripciones_activas) }
      : {}),
  };
}

/**
 * Caso de uso: "Gestionar cuentas de clientes" y "Gestionar consumo de clientes"
 * (`Administrador.gestionarUsuarios()` en Diagrama de Clases UML).
 */
export async function getUsers() {
  const rows = await adminRepository.findAllUsers();
  return rows.map((row) => ({
    ...toPublicUser(row),
    totalArchivos: row.total_archivos,
    totalCarpetas: row.total_carpetas,
    suscripcionActiva: row.suscripcion_id
      ? {
          id: row.suscripcion_id,
          planId: row.plan_id,
          planNombre: row.plan_nombre,
          precio: Number(row.plan_precio),
          fechaInicio: row.suscripcion_inicio,
          fechaRenovacion: row.suscripcion_renovacion,
          diasRestantes: row.dias_restantes,
        }
      : null,
  }));
}

/**
 * Actualiza los datos, rol o cuota de almacenamiento de un usuario.
 */
export async function updateUser(adminId, targetUserId, updates) {
  const existing = await adminRepository.findUserById(targetUserId);
  if (!existing) {
    throw new HttpError(404, 'Usuario no encontrado.');
  }

  if (adminId === targetUserId && updates.rolNombre && updates.rolNombre !== 'Administrador') {
    throw new HttpError(400, 'No puedes quitarte el rol de Administrador a tu propia cuenta en sesión.');
  }

  const updated = await adminRepository.updateUserByAdmin(targetUserId, updates);
  return toPublicUser(updated);
}

/**
 * Elimina la cuenta de un cliente y limpia sus archivos físicos del disco.
 */
export async function deleteUser(adminId, targetUserId) {
  if (adminId === targetUserId) {
    throw new HttpError(400, 'No puedes eliminar tu propia cuenta de Administrador en sesión.');
  }

  const existing = await adminRepository.findUserById(targetUserId);
  if (!existing) {
    throw new HttpError(404, 'Usuario no encontrado.');
  }

  const userFiles = await adminRepository.findAllFilesByUser(targetUserId);
  const deleted = await adminRepository.deleteUserById(targetUserId);

  await fileStorage.removeMany(userFiles);

  return {
    id: deleted.id,
    nombre: deleted.nombre,
    correo: deleted.correo,
    archivosEliminados: userFiles.length,
  };
}

/**
 * Caso de uso: "Administrar catálogo de planes de almacenamiento"
 * (`Administrador.gestionarPlanes()` en Diagrama de Clases UML).
 */
export async function getPlans() {
  const rows = await adminRepository.findAllPlans();
  return rows.map(toPublicPlan);
}

export async function createPlan(planData) {
  try {
    const created = await adminRepository.createPlan(planData);
    return toPublicPlan(created);
  } catch (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      throw new HttpError(409, 'Ya existe un plan con ese nombre en el catálogo.');
    }
    throw error;
  }
}

export async function updatePlan(planId, updates) {
  const existing = await adminRepository.findPlanById(planId);
  if (!existing) {
    throw new HttpError(404, 'El plan especificado no existe.');
  }

  try {
    const updated = await adminRepository.updatePlan(planId, updates);
    return toPublicPlan(updated);
  } catch (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      throw new HttpError(409, 'Ya existe otro plan con ese nombre en el catálogo.');
    }
    throw error;
  }
}

/**
 * Implementa el Diagrama de Actividad UML: "Administrador visualiza planes de usuarios".
 */
export async function getUserPlans() {
  const rows = await adminRepository.findUserPlansList();
  return rows.map((row) => ({
    usuarioId: row.usuario_id,
    nombre: row.usuario_nombre,
    correo: row.usuario_correo,
    rol: row.rol_nombre,
    espacioConsumido: Number(row.espacio_consumido),
    espacioDisponible: Number(row.espacio_disponible),
    plan: {
      suscripcionId: row.suscripcion_id,
      nombre: row.plan_nombre,
      precio: Number(row.plan_precio),
      capacidad: Number(row.capacidad_plan),
      estado: row.estado_plan,
      fechaInicio: row.fecha_inicio,
      fechaRenovacion: row.fecha_renovacion,
      diasRestantes: row.dias_restantes,
    },
  }));
}

/**
 * Caso de uso: "Consultar reportes generales del servicio"
 * (`Administrador.generarReporte(): Reporte` en Diagrama de Clases UML).
 */
export async function generateReport() {
  const { summary, plansBreakdown } = await adminRepository.getServiceReportMetrics();

  return {
    fechaGeneracion: summary.fecha_generacion,
    usuariosActivos: Number(summary.usuarios_activos),
    usuariosVerificados: Number(summary.usuarios_verificados),
    espacioTotalConsumido: Number(summary.espacio_total_consumido),
    espacioTotalDisponible: Number(summary.espacio_total_disponible),
    totalArchivos: Number(summary.total_archivos),
    totalCarpetas: Number(summary.total_carpetas),
    suscripcionesActivas: Number(summary.suscripciones_activas),
    ingresosSimulados: Number(summary.ingresos_simulados),
    planes: plansBreakdown.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      precio: Number(p.precio),
      capacidadAlmacenamiento: Number(p.capacidad_almacenamiento),
      activo: Boolean(p.activo),
      usuariosSuscritos: Number(p.usuarios_suscritos),
    })),
  };
}
