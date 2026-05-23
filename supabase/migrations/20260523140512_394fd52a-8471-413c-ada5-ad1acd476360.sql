DROP POLICY IF EXISTS "Authenticated users can view respuestas" ON public.respuestas_encuestas;

CREATE POLICY "Staff can view respuestas"
ON public.respuestas_encuestas
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'coordinador'::app_role)
);