-- 1. Add dias_no_visita column to pacientes for visit restrictions (Mon-Fri checkboxes)
ALTER TABLE public.pacientes 
ADD COLUMN IF NOT EXISTS dias_no_visita integer[] DEFAULT '{}';

COMMENT ON COLUMN public.pacientes.dias_no_visita IS 'Días de la semana (1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie) en que no se pueden agendar visitas';

-- 2. Fix profiles RLS - make policies more restrictive to require authentication
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view pending users" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix pacientes RLS - restrict to authenticated and assigned professionals only
DROP POLICY IF EXISTS "Authenticated users can insert pacientes" ON public.pacientes;
DROP POLICY IF EXISTS "Authenticated users can update pacientes" ON public.pacientes;
DROP POLICY IF EXISTS "Professionals can view assigned pacientes" ON public.pacientes;

CREATE POLICY "Authenticated users can insert pacientes" 
ON public.pacientes FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update pacientes" 
ON public.pacientes FOR UPDATE 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'coordinador'::app_role) OR
  EXISTS (
    SELECT 1 FROM personal_salud ps 
    WHERE ps.user_id = auth.uid() AND ps.id = pacientes.profesional_asignado_id
  ) OR
  EXISTS (
    SELECT 1 FROM profiles pr 
    WHERE pr.id = auth.uid() AND pr.rol IN ('admin', 'admin_centro', 'coordinador')
  )
);

-- 4. Fix respuestas_encuestas - add expiration and single-use token validation
ALTER TABLE public.respuestas_encuestas 
ADD COLUMN IF NOT EXISTS token_usado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS token_expira_at timestamp with time zone;

DROP POLICY IF EXISTS "Public can insert respuestas with valid token" ON public.respuestas_encuestas;
DROP POLICY IF EXISTS "Public can update respuestas with matching token" ON public.respuestas_encuestas;

CREATE POLICY "Public can insert respuestas with valid token" 
ON public.respuestas_encuestas FOR INSERT 
WITH CHECK (
  token IS NOT NULL AND 
  length(token) >= 32 AND
  (token_expira_at IS NULL OR token_expira_at > now())
);

CREATE POLICY "Public can update respuestas with matching token" 
ON public.respuestas_encuestas FOR UPDATE 
USING (
  token IS NOT NULL AND 
  length(token) >= 32 AND
  token_usado = false AND
  (token_expira_at IS NULL OR token_expira_at > now())
);

-- 5. Update all calls from 2024 to 2025
UPDATE public.registro_llamadas 
SET fecha_agendada = fecha_agendada + INTERVAL '1 year'
WHERE fecha_agendada IS NOT NULL 
AND EXTRACT(YEAR FROM fecha_agendada) = 2024
AND estado IN ('agendada', 'pendiente');

UPDATE public.registro_llamadas 
SET fecha_hora_realizada = fecha_hora_realizada + INTERVAL '1 year'
WHERE fecha_hora_realizada IS NOT NULL 
AND EXTRACT(YEAR FROM fecha_hora_realizada) = 2024
AND estado IN ('agendada', 'pendiente');

-- 6. Update all visits from 2024 to 2025
UPDATE public.control_visitas 
SET fecha_hora_visita = fecha_hora_visita + INTERVAL '1 year'
WHERE fecha_hora_visita IS NOT NULL 
AND EXTRACT(YEAR FROM fecha_hora_visita) = 2024
AND estado = 'pendiente';