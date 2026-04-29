-- =================== Auditoría de diagnósticos CIE-10 ===================
CREATE TABLE IF NOT EXISTS public.diagnosticos_auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id uuid,
  paciente_id uuid NOT NULL,
  accion text NOT NULL, -- INSERT | UPDATE | DELETE
  cie10_codigo text,
  cambios jsonb,           -- diff campo a campo
  datos_anteriores jsonb,
  datos_nuevos jsonb,
  motivo text,
  usuario_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_diagaud_paciente ON public.diagnosticos_auditoria (paciente_id, created_at DESC);

ALTER TABLE public.diagnosticos_auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "DiagAud ver staff o admin" ON public.diagnosticos_auditoria
  FOR SELECT TO authenticated
  USING (
    public.is_admin_or_coordinador(auth.uid())
    OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
  );

CREATE POLICY "DiagAud insert authenticated" ON public.diagnosticos_auditoria
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Trigger para registrar cambios automáticamente
CREATE OR REPLACE FUNCTION public.registrar_cambio_diagnostico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cambios jsonb := '{}'::jsonb;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.tipo IS DISTINCT FROM OLD.tipo THEN
      v_cambios := v_cambios || jsonb_build_object('tipo', jsonb_build_array(OLD.tipo, NEW.tipo));
    END IF;
    IF NEW.certeza IS DISTINCT FROM OLD.certeza THEN
      v_cambios := v_cambios || jsonb_build_object('certeza', jsonb_build_array(OLD.certeza, NEW.certeza));
    END IF;
    IF NEW.cie10_codigo IS DISTINCT FROM OLD.cie10_codigo THEN
      v_cambios := v_cambios || jsonb_build_object('cie10_codigo', jsonb_build_array(OLD.cie10_codigo, NEW.cie10_codigo));
    END IF;
    IF NEW.notas IS DISTINCT FROM OLD.notas THEN
      v_cambios := v_cambios || jsonb_build_object('notas', jsonb_build_array(OLD.notas, NEW.notas));
    END IF;
    -- Sólo registramos si hubo cambios reales
    IF v_cambios = '{}'::jsonb THEN RETURN NEW; END IF;
  END IF;

  INSERT INTO public.diagnosticos_auditoria (
    diagnostico_id, paciente_id, accion, cie10_codigo, cambios,
    datos_anteriores, datos_nuevos, motivo, usuario_id
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.paciente_id, OLD.paciente_id),
    TG_OP,
    COALESCE(NEW.cie10_codigo, OLD.cie10_codigo),
    NULLIF(v_cambios, '{}'::jsonb),
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN row_to_json(OLD)::jsonb END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN row_to_json(NEW)::jsonb END,
    NULLIF(current_setting('app.motivo_cambio', true), ''),
    auth.uid()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_diag_auditoria ON public.diagnosticos_clinicos;
CREATE TRIGGER trg_diag_auditoria
  AFTER INSERT OR UPDATE OR DELETE ON public.diagnosticos_clinicos
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_diagnostico();

-- =================== Notificaciones de alertas al equipo ===================
CREATE TABLE IF NOT EXISTS public.alertas_notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid,
  alerta_id uuid REFERENCES public.auditoria_alertas(id) ON DELETE CASCADE,
  destinatario_user_id uuid NOT NULL,
  titulo text NOT NULL,
  cuerpo text,
  severidad text,
  leido boolean NOT NULL DEFAULT false,
  notificado_email boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_aletnot_dest ON public.alertas_notificaciones (destinatario_user_id, leido, created_at DESC);

ALTER TABLE public.alertas_notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AlertNot ver propias" ON public.alertas_notificaciones
  FOR SELECT TO authenticated
  USING (destinatario_user_id = auth.uid() OR public.is_admin_or_coordinador(auth.uid()));

CREATE POLICY "AlertNot marcar leida propia" ON public.alertas_notificaciones
  FOR UPDATE TO authenticated
  USING (destinatario_user_id = auth.uid());

CREATE POLICY "AlertNot insert system" ON public.alertas_notificaciones
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Trigger: cuando se crea una alerta, notificar a admins/coordinadores del workspace
CREATE OR REPLACE FUNCTION public.fan_out_alerta_notificacion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
  v_titulo text;
BEGIN
  v_titulo := CASE NEW.tipo
    WHEN 'fuera_horario' THEN '🌙 Acceso fuera de horario detectado'
    WHEN 'acceso_masivo' THEN '🚨 Posible exfiltración de datos'
    WHEN 'descarga_excesiva' THEN '⬇️ Descargas masivas detectadas'
    WHEN 'cambio_critico' THEN '⚠️ Cambio crítico en datos sensibles'
    ELSE '🔔 Alerta de auditoría: ' || NEW.tipo
  END;

  -- A todos los admins/coordinadores del workspace (o globales si workspace_id es NULL)
  FOR rec IN
    SELECT DISTINCT wm.user_id
    FROM public.workspace_members wm
    WHERE (NEW.workspace_id IS NULL OR wm.workspace_id = NEW.workspace_id)
      AND wm.role IN ('owner','admin')
  LOOP
    INSERT INTO public.alertas_notificaciones (
      workspace_id, alerta_id, destinatario_user_id, titulo, cuerpo, severidad
    ) VALUES (
      NEW.workspace_id, NEW.id, rec.user_id, v_titulo, NEW.descripcion, NEW.severidad
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fan_out_alerta ON public.auditoria_alertas;
CREATE TRIGGER trg_fan_out_alerta
  AFTER INSERT ON public.auditoria_alertas
  FOR EACH ROW EXECUTE FUNCTION public.fan_out_alerta_notificacion();

-- =================== Función helper: setear motivo antes de update ===================
CREATE OR REPLACE FUNCTION public.set_motivo_cambio(_motivo text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT set_config('app.motivo_cambio', COALESCE(_motivo, ''), true);
$$;