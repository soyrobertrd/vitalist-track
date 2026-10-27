-- Corrige 20261026000000 (S11) y 20261026000001 (S4).

-- S11: cita_tokens solo se usa desde edge functions con service role (que salta RLS).
-- Las políticas públicas permitían a cualquiera listar tokens y reescribir hash/cita_id.
DROP POLICY IF EXISTS "Permitir consultar token por hash" ON public.cita_tokens;
DROP POLICY IF EXISTS "Permitir marcar token usado" ON public.cita_tokens;
REVOKE ALL ON public.cita_tokens FROM anon, authenticated;

-- S4: las políticas SELECT son permisivas (se suman con OR); "Admins can view all profiles"
-- seguía dejando a un admin global ver perfiles de todos los centros. Se eliminan todas y queda una sola.
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Users can view members of same workspace" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm1
      JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid() AND wm2.user_id = public.profiles.id
    )
  );
