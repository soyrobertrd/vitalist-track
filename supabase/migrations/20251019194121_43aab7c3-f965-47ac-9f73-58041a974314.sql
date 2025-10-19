-- Arreglar el search_path de la función

CREATE OR REPLACE FUNCTION calcular_indicadores_llamadas(
  profesional_uuid uuid DEFAULT NULL,
  fecha_inicio timestamp DEFAULT NOW() - INTERVAL '30 days',
  fecha_fin timestamp DEFAULT NOW()
)
RETURNS TABLE (
  total_llamadas bigint,
  llamadas_realizadas bigint,
  llamadas_contactadas bigint,
  tasa_contacto numeric,
  duracion_promedio numeric,
  requieren_seguimiento bigint,
  llamadas_pendientes bigint,
  llamadas_canceladas bigint
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*) as total_llamadas,
    COUNT(*) FILTER (WHERE estado = 'realizada') as llamadas_realizadas,
    COUNT(*) FILTER (WHERE resultado_seguimiento = 'contactado') as llamadas_contactadas,
    ROUND(
      (COUNT(*) FILTER (WHERE resultado_seguimiento = 'contactado')::numeric / 
       NULLIF(COUNT(*) FILTER (WHERE estado = 'realizada'), 0) * 100), 
      2
    ) as tasa_contacto,
    ROUND(AVG(duracion_minutos) FILTER (WHERE duracion_minutos IS NOT NULL), 2) as duracion_promedio,
    COUNT(*) FILTER (WHERE requiere_seguimiento = true) as requieren_seguimiento,
    COUNT(*) FILTER (WHERE estado = 'pendiente' OR estado = 'agendada') as llamadas_pendientes,
    COUNT(*) FILTER (WHERE estado = 'cancelada') as llamadas_canceladas
  FROM public.registro_llamadas
  WHERE 
    (profesional_uuid IS NULL OR profesional_id = profesional_uuid)
    AND created_at BETWEEN fecha_inicio AND fecha_fin;
$$;