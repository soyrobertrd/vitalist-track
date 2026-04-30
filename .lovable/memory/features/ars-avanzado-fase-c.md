---
name: ARS Avanzado Fase C
description: Aseguradoras, planes, tarifarios, autorizaciones médicas y reclamaciones ARS
type: feature
---
## Tables
- `aseguradoras` — Catálogo ARS con RNC, contacto, estado activa/inactiva
- `planes_seguro` — Planes por aseguradora (cobertura %, copago, deducible)
- `tarifarios_ars` — Precios por procedimiento/ARS, flag requiere_autorizacion
- `autorizaciones_medicas` — Solicitud→aprobación con número, montos, vigencia
- `reclamaciones_ars` — Lotes de reclamación con estados borrador→pagada
- `reclamaciones_detalle` — Facturas incluidas en cada reclamación

## Enums
- `estado_autorizacion`: solicitada, en_revision, aprobada, rechazada, vencida, cancelada
- `estado_reclamacion`: borrador, enviada, en_revision, pagada, rechazada, parcial, anulada

## UI
- Finanzas page has 6 tabs: Caja, Notas Crédito, ARS, Tarifarios, Autorizaciones, Reclamaciones
- Components in `src/components/ars/`

## RLS
- SELECT: workspace members
- INSERT/UPDATE: workspace members (autorizaciones/reclamaciones) or admins (aseguradoras/tarifarios)
- DELETE: workspace admins only
