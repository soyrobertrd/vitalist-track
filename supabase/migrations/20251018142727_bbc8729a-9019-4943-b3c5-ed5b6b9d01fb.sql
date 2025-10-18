-- Add zona enum for Santo Domingo districts
CREATE TYPE zona_distrito AS ENUM ('santo_domingo_oeste', 'santo_domingo_este', 'santo_domingo_norte', 'distrito_nacional');

-- Add zona column to pacientes
ALTER TABLE pacientes ADD COLUMN zona zona_distrito;

-- Add profesional_asignado to pacientes
ALTER TABLE pacientes ADD COLUMN profesional_asignado_id uuid REFERENCES personal_salud(id) ON DELETE SET NULL;

-- Add estado_llamada enum
CREATE TYPE estado_llamada AS ENUM ('agendada', 'realizada', 'pospuesta', 'cancelada');

-- Modify registro_llamadas to include estado and fecha_agendada
ALTER TABLE registro_llamadas ADD COLUMN estado estado_llamada DEFAULT 'agendada';
ALTER TABLE registro_llamadas ADD COLUMN fecha_agendada timestamp with time zone;
ALTER TABLE registro_llamadas ADD COLUMN duracion_minutos integer;

-- Create index for better performance on agendadas
CREATE INDEX idx_registro_llamadas_estado ON registro_llamadas(estado);
CREATE INDEX idx_registro_llamadas_fecha_agendada ON registro_llamadas(fecha_agendada);