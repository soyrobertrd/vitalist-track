CREATE OR REPLACE FUNCTION public.leer_portal_paciente_por_token(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_acceso record;
  v_result jsonb;
BEGIN
  SELECT * INTO v_acceso FROM public.portal_psico_accesos
  WHERE token = _token AND revocado = false AND expira_at > now();
  IF v_acceso IS NULL THEN RAISE EXCEPTION 'Token inválido o expirado'; END IF;

  UPDATE public.portal_psico_accesos SET ultimo_acceso_at = now() WHERE id = v_acceso.id;

  SELECT jsonb_build_object(
    'paciente', (SELECT jsonb_build_object('nombre', nombres, 'apellido', apellidos) FROM public.pacientes WHERE id = v_acceso.paciente_id),
    'proximas_sesiones', COALESCE((SELECT jsonb_agg(jsonb_build_object('fecha_hora', fecha_hora, 'modalidad', modalidad, 'estado', estado) ORDER BY fecha_hora)
      FROM public.sesiones_psicologia WHERE paciente_id = v_acceso.paciente_id AND fecha_hora >= now() LIMIT 10), '[]'::jsonb),
    'evaluaciones_recientes', COALESCE((SELECT jsonb_agg(jsonb_build_object('escala', escala, 'puntaje_total', puntaje_total, 'severidad', severidad, 'fecha', fecha_aplicacion) ORDER BY fecha_aplicacion DESC)
      FROM public.evaluaciones_psicometricas WHERE paciente_id = v_acceso.paciente_id LIMIT 10), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END; $$;