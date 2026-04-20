-- =========================================================
-- FASE 3: Auto-crear workspace para nuevos usuarios
-- =========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id uuid;
  v_nombre text;
BEGIN
  -- Skip if user was created by an admin (admin will assign workspace manually)
  IF COALESCE((NEW.raw_user_meta_data->>'created_by_admin')::boolean, false) THEN
    RETURN NEW;
  END IF;

  -- Skip if user already has a workspace (defensive)
  IF EXISTS (SELECT 1 FROM public.workspace_members WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  v_nombre := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'workspace_nombre'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'nombre'), '') || ' workspace',
    'Mi Clínica'
  );

  INSERT INTO public.workspaces (nombre, owner_user_id)
  VALUES (v_nombre, NEW.id)
  RETURNING id INTO v_workspace_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_workspace ON auth.users;
CREATE TRIGGER on_auth_user_created_workspace
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_workspace();

-- =========================================================
-- FASE 4: RLS estricto por workspace (defensa en profundidad)
-- Mantener compatibilidad con registros legacy (workspace_id NULL)
-- =========================================================

-- PACIENTES
DROP POLICY IF EXISTS pacientes_select_ownership ON public.pacientes;
CREATE POLICY pacientes_select_ownership ON public.pacientes
FOR SELECT TO authenticated
USING (
  (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
  AND (
    public.is_admin_or_coordinador(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.personal_salud ps
      WHERE ps.user_id = auth.uid() AND ps.id = pacientes.profesional_asignado_id
    )
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  )
);

DROP POLICY IF EXISTS pacientes_update_ownership ON public.pacientes;
CREATE POLICY pacientes_update_ownership ON public.pacientes
FOR UPDATE TO authenticated
USING (
  (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
  AND (
    public.is_admin_or_coordinador(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.personal_salud ps
      WHERE ps.user_id = auth.uid() AND ps.id = pacientes.profesional_asignado_id
    )
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  )
);

DROP POLICY IF EXISTS pacientes_insert_authenticated_strict ON public.pacientes;
CREATE POLICY pacientes_insert_workspace ON public.pacientes
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

-- PERSONAL_SALUD
DROP POLICY IF EXISTS personal_select_authenticated ON public.personal_salud;
DROP POLICY IF EXISTS personal_select ON public.personal_salud;
CREATE POLICY personal_select_workspace ON public.personal_salud
FOR SELECT TO authenticated
USING (
  workspace_id IS NULL
  OR public.is_workspace_member(auth.uid(), workspace_id)
  OR public.is_admin_or_coordinador(auth.uid())
);

DROP POLICY IF EXISTS personal_insert ON public.personal_salud;
CREATE POLICY personal_insert_workspace ON public.personal_salud
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

DROP POLICY IF EXISTS personal_update ON public.personal_salud;
CREATE POLICY personal_update_workspace ON public.personal_salud
FOR UPDATE TO authenticated
USING (
  (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
  AND (public.is_admin_or_coordinador(auth.uid()) OR user_id = auth.uid())
);

-- CONTROL_VISITAS — añadir capa workspace a las políticas existentes
DROP POLICY IF EXISTS visitas_select_ownership ON public.control_visitas;
CREATE POLICY visitas_select_ownership ON public.control_visitas
FOR SELECT TO authenticated
USING (
  (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
  AND (
    public.is_admin_or_coordinador(auth.uid())
    OR public.is_staff_clinico_de_profesional(auth.uid(), profesional_id)
    OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  )
);

DROP POLICY IF EXISTS visitas_insert_ownership ON public.control_visitas;
CREATE POLICY visitas_insert_ownership ON public.control_visitas
FOR INSERT TO authenticated
WITH CHECK (
  (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
  AND (
    public.is_admin_or_coordinador(auth.uid())
    OR public.is_staff_clinico_de_profesional(auth.uid(), profesional_id)
    OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  )
);

DROP POLICY IF EXISTS visitas_update_ownership ON public.control_visitas;
CREATE POLICY visitas_update_ownership ON public.control_visitas
FOR UPDATE TO authenticated
USING (
  (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
  AND (
    public.is_admin_or_coordinador(auth.uid())
    OR public.is_staff_clinico_de_profesional(auth.uid(), profesional_id)
    OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  )
);

-- REGISTRO_LLAMADAS
DROP POLICY IF EXISTS llamadas_select_ownership ON public.registro_llamadas;
CREATE POLICY llamadas_select_ownership ON public.registro_llamadas
FOR SELECT TO authenticated
USING (
  (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
  AND (
    public.is_admin_or_coordinador(auth.uid())
    OR public.is_staff_clinico_de_profesional(auth.uid(), profesional_id)
    OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  )
);

DROP POLICY IF EXISTS llamadas_insert_ownership ON public.registro_llamadas;
CREATE POLICY llamadas_insert_ownership ON public.registro_llamadas
FOR INSERT TO authenticated
WITH CHECK (
  (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
  AND (
    public.is_admin_or_coordinador(auth.uid())
    OR public.is_staff_clinico_de_profesional(auth.uid(), profesional_id)
    OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  )
);

DROP POLICY IF EXISTS llamadas_update_ownership ON public.registro_llamadas;
CREATE POLICY llamadas_update_ownership ON public.registro_llamadas
FOR UPDATE TO authenticated
USING (
  (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
  AND (
    public.is_admin_or_coordinador(auth.uid())
    OR public.is_staff_clinico_de_profesional(auth.uid(), profesional_id)
    OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  )
);

-- CITA_TICKETS — ya filtra por workspace, dejamos como está
-- (la política existente ya considera workspace_id)