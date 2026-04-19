-- Permisos por defecto para el rol 'recepcion'
INSERT INTO public.module_permissions (role, module_name, can_view, can_create, can_edit, can_delete) VALUES
  ('recepcion'::app_role, 'dashboard',          true,  false, false, false),
  ('recepcion'::app_role, 'pacientes',          true,  true,  true,  false),
  ('recepcion'::app_role, 'llamadas',           true,  true,  true,  false),
  ('recepcion'::app_role, 'visitas',            true,  true,  true,  false),
  ('recepcion'::app_role, 'calendario',         true,  true,  true,  false),
  ('recepcion'::app_role, 'recepcion',          true,  true,  true,  false),
  ('recepcion'::app_role, 'atencion_paciente',  true,  false, false, false),
  ('recepcion'::app_role, 'personal',           false, false, false, false),
  ('recepcion'::app_role, 'reportes',           false, false, false, false),
  ('recepcion'::app_role, 'encuestas',          false, false, false, false),
  ('recepcion'::app_role, 'automatizaciones',   false, false, false, false),
  ('recepcion'::app_role, 'plantillas_correo',  false, false, false, false),
  ('recepcion'::app_role, 'configuracion',      true,  false, true,  false),
  ('recepcion'::app_role, 'configuracion_admin',false, false, false, false)
ON CONFLICT DO NOTHING;