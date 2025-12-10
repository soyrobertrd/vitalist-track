-- Add latitude and longitude columns to pacientes table for coordinate persistence
ALTER TABLE public.pacientes 
ADD COLUMN IF NOT EXISTS latitud DECIMAL(10, 8) NULL,
ADD COLUMN IF NOT EXISTS longitud DECIMAL(11, 8) NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.pacientes.latitud IS 'Patient location latitude for geolocation features';
COMMENT ON COLUMN public.pacientes.longitud IS 'Patient location longitude for geolocation features';