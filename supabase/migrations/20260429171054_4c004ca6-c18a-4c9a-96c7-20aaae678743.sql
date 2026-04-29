
ALTER TABLE public.pacientes
  ADD COLUMN IF NOT EXISTS anonimizado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anonimizado_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_pacientes_anonimizado ON public.pacientes(workspace_id, anonimizado);

CREATE OR REPLACE FUNCTION public.listar_pacientes_para_anonimizar(_workspace_id uuid)
RETURNS TABLE(
  paciente_id uuid,
  nombre_completo text,
  ultima_actividad timestamptz,
  meses_inactivo numeric,
  motivo text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_meses int; v_corte timestamptz;
BEGIN
  IF NOT public.is_workspace_admin(auth.uid(), _workspace_id) THEN
    RAISE EXCEPTION 'Solo administradores pueden ver candidatos a anonimizar';
  END IF;

  SELECT anonimizar_inactivos_meses INTO v_meses
  FROM public.politicas_retencion
  WHERE workspace_id = _workspace_id AND activo = true LIMIT 1;
  IF v_meses IS NULL THEN v_meses := 60; END IF;
  v_corte := now() - (v_meses || ' months')::interval;

  RETURN QUERY
  WITH actividad AS (
    SELECT p.id AS pid,
      GREATEST(
        COALESCE(p.updated_at, p.created_at),
        COALESCE((SELECT MAX(fecha_hora_visita) FROM public.control_visitas WHERE paciente_id = p.id), p.created_at),
        COALESCE((SELECT MAX(created_at) FROM public.registro_llamadas WHERE paciente_id = p.id), p.created_at),
        COALESCE((SELECT MAX(created_at) FROM public.acceso_fichas_log WHERE paciente_id = p.id), p.created_at)
      ) AS ultima
    FROM public.pacientes p
    WHERE p.workspace_id = _workspace_id AND p.anonimizado = false
  )
  SELECT
    p.id,
    (p.nombre || ' ' || COALESCE(p.apellido,''))::text,
    a.ultima,
    (EXTRACT(epoch FROM (now() - a.ultima)) / (60*60*24*30))::numeric,
    format('Sin actividad por %.1f meses (corte: %s meses)',
      EXTRACT(epoch FROM (now() - a.ultima)) / (60*60*24*30), v_meses)
  FROM public.pacientes p
  JOIN actividad a ON a.pid = p.id
  WHERE a.ultima < v_corte
  ORDER BY a.ultima ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.anonimizar_paciente_seguro(_paciente_id uuid, _motivo text DEFAULT 'política de retención')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_ws uuid;
BEGIN
  SELECT workspace_id INTO v_ws FROM public.pacientes WHERE id = _paciente_id;
  IF v_ws IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Paciente no encontrado');
  END IF;
  IF NOT public.is_workspace_admin(auth.uid(), v_ws) THEN
    RAISE EXCEPTION 'Solo administradores pueden anonimizar pacientes';
  END IF;

  UPDATE public.pacientes SET
    nombre = 'Paciente',
    apellido = 'Anonimizado-' || substr(id::text, 1, 8),
    cedula = NULL, numero_principal = NULL, contacto_px = NULL,
    contacto_cuidador = NULL, direccion = NULL, barrio = NULL,
    referencia_direccion = NULL, email = NULL, observaciones = NULL,
    anonimizado = true, anonimizado_at = now(), updated_at = now()
  WHERE id = _paciente_id;

  INSERT INTO public.auditoria_cambios (tabla, registro_id, accion, usuario_id, datos_nuevos)
  VALUES ('pacientes', _paciente_id, 'ANONYMIZE', auth.uid(),
    jsonb_build_object('motivo', _motivo, 'workspace_id', v_ws));

  RETURN jsonb_build_object('ok', true, 'paciente_id', _paciente_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.aplicar_politica_retencion(_workspace_id uuid DEFAULT NULL, _dry_run boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  pol record; pac record; v_corte timestamptz;
  v_anon int := 0; v_avisos int := 0; v_total_ws int := 0;
BEGIN
  FOR pol IN
    SELECT * FROM public.politicas_retencion
    WHERE activo = true
      AND (_workspace_id IS NULL OR workspace_id = _workspace_id)
  LOOP
    v_total_ws := v_total_ws + 1;
    v_corte := now() - (pol.anonimizar_inactivos_meses || ' months')::interval;
    FOR pac IN
      SELECT p.id, p.workspace_id,
        GREATEST(
          COALESCE(p.updated_at, p.created_at),
          COALESCE((SELECT MAX(fecha_hora_visita) FROM public.control_visitas WHERE paciente_id = p.id), p.created_at),
          COALESCE((SELECT MAX(created_at) FROM public.registro_llamadas WHERE paciente_id = p.id), p.created_at)
        ) AS ultima
      FROM public.pacientes p
      WHERE p.workspace_id = pol.workspace_id AND p.anonimizado = false
    LOOP
      IF pac.ultima < v_corte THEN
        IF NOT _dry_run THEN
          UPDATE public.pacientes SET
            nombre = 'Paciente',
            apellido = 'Anonimizado-' || substr(id::text, 1, 8),
            cedula = NULL, numero_principal = NULL, contacto_px = NULL,
            contacto_cuidador = NULL, direccion = NULL, barrio = NULL,
            referencia_direccion = NULL, email = NULL, observaciones = NULL,
            anonimizado = true, anonimizado_at = now(), updated_at = now()
          WHERE id = pac.id;

          INSERT INTO public.auditoria_cambios (tabla, registro_id, accion, datos_nuevos)
          VALUES ('pacientes', pac.id, 'AUTO_ANONYMIZE',
            jsonb_build_object('motivo', 'cron retención', 'workspace_id', pac.workspace_id));
        END IF;
        v_anon := v_anon + 1;
      ELSIF pac.ultima < (v_corte + (pol.notificar_antes_dias || ' days')::interval) THEN
        v_avisos := v_avisos + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'workspaces_procesados', v_total_ws,
    'pacientes_anonimizados', v_anon,
    'pacientes_para_aviso', v_avisos,
    'dry_run', _dry_run,
    'ts', now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.listar_recordatorios_pendientes(_horas int DEFAULT 24)
RETURNS TABLE(
  cita_id uuid, tipo text, paciente_id uuid,
  paciente_nombre text, paciente_telefono text,
  fecha timestamptz, workspace_id uuid
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT v.id, 'visita'::text, v.paciente_id,
    (p.nombre || ' ' || COALESCE(p.apellido,''))::text,
    COALESCE(p.numero_principal, p.contacto_px, p.contacto_cuidador),
    v.fecha_hora_visita, v.workspace_id
  FROM public.control_visitas v
  JOIN public.pacientes p ON p.id = v.paciente_id
  WHERE v.estado = 'pendiente'::estado_visita
    AND p.anonimizado = false
    AND v.fecha_hora_visita BETWEEN now() AND now() + (_horas || ' hours')::interval
  UNION ALL
  SELECT l.id, 'llamada'::text, l.paciente_id,
    (p.nombre || ' ' || COALESCE(p.apellido,''))::text,
    COALESCE(p.numero_principal, p.contacto_px, p.contacto_cuidador),
    l.fecha_agendada, l.workspace_id
  FROM public.registro_llamadas l
  JOIN public.pacientes p ON p.id = l.paciente_id
  WHERE l.estado IN ('agendada'::estado_llamada,'pendiente'::estado_llamada)
    AND p.anonimizado = false
    AND l.fecha_agendada BETWEEN now() AND now() + (_horas || ' hours')::interval;
$$;

GRANT EXECUTE ON FUNCTION public.listar_pacientes_para_anonimizar(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.anonimizar_paciente_seguro(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aplicar_politica_retencion(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_recordatorios_pendientes(int) TO authenticated, service_role;
