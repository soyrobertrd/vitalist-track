---
name: Psicología Fase 6 – Cron recordatorios + envío a integraciones externas
description: Edge functions y RPCs para despachar recordatorios psico pendientes y enviar prescripciones/órdenes a farmacia/laboratorio con logging.
type: feature
---

- RPC `listar_recordatorios_psico_pendientes(_ventana_min)` (security definer): retorna pendientes con nombre, email_px/cuidador, contacto_px/cuidador y `sesion_fecha_hora`.
- RPC `marcar_recordatorio_psico(_id, _estado, _error)`: actualiza estado y `enviado_at` cuando 'enviado'.
- Edge function `dispatch-recordatorios-psico`: ejecutada por cron, llama RPC, dispara `send-recordatorio-cita` por canal (email/sms/whatsapp) y marca cada item.
- Edge function `enviar-integracion-externa-psico`: requiere JWT, valida membresía workspace, POSTea al endpoint configurado de la integración con `Authorization: Bearer <api_key_cifrada>` si existe, y registra en `envios_externos_psico` (estado enviado/fallido + respuesta truncada a 2000 chars).
- Para activar el cron real, programar con `cron.schedule` apuntando a `/functions/v1/dispatch-recordatorios-psico` cada 15 min.
- IMPORTANTE: tabla `pacientes` usa `nombre`/`apellido` y `email_px`/`email_cuidador`/`contacto_px`/`contacto_cuidador`. NO existe `nombres`/`apellidos`/`email`. `numero_principal` es un flag ('paciente'|'cuidador'), no un teléfono.
