-- Restringir permisos de 'recepcion': solo Recepción + Calendario (vista completa)
UPDATE public.module_permissions
SET can_view = false, can_create = false, can_edit = false, can_delete = false, updated_at = now()
WHERE role = 'recepcion'::app_role
  AND module_name NOT IN ('recepcion', 'calendario');

-- Recepción: acceso total funcional (sin borrar)
UPDATE public.module_permissions
SET can_view = true, can_create = true, can_edit = true, can_delete = false, updated_at = now()
WHERE role = 'recepcion'::app_role AND module_name = 'recepcion';

-- Calendario: ver agenda completa de todos los profesionales (solo lectura)
UPDATE public.module_permissions
SET can_view = true, can_create = false, can_edit = false, can_delete = false, updated_at = now()
WHERE role = 'recepcion'::app_role AND module_name = 'calendario';