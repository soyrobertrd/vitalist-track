ALTER TABLE public.subscripciones
  ADD COLUMN IF NOT EXISTS ciclo_facturacion text NOT NULL DEFAULT 'mensual'
  CHECK (ciclo_facturacion IN ('mensual', 'anual'));

COMMENT ON COLUMN public.subscripciones.ciclo_facturacion IS
  'Ciclo de facturación: mensual o anual (anual aplica ~15% descuento)';