---
name: workspace-invitations-and-onboarding
description: Email-based workspace invitations with tokenized accept flow, post-signup onboarding wizard, and plan limits tracking hook
type: feature
---

# Invitaciones de workspace + Onboarding wizard + Límites de plan

## Invitaciones por email
- **Tabla `workspace_invitations`** (`workspace_id`, `email`, `role`, `token`, `estado` pendiente/aceptada/revocada/expirada, `expires_at` 7d).
- **RLS**: admins del workspace gestionan; cualquier usuario autenticado ve invitaciones dirigidas a su email (para aceptar).
- **RPC `get_invitation_details(_token)`**: lectura pública (anon+auth) para mostrar info en página de aceptación sin login.
- **RPC `accept_workspace_invitation(_token)`**: requiere auth, valida email coincida, inserta en `workspace_members`, marca invitación aceptada.
- **Edge function `send-workspace-invitation`**: verifica permisos admin via RPC con auth del usuario, revoca invitaciones previas pendientes para ese email/workspace, crea nueva invitación, envía email vía Resend con link `/aceptar-invitacion?token=...`.
- **Página `/aceptar-invitacion`**: muestra detalles, si no hay sesión redirige a `/auth?redirect=...&email=...`, si hay sesión llama RPC accept y switchea al workspace.

## UI en `/organizaciones`
- Botón "Invitar miembro" abre dialog con email + rol; usa la edge function (antes requería que el usuario ya estuviera registrado).
- Sección "Invitaciones pendientes" con botón Revocar (UPDATE estado='revocada').

## Onboarding wizard (`/onboarding-wizard`)
- 4 pasos: nombre workspace → primera sucursal (es_principal=true) → primer profesional (opcional) → resumen final.
- Marca `workspaces.configuracion.onboarding_completed=true` al terminar; redirige a `/dashboard`.
- Si ya está completado, redirige automáticamente.

## Hook `usePlanLimits` + `<PlanLimitsPanel>`
- Cuenta pacientes/usuarios/profesionales del workspace activo y compara con `currentPlan.limite_*`.
- Devuelve `{ used, max, reached, pctUsed }` por recurso. `max=null` significa ilimitado.
- Componente con barras de progreso (amber ≥80%, destructive si reached) + CTA "Mejorar plan" → `/planes`.
- `<PlanLimitsPanel />` está embebido en la pestaña "Plan" de `/configuracion`.

## Hook `useEnforcePlanLimit`
- Wrapper de `usePlanLimits` que devuelve `canCreate(key)` (true/false). Si el límite del plan está alcanzado, dispara `toast.error` con acción "Mejorar plan" → `/planes` y devuelve false.
- Usado para bloquear la creación antes de abrir formularios:
  - `src/pages/Pacientes.tsx`: `canCreate("pacientes")` antes de abrir el dialog de nuevo paciente o el de importación masiva.
  - `src/pages/Personal.tsx`: `canCreate("profesionales")` (y `"usuarios"` si `createUserAccount`) en el `onOpenChange` del dialog "Nuevo Personal".

## Pendiente
- Integrar Stripe/Paddle para cobros recurrentes (skeleton ya existe en `pagos_workspace` / `subscripciones_workspace` y en las edge functions `payments-checkout` / `payments-webhook`). El usuario pidió **dejar el esqueleto** por ahora.

