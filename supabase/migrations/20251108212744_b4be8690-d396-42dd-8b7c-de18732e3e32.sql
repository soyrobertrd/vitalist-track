-- Add time execution and recipients fields to automatizaciones table
ALTER TABLE public.automatizaciones 
ADD COLUMN IF NOT EXISTS tiempo_ejecucion TEXT DEFAULT '0_minutos',
ADD COLUMN IF NOT EXISTS destinatarios TEXT[] DEFAULT ARRAY['paciente']::TEXT[];

-- Add comments for clarity
COMMENT ON COLUMN public.automatizaciones.tiempo_ejecucion IS 'Tiempo de ejecución de la acción: formato "N_unidad" (ej: 2_horas, 1_dia, 30_minutos)';
COMMENT ON COLUMN public.automatizaciones.destinatarios IS 'Array de destinatarios: paciente, profesional, cuidador';