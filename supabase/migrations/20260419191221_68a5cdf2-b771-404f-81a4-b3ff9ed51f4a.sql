
-- ============================================================
-- Fase 2: Reforzar políticas RLS permisivas (WITH CHECK true)
-- ============================================================
-- Reemplaza políticas demasiado abiertas por reglas basadas en roles.
-- Lectura sigue permitida a usuarios autenticados; escritura/borrado
-- queda restringida a admin/coordinador (o reglas equivalentes).

-- 1) personal_salud: solo admin/coordinador pueden insertar/actualizar
DROP POLICY IF EXISTS "Authenticated users can insert personal" ON public.personal_salud;
DROP POLICY IF EXISTS "Authenticated users can update personal" ON public.personal_salud;

CREATE POLICY "Admins coord can insert personal"
ON public.personal_salud FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_coordinador(auth.uid()));

CREATE POLICY "Admins coord can update personal"
ON public.personal_salud FOR UPDATE TO authenticated
USING (public.is_admin_or_coordinador(auth.uid()));

-- 2) parametros_seguimiento: insert/update por admin/coordinador o staff del paciente
DROP POLICY IF EXISTS "Authenticated users can insert parametros" ON public.parametros_seguimiento;
DROP POLICY IF EXISTS "Authenticated users can update parametros" ON public.parametros_seguimiento;

CREATE POLICY "Staff can insert parametros"
ON public.parametros_seguimiento FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

CREATE POLICY "Staff can update parametros"
ON public.parametros_seguimiento FOR UPDATE TO authenticated
USING (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

-- 3) historial_recordatorios: insert/update solo autenticados con verificación mínima
DROP POLICY IF EXISTS "Authenticated users can insert historial_recordatorios" ON public.historial_recordatorios;
DROP POLICY IF EXISTS "Authenticated users can update historial_recordatorios" ON public.historial_recordatorios;

CREATE POLICY "Staff can insert historial_recordatorios"
ON public.historial_recordatorios FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins coord can update historial_recordatorios"
ON public.historial_recordatorios FOR UPDATE TO authenticated
USING (public.is_admin_or_coordinador(auth.uid()));

-- 4) excepciones_duplicados: insert/delete solo admin/coordinador
DROP POLICY IF EXISTS "Authenticated users can insert excepciones" ON public.excepciones_duplicados;
DROP POLICY IF EXISTS "Authenticated users can delete excepciones" ON public.excepciones_duplicados;

CREATE POLICY "Admins coord can insert excepciones"
ON public.excepciones_duplicados FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_coordinador(auth.uid()));

CREATE POLICY "Admins coord can delete excepciones"
ON public.excepciones_duplicados FOR DELETE TO authenticated
USING (public.is_admin_or_coordinador(auth.uid()));

-- 5) visitas_profesionales: insert/delete solo admin/coordinador
DROP POLICY IF EXISTS "Authenticated users can insert visitas_profesionales" ON public.visitas_profesionales;
DROP POLICY IF EXISTS "Authenticated users can delete visitas_profesionales" ON public.visitas_profesionales;

CREATE POLICY "Admins coord can insert visitas_profesionales"
ON public.visitas_profesionales FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_coordinador(auth.uid()));

CREATE POLICY "Admins coord can delete visitas_profesionales"
ON public.visitas_profesionales FOR DELETE TO authenticated
USING (public.is_admin_or_coordinador(auth.uid()));

-- 6) auditoria_cambios: insert sigue siendo permitido a sistema (triggers SECURITY DEFINER)
--    pero limitamos a usuarios autenticados con auth.uid() válido.
DROP POLICY IF EXISTS "auditoria_insert_system" ON public.auditoria_cambios;

CREATE POLICY "auditoria_insert_authenticated"
ON public.auditoria_cambios FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 7) auditoria_unificaciones: solo admin/coordinador pueden registrar
DROP POLICY IF EXISTS "Authenticated users can insert audit log" ON public.auditoria_unificaciones;

CREATE POLICY "Admins coord can insert audit log"
ON public.auditoria_unificaciones FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_coordinador(auth.uid()));

-- 8) control_visitas: insert con verificación de propiedad
DROP POLICY IF EXISTS "visitas_insert_authenticated" ON public.control_visitas;

CREATE POLICY "visitas_insert_ownership"
ON public.control_visitas FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_profesional(auth.uid(), profesional_id)
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

-- 9) registro_llamadas: insert con verificación de propiedad
DROP POLICY IF EXISTS "llamadas_insert_authenticated" ON public.registro_llamadas;

CREATE POLICY "llamadas_insert_ownership"
ON public.registro_llamadas FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_profesional(auth.uid(), profesional_id)
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);

-- 10) pacientes: insert con verificación mínima (staff autenticado)
DROP POLICY IF EXISTS "pacientes_insert_authenticated" ON public.pacientes;

CREATE POLICY "pacientes_insert_authenticated_strict"
ON public.pacientes FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 11) notificaciones_plan_accion: insert también restringido a staff
DROP POLICY IF EXISTS "notif_plan_insert_authenticated" ON public.notificaciones_plan_accion;

CREATE POLICY "notif_plan_insert_ownership"
ON public.notificaciones_plan_accion FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin_or_coordinador(auth.uid())
  OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id)
);
