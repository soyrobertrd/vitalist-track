-- Workspace invitations system
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.workspace_member_role NOT NULL DEFAULT 'member',
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(24), 'hex'),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  estado text NOT NULL DEFAULT 'pendiente', -- pendiente | aceptada | revocada | expirada
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ws_invites_workspace ON public.workspace_invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ws_invites_email ON public.workspace_invitations(lower(email));
CREATE INDEX IF NOT EXISTS idx_ws_invites_token ON public.workspace_invitations(token);

ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

-- Admins/owners del workspace gestionan invitaciones
CREATE POLICY ws_inv_admin_all ON public.workspace_invitations
  FOR ALL TO authenticated
  USING (public.is_workspace_admin(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));

-- Cualquier usuario autenticado puede ver invitaciones dirigidas a su email (para aceptar)
CREATE POLICY ws_inv_invitee_select ON public.workspace_invitations
  FOR SELECT TO authenticated
  USING (
    lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
    AND estado = 'pendiente'
    AND expires_at > now()
  );

-- Trigger updated_at
CREATE TRIGGER ws_inv_updated_at
  BEFORE UPDATE ON public.workspace_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Función para aceptar invitación (security definer porque inserta en workspace_members)
CREATE OR REPLACE FUNCTION public.accept_workspace_invitation(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation public.workspace_invitations;
  v_user_email text;
BEGIN
  -- Verificar usuario autenticado
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();

  -- Buscar invitación válida
  SELECT * INTO v_invitation
  FROM public.workspace_invitations
  WHERE token = _token
    AND estado = 'pendiente'
    AND expires_at > now()
  LIMIT 1;

  IF v_invitation.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitación inválida o expirada');
  END IF;

  -- Verificar que el email coincida
  IF lower(v_invitation.email) <> lower(v_user_email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Esta invitación es para otro email');
  END IF;

  -- Verificar que no sea ya miembro
  IF EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = v_invitation.workspace_id AND user_id = auth.uid()) THEN
    -- Marcar como aceptada de todos modos
    UPDATE public.workspace_invitations
    SET estado = 'aceptada', accepted_at = now(), accepted_by = auth.uid()
    WHERE id = v_invitation.id;
    RETURN jsonb_build_object('success', true, 'workspace_id', v_invitation.workspace_id, 'already_member', true);
  END IF;

  -- Insertar membresía
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_invitation.workspace_id, auth.uid(), v_invitation.role);

  -- Marcar invitación como aceptada
  UPDATE public.workspace_invitations
  SET estado = 'aceptada', accepted_at = now(), accepted_by = auth.uid()
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object('success', true, 'workspace_id', v_invitation.workspace_id);
END;
$$;

-- Función auxiliar para obtener detalle público de invitación (sin login)
CREATE OR REPLACE FUNCTION public.get_invitation_details(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.workspace_invitations;
  v_ws_name text;
BEGIN
  SELECT * INTO v_inv FROM public.workspace_invitations
  WHERE token = _token LIMIT 1;

  IF v_inv.id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invitación no encontrada');
  END IF;

  IF v_inv.estado <> 'pendiente' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invitación ya ' || v_inv.estado);
  END IF;

  IF v_inv.expires_at <= now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invitación expirada');
  END IF;

  SELECT nombre INTO v_ws_name FROM public.workspaces WHERE id = v_inv.workspace_id;

  RETURN jsonb_build_object(
    'valid', true,
    'email', v_inv.email,
    'role', v_inv.role,
    'workspace_name', v_ws_name,
    'expires_at', v_inv.expires_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_details(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_workspace_invitation(text) TO authenticated;