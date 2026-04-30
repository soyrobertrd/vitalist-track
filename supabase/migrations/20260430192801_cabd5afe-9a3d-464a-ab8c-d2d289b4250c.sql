
-- Enum for lab order status
CREATE TYPE public.estado_orden_lab AS ENUM ('pendiente','en_proceso','parcial','completada','cancelada');

-- Enum for priority
CREATE TYPE public.prioridad_lab AS ENUM ('rutina','urgente','stat');

-- Lab order panels / profiles
CREATE TABLE public.paneles_laboratorio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  nombre text NOT NULL,
  codigo text,
  descripcion text,
  pruebas_incluidas jsonb DEFAULT '[]'::jsonb,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Lab orders
CREATE TABLE public.ordenes_laboratorio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE CASCADE NOT NULL,
  medico_solicitante_id uuid REFERENCES public.personal_salud(id),
  numero_orden text,
  estado estado_orden_lab DEFAULT 'pendiente',
  prioridad prioridad_lab DEFAULT 'rutina',
  diagnostico_presuntivo text,
  indicaciones text,
  fecha_solicitud timestamptz DEFAULT now(),
  fecha_recepcion_muestra timestamptz,
  fecha_resultado timestamptz,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Individual tests within an order
CREATE TABLE public.pruebas_laboratorio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id uuid REFERENCES public.ordenes_laboratorio(id) ON DELETE CASCADE NOT NULL,
  nombre_prueba text NOT NULL,
  categoria text,
  resultado text,
  unidad text,
  valor_referencia_min numeric,
  valor_referencia_max numeric,
  rango_referencia_texto text,
  anormal boolean DEFAULT false,
  critico boolean DEFAULT false,
  estado estado_orden_lab DEFAULT 'pendiente',
  notas text,
  realizado_por uuid REFERENCES public.personal_salud(id),
  fecha_resultado timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auto-generate order number
CREATE OR REPLACE FUNCTION public.generar_numero_orden_lab()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero_orden IS NULL OR NEW.numero_orden = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.ordenes_laboratorio
      WHERE numero_orden LIKE 'LAB-' || v_year || '-%';
    NEW.numero_orden := 'LAB-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_numero_orden_lab BEFORE INSERT ON public.ordenes_laboratorio
FOR EACH ROW EXECUTE FUNCTION public.generar_numero_orden_lab();

-- Updated_at triggers
CREATE TRIGGER update_ordenes_lab_updated_at BEFORE UPDATE ON public.ordenes_laboratorio
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pruebas_lab_updated_at BEFORE UPDATE ON public.pruebas_laboratorio
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_paneles_lab_updated_at BEFORE UPDATE ON public.paneles_laboratorio
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.paneles_laboratorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_laboratorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pruebas_laboratorio ENABLE ROW LEVEL SECURITY;

-- Paneles
CREATE POLICY "ws_member_select_paneles" ON public.paneles_laboratorio FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_member_insert_paneles" ON public.paneles_laboratorio FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_member_update_paneles" ON public.paneles_laboratorio FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Ordenes
CREATE POLICY "ws_member_select_ordenes_lab" ON public.ordenes_laboratorio FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_member_insert_ordenes_lab" ON public.ordenes_laboratorio FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_member_update_ordenes_lab" ON public.ordenes_laboratorio FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "admin_delete_ordenes_lab" ON public.ordenes_laboratorio FOR DELETE TO authenticated
  USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- Pruebas (via orden workspace)
CREATE POLICY "ws_member_select_pruebas_lab" ON public.pruebas_laboratorio FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ordenes_laboratorio o WHERE o.id = orden_id AND public.is_workspace_member(auth.uid(), o.workspace_id)));
CREATE POLICY "ws_member_insert_pruebas_lab" ON public.pruebas_laboratorio FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.ordenes_laboratorio o WHERE o.id = orden_id AND public.is_workspace_member(auth.uid(), o.workspace_id)));
CREATE POLICY "ws_member_update_pruebas_lab" ON public.pruebas_laboratorio FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ordenes_laboratorio o WHERE o.id = orden_id AND public.is_workspace_member(auth.uid(), o.workspace_id)));

-- Audit triggers
CREATE TRIGGER audit_ordenes_lab AFTER INSERT OR UPDATE OR DELETE ON public.ordenes_laboratorio
FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
CREATE TRIGGER audit_pruebas_lab AFTER INSERT OR UPDATE OR DELETE ON public.pruebas_laboratorio
FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
