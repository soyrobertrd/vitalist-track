---
name: Multi-centro y hospitalización
description: Afiliaciones por plan, jerarquía física, admisiones, triaje Manchester, UCI, escalas y API pública
type: feature
---
- **Afiliaciones**: tabla `afiliaciones_profesional` (user_id ↔ workspace_id). Trigger valida límite según `planes.caracteristicas.max_centros` (free=1, pago=5).
- **Estructura física**: `edificios → pisos → alas → consultorios → camas`. RLS por `is_member_of_sucursal`.
- **Asignaciones**: `consultorio_asignaciones` (turnos profesional/consultorio).
- **Hospitalización**: `admisiones` (hospitalizacion/emergencia/uci/observacion). Trigger marca camas ocupada/disponible.
- **Triaje Manchester**: `triaje_eventos` con 5 niveles (rojo→azul) y signos vitales.
- **UCI completa**: `uci_notas` (SOFA/APACHE), `uci_infusiones`, `uci_balance_hidrico`, `kardex_enfermeria`, `pase_turno`.
- **Escalas clínicas**: `escalas_clinicas` (Glasgow, Barthel, Braden, NEWS2, EVA, Norton, Morse, SOFA). Componente `EscalasClinicasPaciente` en ficha.
- **Especialidades**: catálogo `especialidades_medicas` + N:M `profesional_especialidades`.
- **API pública**: edge function `api-citas-publicas` con auth por `x-api-key` (tabla `public_appointment_tokens`). Endpoints: `/profesionales`, `/disponibilidad`, `/agendar`, `/mis-citas`, `/cancelar`. Página admin en `/api-citas`.
- **Rutas nuevas**: `/consultorios`, `/hospitalizacion`, `/triaje`, `/api-citas`. Menú agrupado en "Hospital".
