-- Enum para roles de usuario
CREATE TYPE user_role AS ENUM ('admin', 'admin_centro', 'medico', 'enfermera', 'coordinador');

-- Enum para status de paciente
CREATE TYPE status_paciente AS ENUM ('activo', 'inactivo', 'fallecido', 'renuncio', 'cambio_ars');

-- Enum para grado de dificultad
CREATE TYPE grado_dificultad AS ENUM ('bajo', 'medio', 'alto');

-- Enum para estado de visita
CREATE TYPE estado_visita AS ENUM ('pendiente', 'realizada', 'cancelada', 'postpuesta', 'no_realizada');

-- Enum para tipo de visita
CREATE TYPE tipo_visita AS ENUM ('ambulatorio', 'domicilio');

-- Enum para resultado de seguimiento
CREATE TYPE resultado_seguimiento AS ENUM ('contactado', 'no_contestada', 'mensaje_dejado');

-- Tabla de perfiles de usuario (extiende auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cedula TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT NOT NULL,
  rol user_role NOT NULL DEFAULT 'medico',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de permisos por usuario
CREATE TABLE public.permisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  permiso_crear BOOLEAN DEFAULT false,
  permiso_editar BOOLEAN DEFAULT false,
  permiso_borrar BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de personal de salud
CREATE TABLE public.personal_salud (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedula TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  especialidad TEXT,
  contacto TEXT,
  email_contacto TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de pacientes
CREATE TABLE public.pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedula TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  fecha_nacimiento DATE,
  contacto_px TEXT,
  nombre_cuidador TEXT,
  contacto_cuidador TEXT,
  direccion_domicilio TEXT,
  historia_medica_basica TEXT,
  grado_dificultad grado_dificultad DEFAULT 'medio',
  status_px status_paciente DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de parámetros de seguimiento
CREATE TABLE public.parametros_seguimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE,
  periodo_llamada_ciclico INTEGER DEFAULT 30,
  periodo_visita_ciclico INTEGER DEFAULT 90,
  fecha_proxima_llamada_prog DATE,
  fecha_proxima_visita_prog DATE,
  contador_llamadas_no_contestadas INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(paciente_id)
);

-- Tabla de registro de llamadas
CREATE TABLE public.registro_llamadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_hora_realizada TIMESTAMPTZ DEFAULT NOW(),
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE,
  profesional_id UUID REFERENCES public.personal_salud(id),
  motivo TEXT,
  comentarios_resultados TEXT,
  resultado_seguimiento resultado_seguimiento,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de control de visitas
CREATE TABLE public.control_visitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE,
  profesional_id UUID REFERENCES public.personal_salud(id),
  fecha_hora_visita TIMESTAMPTZ NOT NULL,
  tipo_visita tipo_visita NOT NULL,
  motivo_visita TEXT,
  estado estado_visita DEFAULT 'pendiente',
  notas_visita TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de días no laborables
CREATE TABLE public.dias_no_laborables (
  fecha DATE PRIMARY KEY,
  descripcion TEXT NOT NULL
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_pacientes_status ON public.pacientes(status_px);
CREATE INDEX idx_parametros_paciente ON public.parametros_seguimiento(paciente_id);
CREATE INDEX idx_llamadas_paciente ON public.registro_llamadas(paciente_id);
CREATE INDEX idx_llamadas_profesional ON public.registro_llamadas(profesional_id);
CREATE INDEX idx_visitas_paciente ON public.control_visitas(paciente_id);
CREATE INDEX idx_visitas_profesional ON public.control_visitas(profesional_id);
CREATE INDEX idx_visitas_fecha ON public.control_visitas(fecha_hora_visita);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_salud ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametros_seguimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registro_llamadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_visitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dias_no_laborables ENABLE ROW LEVEL SECURITY;

-- RLS Policies para profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies para personal_salud (todos los usuarios autenticados pueden ver)
CREATE POLICY "Authenticated users can view personal" ON public.personal_salud
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert personal" ON public.personal_salud
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update personal" ON public.personal_salud
  FOR UPDATE TO authenticated USING (true);

-- RLS Policies para pacientes (todos los usuarios autenticados)
CREATE POLICY "Authenticated users can view pacientes" ON public.pacientes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert pacientes" ON public.pacientes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update pacientes" ON public.pacientes
  FOR UPDATE TO authenticated USING (true);

-- RLS Policies para parametros_seguimiento
CREATE POLICY "Authenticated users can view parametros" ON public.parametros_seguimiento
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert parametros" ON public.parametros_seguimiento
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update parametros" ON public.parametros_seguimiento
  FOR UPDATE TO authenticated USING (true);

-- RLS Policies para registro_llamadas
CREATE POLICY "Authenticated users can view llamadas" ON public.registro_llamadas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert llamadas" ON public.registro_llamadas
  FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies para control_visitas
CREATE POLICY "Authenticated users can view visitas" ON public.control_visitas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert visitas" ON public.control_visitas
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update visitas" ON public.control_visitas
  FOR UPDATE TO authenticated USING (true);

-- RLS Policies para dias_no_laborables
CREATE POLICY "Authenticated users can view dias no laborables" ON public.dias_no_laborables
  FOR SELECT TO authenticated USING (true);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_updated_at BEFORE UPDATE ON public.personal_salud
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pacientes_updated_at BEFORE UPDATE ON public.pacientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parametros_updated_at BEFORE UPDATE ON public.parametros_seguimiento
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visitas_updated_at BEFORE UPDATE ON public.control_visitas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();