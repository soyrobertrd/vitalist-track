---
name: Fase 4 — Salud y notificaciones
description: Panel de salud del sistema (crons), exportación HIPAA avanzada y notificaciones push web. Cron jobs documentados pero no activados.
type: feature
---
- Tabla `cron_ejecuciones` registra cada corrida de cron (success/fail, duración, error). Solo admins ven.
- Tabla `push_subscriptions` guarda suscripciones del navegador del usuario.
- Función `estadisticas_salud_sistema()` devuelve KPIs para el panel.
- Edge function `exportar-auditoria-avanzada` exporta CSV/JSON filtrado por origen (alertas/accesos/cambios), severidad, tipo, rango.
- Componentes: `PanelSaludSistema`, `ExportarAuditoriaAvanzada`, `PushNotificationsToggle` integrados en pestaña "Salud" de `AuditoriaHIPAA`.
- Cron jobs en `scripts/programar-crons.md` — copiar al SQL editor para activar manualmente.
