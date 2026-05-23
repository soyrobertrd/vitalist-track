
-- AMPLIAR existentes
ALTER TABLE public.casos_psico_infantil
  ADD COLUMN IF NOT EXISTS padres_separados boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tutor_legal text,
  ADD COLUMN IF NOT EXISTS custodia text,
  ADD COLUMN IF NOT EXISTS escuela_nombre text,
  ADD COLUMN IF NOT EXISTS escuela_grado text,
  ADD COLUMN IF NOT EXISTS escuela_contacto text,
  ADD COLUMN IF NOT EXISTS rendimiento_escolar text,
  ADD COLUMN IF NOT EXISTS conducta_observada text,
  ADD COLUMN IF NOT EXISTS desarrollo_psicomotor text,
  ADD COLUMN IF NOT EXISTS desarrollo_lenguaje text,
  ADD COLUMN IF NOT EXISTS desarrollo_social text,
  ADD COLUMN IF NOT EXISTS hitos_alcanzados text,
  ADD COLUMN IF NOT EXISTS alertas_desarrollo text,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.casos_psico_infantil ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid='public.casos_psico_infantil'::regclass AND polname='casos_psico_infantil_ws_select') THEN
    CREATE POLICY casos_psico_infantil_ws_select ON public.casos_psico_infantil FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));
    CREATE POLICY casos_psico_infantil_ws_ins ON public.casos_psico_infantil FOR INSERT TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id));
    CREATE POLICY casos_psico_infantil_ws_upd ON public.casos_psico_infantil FOR UPDATE TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));
    CREATE POLICY casos_psico_infantil_ws_del ON public.casos_psico_infantil FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));
  END IF;
END $$;

ALTER TABLE public.casos_adicciones
  ADD COLUMN IF NOT EXISTS sustancias_secundarias text[],
  ADD COLUMN IF NOT EXISTS tiempo_consumo text,
  ADD COLUMN IF NOT EXISTS dias_sobriedad int,
  ADD COLUMN IF NOT EXISTS sponsor_telefono text,
  ADD COLUMN IF NOT EXISTS grupo_apoyo text,
  ADD COLUMN IF NOT EXISTS plan_recuperacion text,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.casos_pareja
  ADD COLUMN IF NOT EXISTS pareja_nombre text,
  ADD COLUMN IF NOT EXISTS pareja_telefono text,
  ADD COLUMN IF NOT EXISTS pareja_email text,
  ADD COLUMN IF NOT EXISTS tiempo_relacion text,
  ADD COLUMN IF NOT EXISTS motivo_consulta text,
  ADD COLUMN IF NOT EXISTS hijos_comunes int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- NUEVAS tablas
CREATE TABLE IF NOT EXISTS public.recaidas_adicciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  caso_id uuid NOT NULL REFERENCES public.casos_adicciones(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL, fecha date NOT NULL DEFAULT CURRENT_DATE,
  sustancia text, desencadenante text, duracion text, intervencion text, notas text,
  created_by uuid, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pruebas_sustancias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  caso_id uuid REFERENCES public.casos_adicciones(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL, fecha date NOT NULL DEFAULT CURRENT_DATE,
  tipo_prueba text, sustancias_evaluadas text[],
  resultado text, detalles text, laboratorio text,
  created_by uuid, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.acuerdos_pareja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  caso_id uuid NOT NULL REFERENCES public.casos_pareja(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  titulo text NOT NULL, descripcion text, responsable text,
  cumplido boolean DEFAULT false, fecha_revision date,
  created_by uuid, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cronologia_conflicto_pareja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  caso_id uuid NOT NULL REFERENCES public.casos_pareja(id) ON DELETE CASCADE,
  fecha date NOT NULL, evento text NOT NULL,
  impacto text, notas text,
  created_by uuid, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contratos_eap (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  empresa_nombre text NOT NULL, contacto_rrhh text, email_rrhh text, telefono_rrhh text,
  sesiones_anuales_por_empleado int DEFAULT 6,
  fecha_inicio date, fecha_fin date, tarifa_sesion numeric(10,2),
  activo boolean DEFAULT true, notas text,
  created_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.empleados_eap (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  contrato_id uuid NOT NULL REFERENCES public.contratos_eap(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL,
  codigo_anonimo text NOT NULL, departamento text, cargo text,
  sesiones_usadas int DEFAULT 0, sesiones_disponibles int,
  activo boolean DEFAULT true,
  created_by uuid, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contrato_id, codigo_anonimo)
);

CREATE TABLE IF NOT EXISTS public.sesiones_cubiertas_eap (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  empleado_id uuid NOT NULL REFERENCES public.empleados_eap(id) ON DELETE CASCADE,
  sesion_id uuid, fecha date NOT NULL DEFAULT CURRENT_DATE,
  facturada boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recaidas_adicciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pruebas_sustancias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acuerdos_pareja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cronologia_conflicto_pareja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_eap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados_eap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones_cubiertas_eap ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['recaidas_adicciones','pruebas_sustancias','acuerdos_pareja','cronologia_conflicto_pareja','contratos_eap','empleados_eap','sesiones_cubiertas_eap']
  LOOP
    EXECUTE format('CREATE POLICY %1$I_ws_select ON public.%1$I FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id))', t);
    EXECUTE format('CREATE POLICY %1$I_ws_ins ON public.%1$I FOR INSERT TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id))', t);
    EXECUTE format('CREATE POLICY %1$I_ws_upd ON public.%1$I FOR UPDATE TO authenticated USING (is_workspace_member(auth.uid(), workspace_id))', t);
    EXECUTE format('CREATE POLICY %1$I_ws_del ON public.%1$I FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id))', t);
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_casos_infantil_paciente ON public.casos_psico_infantil(paciente_id);
CREATE INDEX IF NOT EXISTS idx_recaidas_caso ON public.recaidas_adicciones(caso_id);
CREATE INDEX IF NOT EXISTS idx_pruebas_paciente ON public.pruebas_sustancias(paciente_id);
CREATE INDEX IF NOT EXISTS idx_acuerdos_caso ON public.acuerdos_pareja(caso_id);
CREATE INDEX IF NOT EXISTS idx_cronologia_caso ON public.cronologia_conflicto_pareja(caso_id);
CREATE INDEX IF NOT EXISTS idx_empleados_eap_contrato ON public.empleados_eap(contrato_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_eap_empleado ON public.sesiones_cubiertas_eap(empleado_id);
