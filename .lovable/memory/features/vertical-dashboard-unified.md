---
name: Vertical Dashboard Unified
description: "Resumen [Vertical]" se fusionó con /dashboard. Las rutas /aesthetic-pro, /dental-care, /recovery-care, /vision-care sin ?tab= redirigen a /dashboard
type: feature
---

## Comportamiento
- Sidebar: ya no muestra item "Resumen [Vertical]" separado.
- Pages `/aesthetic-pro`, `/dental-care`, `/recovery-care`, `/vision-care`:
  - Si no tienen `?tab=...` → `<Navigate to="/dashboard" replace />`
  - Con `?tab=...` siguen mostrando la sección específica.
- Dashboard adapta el título: `Dashboard · [Vertical]` cuando `verticalActiva !== "todas"`.
- Mapas/rutas (Calendario tab Mapa, sidebar Visitas/Rutas) solo visibles en verticales con visita domiciliaria: `clinica`, `recovery`.

## Botón "Agendar cita"
Disponible vía `<AgendarCitaButton />` en:
- `/calendario` (header)
- `/pacientes` (header)
- Ficha del paciente (header de la card)
- Agenda Universal (ya tenía su propio botón)
