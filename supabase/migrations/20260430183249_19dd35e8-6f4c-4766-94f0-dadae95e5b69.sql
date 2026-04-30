
-- Enum para estados de autorización
CREATE TYPE public.estado_autorizacion AS ENUM ('solicitada','en_revision','aprobada','rechazada','vencida','cancelada');

-- Enum para estados de reclamación
CREATE TYPE public.estado_reclamacion AS ENUM ('borrador','enviada','en_revision','pagada','rechazada','parcial','anulada');

-- ========== ASEGURADORAS ==========
CREATE TABLE public.aseguradoras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  codigo text,
  rnc text,
  telefono text,
  email text,
  direccion text,
  activa boolean NOT NULL DEFAULT true,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.aseguradoras ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_aseguradoras_ws ON public.aseguradoras(workspace_id);

CREATE POLICY "ws_member_select_aseguradoras" ON public.aseguradoras FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_admin_insert_aseguradoras" ON public.aseguradoras FOR INSERT
  WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));
CREATE POLICY "ws_admin_update_aseguradoras" ON public.aseguradoras FOR UPDATE
  USING (public.is_workspace_admin(auth.uid(), workspace_id));
CREATE POLICY "ws_admin_delete_aseguradoras" ON public.aseguradoras FOR DELETE
  USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE TRIGGER update_aseguradoras_ts BEFORE UPDATE ON public.aseguradoras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== PLANES DE SEGURO ==========
CREATE TABLE public.planes_seguro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aseguradora_id uuid NOT NULL REFERENCES public.aseguradoras(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  codigo text,
  cobertura_porcentaje numeric(5,2) DEFAULT 80,
  copago numeric(12,2) DEFAULT 0,
  deducible numeric(12,2) DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.planes_seguro ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_planes_seguro_aseg ON public.planes_seguro(aseguradora_id);

CREATE POLICY "ws_member_select_planes" ON public.planes_seguro FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_admin_insert_planes" ON public.planes_seguro FOR INSERT
  WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));
CREATE POLICY "ws_admin_update_planes" ON public.planes_seguro FOR UPDATE
  USING (public.is_workspace_admin(auth.uid(), workspace_id));
CREATE POLICY "ws_admin_delete_planes" ON public.planes_seguro FOR DELETE
  USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE TRIGGER update_planes_seguro_ts BEFORE UPDATE ON public.planes_seguro
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== TARIFARIOS ARS ==========
CREATE TABLE public.tarifarios_ars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aseguradora_id uuid NOT NULL REFERENCES public.aseguradoras(id) ON DELETE CASCADE,
  plan_seguro_id uuid REFERENCES public.planes_seguro(id) ON DELETE SET NULL,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  codigo_procedimiento text NOT NULL,
  descripcion text NOT NULL,
  precio_lista numeric(12,2) NOT NULL DEFAULT 0,
  precio_convenio numeric(12,2),
  cobertura_porcentaje numeric(5,2),
  requiere_autorizacion boolean NOT NULL DEFAULT false,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tarifarios_ars ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tarifarios_aseg ON public.tarifarios_ars(aseguradora_id);
CREATE INDEX idx_tarifarios_codigo ON public.tarifarios_ars(workspace_id, codigo_procedimiento);

CREATE POLICY "ws_member_select_tarifarios" ON public.tarifarios_ars FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_admin_insert_tarifarios" ON public.tarifarios_ars FOR INSERT
  WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));
CREATE POLICY "ws_admin_update_tarifarios" ON public.tarifarios_ars FOR UPDATE
  USING (public.is_workspace_admin(auth.uid(), workspace_id));
CREATE POLICY "ws_admin_delete_tarifarios" ON public.tarifarios_ars FOR DELETE
  USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE TRIGGER update_tarifarios_ts BEFORE UPDATE ON public.tarifarios_ars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== AUTORIZACIONES MÉDICAS ==========
CREATE TABLE public.autorizaciones_medicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  aseguradora_id uuid NOT NULL REFERENCES public.aseguradoras(id) ON DELETE CASCADE,
  plan_seguro_id uuid REFERENCES public.planes_seguro(id) ON DELETE SET NULL,
  factura_id uuid REFERENCES public.facturas(id) ON DELETE SET NULL,
  numero_autorizacion text,
  estado public.estado_autorizacion NOT NULL DEFAULT 'solicitada',
  procedimiento text NOT NULL,
  codigo_procedimiento text,
  diagnostico_cie10 text,
  monto_solicitado numeric(12,2),
  monto_autorizado numeric(12,2),
  fecha_solicitud date NOT NULL DEFAULT CURRENT_DATE,
  fecha_respuesta date,
  fecha_vencimiento date,
  medico_solicitante uuid REFERENCES public.personal_salud(id) ON DELETE SET NULL,
  motivo_rechazo text,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.autorizaciones_medicas ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_autorizaciones_paciente ON public.autorizaciones_medicas(paciente_id);
CREATE INDEX idx_autorizaciones_aseg ON public.autorizaciones_medicas(aseguradora_id);
CREATE INDEX idx_autorizaciones_estado ON public.autorizaciones_medicas(estado);

CREATE POLICY "ws_member_select_autorizaciones" ON public.autorizaciones_medicas FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_member_insert_autorizaciones" ON public.autorizaciones_medicas FOR INSERT
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_member_update_autorizaciones" ON public.autorizaciones_medicas FOR UPDATE
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_admin_delete_autorizaciones" ON public.autorizaciones_medicas FOR DELETE
  USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE TRIGGER update_autorizaciones_ts BEFORE UPDATE ON public.autorizaciones_medicas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auditoría
CREATE TRIGGER audit_autorizaciones AFTER INSERT OR UPDATE OR DELETE ON public.autorizaciones_medicas
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

-- ========== RECLAMACIONES ARS ==========
CREATE TABLE public.reclamaciones_ars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  sucursal_id uuid REFERENCES public.sucursales(id) ON DELETE SET NULL,
  aseguradora_id uuid NOT NULL REFERENCES public.aseguradoras(id) ON DELETE CASCADE,
  numero_reclamacion text,
  numero_lote text,
  estado public.estado_reclamacion NOT NULL DEFAULT 'borrador',
  fecha_envio date,
  fecha_respuesta date,
  monto_reclamado numeric(12,2) NOT NULL DEFAULT 0,
  monto_aprobado numeric(12,2) DEFAULT 0,
  monto_rechazado numeric(12,2) DEFAULT 0,
  cantidad_casos int NOT NULL DEFAULT 0,
  periodo_desde date,
  periodo_hasta date,
  motivo_rechazo text,
  notas text,
  enviado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reclamaciones_ars ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_reclamaciones_aseg ON public.reclamaciones_ars(aseguradora_id);
CREATE INDEX idx_reclamaciones_estado ON public.reclamaciones_ars(estado);

CREATE POLICY "ws_member_select_reclamaciones" ON public.reclamaciones_ars FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_member_insert_reclamaciones" ON public.reclamaciones_ars FOR INSERT
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_member_update_reclamaciones" ON public.reclamaciones_ars FOR UPDATE
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_admin_delete_reclamaciones" ON public.reclamaciones_ars FOR DELETE
  USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE TRIGGER update_reclamaciones_ts BEFORE UPDATE ON public.reclamaciones_ars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_reclamaciones AFTER INSERT OR UPDATE OR DELETE ON public.reclamaciones_ars
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

-- Detalle de reclamación (facturas incluidas)
CREATE TABLE public.reclamaciones_detalle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reclamacion_id uuid NOT NULL REFERENCES public.reclamaciones_ars(id) ON DELETE CASCADE,
  factura_id uuid REFERENCES public.facturas(id) ON DELETE SET NULL,
  autorizacion_id uuid REFERENCES public.autorizaciones_medicas(id) ON DELETE SET NULL,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  procedimiento text,
  monto_facturado numeric(12,2) NOT NULL DEFAULT 0,
  monto_reclamado numeric(12,2) NOT NULL DEFAULT 0,
  monto_aprobado numeric(12,2) DEFAULT 0,
  estado text DEFAULT 'incluido',
  motivo_glosa text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reclamaciones_detalle ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_recl_det_recl ON public.reclamaciones_detalle(reclamacion_id);

CREATE POLICY "ws_member_select_recl_det" ON public.reclamaciones_detalle FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.reclamaciones_ars r
    WHERE r.id = reclamacion_id AND public.is_workspace_member(auth.uid(), r.workspace_id)
  ));
CREATE POLICY "ws_member_insert_recl_det" ON public.reclamaciones_detalle FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.reclamaciones_ars r
    WHERE r.id = reclamacion_id AND public.is_workspace_member(auth.uid(), r.workspace_id)
  ));
CREATE POLICY "ws_member_update_recl_det" ON public.reclamaciones_detalle FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.reclamaciones_ars r
    WHERE r.id = reclamacion_id AND public.is_workspace_member(auth.uid(), r.workspace_id)
  ));

-- Número automático de reclamación
CREATE OR REPLACE FUNCTION public.generar_numero_reclamacion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero_reclamacion IS NULL OR NEW.numero_reclamacion = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.reclamaciones_ars
      WHERE numero_reclamacion LIKE 'REC-' || v_year || '-%';
    NEW.numero_reclamacion := 'REC-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_numero_reclamacion BEFORE INSERT ON public.reclamaciones_ars
  FOR EACH ROW EXECUTE FUNCTION public.generar_numero_reclamacion();
