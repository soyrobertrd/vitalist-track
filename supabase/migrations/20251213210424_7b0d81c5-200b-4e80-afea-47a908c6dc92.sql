-- Add motivo_inactividad field to pacientes table
ALTER TABLE public.pacientes 
ADD COLUMN IF NOT EXISTS motivo_inactividad text;

-- Add comment explaining the field
COMMENT ON COLUMN public.pacientes.motivo_inactividad IS 'Motivo por el cual el paciente está inactivo: viaje, cambio_ars, referido_paliativo, otro';

-- Insert 2 example suspect patients
INSERT INTO public.pacientes (cedula, nombre, apellido, es_sospechoso, status_px, grado_dificultad, zona)
VALUES 
  ('001-0000001-1', 'María', 'González Pérez', true, 'activo', 'medio', 'distrito_nacional'),
  ('001-0000002-2', 'Juan', 'Martínez Rodríguez', true, 'activo', 'bajo', 'santo_domingo_este');