---
name: Fase 11 Teleconsulta y NCF
description: Videoconsultas WebRTC con signaling, generador NCF DGII y cron de recordatorios psico
type: feature
---
- `teleconsulta_sesiones` + `teleconsulta_signaling` con realtime para WebRTC P2P (STUN público de Google).
- RLS: admin workspace, profesional asignado y emisor pueden enviar/leer; participantes ven solo su sesión.
- `generar_ncf(_workspace_id, _tipo)` emite el siguiente NCF de la secuencia activa (`ncf_secuencias`) y bloquea la fila con FOR UPDATE.
- Cron `psico-recordatorios-cron` ejecuta `dispatch-recordatorios-psico` cada hora.
- Página `/teleconsulta` permite crear sala, unirse por código, ver lista de sesiones y videollamada con mic/cam/colgar.
