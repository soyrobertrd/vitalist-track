-- Agregar campos de zona y barrio a personal_salud
ALTER TABLE personal_salud
ADD COLUMN zona text,
ADD COLUMN barrio text,
ADD COLUMN direccion text;

-- Agregar nuevo estado para pacientes sospechosos
ALTER TABLE pacientes
ADD COLUMN es_sospechoso boolean DEFAULT false;

-- Comentarios para documentar
COMMENT ON COLUMN personal_salud.zona IS 'Zona/municipio donde reside el profesional';
COMMENT ON COLUMN personal_salud.barrio IS 'Barrio donde reside el profesional';
COMMENT ON COLUMN personal_salud.direccion IS 'Dirección completa del profesional';
COMMENT ON COLUMN pacientes.es_sospechoso IS 'Indica si el paciente es sospechoso (no ha entrado al programa pero requiere seguimiento)';