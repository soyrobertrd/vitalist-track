-- Script para reagendar llamadas y visitas a partir del 15 de diciembre 2024
-- Máximo 10 llamadas y 5 visitas por día (lunes a viernes)

-- ============================================
-- REAGENDAR LLAMADAS
-- ============================================

DO $$
DECLARE
    v_fecha_inicio DATE := '2024-12-15'::DATE;
    v_fecha_actual DATE;
    v_llamadas_dia INT := 0;
    v_max_llamadas_dia INT := 10;
    v_llamada RECORD;
    v_hora_base TIME := '08:00:00';
    v_intervalo_minutos INT := 30;
BEGIN
    v_fecha_actual := v_fecha_inicio;
    
    -- Recorrer todas las llamadas agendadas/pendientes
    FOR v_llamada IN 
        SELECT id, fecha_agendada 
        FROM registro_llamadas 
        WHERE estado IN ('agendada', 'pendiente')
        ORDER BY fecha_agendada ASC NULLS LAST, created_at ASC
    LOOP
        -- Si llegamos al máximo de llamadas del día, pasar al siguiente día laborable
        WHILE v_llamadas_dia >= v_max_llamadas_dia LOOP
            v_fecha_actual := v_fecha_actual + INTERVAL '1 day';
            -- Saltar fines de semana
            WHILE EXTRACT(DOW FROM v_fecha_actual) IN (0, 6) LOOP
                v_fecha_actual := v_fecha_actual + INTERVAL '1 day';
            END LOOP;
            v_llamadas_dia := 0;
        END LOOP;
        
        -- Saltar fines de semana
        WHILE EXTRACT(DOW FROM v_fecha_actual) IN (0, 6) LOOP
            v_fecha_actual := v_fecha_actual + INTERVAL '1 day';
        END LOOP;
        
        -- Calcular hora de la llamada
        UPDATE registro_llamadas
        SET fecha_agendada = v_fecha_actual + (v_hora_base + (v_llamadas_dia * v_intervalo_minutos * INTERVAL '1 minute'))
        WHERE id = v_llamada.id;
        
        v_llamadas_dia := v_llamadas_dia + 1;
    END LOOP;
    
    RAISE NOTICE 'Llamadas reagendadas exitosamente';
END $$;

-- ============================================
-- REAGENDAR VISITAS
-- ============================================

DO $$
DECLARE
    v_fecha_inicio DATE := '2024-12-15'::DATE;
    v_fecha_actual DATE;
    v_visitas_dia INT := 0;
    v_max_visitas_dia INT := 5;
    v_visita RECORD;
    v_hora_base TIME := '09:00:00';
    v_intervalo_minutos INT := 60;
BEGIN
    v_fecha_actual := v_fecha_inicio;
    
    -- Recorrer todas las visitas pendientes
    FOR v_visita IN 
        SELECT id, fecha_hora_visita 
        FROM control_visitas 
        WHERE estado = 'pendiente'
        ORDER BY fecha_hora_visita ASC, created_at ASC
    LOOP
        -- Si llegamos al máximo de visitas del día, pasar al siguiente día laborable
        WHILE v_visitas_dia >= v_max_visitas_dia LOOP
            v_fecha_actual := v_fecha_actual + INTERVAL '1 day';
            -- Saltar fines de semana
            WHILE EXTRACT(DOW FROM v_fecha_actual) IN (0, 6) LOOP
                v_fecha_actual := v_fecha_actual + INTERVAL '1 day';
            END LOOP;
            v_visitas_dia := 0;
        END LOOP;
        
        -- Saltar fines de semana
        WHILE EXTRACT(DOW FROM v_fecha_actual) IN (0, 6) LOOP
            v_fecha_actual := v_fecha_actual + INTERVAL '1 day';
        END LOOP;
        
        -- Calcular hora de la visita
        UPDATE control_visitas
        SET fecha_hora_visita = v_fecha_actual + (v_hora_base + (v_visitas_dia * v_intervalo_minutos * INTERVAL '1 minute'))
        WHERE id = v_visita.id;
        
        v_visitas_dia := v_visitas_dia + 1;
    END LOOP;
    
    RAISE NOTICE 'Visitas reagendadas exitosamente';
END $$;

-- Ver resumen de resultados
SELECT 
    fecha_agendada::DATE as fecha,
    COUNT(*) as total_llamadas
FROM registro_llamadas 
WHERE estado IN ('agendada', 'pendiente')
    AND fecha_agendada >= '2024-12-15'
GROUP BY fecha_agendada::DATE
ORDER BY fecha;

SELECT 
    fecha_hora_visita::DATE as fecha,
    COUNT(*) as total_visitas
FROM control_visitas 
WHERE estado = 'pendiente'
    AND fecha_hora_visita >= '2024-12-15'
GROUP BY fecha_hora_visita::DATE
ORDER BY fecha;
