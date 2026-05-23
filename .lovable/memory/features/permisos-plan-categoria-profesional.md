---
name: Permisos efectivos por plan y categoría profesional
description: Matriz de acceso a módulos top-level del menú según plan_codigo del workspace y categoria de la especialidad del usuario en personal_salud
type: feature
---

## Tablas
- `modulos_catalogo(key, label, orden)` — 14 keys: dashboard, agenda, pacientes, clinico, diagnostico, recursos, financiero, equipo, crm, turnos, avanzado, telemedicina, config, soporte.
- `plan_module_access(plan_codigo, modulo_key, allowed)` — seeds para free/solo/pro/business.
- `especialidad_categoria_module_access(categoria, modulo_key)` — seeds para medica/enfermeria/tecnica/terapeutica/administrativa/otra.

## RPC
`public.get_modulos_efectivos(_user_id, _workspace_id) RETURNS TABLE(modulo_key text)`
- Resuelve plan del workspace.
- Si es owner/admin del workspace o admin global → bypassea categoría.
- Si no, busca `personal_salud.especialidad → especialidades_catalogo.categoria` para el workspace activo (fallback `otra`).
- Devuelve intersección plan ∩ categoría.

## Hook
`src/hooks/useEffectiveModules.tsx` → `{ allowed: Set<string>, canAccess(key?), loading }`.

## Integración
`src/components/Layout.tsx` añade `moduleKey` a cada grupo top-level del menú y filtra `visibleMenuItems` con `canAccessModule(item.moduleKey)`. Coexiste con `useFreePlan` (whitelist de subitems) y filtro vertical.
