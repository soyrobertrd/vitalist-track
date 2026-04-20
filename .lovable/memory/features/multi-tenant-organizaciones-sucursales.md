---
name: Multi-tenant Organizations and Branches
description: Workspaces, branches (sucursales), member roles, patient nationality/document, and workspace/sucursal scoping in lists and forms
type: feature
---

# Multi-tenant + nacionalidad/documento

## Schema
- `workspaces`: organización raíz. Owner + members.
- `workspace_members`: roles `owner | admin | member`. RLS via `is_workspace_admin`/`is_workspace_member`.
- `sucursales`: sedes hijas de workspace. Solo admins pueden crear/editar/eliminar.
- `pacientes.sucursal_id`, `personal_salud.sucursal_id`, `control_visitas.sucursal_id`, `registro_llamadas.sucursal_id`: opcional.
- Helper RLS: `is_member_of_sucursal(_user_id, _sucursal_id)`.

## Pacientes — nacionalidad y documento
- `nacionalidad` (default "Dominicana"), `tipo_documento` (cedula/pasaporte/id_extranjero/licencia), `numero_documento` (nullable), `cedula` (nullable).
- Para no-dominicanos: NO se llama JCE; campos manuales.
- Para dominicanos: JCE auto-rellena pero campos editables.

## UI
- `/organizaciones`: pestañas Sucursales, Miembros, Información.
- Selector de workspace en el header.
- `useSucursales()`: lista sucursales del workspace activo.
- `<SucursalSelect>` (`src/components/SucursalSelect.tsx`): selector reusable que se auto-oculta si el workspace no tiene sucursales y permite "sin asignar".

## Filtrado y asignación por workspace/sucursal
- `usePacientes`, `usePersonal` filtran por `workspace_id` del workspace activo.
- `Visitas.tsx`, `Llamadas.tsx` filtran fetch por `workspace_id` y refrescan al cambiar de organización.
- Formularios de creación/edición (NuevoPacienteForm, EditPacienteDialog, AgendarLlamadaDialog, Visitas) escriben `workspace_id` y `sucursal_id` en cada insert/update.
- Default de sucursal en inserts: si el usuario no eligió, se usa la sucursal `es_principal` del workspace (si existe).

## Reglas de negocio
- Una sucursal puede marcarse como `es_principal=true` (informativo + default en formularios).
- Eliminar sucursal hace SET NULL en pacientes/personal/visitas/llamadas.
- RLS de control_visitas/registro_llamadas todavía se basa en ownership clínico (no en workspace). El filtrado por workspace es client-side; reforzar a nivel BD es una fase pendiente.
