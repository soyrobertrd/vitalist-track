
-- Ampliar documentos_clinicos existente
ALTER TABLE public.documentos_clinicos
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS profesional_id uuid REFERENCES public.personal_salud(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archivo_url text,
  ADD COLUMN IF NOT EXISTS archivo_nombre text,
  ADD COLUMN IF NOT EXISTS firmado boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS firmado_por uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS firmado_at timestamptz,
  ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS documento_padre_id uuid REFERENCES public.documentos_clinicos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'otro';

-- Firmas electrónicas
CREATE TABLE public.firmas_electronicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  documento_id uuid NOT NULL REFERENCES public.documentos_clinicos(id) ON DELETE CASCADE,
  firmante_id uuid REFERENCES auth.users(id),
  tipo_firmante text NOT NULL DEFAULT 'profesional',
  nombre_firmante text,
  ip_address text,
  user_agent text,
  hash_documento text,
  firma_data text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.firmas_electronicas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "firmas_select" ON public.firmas_electronicas FOR SELECT TO authenticated
  USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "firmas_insert" ON public.firmas_electronicas FOR INSERT TO authenticated
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

-- Escaneos OCR
CREATE TABLE public.escaneos_ocr (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  documento_id uuid NOT NULL REFERENCES public.documentos_clinicos(id) ON DELETE CASCADE,
  texto_extraido text,
  confianza numeric(5,2),
  idioma_detectado text DEFAULT 'es',
  metadata_extraida jsonb DEFAULT '{}',
  estado text DEFAULT 'pendiente',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.escaneos_ocr ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ocr_select" ON public.escaneos_ocr FOR SELECT TO authenticated
  USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "ocr_insert" ON public.escaneos_ocr FOR INSERT TO authenticated
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

-- Workflow reglas
CREATE TABLE public.workflow_reglas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vertical_tipo text,
  nombre text NOT NULL,
  descripcion text,
  evento_trigger text NOT NULL,
  condiciones jsonb DEFAULT '[]',
  acciones jsonb DEFAULT '[]',
  prioridad integer DEFAULT 0,
  activo boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.workflow_reglas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wf_reglas_select" ON public.workflow_reglas FOR SELECT TO authenticated
  USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "wf_reglas_insert" ON public.workflow_reglas FOR INSERT TO authenticated
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "wf_reglas_update" ON public.workflow_reglas FOR UPDATE TO authenticated
  USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "wf_reglas_delete" ON public.workflow_reglas FOR DELETE TO authenticated
  USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

-- Workflow ejecuciones
CREATE TABLE public.workflow_ejecuciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  regla_id uuid NOT NULL REFERENCES public.workflow_reglas(id) ON DELETE CASCADE,
  evento_data jsonb DEFAULT '{}',
  estado text DEFAULT 'pendiente',
  resultado jsonb,
  error_mensaje text,
  iniciado_at timestamptz DEFAULT now(),
  completado_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.workflow_ejecuciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wf_ejec_select" ON public.workflow_ejecuciones FOR SELECT TO authenticated
  USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "wf_ejec_insert" ON public.workflow_ejecuciones FOR INSERT TO authenticated
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

-- Workflow cadenas
CREATE TABLE public.workflow_cadenas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  regla_id uuid REFERENCES public.workflow_reglas(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  pasos jsonb DEFAULT '[]',
  paso_actual integer DEFAULT 0,
  estado text DEFAULT 'pendiente',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.workflow_cadenas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wf_cadenas_select" ON public.workflow_cadenas FOR SELECT TO authenticated
  USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "wf_cadenas_insert" ON public.workflow_cadenas FOR INSERT TO authenticated
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "wf_cadenas_update" ON public.workflow_cadenas FOR UPDATE TO authenticated
  USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

-- Preferencias idioma
CREATE TABLE public.preferencias_idioma (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  idioma text DEFAULT 'es',
  zona_horaria text DEFAULT 'America/Santo_Domingo',
  formato_fecha text DEFAULT 'dd/MM/yyyy',
  formato_moneda text DEFAULT 'DOP',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.preferencias_idioma ENABLE ROW LEVEL SECURITY;
CREATE POLICY "idioma_select" ON public.preferencias_idioma FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "idioma_insert" ON public.preferencias_idioma FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "idioma_update" ON public.preferencias_idioma FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Configuración accesibilidad
CREATE TABLE public.configuracion_accesibilidad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  alto_contraste boolean DEFAULT false,
  tamano_fuente text DEFAULT 'normal',
  reducir_movimiento boolean DEFAULT false,
  lector_pantalla boolean DEFAULT false,
  navegacion_teclado boolean DEFAULT false,
  daltonismo text DEFAULT 'ninguno',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.configuracion_accesibilidad ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accesibilidad_select" ON public.configuracion_accesibilidad FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "accesibilidad_insert" ON public.configuracion_accesibilidad FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "accesibilidad_update" ON public.configuracion_accesibilidad FOR UPDATE TO authenticated USING (user_id = auth.uid());
