-- Agregar campo de parentesco del cuidador a la tabla pacientes
ALTER TABLE pacientes 
ADD COLUMN IF NOT EXISTS parentesco_cuidador TEXT;

-- Agregar campo tipo_atencion para ambulatorio o domiciliario
ALTER TABLE pacientes 
ADD COLUMN IF NOT EXISTS tipo_atencion TEXT DEFAULT 'domiciliario' CHECK (tipo_atencion IN ('ambulatorio', 'domiciliario'));

-- Comentario para documentar
COMMENT ON COLUMN pacientes.parentesco_cuidador IS 'Relación del cuidador con el paciente (ej: hijo, esposo, madre, etc.)';
COMMENT ON COLUMN pacientes.tipo_atencion IS 'Tipo de atención que recibe el paciente: ambulatorio o domiciliario';
