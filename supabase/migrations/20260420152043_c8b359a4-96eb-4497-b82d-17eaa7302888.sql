-- ============================================================
-- 1) Pacientes: nacionalidad + tipo/numero de documento
-- ============================================================
ALTER TABLE public.pacientes
  ADD COLUMN IF NOT EXISTS nacionalidad text NOT NULL DEFAULT 'Dominicana',
  ADD COLUMN IF NOT EXISTS tipo_documento text NOT NULL DEFAULT 'cedula',
  ADD COLUMN IF NOT EXISTS numero_documento text,
  ADD COLUMN IF NOT EXISTS sucursal_id uuid;

-- Ensure cedula can be null/blank for non-Dominican patients (still keep field)
ALTER TABLE public.pacientes ALTER COLUMN cedula DROP NOT NULL;

COMMENT ON COLUMN public.pacientes.tipo_documento IS 'cedula | pasaporte | id_extranjero | licencia';
COMMENT ON COLUMN public.pacientes.nacionalidad IS 'Nacionalidad del paciente. Default Dominicana.';

-- ============================================================
-- 2) Sucursales (sedes dentro de un workspace)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sucursales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  codigo text,
  direccion text,
  telefono text,
  email text,
  zona text,
  ciudad text,
  pais text,
  latitud numeric,
  longitud numeric,
  activo boolean NOT NULL DEFAULT true,
  es_principal boolean NOT NULL DEFAULT false,
  configuracion jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_sucursales_workspace ON public.sucursales(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sucursales_activo ON public.sucursales(activo);

ALTER TABLE public.sucursales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sucursales_select_members"
  ON public.sucursales FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id) OR public.is_admin_or_coordinador(auth.uid()));

CREATE POLICY "sucursales_insert_admin"
  ON public.sucursales FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "sucursales_update_admin"
  ON public.sucursales FOR UPDATE TO authenticated
  USING (public.is_workspace_admin(auth.uid(), workspace_id) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "sucursales_delete_admin"
  ON public.sucursales FOR DELETE TO authenticated
  USING (public.is_workspace_admin(auth.uid(), workspace_id) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_sucursales_updated_at
  BEFORE UPDATE ON public.sucursales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_sucursales_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.sucursales
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

-- ============================================================
-- 3) Asignación opcional sucursal a entidades clave
-- ============================================================
ALTER TABLE public.personal_salud  ADD COLUMN IF NOT EXISTS sucursal_id uuid REFERENCES public.sucursales(id) ON DELETE SET NULL;
ALTER TABLE public.control_visitas ADD COLUMN IF NOT EXISTS sucursal_id uuid REFERENCES public.sucursales(id) ON DELETE SET NULL;
ALTER TABLE public.registro_llamadas ADD COLUMN IF NOT EXISTS sucursal_id uuid REFERENCES public.sucursales(id) ON DELETE SET NULL;
ALTER TABLE public.pacientes        ADD CONSTRAINT pacientes_sucursal_id_fkey
  FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pacientes_sucursal ON public.pacientes(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_personal_sucursal ON public.personal_salud(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_visitas_sucursal ON public.control_visitas(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_llamadas_sucursal ON public.registro_llamadas(sucursal_id);

-- ============================================================
-- 4) Helper: ¿usuario pertenece a la sucursal vía workspace?
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_member_of_sucursal(_user_id uuid, _sucursal_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.sucursales s
    JOIN public.workspace_members wm ON wm.workspace_id = s.workspace_id
    WHERE s.id = _sucursal_id AND wm.user_id = _user_id
  );
$$;