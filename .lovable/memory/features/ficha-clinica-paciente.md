---
name: Ficha Clínica del Paciente
description: Three clinical record tables (allergies, medical history, insurance) with ownership-based RLS and audit logging
type: feature
---
Cada paciente tiene una ficha clínica accesible desde `PacienteDetailDialog` mediante el componente `FichaClinicaPaciente`. La ficha incluye 3 secciones en pestañas:

1. **Alergias** (`alergias_paciente`): sustancia, tipo (medicamento/alimento/ambiental/otro), severidad (leve/moderada/severa/anafilaxia), reacción, notas. La severidad se muestra con color (anafilaxia rojo intenso).
2. **Antecedentes médicos** (`antecedentes_medicos`): tipo (personal/familiar/quirúrgico/hospitalización), condición, año, parentesco (solo si es familiar), activo/resuelto, notas.
3. **Seguros de salud** (`seguros_paciente`): aseguradora/ARS, plan, número de afiliado/póliza, titular, parentesco con titular, fecha inicio/vencimiento, activo, notas.

**Acceso (RLS)**: Admins/coordinadores ven todo. Médicos/enfermeras solo ven registros de pacientes asignados a ellos vía `is_staff_clinico_de_paciente`.

**Auditoría**: Todos los cambios en estas tablas se registran automáticamente vía trigger `registrar_cambio_auditoria` en `auditoria_cambios`.
