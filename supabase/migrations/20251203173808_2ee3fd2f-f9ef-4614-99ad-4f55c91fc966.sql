-- Add email fields and notification preferences to pacientes
ALTER TABLE public.pacientes 
ADD COLUMN IF NOT EXISTS email_px text,
ADD COLUMN IF NOT EXISTS email_cuidador text,
ADD COLUMN IF NOT EXISTS notificaciones_activas boolean DEFAULT true;

-- Add notification preference to personal_salud
ALTER TABLE public.personal_salud 
ADD COLUMN IF NOT EXISTS notificaciones_activas boolean DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN public.pacientes.email_px IS 'Email del paciente para notificaciones';
COMMENT ON COLUMN public.pacientes.email_cuidador IS 'Email del cuidador para notificaciones';
COMMENT ON COLUMN public.pacientes.notificaciones_activas IS 'Indica si el paciente recibe notificaciones por email';
COMMENT ON COLUMN public.personal_salud.notificaciones_activas IS 'Indica si el profesional recibe notificaciones por email';