-- Tabla para configuración global del sistema
CREATE TABLE IF NOT EXISTS public.configuracion_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave TEXT NOT NULL UNIQUE,
  valor JSONB NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.configuracion_sistema ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system config"
ON public.configuracion_sistema
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insertar configuración de enfermera por defecto
INSERT INTO public.configuracion_sistema (clave, valor, descripcion)
VALUES ('enfermera_default_id', '""'::jsonb, 'ID de la enfermera asignada por defecto para llamadas automáticas');

-- Tabla para horarios laborales de profesionales
CREATE TABLE IF NOT EXISTS public.horarios_profesionales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id UUID REFERENCES public.personal_salud(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  activo BOOLEAN DEFAULT true,
  tipo TEXT DEFAULT 'regular' CHECK (tipo IN ('regular', 'vacacion', 'permiso', 'licencia')),
  fecha_especifica DATE,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.horarios_profesionales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view horarios"
ON public.horarios_profesionales FOR SELECT USING (true);

CREATE POLICY "Admins can manage horarios"
ON public.horarios_profesionales FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Tabla para múltiples profesionales en visitas
CREATE TABLE IF NOT EXISTS public.visitas_profesionales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visita_id UUID REFERENCES public.control_visitas(id) ON DELETE CASCADE,
  profesional_id UUID REFERENCES public.personal_salud(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(visita_id, profesional_id)
);

ALTER TABLE public.visitas_profesionales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view visitas_profesionales"
ON public.visitas_profesionales FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert visitas_profesionales"
ON public.visitas_profesionales FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can delete visitas_profesionales"
ON public.visitas_profesionales FOR DELETE USING (true);

-- Tabla para plantillas de correo
CREATE TABLE IF NOT EXISTS public.plantillas_correo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  asunto TEXT NOT NULL,
  contenido_html TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  tipo TEXT NOT NULL CHECK (tipo IN ('recordatorio', 'bienvenida', 'confirmacion', 'encuesta', 'resumen', 'otro')),
  activo BOOLEAN DEFAULT true,
  categoria TEXT CHECK (categoria IN ('interna', 'externa')),
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.plantillas_correo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view plantillas"
ON public.plantillas_correo FOR SELECT USING (true);

CREATE POLICY "Admins can manage plantillas"
ON public.plantillas_correo FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Tabla para automatizaciones/reglas
CREATE TABLE IF NOT EXISTS public.automatizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  trigger_evento TEXT NOT NULL CHECK (trigger_evento IN ('cita_cerrada', 'cita_agendada', 'encuesta_baja', 'llamada_no_contestada', 'visita_completada')),
  accion TEXT NOT NULL CHECK (accion IN ('enviar_correo', 'enviar_encuesta', 'crear_tarea', 'enviar_notificacion', 'asignar_profesional')),
  condiciones JSONB DEFAULT '{}'::jsonb,
  parametros JSONB DEFAULT '{}'::jsonb,
  activo BOOLEAN DEFAULT true,
  plantilla_correo_id UUID REFERENCES public.plantillas_correo(id),
  encuesta_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.automatizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage automatizaciones"
ON public.automatizaciones FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view automatizaciones"
ON public.automatizaciones FOR SELECT USING (true);

-- Tabla para encuestas
CREATE TABLE IF NOT EXISTS public.encuestas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('satisfaccion', 'seguimiento', 'autoconsulta')),
  estructura JSONB NOT NULL DEFAULT '[]'::jsonb,
  activo BOOLEAN DEFAULT true,
  anonima BOOLEAN DEFAULT false,
  fecha_inicio TIMESTAMP WITH TIME ZONE,
  fecha_fin TIMESTAMP WITH TIME ZONE,
  servicio_asociado TEXT,
  profesional_id UUID REFERENCES public.personal_salud(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.encuestas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage encuestas"
ON public.encuestas FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view encuestas"
ON public.encuestas FOR SELECT USING (true);

-- Tabla para respuestas de encuestas
CREATE TABLE IF NOT EXISTS public.respuestas_encuestas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encuesta_id UUID REFERENCES public.encuestas(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES public.pacientes(id),
  respuestas JSONB NOT NULL DEFAULT '{}'::jsonb,
  puntuacion_general NUMERIC(3,2),
  token TEXT UNIQUE,
  completada BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.respuestas_encuestas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view respuestas"
ON public.respuestas_encuestas FOR SELECT USING (true);

CREATE POLICY "Public can insert respuestas with token"
ON public.respuestas_encuestas FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update own respuestas with token"
ON public.respuestas_encuestas FOR UPDATE USING (true);

-- Tabla para módulo de atención al paciente
CREATE TABLE IF NOT EXISTS public.atencion_paciente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('cura', 'medicacion', 'receta', 'laboratorio', 'muestra_medica')),
  descripcion TEXT NOT NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'realizada', 'cancelada')),
  fecha_programada TIMESTAMP WITH TIME ZONE,
  fecha_realizada TIMESTAMP WITH TIME ZONE,
  profesional_id UUID REFERENCES public.personal_salud(id),
  periodicidad TEXT CHECK (periodicidad IN ('unica', 'diaria', 'semanal', 'mensual')),
  proxima_fecha TIMESTAMP WITH TIME ZONE,
  notas TEXT,
  archivos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.atencion_paciente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view atencion"
ON public.atencion_paciente FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert atencion"
ON public.atencion_paciente FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update atencion"
ON public.atencion_paciente FOR UPDATE USING (true);

-- Agregar campo para trackear reagendamiento de llamadas
ALTER TABLE public.registro_llamadas ADD COLUMN IF NOT EXISTS reagendada BOOLEAN DEFAULT false;
ALTER TABLE public.registro_llamadas ADD COLUMN IF NOT EXISTS llamada_origen_id UUID REFERENCES public.registro_llamadas(id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_configuracion_sistema_updated_at BEFORE UPDATE ON public.configuracion_sistema FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_horarios_profesionales_updated_at BEFORE UPDATE ON public.horarios_profesionales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plantillas_correo_updated_at BEFORE UPDATE ON public.plantillas_correo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_automatizaciones_updated_at BEFORE UPDATE ON public.automatizaciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_encuestas_updated_at BEFORE UPDATE ON public.encuestas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_respuestas_encuestas_updated_at BEFORE UPDATE ON public.respuestas_encuestas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_atencion_paciente_updated_at BEFORE UPDATE ON public.atencion_paciente FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();