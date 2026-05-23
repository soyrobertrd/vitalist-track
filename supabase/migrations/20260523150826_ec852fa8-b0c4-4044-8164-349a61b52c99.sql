
CREATE TABLE IF NOT EXISTS public.especialidades_catalogo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  categoria text NOT NULL DEFAULT 'medica',
  descripcion text,
  requiere_exequatur boolean NOT NULL DEFAULT false,
  requiere_colegiatura boolean NOT NULL DEFAULT false,
  global boolean NOT NULL DEFAULT false,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, nombre)
);

CREATE INDEX IF NOT EXISTS idx_esp_cat_ws ON public.especialidades_catalogo(workspace_id);
CREATE INDEX IF NOT EXISTS idx_esp_cat_cat ON public.especialidades_catalogo(categoria);

ALTER TABLE public.especialidades_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "esp_cat_select" ON public.especialidades_catalogo FOR SELECT
TO authenticated USING (global = true OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id)));

CREATE POLICY "esp_cat_insert" ON public.especialidades_catalogo FOR INSERT
TO authenticated WITH CHECK (
  (global = false AND workspace_id IS NOT NULL AND public.is_workspace_admin(auth.uid(), workspace_id))
  OR (global = true AND public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "esp_cat_update" ON public.especialidades_catalogo FOR UPDATE
TO authenticated USING (
  (global = false AND workspace_id IS NOT NULL AND public.is_workspace_admin(auth.uid(), workspace_id))
  OR (global = true AND public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "esp_cat_delete" ON public.especialidades_catalogo FOR DELETE
TO authenticated USING (
  (global = false AND workspace_id IS NOT NULL AND public.is_workspace_admin(auth.uid(), workspace_id))
  OR (global = true AND public.has_role(auth.uid(), 'admin'))
);

CREATE TRIGGER trg_esp_cat_updated BEFORE UPDATE ON public.especialidades_catalogo
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Precarga global
INSERT INTO public.especialidades_catalogo (nombre, categoria, global, requiere_exequatur, requiere_colegiatura) VALUES
('Medicina General','medica',true,true,true),
('Medicina Interna','medica',true,true,true),
('Medicina Familiar','medica',true,true,true),
('Pediatría','medica',true,true,true),
('Ginecología y Obstetricia','medica',true,true,true),
('Cardiología','medica',true,true,true),
('Neurología','medica',true,true,true),
('Neurocirugía','medica',true,true,true),
('Psiquiatría','medica',true,true,true),
('Dermatología','medica',true,true,true),
('Endocrinología','medica',true,true,true),
('Gastroenterología','medica',true,true,true),
('Nefrología','medica',true,true,true),
('Neumología','medica',true,true,true),
('Reumatología','medica',true,true,true),
('Hematología','medica',true,true,true),
('Oncología Médica','medica',true,true,true),
('Infectología','medica',true,true,true),
('Geriatría','medica',true,true,true),
('Cirugía General','medica',true,true,true),
('Cirugía Cardiovascular','medica',true,true,true),
('Cirugía Plástica y Reconstructiva','medica',true,true,true),
('Traumatología y Ortopedia','medica',true,true,true),
('Urología','medica',true,true,true),
('Oftalmología','medica',true,true,true),
('Otorrinolaringología','medica',true,true,true),
('Anestesiología','medica',true,true,true),
('Radiología e Imagenología','medica',true,true,true),
('Medicina de Emergencias','medica',true,true,true),
('Medicina Intensiva','medica',true,true,true),
('Medicina del Trabajo','medica',true,true,true),
('Medicina del Deporte','medica',true,true,true),
('Patología','medica',true,true,true),
('Odontología General','medica',true,true,true),
('Endodoncia','medica',true,true,true),
('Ortodoncia','medica',true,true,true),
('Periodoncia','medica',true,true,true),
('Cirugía Maxilofacial','medica',true,true,true),
('Odontopediatría','medica',true,true,true),
('Implantología Dental','medica',true,true,true),
('Optometría','medica',true,false,true),
('Psicología Clínica','medica',true,false,true),
('Psicología Infantil','medica',true,false,true),
('Neuropsicología','medica',true,false,true),
('Enfermería General','enfermeria',true,false,true),
('Enfermería Especialista','enfermeria',true,false,true),
('Auxiliar de Enfermería','enfermeria',true,false,false),
('Partera','enfermeria',true,false,true),
('Fisioterapia','terapeutica',true,false,true),
('Terapia Ocupacional','terapeutica',true,false,true),
('Terapia del Lenguaje','terapeutica',true,false,true),
('Terapia Respiratoria','terapeutica',true,false,true),
('Nutrición y Dietética','terapeutica',true,false,true),
('Trabajo Social','terapeutica',true,false,true),
('Quiropráctica','terapeutica',true,false,true),
('Bioanálisis / Laboratorio Clínico','tecnica',true,false,true),
('Técnico Radiólogo','tecnica',true,false,false),
('Técnico de Farmacia','tecnica',true,false,false),
('Técnico Quirúrgico','tecnica',true,false,false),
('Paramédico','tecnica',true,false,false),
('Técnico en Esterilización','tecnica',true,false,false),
('Farmacéutico','tecnica',true,false,true),
('Recepcionista','administrativa',true,false,false),
('Coordinador Clínico','administrativa',true,false,false),
('Administrador','administrativa',true,false,false),
('Facturador','administrativa',true,false,false),
('Caja','administrativa',true,false,false),
('Camillero','administrativa',true,false,false),
('Limpieza Hospitalaria','administrativa',true,false,false),
('Seguridad','administrativa',true,false,false),
('Mantenimiento','administrativa',true,false,false),
('Otro','otra',true,false,false)
ON CONFLICT DO NOTHING;
