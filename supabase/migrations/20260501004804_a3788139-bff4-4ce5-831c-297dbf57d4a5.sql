
-- Fase P: Multi-Sucursal, Portal, BI, Marketing para Verticales

-- 1. Sucursales por vertical
CREATE TABLE public.sucursales_vertical (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  vertical_tipo text NOT NULL CHECK (vertical_tipo IN ('dental','estetica','recovery','vision')),
  nombre text NOT NULL,
  direccion text,
  telefono text,
  email text,
  horario_apertura time DEFAULT '08:00',
  horario_cierre time DEFAULT '18:00',
  dias_laborables text[] DEFAULT ARRAY['lunes','martes','miercoles','jueves','viernes'],
  activo boolean DEFAULT true,
  configuracion jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.sucursales_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_crud_sucursales_vertical" ON public.sucursales_vertical FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Portal paciente vertical
CREATE TABLE public.portal_paciente_vertical (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  paciente_id uuid NOT NULL,
  vertical_tipo text NOT NULL CHECK (vertical_tipo IN ('dental','estetica','recovery','vision')),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expira_en timestamptz DEFAULT (now() + interval '30 days'),
  usado boolean DEFAULT false,
  datos_visibles jsonb DEFAULT '{"citas":true,"facturas":true,"tratamientos":true}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.portal_paciente_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_crud_portal_vertical" ON public.portal_paciente_vertical FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_read_portal_token" ON public.portal_paciente_vertical FOR SELECT TO anon USING (true);

-- 3. Campañas marketing vertical
CREATE TABLE public.campanas_marketing_vertical (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  vertical_tipo text NOT NULL CHECK (vertical_tipo IN ('dental','estetica','recovery','vision')),
  nombre text NOT NULL,
  canal text NOT NULL CHECK (canal IN ('whatsapp','email','sms','instagram')),
  estado text DEFAULT 'borrador' CHECK (estado IN ('borrador','programada','enviando','completada','cancelada')),
  mensaje_plantilla text,
  segmento_filtro jsonb DEFAULT '{}',
  fecha_programada timestamptz,
  destinatarios_total int DEFAULT 0,
  enviados int DEFAULT 0,
  abiertos int DEFAULT 0,
  clics int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.campanas_marketing_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_crud_campanas_v" ON public.campanas_marketing_vertical FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Leads CRM vertical
CREATE TABLE public.leads_vertical (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  vertical_tipo text NOT NULL CHECK (vertical_tipo IN ('dental','estetica','recovery','vision')),
  nombre text NOT NULL,
  telefono text,
  email text,
  origen text DEFAULT 'otro' CHECK (origen IN ('instagram','facebook','tiktok','google','referido','whatsapp','otro','website')),
  estado text DEFAULT 'nuevo' CHECK (estado IN ('nuevo','contactado','cita_agendada','convertido','perdido')),
  notas text,
  valor_estimado numeric(12,2),
  sucursal_id uuid REFERENCES public.sucursales_vertical(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.leads_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_crud_leads_vertical" ON public.leads_vertical FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Métricas BI vertical
CREATE TABLE public.metricas_bi_vertical (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  vertical_tipo text NOT NULL CHECK (vertical_tipo IN ('dental','estetica','recovery','vision')),
  sucursal_id uuid REFERENCES public.sucursales_vertical(id),
  periodo date NOT NULL,
  ingresos numeric(14,2) DEFAULT 0,
  gastos numeric(14,2) DEFAULT 0,
  citas_totales int DEFAULT 0,
  citas_completadas int DEFAULT 0,
  pacientes_nuevos int DEFAULT 0,
  tasa_retencion numeric(5,2) DEFAULT 0,
  ticket_promedio numeric(10,2) DEFAULT 0,
  procedimientos_top jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.metricas_bi_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_crud_metricas_bi" ON public.metricas_bi_vertical FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Mensajes WhatsApp vertical
CREATE TABLE public.mensajes_whatsapp_vertical (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  vertical_tipo text NOT NULL CHECK (vertical_tipo IN ('dental','estetica','recovery','vision')),
  paciente_id uuid,
  telefono text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('recordatorio','confirmacion','seguimiento','marketing','bienvenida','cumpleanos')),
  mensaje text NOT NULL,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente','enviado','entregado','leido','fallido')),
  campana_id uuid REFERENCES public.campanas_marketing_vertical(id),
  metadata jsonb DEFAULT '{}',
  enviado_en timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.mensajes_whatsapp_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_crud_whatsapp_v" ON public.mensajes_whatsapp_vertical FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Pagos online vertical
CREATE TABLE public.pagos_online_vertical (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  vertical_tipo text NOT NULL CHECK (vertical_tipo IN ('dental','estetica','recovery','vision')),
  paciente_id uuid,
  monto numeric(12,2) NOT NULL,
  moneda text DEFAULT 'DOP',
  metodo text NOT NULL CHECK (metodo IN ('tarjeta','transferencia','paypal','stripe','efectivo','mixto')),
  referencia_externa text,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente','completado','fallido','reembolsado')),
  concepto text,
  sucursal_id uuid REFERENCES public.sucursales_vertical(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.pagos_online_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_crud_pagos_online" ON public.pagos_online_vertical FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_sucursales_v_ws ON public.sucursales_vertical(workspace_id, vertical_tipo);
CREATE INDEX idx_leads_v_ws ON public.leads_vertical(workspace_id, vertical_tipo, estado);
CREATE INDEX idx_campanas_v_ws ON public.campanas_marketing_vertical(workspace_id, vertical_tipo);
CREATE INDEX idx_metricas_v_ws ON public.metricas_bi_vertical(workspace_id, vertical_tipo, periodo);
CREATE INDEX idx_whatsapp_v_ws ON public.mensajes_whatsapp_vertical(workspace_id, vertical_tipo);
CREATE INDEX idx_pagos_v_ws ON public.pagos_online_vertical(workspace_id, vertical_tipo);
CREATE INDEX idx_portal_v_token ON public.portal_paciente_vertical(token);
