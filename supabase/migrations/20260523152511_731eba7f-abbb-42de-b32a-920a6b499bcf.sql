
-- ===== Sistema de acceso por plan + categoría de profesional =====

-- 1) Catálogo de módulos del menú (group-level keys)
CREATE TABLE IF NOT EXISTS public.modulos_catalogo (
  key text PRIMARY KEY,
  label text NOT NULL,
  descripcion text,
  orden int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.modulos_catalogo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modulos_catalogo lectura pública autenticada"
  ON public.modulos_catalogo FOR SELECT TO authenticated USING (true);

INSERT INTO public.modulos_catalogo (key, label, orden) VALUES
  ('dashboard', 'Dashboard', 1),
  ('agenda', 'Agenda', 2),
  ('pacientes', 'Pacientes', 3),
  ('clinico', 'Clínico', 4),
  ('diagnostico', 'Diagnóstico', 5),
  ('recursos', 'Recursos', 6),
  ('financiero', 'Financiero', 7),
  ('equipo', 'Equipo & RRHH', 8),
  ('crm', 'CRM & Marketing', 9),
  ('turnos', 'Turnos y Colas', 10),
  ('avanzado', 'Avanzado', 11),
  ('telemedicina', 'Telemedicina', 12),
  ('config', 'Configuración', 13),
  ('soporte', 'Soporte', 14)
ON CONFLICT (key) DO NOTHING;

-- 2) Acceso por plan
CREATE TABLE IF NOT EXISTS public.plan_module_access (
  plan_codigo text NOT NULL,
  modulo_key text NOT NULL REFERENCES public.modulos_catalogo(key) ON DELETE CASCADE,
  allowed boolean NOT NULL DEFAULT true,
  PRIMARY KEY (plan_codigo, modulo_key)
);
ALTER TABLE public.plan_module_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_module_access lectura autenticada"
  ON public.plan_module_access FOR SELECT TO authenticated USING (true);
CREATE POLICY "plan_module_access admin global escribe"
  ON public.plan_module_access FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seeds por plan
INSERT INTO public.plan_module_access (plan_codigo, modulo_key) VALUES
  -- FREE: lo mínimo
  ('free','dashboard'),('free','agenda'),('free','pacientes'),('free','soporte'),('free','config'),
  -- SOLO: profesional independiente
  ('solo','dashboard'),('solo','agenda'),('solo','pacientes'),('solo','crm'),
  ('solo','telemedicina'),('solo','financiero'),('solo','soporte'),('solo','config'),
  -- PRO: clínica/centro
  ('pro','dashboard'),('pro','agenda'),('pro','pacientes'),('pro','clinico'),
  ('pro','diagnostico'),('pro','recursos'),('pro','financiero'),('pro','equipo'),
  ('pro','crm'),('pro','turnos'),('pro','telemedicina'),('pro','config'),('pro','soporte'),
  -- BUSINESS: hospital, todo
  ('business','dashboard'),('business','agenda'),('business','pacientes'),('business','clinico'),
  ('business','diagnostico'),('business','recursos'),('business','financiero'),('business','equipo'),
  ('business','crm'),('business','turnos'),('business','avanzado'),('business','telemedicina'),
  ('business','config'),('business','soporte')
ON CONFLICT DO NOTHING;

-- 3) Acceso por categoría de profesional
CREATE TABLE IF NOT EXISTS public.especialidad_categoria_module_access (
  categoria text NOT NULL,
  modulo_key text NOT NULL REFERENCES public.modulos_catalogo(key) ON DELETE CASCADE,
  PRIMARY KEY (categoria, modulo_key)
);
ALTER TABLE public.especialidad_categoria_module_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "esp_cat_module_access lectura autenticada"
  ON public.especialidad_categoria_module_access FOR SELECT TO authenticated USING (true);
CREATE POLICY "esp_cat_module_access admin global escribe"
  ON public.especialidad_categoria_module_access FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seeds por categoría
INSERT INTO public.especialidad_categoria_module_access (categoria, modulo_key) VALUES
  ('medica','dashboard'),('medica','agenda'),('medica','pacientes'),('medica','clinico'),
  ('medica','diagnostico'),('medica','telemedicina'),('medica','soporte'),('medica','config'),
  ('enfermeria','dashboard'),('enfermeria','agenda'),('enfermeria','pacientes'),
  ('enfermeria','clinico'),('enfermeria','recursos'),('enfermeria','soporte'),
  ('tecnica','dashboard'),('tecnica','diagnostico'),('tecnica','recursos'),('tecnica','soporte'),
  ('terapeutica','dashboard'),('terapeutica','agenda'),('terapeutica','pacientes'),
  ('terapeutica','telemedicina'),('terapeutica','soporte'),
  ('administrativa','dashboard'),('administrativa','agenda'),('administrativa','pacientes'),
  ('administrativa','clinico'),('administrativa','diagnostico'),('administrativa','recursos'),
  ('administrativa','financiero'),('administrativa','equipo'),('administrativa','crm'),
  ('administrativa','turnos'),('administrativa','avanzado'),('administrativa','telemedicina'),
  ('administrativa','config'),('administrativa','soporte'),
  ('otra','dashboard'),('otra','soporte')
ON CONFLICT DO NOTHING;

-- 4) RPC unificado: módulos efectivos para el usuario en su workspace activo
CREATE OR REPLACE FUNCTION public.get_modulos_efectivos(_user_id uuid, _workspace_id uuid)
RETURNS TABLE(modulo_key text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_is_admin boolean := false;
  v_categoria text;
BEGIN
  -- Plan del workspace
  SELECT plan_codigo INTO v_plan FROM public.workspaces WHERE id = _workspace_id;
  IF v_plan IS NULL THEN v_plan := 'free'; END IF;

  -- ¿Admin/owner del workspace o admin global?
  SELECT public.is_workspace_admin(_user_id, _workspace_id) OR public.has_role(_user_id, 'admin')
    INTO v_is_admin;

  -- Categoría profesional (vía personal_salud → especialidad → catálogo)
  SELECT ec.categoria INTO v_categoria
  FROM public.personal_salud ps
  JOIN public.especialidades_catalogo ec
    ON lower(ec.nombre) = lower(ps.especialidad)
   AND (ec.workspace_id = _workspace_id OR ec.global = true)
  WHERE ps.user_id = _user_id
    AND ps.workspace_id = _workspace_id
  ORDER BY ec.workspace_id NULLS LAST
  LIMIT 1;

  -- Si no hay perfil profesional, tratar como administrativa (admin/owner) o "otra"
  IF v_categoria IS NULL THEN
    v_categoria := CASE WHEN v_is_admin THEN 'administrativa' ELSE 'otra' END;
  END IF;

  RETURN QUERY
  SELECT pma.modulo_key
  FROM public.plan_module_access pma
  WHERE pma.plan_codigo = v_plan AND pma.allowed = true
    AND (
      v_is_admin -- admin/owner bypassea filtro de categoría
      OR pma.modulo_key IN (
        SELECT m.modulo_key FROM public.especialidad_categoria_module_access m
        WHERE m.categoria = v_categoria
      )
    );
END;
$$;
