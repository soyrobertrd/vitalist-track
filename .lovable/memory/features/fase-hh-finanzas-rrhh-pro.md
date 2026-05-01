---
name: Fase HH - Finanzas Pro + RRHH Pro
description: Forecast de ingresos, AR aging, centros de costo, costeo por servicio, evaluaciones de desempeño, metas con bonos y capacitaciones
type: feature
---

## Tablas
- `forecast_ingresos` — proyección mensual estimado vs real por categoría.
- `ar_aging_snapshots` + función `calcular_ar_aging(workspace_id)` — saldos pendientes por antigüedad (0-30/31-60/61-90/90+) calculados desde facturas.
- `centros_costo` + `costeo_servicios` (con `costo_total` GENERATED) — estructura de costos y margen por servicio.
- `evaluaciones_desempeno` — competencias JSONB, calificación 0-5, firmas empleado/evaluador.
- `metas_incentivos` — bonos con trigger `calcular_cumplimiento_meta` que auto-completa al 100%.
- `capacitaciones_empleados` — cursos con horas y certificación.

## Páginas
- `/forecast-ingresos`, `/ar-aging`, `/costeo-servicios` — bajo Finanzas en menú.
- `/evaluaciones-desempeno`, `/metas-incentivos`, `/capacitaciones` — bajo Equipo & RRHH.

## RLS
Todas por `is_workspace_member(auth.uid(), workspace_id)`.
