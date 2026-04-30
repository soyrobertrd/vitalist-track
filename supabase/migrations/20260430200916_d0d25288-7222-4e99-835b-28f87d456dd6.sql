
-- Enums
DO $$ BEGIN
  CREATE TYPE public.tipo_contrato_rrhh AS ENUM ('indefinido','temporal','pasantia','servicios');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_permiso_rrhh AS ENUM ('vacaciones','licencia_medica','permiso_personal','maternidad','paternidad','duelo','sin_goce');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.estado_permiso_rrhh AS ENUM ('solicitado','aprobado','rechazado','cancelado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Departamentos
CREATE TABLE public.departamentos_rrhh (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  nombre text NOT NULL,
  responsable_id uuid REFERENCES public.empleados_nomina(id) ON DELETE SET NULL,
  descripcion text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.departamentos_rrhh ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws members manage departamentos_rrhh" ON public.departamentos_rrhh
  FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE TRIGGER update_departamentos_rrhh_ts BEFORE UPDATE ON public.departamentos_rrhh
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Puestos
CREATE TABLE public.puestos_rrhh (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  departamento_id uuid REFERENCES public.departamentos_rrhh(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  nivel text,
  salario_min numeric(12,2),
  salario_max numeric(12,2),
  descripcion text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.puestos_rrhh ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws members manage puestos_rrhh" ON public.puestos_rrhh
  FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE TRIGGER update_puestos_rrhh_ts BEFORE UPDATE ON public.puestos_rrhh
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Expedientes
CREATE TABLE public.expedientes_empleado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  empleado_id uuid REFERENCES public.empleados_nomina(id) ON DELETE CASCADE NOT NULL,
  puesto_id uuid REFERENCES public.puestos_rrhh(id) ON DELETE SET NULL,
  tipo_contrato tipo_contrato_rrhh NOT NULL DEFAULT 'indefinido',
  fecha_inicio_contrato date,
  fecha_fin_contrato date,
  evaluacion_actual numeric(3,1),
  documentos_entregados jsonb DEFAULT '[]'::jsonb,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.expedientes_empleado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws members manage expedientes_empleado" ON public.expedientes_empleado
  FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE TRIGGER update_expedientes_empleado_ts BEFORE UPDATE ON public.expedientes_empleado
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Vacaciones / Permisos
CREATE TABLE public.vacaciones_permisos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  empleado_id uuid REFERENCES public.empleados_nomina(id) ON DELETE CASCADE NOT NULL,
  numero text UNIQUE,
  tipo tipo_permiso_rrhh NOT NULL DEFAULT 'vacaciones',
  fecha_inicio date NOT NULL,
  fecha_fin date NOT NULL,
  dias integer NOT NULL DEFAULT 1,
  estado estado_permiso_rrhh NOT NULL DEFAULT 'solicitado',
  aprobado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vacaciones_permisos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws members manage vacaciones_permisos" ON public.vacaciones_permisos
  FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE TRIGGER update_vacaciones_permisos_ts BEFORE UPDATE ON public.vacaciones_permisos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-number vacaciones
CREATE OR REPLACE FUNCTION public.generar_numero_vacacion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.vacaciones_permisos WHERE numero LIKE 'VAC-' || v_year || '-%';
    NEW.numero := 'VAC-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_numero_vacacion BEFORE INSERT ON public.vacaciones_permisos
  FOR EACH ROW EXECUTE FUNCTION public.generar_numero_vacacion();
