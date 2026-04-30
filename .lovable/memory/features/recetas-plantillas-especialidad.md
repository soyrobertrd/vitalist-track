---
name: Recetas Digitales y Plantillas por Especialidad
description: Digital prescriptions with print support and specialty-specific consultation templates (11 specialties) with dynamic JSON forms
type: feature
---

## Recetas Digitales
- Tabla `recetas` + `recetas_items` con RLS por ownership (admin/coord ven todo, staff clínico solo sus pacientes)
- Estados: activa, dispensada, vencida, cancelada
- Items: medicamento, presentación, dosis, vía, frecuencia, duración, cantidad, indicaciones
- Impresión directa desde el componente `RecetasPaciente`
- Integrado como pestaña "Recetas" en `FichaClinicaPaciente`
- Auditoría automática via `registrar_cambio_auditoria`

## Plantillas por Especialidad
- Tabla `plantillas_especialidad` con campos JSON dinámicos
- 11 especialidades: medicina_general, pediatría, ginecología, cardiología, dermatología, odontología, psicología, laboratorio, imágenes, emergencias, otro
- Cada plantilla define campos con tipos: text, textarea, number, select, checkbox
- Tabla `consultas_especialidad` almacena registros de consultas usando plantillas
- Admin gestiona plantillas desde ConfiguracionAdmin > pestaña "Especialidades"
- Componente `ConsultasEspecialidad` en ficha clínica para registrar consultas
- Plantillas default pre-definidas por especialidad con campos relevantes
