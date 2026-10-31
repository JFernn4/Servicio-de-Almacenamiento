import { query, withTransaction } from '../config/db.js';
import { DEFAULT_STORAGE_QUOTA_BYTES } from '../config/constants.js';

/**
 * Marca como 'vencida' cualquier suscripción activa cuya fecha_renovacion haya expirado
 * y restablece el espacio disponible del usuario al PlanGratuito (5 GB).
 */
export async function expireOverdueSubscriptions(usuarioId = null) {
  return withTransaction(async (client) => {
    const params = [];
    let filterSql = '';

    if (usuarioId !== null && usuarioId !== undefined) {
      params.push(usuarioId);
      filterSql = 'AND usuario_id = $1';
    }

    const { rows: expiredRows } = await client.query(
      `UPDATE suscripcion
       SET estado = 'vencida'
       WHERE estado = 'activa'
         AND fecha_renovacion < CURRENT_DATE
         ${filterSql}
       RETURNING id, usuario_id`,
      params
    );

    if (expiredRows.length > 0) {
      const affectedUserIds = [...new Set(expiredRows.map((r) => r.usuario_id))];
      await client.query(
        `UPDATE usuario
         SET espacio_disponible = $1
         WHERE id = ANY($2::int[])
           AND NOT EXISTS (
             SELECT 1 FROM suscripcion s
             WHERE s.usuario_id = usuario.id AND s.estado = 'activa'
           )`,
        [DEFAULT_STORAGE_QUOTA_BYTES, affectedUserIds]
      );
    }

    return expiredRows;
  });
}

/**
 * Lista todos los planes activos del catálogo ordenados por precio.
 */
export async function findActivePlans() {
  const { rows } = await query(
    `SELECT id, nombre, descripcion, precio, capacidad_almacenamiento, vigencia_dias, activo
     FROM plan
     WHERE activo = TRUE
     ORDER BY precio ASC, id ASC`
  );
  return rows;
}

/**
 * Busca un plan por su ID.
 */
export async function findPlanById(planId) {
  const { rows } = await query(
    `SELECT id, nombre, descripcion, precio, capacidad_almacenamiento, vigencia_dias, activo
     FROM plan
     WHERE id = $1`,
    [planId]
  );
  return rows[0] ?? null;
}

/**
 * Obtiene la suscripción activa del usuario desde la vista v_suscripcion_actual,
 * enriquecida con la descripción del plan.
 */
export async function findCurrentSubscriptionByUser(usuarioId) {
  const { rows } = await query(
    `SELECT
       sa.suscripcion_id,
       sa.usuario_id,
       sa.fecha_inicio,
       sa.fecha_renovacion,
       sa.dias_restantes,
       sa.plan_id,
       sa.plan_nombre,
       sa.plan_precio,
       sa.capacidad_almacenamiento,
       sa.vigencia_dias,
       p.descripcion AS plan_descripcion
     FROM v_suscripcion_actual sa
     JOIN plan p ON p.id = sa.plan_id
     WHERE sa.usuario_id = $1`,
    [usuarioId]
  );
  return rows[0] ?? null;
}

/**
 * Obtiene el historial completo de suscripciones del usuario (activas, canceladas, vencidas, pendientes).
 */
export async function findSubscriptionHistoryByUser(usuarioId) {
  const { rows } = await query(
    `SELECT
       s.id,
       s.usuario_id,
       s.plan_id,
       p.nombre AS plan_nombre,
       p.descripcion AS plan_descripcion,
       p.precio AS plan_precio,
       p.capacidad_almacenamiento,
       p.vigencia_dias,
       s.fecha_inicio,
       s.fecha_renovacion,
       s.estado
     FROM suscripcion s
     JOIN plan p ON p.id = s.plan_id
     WHERE s.usuario_id = $1
     ORDER BY s.id DESC`,
    [usuarioId]
  );
  return rows;
}

/**
 * Obtiene el historial de pagos del usuario desde la vista v_historial_pagos.
 */
export async function findPaymentHistoryByUser(usuarioId) {
  const { rows } = await query(
    `SELECT
       pago_id,
       usuario_id,
       usuario_nombre,
       usuario_correo,
       suscripcion_id,
       plan_id,
       plan_nombre,
       tipo,
       monto,
       fecha,
       estado,
       referencia,
       tarjeta_ultimos4
     FROM v_historial_pagos
     WHERE usuario_id = $1
     ORDER BY fecha DESC, pago_id DESC`,
    [usuarioId]
  );
  return rows;
}

/**
 * Ejecuta la transacción ACID para contratar o cambiar de plan según modelo-datos-avance2.md:
 * 1. Crea suscripción en estado 'pendiente'.
 * 2. Crea pago en estado 'pendiente' con tipo 'contratacion'.
 * 3. Si el pago es aprobado:
 *    - Actualiza el pago a 'aprobado'.
 *    - Cancela la suscripción 'activa' previa (si existía).
 *    - Activa la nueva suscripción.
 *    - Actualiza usuario.espacio_disponible con el valor del Decorador (planDecorado.almacenamiento()).
 * 4. Si el pago es rechazado:
 *    - Actualiza el pago a 'rechazado' y la suscripción a 'cancelada' (dejando trazabilidad en el historial).
 */
export async function contractOrChangeSubscriptionTransaction({
  usuarioId,
  planId,
  vigenciaDias,
  monto,
  referencia,
  tarjetaUltimos4,
  aprobado,
  nuevaCapacidadBytes,
}) {
  return withTransaction(async (client) => {
    // 1. Insertar suscripción en estado 'pendiente'
    const { rows: subRows } = await client.query(
      `INSERT INTO suscripcion (usuario_id, plan_id, fecha_inicio, fecha_renovacion, estado)
       VALUES ($1, $2, CURRENT_DATE, (CURRENT_DATE + ($3 || ' days')::interval)::date, 'pendiente')
       RETURNING *`,
      [usuarioId, planId, vigenciaDias]
    );
    const nuevaSuscripcion = subRows[0];

    // 2. Insertar pago en estado 'pendiente'
    const { rows: pagoRows } = await client.query(
      `INSERT INTO pago (usuario_id, suscripcion_id, monto, tipo, estado)
       VALUES ($1, $2, $3, 'contratacion', 'pendiente')
       RETURNING *`,
      [usuarioId, nuevaSuscripcion.id, monto]
    );
    const pagoPendiente = pagoRows[0];

    if (aprobado) {
      // 3a. Aprobar pago
      const { rows: pagoAprobadoRows } = await client.query(
        `UPDATE pago
         SET estado = 'aprobado', referencia = $1, tarjeta_ultimos4 = $2
         WHERE id = $3
         RETURNING *`,
        [referencia, tarjetaUltimos4, pagoPendiente.id]
      );

      // 3b. Si había otra suscripción activa, pasarla a 'cancelada'
      await client.query(
        `UPDATE suscripcion
         SET estado = 'cancelada'
         WHERE usuario_id = $1 AND estado = 'activa' AND id <> $2`,
        [usuarioId, nuevaSuscripcion.id]
      );

      // 3c. Activar la nueva suscripción
      const { rows: subActivaRows } = await client.query(
        `UPDATE suscripcion
         SET estado = 'activa'
         WHERE id = $1
         RETURNING *`,
        [nuevaSuscripcion.id]
      );

      // 3d. Actualizar capacidad del usuario calculada con el Patrón Decorator
      const { rows: userRows } = await client.query(
        `UPDATE usuario
         SET espacio_disponible = $1
         WHERE id = $2
         RETURNING id, espacio_consumido, espacio_disponible`,
        [nuevaCapacidadBytes, usuarioId]
      );

      return {
        aprobado: true,
        suscripcion: subActivaRows[0],
        pago: pagoAprobadoRows[0],
        usuarioQuota: userRows[0],
      };
    }

    // 4. Si la pasarela rechaza: guardar como rechazado/cancelada para historial
    const { rows: pagoRechazadoRows } = await client.query(
      `UPDATE pago
       SET estado = 'rechazado', referencia = $1, tarjeta_ultimos4 = $2
       WHERE id = $3
       RETURNING *`,
      [referencia, tarjetaUltimos4, pagoPendiente.id]
    );

    const { rows: subCanceladaRows } = await client.query(
      `UPDATE suscripcion
       SET estado = 'cancelada'
       WHERE id = $1
       RETURNING *`,
      [nuevaSuscripcion.id]
    );

    return {
      aprobado: false,
      suscripcion: subCanceladaRows[0],
      pago: pagoRechazadoRows[0],
      usuarioQuota: null,
    };
  });
}

/**
 * Ejecuta la transacción ACID para renovar la suscripción activa del usuario.
 */
export async function renewSubscriptionTransaction({
  usuarioId,
  suscripcionId,
  vigenciaDias,
  monto,
  referencia,
  tarjetaUltimos4,
  aprobado,
  nuevaCapacidadBytes,
}) {
  return withTransaction(async (client) => {
    const { rows: pagoRows } = await client.query(
      `INSERT INTO pago (usuario_id, suscripcion_id, monto, tipo, estado)
       VALUES ($1, $2, $3, 'renovacion', 'pendiente')
       RETURNING *`,
      [usuarioId, suscripcionId, monto]
    );
    const pagoPendiente = pagoRows[0];

    if (aprobado) {
      const { rows: pagoAprobadoRows } = await client.query(
        `UPDATE pago
         SET estado = 'aprobado', referencia = $1, tarjeta_ultimos4 = $2
         WHERE id = $3
         RETURNING *`,
        [referencia, tarjetaUltimos4, pagoPendiente.id]
      );

      const { rows: subRenovadaRows } = await client.query(
        `UPDATE suscripcion
         SET fecha_renovacion = (GREATEST(fecha_renovacion, CURRENT_DATE) + ($1 || ' days')::interval)::date
         WHERE id = $2 AND usuario_id = $3
         RETURNING *`,
        [vigenciaDias, suscripcionId, usuarioId]
      );

      const { rows: userRows } = await client.query(
        `UPDATE usuario
         SET espacio_disponible = $1
         WHERE id = $2
         RETURNING id, espacio_consumido, espacio_disponible`,
        [nuevaCapacidadBytes, usuarioId]
      );

      return {
        aprobado: true,
        suscripcion: subRenovadaRows[0],
        pago: pagoAprobadoRows[0],
        usuarioQuota: userRows[0],
      };
    }

    const { rows: pagoRechazadoRows } = await client.query(
      `UPDATE pago
       SET estado = 'rechazado', referencia = $1, tarjeta_ultimos4 = $2
       WHERE id = $3
       RETURNING *`,
      [referencia, tarjetaUltimos4, pagoPendiente.id]
    );

    const { rows: subActualRows } = await client.query(
      `SELECT * FROM suscripcion WHERE id = $1`,
      [suscripcionId]
    );

    return {
      aprobado: false,
      suscripcion: subActualRows[0],
      pago: pagoRechazadoRows[0],
      usuarioQuota: null,
    };
  });
}

/**
 * Cancela la suscripción activa del usuario y restablece su cuota al PlanGratuito (5 GB).
 */
export async function cancelActiveSubscriptionTransaction({ usuarioId, capacidadGratuitaBytes }) {
  return withTransaction(async (client) => {
    const { rows: canceladas } = await client.query(
      `UPDATE suscripcion
       SET estado = 'cancelada'
       WHERE usuario_id = $1 AND estado = 'activa'
       RETURNING *`,
      [usuarioId]
    );

    if (canceladas.length === 0) {
      return null;
    }

    const { rows: userRows } = await client.query(
      `UPDATE usuario
       SET espacio_disponible = $1
       WHERE id = $2
       RETURNING id, espacio_consumido, espacio_disponible`,
      [capacidadGratuitaBytes, usuarioId]
    );

    return {
      suscripcion: canceladas[0],
      usuarioQuota: userRows[0],
    };
  });
}
