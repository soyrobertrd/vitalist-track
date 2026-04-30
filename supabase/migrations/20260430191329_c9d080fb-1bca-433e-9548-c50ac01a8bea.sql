
-- Portal paciente: tokens de acceso público
CREATE TABLE public.portal_paciente_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.portal_paciente_tokens ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_portal_tokens_token ON public.portal_paciente_tokens(token);
CREATE INDEX idx_portal_tokens_paciente ON public.portal_paciente_tokens(paciente_id);

-- Workspace members can manage tokens
CREATE POLICY "Workspace members manage portal tokens"
  ON public.portal_paciente_tokens FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

-- Public read function for portal (no RLS needed, use function)
CREATE OR REPLACE FUNCTION public.portal_paciente_datos(_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tok public.portal_paciente_tokens;
  v_pac public.pacientes;
  v_citas jsonb;
  v_recetas jsonb;
  v_alergias jsonb;
  v_seguros jsonb;
BEGIN
  SELECT * INTO v_tok FROM public.portal_paciente_tokens
  WHERE token = _token AND activo = true AND expires_at > now()
  LIMIT 1;

  IF v_tok.id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Token inválido o expirado');
  END IF;

  SELECT * INTO v_pac FROM public.pacientes WHERE id = v_tok.paciente_id;

  -- Próximas citas (visitas)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'fecha', v.fecha_hora_visita,
    'tipo', v.tipo_visita,
    'estado', v.estado,
    'profesional', ps.nombre || ' ' || COALESCE(ps.apellido, '')
  ) ORDER BY v.fecha_hora_visita), '[]'::jsonb) INTO v_citas
  FROM public.control_visitas v
  LEFT JOIN public.personal_salud ps ON ps.id = v.profesional_id
  WHERE v.paciente_id = v_tok.paciente_id
    AND v.fecha_hora_visita >= now() - interval '90 days'
  LIMIT 20;

  -- Recetas activas
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'medicamento', r.nombre_medicamento,
    'dosis', r.dosis,
    'frecuencia', r.frecuencia,
    'inicio', r.fecha_inicio,
    'fin', r.fecha_fin,
    'estado', r.estado
  )), '[]'::jsonb) INTO v_recetas
  FROM public.recetas_medicas r
  WHERE r.paciente_id = v_tok.paciente_id
    AND r.estado IN ('activa', 'completada')
  LIMIT 20;

  -- Alergias
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'sustancia', a.sustancia,
    'tipo', a.tipo,
    'severidad', a.severidad,
    'reaccion', a.reaccion
  )), '[]'::jsonb) INTO v_alergias
  FROM public.alergias_paciente a
  WHERE a.paciente_id = v_tok.paciente_id;

  -- Seguros
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'aseguradora', s.aseguradora,
    'plan', s.plan,
    'numero_afiliado', s.numero_afiliado,
    'activo', s.activo
  )), '[]'::jsonb) INTO v_seguros
  FROM public.seguros_paciente s
  WHERE s.paciente_id = v_tok.paciente_id AND s.activo = true;

  RETURN jsonb_build_object(
    'valid', true,
    'paciente', jsonb_build_object(
      'nombre', v_pac.nombre || ' ' || COALESCE(v_pac.apellido, ''),
      'fecha_nacimiento', v_pac.fecha_nacimiento,
      'sexo', v_pac.sexo
    ),
    'citas', v_citas,
    'recetas', v_recetas,
    'alergias', v_alergias,
    'seguros', v_seguros
  );
END;
$$;

-- Reportes BI guardados
CREATE TABLE public.reportes_bi_guardados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  configuracion jsonb NOT NULL DEFAULT '{}',
  creado_por uuid REFERENCES auth.users(id) NOT NULL,
  compartido boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reportes_bi_guardados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own or shared BI reports"
  ON public.reportes_bi_guardados FOR SELECT TO authenticated
  USING (
    public.is_workspace_member(auth.uid(), workspace_id)
    AND (creado_por = auth.uid() OR compartido = true)
  );

CREATE POLICY "Create own BI reports"
  ON public.reportes_bi_guardados FOR INSERT TO authenticated
  WITH CHECK (
    public.is_workspace_member(auth.uid(), workspace_id)
    AND creado_por = auth.uid()
  );

CREATE POLICY "Update own BI reports"
  ON public.reportes_bi_guardados FOR UPDATE TO authenticated
  USING (creado_por = auth.uid());

CREATE POLICY "Delete own BI reports"
  ON public.reportes_bi_guardados FOR DELETE TO authenticated
  USING (creado_por = auth.uid());

CREATE TRIGGER update_reportes_bi_updated_at
  BEFORE UPDATE ON public.reportes_bi_guardados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
