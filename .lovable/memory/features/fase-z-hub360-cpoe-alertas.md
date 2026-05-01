---
name: Fase Z - Hub 360, CPOE y Alertas Clínicas
description: Hub Clínico 360° del paciente con timeline, motor de Órdenes Médicas (CPOE) y sistema de Alertas Clínicas inter-módulos
type: feature
---
- Hub 360°: función `paciente_timeline_360(_paciente_id, _limite)` agrega visitas, llamadas, órdenes y alertas. Página `/hub-paciente/:id`.
- CPOE: tabla `ordenes_medicas` (tipo, prioridad rutina/urgente/stat, estado, modulo_destino, recurso_destino_id) + `ordenes_medicas_eventos` con bitácora automática vía trigger.
- Workflows: `workflows_clinicos` (evento_disparador + acciones jsonb) + `workflows_ejecuciones`.
- Alertas: `alertas_clinicas` (tipo: sepsis/deterioro/valor_panico/alergia_conflicto/vencimiento_critico/triage_critico, severidad baja-crítica) + `alertas_clinicas_acciones`.
- RLS: workspace-based (is_workspace_member). Auditoría automática en órdenes y alertas.
- Páginas: /hub-paciente/:id, /ordenes-medicas, /alertas-clinicas
