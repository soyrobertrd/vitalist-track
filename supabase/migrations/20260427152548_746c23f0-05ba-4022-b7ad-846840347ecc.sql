
-- =====================================================
-- FASE B: TELEMEDICINA — Campos en control_visitas
-- =====================================================
ALTER TABLE public.control_visitas
  ADD COLUMN IF NOT EXISTS modalidad text NOT NULL DEFAULT 'presencial',
  ADD COLUMN IF NOT EXISTS video_proveedor text,
  ADD COLUMN IF NOT EXISTS video_enlace text,
  ADD COLUMN IF NOT EXISTS video_notas text;

-- Validar modalidad
ALTER TABLE public.control_visitas
  DROP CONSTRAINT IF EXISTS control_visitas_modalidad_check;
ALTER TABLE public.control_visitas
  ADD CONSTRAINT control_visitas_modalidad_check
  CHECK (modalidad IN ('presencial', 'virtual', 'domiciliaria'));

-- =====================================================
-- FASE D: INVENTARIO ADAPTATIVO
-- =====================================================

-- Tabla principal: items de inventario
CREATE TABLE IF NOT EXISTS public.inventario_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  sucursal_id uuid,
  categoria text NOT NULL DEFAULT 'muestra_medica',
  nombre text NOT NULL,
  descripcion text,
  unidad_medida text NOT NULL DEFAULT 'unidad',
  stock_actual numeric NOT NULL DEFAULT 0,
  stock_minimo numeric NOT NULL DEFAULT 0,
  requiere_lotes boolean NOT NULL DEFAULT false,
  activo boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  CONSTRAINT inventario_items_categoria_check
    CHECK (categoria IN ('muestra_medica', 'insumo', 'material', 'medicamento', 'equipo', 'otro'))
);

CREATE INDEX IF NOT EXISTS idx_inventario_items_workspace ON public.inventario_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_inventario_items_sucursal ON public.inventario_items(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_inventario_items_stock_bajo ON public.inventario_items(workspace_id) WHERE stock_actual <= stock_minimo;

ALTER TABLE public.inventario_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventario_items_select_workspace"
  ON public.inventario_items FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "inventario_items_insert_workspace"
  ON public.inventario_items FOR INSERT TO authenticated
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "inventario_items_update_workspace"
  ON public.inventario_items FOR UPDATE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "inventario_items_delete_admin"
  ON public.inventario_items FOR DELETE TO authenticated
  USING (is_workspace_admin(auth.uid(), workspace_id));

-- Tabla de lotes
CREATE TABLE IF NOT EXISTS public.inventario_lotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.inventario_items(id) ON DELETE CASCADE,
  numero_lote text NOT NULL,
  fecha_vencimiento date,
  cantidad_disponible numeric NOT NULL DEFAULT 0,
  proveedor text,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventario_lotes_item ON public.inventario_lotes(item_id);
CREATE INDEX IF NOT EXISTS idx_inventario_lotes_vencimiento ON public.inventario_lotes(fecha_vencimiento) WHERE fecha_vencimiento IS NOT NULL;

ALTER TABLE public.inventario_lotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventario_lotes_select_workspace"
  ON public.inventario_lotes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.inventario_items i
    WHERE i.id = item_id AND is_workspace_member(auth.uid(), i.workspace_id)
  ));

CREATE POLICY "inventario_lotes_modify_workspace"
  ON public.inventario_lotes FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.inventario_items i
    WHERE i.id = item_id AND is_workspace_member(auth.uid(), i.workspace_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.inventario_items i
    WHERE i.id = item_id AND is_workspace_member(auth.uid(), i.workspace_id)
  ));

-- Tabla de movimientos
CREATE TABLE IF NOT EXISTS public.inventario_movimientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.inventario_items(id) ON DELETE CASCADE,
  lote_id uuid REFERENCES public.inventario_lotes(id) ON DELETE SET NULL,
  tipo text NOT NULL,
  cantidad numeric NOT NULL,
  paciente_id uuid,
  visita_id uuid,
  motivo text,
  notas text,
  realizado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventario_movimientos_tipo_check
    CHECK (tipo IN ('entrada', 'salida', 'ajuste', 'merma', 'devolucion'))
);

CREATE INDEX IF NOT EXISTS idx_inventario_mov_item ON public.inventario_movimientos(item_id);
CREATE INDEX IF NOT EXISTS idx_inventario_mov_paciente ON public.inventario_movimientos(paciente_id) WHERE paciente_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventario_mov_fecha ON public.inventario_movimientos(created_at DESC);

ALTER TABLE public.inventario_movimientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventario_mov_select_workspace"
  ON public.inventario_movimientos FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.inventario_items i
    WHERE i.id = item_id AND is_workspace_member(auth.uid(), i.workspace_id)
  ));

CREATE POLICY "inventario_mov_insert_workspace"
  ON public.inventario_movimientos FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.inventario_items i
    WHERE i.id = item_id AND is_workspace_member(auth.uid(), i.workspace_id)
  ));

-- Trigger: actualizar stock_actual en items y lotes
CREATE OR REPLACE FUNCTION public.aplicar_movimiento_inventario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_delta numeric;
BEGIN
  -- entrada/devolucion suman; salida/merma restan; ajuste establece (delta tal cual)
  v_delta := CASE
    WHEN NEW.tipo IN ('entrada', 'devolucion') THEN NEW.cantidad
    WHEN NEW.tipo IN ('salida', 'merma') THEN -NEW.cantidad
    WHEN NEW.tipo = 'ajuste' THEN NEW.cantidad
    ELSE 0
  END;

  UPDATE public.inventario_items
    SET stock_actual = stock_actual + v_delta,
        updated_at = now()
    WHERE id = NEW.item_id;

  IF NEW.lote_id IS NOT NULL THEN
    UPDATE public.inventario_lotes
      SET cantidad_disponible = cantidad_disponible + v_delta,
          updated_at = now()
      WHERE id = NEW.lote_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_aplicar_movimiento_inventario ON public.inventario_movimientos;
CREATE TRIGGER trg_aplicar_movimiento_inventario
  AFTER INSERT ON public.inventario_movimientos
  FOR EACH ROW EXECUTE FUNCTION public.aplicar_movimiento_inventario();

-- =====================================================
-- FASE E: AUDITORÍA HIPAA-like
-- =====================================================

-- Logs de acceso a fichas clínicas
CREATE TABLE IF NOT EXISTS public.acceso_fichas_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid,
  user_id uuid NOT NULL,
  paciente_id uuid NOT NULL,
  recurso text NOT NULL,
  accion text NOT NULL DEFAULT 'view',
  ip_address text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT acceso_fichas_log_accion_check
    CHECK (accion IN ('view', 'export', 'print', 'download', 'edit'))
);

CREATE INDEX IF NOT EXISTS idx_acceso_fichas_paciente ON public.acceso_fichas_log(paciente_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_acceso_fichas_user ON public.acceso_fichas_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_acceso_fichas_workspace ON public.acceso_fichas_log(workspace_id, created_at DESC);

ALTER TABLE public.acceso_fichas_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acceso_fichas_insert_authenticated"
  ON public.acceso_fichas_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "acceso_fichas_select_admin"
  ON public.acceso_fichas_log FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (workspace_id IS NOT NULL AND is_workspace_admin(auth.uid(), workspace_id))
  );

-- Política de retención por workspace
CREATE TABLE IF NOT EXISTS public.politicas_retencion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL UNIQUE,
  retencion_anos integer NOT NULL DEFAULT 7,
  anonimizar_inactivos_meses integer NOT NULL DEFAULT 60,
  notificar_antes_dias integer NOT NULL DEFAULT 30,
  activo boolean NOT NULL DEFAULT true,
  ultima_revision timestamptz,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.politicas_retencion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "politicas_retencion_select_workspace"
  ON public.politicas_retencion FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "politicas_retencion_manage_admin"
  ON public.politicas_retencion FOR ALL TO authenticated
  USING (is_workspace_admin(auth.uid(), workspace_id))
  WITH CHECK (is_workspace_admin(auth.uid(), workspace_id));

-- Helper RPC: registrar acceso a ficha clínica
CREATE OR REPLACE FUNCTION public.registrar_acceso_ficha(
  _paciente_id uuid,
  _recurso text,
  _accion text DEFAULT 'view',
  _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id uuid;
  v_log_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT workspace_id INTO v_workspace_id
  FROM public.pacientes WHERE id = _paciente_id;

  INSERT INTO public.acceso_fichas_log (
    workspace_id, user_id, paciente_id, recurso, accion, metadata
  ) VALUES (
    v_workspace_id, auth.uid(), _paciente_id, _recurso,
    COALESCE(_accion, 'view'), COALESCE(_metadata, '{}'::jsonb)
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- =====================================================
-- FASE A: REPORTES PROGRAMADOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reportes_programados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  nombre text NOT NULL,
  tipo_reporte text NOT NULL,
  frecuencia text NOT NULL DEFAULT 'mensual',
  destinatarios jsonb NOT NULL DEFAULT '[]'::jsonb,
  formato text NOT NULL DEFAULT 'pdf',
  filtros jsonb NOT NULL DEFAULT '{}'::jsonb,
  hora_envio time NOT NULL DEFAULT '08:00',
  dia_envio integer,
  activo boolean NOT NULL DEFAULT true,
  ultimo_envio timestamptz,
  proximo_envio timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  CONSTRAINT reportes_programados_frecuencia_check
    CHECK (frecuencia IN ('diario', 'semanal', 'mensual', 'trimestral')),
  CONSTRAINT reportes_programados_formato_check
    CHECK (formato IN ('pdf', 'csv', 'xlsx')),
  CONSTRAINT reportes_programados_tipo_check
    CHECK (tipo_reporte IN ('kpi_profesionales', 'comparativo_sucursales', 'visitas_resumen', 'llamadas_resumen', 'facturacion', 'pacientes_estado', 'auditoria_accesos'))
);

CREATE INDEX IF NOT EXISTS idx_reportes_prog_workspace ON public.reportes_programados(workspace_id);
CREATE INDEX IF NOT EXISTS idx_reportes_prog_proximo ON public.reportes_programados(proximo_envio) WHERE activo = true;

ALTER TABLE public.reportes_programados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reportes_prog_select_workspace"
  ON public.reportes_programados FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "reportes_prog_manage_admin"
  ON public.reportes_programados FOR ALL TO authenticated
  USING (is_workspace_admin(auth.uid(), workspace_id))
  WITH CHECK (is_workspace_admin(auth.uid(), workspace_id));

-- Historial de envíos
CREATE TABLE IF NOT EXISTS public.reportes_envios_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporte_id uuid NOT NULL REFERENCES public.reportes_programados(id) ON DELETE CASCADE,
  estado text NOT NULL DEFAULT 'enviado',
  destinatarios jsonb NOT NULL DEFAULT '[]'::jsonb,
  archivo_url text,
  error_mensaje text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reportes_envios_estado_check
    CHECK (estado IN ('enviado', 'fallido', 'parcial'))
);

CREATE INDEX IF NOT EXISTS idx_reportes_envios_reporte ON public.reportes_envios_log(reporte_id, created_at DESC);

ALTER TABLE public.reportes_envios_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reportes_envios_select_workspace"
  ON public.reportes_envios_log FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.reportes_programados rp
    WHERE rp.id = reporte_id AND is_workspace_member(auth.uid(), rp.workspace_id)
  ));

-- Triggers de updated_at
CREATE TRIGGER trg_inventario_items_updated
  BEFORE UPDATE ON public.inventario_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_inventario_lotes_updated
  BEFORE UPDATE ON public.inventario_lotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_politicas_retencion_updated
  BEFORE UPDATE ON public.politicas_retencion
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_reportes_programados_updated
  BEFORE UPDATE ON public.reportes_programados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
