---
name: agenda-inteligente-fase2
description: Sugerencias de horario, conflictos en tiempo real y rutas optimizadas (TSP nearest-neighbor) para visitas domiciliarias
type: feature
---
Fase 2 — Agenda Inteligente y Rutas Home Care.

**Componentes nuevos:**
- `SugerenciasHorarioInline`: muestra próximos 6 slots disponibles del profesional usando `useSmartRescheduling.findAvailableSlots`. Se integra inline dentro de los diálogos de agendamiento con un botón "Sugerir horarios disponibles".
- `AlertaConflictoEnVivo`: banner destructivo que aparece cuando hay solapamiento de agenda con otras llamadas/visitas del mismo profesional.
- `useConflictoEnVivo`: hook reactivo (debounce 400ms) que ejecuta `detectConflicts` cada vez que cambian profesional/fecha/hora/duración.

**Optimización de rutas (`/rutas`):**
- `src/lib/routeOptimizer.ts`: agrupa visitas por zona y aplica nearest-neighbor TSP usando coordenadas haversine. Genera URL de Google Maps con waypoints.
- `src/pages/RutasOptimizadas.tsx`: vista del día con paradas numeradas, distancia total km, link "Abrir en Maps". Solo procesa visitas con `tipo_visita = "domicilio"` y estado distinto de cancelada.
- Pacientes sin lat/lng se incluyen al final pero no entran en la optimización por distancia (alerta amarilla con conteo).

**Integración en `AgendarLlamadaDialog`:**
- Estado `selectedHora` y `selectedDuracion` ahora controlados (antes no controlados).
- Sugerencias y alerta de conflicto integradas debajo del bloque fecha/hora/duración.

**Ruta:** `/rutas` añadida al sidebar dentro del grupo "Agenda" con icono `Route`.
