
-- Estado orden compra
CREATE TYPE public.estado_orden_compra AS ENUM ('borrador','enviada','parcial','recibida','cancelada');

-- Proveedores
CREATE TABLE public.proveedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) NOT NULL,
  nombre text NOT NULL,
  rnc text,
  contacto_nombre text,
  email text,
  telefono text,
  direccion text,
  notas text,
  activo boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws_select_proveedores" ON public.proveedores FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_insert_proveedores" ON public.proveedores FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_update_proveedores" ON public.proveedores FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_delete_proveedores" ON public.proveedores FOR DELETE TO authenticated
  USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE TRIGGER update_proveedores_updated_at BEFORE UPDATE ON public.proveedores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_proveedores AFTER INSERT OR UPDATE OR DELETE ON public.proveedores
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

-- Ordenes de compra
CREATE TABLE public.ordenes_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) NOT NULL,
  numero_orden text UNIQUE,
  proveedor_id uuid REFERENCES public.proveedores(id),
  estado estado_orden_compra NOT NULL DEFAULT 'borrador',
  prioridad text DEFAULT 'normal',
  fecha_emision date NOT NULL DEFAULT CURRENT_DATE,
  fecha_estimada_entrega date,
  fecha_recepcion date,
  total_estimado numeric(12,2) DEFAULT 0,
  notas text,
  solicitado_por uuid REFERENCES auth.users(id),
  aprobado_por uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ordenes_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws_select_ordenes_compra" ON public.ordenes_compra FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_insert_ordenes_compra" ON public.ordenes_compra FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_update_ordenes_compra" ON public.ordenes_compra FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_delete_ordenes_compra" ON public.ordenes_compra FOR DELETE TO authenticated
  USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- Auto-numbering OC-YYYY-NNNNN
CREATE OR REPLACE FUNCTION public.generar_numero_orden_compra()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero_orden IS NULL OR NEW.numero_orden = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.ordenes_compra
      WHERE numero_orden LIKE 'OC-' || v_year || '-%';
    NEW.numero_orden := 'OC-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_numero_orden_compra BEFORE INSERT ON public.ordenes_compra
  FOR EACH ROW EXECUTE FUNCTION public.generar_numero_orden_compra();

CREATE TRIGGER update_ordenes_compra_updated_at BEFORE UPDATE ON public.ordenes_compra
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_ordenes_compra AFTER INSERT OR UPDATE OR DELETE ON public.ordenes_compra
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

-- Items de orden de compra
CREATE TABLE public.items_orden_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id uuid REFERENCES public.ordenes_compra(id) ON DELETE CASCADE NOT NULL,
  descripcion text NOT NULL,
  item_inventario_id uuid REFERENCES public.inventario_items(id),
  cantidad_solicitada numeric(10,2) NOT NULL DEFAULT 1,
  cantidad_recibida numeric(10,2) DEFAULT 0,
  unidad text DEFAULT 'unidad',
  precio_unitario numeric(12,2) DEFAULT 0,
  subtotal numeric(12,2) GENERATED ALWAYS AS (cantidad_solicitada * precio_unitario) STORED,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.items_orden_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws_select_items_oc" ON public.items_orden_compra FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ordenes_compra oc WHERE oc.id = orden_id AND public.is_workspace_member(auth.uid(), oc.workspace_id)));
CREATE POLICY "ws_insert_items_oc" ON public.items_orden_compra FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.ordenes_compra oc WHERE oc.id = orden_id AND public.is_workspace_member(auth.uid(), oc.workspace_id)));
CREATE POLICY "ws_update_items_oc" ON public.items_orden_compra FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ordenes_compra oc WHERE oc.id = orden_id AND public.is_workspace_member(auth.uid(), oc.workspace_id)));
CREATE POLICY "ws_delete_items_oc" ON public.items_orden_compra FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ordenes_compra oc WHERE oc.id = orden_id AND public.is_workspace_member(auth.uid(), oc.workspace_id)));
