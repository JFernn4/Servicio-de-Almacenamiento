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

    CONSTRAINT pk_archivo
        PRIMARY KEY (id),

    CONSTRAINT fk_archivo_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuario(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_archivo_carpeta
        FOREIGN KEY (carpeta_id)
        REFERENCES carpeta(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_archivo_tamano
        CHECK (tamano >= 0)
);

CREATE INDEX IF NOT EXISTS idx_carpeta_usuario_id ON carpeta(usuario_id);
CREATE INDEX IF NOT EXISTS idx_carpeta_padre_id ON carpeta(carpeta_padre_id);
CREATE INDEX IF NOT EXISTS idx_archivo_usuario_id ON archivo(usuario_id);
CREATE INDEX IF NOT EXISTS idx_archivo_carpeta_id ON archivo(carpeta_id);

-- ============================================================================
-- MÓDULO DE PLANES, SUSCRIPCIONES Y PAGOS
-- Según diagramas: modeloRelacional.png y entidadRelacion.png
-- ============================================================================

CREATE TABLE IF NOT EXISTS plan (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    capacidad_almacenamiento BIGINT NOT NULL,
    vigencia_dias INTEGER NOT NULL,

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

CREATE TABLE IF NOT EXISTS suscripcion (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    usuario_id INTEGER NOT NULL,
    plan_id INTEGER NOT NULL,
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_renovacion DATE NOT NULL,
    estado VARCHAR(50) NOT NULL,

    CONSTRAINT pk_suscripcion
        PRIMARY KEY (id),

    CONSTRAINT fk_suscripcion_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuario(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_suscripcion_plan
        FOREIGN KEY (plan_id)
        REFERENCES plan(id)
);

CREATE TABLE IF NOT EXISTS pago (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    usuario_id INTEGER NOT NULL,
    suscripcion_id INTEGER NOT NULL,
    monto NUMERIC(10, 2) NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    estado VARCHAR(50) NOT NULL,

    CONSTRAINT pk_pago
        PRIMARY KEY (id),

    CONSTRAINT fk_pago_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuario(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_pago_suscripcion
        FOREIGN KEY (suscripcion_id)
        REFERENCES suscripcion(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_pago_monto
        CHECK (monto >= 0)
);

CREATE INDEX IF NOT EXISTS idx_suscripcion_usuario_id ON suscripcion(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pago_usuario_id ON pago(usuario_id);