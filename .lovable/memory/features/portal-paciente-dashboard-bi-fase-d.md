---
name: Portal Paciente + Dashboard BI (Fase D)
description: Public patient portal with token-based access and BI analytics dashboard with trend/comparative views
type: feature
---
## Portal Paciente
- Tabla `portal_paciente_tokens`: tokens temporales (30 días) para acceso público
- Función `portal_paciente_datos(_token)`: retorna datos limitados del paciente (citas, recetas, alergias, seguros)
- Página `/portal-paciente?token=xxx`: pública, sin auth
- Botón "Portal paciente" en `PacienteDetailDialog` genera token y enlace compartible

## Dashboard BI
- Página `/dashboard-bi` (auth, dentro de Layout)
- Tabs: Resumen Ejecutivo, Tendencias, Comparativo Sucursales, Constructor de Reportes
- KPIs: pacientes, llamadas, visitas, ingresos, cobrado, pendiente
- Gráficos: tendencia mensual, distribución zonal, top profesionales, comparativo sucursales
- Tabla `reportes_bi_guardados`: reportes BI personalizados guardados por usuario
- Export Excel integrado
- Integra `ReportBuilder` existente en tab Constructor
