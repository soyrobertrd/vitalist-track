-- Tabla para historial de recordatorios enviados
CREATE TABLE public.historial_recordatorios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_cita TEXT NOT NULL CHECK (tipo_cita IN ('llamada', 'visita')),
  cita_id UUID NOT NULL,
  paciente_id UUID REFERENCES public.pacientes(id),
  profesional_id UUID REFERENCES public.personal_salud(id),
  plantilla_id UUID REFERENCES public.plantillas_correo(id),
  destinatarios JSONB NOT NULL DEFAULT '[]'::jsonb,
  canal TEXT NOT NULL DEFAULT 'email' CHECK (canal IN ('email', 'whatsapp')),
  estado TEXT NOT NULL DEFAULT 'enviado' CHECK (estado IN ('pendiente', 'enviado', 'fallido', 'reintentando')),
  intentos INTEGER NOT NULL DEFAULT 1,
  max_intentos INTEGER NOT NULL DEFAULT 3,
  proximo_reintento TIMESTAMP WITH TIME ZONE,
  error_mensaje TEXT,
  tipo_recordatorio TEXT NOT NULL DEFAULT '1_dia' CHECK (tipo_recordatorio IN ('3_dias', '1_dia', '2_horas')),
  enviado_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para búsquedas eficientes
CREATE INDEX idx_historial_recordatorios_cita ON public.historial_recordatorios(tipo_cita, cita_id);
CREATE INDEX idx_historial_recordatorios_estado ON public.historial_recordatorios(estado);
CREATE INDEX idx_historial_recordatorios_paciente ON public.historial_recordatorios(paciente_id);
CREATE INDEX idx_historial_recordatorios_fecha ON public.historial_recordatorios(enviado_at);
CREATE INDEX idx_historial_recordatorios_reintento ON public.historial_recordatorios(proximo_reintento) WHERE estado = 'reintentando';

-- Trigger para updated_at
CREATE TRIGGER update_historial_recordatorios_updated_at
BEFORE UPDATE ON public.historial_recordatorios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies
ALTER TABLE public.historial_recordatorios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view historial_recordatorios"
ON public.historial_recordatorios
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert historial_recordatorios"
ON public.historial_recordatorios
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update historial_recordatorios"
ON public.historial_recordatorios
FOR UPDATE
USING (true);

-- Agregar columna de configuración de recordatorios en automatizaciones
ALTER TABLE public.automatizaciones
ADD COLUMN IF NOT EXISTS recordatorios_config JSONB DEFAULT '{"3_dias": false, "1_dia": true, "2_horas": false}'::jsonb;

-- Agregar campo para tracking de confirmaciones
ALTER TABLE public.registro_llamadas
ADD COLUMN IF NOT EXISTS confirmado_por_recordatorio BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fecha_confirmacion TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.control_visitas
ADD COLUMN IF NOT EXISTS confirmado_por_recordatorio BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fecha_confirmacion TIMESTAMP WITH TIME ZONE;