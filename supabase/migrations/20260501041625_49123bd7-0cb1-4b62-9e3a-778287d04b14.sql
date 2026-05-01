
-- ===================== FASE U =====================

-- 1. MARKETPLACE DE SERVICIOS
CREATE TABLE public.marketplace_servicios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vertical_tipo text NOT NULL CHECK (vertical_tipo IN ('dental','estetica','recuperacion','vision')),
  nombre text NOT NULL,
  descripcion text,
  precio numeric(12,2),
  duracion_minutos integer DEFAULT 30,
  categoria text,
  slug text,
  imagen_url text,
  seo_titulo text,
  seo_descripcion text,
  rating_promedio numeric(3,2) DEFAULT 0,
  total_reviews integer DEFAULT 0,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.marketplace_servicios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Servicios visibles públicamente" ON public.marketplace_servicios FOR SELECT USING (activo = true);
CREATE POLICY "Staff gestiona servicios" ON public.marketplace_servicios FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.marketplace_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id uuid NOT NULL REFERENCES public.marketplace_servicios(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  puntuacion integer NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
  comentario text,
  verificado boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews visibles públicamente" ON public.marketplace_reviews FOR SELECT USING (true);
CREATE POLICY "Auth puede crear reviews" ON public.marketplace_reviews FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.marketplace_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id uuid NOT NULL REFERENCES public.marketplace_servicios(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_nombre text NOT NULL,
  paciente_email text,
  paciente_telefono text,
  fecha_deseada date NOT NULL,
  hora_deseada time,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente','confirmado','cancelado','completado')),
  notas text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.marketplace_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bookings insert público" ON public.marketplace_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff ve bookings" ON public.marketplace_bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff gestiona bookings" ON public.marketplace_bookings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 2. TELEMEDICINA AVANZADA
CREATE TABLE public.telemedicina_sesiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  profesional_id uuid REFERENCES public.personal_salud(id) ON DELETE SET NULL,
  fecha_inicio timestamptz,
  fecha_fin timestamptz,
  duracion_minutos integer,
  compartir_pantalla boolean DEFAULT false,
  grabacion_url text,
  chat_log jsonb DEFAULT '[]',
  estado text DEFAULT 'programada' CHECK (estado IN ('programada','en_curso','finalizada','cancelada')),
  notas_clinicas text,
  receta_generada boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.telemedicina_sesiones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth accede sesiones" ON public.telemedicina_sesiones FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.telemedicina_recetas_digitales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id uuid REFERENCES public.telemedicina_sesiones(id) ON DELETE SET NULL,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  profesional_id uuid REFERENCES public.personal_salud(id) ON DELETE SET NULL,
  medicamentos jsonb DEFAULT '[]',
  indicaciones text,
  firma_digital text,
  qr_verificacion text,
  valida_hasta date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.telemedicina_recetas_digitales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth accede recetas digitales" ON public.telemedicina_recetas_digitales FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. IA CLÍNICA PREDICTIVA
CREATE TABLE public.ia_modelos_predictivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('riesgo_no_show','riesgo_complicacion','tendencia_poblacional','prediccion_demanda','abandono_tratamiento')),
  descripcion text,
  parametros jsonb DEFAULT '{}',
  precision_score numeric(5,4),
  ultima_ejecucion timestamptz,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ia_modelos_predictivos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth accede modelos" ON public.ia_modelos_predictivos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.ia_alertas_tempranas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  modelo_id uuid REFERENCES public.ia_modelos_predictivos(id) ON DELETE SET NULL,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE CASCADE,
  tipo_alerta text NOT NULL,
  severidad text DEFAULT 'media' CHECK (severidad IN ('baja','media','alta','critica')),
  probabilidad numeric(5,4),
  recomendacion text,
  datos_soporte jsonb DEFAULT '{}',
  revisada boolean DEFAULT false,
  revisada_por uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ia_alertas_tempranas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth accede alertas IA" ON public.ia_alertas_tempranas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. DISPOSITIVOS IoT
CREATE TABLE public.dispositivos_iot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('oximetro','tensiometro','glucometro','bascula','termometro','ecg','wearable','otro')),
  modelo text,
  serial_number text,
  fabricante text,
  estado_conexion text DEFAULT 'desconectado' CHECK (estado_conexion IN ('conectado','desconectado','error','mantenimiento')),
  ultima_lectura timestamptz,
  bateria_pct integer,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.dispositivos_iot ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth accede dispositivos" ON public.dispositivos_iot FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.lecturas_iot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispositivo_id uuid NOT NULL REFERENCES public.dispositivos_iot(id) ON DELETE CASCADE,
  tipo_medicion text NOT NULL,
  valor numeric(10,3) NOT NULL,
  unidad text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.lecturas_iot ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth accede lecturas" ON public.lecturas_iot FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_lecturas_iot_dispositivo ON public.lecturas_iot(dispositivo_id, created_at DESC);

CREATE TABLE public.umbrales_alerta_iot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispositivo_id uuid NOT NULL REFERENCES public.dispositivos_iot(id) ON DELETE CASCADE,
  tipo_medicion text NOT NULL,
  valor_minimo numeric(10,3),
  valor_maximo numeric(10,3),
  accion text DEFAULT 'notificar' CHECK (accion IN ('notificar','alerta_critica','llamada_automatica')),
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.umbrales_alerta_iot ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth accede umbrales" ON public.umbrales_alerta_iot FOR ALL TO authenticated USING (true) WITH CHECK (true);
