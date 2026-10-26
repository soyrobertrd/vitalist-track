-- Migración para S4: Aislamiento estricto de perfiles por workspace (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas permisivas si existieran
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view members of same workspace" ON public.profiles;

-- Permitir ver únicamente el propio perfil o el de compañeros que compartan al menos un workspace
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
