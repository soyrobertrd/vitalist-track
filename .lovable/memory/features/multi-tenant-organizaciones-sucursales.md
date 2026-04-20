---
name: Multi-tenant Organizations and Branches
description: Workspaces, branches (sucursales), member roles, patient nationality/document, branch selector in forms, global branch filter for lists/dashboard/reports, auto-workspace on signup, strict workspace RLS
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
- Selector de workspace en el sidebar (`<WorkspaceSwitcher>`).
- `useSucursales()`: lista sucursales del workspace activo.
- `<SucursalSelect>` (`src/components/SucursalSelect.tsx`): selector reusable para formularios; se auto-oculta si el workspace no tiene sucursales y permite "sin asignar".
- `<SucursalSwitcher>` (`src/components/SucursalSwitcher.tsx`): selector global en el header para filtrar listados/reportes por sucursal. Se oculta si no hay sucursales. "Todas las sucursales" = sin filtro.

## Estado global de sucursal activa
- `ActiveSucursalProvider` (`src/contexts/ActiveSucursalContext.tsx`) envuelto dentro de `WorkspaceProvider` en `App.tsx`.
- `useActiveSucursal()` expone `{ activeSucursalId, setActiveSucursalId, hasSucursales }`.
- Persistencia en `localStorage` por workspace (`activeSucursalId:<wsId>`). Se limpia al cambiar de workspace o si la sucursal guardada ya no existe.

## Filtrado y asignación por workspace/sucursal
- `usePacientes`, `usePersonal` filtran por `workspace_id` del workspace activo + `sucursal_id` activo.
- `Visitas.tsx`, `Llamadas.tsx`, `Calendario.tsx` (CalendarView) filtran fetch por `workspace_id` y `sucursal_id`. Los `useEffect` agregan `activeSucursalId` como dependencia para refrescar al cambiar.
- `Dashboard.tsx` y `Reportes.tsx` aplican el mismo scope (workspace + sucursal) a todas sus consultas para que KPIs, gráficos y exportes reflejen la sucursal seleccionada.
- Formularios de creación/edición (NuevoPacienteForm, EditPacienteDialog, AgendarLlamadaDialog, Visitas) escriben `workspace_id` y `sucursal_id` en cada insert/update.
- Default de sucursal en inserts: si el usuario no eligió, se usa la sucursal `es_principal` del workspace (si existe).

## Auto-workspace en signup (Fase 3)
- Trigger `on_auth_user_created_workspace` en `auth.users` ejecuta `handle_new_user_workspace()` que:
  - Crea automáticamente un workspace "Mi Clínica" (o nombre del metadata) y agrega al usuario como `owner` en `workspace_members`.
  - Se omite si el usuario fue creado por un admin (`raw_user_meta_data.created_by_admin = true`) o si ya tiene workspace.
- Garantiza que ningún usuario quede huérfano sin organización al hacer signup público.

## RLS estricto por workspace (Fase 4 — defensa en profundidad)
Las políticas SELECT/INSERT/UPDATE de `pacientes`, `personal_salud`, `control_visitas`, `registro_llamadas` ahora exigen además:
`(workspace_id IS NULL OR is_workspace_member(auth.uid(), workspace_id))`
- Permite legacy rows (workspace_id NULL) por compatibilidad.
- Para rows con workspace, el usuario DEBE ser miembro del workspace además de cumplir las reglas clínicas previas (admin/coordinador, profesional asignado, etc.).
- Esto previene que un cliente malicioso vea/modifique datos de otra organización aunque se salte el filtro client-side.

## Reglas de negocio
- Una sucursal puede marcarse como `es_principal=true` (informativo + default en formularios).
- Eliminar sucursal hace SET NULL en pacientes/personal/visitas/llamadas.

## Pendiente
- Backfill ya completado (0 registros sin workspace_id al momento de Fase 4).
- Filtrado por sucursal en BD (RLS) — actualmente solo client-side. Refuerzo opcional para futuras fases.
