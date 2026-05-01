---
name: Fase Q - Telemedicina, Facturación Electrónica, Integraciones Externas
description: Teleconsultas, recetas digitales firmadas, historia compartida, comprobantes e-CF/DGII con ITBIS, reportes 606/607, integraciones WhatsApp/Google Calendar/HL7/Stripe/CardNET
type: feature
---
## New DB Tables
- `teleconsultas_vertical` — Videoconsultas por vertical (programada/en_curso/completada/cancelada/no_show)
- `recetas_digitales_vertical` — Recetas electrónicas con firma digital, auto-numbered RXV-YYYY-NNNNN
- `historia_compartida_vertical` — Historia clínica compartida entre verticales
- `facturas_electronicas_vertical` — e-CF con NCF (B01-B17), ITBIS, estado DGII, auto-numbered FEV-YYYY-NNNNN
- `reportes_fiscales_vertical` — Reportes 606/607/608/609 por período
- `integraciones_externas_vertical` — Config de integraciones (WhatsApp API, Google Calendar, HL7, Stripe, CardNET, PayPal, Mailchimp, Meta Ads)
- `sync_calendario_vertical` — Sync citas con calendarios externos (Google/Outlook/Apple)

## New Shared Components
- `VerticalTelemedicinaTab` — Programación y gestión de teleconsultas
- `VerticalRecetasTab` — Emisión de recetas digitales con medicamentos y firma
- `VerticalFacturacionElectronicaTab` — Comprobantes e-CF con cálculo ITBIS 18%, reportes fiscales
- `VerticalIntegracionesTab` — Panel de integraciones con toggle activo/inactivo

## Integration
All four verticals include new tabs: Telemedicina, Recetas, e-CF/DGII, Integraciones
