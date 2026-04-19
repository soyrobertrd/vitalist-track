-- Tabla facturas
CREATE TABLE public.facturas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_factura text NOT NULL UNIQUE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  visita_id uuid REFERENCES public.control_visitas(id) ON DELETE SET NULL,
  fecha_emision date NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento date,
  monto_total numeric(12,2) NOT NULL DEFAULT 0,
  monto_pagado numeric(12,2) NOT NULL DEFAULT 0,
  monto_seguro numeric(12,2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagada','parcial','anulada','en_seguro')),
  metodo_pago text,
  aseguradora text,
  numero_autorizacion text,
  descripcion text,
  notas text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "facturas_select_ownership" ON public.facturas FOR SELECT TO authenticated
USING (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));

CREATE POLICY "facturas_insert_ownership" ON public.facturas FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));

CREATE POLICY "facturas_update_ownership" ON public.facturas FOR UPDATE TO authenticated
USING (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));

CREATE POLICY "facturas_delete_admin" ON public.facturas FOR DELETE TO authenticated
USING (public.is_admin_or_coordinador(auth.uid()));

CREATE INDEX idx_facturas_paciente ON public.facturas(paciente_id);
CREATE INDEX idx_facturas_estado ON public.facturas(estado);
CREATE INDEX idx_facturas_fecha_emision ON public.facturas(fecha_emision);

-- Tabla pagos
CREATE TABLE public.pagos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  factura_id uuid NOT NULL REFERENCES public.facturas(id) ON DELETE CASCADE,
  monto numeric(12,2) NOT NULL CHECK (monto > 0),
  fecha_pago date NOT NULL DEFAULT CURRENT_DATE,
  metodo text NOT NULL DEFAULT 'efectivo' CHECK (metodo IN ('efectivo','tarjeta','transferencia','cheque','seguro','otro')),
  referencia text,
  notas text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pagos_select_ownership" ON public.pagos FOR SELECT TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR EXISTS (SELECT 1 FROM public.facturas f WHERE f.id = pagos.factura_id AND public.is_staff_clinico_de_paciente(auth.uid(), f.paciente_id))
);

CREATE POLICY "pagos_insert_ownership" ON public.pagos FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin_or_coordinador(auth.uid())
  OR EXISTS (SELECT 1 FROM public.facturas f WHERE f.id = pagos.factura_id AND public.is_staff_clinico_de_paciente(auth.uid(), f.paciente_id))
);

CREATE POLICY "pagos_update_ownership" ON public.pagos FOR UPDATE TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR EXISTS (SELECT 1 FROM public.facturas f WHERE f.id = pagos.factura_id AND public.is_staff_clinico_de_paciente(auth.uid(), f.paciente_id))
);

CREATE POLICY "pagos_delete_admin" ON public.pagos FOR DELETE TO authenticated
USING (public.is_admin_or_coordinador(auth.uid()));

CREATE INDEX idx_pagos_factura ON public.pagos(factura_id);

-- Trigger updated_at
CREATE TRIGGER trg_facturas_updated_at BEFORE UPDATE ON public.facturas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_pagos_updated_at BEFORE UPDATE ON public.pagos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auditoría
CREATE TRIGGER audit_facturas AFTER INSERT OR UPDATE OR DELETE ON public.facturas
FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

CREATE TRIGGER audit_pagos AFTER INSERT OR UPDATE OR DELETE ON public.pagos
FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

-- Función para recalcular estado y monto pagado de la factura
CREATE OR REPLACE FUNCTION public.recalcular_factura()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_factura_id uuid;
  v_total_pagado numeric(12,2);
  v_total numeric(12,2);
  v_estado text;
BEGIN
  v_factura_id := COALESCE(NEW.factura_id, OLD.factura_id);

  SELECT COALESCE(SUM(monto), 0) INTO v_total_pagado
  FROM public.pagos WHERE factura_id = v_factura_id;

  SELECT monto_total INTO v_total FROM public.facturas WHERE id = v_factura_id;

  IF v_total_pagado >= v_total AND v_total > 0 THEN
    v_estado := 'pagada';
  ELSIF v_total_pagado > 0 THEN
    v_estado := 'parcial';
  ELSE
    v_estado := 'pendiente';
  END IF;

  UPDATE public.facturas
  SET monto_pagado = v_total_pagado,
      estado = CASE WHEN estado = 'anulada' THEN 'anulada'
                    WHEN estado = 'en_seguro' AND v_total_pagado < v_total THEN 'en_seguro'
                    ELSE v_estado END,
      updated_at = now()
  WHERE id = v_factura_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_recalcular_factura
AFTER INSERT OR UPDATE OR DELETE ON public.pagos
FOR EACH ROW EXECUTE FUNCTION public.recalcular_factura();

-- Generador de número de factura
CREATE OR REPLACE FUNCTION public.generar_numero_factura()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year text;
  v_count int;
BEGIN
  IF NEW.numero_factura IS NULL OR NEW.numero_factura = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.facturas
    WHERE numero_factura LIKE 'FAC-' || v_year || '-%';
    NEW.numero_factura := 'FAC-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generar_numero_factura
BEFORE INSERT ON public.facturas
FOR EACH ROW EXECUTE FUNCTION public.generar_numero_factura();