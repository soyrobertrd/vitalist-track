-- Allow public (anonymous) visitors to read active plans for the landing page
CREATE POLICY "planes_select_public_active"
ON public.planes
FOR SELECT
TO anon
USING (activo = true);