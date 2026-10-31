import crypto from 'crypto';
import * as subscriptionRepository from '../repositories/subscriptionRepository.js';
import * as userRepository from '../repositories/userRepository.js';
import {
  PlanGratuito,
  crearPlanDecorado,
  construirCadenaDecoradores,
} from '../patterns/planDecorator.js';
import { HttpError } from '../utils/httpError.js';

const PG_UNIQUE_VIOLATION = '23505';

function generatePaymentReference(prefix = 'VINC') {
  const randomCode = crypto.randomUUID().split('-')[0].toUpperCase();
  return `${prefix}-${Date.now()}-${randomCode}`;
}

/**
 * Resuelve en tiempo real el objeto Plan del usuario aplicando el Patrón Decorator:
 * - Si no posee suscripción activa (o venció), devuelve una instancia de PlanGratuito.
 * - Si posee una suscripción activa, envuelve PlanGratuito con el decorador concreto
 *   correspondiente (PlanBasico, Profesional o Empresarial).
 */
export async function resolveUserPlanDecorator(usuarioId) {
  await subscriptionRepository.expireOverdueSubscriptions(usuarioId);
  const suscripcionActual = await subscriptionRepository.findCurrentSubscriptionByUser(usuarioId);

  const planBase = new PlanGratuito();
  if (!suscripcionActual) {
    return {
      planDecorado: planBase,
      suscripcionActual: null,
    };
  }

  const planDecorado = crearPlanDecorado(
    {
      nombre: suscripcionActual.plan_nombre,
      precio: suscripcionActual.plan_precio,
      capacidad_almacenamiento: suscripcionActual.capacidad_almacenamiento,
      descripcion: suscripcionActual.plan_descripcion,
    },
    planBase
  );

  return {
    planDecorado,
    suscripcionActual: {
      id: suscripcionActual.suscripcion_id,
      usuarioId: suscripcionActual.usuario_id,
      planId: suscripcionActual.plan_id,
      planNombre: suscripcionActual.plan_nombre,
      planPrecio: Number(suscripcionActual.plan_precio),
      capacidadAlmacenamiento: Number(suscripcionActual.capacidad_almacenamiento),
      vigenciaDias: Number(suscripcionActual.vigencia_dias),
      fechaInicio: suscripcionActual.fecha_inicio,
      fechaRenovacion: suscripcionActual.fecha_renovacion,
      diasRestantes: Number(suscripcionActual.dias_restantes),
      estado: 'activa',
    },
  };
}

/**
 * Devuelve el catálogo de planes disponibles (incluyendo el PlanGratuito base y cada plan
 * del catálogo decorado sobre PlanGratuito).
 */
export async function getPlansCatalog() {
  const rows = await subscriptionRepository.findActivePlans();
  const planGratuito = new PlanGratuito();

  const catalogo = rows.map((row) => {
    const decorado = crearPlanDecorado(row, new PlanGratuito());
    return {
      id: row.id,
      nombre: row.nombre,
      descripcionOriginal: row.descripcion,
      precioCatalogo: Number(row.precio),
      capacidadCatalogo: Number(row.capacidad_almacenamiento),
      vigenciaDias: Number(row.vigencia_dias),
      activo: Boolean(row.activo),
      decorator: decorado.toJSON(),
    };
  });

  return {
    planBase: {
      id: null,
      nombre: 'Gratuito',
      descripcionOriginal: 'Capacidad por defecto para cuentas sin suscripción de pago activa.',
      precioCatalogo: 0,
      capacidadCatalogo: planGratuito.almacenamiento(),
      vigenciaDias: null,
      activo: true,
      decorator: planGratuito.toJSON(),
    },
    planes: catalogo,
  };
}

/**
 * Consulta el estado actual de suscripción del usuario, su objeto Plan decorado,
 * su cuota en la tabla usuario y su historial de suscripciones.
 */
export async function getMySubscription(usuarioId) {
  const [{ planDecorado, suscripcionActual }, quota, historial] = await Promise.all([
    resolveUserPlanDecorator(usuarioId),
    userRepository.getStorageQuota(usuarioId),
    subscriptionRepository.findSubscriptionHistoryByUser(usuarioId),
  ]);

  if (!quota) {
    throw new HttpError(404, 'Usuario no encontrado.');
  }

  return {
    suscripcionActiva: suscripcionActual,
    planDecorado: planDecorado.toJSON(),
    almacenamientoUsuario: {
      espacioConsumido: Number(quota.espacio_consumido),
      espacioDisponible: Number(quota.espacio_disponible),
    },
    historialSuscripciones: historial.map((h) => ({
      id: h.id,
      planId: h.plan_id,
      planNombre: h.plan_nombre,
      precio: Number(h.plan_precio),
      capacidadAlmacenamiento: Number(h.capacidad_almacenamiento),
      vigenciaDias: Number(h.vigencia_dias),
      fechaInicio: h.fecha_inicio,
      fechaRenovacion: h.fecha_renovacion,
      estado: h.estado,
    })),
  };
}

/**
 * Contrata un plan o cambia el plan actual del usuario empleando el Patrón Decorator
 * para determinar el costo (costo()) y la nueva capacidad (almacenamiento()).
 */
export async function subscribeOrChangePlan(
  usuarioId,
  { planId, tarjetaUltimos4, simularRechazo = false }
) {
  await subscriptionRepository.expireOverdueSubscriptions(usuarioId);

  const planRow = await subscriptionRepository.findPlanById(planId);
  if (!planRow || !planRow.activo) {
    throw new HttpError(404, 'El plan seleccionado no existe o no se encuentra disponible.');
  }

  const suscripcionActual = await subscriptionRepository.findCurrentSubscriptionByUser(usuarioId);
  if (suscripcionActual && Number(suscripcionActual.plan_id) === Number(planId)) {
    throw new HttpError(
      409,
      `Ya tienes activo el plan "${planRow.nombre}". Si deseas extender su vigencia, utiliza la opción de renovar.`
    );
  }

  // Aplicar Patrón Decorator: envolver PlanGratuito con el decorador concreto del plan elegido
  const planBase = new PlanGratuito();
  const planDecorado = crearPlanDecorado(planRow, planBase);

  const monto = planDecorado.costo();
  const nuevaCapacidadBytes = planDecorado.almacenamiento();
  const vigenciaDias = Number(planRow.vigencia_dias);
  const referencia = generatePaymentReference('SUB');
  const aprobado = !simularRechazo;

  try {
    const resultado = await subscriptionRepository.contractOrChangeSubscriptionTransaction({
      usuarioId,
      planId: planRow.id,
      vigenciaDias,
      monto,
      referencia,
      tarjetaUltimos4,
      aprobado,
      nuevaCapacidadBytes,
    });

    const estadoActualizado = await getMySubscription(usuarioId);

    return {
      aprobado: resultado.aprobado,
      esCambioDePlan: Boolean(suscripcionActual),
      planAnterior: suscripcionActual ? suscripcionActual.plan_nombre : 'PlanGratuito',
      suscripcion: resultado.suscripcion,
      pago: {
        ...resultado.pago,
        monto: Number(resultado.pago.monto),
      },
      ...estadoActualizado,
    };
  } catch (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      throw new HttpError(409, 'Conflicto al procesar la suscripción activa del usuario.');
    }
    throw error;
  }
}

/**
 * Renueva la suscripción activa del usuario sumando vigencia_dias y registrando el pago.
 */
export async function renewSubscription(usuarioId, { tarjetaUltimos4, simularRechazo = false }) {
  await subscriptionRepository.expireOverdueSubscriptions(usuarioId);

  const suscripcionActual = await subscriptionRepository.findCurrentSubscriptionByUser(usuarioId);
  if (!suscripcionActual) {
    throw new HttpError(400, 'No tienes ninguna suscripción activa para renovar.');
  }

  const planDecorado = crearPlanDecorado(
    {
      nombre: suscripcionActual.plan_nombre,
      precio: suscripcionActual.plan_precio,
      capacidad_almacenamiento: suscripcionActual.capacidad_almacenamiento,
      descripcion: suscripcionActual.plan_descripcion,
    },
    new PlanGratuito()
  );

  const monto = planDecorado.costo();
  const nuevaCapacidadBytes = planDecorado.almacenamiento();
  const vigenciaDias = Number(suscripcionActual.vigencia_dias);
  const referencia = generatePaymentReference('REN');
  const aprobado = !simularRechazo;

  const resultado = await subscriptionRepository.renewSubscriptionTransaction({
    usuarioId,
    suscripcionId: suscripcionActual.suscripcion_id,
    vigenciaDias,
    monto,
    referencia,
    tarjetaUltimos4,
    aprobado,
    nuevaCapacidadBytes,
  });

  const estadoActualizado = await getMySubscription(usuarioId);

  return {
    aprobado: resultado.aprobado,
    suscripcion: resultado.suscripcion,
    pago: {
      ...resultado.pago,
      monto: Number(resultado.pago.monto),
    },
    ...estadoActualizado,
  };
}

/**
 * Cancela la suscripción activa del usuario y restaura el componente base PlanGratuito (5 GB).
 */
export async function cancelSubscription(usuarioId) {
  await subscriptionRepository.expireOverdueSubscriptions(usuarioId);

  const planGratuito = new PlanGratuito();
  const cancelado = await subscriptionRepository.cancelActiveSubscriptionTransaction({
    usuarioId,
    capacidadGratuitaBytes: planGratuito.almacenamiento(),
  });

  if (!cancelado) {
    throw new HttpError(400, 'No tienes una suscripción activa para cancelar.');
  }

  const estadoActualizado = await getMySubscription(usuarioId);

  return {
    suscripcionCancelada: cancelado.suscripcion,
    ...estadoActualizado,
  };
}

/**
 * Devuelve el historial de pagos del usuario desde v_historial_pagos.
 */
export async function getPaymentHistory(usuarioId) {
  const rows = await subscriptionRepository.findPaymentHistoryByUser(usuarioId);
  return rows.map((row) => ({
    id: row.pago_id,
    usuarioId: row.usuario_id,
    suscripcionId: row.suscripcion_id,
    planId: row.plan_id,
    planNombre: row.plan_nombre,
    tipo: row.tipo,
    monto: Number(row.monto),
    fecha: row.fecha,
    estado: row.estado,
    referencia: row.referencia,
    tarjetaUltimos4: row.tarjeta_ultimos4,
  }));
}

/**
 * Permite simular la composición dinámica del Patrón Decorator (DiagramaDecorator)
 * envolviendo PlanGratuito con cualquier secuencia de DecoradorPlanes.
 */
export function simulateDecoratorComposition({ decoradores = [], modoAditivoPuro = true }) {
  const pasos = [];
  let actual = new PlanGratuito();
  pasos.push({
    paso: 0,
    accion: 'Instancia base: new PlanGratuito()',
    resultado: actual.toJSON(),
  });

  const listaAcumulada = [];
  for (let i = 0; i < decoradores.length; i += 1) {
    listaAcumulada.push(decoradores[i]);
    const envuelto = construirCadenaDecoradores(listaAcumulada, { modoAditivoPuro });
    pasos.push({
      paso: i + 1,
      accion: `new ${envuelto.constructor.name}(wrappee)`,
      resultado: envuelto.toJSON(),
    });
    actual = envuelto;
  }

  return {
    planFinal: actual.toJSON(),
    pasos,
  };
}
