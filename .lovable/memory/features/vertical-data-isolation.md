---
name: Vertical Data Isolation
description: Each vertical (clinica/dental/aesthetic/recovery/vision) sees only its own patients, appointments, staff and invoices via vertical column + frontend filter
type: feature
---

## Strategy
- Tables `pacientes`, `citas_universales`, `personal_salud`, `facturas`, `registro_llamadas`, `control_visitas`, `consultas_especialidad`, `altas_hospitalarias`, `admisiones`, `recetas_medicas`, `ordenes_medicas` have a `vertical public.vertical_tipo NOT NULL DEFAULT 'clinica'` column.
- Legacy data assigned to `clinica` (Hospital) on migration.
- Frontend filter: `useVerticalFilter()` hook returns `verticalActiva` and `verticalParaInsert`. Apply `.eq("vertical", verticalActiva)` to every list/dashboard query when `verticalActiva !== "todas"`.
- Always set `vertical: verticalParaInsert` on inserts to core tables.
- Admin con vertical "Todas" ve datos consolidados. Al elegir una vertical específica, ve solo esa.

## Hook usage
```ts
const { verticalActiva, verticalParaInsert } = useVerticalFilter();
let q = supabase.from("pacientes").select("*").eq("workspace_id", wsId);
if (verticalActiva && verticalActiva !== "todas") q = q.eq("vertical", verticalActiva);

await supabase.from("pacientes").insert({ workspace_id, vertical: verticalParaInsert, ... });
```

## Files updated for isolation
- `src/hooks/usePacientes.tsx` (Pacientes module + Dashboard counts)
- `src/pages/Dashboard.tsx` (`applyScope` includes vertical filter)
- `src/pages/AgendaUniversal.tsx` (Citas + combos pacientes/personal)
- `src/components/vertical/VerticalPacientesTab.tsx`
- `src/components/pacientes/NuevoPacienteForm.tsx` (insert tags vertical)
