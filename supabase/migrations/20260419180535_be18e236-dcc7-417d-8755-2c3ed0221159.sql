-- =========================================================
-- 1. FUNCIÓN AUXILIAR: ¿el usuario es el profesional del paciente?
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_staff_clinico_de_paciente(_user_id uuid, _paciente_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pacientes p
    JOIN public.personal_salud ps ON ps.id = p.profesional_asignado_id
    WHERE p.id = _paciente_id AND ps.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff_clinico_de_profesional(_user_id uuid, _profesional_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.personal_salud ps
    WHERE ps.id = _profesional_id AND ps.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_coordinador(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin'::app_role)
    OR public.has_role(_user_id, 'coordinador'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = _user_id
        AND pr.rol = ANY (ARRAY['admin'::user_role, 'admin_centro'::user_role, 'coordinador'::user_role])
    );
$$;

-- =========================================================
-- 2. PACIENTES: ownership por profesional_asignado_id
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can insert pacientes" ON public.pacientes;
DROP POLICY IF EXISTS "Authenticated users can update pacientes" ON public.pacientes;
DROP POLICY IF EXISTS "Users can view pacientes based on role" ON public.pacientes;
DROP POLICY IF EXISTS "Admins can delete pacientes" ON public.pacientes;

CREATE POLICY "pacientes_select_ownership"
ON public.pacientes FOR SELECT
TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.personal_salud ps
    WHERE ps.user_id = auth.uid() AND ps.id = pacientes.profesional_asignado_id
  )
);

CREATE POLICY "pacientes_insert_authenticated"
ON public.pacientes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "pacientes_update_ownership"
ON public.pacientes FOR UPDATE
TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.personal_salud ps
    WHERE ps.user_id = auth.uid() AND ps.id = pacientes.profesional_asignado_id
  )
);

CREATE POLICY "pacientes_delete_admin"
ON public.pacientes FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =========================================================
-- 3. CONTROL_VISITAS: ownership por profesional_id o paciente asignado
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can insert visitas" ON public.control_visitas;
DROP POLICY IF EXISTS "Authenticated users can update visitas" ON public.control_visitas;
DROP POLICY IF EXISTS "Authenticated users can view visitas" ON public.control_visitas;
DROP POLICY IF EXISTS "Profesionales pueden actualizar visitas asignadas" ON public.control_visitas;
DROP POLICY IF EXISTS "Profesionales pueden insertar visitas" ON public.control_visitas;
DROP POLICY IF EXISTS "Profesionales pueden ver visitas relevantes" ON public.control_visitas;

CREATE POLICY "visitas_select_ownership"
ON public.control_visitas FOR SELECT
TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_profesional(auth.uid(), profesional_id)
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

CREATE POLICY "visitas_insert_authenticated"
ON public.control_visitas FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "visitas_update_ownership"
ON public.control_visitas FOR UPDATE
TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_profesional(auth.uid(), profesional_id)
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

-- =========================================================
-- 4. REGISTRO_LLAMADAS: ownership por profesional_id o paciente asignado
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can insert llamadas" ON public.registro_llamadas;
DROP POLICY IF EXISTS "Authenticated users can update llamadas" ON public.registro_llamadas;
DROP POLICY IF EXISTS "Authenticated users can view llamadas" ON public.registro_llamadas;
DROP POLICY IF EXISTS "Profesionales pueden actualizar llamadas asignadas" ON public.registro_llamadas;
DROP POLICY IF EXISTS "Profesionales pueden insertar llamadas" ON public.registro_llamadas;
DROP POLICY IF EXISTS "Profesionales pueden ver llamadas relevantes" ON public.registro_llamadas;

CREATE POLICY "llamadas_select_ownership"
ON public.registro_llamadas FOR SELECT
TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_profesional(auth.uid(), profesional_id)
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

CREATE POLICY "llamadas_insert_authenticated"
ON public.registro_llamadas FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "llamadas_update_ownership"
ON public.registro_llamadas FOR UPDATE
TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_profesional(auth.uid(), profesional_id)
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

-- =========================================================
-- 5. ATENCION_PACIENTE: limitar a ownership
-- =========================================================
DROP POLICY IF EXISTS "Admins can view all atencion" ON public.atencion_paciente;
DROP POLICY IF EXISTS "Profesionales pueden gestionar atención de pacientes asignados" ON public.atencion_paciente;
DROP POLICY IF EXISTS "Professionals can view their atencion records" ON public.atencion_paciente;

CREATE POLICY "atencion_select_ownership"
ON public.atencion_paciente FOR SELECT
TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_profesional(auth.uid(), profesional_id)
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

CREATE POLICY "atencion_insert_ownership"
ON public.atencion_paciente FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_profesional(auth.uid(), profesional_id)
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

CREATE POLICY "atencion_update_ownership"
ON public.atencion_paciente FOR UPDATE
TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_profesional(auth.uid(), profesional_id)
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

CREATE POLICY "atencion_delete_admin"
ON public.atencion_paciente FOR DELETE
TO authenticated
USING (public.is_admin_or_coordinador(auth.uid()));

-- =========================================================
-- 6. MEDICAMENTOS_PACIENTE: limitar a ownership
-- =========================================================
DROP POLICY IF EXISTS "Admins can view all medicamentos" ON public.medicamentos_paciente;
DROP POLICY IF EXISTS "Profesionales pueden gestionar medicamentos de pacientes asigna" ON public.medicamentos_paciente;
DROP POLICY IF EXISTS "Professionals can view medicamentos of assigned patients" ON public.medicamentos_paciente;

CREATE POLICY "medicamentos_select_ownership"
ON public.medicamentos_paciente FOR SELECT
TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

CREATE POLICY "medicamentos_insert_ownership"
ON public.medicamentos_paciente FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

CREATE POLICY "medicamentos_update_ownership"
ON public.medicamentos_paciente FOR UPDATE
TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

CREATE POLICY "medicamentos_delete_ownership"
ON public.medicamentos_paciente FOR DELETE
TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

-- =========================================================
-- 7. NOTIFICACIONES_PLAN_ACCION: limitar a ownership del paciente
-- =========================================================
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notificaciones_plan_accion;
DROP POLICY IF EXISTS "Users can update notifications" ON public.notificaciones_plan_accion;
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notificaciones_plan_accion;

CREATE POLICY "notif_plan_select_ownership"
ON public.notificaciones_plan_accion FOR SELECT
TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

CREATE POLICY "notif_plan_insert_authenticated"
ON public.notificaciones_plan_accion FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "notif_plan_update_ownership"
ON public.notificaciones_plan_accion FOR UPDATE
TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

-- =========================================================
-- 8. AUDITORÍA DE CAMBIOS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.auditoria_cambios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla text NOT NULL,
  registro_id uuid,
  accion text NOT NULL,
  usuario_id uuid,
  datos_anteriores jsonb,
  datos_nuevos jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_tabla_fecha ON public.auditoria_cambios (tabla, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON public.auditoria_cambios (usuario_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_registro ON public.auditoria_cambios (registro_id);

ALTER TABLE public.auditoria_cambios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auditoria_select_admin"
ON public.auditoria_cambios FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "auditoria_insert_system"
ON public.auditoria_cambios FOR INSERT
TO authenticated
WITH CHECK (true);

-- Función trigger genérica
CREATE OR REPLACE FUNCTION public.registrar_cambio_auditoria()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_registro_id uuid;
  v_old jsonb;
  v_new jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_registro_id := (row_to_json(OLD)::jsonb ->> 'id')::uuid;
    v_old := row_to_json(OLD)::jsonb;
    v_new := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_registro_id := (row_to_json(NEW)::jsonb ->> 'id')::uuid;
    v_old := NULL;
    v_new := row_to_json(NEW)::jsonb;
  ELSE
    v_registro_id := (row_to_json(NEW)::jsonb ->> 'id')::uuid;
    v_old := row_to_json(OLD)::jsonb;
    v_new := row_to_json(NEW)::jsonb;
  END IF;

  INSERT INTO public.auditoria_cambios (
    tabla, registro_id, accion, usuario_id, datos_anteriores, datos_nuevos
  ) VALUES (
    TG_TABLE_NAME, v_registro_id, TG_OP, auth.uid(), v_old, v_new
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Triggers en tablas críticas
DROP TRIGGER IF EXISTS audit_pacientes ON public.pacientes;
CREATE TRIGGER audit_pacientes
  AFTER INSERT OR UPDATE OR DELETE ON public.pacientes
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

DROP TRIGGER IF EXISTS audit_visitas ON public.control_visitas;
CREATE TRIGGER audit_visitas
  AFTER INSERT OR UPDATE OR DELETE ON public.control_visitas
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

DROP TRIGGER IF EXISTS audit_llamadas ON public.registro_llamadas;
CREATE TRIGGER audit_llamadas
  AFTER INSERT OR UPDATE OR DELETE ON public.registro_llamadas
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

DROP TRIGGER IF EXISTS audit_personal_salud ON public.personal_salud;
CREATE TRIGGER audit_personal_salud
  AFTER INSERT OR UPDATE OR DELETE ON public.personal_salud
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

DROP TRIGGER IF EXISTS audit_medicamentos ON public.medicamentos_paciente;
CREATE TRIGGER audit_medicamentos
  AFTER INSERT OR UPDATE OR DELETE ON public.medicamentos_paciente
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

DROP TRIGGER IF EXISTS audit_atencion ON public.atencion_paciente;
CREATE TRIGGER audit_atencion
  AFTER INSERT OR UPDATE OR DELETE ON public.atencion_paciente
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();