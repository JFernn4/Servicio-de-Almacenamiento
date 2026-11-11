-- ============================================================================
-- SCRIPT DE MANTENIMIENTO: PURGA AUTOMÁTICA DE PAPELERA (> 30 DÍAS)
-- Proyecto: VinCloud - Servicio de Almacenamiento en la Nube
-- ============================================================================
-- Este script define la función almacenada para eliminar definitivamente los
-- registros de archivos que lleven más de 30 días en la papelera y recalcular
-- de forma consistente el espacio consumido (espacio_consumido) de los usuarios.
-- ============================================================================

-- 1. Función para purgar archivos vencidos en papelera
CREATE OR REPLACE FUNCTION fn_purgar_papelera_30_dias(p_dias_retencion INT DEFAULT 30)
RETURNS TABLE (
    archivos_purgados INT,
    bytes_liberados BIGINT
) LANGUAGE plpgsql AS $$
DECLARE
    v_archivos_count INT := 0;
    v_bytes_liberados BIGINT := 0;
BEGIN
    -- 1a. Decrementar el espacio consumido de los usuarios afectados restando el
    -- tamaño de los archivos que van a ser eliminados
    WITH archivos_a_purgar AS (
        SELECT usuario_id, SUM(tamano) AS total_bytes
        FROM archivo
        WHERE en_papelera = TRUE
          AND fecha_eliminacion <= (CURRENT_DATE - (p_dias_retencion || ' days')::interval)::date
        GROUP BY usuario_id
    )
    UPDATE usuario u
    SET espacio_consumido = GREATEST(0, u.espacio_consumido - ap.total_bytes)
    FROM archivos_a_purgar ap
    WHERE u.id = ap.usuario_id;

    -- 1b. Eliminar definitivamente los registros de la tabla archivo
    WITH eliminados AS (
        DELETE FROM archivo
        WHERE en_papelera = TRUE
          AND fecha_eliminacion <= (CURRENT_DATE - (p_dias_retencion || ' days')::interval)::date
        RETURNING id, tamano
    )
    SELECT
        COUNT(*)::INT,
        COALESCE(SUM(tamano), 0)::BIGINT
    INTO
        v_archivos_count,
        v_bytes_liberados
    FROM eliminados;

    RETURN QUERY SELECT v_archivos_count, v_bytes_liberados;
END;
$$;

-- 2. Ejemplo de ejecución manual en PostgreSQL:
-- SELECT * FROM fn_purgar_papelera_30_dias(30);

-- 3. (Opcional) Si la extensión pg_cron está habilitada en el servidor PostgreSQL:
-- SELECT cron.schedule('purga_papelera_diaria', '0 3 * * *', 'SELECT fn_purgar_papelera_30_dias(30);');

-- 4. Consulta de monitoreo para auditar archivos en papelera y días transcurridos:
-- SELECT
--     a.id,
--     a.usuario_id,
--     u.correo,
--     a.nombre,
--     a.tamano,
--     a.fecha_eliminacion,
--     CURRENT_DATE - a.fecha_eliminacion AS dias_en_papelera,
--     CASE
--         WHEN (CURRENT_DATE - a.fecha_eliminacion) >= 30 THEN 'Vencido (Listo para purgar)'
--         ELSE (30 - (CURRENT_DATE - a.fecha_eliminacion)) || ' días restantes'
--     END AS estado_retencion
-- FROM archivo a
-- JOIN usuario u ON u.id = a.usuario_id
-- WHERE a.en_papelera = TRUE
-- ORDER BY a.fecha_eliminacion ASC;
