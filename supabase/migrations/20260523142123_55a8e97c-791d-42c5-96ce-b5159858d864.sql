
-- Plantillas de cuestionarios pre-sesión
CREATE TABLE IF NOT EXISTS public.cuestionarios_plantillas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  tipo text DEFAULT 'pre_sesion',
  preguntas jsonb NOT NULL DEFAULT '[]'::jsonb,
  activo boolean DEFAULT true,
  enviar_automatico boolean DEFAULT true,
  horas_antes int DEFAULT 24,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Envíos de cuestionarios a pacientes
CREATE TABLE IF NOT EXISTS public.cuestionarios_envios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  plantilla_id uuid NOT NULL REFERENCES public.cuestionarios_plantillas(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL,
  sesion_id uuid,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  expira_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  enviado_at timestamptz DEFAULT now(),
  respondido_at timestamptz,
  respuestas jsonb,
  puntaje_total numeric,
  alerta_clinica boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Notas ultra privadas (solo terapeuta autor)
CREATE TABLE IF NOT EXISTS public.notas_ultra_privadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  terapeuta_id uuid NOT NULL,
  paciente_id uuid,
  sesion_id uuid,
  titulo text,
  contenido text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notas_ultra_privadas_accesos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nota_id uuid NOT NULL REFERENCES public.notas_ultra_privadas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  accion text NOT NULL DEFAULT 'view',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cuestionarios_plantillas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuestionarios_envios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_ultra_privadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_ultra_privadas_accesos ENABLE ROW LEVEL SECURITY;

-- Plantillas: workspace members
CREATE POLICY cp_sel ON public.cuestionarios_plantillas FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY cp_ins ON public.cuestionarios_plantillas FOR INSERT TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY cp_upd ON public.cuestionarios_plantillas FOR UPDATE TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY cp_del ON public.cuestionarios_plantillas FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

-- Envíos: workspace members; respuesta vía token público manejada por RPC
CREATE POLICY ce_sel ON public.cuestionarios_envios FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY ce_ins ON public.cuestionarios_envios FOR INSERT TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY ce_upd ON public.cuestionarios_envios FOR UPDATE TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY ce_del ON public.cuestionarios_envios FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

-- Notas ultra privadas: solo el terapeuta autor
CREATE POLICY nup_sel ON public.notas_ultra_privadas FOR SELECT TO authenticated USING (terapeuta_id = auth.uid());
CREATE POLICY nup_ins ON public.notas_ultra_privadas FOR INSERT TO authenticated WITH CHECK (terapeuta_id = auth.uid() AND is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY nup_upd ON public.notas_ultra_privadas FOR UPDATE TO authenticated USING (terapeuta_id = auth.uid());
CREATE POLICY nup_del ON public.notas_ultra_privadas FOR DELETE TO authenticated USING (terapeuta_id = auth.uid());

-- Auditoría: el propio terapeuta y admins de workspace pueden ver accesos a sus notas
CREATE POLICY nupa_sel ON public.notas_ultra_privadas_accesos FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.notas_ultra_privadas n
    WHERE n.id = nota_id AND n.terapeuta_id = auth.uid()
  )
);
CREATE POLICY nupa_ins ON public.notas_ultra_privadas_accesos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- RPC para leer nota ultra privada con auditoría
CREATE OR REPLACE FUNCTION public.leer_nota_ultra_privada(_nota_id uuid)
RETURNS public.notas_ultra_privadas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nota public.notas_ultra_privadas;
BEGIN
  SELECT * INTO v_nota FROM public.notas_ultra_privadas WHERE id = _nota_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nota no encontrada';
  END IF;
  IF v_nota.terapeuta_id <> auth.uid() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  INSERT INTO public.notas_ultra_privadas_accesos (nota_id, user_id, accion)
  VALUES (_nota_id, auth.uid(), 'view');
  RETURN v_nota;
END;
$$;

-- RPC pública para responder cuestionario (vía token)
CREATE OR REPLACE FUNCTION public.responder_cuestionario_publico(
  _token text,
  _respuestas jsonb,
  _puntaje numeric DEFAULT NULL,
  _alerta boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  UPDATE public.cuestionarios_envios
  SET respuestas = _respuestas,
      puntaje_total = _puntaje,
      alerta_clinica = COALESCE(_alerta, false),
      respondido_at = now()
  WHERE token = _token
    AND expira_at > now()
    AND respondido_at IS NULL
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Token inválido o cuestionario ya respondido';
  END IF;
  RETURN v_id;
END;
$$;

-- RPC pública para leer plantilla por token (sin exponer toda la tabla)
CREATE OR REPLACE FUNCTION public.leer_cuestionario_por_token(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'envio_id', e.id,
    'plantilla_nombre', p.nombre,
    'plantilla_descripcion', p.descripcion,
    'preguntas', p.preguntas,
    'respondido', e.respondido_at IS NOT NULL,
    'expira_at', e.expira_at
  ) INTO v_result
  FROM public.cuestionarios_envios e
  JOIN public.cuestionarios_plantillas p ON p.id = e.plantilla_id
  WHERE e.token = _token AND e.expira_at > now();
  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Token inválido o expirado';
  END IF;
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.responder_cuestionario_publico(text, jsonb, numeric, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.leer_cuestionario_por_token(text) TO anon, authenticated;

CREATE TRIGGER trg_cp_upd BEFORE UPDATE ON public.cuestionarios_plantillas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_nup_upd BEFORE UPDATE ON public.notas_ultra_privadas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ce_paciente ON public.cuestionarios_envios(paciente_id);
CREATE INDEX idx_ce_token ON public.cuestionarios_envios(token);
CREATE INDEX idx_nup_terapeuta ON public.notas_ultra_privadas(terapeuta_id);
CREATE INDEX idx_nup_paciente ON public.notas_ultra_privadas(paciente_id);
