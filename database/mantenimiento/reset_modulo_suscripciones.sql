-- ============================================================================
-- SOLO PARA DESARROLLO: borra el módulo de planes, suscripciones y pagos
-- para volver a crearlo con la versión actual de schema.sql.
--
-- Cuándo usarlo: si ya tenías las tablas plan / suscripcion / pago creadas con
-- una versión anterior. schema.sql usa CREATE TABLE IF NOT EXISTS, así que no
-- modifica tablas que ya existen.
--
-- ⚠ BORRA todos los planes, suscripciones y pagos. No toca usuarios, roles,
--   carpetas ni archivos.
--
-- Uso (desde psql o pgAdmin, conectado a almacenamiento_db):
--   \i database/mantenimiento/reset_modulo_suscripciones.sql
-- y después, en Back_:  npm run db:init
-- ============================================================================

BEGIN;

DROP VIEW IF EXISTS v_historial_pagos;
DROP VIEW IF EXISTS v_suscripcion_actual;
DROP TABLE IF EXISTS pago;
DROP TABLE IF EXISTS suscripcion;
DROP TABLE IF EXISTS plan;

-- Quien no tiene suscripción vuelve a la capacidad gratuita por defecto (5 GB)
UPDATE usuario
SET espacio_disponible = 5368709120;

COMMIT;
