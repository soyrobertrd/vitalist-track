
-- Fase I: Odontograma

-- Odontogramas (carta dental por paciente)
CREATE TABLE public.odontogramas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE CASCADE NOT NULL,
  profesional_id uuid REFERENCES public.personal_salud(id) ON DELETE SET NULL,
  fecha_evaluacion date NOT NULL DEFAULT CURRENT_DATE,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.odontogramas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws_member_select_odontogramas" ON public.odontogramas FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_member_insert_odontogramas" ON public.odontogramas FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_member_update_odontogramas" ON public.odontogramas FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_admin_delete_odontogramas" ON public.odontogramas FOR DELETE TO authenticated
  USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE TRIGGER update_odontogramas_updated_at BEFORE UPDATE ON public.odontogramas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Hallazgos dentales
CREATE TYPE public.cara_dental AS ENUM ('oclusal','mesial','distal','vestibular','lingual','palatina','incisal');
CREATE TYPE public.tipo_hallazgo_dental AS ENUM ('caries','fractura','ausente','corona','endodoncia','implante','sellante','obturacion','protesis','movilidad','sano');
CREATE TYPE public.estado_hallazgo_dental AS ENUM ('activo','tratado','observacion');

CREATE TABLE public.hallazgos_dentales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  odontograma_id uuid REFERENCES public.odontogramas(id) ON DELETE CASCADE NOT NULL,
  numero_diente smallint NOT NULL CHECK (numero_diente BETWEEN 1 AND 32),
  cara cara_dental,
  tipo tipo_hallazgo_dental NOT NULL DEFAULT 'sano',
  estado estado_hallazgo_dental NOT NULL DEFAULT 'activo',
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hallazgos_dentales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws_member_select_hallazgos" ON public.hallazgos_dentales FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.odontogramas o WHERE o.id = odontograma_id AND public.is_workspace_member(auth.uid(), o.workspace_id)));
CREATE POLICY "ws_member_insert_hallazgos" ON public.hallazgos_dentales FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.odontogramas o WHERE o.id = odontograma_id AND public.is_workspace_member(auth.uid(), o.workspace_id)));
CREATE POLICY "ws_member_update_hallazgos" ON public.hallazgos_dentales FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.odontogramas o WHERE o.id = odontograma_id AND public.is_workspace_member(auth.uid(), o.workspace_id)));
CREATE POLICY "ws_admin_delete_hallazgos" ON public.hallazgos_dentales FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.odontogramas o WHERE o.id = odontograma_id AND public.is_workspace_admin(auth.uid(), o.workspace_id)));

CREATE TRIGGER update_hallazgos_dentales_updated_at BEFORE UPDATE ON public.hallazgos_dentales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Presupuestos dentales
CREATE TYPE public.estado_presupuesto_dental AS ENUM ('borrador','presentado','aceptado','rechazado');

CREATE TABLE public.presupuestos_dentales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE CASCADE NOT NULL,
  numero text UNIQUE,
  total numeric(12,2) NOT NULL DEFAULT 0,
  estado estado_presupuesto_dental NOT NULL DEFAULT 'borrador',
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.presupuestos_dentales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws_member_select_presupuestos_d" ON public.presupuestos_dentales FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_member_insert_presupuestos_d" ON public.presupuestos_dentales FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_member_update_presupuestos_d" ON public.presupuestos_dentales FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_admin_delete_presupuestos_d" ON public.presupuestos_dentales FOR DELETE TO authenticated
  USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE TRIGGER update_presupuestos_dentales_updated_at BEFORE UPDATE ON public.presupuestos_dentales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-numbering presupuestos dentales
CREATE OR REPLACE FUNCTION public.generar_numero_presupuesto_dental()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.presupuestos_dentales WHERE numero LIKE 'PD-' || v_year || '-%';
    NEW.numero := 'PD-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_numero_presupuesto_dental BEFORE INSERT ON public.presupuestos_dentales
  FOR EACH ROW EXECUTE FUNCTION public.generar_numero_presupuesto_dental();

-- Tratamientos dentales
CREATE TYPE public.estado_tratamiento_dental AS ENUM ('pendiente','en_proceso','completado','cancelado');

CREATE TABLE public.tratamientos_dentales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hallazgo_id uuid REFERENCES public.hallazgos_dentales(id) ON DELETE CASCADE NOT NULL,
  presupuesto_id uuid REFERENCES public.presupuestos_dentales(id) ON DELETE SET NULL,
  procedimiento text NOT NULL,
  costo_estimado numeric(12,2) NOT NULL DEFAULT 0,
  estado estado_tratamiento_dental NOT NULL DEFAULT 'pendiente',
  fecha_realizado date,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tratamientos_dentales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws_member_select_trat_dental" ON public.tratamientos_dentales FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.hallazgos_dentales h JOIN public.odontogramas o ON o.id = h.odontograma_id WHERE h.id = hallazgo_id AND public.is_workspace_member(auth.uid(), o.workspace_id)));
CREATE POLICY "ws_member_insert_trat_dental" ON public.tratamientos_dentales FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.hallazgos_dentales h JOIN public.odontogramas o ON o.id = h.odontograma_id WHERE h.id = hallazgo_id AND public.is_workspace_member(auth.uid(), o.workspace_id)));
CREATE POLICY "ws_member_update_trat_dental" ON public.tratamientos_dentales FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.hallazgos_dentales h JOIN public.odontogramas o ON o.id = h.odontograma_id WHERE h.id = hallazgo_id AND public.is_workspace_member(auth.uid(), o.workspace_id)));
CREATE POLICY "ws_admin_delete_trat_dental" ON public.tratamientos_dentales FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.hallazgos_dentales h JOIN public.odontogramas o ON o.id = h.odontograma_id WHERE h.id = hallazgo_id AND public.is_workspace_admin(auth.uid(), o.workspace_id)));

CREATE TRIGGER update_tratamientos_dentales_updated_at BEFORE UPDATE ON public.tratamientos_dentales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recalcular total presupuesto
CREATE OR REPLACE FUNCTION public.recalcular_presupuesto_dental()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_pid uuid;
BEGIN
  v_pid := COALESCE(NEW.presupuesto_id, OLD.presupuesto_id);
  IF v_pid IS NOT NULL THEN
    UPDATE public.presupuestos_dentales SET
      total = COALESCE((SELECT SUM(costo_estimado) FROM public.tratamientos_dentales WHERE presupuesto_id = v_pid), 0),
      updated_at = now()
    WHERE id = v_pid;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER trg_recalcular_presupuesto_dental AFTER INSERT OR UPDATE OR DELETE ON public.tratamientos_dentales
  FOR EACH ROW EXECUTE FUNCTION public.recalcular_presupuesto_dental();
