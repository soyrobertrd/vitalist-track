---
name: Plan Free Write Access Restrictions
description: Plan gratuito (free) limita crear/editar a Dashboard, Agenda/Calendario, Pacientes y Ficha clínica. Resto de páginas son solo lectura
type: feature
---

## Hook
`useFreePlanWriteAccess()` retorna `{ isFree, canWrite, isReadOnly }` según ruta.

## Rutas con escritura permitida en plan free
- `/dashboard`
- `/agenda/*`, `/calendario/*`, `/recepcion/*`
- `/pacientes/*` (incluye ficha clínica del paciente)
- `/atencion-paciente/*`

## Límite de pacientes plan free
- 100 pacientes (en `planes.limite_pacientes` para `codigo='free'`)
- Componente `<PlanLimitAlert resource="pacientes" />` muestra alerta cuando `pctUsed >= 80%` o cuando se alcanza el máximo, con CTA a `/planes`.
- Ya integrado en Dashboard y Pacientes.

## Componentes
- `src/hooks/useFreePlanWriteAccess.tsx`
- `src/components/PlanLimitAlert.tsx`
