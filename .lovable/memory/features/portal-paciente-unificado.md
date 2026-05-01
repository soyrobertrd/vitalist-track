---
name: Portal Paciente Unificado Multi-Vertical
description: Portal público con tabs adaptativos por vertical, confirmar/reagendar/cancelar citas y bandeja de solicitudes en Recepción
type: feature
---

## DB
- `portal_paciente_datos(_token)` ahora retorna: `vertical`, `facturas`, `planes_dental`, `recetas_oft`, `seguimiento_recovery` (14d), `odontogramas`, además de citas/recetas/alergias/seguros.
- Nueva tabla `portal_solicitudes` (workspace, paciente, cita opcional, tipo, mensaje, fecha_propuesta, estado).
- RPC `portal_paciente_solicitar_accion(_token, _tipo, _cita_id, _mensaje, _fecha_propuesta)` accesible desde anon.
- RLS: workspace members SELECT/UPDATE; inserciones solo vía RPC SECURITY DEFINER.

## UI
- `/portal-paciente?token=...` muestra tabs según vertical del paciente: Citas, Recetas, Facturas, Dental, Visión, Recovery, Alergias, Seguros.
- Cada cita futura tiene botones Confirmar / Reagendar / Cancelar y mensaje al equipo.
- `<PortalSolicitudesInbox />` integrado en Recepción → tab "Portal" para que el equipo atienda/rechace solicitudes.
