---
name: Sub-módulos de nicho Psicología
description: Casos especializados para psicología infantil, adicciones, terapia de pareja y EAP corporativo dentro de PsicologiaPro
type: feature
---
Implementado en Fase 2 como nueva pestaña "Sub-módulos" dentro de `/psicologia-pro`.

## Tablas
- `casos_psico_infantil` (padres separados, escuela, conducta, desarrollo psicomotor/lenguaje/social, alertas)
- `casos_adicciones` + `recaidas_adicciones` + `pruebas_sustancias` (sponsor, plan recuperación, días sobriedad)
- `casos_pareja` (paciente_id_a/b) + `acuerdos_pareja` + `cronologia_conflicto_pareja`
- `contratos_eap` + `empleados_eap` (código anónimo único por contrato) + `sesiones_cubiertas_eap`

## RLS
Todas usan `is_workspace_member` (SELECT/INSERT/UPDATE) y `is_workspace_admin` (DELETE).

## Free plan
Estos sub-módulos están en plan Pro. Free ya tiene psicología base limitada según `useFreePlanWriteAccess`.

## UI
- Componente `src/components/psicologia/SubmodulosNicho.tsx`, sub-tabs por nicho.
- EAP muestra empleados con código anónimo (no nombre real) en listados.
