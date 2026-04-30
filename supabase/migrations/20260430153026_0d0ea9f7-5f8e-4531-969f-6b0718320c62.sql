
-- =============================================
-- LISTA DE ESPERA
-- =============================================
CREATE TYPE public.prioridad_espera AS ENUM ('normal','alta','urgente');
CREATE TYPE public.estado_espera AS ENUM ('esperando','asignada','cancelada','expirada');

CREATE TABLE public.lista_espera (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  profesional_id uuid REFERENCES public.personal_salud(id),
  especialidad text,
  motivo text,
  prioridad prioridad_espera NOT NULL DEFAULT 'normal',
  estado estado_espera NOT NULL DEFAULT 'esperando',
  fecha_solicitud timestamptz NOT NULL DEFAULT now(),
  fecha_asignada timestamptz,
  notas text,
  workspace_id uuid REFERENCES public.workspaces(id),
  sucursal_id uuid REFERENCES public.sucursales(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lista_espera ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lista_espera_select" ON public.lista_espera FOR SELECT TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));
CREATE POLICY "lista_espera_insert" ON public.lista_espera FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));
CREATE POLICY "lista_espera_update" ON public.lista_espera FOR UPDATE TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));
CREATE POLICY "lista_espera_delete" ON public.lista_espera FOR DELETE TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));

CREATE TRIGGER audit_lista_espera AFTER INSERT OR UPDATE OR DELETE ON public.lista_espera
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
CREATE TRIGGER update_lista_espera_updated_at BEFORE UPDATE ON public.lista_espera
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_lista_espera_paciente ON public.lista_espera(paciente_id);
CREATE INDEX idx_lista_espera_estado ON public.lista_espera(estado);

-- =============================================
-- CIERRES DE CAJA
-- =============================================
CREATE TYPE public.estado_cierre AS ENUM ('abierto','cerrado');

CREATE TABLE public.cierres_caja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL,
  sucursal_id uuid REFERENCES public.sucursales(id) ON DELETE SET NULL,
  workspace_id uuid REFERENCES public.workspaces(id),
  total_efectivo numeric(12,2) NOT NULL DEFAULT 0,
  total_tarjeta numeric(12,2) NOT NULL DEFAULT 0,
  total_transferencia numeric(12,2) NOT NULL DEFAULT 0,
  total_otros numeric(12,2) NOT NULL DEFAULT 0,
  total_cobrado numeric(12,2) NOT NULL DEFAULT 0,
  total_devoluciones numeric(12,2) NOT NULL DEFAULT 0,
  total_neto numeric(12,2) NOT NULL DEFAULT 0,
  cantidad_facturas int NOT NULL DEFAULT 0,
  cantidad_pagos int NOT NULL DEFAULT 0,
  estado estado_cierre NOT NULL DEFAULT 'abierto',
  cerrado_por uuid REFERENCES auth.users(id),
  cerrado_en timestamptz,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(fecha, sucursal_id, workspace_id)
);

ALTER TABLE public.cierres_caja ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cierres_caja_select" ON public.cierres_caja FOR SELECT TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));
CREATE POLICY "cierres_caja_insert" ON public.cierres_caja FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_coordinador(auth.uid()));
CREATE POLICY "cierres_caja_update" ON public.cierres_caja FOR UPDATE TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));

CREATE TRIGGER audit_cierres_caja AFTER INSERT OR UPDATE OR DELETE ON public.cierres_caja
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
CREATE TRIGGER update_cierres_caja_updated_at BEFORE UPDATE ON public.cierres_caja
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate cash register totals for a given day/branch
CREATE OR REPLACE FUNCTION public.calcular_cierre_caja(
  _fecha date,
  _workspace_id uuid,
  _sucursal_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_efectivo numeric := 0;
  v_tarjeta numeric := 0;
  v_transferencia numeric := 0;
  v_otros numeric := 0;
  v_devoluciones numeric := 0;
  v_facturas int := 0;
  v_pagos int := 0;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN p.metodo = 'efectivo' THEN p.monto ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN p.metodo = 'tarjeta' THEN p.monto ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN p.metodo = 'transferencia' THEN p.monto ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN p.metodo NOT IN ('efectivo','tarjeta','transferencia') THEN p.monto ELSE 0 END), 0),
    COUNT(*)
  INTO v_efectivo, v_tarjeta, v_transferencia, v_otros, v_pagos
  FROM public.pagos p
  JOIN public.facturas f ON f.id = p.factura_id
  WHERE p.fecha_pago::date = _fecha
    AND f.workspace_id = _workspace_id
    AND (_sucursal_id IS NULL OR f.sucursal_id = _sucursal_id);

  SELECT COUNT(*) INTO v_facturas
  FROM public.facturas
  WHERE fecha_emision::date = _fecha
    AND workspace_id = _workspace_id
    AND (_sucursal_id IS NULL OR sucursal_id = _sucursal_id);

  SELECT COALESCE(SUM(monto), 0) INTO v_devoluciones
  FROM public.notas_credito
  WHERE created_at::date = _fecha
    AND estado = 'aplicada'
    AND workspace_id = _workspace_id
    AND (_sucursal_id IS NULL OR sucursal_id = _sucursal_id);

  RETURN jsonb_build_object(
    'total_efectivo', v_efectivo,
    'total_tarjeta', v_tarjeta,
    'total_transferencia', v_transferencia,
    'total_otros', v_otros,
    'total_cobrado', v_efectivo + v_tarjeta + v_transferencia + v_otros,
    'total_devoluciones', v_devoluciones,
    'total_neto', v_efectivo + v_tarjeta + v_transferencia + v_otros - v_devoluciones,
    'cantidad_facturas', v_facturas,
    'cantidad_pagos', v_pagos
  );
END;
$$;

-- =============================================
-- NOTAS DE CRÉDITO / DEVOLUCIONES
-- =============================================
CREATE TYPE public.estado_nota_credito AS ENUM ('pendiente','aprobada','rechazada','aplicada');

CREATE TABLE public.notas_credito (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id uuid NOT NULL REFERENCES public.facturas(id),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  workspace_id uuid REFERENCES public.workspaces(id),
  sucursal_id uuid REFERENCES public.sucursales(id) ON DELETE SET NULL,
  numero_nota text,
  monto numeric(12,2) NOT NULL,
  motivo text NOT NULL,
  estado estado_nota_credito NOT NULL DEFAULT 'pendiente',
  creada_por uuid REFERENCES auth.users(id),
  aprobada_por uuid REFERENCES auth.users(id),
  fecha_aprobacion timestamptz,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notas_credito ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notas_credito_select" ON public.notas_credito FOR SELECT TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));
CREATE POLICY "notas_credito_insert" ON public.notas_credito FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_coordinador(auth.uid()));
CREATE POLICY "notas_credito_update" ON public.notas_credito FOR UPDATE TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));
CREATE POLICY "notas_credito_delete" ON public.notas_credito FOR DELETE TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));

CREATE TRIGGER audit_notas_credito AFTER INSERT OR UPDATE OR DELETE ON public.notas_credito
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
CREATE TRIGGER update_notas_credito_updated_at BEFORE UPDATE ON public.notas_credito
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-generate nota number
CREATE OR REPLACE FUNCTION public.generar_numero_nota_credito()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero_nota IS NULL OR NEW.numero_nota = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.notas_credito WHERE numero_nota LIKE 'NC-' || v_year || '-%';
    NEW.numero_nota := 'NC-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER generar_numero_nota BEFORE INSERT ON public.notas_credito
  FOR EACH ROW EXECUTE FUNCTION public.generar_numero_nota_credito();

CREATE INDEX idx_notas_credito_factura ON public.notas_credito(factura_id);
CREATE INDEX idx_lista_espera_workspace ON public.lista_espera(workspace_id);
CREATE INDEX idx_cierres_caja_fecha ON public.cierres_caja(fecha);
