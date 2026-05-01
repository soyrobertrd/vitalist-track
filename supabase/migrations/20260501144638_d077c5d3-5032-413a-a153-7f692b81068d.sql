
DROP FUNCTION IF EXISTS public.paciente_timeline_360(uuid, integer);

CREATE FUNCTION public.paciente_timeline_360(_paciente_id uuid, _limite int DEFAULT 200)
RETURNS TABLE(tipo text, titulo text, fecha timestamptz, estado text, modulo text, ref_id uuid, metadata jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  WITH eventos AS (
    SELECT 'visita'::text AS tipo,
           ('Visita ' || COALESCE(v.tipo_visita::text, ''))::text AS titulo,
           v.fecha_hora_visita AS fecha,
           COALESCE(v.estado::text, 'pendiente') AS estado,
           'visitas'::text AS modulo,
           v.id AS ref_id,
           jsonb_build_object('profesional_id', v.profesional_id) AS metadata
    FROM public.control_visitas v WHERE v.paciente_id = _paciente_id
    UNION ALL
    SELECT 'llamada', ('Llamada ' || COALESCE(l.resultado_seguimiento::text, '')),
           COALESCE(l.fecha_hora_realizada, l.fecha_agendada, l.created_at),
           COALESCE(l.estado::text, 'pendiente'), 'llamadas', l.id,
           jsonb_build_object('duracion', l.duracion_minutos)
    FROM public.registro_llamadas l WHERE l.paciente_id = _paciente_id
    UNION ALL
    SELECT 'orden_medica', ('Orden ' || COALESCE(o.tipo::text, '') || ' · ' || COALESCE(o.descripcion, '')),
           o.created_at, COALESCE(o.estado::text, 'pendiente'), 'cpoe', o.id,
           jsonb_build_object('prioridad', o.prioridad)
    FROM public.ordenes_medicas o WHERE o.paciente_id = _paciente_id
    UNION ALL
    SELECT 'alerta', COALESCE(a.titulo, 'Alerta ' || COALESCE(a.tipo::text, '')),
           a.created_at, COALESCE(a.estado::text, 'activa'), 'alertas', a.id,
           jsonb_build_object('severidad', a.severidad, 'descripcion', a.descripcion)
    FROM public.alertas_clinicas a WHERE a.paciente_id = _paciente_id
    UNION ALL
    SELECT 'laboratorio', ('Lab ' || COALESCE(ol.numero_orden, '')),
           ol.created_at, COALESCE(ol.estado::text, 'pendiente'), 'laboratorio', ol.id,
           jsonb_build_object('numero', ol.numero_orden, 'prioridad', ol.prioridad)
    FROM public.ordenes_laboratorio ol WHERE ol.paciente_id = _paciente_id
    UNION ALL
    SELECT 'imagen', ('Imagen ' || COALESCE(ei.modalidad::text, '') || ' · ' || COALESCE(ei.region_anatomica, '')),
           ei.created_at, COALESCE(ei.estado::text, 'pendiente'), 'imagenologia', ei.id,
           jsonb_build_object('numero', ei.numero_orden)
    FROM public.estudios_imagen ei WHERE ei.paciente_id = _paciente_id
    UNION ALL
    SELECT 'evento_adverso', ('Evento adverso ' || COALESCE(ea.numero, '')),
           COALESCE(ea.fecha_evento, ea.created_at), COALESCE(ea.estado::text, 'abierto'), 'calidad', ea.id,
           jsonb_build_object('severidad', ea.severidad, 'tipo', ea.tipo)
    FROM public.eventos_adversos ea WHERE ea.paciente_id = _paciente_id
  )
  SELECT tipo, titulo, fecha, estado, modulo, ref_id, metadata
  FROM eventos ORDER BY fecha DESC LIMIT _limite;
$$;

CREATE OR REPLACE FUNCTION public.centro_comando_metricas(_workspace_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_alertas jsonb; v_ordenes jsonb; v_camas jsonb;
  v_telemedicina int := 0; v_eventos_adversos int := 0;
  v_fhir_jobs int := 0; v_sync_offline int := 0;
BEGIN
  IF NOT public.is_workspace_member(auth.uid(), _workspace_id) THEN
    RETURN jsonb_build_object('error', 'No autorizado');
  END IF;

  SELECT jsonb_object_agg(severidad, cnt) INTO v_alertas FROM (
    SELECT severidad::text AS severidad, COUNT(*) AS cnt FROM public.alertas_clinicas
    WHERE workspace_id = _workspace_id AND estado::text = 'activa' GROUP BY severidad
  ) s;

  SELECT jsonb_build_object(
    'pendientes', COUNT(*) FILTER (WHERE estado::text = 'pendiente'),
    'urgentes', COUNT(*) FILTER (WHERE prioridad::text IN ('urgente','stat') AND estado::text != 'completada'),
    'total_hoy', COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE)
  ) INTO v_ordenes FROM public.ordenes_medicas WHERE workspace_id = _workspace_id;

  BEGIN
    SELECT jsonb_build_object(
      'ocupadas', COUNT(*) FILTER (WHERE estado::text = 'ocupada'),
      'disponibles', COUNT(*) FILTER (WHERE estado::text = 'disponible'),
      'mantenimiento', COUNT(*) FILTER (WHERE estado::text = 'mantenimiento')
    ) INTO v_camas FROM public.camas WHERE workspace_id = _workspace_id;
  EXCEPTION WHEN undefined_table THEN v_camas := '{}'::jsonb; END;

  BEGIN
    SELECT COUNT(*) INTO v_telemedicina FROM public.telemedicina_sesiones
    WHERE workspace_id = _workspace_id AND estado::text IN ('en_curso','programada');
  EXCEPTION WHEN undefined_table THEN v_telemedicina := 0; END;

  BEGIN
    SELECT COUNT(*) INTO v_eventos_adversos FROM public.eventos_adversos
    WHERE workspace_id = _workspace_id AND estado::text IN ('abierto','en_investigacion');
  EXCEPTION WHEN undefined_table THEN v_eventos_adversos := 0; END;

  BEGIN
    SELECT COUNT(*) INTO v_fhir_jobs FROM public.fhir_export_jobs
    WHERE workspace_id = _workspace_id AND estado::text IN ('pendiente','en_proceso');
  EXCEPTION WHEN undefined_table THEN v_fhir_jobs := 0; END;

  BEGIN
    SELECT COUNT(*) INTO v_sync_offline FROM public.offline_sync_queue
    WHERE workspace_id = _workspace_id AND estado::text = 'pendiente';
  EXCEPTION WHEN undefined_table THEN v_sync_offline := 0; END;

  RETURN jsonb_build_object(
    'alertas', COALESCE(v_alertas, '{}'::jsonb),
    'ordenes_medicas', COALESCE(v_ordenes, '{}'::jsonb),
    'camas', COALESCE(v_camas, '{}'::jsonb),
    'telemedicina_activa', v_telemedicina,
    'eventos_adversos_abiertos', v_eventos_adversos,
    'fhir_jobs_pendientes', v_fhir_jobs,
    'sync_offline_pendiente', v_sync_offline,
    'generado_at', now()
  );
END; $$;

CREATE TABLE IF NOT EXISTS public.workflow_plantillas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  categoria text CHECK (categoria IN ('sepsis','alta_hospitalaria','post_cirugia','alergia_detectada','seguimiento','custom')),
  evento_disparador text NOT NULL,
  acciones jsonb NOT NULL DEFAULT '[]'::jsonb,
  activo boolean NOT NULL DEFAULT true,
  es_global boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS workflow_plantillas_ws_codigo_uk
  ON public.workflow_plantillas(COALESCE(workspace_id, '00000000-0000-0000-0000-000000000000'::uuid), codigo);

ALTER TABLE public.workflow_plantillas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ver_plantillas_workspace_o_global" ON public.workflow_plantillas;
CREATE POLICY "ver_plantillas_workspace_o_global" ON public.workflow_plantillas
  FOR SELECT TO authenticated
  USING (es_global = true OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id)));

DROP POLICY IF EXISTS "admin_workspace_gestiona_plantillas" ON public.workflow_plantillas;
CREATE POLICY "admin_workspace_gestiona_plantillas" ON public.workflow_plantillas
  FOR ALL TO authenticated
  USING (workspace_id IS NOT NULL AND public.is_workspace_admin(auth.uid(), workspace_id))
  WITH CHECK (workspace_id IS NOT NULL AND public.is_workspace_admin(auth.uid(), workspace_id));

DROP TRIGGER IF EXISTS trg_wfplant_updated ON public.workflow_plantillas;
CREATE TRIGGER trg_wfplant_updated BEFORE UPDATE ON public.workflow_plantillas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.workflow_plantillas (workspace_id, codigo, nombre, descripcion, categoria, evento_disparador, acciones, es_global) VALUES
  (NULL, 'sepsis_protocolo', 'Protocolo Sepsis', 'Activa órdenes lab + alerta crítica', 'sepsis', 'alerta:sepsis',
   '[{"accion":"crear_orden_medica","tipo":"laboratorio","prioridad":"stat","descripcion":"Hemocultivos x2 + Lactato + PCR"},{"accion":"crear_alerta","tipo":"sepsis","severidad":"critica","mensaje":"Activación protocolo sepsis"}]'::jsonb, true),
  (NULL, 'alta_hospitalaria', 'Alta Hospitalaria', 'Receta + cita seguimiento + encuesta', 'alta_hospitalaria', 'hospitalizacion:alta',
   '[{"accion":"crear_orden_medica","tipo":"receta","descripcion":"Plan medicación al alta"},{"accion":"agendar_visita","dias":7,"tipo":"seguimiento"},{"accion":"enviar_encuesta","plantilla":"satisfaccion"}]'::jsonb, true),
  (NULL, 'post_cirugia', 'Post-Cirugía', 'Control 24h + 7d + signos vitales', 'post_cirugia', 'quirofano:fin',
   '[{"accion":"crear_orden_medica","tipo":"signos_vitales","prioridad":"urgente","descripcion":"Cada 4h x 24h"},{"accion":"agendar_visita","dias":1,"tipo":"control"},{"accion":"agendar_visita","dias":7,"tipo":"control"}]'::jsonb, true),
  (NULL, 'alergia_detectada', 'Alergia Detectada', 'Bloquea recetas + alerta', 'alergia_detectada', 'alergia:registrada',
   '[{"accion":"crear_alerta","tipo":"alergia_conflicto","severidad":"alta","mensaje":"Verificar medicación actual contra nueva alergia"},{"accion":"revisar_recetas_activas"}]'::jsonb, true)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.workflow_ejecutar_plantilla(_plantilla_id uuid, _paciente_id uuid, _contexto jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_plant public.workflow_plantillas; v_pac public.pacientes; v_ejec_id uuid;
BEGIN
  SELECT * INTO v_plant FROM public.workflow_plantillas WHERE id = _plantilla_id AND activo = true;
  IF v_plant.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Plantilla no encontrada'); END IF;
  SELECT * INTO v_pac FROM public.pacientes WHERE id = _paciente_id;
  IF v_pac.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Paciente no encontrado'); END IF;
  IF NOT public.is_workspace_member(auth.uid(), v_pac.workspace_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No autorizado');
  END IF;
  BEGIN
    INSERT INTO public.workflows_ejecuciones (workspace_id, plantilla_id, paciente_id, ejecutado_por, contexto, estado)
    VALUES (v_pac.workspace_id, _plantilla_id, _paciente_id, auth.uid(), _contexto, 'completada')
    RETURNING id INTO v_ejec_id;
  EXCEPTION WHEN undefined_table OR undefined_column THEN v_ejec_id := NULL; END;
  RETURN jsonb_build_object('ok', true, 'plantilla', v_plant.nombre, 'paciente_id', _paciente_id,
    'acciones_planificadas', v_plant.acciones, 'ejecucion_id', v_ejec_id);
END; $$;
