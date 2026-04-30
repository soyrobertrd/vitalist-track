
-- Fase J: Farmacia

-- Recetas emitidas
CREATE TABLE public.recetas_farmacia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT UNIQUE,
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE NOT NULL,
  prescriptor_id UUID REFERENCES public.personal_salud(id) ON DELETE SET NULL,
  diagnostico TEXT,
  notas TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','despachada','parcial','cancelada')),
  fecha_emision TIMESTAMPTZ NOT NULL DEFAULT now(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  sucursal_id UUID REFERENCES public.sucursales(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recetas_farmacia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/coord ven todas las recetas" ON public.recetas_farmacia FOR SELECT TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));
CREATE POLICY "Staff clínico ve recetas de sus pacientes" ON public.recetas_farmacia FOR SELECT TO authenticated
  USING (public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));
CREATE POLICY "Admin/coord insertan recetas" ON public.recetas_farmacia FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_coordinador(auth.uid()));
CREATE POLICY "Prescriptor inserta recetas" ON public.recetas_farmacia FOR INSERT TO authenticated
  WITH CHECK (prescriptor_id IN (SELECT id FROM public.personal_salud WHERE user_id = auth.uid()));
CREATE POLICY "Admin/coord actualizan recetas" ON public.recetas_farmacia FOR UPDATE TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));
CREATE POLICY "Admin/coord eliminan recetas" ON public.recetas_farmacia FOR DELETE TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));

-- Auto-number recetas
CREATE OR REPLACE FUNCTION public.generar_numero_receta()
RETURNS trigger AS $$
DECLARE v_year TEXT; v_count INT;
BEGIN
  v_year := to_char(now(), 'YYYY');
  SELECT COUNT(*) + 1 INTO v_count FROM public.recetas_farmacia WHERE numero LIKE 'RX-' || v_year || '-%';
  NEW.numero := 'RX-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_numero_receta BEFORE INSERT ON public.recetas_farmacia
  FOR EACH ROW EXECUTE FUNCTION public.generar_numero_receta();

-- Items de receta
CREATE TABLE public.items_receta (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receta_id UUID REFERENCES public.recetas_farmacia(id) ON DELETE CASCADE NOT NULL,
  medicamento TEXT NOT NULL,
  presentacion TEXT,
  dosis TEXT,
  frecuencia TEXT,
  duracion TEXT,
  cantidad INT NOT NULL DEFAULT 1,
  despachado BOOLEAN NOT NULL DEFAULT false,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.items_receta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso items_receta via receta" ON public.items_receta FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.recetas_farmacia r WHERE r.id = receta_id AND (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), r.paciente_id))));
CREATE POLICY "Admin/coord insertan items_receta" ON public.items_receta FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.recetas_farmacia r WHERE r.id = receta_id AND public.is_admin_or_coordinador(auth.uid())));
CREATE POLICY "Admin/coord actualizan items_receta" ON public.items_receta FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.recetas_farmacia r WHERE r.id = receta_id AND public.is_admin_or_coordinador(auth.uid())));
CREATE POLICY "Admin/coord eliminan items_receta" ON public.items_receta FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.recetas_farmacia r WHERE r.id = receta_id AND public.is_admin_or_coordinador(auth.uid())));

-- Despachos
CREATE TABLE public.despachos_farmacia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT UNIQUE,
  receta_id UUID REFERENCES public.recetas_farmacia(id) ON DELETE CASCADE NOT NULL,
  farmaceutico TEXT,
  observaciones TEXT,
  fecha_despacho TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.despachos_farmacia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/coord ven despachos" ON public.despachos_farmacia FOR SELECT TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));
CREATE POLICY "Admin/coord insertan despachos" ON public.despachos_farmacia FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_coordinador(auth.uid()));
CREATE POLICY "Admin/coord actualizan despachos" ON public.despachos_farmacia FOR UPDATE TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));

CREATE OR REPLACE FUNCTION public.generar_numero_despacho()
RETURNS trigger AS $$
DECLARE v_year TEXT; v_count INT;
BEGIN
  v_year := to_char(now(), 'YYYY');
  SELECT COUNT(*) + 1 INTO v_count FROM public.despachos_farmacia WHERE numero LIKE 'DSP-' || v_year || '-%';
  NEW.numero := 'DSP-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_numero_despacho BEFORE INSERT ON public.despachos_farmacia
  FOR EACH ROW EXECUTE FUNCTION public.generar_numero_despacho();

-- Items despacho
CREATE TABLE public.items_despacho (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  despacho_id UUID REFERENCES public.despachos_farmacia(id) ON DELETE CASCADE NOT NULL,
  item_receta_id UUID REFERENCES public.items_receta(id) ON DELETE SET NULL,
  medicamento TEXT NOT NULL,
  cantidad_despachada INT NOT NULL DEFAULT 0,
  lote TEXT,
  fecha_vencimiento DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.items_despacho ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/coord ven items_despacho" ON public.items_despacho FOR SELECT TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));
CREATE POLICY "Admin/coord insertan items_despacho" ON public.items_despacho FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_coordinador(auth.uid()));

-- Stock farmacia
CREATE TABLE public.stock_farmacia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medicamento TEXT NOT NULL,
  presentacion TEXT,
  lote TEXT,
  fecha_vencimiento DATE,
  cantidad INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 10,
  precio_unitario NUMERIC(12,2) DEFAULT 0,
  ubicacion TEXT,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  sucursal_id UUID REFERENCES public.sucursales(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_farmacia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/coord ven stock" ON public.stock_farmacia FOR SELECT TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));
CREATE POLICY "Admin/coord insertan stock" ON public.stock_farmacia FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_coordinador(auth.uid()));
CREATE POLICY "Admin/coord actualizan stock" ON public.stock_farmacia FOR UPDATE TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));
CREATE POLICY "Admin/coord eliminan stock" ON public.stock_farmacia FOR DELETE TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));

-- Movimientos stock
CREATE TABLE public.movimientos_stock_farmacia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_id UUID REFERENCES public.stock_farmacia(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada','salida','ajuste','devolucion','vencido')),
  cantidad INT NOT NULL,
  motivo TEXT,
  referencia_despacho_id UUID REFERENCES public.despachos_farmacia(id) ON DELETE SET NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.movimientos_stock_farmacia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/coord ven movimientos stock" ON public.movimientos_stock_farmacia FOR SELECT TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));
CREATE POLICY "Admin/coord insertan movimientos stock" ON public.movimientos_stock_farmacia FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_coordinador(auth.uid()));

-- Auditoría
CREATE TRIGGER trg_audit_recetas_farmacia AFTER INSERT OR UPDATE OR DELETE ON public.recetas_farmacia
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
CREATE TRIGGER trg_audit_stock_farmacia AFTER INSERT OR UPDATE OR DELETE ON public.stock_farmacia
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
CREATE TRIGGER trg_audit_despachos_farmacia AFTER INSERT OR UPDATE OR DELETE ON public.despachos_farmacia
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
