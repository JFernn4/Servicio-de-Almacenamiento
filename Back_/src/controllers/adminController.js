import * as adminService from '../services/adminService.js';
import {
  validateId,
  validateCreatePlan,
  validateUpdatePlan,
  validateUpdateUser,
} from '../validators/adminValidator.js';

/**
 * Lista todas las cuentas de usuarios y su consumo de recursos (`gestionarUsuarios`).
 */
export async function getUsers(req, res) {
  const users = await adminService.getUsers();
  res.status(200).json({ users });
}

/**
 * Actualiza el rol, verificación o cuota de almacenamiento de un usuario (`gestionarUsuarios`).
 */
export async function updateUser(req, res) {
  const targetUserId = validateId(req.params.id, 'usuario');
  const updates = validateUpdateUser(req.body);
  const user = await adminService.updateUser(req.user.id, targetUserId, updates);

  res.status(200).json({
    message: 'Cuenta de usuario actualizada exitosamente.',
    user,
  });
}

/**
 * Elimina la cuenta de un usuario y libera sus archivos del servidor (`gestionarUsuarios`).
 */
export async function deleteUser(req, res) {
  const targetUserId = validateId(req.params.id, 'usuario');
  const resultado = await adminService.deleteUser(req.user.id, targetUserId);

  res.status(200).json({
    message: 'Cuenta de usuario eliminada exitosamente.',
    ...resultado,
  });
}

/**
 * Lista el catálogo completo de planes de almacenamiento (`gestionarPlanes`).
 */
export async function getPlans(req, res) {
  const plans = await adminService.getPlans();
  res.status(200).json({ plans });
}

/**
 * Crea un nuevo plan en el catálogo (`gestionarPlanes`).
 */
export async function createPlan(req, res) {
  const plan = await adminService.createPlan(validateCreatePlan(req.body));
  res.status(201).json({
    message: 'Plan de almacenamiento creado exitosamente.',
    plan,
  });
}

/**
 * Actualiza o activa/desactiva un plan existente (`gestionarPlanes`).
 */
export async function updatePlan(req, res) {
  const planId = validateId(req.params.id, 'plan');
  const plan = await adminService.updatePlan(planId, validateUpdatePlan(req.body));

  res.status(200).json({
    message: 'Plan de almacenamiento actualizado exitosamente.',
    plan,
  });
}

/**
 * Lista los planes y consumo de cada usuario (Diagrama de Actividad:
 * "Administrador visualiza planes de usuarios").
 */
export async function getUserPlans(req, res) {
  const userPlans = await adminService.getUserPlans();
  res.status(200).json({ userPlans });
}

/**
 * Genera el reporte general del servicio (`generarReporte(): Reporte`).
 */
export async function getServiceReport(req, res) {
  const report = await adminService.generateReport();
  res.status(200).json({ report });
}
