
CREATE TABLE IF NOT EXISTS public.consentimientos_teleconsulta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  paciente_id uuid NOT NULL,
  texto_version text NOT NULL DEFAULT 'v1.0',
  firma_data text,
  ip text,
  user_agent text,
  firmado_at timestamptz NOT NULL DEFAULT now(),
  valido_hasta timestamptz NOT NULL DEFAULT (now() + interval '1 year'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.consentimientos_teleconsulta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ct_select" ON public.consentimientos_teleconsulta FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ct_ins" ON public.consentimientos_teleconsulta FOR INSERT
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id) OR auth.uid() IS NULL);
CREATE POLICY "ct_upd" ON public.consentimientos_teleconsulta FOR UPDATE
  USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE TABLE IF NOT EXISTS public.teleconsultas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  sesion_id uuid REFERENCES public.sesiones_psicologia(id) ON DELETE SET NULL,
  paciente_id uuid NOT NULL,
  terapeuta_id uuid,
  sala_codigo uuid NOT NULL DEFAULT gen_random_uuid(),
  pin_paciente text NOT NULL DEFAULT lpad((floor(random()*1000000))::int::text, 6, '0'),
  estado text NOT NULL DEFAULT 'programada'
    CHECK (estado IN ('programada','en_sala_espera','en_curso','finalizada','cancelada')),
  inicio_at timestamptz,
  fin_at timestamptz,
  duracion_min int,
  consentimiento_id uuid REFERENCES public.consentimientos_teleconsulta(id),
  notas_post text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.teleconsultas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tc_select" ON public.teleconsultas FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "tc_ins" ON public.teleconsultas FOR INSERT WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "tc_upd" ON public.teleconsultas FOR UPDATE USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "tc_del" ON public.teleconsultas FOR DELETE USING (public.is_workspace_admin(auth.uid(), workspace_id));
CREATE INDEX IF NOT EXISTS ix_tc_sala ON public.teleconsultas(sala_codigo);
CREATE INDEX IF NOT EXISTS ix_tc_pac ON public.teleconsultas(paciente_id);

CREATE TABLE IF NOT EXISTS public.chat_teleconsulta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teleconsulta_id uuid NOT NULL REFERENCES public.teleconsultas(id) ON DELETE CASCADE,
  autor_user_id uuid,
  autor_tipo text NOT NULL CHECK (autor_tipo IN ('paciente','terapeuta','sistema')),
  mensaje text NOT NULL,
  leido_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_teleconsulta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cht_select" ON public.chat_teleconsulta FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.teleconsultas tc WHERE tc.id = teleconsulta_id
    AND (public.is_workspace_member(auth.uid(), tc.workspace_id) OR auth.uid() IS NULL)));
CREATE POLICY "cht_ins" ON public.chat_teleconsulta FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.teleconsultas tc WHERE tc.id = teleconsulta_id
    AND (public.is_workspace_member(auth.uid(), tc.workspace_id) OR auth.uid() IS NULL)));

CREATE TABLE IF NOT EXISTS public.documentos_compartidos_psico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  teleconsulta_id uuid REFERENCES public.teleconsultas(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL,
  nombre text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  tamano_bytes bigint,
  subido_por uuid,
  visible_paciente boolean DEFAULT true,
  permiso text NOT NULL DEFAULT 'ver' CHECK (permiso IN ('ver','descargar')),
  expira_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documentos_compartidos_psico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dcp_select" ON public.documentos_compartidos_psico FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "dcp_ins" ON public.documentos_compartidos_psico FOR INSERT WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "dcp_upd" ON public.documentos_compartidos_psico FOR UPDATE USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "dcp_del" ON public.documentos_compartidos_psico FOR DELETE USING (public.is_workspace_admin(auth.uid(), workspace_id));

INSERT INTO storage.buckets (id, name, public) VALUES ('teleconsulta-docs','teleconsulta-docs', false)
ON CONFLICT (id) DO NOTHING;
CREATE POLICY "tcd_select" ON storage.objects FOR SELECT USING (bucket_id = 'teleconsulta-docs' AND auth.uid() IS NOT NULL);
CREATE POLICY "tcd_ins" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'teleconsulta-docs' AND auth.uid() IS NOT NULL);
CREATE POLICY "tcd_del" ON storage.objects FOR DELETE USING (bucket_id = 'teleconsulta-docs' AND auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.leer_nota_psicologia(_nota_id uuid)
RETURNS public.notas_psicologia
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_nota public.notas_psicologia;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  SELECT * INTO v_nota FROM public.notas_psicologia WHERE id = _nota_id;
  IF v_nota.id IS NULL THEN RAISE EXCEPTION 'Nota no encontrada'; END IF;
  IF NOT (public.is_workspace_admin(auth.uid(), v_nota.workspace_id)
    OR v_nota.terapeuta_id = auth.uid() OR v_nota.supervisor_id = auth.uid()) THEN
    RAISE EXCEPTION 'Sin permisos para leer esta nota';
  END IF;
  INSERT INTO public.notas_psicologia_accesos (nota_id, user_id, accion)
  VALUES (_nota_id, auth.uid(), 'view');
  RETURN v_nota;
END; $$;

CREATE OR REPLACE FUNCTION public.reporte_asistencia_psicologia(
  _workspace_id uuid, _desde date DEFAULT (CURRENT_DATE - interval '90 days')::date, _hasta date DEFAULT CURRENT_DATE
) RETURNS TABLE(paciente_id uuid, paciente_nombre text, total bigint, asistidas bigint, no_show bigint, canceladas bigint, pct_asistencia numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, (p.nombre || ' ' || COALESCE(p.apellido,''))::text,
    COUNT(s.id), COUNT(*) FILTER (WHERE s.estado='realizada'),
    COUNT(*) FILTER (WHERE s.estado='no_show'),
    COUNT(*) FILTER (WHERE s.estado='cancelada'),
    ROUND(COUNT(*) FILTER (WHERE s.estado='realizada')::numeric * 100 / NULLIF(COUNT(s.id),0), 1)
  FROM public.sesiones_psicologia s
  JOIN public.pacientes p ON p.id = s.paciente_id
  WHERE s.workspace_id = _workspace_id AND s.fecha_hora::date BETWEEN _desde AND _hasta
  GROUP BY p.id, p.nombre, p.apellido
  ORDER BY 7 DESC NULLS LAST;
$$;

CREATE OR REPLACE FUNCTION public.reporte_evolucion_escalas(_paciente_id uuid)
RETURNS TABLE(escala text, fecha timestamptz, puntaje numeric, severidad text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.escala, e.fecha_aplicacion, e.puntaje_total, e.severidad
  FROM public.evaluaciones_psicometricas e
  WHERE e.paciente_id = _paciente_id
  ORDER BY e.escala, e.fecha_aplicacion ASC;
$$;

CREATE OR REPLACE FUNCTION public.reporte_pacientes_inactivos_psico(_workspace_id uuid, _meses int DEFAULT 3)
RETURNS TABLE(paciente_id uuid, paciente_nombre text, ultima_sesion timestamptz, dias_sin_sesion int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH ultimas AS (
    SELECT s.paciente_id, MAX(s.fecha_hora) AS ultima
    FROM public.sesiones_psicologia s WHERE s.workspace_id = _workspace_id GROUP BY s.paciente_id
  )
  SELECT p.id, (p.nombre || ' ' || COALESCE(p.apellido,''))::text, u.ultima, EXTRACT(day FROM (now() - u.ultima))::int
  FROM public.pacientes p JOIN ultimas u ON u.paciente_id = p.id
  WHERE u.ultima < now() - (_meses || ' months')::interval
  ORDER BY u.ultima ASC;
$$;

CREATE OR REPLACE FUNCTION public.reporte_cancelaciones_psico(
  _workspace_id uuid, _desde date DEFAULT (CURRENT_DATE - interval '90 days')::date, _hasta date DEFAULT CURRENT_DATE
) RETURNS TABLE(estado text, cantidad bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT estado, COUNT(*) FROM public.sesiones_psicologia
  WHERE workspace_id = _workspace_id AND fecha_hora::date BETWEEN _desde AND _hasta
    AND estado IN ('cancelada','no_show','reagendada')
  GROUP BY estado ORDER BY 2 DESC;
$$;

CREATE OR REPLACE FUNCTION public.reporte_retencion_terapeutica(
  _workspace_id uuid, _desde date DEFAULT (CURRENT_DATE - interval '12 months')::date
) RETURNS TABLE(cohorte_mes date, total_nuevos bigint, activos_30d bigint, activos_90d bigint, activos_180d bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH primeras AS (
    SELECT paciente_id, MIN(fecha_hora) AS primera FROM public.sesiones_psicologia
    WHERE workspace_id = _workspace_id AND fecha_hora::date >= _desde GROUP BY paciente_id
  ),
  cohortes AS (SELECT date_trunc('month', primera)::date AS cohorte, paciente_id, primera FROM primeras)
  SELECT c.cohorte, COUNT(*),
    COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.sesiones_psicologia s
      WHERE s.paciente_id = c.paciente_id AND s.fecha_hora BETWEEN c.primera + interval '20 days' AND c.primera + interval '40 days')),
    COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.sesiones_psicologia s
      WHERE s.paciente_id = c.paciente_id AND s.fecha_hora BETWEEN c.primera + interval '80 days' AND c.primera + interval '100 days')),
    COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.sesiones_psicologia s
      WHERE s.paciente_id = c.paciente_id AND s.fecha_hora BETWEEN c.primera + interval '170 days' AND c.primera + interval '190 days'))
  FROM cohortes c GROUP BY c.cohorte ORDER BY 1 ASC;
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_teleconsulta;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teleconsultas;
