---
name: Fase CC - Integración total inter-módulos
description: Hub 360° expandido con todos los módulos, Centro de Comando Clínico unificado y Workflows clínicos con plantillas predefinidas
type: feature
---
- Hub 360°: `paciente_timeline_360` ahora incluye visitas, llamadas, órdenes médicas (CPOE), alertas clínicas, laboratorio, imagenología y eventos adversos. Página `/hub-paciente/:id` con filtros por módulo y acciones rápidas (nueva visita/llamada/orden/workflow).
- Centro de Comando: `centro_comando_metricas(_workspace_id)` agrega alertas por severidad, órdenes pendientes/urgentes, camas, telemedicina activa, eventos adversos, FHIR jobs y sync offline. Página `/centro-comando` con auto-refresh 30s.
- Workflows: tabla `workflow_plantillas` (es_global, categoria, evento_disparador, acciones jsonb) + función `workflow_ejecutar_plantilla`. 4 plantillas globales sembradas: sepsis_protocolo, alta_hospitalaria, post_cirugia, alergia_detectada. Página `/workflows-clinicos`.
- RLS: plantillas globales visibles para todos; las de workspace solo para sus miembros, gestionadas por admin.
- Rutas canónicas: `/calidad`, `/telemedicina`, `/centro-comando`, `/workflows-clinicos`, `/hub-paciente/:id`.
