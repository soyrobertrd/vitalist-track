---
name: Fase P - Multi-Sucursal, Portal, BI, Marketing para Verticales
description: Sucursales por vertical, portal paciente tokenizado, CRM leads, campañas marketing multi-canal, WhatsApp automático, pagos online, dashboard BI con métricas
type: feature
---
## New DB Tables
- `sucursales_vertical` — Branch offices per vertical (dental/estetica/recovery/vision)
- `portal_paciente_vertical` — Tokenized patient portal access per vertical
- `campanas_marketing_vertical` — Marketing campaigns (WhatsApp/email/SMS/Instagram)
- `leads_vertical` — CRM leads with origin tracking (IG/FB/TikTok/Google/referido/WhatsApp/website)
- `metricas_bi_vertical` — BI metrics (ingresos, gastos, citas, retención, ticket promedio)
- `mensajes_whatsapp_vertical` — WhatsApp message log (recordatorio/confirmacion/seguimiento/marketing/bienvenida/cumpleanos)
- `pagos_online_vertical` — Online payments (tarjeta/transferencia/paypal/stripe/efectivo/mixto)

## New Shared Components
- `VerticalSucursalesTab` — Multi-branch management per vertical
- `VerticalLeadsCRMTab` — CRM with lead tracking, origin, value estimation, funnel stages
- `VerticalMarketingTab` — Campaign creation + WhatsApp message log
- `VerticalBITab` — BI dashboard with KPIs, revenue, retention, conversion rates
- `VerticalPortalTab` — Token generation for patient portal access
- `VerticalPagosTab` — Online payment registration and tracking

## Integration
All four verticals (DentalCare, AestheticPro, RecoveryCare, VisionCare) include new tabs:
Sucursales, CRM Leads, Marketing, Pagos Online, Portal, BI
