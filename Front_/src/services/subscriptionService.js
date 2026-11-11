import { request } from './authService';

/**
 * Obtiene el catálogo público de planes junto con la información del Patrón Decorator.
 */
export function fetchPlansCatalog() {
  return request('/subscriptions/plans', { token: null });
}

/**
 * Obtiene la suscripción activa del usuario autenticado, su objeto Plan decorado y su cuota.
 */
export function fetchMySubscription() {
  return request('/subscriptions/me');
}

/**
 * Endpoint alternativo para consultar la suscripción activa del usuario.
 */
export function fetchActiveSubscription() {
  return request('/subscriptions/active');
}

/**
 * Contrata un plan o cambia el plan actual del usuario a través de la pasarela de pagos.
 */
export function subscribeOrChangePlan({ planId, numeroTarjeta, tarjetaUltimos4, simularRechazo = false }) {
  return request('/subscriptions/subscribe', {
    method: 'POST',
    body: {
      planId,
      numeroTarjeta,
      tarjetaUltimos4,
      simularRechazo,
    },
  });
}

/**
 * Renueva la suscripción activa del usuario sumando días de vigencia.
 */
export function renewActiveSubscription({ numeroTarjeta, tarjetaUltimos4, simularRechazo = false }) {
  return request('/subscriptions/renew', {
    method: 'POST',
    body: {
      numeroTarjeta,
      tarjetaUltimos4,
      simularRechazo,
    },
  });
}

/**
 * Cancela la suscripción activa del usuario y restaura el PlanGratuito base (5 GB).
 */
export function cancelActiveSubscription() {
  return request('/subscriptions/cancel', {
    method: 'POST',
  });
}

/**
 * Obtiene el historial de pagos (aprobados y rechazados) del usuario autenticado.
 */
export async function fetchPaymentHistory() {
  const data = await request('/subscriptions/payments');
  return data.pagos || [];
}

