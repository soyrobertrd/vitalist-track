---
name: Psicología/Psiquiatría Pro Vertical
description: Vertical 'psicologia' con fichas terapéuticas, sesiones, notas privadas, escalas psicométricas (PHQ-9/GAD-7/BDI/PCL-5/ASRS), seguimiento emocional, psiquiatría, submódulos (infantil, adicciones, pareja, EAP) y paquetes
type: feature
---

## DB
Tablas (todas con RLS por workspace + auditoría):
- `pacientes_psicologia` — ficha clínica ampliada con riesgo suicida/autolesión (alerta_interna_activa) y tutor para menores.
- `sesiones_psicologia` — 8 tipos (primera_evaluacion, individual, pareja, familiar, grupal, psiquiatrico, teleconsulta, emergencia), modalidad presencial/virtual/teléfono, recurrencia semanal, no-show.
- `notas_psicologia` — SOAP, evolutiva, plan, narrativa, observación. RLS especial: privadas solo terapeuta/supervisor/admin. Bloqueo por supervisor. `notas_psicologia_accesos` registra accesos.
- `evaluaciones_psicometricas` — escalas con severidad autocalculada.
- `tareas_terapeuticas` — asignación + cumplimiento.
- `seguimiento_emocional` — ánimo/ansiedad/sueño/estrés 0-10 + disparadores + crisis.
- `prescripciones_psiquiatricas` — medicación + adherencia + alertas (suspensión abrupta, refill, interacción).
- Submódulos nicho: `casos_infantil_psico`, `casos_adicciones`, `casos_pareja`, `casos_eap_corporativo`.
- `paquetes_sesiones` — bonos 4/8, membresía mensual, fee cancelación tardía, cobro automático.

## UI
- `/psicologia-pro` con tabs: fichas, sesiones, notas, evaluaciones, tareas, seguimiento, psiquiatría, paquetes.
- Resumen redirige a `/dashboard` (igual que otras verticales).
- Sidebar muestra entradas específicas bajo "Pacientes" cuando `verticalActiva === "psicologia"`.
- Plan Free aplica igual que dental/aesthetic: profesional independiente puede usarlo (Dashboard, Agenda, Pacientes 100 max, Ficha + Notas).

## Acceso
- Vertical agregada al enum `vertical_tipo` y a `VerticalTipo` en frontend.
- VerticalSwitcher y Layout incluyen icono Brain y label "Psicología / Psiquiatría".
