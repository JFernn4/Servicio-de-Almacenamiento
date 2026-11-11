-- ============================================================================
-- ARCHIVO TEMPORAL: Auto-validación de correos en PostgreSQL
-- Propósito: Suspender el bloqueo de verificación de correo en producción.
--            Hace que todas las cuentas nuevas y existentes queden validadas
--            automáticamente al crearse.
-- ============================================================================

-- 1. Validar todas las cuentas ya creadas actualmente
UPDATE usuario 
SET correo_verificado = TRUE;

-- 2. Cambiar el valor por defecto de la columna a TRUE para nuevas inserciones
ALTER TABLE usuario 
ALTER COLUMN correo_verificado SET DEFAULT TRUE;

-- 3. Crear función y trigger para forzar correo_verificado = TRUE en cada nuevo registro
CREATE OR REPLACE FUNCTION trg_auto_verificar_correo_fn()
RETURNS TRIGGER AS $$
BEGIN
    NEW.correo_verificado := TRUE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_verificar_correo ON usuario;
CREATE TRIGGER trg_auto_verificar_correo
BEFORE INSERT ON usuario
FOR EACH ROW
EXECUTE FUNCTION trg_auto_verificar_correo_fn();

-- ============================================================================
-- INSTRUCCIONES PARA REVERTIR (Cuando borres este archivo temporal):
-- ============================================================================
-- DROP TRIGGER IF EXISTS trg_auto_verificar_correo ON usuario;
-- DROP FUNCTION IF EXISTS trg_auto_verificar_correo_fn();
-- ALTER TABLE usuario ALTER COLUMN correo_verificado SET DEFAULT FALSE;
-- ============================================================================
