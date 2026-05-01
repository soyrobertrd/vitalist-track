
-- Inventario clínico por vertical
CREATE TABLE public.inventario_vertical (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  vertical_tipo text NOT NULL CHECK (vertical_tipo IN ('dental','estetica','recovery','vision')),
  nombre text NOT NULL,
  categoria text DEFAULT 'general',
  sku text,
  stock_actual numeric(12,2) DEFAULT 0,
  stock_minimo numeric(12,2) DEFAULT 5,
  unidad text DEFAULT 'unidad',
  precio_costo numeric(12,2) DEFAULT 0,
  precio_venta numeric(12,2) DEFAULT 0,
  proveedor text,
  lote text,
  fecha_vencimiento date,
  ubicacion text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.inventario_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_inventario_vertical" ON public.inventario_vertical FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE INDEX idx_inv_vert_ws ON public.inventario_vertical(workspace_id, vertical_tipo);

-- Movimientos de inventario
CREATE TABLE public.movimientos_inventario_vertical (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  vertical_tipo text NOT NULL CHECK (vertical_tipo IN ('dental','estetica','recovery','vision')),
  item_id uuid REFERENCES public.inventario_vertical(id) ON DELETE CASCADE NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('entrada','salida','ajuste','merma','devolucion')),
  cantidad numeric(12,2) NOT NULL,
  motivo text,
  usuario_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.movimientos_inventario_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_mov_inv_vertical" ON public.movimientos_inventario_vertical FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Trigger para aplicar movimientos
CREATE OR REPLACE FUNCTION public.aplicar_movimiento_inventario_vertical()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_delta numeric;
BEGIN
  v_delta := CASE
    WHEN NEW.tipo IN ('entrada','devolucion') THEN NEW.cantidad
    WHEN NEW.tipo IN ('salida','merma') THEN -NEW.cantidad
    WHEN NEW.tipo = 'ajuste' THEN NEW.cantidad
    ELSE 0
  END;
  UPDATE public.inventario_vertical SET stock_actual = stock_actual + v_delta, updated_at = now() WHERE id = NEW.item_id;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_mov_inv_vertical AFTER INSERT ON public.movimientos_inventario_vertical
FOR EACH ROW EXECUTE FUNCTION public.aplicar_movimiento_inventario_vertical();

-- Reportes KPI por vertical
CREATE TABLE public.reportes_kpi_vertical (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  vertical_tipo text NOT NULL CHECK (vertical_tipo IN ('dental','estetica','recovery','vision')),
  tipo_kpi text NOT NULL,
  valor numeric(14,2) DEFAULT 0,
  periodo text NOT NULL,
  fecha_inicio date,
  fecha_fin date,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.reportes_kpi_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_kpi_vertical" ON public.reportes_kpi_vertical FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Onboarding vertical
CREATE TABLE public.onboarding_vertical (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  vertical_tipo text NOT NULL CHECK (vertical_tipo IN ('dental','estetica','recovery','vision')),
  paso_actual int DEFAULT 1,
  completado boolean DEFAULT false,
  datos jsonb DEFAULT '{}',
  plantilla_seleccionada text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, vertical_tipo)
);

ALTER TABLE public.onboarding_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_onboarding_vertical" ON public.onboarding_vertical FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Plantillas de servicios predefinidos
CREATE TABLE public.plantillas_servicio_vertical (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical_tipo text NOT NULL CHECK (vertical_tipo IN ('dental','estetica','recovery','vision')),
  subnicho text NOT NULL,
  nombre_servicio text NOT NULL,
  precio_sugerido numeric(12,2) DEFAULT 0,
  duracion_minutos int DEFAULT 30,
  descripcion text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.plantillas_servicio_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_read_plantillas" ON public.plantillas_servicio_vertical FOR SELECT USING (true);

-- Updated_at triggers
CREATE TRIGGER upd_inventario_vertical BEFORE UPDATE ON public.inventario_vertical FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER upd_onboarding_vertical BEFORE UPDATE ON public.onboarding_vertical FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
