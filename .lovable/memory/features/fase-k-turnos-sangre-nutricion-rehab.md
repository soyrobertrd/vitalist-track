---
name: Fase K - Turnos, Banco de Sangre, Nutrición, Rehabilitación
description: Four hospital modules: queue management (realtime), blood bank (donors/units/transfusions), nutrition (evaluations/diets/menus), rehabilitation (plans/sessions/progress)
type: feature
---
## Turnos y Colas
- `turnos_cola` con numeración diaria auto (T-NNNN), prioridad (normal/prioritario/emergencia), estados (esperando→llamado→atendiendo→completado/no_presentado)
- `pantallas_turno` para configurar pantallas de llamado
- Realtime habilitado en `turnos_cola`
- Ruta: `/turnos`

## Banco de Sangre
- `donantes_sangre`: tipo sangre (A/B/AB/O), factor Rh (+/-), elegibilidad
- `unidades_sangre`: componentes (sangre_total/globulos_rojos/plaquetas/plasma/crioprecipitado), lotes, vencimiento
- `solicitudes_transfusion`: numeración auto (TRX-YYYY-NNNNN), urgencia, pruebas cruzadas
- Ruta: `/banco-sangre`

## Nutrición y Dietética
- `evaluaciones_nutricionales`: peso, talla, IMC, diagnóstico nutricional
- `dietas_hospitalarias`: 13 tipos de dieta, calorías objetivo, restricciones
- `menus_dieta`: comidas diarias con preparación y entrega
- Ruta: `/nutricion`

## Rehabilitación y Fisioterapia
- `planes_rehabilitacion`: numeración auto (RHB-YYYY-NNNNN), 6 tipos, duración, sesiones/semana
- `sesiones_rehabilitacion`: dolor antes/después, progreso %, asistencia
- Ruta: `/rehabilitacion`

## Reorganización Sidebar
- Odontología separada como sección independiente (puede usarse como consultorio dental standalone)
- Plantillas movidas a grupo Configuración
- Auditoría, API Pública, Checklist RLS agrupados bajo Configuración
