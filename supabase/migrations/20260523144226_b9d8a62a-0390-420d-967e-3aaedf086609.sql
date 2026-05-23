-- Portal del paciente psicológico
CREATE TABLE public.portal_psico_accesos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  paciente_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  expira_at timestamptz NOT NULL,
  ultimo_acceso_at timestamptz,
  revocado boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_portal_psico_paciente ON public.portal_psico_accesos(paciente_id);
CREATE INDEX idx_portal_psico_workspace ON public.portal_psico_accesos(workspace_id);
ALTER TABLE public.portal_psico_accesos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff workspace ver tokens portal psico"
ON public.portal_psico_accesos FOR SELECT TO authenticated
USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "staff workspace crear tokens portal psico"
ON public.portal_psico_accesos FOR INSERT TO authenticated
WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "staff workspace revocar tokens portal psico"
ON public.portal_psico_accesos FOR UPDATE TO authenticated
USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

-- Recordatorios automáticos de sesiones
CREATE TABLE public.recordatorios_sesiones_psico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  sesion_id uuid NOT NULL,
  paciente_id uuid NOT NULL,
  canal text NOT NULL CHECK (canal IN ('email','sms','whatsapp')),
  programado_para timestamptz NOT NULL,
  enviado_at timestamptz,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','enviado','fallido','cancelado')),
  error_msg text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_rec_sesiones_psico_prog ON public.recordatorios_sesiones_psico(programado_para) WHERE estado = 'pendiente';
CREATE INDEX idx_rec_sesiones_psico_ws ON public.recordatorios_sesiones_psico(workspace_id);
ALTER TABLE public.recordatorios_sesiones_psico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff workspace ver recordatorios psico"
ON public.recordatorios_sesiones_psico FOR SELECT TO authenticated
USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "staff workspace gestionar recordatorios psico"
ON public.recordatorios_sesiones_psico FOR ALL TO authenticated
USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()))
WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

-- Integraciones externas (farmacia / laboratorio)
CREATE TABLE public.integraciones_externas_psico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('farmacia','laboratorio')),
  nombre text NOT NULL,
  endpoint text,
  api_key_cifrada text,
  metadata jsonb DEFAULT '{}'::jsonb,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_integ_ext_psico_ws ON public.integraciones_externas_psico(workspace_id);
ALTER TABLE public.integraciones_externas_psico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff ver integraciones psico"
ON public.integraciones_externas_psico FOR SELECT TO authenticated
USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "admin gestionar integraciones psico"
ON public.integraciones_externas_psico FOR ALL TO authenticated
USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner','admin')))
WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner','admin')));

-- Log de envíos externos
CREATE TABLE public.envios_externos_psico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  integracion_id uuid NOT NULL REFERENCES public.integraciones_externas_psico(id) ON DELETE CASCADE,
  tipo_referencia text NOT NULL CHECK (tipo_referencia IN ('prescripcion','orden_lab')),
  referencia_id uuid NOT NULL,
  payload jsonb NOT NULL,
  respuesta jsonb,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','enviado','fallido')),
  enviado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_envios_ext_psico_ws ON public.envios_externos_psico(workspace_id);
CREATE INDEX idx_envios_ext_psico_ref ON public.envios_externos_psico(referencia_id);
ALTER TABLE public.envios_externos_psico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff ver envios externos psico"
ON public.envios_externos_psico FOR SELECT TO authenticated
USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "staff crear envios externos psico"
ON public.envios_externos_psico FOR INSERT TO authenticated
WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

-- RPCs
CREATE OR REPLACE FUNCTION public.generar_token_portal_paciente(_paciente_id uuid, _dias_validez int DEFAULT 30)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ws uuid;
  v_token text;
BEGIN
  SELECT workspace_id INTO v_ws FROM public.pacientes WHERE id = _paciente_id;
  IF v_ws IS NULL THEN RAISE EXCEPTION 'Paciente no encontrado'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = v_ws AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO public.portal_psico_accesos (workspace_id, paciente_id, token, expira_at, created_by)
  VALUES (v_ws, _paciente_id, v_token, now() + (_dias_validez || ' days')::interval, auth.uid());
  RETURN v_token;
END; $$;

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
    'proximas_sesiones', COALESCE((SELECT jsonb_agg(jsonb_build_object('fecha', fecha, 'hora', hora, 'modalidad', modalidad))
      FROM public.sesiones_psicologia WHERE paciente_id = v_acceso.paciente_id AND fecha >= current_date ORDER BY fecha, hora LIMIT 10), '[]'::jsonb),
    'evaluaciones_recientes', COALESCE((SELECT jsonb_agg(jsonb_build_object('escala', escala, 'puntaje_total', puntaje_total, 'severidad', severidad, 'fecha', fecha_aplicacion))
      FROM public.evaluaciones_psicometricas WHERE paciente_id = v_acceso.paciente_id ORDER BY fecha_aplicacion DESC LIMIT 10), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END; $$;

CREATE TRIGGER trg_integ_ext_psico_updated
BEFORE UPDATE ON public.integraciones_externas_psico
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();