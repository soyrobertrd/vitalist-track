-- ============================================
-- 1. EVOLUCIONES SOAP
-- ============================================
CREATE TABLE public.evoluciones_soap (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  visita_id uuid REFERENCES public.control_visitas(id) ON DELETE SET NULL,
  profesional_id uuid REFERENCES public.personal_salud(id) ON DELETE SET NULL,
  fecha_evolucion timestamp with time zone NOT NULL DEFAULT now(),
  motivo_consulta text,
  subjetivo text,
  objetivo text,
  analisis text,
  plan text,
  signos_vitales jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_evoluciones_paciente ON public.evoluciones_soap(paciente_id, fecha_evolucion DESC);
CREATE INDEX idx_evoluciones_visita ON public.evoluciones_soap(visita_id);

ALTER TABLE public.evoluciones_soap ENABLE ROW LEVEL SECURITY;

CREATE POLICY evoluciones_select_ownership ON public.evoluciones_soap FOR SELECT TO authenticated
  USING (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id));
CREATE POLICY evoluciones_insert_ownership ON public.evoluciones_soap FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id));
CREATE POLICY evoluciones_update_ownership ON public.evoluciones_soap FOR UPDATE TO authenticated
  USING (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id));
CREATE POLICY evoluciones_delete_admin ON public.evoluciones_soap FOR DELETE TO authenticated
  USING (is_admin_or_coordinador(auth.uid()));

CREATE TRIGGER evoluciones_soap_updated_at
  BEFORE UPDATE ON public.evoluciones_soap
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER evoluciones_soap_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.evoluciones_soap
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

-- ============================================
-- 2. DIAGNÓSTICOS ESTRUCTURADOS (CIE-10)
-- ============================================
CREATE TABLE public.diagnosticos_paciente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  evolucion_id uuid REFERENCES public.evoluciones_soap(id) ON DELETE SET NULL,
  codigo_cie10 text,
  descripcion text NOT NULL,
  tipo text NOT NULL DEFAULT 'principal', -- principal, secundario, presuntivo
  estado text NOT NULL DEFAULT 'activo',  -- activo, resuelto, cronico, descartado
  fecha_diagnostico date NOT NULL DEFAULT CURRENT_DATE,
  fecha_resolucion date,
  notas text,
  diagnosticado_por uuid REFERENCES public.personal_salud(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_diagnosticos_paciente ON public.diagnosticos_paciente(paciente_id, estado, fecha_diagnostico DESC);
CREATE INDEX idx_diagnosticos_cie10 ON public.diagnosticos_paciente(codigo_cie10);

ALTER TABLE public.diagnosticos_paciente ENABLE ROW LEVEL SECURITY;

CREATE POLICY diagnosticos_select_ownership ON public.diagnosticos_paciente FOR SELECT TO authenticated
  USING (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id));
CREATE POLICY diagnosticos_insert_ownership ON public.diagnosticos_paciente FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id));
CREATE POLICY diagnosticos_update_ownership ON public.diagnosticos_paciente FOR UPDATE TO authenticated
  USING (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id));
CREATE POLICY diagnosticos_delete_admin ON public.diagnosticos_paciente FOR DELETE TO authenticated
  USING (is_admin_or_coordinador(auth.uid()));

CREATE TRIGGER diagnosticos_updated_at
  BEFORE UPDATE ON public.diagnosticos_paciente
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER diagnosticos_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.diagnosticos_paciente
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

-- ============================================
-- 3. DOCUMENTOS CLÍNICOS
-- ============================================
CREATE TABLE public.documentos_clinicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  evolucion_id uuid REFERENCES public.evoluciones_soap(id) ON DELETE SET NULL,
  visita_id uuid REFERENCES public.control_visitas(id) ON DELETE SET NULL,
  categoria text NOT NULL DEFAULT 'otro', -- laboratorio, imagen, receta, informe, consentimiento, otro
  titulo text NOT NULL,
  descripcion text,
  storage_path text NOT NULL,
  mime_type text,
  tamano_bytes bigint,
  fecha_documento date DEFAULT CURRENT_DATE,
  subido_por uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_documentos_paciente ON public.documentos_clinicos(paciente_id, categoria, fecha_documento DESC);

ALTER TABLE public.documentos_clinicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY documentos_select_ownership ON public.documentos_clinicos FOR SELECT TO authenticated
  USING (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id));
CREATE POLICY documentos_insert_ownership ON public.documentos_clinicos FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id));
CREATE POLICY documentos_update_ownership ON public.documentos_clinicos FOR UPDATE TO authenticated
  USING (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id));
CREATE POLICY documentos_delete_ownership ON public.documentos_clinicos FOR DELETE TO authenticated
  USING (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id));

CREATE TRIGGER documentos_updated_at
  BEFORE UPDATE ON public.documentos_clinicos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER documentos_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.documentos_clinicos
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

-- ============================================
-- 4. STORAGE BUCKET PARA DOCUMENTOS CLÍNICOS (PRIVADO)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-clinicos', 'documentos-clinicos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: archivo organizado como {paciente_id}/{filename}
CREATE POLICY "documentos_clinicos_select" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documentos-clinicos'
    AND (
      is_admin_or_coordinador(auth.uid())
      OR is_staff_clinico_de_paciente(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );

CREATE POLICY "documentos_clinicos_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documentos-clinicos'
    AND (
      is_admin_or_coordinador(auth.uid())
      OR is_staff_clinico_de_paciente(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );

CREATE POLICY "documentos_clinicos_update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'documentos-clinicos'
    AND (
      is_admin_or_coordinador(auth.uid())
      OR is_staff_clinico_de_paciente(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );

CREATE POLICY "documentos_clinicos_delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'documentos-clinicos'
    AND (
      is_admin_or_coordinador(auth.uid())
      OR is_staff_clinico_de_paciente(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );