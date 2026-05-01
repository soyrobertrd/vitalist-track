---
name: Plan Free Limited Modules
description: Plan gratuito (free) muestra solo Dashboard, Agenda/Calendario, Pacientes, Recepción, Atención al paciente, Soporte y Configuración. Para doctores/enfermeras independientes
type: feature
---

## Detección
`useFreePlan()` lee `currentPlan.codigo` (free/gratis/gratuito) o `nombre` que contenga "gratis"/"gratuito"/"free".

## Whitelist (Layout.tsx)
```
/dashboard, /agenda (grupo), /calendario, /recepcion,
/pacientes (grupo + lista), /atencion-paciente,
/soporte, /configuracion
```

Cualquier item/subItem fuera de la whitelist queda oculto cuando `isFree === true`.
La ficha clínica del paciente se accede desde `/pacientes` → detalle, por eso no requiere ruta propia en la whitelist.
