INSERT INTO rol (nombre)
VALUES
    ('Administrador'),
    ('Usuario')
ON CONFLICT (nombre) DO NOTHING;


-- Catálogo inicial de planes (capacidad en bytes, precio en quetzales).
-- El plan gratuito de 5 GB no es una fila: es la capacidad por defecto de
-- usuario.espacio_disponible para quien no tiene una suscripción activa.
INSERT INTO plan (nombre, descripcion, precio, capacidad_almacenamiento, vigencia_dias)
VALUES
    ('Básico', 'Para uso personal: respalda documentos y fotos.', 25.00, 53687091200, 30),       -- 50 GB
    ('Profesional', 'Para freelancers y equipos pequeños.', 60.00, 214748364800, 30),            -- 200 GB
    ('Empresarial', 'Gran capacidad para equipos y empresas.', 150.00, 1099511627776, 30)        -- 1 TB
ON CONFLICT (nombre) DO NOTHING;
