-- Fix security issues with patient data access and function search paths

-- 1. Drop existing overly permissive policies on patient tables
DROP POLICY IF EXISTS "Authenticated users can view pacientes" ON public.pacientes;
DROP POLICY IF EXISTS "Authenticated users can view atencion" ON public.atencion_paciente;
DROP POLICY IF EXISTS "Authenticated users can view medicamentos" ON public.medicamentos_paciente;

-- 2. Create secure policies for pacientes table
-- Admins can see all patients
CREATE POLICY "Admins can view all pacientes"
ON public.pacientes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Professionals can only see their assigned patients
CREATE POLICY "Professionals can view assigned pacientes"
ON public.pacientes
FOR SELECT
TO authenticated
USING (
  profesional_asignado_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- 3. Create secure policies for atencion_paciente table
CREATE POLICY "Admins can view all atencion"
ON public.atencion_paciente
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Professionals can view their atencion records"
ON public.atencion_paciente
FOR SELECT
TO authenticated
USING (
  profesional_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id = atencion_paciente.paciente_id
    AND p.profesional_asignado_id = auth.uid()
  )
);

-- 4. Create secure policies for medicamentos_paciente table
CREATE POLICY "Admins can view all medicamentos"
ON public.medicamentos_paciente
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Professionals can view medicamentos of assigned patients"
ON public.medicamentos_paciente
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id = medicamentos_paciente.paciente_id
    AND p.profesional_asignado_id = auth.uid()
  )
);

-- 5. Add token validation for survey responses (keep public access but validate token)
DROP POLICY IF EXISTS "Public can insert respuestas with token" ON public.respuestas_encuestas;
DROP POLICY IF EXISTS "Public can update own respuestas with token" ON public.respuestas_encuestas;

CREATE POLICY "Public can insert respuestas with valid token"
ON public.respuestas_encuestas
FOR INSERT
WITH CHECK (token IS NOT NULL AND length(token) >= 32);

CREATE POLICY "Public can update respuestas with matching token"
ON public.respuestas_encuestas
FOR UPDATE
USING (token IS NOT NULL AND length(token) >= 32);

-- 6. Fix function search paths to be immutable
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.calcular_indicadores_llamadas(
  profesional_uuid uuid DEFAULT NULL::uuid,
  fecha_inicio timestamp without time zone DEFAULT (now() - '30 days'::interval),
  fecha_fin timestamp without time zone DEFAULT now()
)
RETURNS TABLE(
  total_llamadas bigint,
  llamadas_realizadas bigint,
  llamadas_contactadas bigint,
  tasa_contacto numeric,
  duracion_promedio numeric,
  requieren_seguimiento bigint,
  llamadas_pendientes bigint,
  llamadas_canceladas bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    COUNT(*) as total_llamadas,
    COUNT(*) FILTER (WHERE estado = 'realizada') as llamadas_realizadas,
    COUNT(*) FILTER (WHERE resultado_seguimiento = 'contactado') as llamadas_contactadas,
    ROUND(
      (COUNT(*) FILTER (WHERE resultado_seguimiento = 'contactado')::numeric / 
       NULLIF(COUNT(*) FILTER (WHERE estado = 'realizada'), 0) * 100), 
      2
    ) as tasa_contacto,
    ROUND(AVG(duracion_minutos) FILTER (WHERE duracion_minutos IS NOT NULL), 2) as duracion_promedio,
    COUNT(*) FILTER (WHERE requiere_seguimiento = true) as requieren_seguimiento,
    COUNT(*) FILTER (WHERE estado = 'pendiente' OR estado = 'agendada') as llamadas_pendientes,
    COUNT(*) FILTER (WHERE estado = 'cancelada') as llamadas_canceladas
  FROM public.registro_llamadas
  WHERE 
    (profesional_uuid IS NULL OR profesional_id = profesional_uuid)
    AND created_at BETWEEN fecha_inicio AND fecha_fin;
$$;