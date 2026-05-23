
CREATE TABLE public.facturas_psicologia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  numero text NOT NULL,
  paciente_id uuid NOT NULL,
  sesion_id uuid,
  paquete_id uuid,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  itbis numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'emitida',
  metodo_pago text,
  fecha_emision timestamptz NOT NULL DEFAULT now(),
  fecha_pago timestamptz,
  nota text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, numero)
);
CREATE INDEX idx_fact_psico_ws ON public.facturas_psicologia(workspace_id);
CREATE INDEX idx_fact_psico_pac ON public.facturas_psicologia(paciente_id);
ALTER TABLE public.facturas_psicologia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws members read facturas psico" ON public.facturas_psicologia
FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws members insert facturas psico" ON public.facturas_psicologia
FOR INSERT WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws members update facturas psico" ON public.facturas_psicologia
FOR UPDATE USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws admin delete facturas psico" ON public.facturas_psicologia
FOR DELETE USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE TRIGGER trg_fact_psico_updated BEFORE UPDATE ON public.facturas_psicologia
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.firmas_prescripciones_psiq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  prescripcion_id uuid NOT NULL UNIQUE,
  medico_id uuid NOT NULL,
  hash_contenido text NOT NULL,
  firma_base64 text NOT NULL,
  ip text,
  user_agent text,
  firmado_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_firmas_pres_ws ON public.firmas_prescripciones_psiq(workspace_id);
ALTER TABLE public.firmas_prescripciones_psiq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws members read firmas pres" ON public.firmas_prescripciones_psiq
FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws members insert firmas pres" ON public.firmas_prescripciones_psiq
FOR INSERT WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

ALTER TABLE public.prescripciones_psiquiatricas
  ADD COLUMN IF NOT EXISTS firmada boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS firmada_at timestamptz;

CREATE TABLE public.exportaciones_historia_clinica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  paciente_id uuid NOT NULL,
  exportado_por uuid NOT NULL,
  motivo text NOT NULL,
  destinatario text,
  formato text NOT NULL DEFAULT 'json',
  hash_contenido text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_exp_hc_ws ON public.exportaciones_historia_clinica(workspace_id);
CREATE INDEX idx_exp_hc_pac ON public.exportaciones_historia_clinica(paciente_id);
ALTER TABLE public.exportaciones_historia_clinica ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws members read exportaciones hc" ON public.exportaciones_historia_clinica
FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws members insert exportaciones hc" ON public.exportaciones_historia_clinica
FOR INSERT WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id) AND exportado_por = auth.uid());

CREATE OR REPLACE FUNCTION public.firmar_prescripcion_psiquiatrica(
  _prescripcion_id uuid,
  _firma_base64 text,
  _hash_contenido text,
  _ip text DEFAULT NULL,
  _user_agent text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_pres record; v_id uuid;
BEGIN
  SELECT * INTO v_pres FROM public.prescripciones_psiquiatricas WHERE id = _prescripcion_id;
  IF v_pres IS NULL THEN RAISE EXCEPTION 'Prescripción no existe'; END IF;
  IF NOT public.is_workspace_member(auth.uid(), v_pres.workspace_id) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  IF v_pres.firmada THEN RAISE EXCEPTION 'Prescripción ya está firmada'; END IF;
  INSERT INTO public.firmas_prescripciones_psiq
    (workspace_id, prescripcion_id, medico_id, hash_contenido, firma_base64, ip, user_agent)
  VALUES
    (v_pres.workspace_id, _prescripcion_id, auth.uid(), _hash_contenido, _firma_base64, _ip, _user_agent)
  RETURNING id INTO v_id;
  UPDATE public.prescripciones_psiquiatricas SET firmada = true, firmada_at = now() WHERE id = _prescripcion_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.exportar_historia_clinica_psico(
  _paciente_id uuid,
  _motivo text,
  _destinatario text DEFAULT NULL,
  _formato text DEFAULT 'json'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE v_ws uuid; v_bundle jsonb; v_hash text;
BEGIN
  SELECT workspace_id INTO v_ws FROM public.pacientes WHERE id = _paciente_id;
  IF v_ws IS NULL THEN RAISE EXCEPTION 'Paciente no existe'; END IF;
  IF NOT public.is_workspace_member(auth.uid(), v_ws) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  SELECT jsonb_build_object(
    'paciente',     (SELECT to_jsonb(p) FROM public.pacientes p WHERE p.id = _paciente_id),
    'ficha_psico',  (SELECT to_jsonb(pp) FROM public.pacientes_psicologia pp WHERE pp.paciente_id = _paciente_id LIMIT 1),
    'sesiones',     COALESCE((SELECT jsonb_agg(to_jsonb(s)) FROM public.sesiones_psicologia s WHERE s.paciente_id = _paciente_id), '[]'::jsonb),
    'notas',        COALESCE((SELECT jsonb_agg(to_jsonb(n)) FROM public.notas_psicologia n WHERE n.paciente_id = _paciente_id AND n.es_privada = false), '[]'::jsonb),
    'evaluaciones', COALESCE((SELECT jsonb_agg(to_jsonb(e)) FROM public.evaluaciones_psicometricas e WHERE e.paciente_id = _paciente_id), '[]'::jsonb),
    'prescripciones', COALESCE((SELECT jsonb_agg(to_jsonb(pr)) FROM public.prescripciones_psiquiatricas pr WHERE pr.paciente_id = _paciente_id), '[]'::jsonb),
    'generado_at',  now()
  ) INTO v_bundle;
  v_hash := encode(extensions.digest(v_bundle::text, 'sha256'), 'hex');
  INSERT INTO public.exportaciones_historia_clinica
    (workspace_id, paciente_id, exportado_por, motivo, destinatario, formato, hash_contenido)
  VALUES (v_ws, _paciente_id, auth.uid(), _motivo, _destinatario, _formato, v_hash);
  RETURN jsonb_build_object('hash', v_hash, 'bundle', v_bundle);
END $$;
