-- ============ CIE-10 ============
CREATE TABLE IF NOT EXISTS public.cie10_codigos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  descripcion text NOT NULL,
  capitulo text,
  categoria text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cie10_codigo ON public.cie10_codigos (codigo);
CREATE INDEX IF NOT EXISTS idx_cie10_descripcion ON public.cie10_codigos USING gin (to_tsvector('spanish', descripcion));

ALTER TABLE public.cie10_codigos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CIE10 lectura autenticados" ON public.cie10_codigos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "CIE10 admin modifica" ON public.cie10_codigos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============ Diagnósticos clínicos ============
CREATE TABLE IF NOT EXISTS public.diagnosticos_clinicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  visita_id uuid,
  escala_id uuid,
  cie10_codigo text NOT NULL,
  cie10_descripcion text,
  tipo text NOT NULL DEFAULT 'principal', -- principal | secundario | sospecha
  certeza text NOT NULL DEFAULT 'confirmado', -- confirmado | provisional | descartado
  notas text,
  registrado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_diag_paciente ON public.diagnosticos_clinicos (paciente_id);
CREATE INDEX IF NOT EXISTS idx_diag_cie10 ON public.diagnosticos_clinicos (cie10_codigo);

ALTER TABLE public.diagnosticos_clinicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Diag ver staff o admin" ON public.diagnosticos_clinicos
  FOR SELECT TO authenticated
  USING (
    public.is_admin_or_coordinador(auth.uid())
    OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
  );

CREATE POLICY "Diag insert staff o admin" ON public.diagnosticos_clinicos
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin_or_coordinador(auth.uid())
    OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
  );

CREATE POLICY "Diag update staff o admin" ON public.diagnosticos_clinicos
  FOR UPDATE TO authenticated
  USING (
    public.is_admin_or_coordinador(auth.uid())
    OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
  );

CREATE POLICY "Diag delete admin" ON public.diagnosticos_clinicos
  FOR DELETE TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));

CREATE TRIGGER diag_set_updated
  BEFORE UPDATE ON public.diagnosticos_clinicos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER diag_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.diagnosticos_clinicos
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

-- ============ Escalas de enfermería ============
CREATE TABLE IF NOT EXISTS public.escalas_enfermeria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  visita_id uuid,
  tipo text NOT NULL, -- braden | norton | morse | eva | downton | otro
  puntaje numeric,
  riesgo text, -- bajo | moderado | alto | muy_alto
  detalles jsonb NOT NULL DEFAULT '{}'::jsonb,
  observaciones text,
  registrado_por uuid,
  fecha timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_escenf_paciente ON public.escalas_enfermeria (paciente_id);
CREATE INDEX IF NOT EXISTS idx_escenf_visita ON public.escalas_enfermeria (visita_id);

ALTER TABLE public.escalas_enfermeria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "EscEnf ver staff o admin" ON public.escalas_enfermeria
  FOR SELECT TO authenticated
  USING (
    public.is_admin_or_coordinador(auth.uid())
    OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
  );

CREATE POLICY "EscEnf insert staff o admin" ON public.escalas_enfermeria
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin_or_coordinador(auth.uid())
    OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
  );

CREATE POLICY "EscEnf update staff o admin" ON public.escalas_enfermeria
  FOR UPDATE TO authenticated
  USING (
    public.is_admin_or_coordinador(auth.uid())
    OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
  );

CREATE POLICY "EscEnf delete admin" ON public.escalas_enfermeria
  FOR DELETE TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));

CREATE TRIGGER escenf_set_updated
  BEFORE UPDATE ON public.escalas_enfermeria
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER escenf_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.escalas_enfermeria
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

-- ============ Resúmenes de auditoría ============
CREATE TABLE IF NOT EXISTS public.auditoria_resumenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid,
  periodo text NOT NULL, -- diario | semanal
  fecha_inicio timestamptz NOT NULL,
  fecha_fin timestamptz NOT NULL,
  total_eventos int NOT NULL DEFAULT 0,
  total_alertas int NOT NULL DEFAULT 0,
  alertas_por_severidad jsonb NOT NULL DEFAULT '{}'::jsonb,
  acciones_sospechosas jsonb NOT NULL DEFAULT '[]'::jsonb,
  generado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audres_periodo ON public.auditoria_resumenes (periodo, fecha_inicio DESC);

ALTER TABLE public.auditoria_resumenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AudRes admin lee" ON public.auditoria_resumenes
  FOR SELECT TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));

CREATE POLICY "AudRes admin inserta" ON public.auditoria_resumenes
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_coordinador(auth.uid()));

-- ============ Función generar resumen ============
CREATE OR REPLACE FUNCTION public.generar_resumen_auditoria(_periodo text DEFAULT 'diario', _workspace_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inicio timestamptz;
  v_fin timestamptz := now();
  v_total_ev int;
  v_total_al int;
  v_sev jsonb;
  v_sosp jsonb;
  v_id uuid;
BEGIN
  IF _periodo = 'semanal' THEN
    v_inicio := now() - interval '7 days';
  ELSE
    v_inicio := now() - interval '24 hours';
  END IF;

  SELECT COUNT(*) INTO v_total_ev
  FROM public.acceso_fichas_log
  WHERE created_at BETWEEN v_inicio AND v_fin
    AND (_workspace_id IS NULL OR workspace_id = _workspace_id);

  SELECT COUNT(*) INTO v_total_al
  FROM public.auditoria_alertas
  WHERE created_at BETWEEN v_inicio AND v_fin
    AND (_workspace_id IS NULL OR workspace_id = _workspace_id);

  SELECT jsonb_object_agg(severidad, cnt) INTO v_sev FROM (
    SELECT severidad, COUNT(*) AS cnt
    FROM public.auditoria_alertas
    WHERE created_at BETWEEN v_inicio AND v_fin
      AND (_workspace_id IS NULL OR workspace_id = _workspace_id)
    GROUP BY severidad
  ) s;

  SELECT jsonb_agg(jsonb_build_object(
    'id', id, 'tipo', tipo, 'severidad', severidad,
    'descripcion', descripcion, 'user_id', user_id, 'created_at', created_at
  )) INTO v_sosp FROM (
    SELECT id, tipo, severidad, descripcion, user_id, created_at
    FROM public.auditoria_alertas
    WHERE created_at BETWEEN v_inicio AND v_fin
      AND severidad IN ('alta','media')
      AND (_workspace_id IS NULL OR workspace_id = _workspace_id)
    ORDER BY created_at DESC
    LIMIT 50
  ) a;

  INSERT INTO public.auditoria_resumenes (
    workspace_id, periodo, fecha_inicio, fecha_fin,
    total_eventos, total_alertas, alertas_por_severidad, acciones_sospechosas, generado_por
  ) VALUES (
    _workspace_id, _periodo, v_inicio, v_fin,
    COALESCE(v_total_ev,0), COALESCE(v_total_al,0),
    COALESCE(v_sev,'{}'::jsonb), COALESCE(v_sosp,'[]'::jsonb), auth.uid()
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;