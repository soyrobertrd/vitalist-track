---
name: Fase R - Inventario Clínico, Reportes KPI, Onboarding, PWA
description: Inventario por vertical con movimientos y alertas stock, KPIs ejecutivos en vivo, wizard onboarding 5 pasos con subnichos, panel PWA con install prompt
type: feature
---
## New DB Tables
- `inventario_vertical` — Stock productos/insumos por vertical con precio costo/venta, lote, vencimiento, proveedor
- `movimientos_inventario_vertical` — Entradas/salidas/ajustes/merma/devolución con trigger auto-update stock
- `reportes_kpi_vertical` — Métricas históricas por vertical (tipo_kpi, valor, periodo)
- `onboarding_vertical` — Progreso wizard configuración inicial por vertical (5 pasos)
- `plantillas_servicio_vertical` — Catálogo servicios predefinidos por subnicho

## New Shared Components
- `VerticalInventarioTab` — CRUD inventario con alertas stock bajo, registro movimientos
- `VerticalReportesKPITab` — Dashboard KPIs en vivo (ingresos, citas, leads, cancelaciones)
- `VerticalOnboardingTab` — Wizard 5 pasos: perfil, equipo, agenda, facturación, listo
- `VerticalPWATab` — Panel PWA con install prompt, estado online/offline, instrucciones

## Integration
All four verticals include new tabs: Inventario, KPIs, Setup, PWA
