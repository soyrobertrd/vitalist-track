-- 1. Enum de verticales
DO $$ BEGIN
  CREATE TYPE public.vertical_tipo AS ENUM ('clinica', 'dental', 'aesthetic', 'recovery', 'vision');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Tabla workspace_verticales
CREATE TABLE IF NOT EXISTS public.workspace_verticales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vertical public.vertical_tipo NOT NULL,
  activa boolean NOT NULL DEFAULT true,
  es_principal boolean NOT NULL DEFAULT false,
  configuracion jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, vertical)
);

ALTER TABLE public.workspace_verticales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Miembros pueden ver verticales de su workspace"
ON public.workspace_verticales FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.workspace_members wm
  WHERE wm.workspace_id = workspace_verticales.workspace_id
    AND wm.user_id = auth.uid()
));

CREATE POLICY "Admins gestionan verticales del workspace"
ON public.workspace_verticales FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.workspace_members wm
  WHERE wm.workspace_id = workspace_verticales.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workspace_members wm
  WHERE wm.workspace_id = workspace_verticales.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
));

-- 3. Vertical asignada por usuario
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vertical_asignada public.vertical_tipo;

-- 4. Migrar workspaces existentes a 'clinica'
INSERT INTO public.workspace_verticales (workspace_id, vertical, activa, es_principal)
SELECT id, 'clinica'::public.vertical_tipo, true, true
FROM public.workspaces
ON CONFLICT (workspace_id, vertical) DO NOTHING;

-- 5. Tabla de altas hospitalarias
CREATE TABLE IF NOT EXISTS public.altas_hospitalarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  hospitalizacion_id uuid,
  fecha_alta timestamptz NOT NULL DEFAULT now(),
  tipo_alta text NOT NULL DEFAULT 'medica' CHECK (tipo_alta IN ('medica','voluntaria','traslado','defuncion','fuga')),
  diagnostico_principal text,
  diagnosticos_secundarios text[],
  resumen_clinico text,
  procedimientos_realizados text,
  medicamentos_alta jsonb DEFAULT '[]'::jsonb,
  indicaciones_paciente text,
  cuidados_domicilio text,
  dieta_recomendada text,
  actividad_fisica text,
  signos_alarma text,
  proxima_cita_fecha date,
  proxima_cita_especialidad text,
  medico_alta_id uuid REFERENCES public.personal_salud(id),
  firma_medico_url text,
  firma_paciente_url text,
  documento_pdf_url text,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','firmada','entregada','anulada')),
  notas_adicionales text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_altas_paciente ON public.altas_hospitalarias(paciente_id);
CREATE INDEX IF NOT EXISTS idx_altas_workspace ON public.altas_hospitalarias(workspace_id);
CREATE INDEX IF NOT EXISTS idx_altas_fecha ON public.altas_hospitalarias(fecha_alta DESC);

ALTER TABLE public.altas_hospitalarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Miembros del workspace ven altas"
ON public.altas_hospitalarias FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.workspace_members wm
  WHERE wm.workspace_id = altas_hospitalarias.workspace_id
    AND wm.user_id = auth.uid()
));

CREATE POLICY "Staff crea altas en su workspace"
ON public.altas_hospitalarias FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workspace_members wm
  WHERE wm.workspace_id = altas_hospitalarias.workspace_id
    AND wm.user_id = auth.uid()
));

CREATE POLICY "Staff actualiza altas en su workspace"
ON public.altas_hospitalarias FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.workspace_members wm
  WHERE wm.workspace_id = altas_hospitalarias.workspace_id
    AND wm.user_id = auth.uid()
));

CREATE POLICY "Admins eliminan altas"
ON public.altas_hospitalarias FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.workspace_members wm
  WHERE wm.workspace_id = altas_hospitalarias.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
));

-- Trigger updated_at
CREATE TRIGGER trg_altas_updated_at
BEFORE UPDATE ON public.altas_hospitalarias
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_workspace_verticales_updated_at
BEFORE UPDATE ON public.workspace_verticales
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();