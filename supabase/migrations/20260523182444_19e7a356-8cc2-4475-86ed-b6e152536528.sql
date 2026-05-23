
-- Tier 3 polyfills: mapa corporal multi-vertical + vertical en escalas + extender workflow_plantillas

-- 1) Vertical opcional en escalas_clinicas (compatible con datos existentes)
ALTER TABLE public.escalas_clinicas ADD COLUMN IF NOT EXISTS vertical text;
CREATE INDEX IF NOT EXISTS idx_escalas_vertical ON public.escalas_clinicas(vertical) WHERE vertical IS NOT NULL;

-- 2) Mapa corporal: marcas anatómicas reutilizables por todas las verticales
-- (Estética: zonas a tratar; Rehab: dolor; Dermato: lesiones; Recovery: heridas/úlceras)
CREATE TABLE IF NOT EXISTS public.mapa_corporal_marcas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  profesional_id uuid,
  vertical text,
  tipo text NOT NULL DEFAULT 'general', -- dolor, lesion, herida, tratamiento, cicatriz, tatuaje, etc.
  vista text NOT NULL DEFAULT 'frontal', -- frontal, posterior, lateral_izq, lateral_der
  pos_x numeric NOT NULL,    -- 0..100 (porcentaje)
  pos_y numeric NOT NULL,    -- 0..100
  lado text,                  -- izq, der, central
  color text DEFAULT '#ef4444',
  severidad int,              -- 0..10
  etiqueta text,
  notas text,
  fecha timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mapa_corporal_marcas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mapa_select" ON public.mapa_corporal_marcas FOR SELECT TO authenticated
USING (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));
CREATE POLICY "mapa_insert" ON public.mapa_corporal_marcas FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));
CREATE POLICY "mapa_update" ON public.mapa_corporal_marcas FOR UPDATE TO authenticated
USING (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));
CREATE POLICY "mapa_delete" ON public.mapa_corporal_marcas FOR DELETE TO authenticated
USING (public.is_admin_or_coordinador(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_mapa_paciente ON public.mapa_corporal_marcas(paciente_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_mapa_vertical ON public.mapa_corporal_marcas(vertical) WHERE vertical IS NOT NULL;

DROP TRIGGER IF EXISTS audit_mapa_corporal ON public.mapa_corporal_marcas;
CREATE TRIGGER audit_mapa_corporal AFTER INSERT OR UPDATE OR DELETE ON public.mapa_corporal_marcas
FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

DROP TRIGGER IF EXISTS upd_mapa_corporal ON public.mapa_corporal_marcas;
CREATE TRIGGER upd_mapa_corporal BEFORE UPDATE ON public.mapa_corporal_marcas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Workflow plantillas: categoria ya es text libre. Agregar columna vertical opcional
-- para que las plantillas se puedan filtrar/asociar a una vertical específica sin romper.
ALTER TABLE public.workflow_plantillas ADD COLUMN IF NOT EXISTS vertical text;
CREATE INDEX IF NOT EXISTS idx_wfp_vertical ON public.workflow_plantillas(vertical) WHERE vertical IS NOT NULL;
