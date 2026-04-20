---
name: Historia Clínica Avanzada (SOAP + Diagnósticos + Timeline)
description: Evoluciones SOAP, diagnósticos CIE-10, documentos clínicos categorizados y timeline cronológico unificado en la ficha del paciente
type: feature
---
La ficha clínica del paciente (`FichaClinicaPaciente`) ahora incluye 4 secciones nuevas además de Alergias/Antecedentes/Seguros/Cobros:

1. **Timeline** (`TimelineClinica`): vista cronológica unificada que combina evoluciones, diagnósticos, visitas, llamadas y documentos. Filtros por tipo. Pestaña por defecto.
2. **Evoluciones SOAP** (`EvolucionesSOAP`, tabla `evoluciones_soap`): notas estructuradas Subjetivo/Objetivo/Análisis/Plan + signos vitales JSON (TA, FC, FR, T°, SpO₂, peso) + motivo de consulta + opcional vínculo a visita.
3. **Diagnósticos** (`DiagnosticosPaciente`, tabla `diagnosticos_paciente`): código CIE-10, descripción, tipo (principal/secundario/presuntivo), estado (activo/crónico/resuelto/descartado), fechas.
4. **Documentos clínicos** (`DocumentosClinicos`, tabla `documentos_clinicos` + bucket privado `documentos-clinicos`): adjuntos categorizados (laboratorio/imagen/receta/informe/consentimiento/otro). Storage organizado como `{paciente_id}/{file}` con signed URLs para descarga.

**RLS**: Admins/coordinadores ven todo. Staff clínico solo de pacientes asignados (`is_staff_clinico_de_paciente`).
**Auditoría**: Triggers `registrar_cambio_auditoria` en las 3 tablas nuevas.
