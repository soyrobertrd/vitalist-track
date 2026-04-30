
-- Enum para estado de estudio
CREATE TYPE public.estado_estudio_imagen AS ENUM ('solicitado','programado','en_proceso','completado','cancelado');

-- Enum para prioridad
CREATE TYPE public.prioridad_estudio_imagen AS ENUM ('rutina','urgente','stat');

-- Tabla principal de estudios de imagen
CREATE TABLE public.estudios_imagen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) NOT NULL,
  numero_orden text UNIQUE,
  paciente_id uuid REFERENCES public.pacientes(id) NOT NULL,
  medico_solicitante_id uuid REFERENCES public.personal_salud(id),
  modalidad text NOT NULL DEFAULT 'rx', -- rx, ct, mri, us, mamografia, pet, otro
  tipo_estudio text NOT NULL, -- e.g. "Rx Torax PA/Lat", "CT Cerebro c/contraste"
  region_anatomica text,
  estado estado_estudio_imagen NOT NULL DEFAULT 'solicitado',
  prioridad prioridad_estudio_imagen NOT NULL DEFAULT 'rutina',
  indicacion_clinica text,
  diagnostico_presuntivo text,
  contraste boolean DEFAULT false,
  sala text,
  tecnico_responsable text,
  radiologo_id uuid REFERENCES public.personal_salud(id),
  fecha_programada timestamptz,
  fecha_realizacion timestamptz,
  fecha_informe timestamptz,
  hallazgos text,
  conclusion text,
  impresion_diagnostica text,
  imagenes_urls jsonb DEFAULT '[]'::jsonb,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-numbering
CREATE OR REPLACE FUNCTION public.generar_numero_orden_imagen()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero_orden IS NULL OR NEW.numero_orden = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.estudios_imagen
      WHERE numero_orden LIKE 'IMG-' || v_year || '-%';
    NEW.numero_orden := 'IMG-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_numero_orden_imagen
  BEFORE INSERT ON public.estudios_imagen
  FOR EACH ROW EXECUTE FUNCTION public.generar_numero_orden_imagen();

-- Updated_at trigger
CREATE TRIGGER update_estudios_imagen_updated_at
  BEFORE UPDATE ON public.estudios_imagen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit trigger
CREATE TRIGGER audit_estudios_imagen
  AFTER INSERT OR UPDATE OR DELETE ON public.estudios_imagen
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

-- RLS
ALTER TABLE public.estudios_imagen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view imaging studies"
  ON public.estudios_imagen FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can insert imaging studies"
  ON public.estudios_imagen FOR INSERT
  TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can update imaging studies"
  ON public.estudios_imagen FOR UPDATE
  TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace admins can delete imaging studies"
  ON public.estudios_imagen FOR DELETE
  TO authenticated
  USING (public.is_workspace_admin(auth.uid(), workspace_id));
