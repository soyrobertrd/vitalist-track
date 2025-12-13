-- Drop existing restrictive SELECT policies on pacientes
DROP POLICY IF EXISTS "Admins can view all pacientes" ON public.pacientes;
DROP POLICY IF EXISTS "Profesionales pueden ver pacientes asignados" ON public.pacientes;

-- Create a single PERMISSIVE SELECT policy that allows:
-- 1. Admins to view all patients
-- 2. Coordinadores and admin_centro to view all patients
-- 3. Professionals to view their assigned patients
CREATE POLICY "Users can view pacientes based on role"
ON public.pacientes
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'coordinador'::app_role)
  OR EXISTS (
    SELECT 1 FROM profiles pr
    WHERE pr.id = auth.uid() 
    AND pr.rol IN ('admin', 'admin_centro', 'coordinador')
  )
  OR EXISTS (
    SELECT 1 FROM personal_salud ps
    WHERE ps.user_id = auth.uid() 
    AND ps.id = pacientes.profesional_asignado_id
  )
);