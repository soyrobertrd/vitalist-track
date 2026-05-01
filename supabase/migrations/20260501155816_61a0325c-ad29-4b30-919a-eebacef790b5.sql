CREATE TABLE public.forecast_ingresos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  anio INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  categoria TEXT NOT NULL,
  monto_estimado NUMERIC(14,2) NOT NULL DEFAULT 0,
  monto_real NUMERIC(14,2) DEFAULT 0,
  notas TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (workspace_id, anio, mes, categoria)
);
ALTER TABLE public.forecast_ingresos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Forecast del workspace" ON public.forecast_ingresos FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TABLE public.ar_aging_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  fecha_corte DATE NOT NULL,
  rango_0_30 NUMERIC(14,2) DEFAULT 0,
  rango_31_60 NUMERIC(14,2) DEFAULT 0,
  rango_61_90 NUMERIC(14,2) DEFAULT 0,
  rango_90_plus NUMERIC(14,2) DEFAULT 0,
  total NUMERIC(14,2) DEFAULT 0,
  detalle JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ar_aging_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AR del workspace" ON public.ar_aging_snapshots FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TABLE public.centros_costo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  responsable_id UUID,
  presupuesto_anual NUMERIC(14,2) DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (workspace_id, codigo)
);
ALTER TABLE public.centros_costo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Centros del workspace" ON public.centros_costo FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TABLE public.costeo_servicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  codigo_servicio TEXT NOT NULL,
  nombre_servicio TEXT NOT NULL,
  centro_costo_id UUID REFERENCES public.centros_costo(id),
  costo_directo NUMERIC(12,2) DEFAULT 0,
  costo_indirecto NUMERIC(12,2) DEFAULT 0,
  costo_total NUMERIC(12,2) GENERATED ALWAYS AS (costo_directo + costo_indirecto) STORED,
  precio_venta NUMERIC(12,2) DEFAULT 0,
  margen_bruto NUMERIC(5,2),
  vigente_desde DATE DEFAULT CURRENT_DATE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.costeo_servicios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Costeo del workspace" ON public.costeo_servicios FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TABLE public.evaluaciones_desempeno (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  empleado_id UUID NOT NULL,
  evaluador_id UUID,
  periodo TEXT NOT NULL,
  fecha_evaluacion DATE DEFAULT CURRENT_DATE,
  competencias JSONB DEFAULT '[]'::jsonb,
  calificacion_global NUMERIC(4,2) CHECK (calificacion_global BETWEEN 0 AND 5),
  fortalezas TEXT,
  areas_mejora TEXT,
  plan_accion TEXT,
  estado TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador','enviada','firmada','cerrada')),
  firmada_empleado BOOLEAN DEFAULT false,
  firmada_evaluador BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.evaluaciones_desempeno ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Evaluaciones del workspace" ON public.evaluaciones_desempeno FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TABLE public.metas_incentivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  empleado_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  metrica TEXT,
  meta_valor NUMERIC(14,2),
  valor_actual NUMERIC(14,2) DEFAULT 0,
  unidad TEXT,
  bono_monto NUMERIC(12,2) DEFAULT 0,
  porcentaje_cumplimiento NUMERIC(5,2) DEFAULT 0,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  estado TEXT DEFAULT 'activa' CHECK (estado IN ('activa','completada','vencida','cancelada','pagada')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.metas_incentivos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Metas del workspace" ON public.metas_incentivos FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TABLE public.capacitaciones_empleados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  empleado_id UUID NOT NULL,
  curso TEXT NOT NULL,
  institucion TEXT,
  modalidad TEXT,
  horas INTEGER,
  fecha_inicio DATE,
  fecha_fin DATE,
  estado TEXT DEFAULT 'en_curso' CHECK (estado IN ('en_curso','completado','abandonado','reprobado')),
  certificado_url TEXT,
  calificacion NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.capacitaciones_empleados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Capacitaciones del workspace" ON public.capacitaciones_empleados FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER trg_forecast_upd BEFORE UPDATE ON public.forecast_ingresos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_centros_upd BEFORE UPDATE ON public.centros_costo
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_costeo_upd BEFORE UPDATE ON public.costeo_servicios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_evaldes_upd BEFORE UPDATE ON public.evaluaciones_desempeno
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_metas_upd BEFORE UPDATE ON public.metas_incentivos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_capac_upd BEFORE UPDATE ON public.capacitaciones_empleados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.calcular_cumplimiento_meta()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.meta_valor IS NOT NULL AND NEW.meta_valor > 0 THEN
    NEW.porcentaje_cumplimiento := LEAST(100, ROUND((NEW.valor_actual / NEW.meta_valor) * 100, 2));
    IF NEW.porcentaje_cumplimiento >= 100 AND NEW.estado = 'activa' THEN
      NEW.estado := 'completada';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_metas_cumplimiento BEFORE INSERT OR UPDATE ON public.metas_incentivos
  FOR EACH ROW EXECUTE FUNCTION public.calcular_cumplimiento_meta();

CREATE OR REPLACE FUNCTION public.calcular_ar_aging(_workspace_id uuid)
RETURNS TABLE(rango text, monto numeric, cantidad int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH facturas_pendientes AS (
    SELECT
      f.id,
      (COALESCE(f.monto_total,0) - COALESCE(f.monto_pagado,0) - COALESCE(f.monto_seguro,0)) AS saldo,
      (CURRENT_DATE - f.fecha_emision) AS dias
    FROM public.facturas f
    WHERE f.estado IN ('pendiente','parcial','en_seguro')
      AND (COALESCE(f.monto_total,0) - COALESCE(f.monto_pagado,0) - COALESCE(f.monto_seguro,0)) > 0
      AND (_workspace_id IS NULL OR f.workspace_id = _workspace_id)
  )
  SELECT
    CASE
      WHEN dias <= 30 THEN '0-30'
      WHEN dias <= 60 THEN '31-60'
      WHEN dias <= 90 THEN '61-90'
      ELSE '90+'
    END AS rango,
    SUM(saldo)::numeric AS monto,
    COUNT(*)::int AS cantidad
  FROM facturas_pendientes
  GROUP BY 1
  ORDER BY 1;
$$;