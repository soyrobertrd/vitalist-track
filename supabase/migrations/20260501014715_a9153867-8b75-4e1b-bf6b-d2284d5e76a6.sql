
-- Teleconsultas por vertical
CREATE TABLE public.teleconsultas_vertical (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vertical_tipo TEXT NOT NULL CHECK (vertical_tipo IN ('dental','estetica','recovery','vision')),
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE SET NULL,
  profesional_id UUID REFERENCES public.personal_salud(id) ON DELETE SET NULL,
  fecha_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  duracion_minutos INTEGER DEFAULT 30,
  enlace_sala TEXT,
  estado TEXT NOT NULL DEFAULT 'programada' CHECK (estado IN ('programada','en_curso','completada','cancelada','no_show')),
  notas_clinicas TEXT,
  diagnostico TEXT,
  url_grabacion TEXT,
  consentimiento_grabacion BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teleconsultas_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_access_teleconsultas_v" ON public.teleconsultas_vertical FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
);

-- Recetas digitales por vertical
CREATE TABLE public.recetas_digitales_vertical (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vertical_tipo TEXT NOT NULL CHECK (vertical_tipo IN ('dental','estetica','recovery','vision')),
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE SET NULL,
  profesional_id UUID REFERENCES public.personal_salud(id) ON DELETE SET NULL,
  numero TEXT,
  medicamentos JSONB NOT NULL DEFAULT '[]',
  indicaciones TEXT,
  firma_digital TEXT,
  firmada BOOLEAN DEFAULT false,
  vigencia_dias INTEGER DEFAULT 30,
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','dispensada','vencida','cancelada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recetas_digitales_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_access_recetas_dig_v" ON public.recetas_digitales_vertical FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
);

-- Auto-number recetas
CREATE OR REPLACE FUNCTION public.auto_numero_receta_vertical()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_year TEXT; v_count INT;
BEGIN
  v_year := to_char(now(), 'YYYY');
  SELECT COUNT(*) + 1 INTO v_count FROM public.recetas_digitales_vertical
    WHERE numero LIKE 'RXV-' || v_year || '-%' AND workspace_id = NEW.workspace_id;
  NEW.numero := 'RXV-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_auto_numero_receta_v BEFORE INSERT ON public.recetas_digitales_vertical
  FOR EACH ROW WHEN (NEW.numero IS NULL) EXECUTE FUNCTION public.auto_numero_receta_vertical();

-- Historia compartida entre verticales
CREATE TABLE public.historia_compartida_vertical (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  vertical_origen TEXT NOT NULL,
  vertical_destino TEXT NOT NULL,
  resumen TEXT,
  documentos JSONB DEFAULT '[]',
  compartido_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.historia_compartida_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_access_hist_comp_v" ON public.historia_compartida_vertical FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
);

-- Facturas electrónicas (e-CF / DGII)
CREATE TABLE public.facturas_electronicas_vertical (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vertical_tipo TEXT NOT NULL CHECK (vertical_tipo IN ('dental','estetica','recovery','vision')),
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE SET NULL,
  numero_factura TEXT,
  ncf TEXT,
  tipo_comprobante TEXT NOT NULL DEFAULT 'B01' CHECK (tipo_comprobante IN ('B01','B02','B04','B14','B15','B16','B17')),
  rnc_cedula_cliente TEXT,
  nombre_cliente TEXT,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  itbis NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  estado_dgii TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_dgii IN ('pendiente','enviado','aceptado','rechazado','anulado')),
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  detalle JSONB DEFAULT '[]',
  xml_ecf TEXT,
  respuesta_dgii JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.facturas_electronicas_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_access_fact_elec_v" ON public.facturas_electronicas_vertical FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
);

-- Auto-number facturas
CREATE OR REPLACE FUNCTION public.auto_numero_factura_vertical()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_year TEXT; v_count INT;
BEGIN
  v_year := to_char(now(), 'YYYY');
  SELECT COUNT(*) + 1 INTO v_count FROM public.facturas_electronicas_vertical
    WHERE numero_factura LIKE 'FEV-' || v_year || '-%' AND workspace_id = NEW.workspace_id;
  NEW.numero_factura := 'FEV-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_auto_numero_factura_v BEFORE INSERT ON public.facturas_electronicas_vertical
  FOR EACH ROW WHEN (NEW.numero_factura IS NULL) EXECUTE FUNCTION public.auto_numero_factura_vertical();

-- Reportes fiscales 606/607
CREATE TABLE public.reportes_fiscales_vertical (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vertical_tipo TEXT NOT NULL CHECK (vertical_tipo IN ('dental','estetica','recovery','vision')),
  tipo_reporte TEXT NOT NULL CHECK (tipo_reporte IN ('606','607','608','609')),
  periodo TEXT NOT NULL, -- YYYYMM
  cantidad_registros INTEGER DEFAULT 0,
  monto_total NUMERIC(14,2) DEFAULT 0,
  datos JSONB DEFAULT '[]',
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','generado','enviado','aceptado')),
  generado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reportes_fiscales_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_access_rep_fisc_v" ON public.reportes_fiscales_vertical FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
);

-- Integraciones externas por vertical
CREATE TABLE public.integraciones_externas_vertical (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vertical_tipo TEXT NOT NULL CHECK (vertical_tipo IN ('dental','estetica','recovery','vision')),
  tipo_integracion TEXT NOT NULL CHECK (tipo_integracion IN ('whatsapp_api','google_calendar','lab_hl7','stripe','cardnet','paypal','mailchimp','meta_ads')),
  nombre TEXT NOT NULL,
  configuracion JSONB DEFAULT '{}',
  activo BOOLEAN DEFAULT true,
  ultimo_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.integraciones_externas_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_access_integ_ext_v" ON public.integraciones_externas_vertical FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
);

-- Sync calendario externo
CREATE TABLE public.sync_calendario_vertical (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vertical_tipo TEXT NOT NULL,
  cita_id UUID,
  provider TEXT NOT NULL CHECK (provider IN ('google_calendar','outlook','apple')),
  external_event_id TEXT,
  estado_sync TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_sync IN ('pendiente','sincronizado','error','eliminado')),
  ultimo_intento TIMESTAMPTZ,
  error_detalle TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sync_calendario_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_access_sync_cal_v" ON public.sync_calendario_vertical FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
);
