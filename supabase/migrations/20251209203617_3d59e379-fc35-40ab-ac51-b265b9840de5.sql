-- Mejorar políticas RLS para datos sensibles

-- ============================================
-- PACIENTES - Restringir acceso
-- ============================================

-- Eliminar políticas existentes demasiado permisivas
DROP POLICY IF EXISTS "Allow profile users to view patients" ON public.pacientes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver pacientes" ON public.pacientes;

-- Crear políticas más restrictivas
CREATE POLICY "Profesionales pueden ver pacientes asignados"
ON public.pacientes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND (
      p.rol IN ('admin', 'admin_centro', 'coordinador')
      OR EXISTS (
        SELECT 1 FROM public.personal_salud ps 
        WHERE ps.user_id = auth.uid() 
        AND ps.id = pacientes.profesional_asignado_id
      )
    )
  )
);

-- ============================================
-- MEDICAMENTOS_PACIENTE - Restringir acceso
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can insert medicamentos" ON public.medicamentos_paciente;
DROP POLICY IF EXISTS "Authenticated users can update medicamentos" ON public.medicamentos_paciente;
DROP POLICY IF EXISTS "Authenticated users can delete medicamentos" ON public.medicamentos_paciente;

-- Profesionales solo pueden modificar medicamentos de pacientes asignados
CREATE POLICY "Profesionales pueden gestionar medicamentos de pacientes asignados"
ON public.medicamentos_paciente
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.pacientes p
    JOIN public.personal_salud ps ON ps.id = p.profesional_asignado_id
    WHERE p.id = medicamentos_paciente.paciente_id
    AND ps.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = auth.uid() AND pr.rol IN ('admin', 'admin_centro', 'coordinador')
  )
);

-- ============================================
-- REGISTRO_LLAMADAS - Restringir acceso
-- ============================================

DROP POLICY IF EXISTS "Usuarios autenticados pueden ver llamadas" ON public.registro_llamadas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar llamadas" ON public.registro_llamadas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar llamadas" ON public.registro_llamadas;

-- Profesionales solo pueden ver/gestionar llamadas asignadas o de pacientes asignados
CREATE POLICY "Profesionales pueden ver llamadas relevantes"
ON public.registro_llamadas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.personal_salud ps
    WHERE ps.user_id = auth.uid()
    AND (ps.id = registro_llamadas.profesional_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = auth.uid() AND pr.rol IN ('admin', 'admin_centro', 'coordinador')
  )
);

CREATE POLICY "Profesionales pueden insertar llamadas"
ON public.registro_llamadas
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = auth.uid()
  )
);

CREATE POLICY "Profesionales pueden actualizar llamadas asignadas"
ON public.registro_llamadas
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.personal_salud ps
    WHERE ps.user_id = auth.uid()
    AND ps.id = registro_llamadas.profesional_id
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = auth.uid() AND pr.rol IN ('admin', 'admin_centro', 'coordinador')
  )
);

-- ============================================
-- ATENCION_PACIENTE - Restringir acceso
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can insert atencion" ON public.atencion_paciente;
DROP POLICY IF EXISTS "Authenticated users can update atencion" ON public.atencion_paciente;

CREATE POLICY "Profesionales pueden gestionar atención de pacientes asignados"
ON public.atencion_paciente
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.personal_salud ps
    WHERE ps.user_id = auth.uid()
    AND ps.id = atencion_paciente.profesional_id
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = auth.uid() AND pr.rol IN ('admin', 'admin_centro', 'coordinador')
  )
);

-- ============================================
-- CONTROL_VISITAS - Restringir acceso
-- ============================================

DROP POLICY IF EXISTS "Usuarios autenticados pueden ver visitas" ON public.control_visitas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar visitas" ON public.control_visitas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar visitas" ON public.control_visitas;

CREATE POLICY "Profesionales pueden ver visitas relevantes"
ON public.control_visitas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.personal_salud ps
    WHERE ps.user_id = auth.uid()
    AND ps.id = control_visitas.profesional_id
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = auth.uid() AND pr.rol IN ('admin', 'admin_centro', 'coordinador')
  )
);

CREATE POLICY "Profesionales pueden insertar visitas"
ON public.control_visitas
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = auth.uid()
  )
);

CREATE POLICY "Profesionales pueden actualizar visitas asignadas"
ON public.control_visitas
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.personal_salud ps
    WHERE ps.user_id = auth.uid()
    AND ps.id = control_visitas.profesional_id
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = auth.uid() AND pr.rol IN ('admin', 'admin_centro', 'coordinador')
  )
);