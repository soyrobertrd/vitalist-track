---
name: Fase W - Internamientos, enfermería, laboratorio y agenda universal
description: Rondas médicas, valoración/plan de cuidados/signos vitales/medicamentos enfermería, trazabilidad muestras + QC + alertas lab, y agendamiento universal multi-área
type: feature
---
## Internamiento + Rondas
- `rondas_medicas` (general/uci/urgencia/docente/interconsulta) con líder, participantes, estado.
- `ronda_paciente_notas`: evolución, cambios al plan, órdenes nuevas, estado paciente, duración.

## Enfermería
- `valoracion_inicial_enfermeria`: patrones funcionales, riesgos caídas/UPP, nutricional, emocional.
- `plan_cuidados_enfermeria`: NANDA / NOC / NIC con prioridad y evaluación.
- `signos_vitales_turno`: TA, FC, FR, T°, SatO2, glic, dolor EVA, diuresis por turno.
- `procedimientos_enfermeria`: tipo + insumos.
- `administracion_medicamentos`: programación → administrada/omitida/retrasada/rechazada.

## Laboratorio avanzado
- `muestras_laboratorio`: código de barras único, estados (recolectada→recibida→procesada/rechazada).
- `procesamiento_lab`: resultado, unidad, valor referencia, fuera_rango, critico, validación.
- `control_calidad_lab`: QC por equipo/prueba con desviación auto-calculada.
- `alertas_laboratorio`: valor crítico, panel anormal, retraso, muestra rechazada.

## Agendamiento universal multi-área
- `areas_servicio`: catálogo (consulta, lab, imagen, quirófano, rehab, dental, visión, vacunación, telemed, recovery, enfermería, etc.).
- `citas_universales`: agendar a CUALQUIER área con prioridad, origen, cita_padre_id para vincular.
- Página `/agenda-universal` permite gestión completa con filtros por área.

## Rutas nuevas
`/rondas-medicas`, `/enfermeria`, `/laboratorio-avanzado`, `/agenda-universal`. Todas en menú "Hospital".

## RLS
- Personal clínico asignado al paciente + admin/coordinador para datos clínicos.
- Workspace members para rondas, áreas y citas universales.
- Auditoría auto en rondas, planes cuidado, admin meds y citas universales.
