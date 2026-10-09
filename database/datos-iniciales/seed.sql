INSERT INTO rol (nombre)
VALUES
    ('Administrador'),
    ('Usuario')
ON CONFLICT (nombre) DO NOTHING;
