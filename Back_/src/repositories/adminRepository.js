import { query } from '../config/db.js';

/**
 * Lista todas las cuentas de usuarios con su rol, consumo de almacenamiento,
 * conteo de recursos y su suscripción activa (si posee una).
 */
export async function findAllUsers() {
  const { rows } = await query(
    `SELECT
       u.id,
       u.nombre,
       u.correo,
       u.fecha_registro,
       u.correo_verificado,
       u.nivel_acceso,
       u.espacio_consumido,
       u.espacio_disponible,
       r.nombre AS rol_nombre,
       sa.suscripcion_id,
       sa.plan_id,
       sa.plan_nombre,
       sa.plan_precio,
       sa.fecha_inicio AS suscripcion_inicio,
       sa.fecha_renovacion AS suscripcion_renovacion,
       sa.dias_restantes,
       (SELECT COUNT(*) FROM archivo a WHERE a.usuario_id = u.id AND a.en_papelera = FALSE)::int AS total_archivos,
       (SELECT COUNT(*) FROM carpeta c WHERE c.usuario_id = u.id)::int AS total_carpetas
     FROM usuario u
     JOIN rol r ON r.id = u.rol_id
     LEFT JOIN v_suscripcion_actual sa ON sa.usuario_id = u.id
     ORDER BY u.id ASC`
  );
  return rows;
}

/**
 * Busca un usuario por ID con su información administrativa completa.
 */
export async function findUserById(id) {
  const { rows } = await query(
    `SELECT
       u.id,
       u.nombre,
       u.correo,
       u.fecha_registro,
       u.correo_verificado,
       u.nivel_acceso,
       u.espacio_consumido,
       u.espacio_disponible,
       r.nombre AS rol_nombre
     FROM usuario u
     JOIN rol r ON r.id = u.rol_id
     WHERE u.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

/**
 * Actualiza los datos administrativos de una cuenta de usuario (rol, cuota, verificación, nombre).
 */
export async function updateUserByAdmin(
  id,
  { nombre, rolNombre, nivelAcceso, correoVerificado, espacioDisponible }
) {
  const { rows } = await query(
    `UPDATE usuario u
     SET
       nombre = COALESCE($2, u.nombre),
       rol_id = COALESCE((SELECT id FROM rol WHERE nombre = $3), u.rol_id),
       nivel_acceso = COALESCE($4, u.nivel_acceso),
       correo_verificado = COALESCE($5, u.correo_verificado),
       espacio_disponible = COALESCE($6, u.espacio_disponible)
     WHERE u.id = $1
     RETURNING u.id`,
    [
      id,
      nombre ?? null,
      rolNombre ?? null,
      nivelAcceso ?? null,
      correoVerificado ?? null,
      espacioDisponible ?? null,
    ]
  );

  if (rows.length === 0) return null;
  return findUserById(id);
}

/**
 * Obtiene todos los archivos de un usuario (incluyendo papelera) para limpiar el disco antes de eliminar su cuenta.
 */
export async function findAllFilesByUser(usuarioId) {
  const { rows } = await query(
    'SELECT id, nombre, tamano FROM archivo WHERE usuario_id = $1',
    [usuarioId]
  );
  return rows;
}

/**
 * Elimina una cuenta de usuario por su ID (sus carpetas, archivos, suscripciones y pagos se eliminan en cascada).
 */
export async function deleteUserById(id) {
  const { rows } = await query(
    'DELETE FROM usuario WHERE id = $1 RETURNING id, nombre, correo',
    [id]
  );
  return rows[0] ?? null;
}

/**
 * Lista todos los planes del catálogo (activos e inactivos) con su conteo de suscripciones activas.
 */
export async function findAllPlans() {
  const { rows } = await query(
    `SELECT
       p.id,
       p.nombre,
       p.descripcion,
       p.precio,
       p.capacidad_almacenamiento,
       p.vigencia_dias,
       p.activo,
       (SELECT COUNT(*) FROM suscripcion s WHERE s.plan_id = p.id AND s.estado = 'activa')::int AS suscripciones_activas
     FROM plan p
     ORDER BY p.precio ASC, p.id ASC`
  );
  return rows;
}

/**
 * Busca un plan por su ID.
 */
export async function findPlanById(id) {
  const { rows } = await query(
    `SELECT id, nombre, descripcion, precio, capacidad_almacenamiento, vigencia_dias, activo
     FROM plan
     WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

/**
 * Crea un nuevo plan en el catálogo.
 */
export async function createPlan({
  nombre,
  descripcion,
  precio,
  capacidadAlmacenamiento,
  vigenciaDias,
  activo = true,
}) {
  const { rows } = await query(
    `INSERT INTO plan (nombre, descripcion, precio, capacidad_almacenamiento, vigencia_dias, activo)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, nombre, descripcion, precio, capacidad_almacenamiento, vigencia_dias, activo`,
    [nombre, descripcion, precio, capacidadAlmacenamiento, vigenciaDias, activo]
  );
  return rows[0];
}

/**
 * Actualiza un plan existente (incluyendo activación/desactivación mediante `activo`).
 */
export async function updatePlan(
  id,
  { nombre, descripcion, precio, capacidadAlmacenamiento, vigenciaDias, activo }
) {
  const { rows } = await query(
    `UPDATE plan
     SET
       nombre = COALESCE($2, nombre),
       descripcion = COALESCE($3, descripcion),
       precio = COALESCE($4, precio),
       capacidad_almacenamiento = COALESCE($5, capacidad_almacenamiento),
       vigencia_dias = COALESCE($6, vigencia_dias),
       activo = COALESCE($7, activo)
     WHERE id = $1
     RETURNING id, nombre, descripcion, precio, capacidad_almacenamiento, vigencia_dias, activo`,
    [
      id,
      nombre ?? null,
      descripcion ?? null,
      precio ?? null,
      capacidadAlmacenamiento ?? null,
      vigenciaDias ?? null,
      activo ?? null,
    ]
  );

  // Si cambió la capacidad del plan, sincronizar la cuota de quienes tienen ese plan activo
  if (rows[0] && capacidadAlmacenamiento !== undefined && capacidadAlmacenamiento !== null) {
    await query(
      `UPDATE usuario u
       SET espacio_disponible = $2
       FROM suscripcion s
       WHERE s.usuario_id = u.id
         AND s.plan_id = $1
         AND s.estado = 'activa'`,
      [id, capacidadAlmacenamiento]
    );
  }

  return rows[0] ?? null;
}

/**
 * Consulta la lista de planes asignados a cada usuario (Diagrama de Actividad:
 * "Administrador visualiza planes de usuarios").
 */
export async function findUserPlansList() {
  const { rows } = await query(
    `SELECT
       u.id AS usuario_id,
       u.nombre AS usuario_nombre,
       u.correo AS usuario_correo,
       r.nombre AS rol_nombre,
       u.espacio_consumido,
       u.espacio_disponible,
       sa.suscripcion_id,
       COALESCE(sa.plan_nombre, 'Gratuito (5 GB)') AS plan_nombre,
       COALESCE(sa.plan_precio, 0.00) AS plan_precio,
       COALESCE(sa.capacidad_almacenamiento, u.espacio_disponible) AS capacidad_plan,
       sa.fecha_inicio,
       sa.fecha_renovacion,
       sa.dias_restantes,
       CASE
         WHEN sa.suscripcion_id IS NOT NULL THEN 'activa'
         ELSE 'gratuito'
       END AS estado_plan
     FROM usuario u
     JOIN rol r ON r.id = u.rol_id
     LEFT JOIN v_suscripcion_actual sa ON sa.usuario_id = u.id
     ORDER BY u.id ASC`
  );
  return rows;
}

/**
 * Obtiene las métricas globales de la plataforma para el reporte general del servicio
 * (Clase UML `Reporte`: fechaGeneracion, usuariosActivos, espacioTotalConsumido, ingresosSimulados).
 */
export async function getServiceReportMetrics() {
  const [summaryRes, plansBreakdownRes, storageRes, recentPaymentsRes] = await Promise.all([
    query(`
      WITH pagos_resumen AS (
        SELECT
          COUNT(*) FILTER (WHERE estado = 'aprobado')::int AS total_pagos_aprobados,
          COALESCE(SUM(monto) FILTER (WHERE estado = 'aprobado'), 0.00)::numeric(12, 2) AS ingresos_pagos
        FROM pago
      ),
      suscripciones_mrr AS (
        SELECT
          COUNT(*)::int AS suscripciones_activas,
          COALESCE(SUM(p.precio), 0.00)::numeric(12, 2) AS ingresos_mensuales_activos
        FROM suscripcion s
        JOIN plan p ON p.id = s.plan_id
        WHERE s.estado = 'activa'
      )
      SELECT
        CURRENT_DATE AS fecha_generacion,
        (SELECT COUNT(*) FROM usuario)::int AS usuarios_activos,
        (SELECT COUNT(*) FROM usuario WHERE correo_verificado = TRUE)::int AS usuarios_verificados,
        (SELECT COALESCE(SUM(espacio_consumido), 0) FROM usuario)::bigint AS espacio_total_consumido,
        (SELECT COALESCE(SUM(espacio_disponible), 0) FROM usuario)::bigint AS espacio_total_disponible,
        (SELECT COUNT(*) FROM archivo WHERE en_papelera = FALSE)::int AS total_archivos,
        (SELECT COUNT(*) FROM carpeta WHERE en_papelera = FALSE)::int AS total_carpetas,
        sm.suscripciones_activas,
        pr.total_pagos_aprobados,
        pr.ingresos_pagos,
        sm.ingresos_mensuales_activos,
        GREATEST(pr.ingresos_pagos, sm.ingresos_mensuales_activos)::numeric(12, 2) AS ingresos_simulados
      FROM pagos_resumen pr
      CROSS JOIN suscripciones_mrr sm
    `),
    query(`
      SELECT
        p.id,
        p.nombre,
        p.precio,
        p.capacidad_almacenamiento,
        p.activo,
        COUNT(DISTINCT s.id) FILTER (WHERE s.estado = 'activa')::int AS usuarios_suscritos,
        COALESCE(SUM(pg.monto) FILTER (WHERE pg.estado = 'aprobado'), 0.00)::numeric(12, 2) AS ingresos_plan
      FROM plan p
      LEFT JOIN suscripcion s ON s.plan_id = p.id
      LEFT JOIN pago pg ON pg.suscripcion_id = s.id
      GROUP BY p.id
      ORDER BY p.precio ASC, p.id ASC
    `),
    // Lo que ocupan de verdad los archivos en el almacenamiento (también los de la papelera,
    // que siguen guardados hasta eliminarse definitivamente)
    query(`
      WITH RECURSIVE ocultas AS (
        SELECT id FROM carpeta WHERE en_papelera = TRUE
        UNION
        SELECT c.id FROM carpeta c INNER JOIN ocultas o ON c.carpeta_padre_id = o.id
      )
      SELECT
        COALESCE(SUM(tamano), 0)::bigint AS bytes_almacenados,
        COALESCE(SUM(tamano) FILTER (
          WHERE en_papelera OR carpeta_id IN (SELECT id FROM ocultas)
        ), 0)::bigint AS bytes_en_papelera,
        COUNT(*) FILTER (
          WHERE en_papelera OR carpeta_id IN (SELECT id FROM ocultas)
        )::int AS archivos_en_papelera
      FROM archivo
    `),
    query(`
      SELECT
        pg.id AS pago_id,
        pg.usuario_id,
        u.nombre AS usuario_nombre,
        u.correo AS usuario_correo,
        p.id AS plan_id,
        p.nombre AS plan_nombre,
        pg.tipo,
        pg.monto,
        pg.fecha,
        pg.estado,
        pg.referencia,
        pg.tarjeta_ultimos4
      FROM pago pg
      JOIN usuario u ON u.id = pg.usuario_id
      JOIN suscripcion s ON s.id = pg.suscripcion_id
      JOIN plan p ON p.id = s.plan_id
      ORDER BY pg.fecha DESC
      LIMIT 10
    `),
  ]);

  return {
    summary: summaryRes.rows[0],
    plansBreakdown: plansBreakdownRes.rows,
    storage: storageRes.rows[0],
    recentPayments: recentPaymentsRes.rows,
  };
}
