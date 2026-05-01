---
name: Fase EE - Workflows, Tareas, Chat y Firmas
description: Motor de workflows globales con eventos del sistema, tablero Kanban de tareas internas por departamento, chat interno seguro con canales y realtime, y firmas digitales manuscritas
type: feature
---
- `workflow_reglas_globales` + `workflow_ejecuciones_globales`: reglas IF/THEN sobre eventos (cita_no_confirmada, cirugia_manana, balance_pendiente, lab_listo, paciente_sin_volver, no_show, factura_vencida, etc.). Solo admins gestionan; cualquier miembro puede insertar ejecuciones.
- `tareas_internas` + `tareas_comentarios`: Kanban (pendiente/en_progreso/bloqueada/hecha/archivada) con departamento, prioridad, asignado, paciente, fecha límite. Realtime activo. Edita: creador, asignado o admin.
- `chat_canales` + `chat_canal_miembros` + `chat_mensajes`: tipos (general/departamento/directo/paciente/sucursal), privado opcional. Helper SECURITY DEFINER `es_miembro_canal` evita recursión. Trigger auto-añade creador como admin del canal. Realtime activo en mensajes.
- `firmas_digitales`: tipos (medicamento_entrega, documento_recepcion, alta_medica, consentimiento, equipo_entrega, muestra_lab). Captura manuscrita en canvas → dataURL PNG inline. Solo admins anulan; nunca se editan.
- Rutas: `/workflows-avanzados`, `/tareas`, `/chat`, `/firmas`. Agrupadas en menú común "Operaciones" (visibles en todas las verticales).
