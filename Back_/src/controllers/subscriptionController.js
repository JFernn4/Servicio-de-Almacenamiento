import * as subscriptionService from '../services/subscriptionService.js';
import {
  validateSubscribeInput,
  validateRenewInput,
  validateDecoratorChainInput,
} from '../validators/subscriptionValidator.js';

/**
 * GET /api/subscriptions/plans
 * Lista el catálogo de planes junto con la evaluación del Patrón Decorator para cada uno.
 */
export async function getPlansCatalog(req, res) {
  const catalog = await subscriptionService.getPlansCatalog();
  res.status(200).json(catalog);
}

/**
 * GET /api/subscriptions/me
 * Obtiene la suscripción activa del usuario, su objeto Plan decorado y la política dinámica de Multer.
 */
export async function getMySubscription(req, res) {
  const data = await subscriptionService.getMySubscription(req.user.id);
  res.status(200).json(data);
}

/**
 * POST /api/subscriptions/subscribe (y POST /api/subscriptions/change)
 * Contrata un plan o cambia el plan actual del usuario.
 */
export async function subscribeOrChangePlan(req, res) {
  const input = validateSubscribeInput(req.body);
  const resultado = await subscriptionService.subscribeOrChangePlan(req.user.id, input);

  if (!resultado.aprobado) {
    return res.status(402).json({
      message:
        'El pago fue rechazado por la pasarela simulada. La transacción ha sido registrada en el historial de pagos.',
      ...resultado,
    });
  }

  return res.status(201).json({
    message: resultado.esCambioDePlan
      ? `Plan cambiado exitosamente (anterior: ${resultado.planAnterior}). Capacidad y límites de Multer actualizados con el Patrón Decorator.`
      : 'Suscripción contratada exitosamente. Capacidad y límites de Multer actualizados con el Patrón Decorator.',
    ...resultado,
  });
}

/**
 * POST /api/subscriptions/renew
 * Renueva la suscripción activa del usuario.
 */
export async function renewSubscription(req, res) {
  const input = validateRenewInput(req.body);
  const resultado = await subscriptionService.renewSubscription(req.user.id, input);

  if (!resultado.aprobado) {
    return res.status(402).json({
      message:
        'El pago de renovación fue rechazado por la pasarela simulada. El intento quedó registrado en el historial.',
      ...resultado,
    });
  }

  return res.status(200).json({
    message: 'Suscripción renovada exitosamente.',
    ...resultado,
  });
}

/**
 * POST /api/subscriptions/cancel
 * Cancela la suscripción activa del usuario y vuelve al PlanGratuito (5 GB).
 */
export async function cancelSubscription(req, res) {
  const resultado = await subscriptionService.cancelSubscription(req.user.id);

  res.status(200).json({
    message:
      'Suscripción cancelada exitosamente. Tu cuenta ha vuelto al PlanGratuito base (5 GB) y sus límites estándar de Multer.',
    ...resultado,
  });
}

/**
 * GET /api/subscriptions/payments
 * Consulta el historial de pagos del usuario (aprobados y rechazados).
 */
export async function getPaymentHistory(req, res) {
  const pagos = await subscriptionService.getPaymentHistory(req.user.id);
  res.status(200).json({ pagos });
}

/**
 * POST /api/subscriptions/decorator-preview
 * Simula el encadenamiento de decoradores (PlanGratuito -> PlanBasico -> Profesional -> Empresarial).
 */
export async function previewDecoratorChain(req, res) {
  const input = validateDecoratorChainInput(req.body);
  const simulacion = subscriptionService.simulateDecoratorComposition(input);
  res.status(200).json(simulacion);
}
