---
name: Fase V - Camas, Reportes Regulatorios, CRM Fidelización, API Gateway
description: Control de camas/ocupación, reportes SISALRIL/SENASA/MSP, programas de puntos/referidos/NPS, y API keys + webhooks configurables
type: feature
---
## DB Tables (new)
- `camas_vertical` — Camas por piso/sala/vertical con estado (disponible, ocupada, limpieza, mantenimiento, reservada)
- `ocupacion_camas_log` — Historial ingreso/egreso por cama
- `reportes_regulatorios` — Reportes para SISALRIL/SENASA/MSP/DGII con estado y vencimiento
- `calendario_regulatorio` — Vencimientos recurrentes (mensual, trimestral, semestral, anual)
- `programa_fidelizacion` — Programas de puntos/referidos/descuentos por vertical
- `puntos_paciente` — Puntos acumulados/canjeados por paciente
- `referidos_paciente` — Registro de referidos entre pacientes
- `nps_encuestas` — NPS score 0-10 con categoría auto-calculada (promotor/pasivo/detractor)
- `api_keys_externas` — API keys con hash, permisos, rate limiting (solo admins)
- `webhooks_config` — Webhooks configurables con eventos y secret
- `webhooks_log` — Log de envíos con status code y duración

## Shared Components
- `VerticalCamasTab` — Mapa de camas con KPIs de ocupación + historial
- `VerticalReportesRegulatoriosTab` — Reportes + calendario regulatorio
- `VerticalCRMFidelizacionTab` — Programas, campañas marketing, NPS dashboard
- `VerticalAPIGatewayTab` — API keys, webhooks config, logs de envío

## Integration
All four verticals include tabs: Camas, Regulatorio, CRM/Fidelización, API Gateway
