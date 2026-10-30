-- Auditoría de seguridad run-1 (P3): un admin podía degradar o eliminar al owner, o nombrar owners.
-- Solo el dueño del workspace (workspaces.owner_id) toca filas con rol owner.

CREATE OR REPLACE FUNCTION public.is_workspace_owner(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.workspaces WHERE id = _workspace_id AND owner_id = _user_id);
$$;

DROP POLICY IF EXISTS wm_insert_admin ON public.workspace_members;
CREATE POLICY wm_insert_admin ON public.workspace_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_workspace_owner(auth.uid(), workspace_id)
    OR (public.is_workspace_admin(auth.uid(), workspace_id) AND role <> 'owner')
  );

DROP POLICY IF EXISTS wm_update_admin ON public.workspace_members;
CREATE POLICY wm_update_admin ON public.workspace_members
  FOR UPDATE TO authenticated
  USING (
    public.is_workspace_owner(auth.uid(), workspace_id)
    OR (public.is_workspace_admin(auth.uid(), workspace_id) AND role <> 'owner')
  )
  WITH CHECK (
    public.is_workspace_owner(auth.uid(), workspace_id)
    OR (public.is_workspace_admin(auth.uid(), workspace_id) AND role <> 'owner')
  );

DROP POLICY IF EXISTS wm_delete_admin ON public.workspace_members;
CREATE POLICY wm_delete_admin ON public.workspace_members
  FOR DELETE TO authenticated
  USING (
    public.is_workspace_owner(auth.uid(), workspace_id)
    OR (public.is_workspace_admin(auth.uid(), workspace_id) AND role <> 'owner')
  );
