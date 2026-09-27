CREATE TABLE rol (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    nombre VARCHAR(50) NOT NULL,

    CONSTRAINT pk_rol
        PRIMARY KEY (id),

    CONSTRAINT uq_rol_nombre
        UNIQUE (nombre)
);

CREATE TABLE usuario (
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