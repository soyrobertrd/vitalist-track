---
name: Psicología Fase 5 – Portal paciente, recordatorios e integraciones externas
description: Portal público del paciente con token, cola de recordatorios automáticos de sesiones e integraciones con farmacia/laboratorio externos.
type: feature
---

- `portal_psico_accesos`: tokens hex de 64 chars por paciente, expira_at, revocado. RPC `generar_token_portal_paciente(_paciente_id, _dias)` (admin/staff workspace) y `leer_portal_paciente_por_token(_token)` (público) que devuelve datos básicos: paciente, próximas sesiones (`sesiones_psicologia.fecha_hora`), evaluaciones recientes. Notas y notas ultra-privadas NUNCA se exponen.
- Ruta pública: `/portal-psico/:token` → `src/pages/PortalPacientePsico.tsx`.
- `recordatorios_sesiones_psico`: cola con canal (email/sms/whatsapp), `programado_para`, estado pendiente/enviado/fallido/cancelado. UI permite programar masivamente recordatorios 24h antes para sesiones futuras.
- `integraciones_externas_psico`: configuración por workspace de farmacia/laboratorio (tipo, nombre, endpoint, api_key_cifrada, activo). Solo workspace owner/admin gestiona; staff puede ver.
- `envios_externos_psico`: log de envíos de prescripciones/órdenes a integraciones, con payload y respuesta.
- Tabs nuevos en PsicologiaPro: `Recordatorios`, `Integraciones`, `Portal paciente`.
- IMPORTANTE: `sesiones_psicologia` usa columna `fecha_hora` (timestamptz), NO `fecha`+`hora`.
