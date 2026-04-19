-- ============================================
-- 1) CONSENTIMIENTOS INFORMADOS DEL PACIENTE
-- ============================================
CREATE TABLE IF NOT EXISTS public.consentimientos_paciente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'tratamiento_datos',
  version_documento TEXT NOT NULL DEFAULT 'v1.0',
  contenido_firmado TEXT NOT NULL,
  firmado_por TEXT NOT NULL, -- nombre legal del firmante
  parentesco_firmante TEXT,  -- si no es el paciente (cuidador, tutor, familiar)
  fecha_aceptacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  revocado BOOLEAN NOT NULL DEFAULT false,
  fecha_revocacion TIMESTAMPTZ,
  motivo_revocacion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consentimientos_paciente ON public.consentimientos_paciente(paciente_id);
CREATE INDEX IF NOT EXISTS idx_consentimientos_tipo ON public.consentimientos_paciente(tipo);

ALTER TABLE public.consentimientos_paciente ENABLE ROW LEVEL SECURITY;

CREATE POLICY consentimientos_select_ownership
  ON public.consentimientos_paciente FOR SELECT TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));

CREATE POLICY consentimientos_insert_ownership
  ON public.consentimientos_paciente FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));

CREATE POLICY consentimientos_update_ownership
  ON public.consentimientos_paciente FOR UPDATE TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));

CREATE POLICY consentimientos_delete_admin
  ON public.consentimientos_paciente FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger de auditoría (reusa el genérico del sistema)
CREATE TRIGGER trg_consentimientos_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.consentimientos_paciente
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

-- Trigger updated_at
CREATE TRIGGER trg_consentimientos_updated_at
  BEFORE UPDATE ON public.consentimientos_paciente
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2) SUSCRIPCIONES DE WORKSPACE (pasarela)
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscripciones_workspace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  plan_codigo TEXT NOT NULL,
  proveedor TEXT NOT NULL DEFAULT 'manual', -- 'stripe' | 'paddle' | 'manual'
  proveedor_subscription_id TEXT,
  proveedor_customer_id TEXT,
  estado TEXT NOT NULL DEFAULT 'activo', -- activo | cancelado | suspendido | trial | impagado
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_fin TIMESTAMPTZ,
  periodo_actual_inicio TIMESTAMPTZ,
  periodo_actual_fin TIMESTAMPTZ,
  cancelar_al_finalizar BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subs_workspace ON public.subscripciones_workspace(workspace_id);
CREATE INDEX IF NOT EXISTS idx_subs_proveedor_id ON public.subscripciones_workspace(proveedor_subscription_id);

ALTER TABLE public.subscripciones_workspace ENABLE ROW LEVEL SECURITY;

CREATE POLICY subs_ws_select ON public.subscripciones_workspace FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY subs_ws_admin_manage ON public.subscripciones_workspace FOR ALL TO authenticated
  USING (public.is_workspace_admin(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE TRIGGER trg_subs_ws_updated_at
  BEFORE UPDATE ON public.subscripciones_workspace
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 3) PAGOS DEL WORKSPACE (historial pasarela)
-- ============================================
CREATE TABLE IF NOT EXISTS public.pagos_workspace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  subscripcion_id UUID REFERENCES public.subscripciones_workspace(id) ON DELETE SET NULL,
  proveedor TEXT NOT NULL,
  proveedor_payment_id TEXT,
  proveedor_invoice_id TEXT,
  monto NUMERIC(12,2) NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'USD',
  estado TEXT NOT NULL DEFAULT 'pendiente', -- pendiente | exitoso | fallido | reembolsado
  metodo TEXT,
  recibo_url TEXT,
  fecha_pago TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pagos_ws_workspace ON public.pagos_workspace(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pagos_ws_sub ON public.pagos_workspace(subscripcion_id);

ALTER TABLE public.pagos_workspace ENABLE ROW LEVEL SECURITY;

CREATE POLICY pagos_ws_select ON public.pagos_workspace FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY pagos_ws_admin_manage ON public.pagos_workspace FOR ALL TO authenticated
  USING (public.is_workspace_admin(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));