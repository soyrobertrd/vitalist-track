---
name: Fase S - Roles Avanzados, Agenda IA, Comunicaciones Multicanal, Reportes Financieros
description: Roles granulares por vertical con permisos JSON, delegación temporal, predicciones IA no-show, comunicaciones WhatsApp/SMS/email/push con plantillas y campañas, reportes financieros y proyecciones
type: feature
---
## New DB Tables
- `roles_vertical` — Roles personalizados por vertical con permisos granulares (JSON por módulo/acción)
- `asignaciones_rol_vertical` — Asignación usuario↔rol con vigencia temporal
- `delegaciones_acceso_vertical` — Delegación temporal de permisos entre profesionales
- `agenda_ia_predicciones` — Predicciones no-show con probabilidad y factores
- `agenda_ia_sugerencias` — Sugerencias automáticas de reagendamiento con apply/dismiss
- `comunicaciones_multicanal` — Registro de mensajes por canal (email/whatsapp/sms/push)
- `plantillas_comunicacion` — Templates reutilizables con variables y eventos
- `campanas_comunicacion` — Campañas masivas segmentadas con métricas
- `reportes_financieros_vertical` — Reportes generados (estado resultados, balance, flujo caja, conciliación)
- `proyecciones_financieras` — Presupuestos y proyecciones con comparativo real vs proyectado

## New Shared Components
- `VerticalRolesPermisosTab` — CRUD roles con matriz permisos por módulo, delegaciones activas
- `VerticalAgendaIATab` — Dashboard predicciones no-show, sugerencias aplicables/descartables
- `VerticalComunicacionesTab` — Mensajes, plantillas, campañas con subtabs
- `VerticalFinanzasAvanzadasTab` — Generador reportes, historial, proyecciones con variación

## Integration
All four verticals include new tabs: Roles, Agenda IA, Comunicaciones, Finanzas
