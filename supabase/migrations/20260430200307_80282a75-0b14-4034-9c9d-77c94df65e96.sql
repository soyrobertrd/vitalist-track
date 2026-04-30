
-- Enum estado período nómina
DO $$ BEGIN
  CREATE TYPE public.estado_periodo_nomina AS ENUM ('borrador','calculado','aprobado','pagado','anulado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Empleados nómina
CREATE TABLE public.empleados_nomina (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  nombre text NOT NULL,
  apellido text NOT NULL DEFAULT '',
  cedula text,
  cargo text,
  departamento text,
  salario_base numeric(12,2) NOT NULL DEFAULT 0,
  cuenta_banco text,
  banco text,
  fecha_ingreso date,
  fecha_salida date,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.empleados_nomina ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws members manage empleados_nomina" ON public.empleados_nomina
  FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER update_empleados_nomina_ts BEFORE UPDATE ON public.empleados_nomina
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Períodos nómina
CREATE TABLE public.periodos_nomina (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  numero text UNIQUE,
  nombre text NOT NULL DEFAULT '',
  fecha_inicio date NOT NULL,
  fecha_fin date NOT NULL,
  estado estado_periodo_nomina NOT NULL DEFAULT 'borrador',
  total_bruto numeric(14,2) NOT NULL DEFAULT 0,
  total_deducciones numeric(14,2) NOT NULL DEFAULT 0,
  total_neto numeric(14,2) NOT NULL DEFAULT 0,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.periodos_nomina ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws members manage periodos_nomina" ON public.periodos_nomina
  FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER update_periodos_nomina_ts BEFORE UPDATE ON public.periodos_nomina
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-number
CREATE OR REPLACE FUNCTION public.generar_numero_periodo_nomina()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.periodos_nomina WHERE numero LIKE 'NOM-' || v_year || '-%';
    NEW.numero := 'NOM-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_numero_periodo_nomina BEFORE INSERT ON public.periodos_nomina
  FOR EACH ROW EXECUTE FUNCTION public.generar_numero_periodo_nomina();

-- Detalle nómina
CREATE TABLE public.detalle_nomina (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo_id uuid REFERENCES public.periodos_nomina(id) ON DELETE CASCADE NOT NULL,
  empleado_id uuid REFERENCES public.empleados_nomina(id) ON DELETE CASCADE NOT NULL,
  salario_base numeric(12,2) NOT NULL DEFAULT 0,
  horas_extra numeric(12,2) NOT NULL DEFAULT 0,
  bono numeric(12,2) NOT NULL DEFAULT 0,
  comisiones numeric(12,2) NOT NULL DEFAULT 0,
  deducciones_sfs numeric(12,2) NOT NULL DEFAULT 0,
  deducciones_afp numeric(12,2) NOT NULL DEFAULT 0,
  deducciones_isr numeric(12,2) NOT NULL DEFAULT 0,
  otras_deducciones numeric(12,2) NOT NULL DEFAULT 0,
  total_bruto numeric(12,2) NOT NULL DEFAULT 0,
  total_deducciones numeric(12,2) NOT NULL DEFAULT 0,
  neto_pagar numeric(12,2) NOT NULL DEFAULT 0,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.detalle_nomina ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws members manage detalle_nomina" ON public.detalle_nomina
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.periodos_nomina pn
    WHERE pn.id = detalle_nomina.periodo_id
      AND public.is_workspace_member(auth.uid(), pn.workspace_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.periodos_nomina pn
    WHERE pn.id = detalle_nomina.periodo_id
      AND public.is_workspace_member(auth.uid(), pn.workspace_id)
  ));

CREATE TRIGGER update_detalle_nomina_ts BEFORE UPDATE ON public.detalle_nomina
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recalcular totales del período
CREATE OR REPLACE FUNCTION public.recalcular_periodo_nomina()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_periodo_id uuid;
BEGIN
  v_periodo_id := COALESCE(NEW.periodo_id, OLD.periodo_id);
  UPDATE public.periodos_nomina SET
    total_bruto = COALESCE((SELECT SUM(total_bruto) FROM public.detalle_nomina WHERE periodo_id = v_periodo_id), 0),
    total_deducciones = COALESCE((SELECT SUM(total_deducciones) FROM public.detalle_nomina WHERE periodo_id = v_periodo_id), 0),
    total_neto = COALESCE((SELECT SUM(neto_pagar) FROM public.detalle_nomina WHERE periodo_id = v_periodo_id), 0),
    updated_at = now()
  WHERE id = v_periodo_id;
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER trg_recalcular_periodo_nomina AFTER INSERT OR UPDATE OR DELETE ON public.detalle_nomina
  FOR EACH ROW EXECUTE FUNCTION public.recalcular_periodo_nomina();
