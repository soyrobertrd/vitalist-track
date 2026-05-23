---
name: Reportes por vertical
description: Páginas /reportes/{dental,vision,aesthetic,recovery} con KPIs, gráficas y export Excel. Componente base ReporteVerticalBase consume pacientes/citas/facturas filtrando por vertical
type: feature
---

## Implementación
- Componente `src/components/reportes/ReporteVerticalBase.tsx` — KPIs (pacientes activos/nuevos, citas, ingresos), bar chart de citas/día, pie de estados, export XLSX.
- Páginas en `src/pages/reportes/`: ReportesDental, ReportesVision, ReportesAesthetic, ReportesRecovery — wrappers tipados con vertical + color de acento.
- Rutas registradas en App.tsx: `/reportes/{vertical}`.
- Sidebar: grupo "Reportes & BI" añadido en Layout.tsx antes de Configuración, incluye reportes generales, programados, regulatorios, dashboard BI y los 5 reportes por vertical (cada uno se muestra solo cuando su vertical está activa o "todas").

## Consultas
Filtran por `workspace_id` + `vertical` sobre `pacientes`, `citas_universales`, `facturas`. Rango configurable 7/30/90 días.
