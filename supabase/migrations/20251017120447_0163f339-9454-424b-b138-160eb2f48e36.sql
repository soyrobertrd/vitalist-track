-- Add foreign key constraints for better data integrity
ALTER TABLE registro_llamadas
  ADD CONSTRAINT fk_registro_llamadas_paciente
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_registro_llamadas_profesional
  FOREIGN KEY (profesional_id) REFERENCES personal_salud(id) ON DELETE SET NULL;

ALTER TABLE control_visitas
  ADD CONSTRAINT fk_control_visitas_paciente
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_control_visitas_profesional
  FOREIGN KEY (profesional_id) REFERENCES personal_salud(id) ON DELETE SET NULL;