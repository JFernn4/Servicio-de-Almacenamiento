CREATE TABLE IF NOT EXISTS rol (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    nombre VARCHAR(50) NOT NULL,

    CONSTRAINT pk_rol
        PRIMARY KEY (id),

    CONSTRAINT uq_rol_nombre
        UNIQUE (nombre)
);

CREATE TABLE IF NOT EXISTS usuario (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    rol_id INTEGER NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE,
    correo_verificado BOOLEAN NOT NULL DEFAULT FALSE,
    nivel_acceso VARCHAR(50) NOT NULL,
    espacio_consumido BIGINT NOT NULL DEFAULT 0,
    espacio_disponible BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT pk_usuario
        PRIMARY KEY (id),

    CONSTRAINT uq_usuario_correo
        UNIQUE (correo),

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (rol_id)
        REFERENCES rol(id),

    CONSTRAINT chk_usuario_espacio_consumido
        CHECK (espacio_consumido >= 0),

    CONSTRAINT chk_usuario_espacio_disponible
        CHECK (espacio_disponible >= 0)
);

-- ============================================================================
-- MÓDULO DE ALMACENAMIENTO DE INFORMACIÓN (CARPETAS Y ARCHIVOS)
-- Según diagramas: modeloRelacional.png, entidadRelacion.png y Diagrama de Clases
-- ============================================================================

CREATE TABLE IF NOT EXISTS carpeta (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    usuario_id INTEGER NOT NULL,
    carpeta_padre_id INTEGER,
    nombre VARCHAR(255) NOT NULL,
    fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT pk_carpeta
        PRIMARY KEY (id),

    CONSTRAINT fk_carpeta_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuario(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_carpeta_padre
        FOREIGN KEY (carpeta_padre_id)
        REFERENCES carpeta(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS archivo (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    usuario_id INTEGER NOT NULL,
    carpeta_id INTEGER,
    nombre VARCHAR(255) NOT NULL,
    tamano BIGINT NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    fecha_subida DATE NOT NULL DEFAULT CURRENT_DATE,
    en_papelera BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_eliminacion DATE,

    CONSTRAINT pk_archivo
        PRIMARY KEY (id),

    CONSTRAINT fk_archivo_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuario(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_archivo_carpeta
        FOREIGN KEY (carpeta_id)
        REFERENCES carpeta(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_archivo_tamano
        CHECK (tamano >= 0)
);

ALTER TABLE archivo ADD COLUMN IF NOT EXISTS en_papelera BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE archivo ADD COLUMN IF NOT EXISTS fecha_eliminacion DATE;

CREATE INDEX IF NOT EXISTS idx_carpeta_usuario_id ON carpeta(usuario_id);
CREATE INDEX IF NOT EXISTS idx_carpeta_padre_id ON carpeta(carpeta_padre_id);
CREATE INDEX IF NOT EXISTS idx_archivo_usuario_id ON archivo(usuario_id);
CREATE INDEX IF NOT EXISTS idx_archivo_carpeta_id ON archivo(carpeta_id);
CREATE INDEX IF NOT EXISTS idx_archivo_papelera ON archivo(usuario_id, en_papelera);

-- ============================================================================
-- MÓDULO DE PLANES, SUSCRIPCIONES Y PAGOS (Avance 2 - 50%)
-- Según diagramas: modeloRelacional.png y entidadRelacion.png
-- ============================================================================

-- Catálogo de planes. Los planes no se borran (los referencian suscripciones y
-- pagos): se desactivan con `activo = FALSE` para quitarlos del catálogo.
CREATE TABLE IF NOT EXISTS plan (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    capacidad_almacenamiento BIGINT NOT NULL,
    vigencia_dias INTEGER NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT pk_plan
        PRIMARY KEY (id),

    CONSTRAINT uq_plan_nombre
        UNIQUE (nombre),

    CONSTRAINT chk_plan_precio
        CHECK (precio >= 0),

    CONSTRAINT chk_plan_capacidad
        CHECK (capacidad_almacenamiento > 0),

    CONSTRAINT chk_plan_vigencia
        CHECK (vigencia_dias > 0)
);

-- Plan contratado por un usuario. Las filas no se borran al cancelar o vencer:
-- cambian de estado, y así queda el historial de suscripciones del usuario.
--   pendiente -> creada, esperando que se apruebe el pago
--   activa    -> pagada y vigente (máximo una por usuario)
--   vencida   -> pasó la fecha de renovación sin renovar
--   cancelada -> cancelada por el usuario o reemplazada por otro plan
CREATE TABLE IF NOT EXISTS suscripcion (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    usuario_id INTEGER NOT NULL,
    plan_id INTEGER NOT NULL,
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_renovacion DATE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',

    CONSTRAINT pk_suscripcion
        PRIMARY KEY (id),

    -- Permite que `pago` verifique que el pago y la suscripción son del mismo usuario
    CONSTRAINT uq_suscripcion_id_usuario
        UNIQUE (id, usuario_id),

    CONSTRAINT fk_suscripcion_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuario(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_suscripcion_plan
        FOREIGN KEY (plan_id)
        REFERENCES plan(id),

    CONSTRAINT chk_suscripcion_estado
        CHECK (estado IN ('pendiente', 'activa', 'vencida', 'cancelada')),

    CONSTRAINT chk_suscripcion_fechas
        CHECK (fecha_renovacion > fecha_inicio)
);

-- Un usuario solo puede tener una suscripción activa a la vez
CREATE UNIQUE INDEX IF NOT EXISTS uq_suscripcion_activa_por_usuario
    ON suscripcion (usuario_id)
    WHERE estado = 'activa';

-- Transacciones (pagos simulados). Cada contratación o renovación genera un pago;
-- se guardan también los rechazados, así el historial queda completo.
-- Nunca se guarda el número de tarjeta: solo sus últimos 4 dígitos.
--   pendiente -> enviado a la pasarela, sin respuesta todavía
--   aprobado  -> cobrado
--   rechazado -> la pasarela lo rechazó
CREATE TABLE IF NOT EXISTS pago (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    usuario_id INTEGER NOT NULL,
    suscripcion_id INTEGER NOT NULL,
    monto NUMERIC(10, 2) NOT NULL,
    fecha TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    tipo VARCHAR(20) NOT NULL,
    referencia VARCHAR(50),
    tarjeta_ultimos4 CHAR(4),

    CONSTRAINT pk_pago
        PRIMARY KEY (id),

    CONSTRAINT fk_pago_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuario(id)
        ON DELETE CASCADE,

    -- El pago debe pertenecer al mismo usuario que la suscripción
    CONSTRAINT fk_pago_suscripcion
        FOREIGN KEY (suscripcion_id, usuario_id)
        REFERENCES suscripcion(id, usuario_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_pago_referencia
        UNIQUE (referencia),

    CONSTRAINT chk_pago_monto
        CHECK (monto > 0),

    CONSTRAINT chk_pago_estado
        CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),

    CONSTRAINT chk_pago_tipo
        CHECK (tipo IN ('contratacion', 'renovacion')),

    CONSTRAINT chk_pago_tarjeta_ultimos4
        CHECK (tarjeta_ultimos4 ~ '^[0-9]{4}$')
);

ALTER TABLE plan ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE pago ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) NOT NULL DEFAULT 'contratacion';
ALTER TABLE pago ADD COLUMN IF NOT EXISTS referencia VARCHAR(50);
ALTER TABLE pago ADD COLUMN IF NOT EXISTS tarjeta_ultimos4 CHAR(4);

CREATE INDEX IF NOT EXISTS idx_suscripcion_usuario_id ON suscripcion(usuario_id);
CREATE INDEX IF NOT EXISTS idx_suscripcion_plan_id ON suscripcion(plan_id);
CREATE INDEX IF NOT EXISTS idx_pago_usuario_fecha ON pago(usuario_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_pago_suscripcion_id ON pago(suscripcion_id);

-- ----------------------------------------------------------------------------
-- Vistas de consulta para el backend
-- ----------------------------------------------------------------------------

-- Historial de pagos con el plan y el usuario (para "Historial de pagos").
-- Uso: SELECT * FROM v_historial_pagos WHERE usuario_id = $1 ORDER BY fecha DESC;
CREATE OR REPLACE VIEW v_historial_pagos AS
SELECT
    pg.id AS pago_id,
    pg.usuario_id,
    u.nombre AS usuario_nombre,
    u.correo AS usuario_correo,
    pg.suscripcion_id,
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
JOIN plan p ON p.id = s.plan_id;

-- Suscripción activa de cada usuario con los datos de su plan (para "Mi suscripción").
-- Uso: SELECT * FROM v_suscripcion_actual WHERE usuario_id = $1;
CREATE OR REPLACE VIEW v_suscripcion_actual AS
SELECT
    s.id AS suscripcion_id,
    s.usuario_id,
    s.fecha_inicio,
    s.fecha_renovacion,
    (s.fecha_renovacion - CURRENT_DATE) AS dias_restantes,
    p.id AS plan_id,
    p.nombre AS plan_nombre,
    p.precio AS plan_precio,
    p.capacidad_almacenamiento,
    p.vigencia_dias
FROM suscripcion s
JOIN plan p ON p.id = s.plan_id
WHERE s.estado = 'activa';
