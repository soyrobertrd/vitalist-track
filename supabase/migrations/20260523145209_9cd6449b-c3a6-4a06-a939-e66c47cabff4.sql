
CREATE OR REPLACE FUNCTION public.listar_recordatorios_psico_pendientes(_ventana_min int DEFAULT 60)
RETURNS TABLE (
  id uuid, workspace_id uuid, sesion_id uuid, paciente_id uuid, canal text,
  programado_para timestamptz, paciente_nombre text, paciente_email text,
  paciente_telefono text, sesion_fecha_hora timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT r.id, r.workspace_id, r.sesion_id, r.paciente_id, r.canal, r.programado_para,
         (p.nombre || ' ' || p.apellido) AS paciente_nombre,
         COALESCE(p.email_px, p.email_cuidador),
         COALESCE(p.contacto_px, p.contacto_cuidador),
         s.fecha_hora
  FROM public.recordatorios_sesiones_psico r
  JOIN public.pacientes p ON p.id = r.paciente_id
  LEFT JOIN public.sesiones_psicologia s ON s.id = r.sesion_id
  WHERE r.estado = 'pendiente'
    AND r.programado_para <= now() + (_ventana_min || ' minutes')::interval
  ORDER BY r.programado_para ASC
  LIMIT 500;
$$;

CREATE OR REPLACE FUNCTION public.marcar_recordatorio_psico(_id uuid, _estado text, _error text DEFAULT NULL)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE public.recordatorios_sesiones_psico
  SET estado = _estado,
      enviado_at = CASE WHEN _estado = 'enviado' THEN now() ELSE enviado_at END,
      error_msg = _error
  WHERE id = _id;
$$;
