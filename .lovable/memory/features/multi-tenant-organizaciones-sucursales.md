---
name: Multi-tenant Organizations and Branches
description: Workspaces, branches (sucursales), member roles, and patient nationality/document support
type: feature
---

# Multi-tenant + nacionalidad/documento

## Schema
- `workspaces` (existente): organización raíz. Owner + members.
- `workspace_members`: roles `owner | admin | member`. RLS via `is_workspace_admin`/`is_workspace_member`.
- `sucursales` (nuevo): sedes hijas de workspace. Solo admins de workspace pueden crear/editar/eliminar.
- `pacientes.sucursal_id`, `personal_salud.sucursal_id`, `control_visitas.sucursal_id`, `registro_llamadas.sucursal_id`: asignación opcional.
- Helper RLS: `is_member_of_sucursal(_user_id, _sucursal_id)`.

## Pacientes — nacionalidad y documento
- `pacientes.nacionalidad` (text, default `Dominicana`).
- `pacientes.tipo_documento` (text, default `cedula`): `cedula | pasaporte | id_extranjero | licencia`.
- `pacientes.numero_documento` (text, nullable): número del documento si NO es cédula.
- `pacientes.cedula` ahora es nullable: solo aplica si nacionalidad = "Dominicana".
- Para no-dominicanos: NO se llama JCE; nombre/apellido/sexo/fecha_nacimiento se editan a mano.
- Para dominicanos: JCE auto-rellena pero todos los campos siguen siendo editables (no read-only forzado).

## UI
- `/organizaciones`: pestañas Sucursales, Miembros, Información.
- Selector de workspace en el header.
- Solo `owner`/`admin` ven botones de crear/editar/eliminar/invitar.
- `useSucursales()`: hook que lista sucursales del workspace activo.

## Reglas de negocio
- Una sucursal puede marcarse como `es_principal=true` (informativo, sin lógica forzada).
- Eliminar sucursal hace SET NULL en pacientes/personal/visitas/llamadas (no borra esos registros).
