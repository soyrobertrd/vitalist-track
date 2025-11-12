-- Add barrio field to pacientes table
ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS barrio TEXT;

-- Create module permissions table for granular access control
CREATE TABLE IF NOT EXISTS public.module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  module_name TEXT NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(role, module_name)
);

-- Enable RLS on module_permissions
ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their role permissions
CREATE POLICY "Users can view permissions for their role"
ON public.module_permissions
FOR SELECT
USING (
  role IN (
    SELECT ur.role 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid()
  )
);

-- Admins can manage all permissions
CREATE POLICY "Admins can manage all permissions"
ON public.module_permissions
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default permissions for admin role (full access)
INSERT INTO public.module_permissions (role, module_name, can_view, can_create, can_edit, can_delete) VALUES
  ('admin', 'dashboard', true, true, true, true),
  ('admin', 'pacientes', true, true, true, true),
  ('admin', 'llamadas', true, true, true, true),
  ('admin', 'visitas', true, true, true, true),
  ('admin', 'atencion_paciente', true, true, true, true),
  ('admin', 'personal', true, true, true, true),
  ('admin', 'reportes', true, true, true, true),
  ('admin', 'configuracion', true, true, true, true),
  ('admin', 'configuracion_admin', true, true, true, true),
  ('admin', 'automatizaciones', true, true, true, true),
  ('admin', 'plantillas_correo', true, true, true, true),
  ('admin', 'encuestas', true, true, true, true)
ON CONFLICT (role, module_name) DO NOTHING;

-- Insert default permissions for coordinador role (management access)
INSERT INTO public.module_permissions (role, module_name, can_view, can_create, can_edit, can_delete) VALUES
  ('coordinador', 'dashboard', true, false, false, false),
  ('coordinador', 'pacientes', true, true, true, false),
  ('coordinador', 'llamadas', true, true, true, false),
  ('coordinador', 'visitas', true, true, true, false),
  ('coordinador', 'atencion_paciente', true, true, true, false),
  ('coordinador', 'personal', true, false, false, false),
  ('coordinador', 'reportes', true, false, false, false)
ON CONFLICT (role, module_name) DO NOTHING;

-- Insert default permissions for medico role (clinical access)
INSERT INTO public.module_permissions (role, module_name, can_view, can_create, can_edit, can_delete) VALUES
  ('medico', 'dashboard', true, false, false, false),
  ('medico', 'pacientes', true, false, true, false),
  ('medico', 'llamadas', true, true, true, false),
  ('medico', 'visitas', true, true, true, false),
  ('medico', 'atencion_paciente', true, true, true, false)
ON CONFLICT (role, module_name) DO NOTHING;

-- Insert default permissions for enfermera role (nursing access)
INSERT INTO public.module_permissions (role, module_name, can_view, can_create, can_edit, can_delete) VALUES
  ('enfermera', 'dashboard', true, false, false, false),
  ('enfermera', 'pacientes', true, false, false, false),
  ('enfermera', 'llamadas', true, true, true, false),
  ('enfermera', 'visitas', true, true, true, false),
  ('enfermera', 'atencion_paciente', true, true, true, false)
ON CONFLICT (role, module_name) DO NOTHING;

-- Create function to get user module permissions
CREATE OR REPLACE FUNCTION public.get_user_module_permissions(_user_id UUID)
RETURNS TABLE (
  module_name TEXT,
  can_view BOOLEAN,
  can_create BOOLEAN,
  can_edit BOOLEAN,
  can_delete BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    mp.module_name,
    mp.can_view,
    mp.can_create,
    mp.can_edit,
    mp.can_delete
  FROM public.module_permissions mp
  WHERE mp.role IN (
    SELECT ur.role 
    FROM public.user_roles ur 
    WHERE ur.user_id = _user_id
  );
$$;