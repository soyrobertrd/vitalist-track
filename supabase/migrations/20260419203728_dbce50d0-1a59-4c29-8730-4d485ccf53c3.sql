-- ============================================
-- FASE 2: MULTI-TENANCY (Workspaces + Planes)
-- ============================================

-- 1. Catálogo de planes
CREATE TABLE public.planes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nombre text NOT NULL,
  descripcion text,
  precio_mensual_usd numeric(10,2) DEFAULT 0,
  precio_mensual_dop numeric(10,2) DEFAULT 0,
  limite_pacientes int,
  limite_usuarios int,
  limite_profesionales int,
  caracteristicas jsonb NOT NULL DEFAULT '{}'::jsonb,
  activo boolean NOT NULL DEFAULT true,
  orden int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Workspaces (tenants)
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  slug text NOT NULL UNIQUE,
  owner_id uuid NOT NULL,
  plan_codigo text NOT NULL DEFAULT 'free' REFERENCES public.planes(codigo),
  estado text NOT NULL DEFAULT 'activo',
  configuracion jsonb NOT NULL DEFAULT '{}'::jsonb,
  trial_ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workspaces_owner ON public.workspaces(owner_id);
CREATE INDEX idx_workspaces_slug ON public.workspaces(slug);

-- 3. Miembros del workspace
CREATE TYPE public.workspace_member_role AS ENUM ('owner', 'admin', 'member');

CREATE TABLE public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.workspace_member_role NOT NULL DEFAULT 'member',
  invited_by uuid,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON public.workspace_members(workspace_id);

-- 4. Suscripciones
CREATE TABLE public.subscripciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  plan_codigo text NOT NULL REFERENCES public.planes(codigo),
  proveedor text NOT NULL DEFAULT 'manual',
  proveedor_subscription_id text,
  estado text NOT NULL DEFAULT 'activo',
  fecha_inicio timestamptz NOT NULL DEFAULT now(),
  fecha_fin timestamptz,
  monto numeric(10,2),
  moneda text DEFAULT 'USD',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscripciones_workspace ON public.subscripciones(workspace_id);

-- ============================================
-- SEED PLANES
-- ============================================
INSERT INTO public.planes (codigo, nombre, descripcion, precio_mensual_usd, precio_mensual_dop, limite_pacientes, limite_usuarios, limite_profesionales, caracteristicas, orden) VALUES
('free', 'Free', 'Prueba gratuita: hasta 25 pacientes', 0, 0, 25, 1, 1,
  '{"whatsapp": true, "recordatorios": false, "encuestas": false, "automatizaciones": false, "auditoria": false, "portal_paciente": false, "mapa": false, "soporte": "comunidad"}'::jsonb, 1),
('solo', 'Solo Doctor', 'Ideal para doctores independientes', 19, 1100, 200, 1, 1,
  '{"whatsapp": true, "recordatorios": true, "encuestas": true, "automatizaciones": false, "auditoria": false, "portal_paciente": false, "mapa": false, "soporte": "email"}'::jsonb, 2),
('pro', 'Pro', 'Para clínicas y equipos pequeños', 49, 2800, 1000, 5, 5,
  '{"whatsapp": true, "recordatorios": true, "encuestas": true, "automatizaciones": true, "auditoria": true, "portal_paciente": true, "mapa": false, "soporte": "prioritario"}'::jsonb, 3),
('business', 'Business', 'Para centros y empresas de salud', 149, 8500, NULL, NULL, NULL,
  '{"whatsapp": true, "recordatorios": true, "encuestas": true, "automatizaciones": true, "auditoria": true, "portal_paciente": true, "mapa": true, "soporte": "dedicado", "sso": true, "api": true}'::jsonb, 4);

-- ============================================
-- AGREGAR workspace_id a tablas principales
-- ============================================
ALTER TABLE public.pacientes ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.personal_salud ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.control_visitas ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.registro_llamadas ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.facturas ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.plantillas_correo ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.plantillas_whatsapp ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.encuestas ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.automatizaciones ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.atencion_paciente ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

CREATE INDEX idx_pacientes_workspace ON public.pacientes(workspace_id);
CREATE INDEX idx_personal_workspace ON public.personal_salud(workspace_id);
CREATE INDEX idx_visitas_workspace ON public.control_visitas(workspace_id);
CREATE INDEX idx_llamadas_workspace ON public.registro_llamadas(workspace_id);
CREATE INDEX idx_facturas_workspace ON public.facturas(workspace_id);

-- ============================================
-- MIGRACIÓN: Crear workspace por defecto
-- ============================================
DO $$
DECLARE
  v_owner_id uuid;
  v_workspace_id uuid;
BEGIN
  -- Encontrar el primer admin como owner del workspace por defecto
  SELECT user_id INTO v_owner_id
  FROM public.user_roles
  WHERE role = 'admin'
  ORDER BY created_at ASC
  LIMIT 1;

  -- Si no hay admin, usar el primer profile creado
  IF v_owner_id IS NULL THEN
    SELECT id INTO v_owner_id FROM public.profiles ORDER BY created_at ASC LIMIT 1;
  END IF;

  -- Crear el workspace si hay al menos un usuario
  IF v_owner_id IS NOT NULL THEN
    INSERT INTO public.workspaces (nombre, slug, owner_id, plan_codigo, estado)
    VALUES ('Mi clínica', 'mi-clinica', v_owner_id, 'pro', 'activo')
    RETURNING id INTO v_workspace_id;

    -- Suscripción manual de cortesía
    INSERT INTO public.subscripciones (workspace_id, plan_codigo, proveedor, estado)
    VALUES (v_workspace_id, 'pro', 'manual', 'activo');

    -- Agregar TODOS los profiles existentes como miembros
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    SELECT v_workspace_id, p.id,
      CASE WHEN p.id = v_owner_id THEN 'owner'::workspace_member_role
           WHEN EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role IN ('admin','coordinador'))
                THEN 'admin'::workspace_member_role
           ELSE 'member'::workspace_member_role
      END
    FROM public.profiles p
    ON CONFLICT (workspace_id, user_id) DO NOTHING;

    -- Asignar workspace_id a todos los datos existentes
    UPDATE public.pacientes SET workspace_id = v_workspace_id WHERE workspace_id IS NULL;
    UPDATE public.personal_salud SET workspace_id = v_workspace_id WHERE workspace_id IS NULL;
    UPDATE public.control_visitas SET workspace_id = v_workspace_id WHERE workspace_id IS NULL;
    UPDATE public.registro_llamadas SET workspace_id = v_workspace_id WHERE workspace_id IS NULL;
    UPDATE public.facturas SET workspace_id = v_workspace_id WHERE workspace_id IS NULL;
    UPDATE public.plantillas_correo SET workspace_id = v_workspace_id WHERE workspace_id IS NULL;
    UPDATE public.plantillas_whatsapp SET workspace_id = v_workspace_id WHERE workspace_id IS NULL;
    UPDATE public.encuestas SET workspace_id = v_workspace_id WHERE workspace_id IS NULL;
    UPDATE public.automatizaciones SET workspace_id = v_workspace_id WHERE workspace_id IS NULL;
    UPDATE public.atencion_paciente SET workspace_id = v_workspace_id WHERE workspace_id IS NULL;
  END IF;
END $$;

-- ============================================
-- FUNCIONES DE SEGURIDAD (security definer)
-- ============================================
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_admin(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
      AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_workspaces(_user_id uuid)
RETURNS TABLE(workspace_id uuid, role public.workspace_member_role)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT workspace_id, role FROM public.workspace_members WHERE user_id = _user_id;
$$;

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscripciones ENABLE ROW LEVEL SECURITY;

-- Planes: lectura pública para usuarios autenticados, modificación solo admins de la plataforma
CREATE POLICY planes_select_authenticated ON public.planes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY planes_admin_all ON public.planes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Workspaces: solo miembros pueden ver; solo owner/admin del workspace pueden modificar
CREATE POLICY workspaces_select_members ON public.workspaces
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), id));

CREATE POLICY workspaces_insert_authenticated ON public.workspaces
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY workspaces_update_admin ON public.workspaces
  FOR UPDATE TO authenticated
  USING (public.is_workspace_admin(auth.uid(), id));

CREATE POLICY workspaces_delete_owner ON public.workspaces
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- Workspace members: ver miembros del workspace al que pertenezco; admin gestiona
CREATE POLICY wm_select_members ON public.workspace_members
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY wm_insert_admin ON public.workspace_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY wm_update_admin ON public.workspace_members
  FOR UPDATE TO authenticated
  USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY wm_delete_admin ON public.workspace_members
  FOR DELETE TO authenticated
  USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- Subscripciones: ver miembros, modificar admins
CREATE POLICY subs_select_members ON public.subscripciones
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY subs_admin_all ON public.subscripciones
  FOR ALL TO authenticated
  USING (public.is_workspace_admin(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));

-- ============================================
-- Triggers de updated_at
-- ============================================
CREATE TRIGGER trg_workspaces_updated BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_planes_updated BEFORE UPDATE ON public.planes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.subscripciones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();