-- ============================================
-- Tabla: alergias_paciente
-- ============================================
CREATE TABLE public.alergias_paciente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  sustancia text NOT NULL,
  tipo text NOT NULL DEFAULT 'medicamento', -- medicamento, alimento, ambiental, otro
  severidad text NOT NULL DEFAULT 'leve', -- leve, moderada, severa, anafilaxia
  reaccion text,
  notas text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX idx_alergias_paciente ON public.alergias_paciente(paciente_id);

ALTER TABLE public.alergias_paciente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alergias_select_ownership" ON public.alergias_paciente
FOR SELECT TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

CREATE POLICY "alergias_insert_ownership" ON public.alergias_paciente
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

CREATE POLICY "alergias_update_ownership" ON public.alergias_paciente
FOR UPDATE TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

CREATE POLICY "alergias_delete_ownership" ON public.alergias_paciente
FOR DELETE TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

CREATE TRIGGER trg_alergias_updated_at
BEFORE UPDATE ON public.alergias_paciente
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_alergias_audit
AFTER INSERT OR UPDATE OR DELETE ON public.alergias_paciente
FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

-- ============================================
-- Tabla: antecedentes_medicos
-- ============================================
CREATE TABLE public.antecedentes_medicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'personal', -- personal, familiar, quirurgico, hospitalizacion
  condicion text NOT NULL,
  ano integer,
  parentesco text, -- solo si es familiar (madre, padre, hermano, etc.)
  activo boolean NOT NULL DEFAULT true, -- si la condicion sigue activa
  notas text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX idx_antecedentes_paciente ON public.antecedentes_medicos(paciente_id);

ALTER TABLE public.antecedentes_medicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "antecedentes_select_ownership" ON public.antecedentes_medicos
FOR SELECT TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

CREATE POLICY "antecedentes_insert_ownership" ON public.antecedentes_medicos
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

CREATE POLICY "antecedentes_update_ownership" ON public.antecedentes_medicos
FOR UPDATE TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

CREATE POLICY "antecedentes_delete_ownership" ON public.antecedentes_medicos
FOR DELETE TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

CREATE TRIGGER trg_antecedentes_updated_at
BEFORE UPDATE ON public.antecedentes_medicos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_antecedentes_audit
AFTER INSERT OR UPDATE OR DELETE ON public.antecedentes_medicos
FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

-- ============================================
-- Tabla: seguros_paciente
-- ============================================
CREATE TABLE public.seguros_paciente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  aseguradora text NOT NULL, -- ARS / aseguradora
  numero_poliza text,
  numero_afiliado text,
  plan text, -- plan/tipo de cobertura
  titular text, -- nombre del titular
  parentesco_titular text, -- relacion con el titular
  fecha_inicio date,
  fecha_vencimiento date,
  activo boolean NOT NULL DEFAULT true,
  notas text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX idx_seguros_paciente ON public.seguros_paciente(paciente_id);

ALTER TABLE public.seguros_paciente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seguros_select_ownership" ON public.seguros_paciente
FOR SELECT TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

CREATE POLICY "seguros_insert_ownership" ON public.seguros_paciente
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

CREATE POLICY "seguros_update_ownership" ON public.seguros_paciente
FOR UPDATE TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

CREATE POLICY "seguros_delete_ownership" ON public.seguros_paciente
FOR DELETE TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

CREATE TRIGGER trg_seguros_updated_at
BEFORE UPDATE ON public.seguros_paciente
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_seguros_audit
AFTER INSERT OR UPDATE OR DELETE ON public.seguros_paciente
FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();