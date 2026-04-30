
-- Tipos de cuenta
CREATE TYPE public.tipo_cuenta_contable AS ENUM ('activo','pasivo','capital','ingreso','gasto','costo');
CREATE TYPE public.naturaleza_cuenta AS ENUM ('deudora','acreedora');
CREATE TYPE public.estado_asiento AS ENUM ('borrador','aprobado','anulado');

-- Cuentas contables (catálogo)
CREATE TABLE public.cuentas_contables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) NOT NULL,
  codigo text NOT NULL,
  nombre text NOT NULL,
  tipo tipo_cuenta_contable NOT NULL,
  naturaleza naturaleza_cuenta NOT NULL DEFAULT 'deudora',
  cuenta_padre_id uuid REFERENCES public.cuentas_contables(id),
  nivel int DEFAULT 1,
  acepta_movimientos boolean DEFAULT true,
  activa boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, codigo)
);

ALTER TABLE public.cuentas_contables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_select_cuentas" ON public.cuentas_contables FOR SELECT TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_insert_cuentas" ON public.cuentas_contables FOR INSERT TO authenticated WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));
CREATE POLICY "ws_update_cuentas" ON public.cuentas_contables FOR UPDATE TO authenticated USING (public.is_workspace_admin(auth.uid(), workspace_id));
CREATE POLICY "ws_delete_cuentas" ON public.cuentas_contables FOR DELETE TO authenticated USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE TRIGGER update_cuentas_contables_updated_at BEFORE UPDATE ON public.cuentas_contables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_cuentas_contables AFTER INSERT OR UPDATE OR DELETE ON public.cuentas_contables FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

-- Asientos contables
CREATE TABLE public.asientos_contables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) NOT NULL,
  numero text UNIQUE,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  descripcion text NOT NULL,
  referencia text,
  estado estado_asiento NOT NULL DEFAULT 'borrador',
  total_debe numeric(14,2) DEFAULT 0,
  total_haber numeric(14,2) DEFAULT 0,
  creado_por uuid REFERENCES auth.users(id),
  aprobado_por uuid REFERENCES auth.users(id),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.asientos_contables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_select_asientos" ON public.asientos_contables FOR SELECT TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_insert_asientos" ON public.asientos_contables FOR INSERT TO authenticated WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_update_asientos" ON public.asientos_contables FOR UPDATE TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_delete_asientos" ON public.asientos_contables FOR DELETE TO authenticated USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE OR REPLACE FUNCTION public.generar_numero_asiento()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.asientos_contables WHERE numero LIKE 'AST-' || v_year || '-%';
    NEW.numero := 'AST-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_numero_asiento BEFORE INSERT ON public.asientos_contables FOR EACH ROW EXECUTE FUNCTION public.generar_numero_asiento();
CREATE TRIGGER update_asientos_updated_at BEFORE UPDATE ON public.asientos_contables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_asientos_contables AFTER INSERT OR UPDATE OR DELETE ON public.asientos_contables FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

-- Líneas de asiento
CREATE TABLE public.lineas_asiento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asiento_id uuid REFERENCES public.asientos_contables(id) ON DELETE CASCADE NOT NULL,
  cuenta_id uuid REFERENCES public.cuentas_contables(id) NOT NULL,
  descripcion text,
  debe numeric(14,2) NOT NULL DEFAULT 0,
  haber numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lineas_asiento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_select_lineas" ON public.lineas_asiento FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.asientos_contables a WHERE a.id = asiento_id AND public.is_workspace_member(auth.uid(), a.workspace_id)));
CREATE POLICY "ws_insert_lineas" ON public.lineas_asiento FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.asientos_contables a WHERE a.id = asiento_id AND public.is_workspace_member(auth.uid(), a.workspace_id)));
CREATE POLICY "ws_update_lineas" ON public.lineas_asiento FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.asientos_contables a WHERE a.id = asiento_id AND public.is_workspace_member(auth.uid(), a.workspace_id)));
CREATE POLICY "ws_delete_lineas" ON public.lineas_asiento FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.asientos_contables a WHERE a.id = asiento_id AND public.is_workspace_member(auth.uid(), a.workspace_id)));

-- Trigger para recalcular totales del asiento
CREATE OR REPLACE FUNCTION public.recalcular_asiento()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_asiento_id uuid;
BEGIN
  v_asiento_id := COALESCE(NEW.asiento_id, OLD.asiento_id);
  UPDATE public.asientos_contables SET
    total_debe = COALESCE((SELECT SUM(debe) FROM public.lineas_asiento WHERE asiento_id = v_asiento_id), 0),
    total_haber = COALESCE((SELECT SUM(haber) FROM public.lineas_asiento WHERE asiento_id = v_asiento_id), 0),
    updated_at = now()
  WHERE id = v_asiento_id;
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER trg_recalcular_asiento AFTER INSERT OR UPDATE OR DELETE ON public.lineas_asiento FOR EACH ROW EXECUTE FUNCTION public.recalcular_asiento();
