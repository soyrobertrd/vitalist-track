
-- ============ MOTOR DE ÓRDENES MÉDICAS (CPOE) ============
CREATE TABLE IF NOT EXISTS public.ordenes_medicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE CASCADE,
  ingreso_id uuid,
  profesional_solicitante_id uuid REFERENCES public.personal_salud(id),
  tipo text NOT NULL CHECK (tipo IN ('laboratorio','imagen','medicamento','transfusion','dieta','interconsulta','procedimiento','curacion','signos_vitales','oxigeno','fisioterapia')),
  prioridad text NOT NULL DEFAULT 'rutina' CHECK (prioridad IN ('rutina','urgente','stat')),
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aceptada','en_proceso','completada','cancelada','rechazada')),
  descripcion text NOT NULL,
  detalles jsonb DEFAULT '{}'::jsonb,
  modulo_destino text,
  recurso_destino_id uuid,
  fecha_solicitud timestamptz NOT NULL DEFAULT now(),
  fecha_completada timestamptz,
  motivo_cancelacion text,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ordenes_medicas_paciente ON public.ordenes_medicas(paciente_id, fecha_solicitud DESC);
CREATE INDEX IF NOT EXISTS idx_ordenes_medicas_estado ON public.ordenes_medicas(workspace_id, estado, prioridad);

ALTER TABLE public.ordenes_medicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view órdenes" ON public.ordenes_medicas FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Members insert órdenes" ON public.ordenes_medicas FOR INSERT
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Members update órdenes" ON public.ordenes_medicas FOR UPDATE
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins delete órdenes" ON public.ordenes_medicas FOR DELETE
  USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE TRIGGER trg_ordenes_medicas_updated BEFORE UPDATE ON public.ordenes_medicas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ordenes_medicas_audit AFTER INSERT OR UPDATE OR DELETE ON public.ordenes_medicas
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

CREATE TABLE IF NOT EXISTS public.ordenes_medicas_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id uuid NOT NULL REFERENCES public.ordenes_medicas(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  estado_anterior text,
  estado_nuevo text NOT NULL,
  user_id uuid,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ordenes_medicas_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view eventos órdenes" ON public.ordenes_medicas_eventos FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Members insert eventos órdenes" ON public.ordenes_medicas_eventos FOR INSERT
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

-- Trigger: registrar evento automático al cambiar estado
CREATE OR REPLACE FUNCTION public.log_orden_medica_evento()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.estado IS DISTINCT FROM OLD.estado THEN
    INSERT INTO public.ordenes_medicas_eventos(orden_id, workspace_id, estado_anterior, estado_nuevo, user_id)
    VALUES (NEW.id, NEW.workspace_id, OLD.estado, NEW.estado, auth.uid());
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_log_orden_medica_evento AFTER UPDATE ON public.ordenes_medicas
  FOR EACH ROW EXECUTE FUNCTION public.log_orden_medica_evento();

-- ============ WORKFLOWS INTER-MÓDULOS ============
CREATE TABLE IF NOT EXISTS public.workflows_clinicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  evento_disparador text NOT NULL,
  condiciones jsonb DEFAULT '{}'::jsonb,
  acciones jsonb NOT NULL DEFAULT '[]'::jsonb,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workflows_clinicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view workflows" ON public.workflows_clinicos FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins manage workflows" ON public.workflows_clinicos FOR ALL
  USING (public.is_workspace_admin(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE TRIGGER trg_workflows_updated BEFORE UPDATE ON public.workflows_clinicos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.workflows_ejecuciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  workflow_id uuid REFERENCES public.workflows_clinicos(id) ON DELETE SET NULL,
  evento text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  resultado text NOT NULL DEFAULT 'pendiente' CHECK (resultado IN ('pendiente','exito','error','omitido')),
  error_mensaje text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workflows_ejecuciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view ejecuciones" ON public.workflows_ejecuciones FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "System insert ejecuciones" ON public.workflows_ejecuciones FOR INSERT
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

-- ============ ALERTAS CLÍNICAS ============
CREATE TABLE IF NOT EXISTS public.alertas_clinicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('sepsis','deterioro','valor_panico','alergia_conflicto','vencimiento_critico','signos_alterados','transfusion_reaccion','dosis_excedida','interaccion_farmaco','triage_critico')),
  severidad text NOT NULL DEFAULT 'media' CHECK (severidad IN ('baja','media','alta','critica')),
  titulo text NOT NULL,
  descripcion text,
  modulo_origen text,
  recurso_origen_id uuid,
  datos jsonb DEFAULT '{}'::jsonb,
  estado text NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','reconocida','atendida','descartada','escalada')),
  asignado_a uuid,
  reconocida_at timestamptz,
  reconocida_por uuid,
  atendida_at timestamptz,
  atendida_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_estado ON public.alertas_clinicas(workspace_id, estado, severidad, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_paciente ON public.alertas_clinicas(paciente_id);

ALTER TABLE public.alertas_clinicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view alertas clínicas" ON public.alertas_clinicas FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Members insert alertas clínicas" ON public.alertas_clinicas FOR INSERT
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Members update alertas clínicas" ON public.alertas_clinicas FOR UPDATE
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER trg_alertas_clinicas_updated BEFORE UPDATE ON public.alertas_clinicas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_alertas_clinicas_audit AFTER INSERT OR UPDATE OR DELETE ON public.alertas_clinicas
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

CREATE TABLE IF NOT EXISTS public.alertas_clinicas_acciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alerta_id uuid NOT NULL REFERENCES public.alertas_clinicas(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid,
  accion text NOT NULL,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.alertas_clinicas_acciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view acciones alertas" ON public.alertas_clinicas_acciones FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Members insert acciones alertas" ON public.alertas_clinicas_acciones FOR INSERT
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

-- ============ FUNCIÓN HUB 360° ============
CREATE OR REPLACE FUNCTION public.paciente_timeline_360(_paciente_id uuid, _limite int DEFAULT 200)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_workspace_id uuid;
  v_timeline jsonb;
BEGIN
  SELECT workspace_id INTO v_workspace_id FROM public.pacientes WHERE id = _paciente_id;
  IF v_workspace_id IS NULL OR NOT public.is_workspace_member(auth.uid(), v_workspace_id) THEN
    RETURN jsonb_build_object('error', 'No autorizado');
  END IF;

  WITH eventos AS (
    SELECT 'visita'::text AS tipo, fecha_hora_visita AS fecha, estado::text AS estado,
           ('Visita ' || COALESCE(tipo_visita::text, ''))::text AS titulo, id AS recurso_id
    FROM public.control_visitas WHERE paciente_id = _paciente_id
    UNION ALL
    SELECT 'llamada', fecha_agendada, estado::text, 'Llamada de seguimiento', id
    FROM public.registro_llamadas WHERE paciente_id = _paciente_id
    UNION ALL
    SELECT 'orden_medica', fecha_solicitud, estado, ('Orden: ' || tipo || ' - ' || descripcion), id
    FROM public.ordenes_medicas WHERE paciente_id = _paciente_id
    UNION ALL
    SELECT 'alerta', created_at, estado, ('🚨 ' || titulo), id
    FROM public.alertas_clinicas WHERE paciente_id = _paciente_id
  )
  SELECT jsonb_agg(jsonb_build_object(
    'tipo', tipo, 'fecha', fecha, 'estado', estado, 'titulo', titulo, 'recurso_id', recurso_id
  ) ORDER BY fecha DESC) INTO v_timeline
  FROM (SELECT * FROM eventos ORDER BY fecha DESC LIMIT _limite) e;

  RETURN COALESCE(v_timeline, '[]'::jsonb);
END $$;
