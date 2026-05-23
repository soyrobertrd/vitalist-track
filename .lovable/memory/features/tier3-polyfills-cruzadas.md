---
name: Tier 3 polyfills cruzadas + gating clínico por vertical
description: Mapa corporal multi-vertical, vertical opcional en escalas/workflows, useProfessionalVertical aplicado en órdenes/recetas/alertas/farmacia, agenda accesible en todos los planes y verticales
type: feature
---

## Migraciones
- `mapa_corporal_marcas`: paciente_id, vertical, tipo, vista (frontal/posterior/lateral), pos_x/pos_y %, color, severidad, etiqueta, notas. RLS por staff_clinico_de_paciente + admin/coordinador. Auditoría con `registrar_cambio_auditoria`.
- `escalas_clinicas.vertical` (opcional, nullable) → compatible con datos previos.
- `workflow_plantillas.vertical` (opcional, nullable) → permite asociar plantilla a vertical sin romper plantillas globales (`es_global=true`).
- Seed: categorías `tecnica` y `otra` ahora también incluyen `agenda` en `especialidad_categoria_module_access`.

## Componente
`src/components/clinico/MapaCorporal.tsx`: silueta SVG simple + clic para marcar, picker de tipo según vertical activa (clinica/recovery/aesthetic/dental/vision). Integrado como tab "Mapa corporal" en `FichaClinicaPaciente`.

## Gating por vertical profesional
`useProfessionalVertical` aplicado a:
- `OrdenesMedicas`: deshabilita Aceptar/Iniciar/Completar/Cancelar si la vertical activa no coincide.
- `AlertasClinicas`: deshabilita Reconocer/Atender/Descartar.
- `Farmacia`: deshabilita "Agregar stock".
- `RecetasPaciente` (ficha): deshabilita "Nueva receta", muestra vertical asignada como aviso.
Admin/coordinador y profesionales sin vertical asignada conservan acceso completo.

## Agenda universal disponible para todos
- `/agenda-universal` añadido a `FREE_ALLOWED_PATHS` (Layout) y `FREE_WRITE_PATHS` (useFreePlanWriteAccess).
- Item del sidebar ya no está restringido a vertical `clinica`.
- Plan free + todas las categorías profesionales pueden ver/usar agenda.
