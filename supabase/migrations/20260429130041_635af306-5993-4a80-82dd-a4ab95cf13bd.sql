
-- ============================================================
-- 1. ESPECIALIDADES MÉDICAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.especialidades_medicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  nombre text NOT NULL,
  categoria text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.especialidades_medicas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "esp_select_all" ON public.especialidades_medicas FOR SELECT TO authenticated USING (true);
CREATE POLICY "esp_admin_all" ON public.especialidades_medicas FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.profesional_especialidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id uuid NOT NULL,
  especialidad_id uuid NOT NULL REFERENCES public.especialidades_medicas(id) ON DELETE CASCADE,
  es_principal boolean NOT NULL DEFAULT false,
  numero_exequatur text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profesional_id, especialidad_id)
);
ALTER TABLE public.profesional_especialidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prof_esp_select" ON public.profesional_especialidades FOR SELECT TO authenticated USING (true);
CREATE POLICY "prof_esp_modify" ON public.profesional_especialidades FOR ALL TO authenticated
  USING (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_profesional(auth.uid(), profesional_id))
  WITH CHECK (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_profesional(auth.uid(), profesional_id));

-- ============================================================
-- 2. ESTRUCTURA FÍSICA: edificio > piso > ala > consultorio
-- ============================================================
CREATE TABLE IF NOT EXISTS public.edificios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sucursal_id uuid NOT NULL,
  nombre text NOT NULL,
  codigo text,
  direccion text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.edificios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edificios_select" ON public.edificios FOR SELECT TO authenticated USING (is_member_of_sucursal(auth.uid(), sucursal_id));
CREATE POLICY "edificios_admin" ON public.edificios FOR ALL TO authenticated
  USING (is_member_of_sucursal(auth.uid(), sucursal_id) AND (has_role(auth.uid(),'admin'::app_role) OR is_admin_or_coordinador(auth.uid())))
  WITH CHECK (is_member_of_sucursal(auth.uid(), sucursal_id));

CREATE TABLE IF NOT EXISTS public.pisos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edificio_id uuid NOT NULL REFERENCES public.edificios(id) ON DELETE CASCADE,
  numero integer NOT NULL,
  nombre text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pisos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pisos_select" ON public.pisos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM edificios e WHERE e.id = pisos.edificio_id AND is_member_of_sucursal(auth.uid(), e.sucursal_id))
);
CREATE POLICY "pisos_admin" ON public.pisos FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM edificios e WHERE e.id = pisos.edificio_id AND is_member_of_sucursal(auth.uid(), e.sucursal_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM edificios e WHERE e.id = pisos.edificio_id AND is_member_of_sucursal(auth.uid(), e.sucursal_id))
);

CREATE TABLE IF NOT EXISTS public.alas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  piso_id uuid NOT NULL REFERENCES public.pisos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  codigo text,
  tipo text DEFAULT 'general', -- general, emergencia, uci, hospitalizacion, ambulatorio
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.alas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alas_select" ON public.alas FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM pisos p JOIN edificios e ON e.id=p.edificio_id WHERE p.id = alas.piso_id AND is_member_of_sucursal(auth.uid(), e.sucursal_id))
);
CREATE POLICY "alas_admin" ON public.alas FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM pisos p JOIN edificios e ON e.id=p.edificio_id WHERE p.id = alas.piso_id AND is_member_of_sucursal(auth.uid(), e.sucursal_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM pisos p JOIN edificios e ON e.id=p.edificio_id WHERE p.id = alas.piso_id AND is_member_of_sucursal(auth.uid(), e.sucursal_id))
);

CREATE TABLE IF NOT EXISTS public.consultorios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sucursal_id uuid NOT NULL,
  edificio_id uuid REFERENCES public.edificios(id) ON DELETE SET NULL,
  piso_id uuid REFERENCES public.pisos(id) ON DELETE SET NULL,
  ala_id uuid REFERENCES public.alas(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  codigo text,
  tipo text NOT NULL DEFAULT 'consulta', -- consulta, procedimiento, emergencia, uci, sala
  capacidad integer DEFAULT 1,
  equipamiento jsonb NOT NULL DEFAULT '{}',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.consultorios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consultorios_select" ON public.consultorios FOR SELECT TO authenticated USING (is_member_of_sucursal(auth.uid(), sucursal_id));
CREATE POLICY "consultorios_admin" ON public.consultorios FOR ALL TO authenticated
  USING (is_member_of_sucursal(auth.uid(), sucursal_id))
  WITH CHECK (is_member_of_sucursal(auth.uid(), sucursal_id));

-- Camas (para hospitalización / UCI / emergencia)
CREATE TABLE IF NOT EXISTS public.camas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultorio_id uuid REFERENCES public.consultorios(id) ON DELETE CASCADE,
  ala_id uuid REFERENCES public.alas(id) ON DELETE SET NULL,
  sucursal_id uuid NOT NULL,
  identificador text NOT NULL,
  tipo text NOT NULL DEFAULT 'general', -- general, uci, emergencia, pediatrica, aislamiento
  estado text NOT NULL DEFAULT 'disponible', -- disponible, ocupada, mantenimiento, reservada
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.camas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "camas_select" ON public.camas FOR SELECT TO authenticated USING (is_member_of_sucursal(auth.uid(), sucursal_id));
CREATE POLICY "camas_modify" ON public.camas FOR ALL TO authenticated
  USING (is_member_of_sucursal(auth.uid(), sucursal_id))
  WITH CHECK (is_member_of_sucursal(auth.uid(), sucursal_id));

-- Asignación profesional ↔ consultorio (turnos)
CREATE TABLE IF NOT EXISTS public.consultorio_asignaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultorio_id uuid NOT NULL REFERENCES public.consultorios(id) ON DELETE CASCADE,
  profesional_id uuid NOT NULL,
  dia_semana integer, -- 0..6 si recurrente; null = fecha específica
  fecha_especifica date,
  hora_inicio time NOT NULL,
  hora_fin time NOT NULL,
  vigente_desde date,
  vigente_hasta date,
  notas text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (dia_semana IS NOT NULL OR fecha_especifica IS NOT NULL)
);
ALTER TABLE public.consultorio_asignaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ca_select" ON public.consultorio_asignaciones FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM consultorios c WHERE c.id = consultorio_asignaciones.consultorio_id AND is_member_of_sucursal(auth.uid(), c.sucursal_id))
);
CREATE POLICY "ca_modify" ON public.consultorio_asignaciones FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM consultorios c WHERE c.id = consultorio_asignaciones.consultorio_id AND is_member_of_sucursal(auth.uid(), c.sucursal_id))
    AND (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_profesional(auth.uid(), profesional_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM consultorios c WHERE c.id = consultorio_asignaciones.consultorio_id AND is_member_of_sucursal(auth.uid(), c.sucursal_id))
);

-- ============================================================
-- 3. AFILIACIONES PROFESIONAL ↔ WORKSPACE (límites por plan)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.afiliaciones_profesional (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id uuid NOT NULL,
  user_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  tipo text NOT NULL DEFAULT 'centro', -- centro | independiente
  estado text NOT NULL DEFAULT 'activa', -- activa | suspendida | terminada
  fecha_inicio date NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin date,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, workspace_id)
);
ALTER TABLE public.afiliaciones_profesional ENABLE ROW LEVEL SECURITY;
CREATE POLICY "afil_select_self_or_admin" ON public.afiliaciones_profesional FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_workspace_admin(auth.uid(), workspace_id) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "afil_modify_admin" ON public.afiliaciones_profesional FOR ALL TO authenticated
  USING (is_workspace_admin(auth.uid(), workspace_id) OR has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (is_workspace_admin(auth.uid(), workspace_id) OR has_role(auth.uid(),'admin'::app_role));

-- Función helper: límite de centros del médico según plan
CREATE OR REPLACE FUNCTION public.limite_centros_profesional(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public
AS $$
DECLARE
  v_max int := 1;
  v_plan record;
BEGIN
  -- Toma el "mejor" plan entre los workspaces donde el user es owner
  SELECT p.codigo, p.caracteristicas INTO v_plan
  FROM workspaces w
  JOIN planes p ON p.codigo = w.plan_codigo
  WHERE w.owner_user_id = _user_id
  ORDER BY p.orden DESC
  LIMIT 1;

  IF v_plan.codigo IS NULL THEN
    RETURN 1; -- free por defecto
  END IF;

  -- Lee del JSON caracteristicas.max_centros si existe
  IF (v_plan.caracteristicas ? 'max_centros') THEN
    v_max := COALESCE((v_plan.caracteristicas->>'max_centros')::int, 1);
  ELSIF v_plan.codigo = 'free' THEN
    v_max := 1;
  ELSIF v_plan.codigo IN ('pro','premium','independiente') THEN
    v_max := 5;
  ELSE
    v_max := 1;
  END IF;

  RETURN v_max;
END;
$$;

-- Trigger que valida el límite al insertar/activar afiliación
CREATE OR REPLACE FUNCTION public.validar_limite_afiliaciones()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_max int;
  v_actuales int;
BEGIN
  IF NEW.estado <> 'activa' THEN RETURN NEW; END IF;
  v_max := public.limite_centros_profesional(NEW.user_id);
  SELECT COUNT(*) INTO v_actuales
  FROM public.afiliaciones_profesional
  WHERE user_id = NEW.user_id AND estado='activa' AND id <> COALESCE(NEW.id, gen_random_uuid());
  IF v_actuales >= v_max THEN
    RAISE EXCEPTION 'El plan permite máximo % centros activos (actuales: %)', v_max, v_actuales
      USING ERRCODE='check_violation';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_limite_afiliaciones ON public.afiliaciones_profesional;
CREATE TRIGGER trg_limite_afiliaciones BEFORE INSERT OR UPDATE ON public.afiliaciones_profesional
  FOR EACH ROW EXECUTE FUNCTION public.validar_limite_afiliaciones();

-- ============================================================
-- 4. ESCALAS CLÍNICAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.escalas_clinicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL,
  profesional_id uuid,
  visita_id uuid,
  admision_id uuid,
  tipo text NOT NULL, -- glasgow, barthel, braden, news2, eva_dolor, norton, sofa, apache_ii, morse
  puntaje numeric NOT NULL,
  interpretacion text, -- leve/moderado/severo
  detalles jsonb NOT NULL DEFAULT '{}', -- items individuales
  notas text,
  fecha_evaluacion timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.escalas_clinicas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "escalas_select" ON public.escalas_clinicas FOR SELECT TO authenticated
  USING (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id));
CREATE POLICY "escalas_insert" ON public.escalas_clinicas FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id));
CREATE POLICY "escalas_update" ON public.escalas_clinicas FOR UPDATE TO authenticated
  USING (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id));
CREATE POLICY "escalas_delete" ON public.escalas_clinicas FOR DELETE TO authenticated
  USING (is_admin_or_coordinador(auth.uid()));

-- ============================================================
-- 5. HOSPITALIZACIÓN: ADMISIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admisiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid,
  sucursal_id uuid,
  paciente_id uuid NOT NULL,
  cama_id uuid REFERENCES public.camas(id) ON DELETE SET NULL,
  ala_id uuid REFERENCES public.alas(id) ON DELETE SET NULL,
  tipo text NOT NULL DEFAULT 'hospitalizacion', -- hospitalizacion, emergencia, uci, observacion
  motivo_ingreso text NOT NULL,
  diagnostico_ingreso text,
  medico_responsable_id uuid,
  fecha_ingreso timestamptz NOT NULL DEFAULT now(),
  fecha_alta timestamptz,
  tipo_alta text, -- medica, voluntaria, traslado, fallecimiento
  notas_alta text,
  estado text NOT NULL DEFAULT 'activa', -- activa, alta, traslado
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admisiones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "adm_select" ON public.admisiones FOR SELECT TO authenticated
  USING (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id) OR (workspace_id IS NOT NULL AND is_workspace_member(auth.uid(), workspace_id)));
CREATE POLICY "adm_insert" ON public.admisiones FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id) OR (workspace_id IS NOT NULL AND is_workspace_member(auth.uid(), workspace_id)));
CREATE POLICY "adm_update" ON public.admisiones FOR UPDATE TO authenticated
  USING (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id) OR (workspace_id IS NOT NULL AND is_workspace_member(auth.uid(), workspace_id)));
CREATE POLICY "adm_delete" ON public.admisiones FOR DELETE TO authenticated
  USING (is_admin_or_coordinador(auth.uid()));

-- Trigger: marcar cama como ocupada/disponible
CREATE OR REPLACE FUNCTION public.actualizar_estado_cama()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' AND NEW.cama_id IS NOT NULL AND NEW.estado='activa' THEN
    UPDATE camas SET estado='ocupada', updated_at=now() WHERE id=NEW.cama_id;
  ELSIF TG_OP='UPDATE' THEN
    IF NEW.estado IN ('alta','traslado') AND OLD.estado='activa' AND OLD.cama_id IS NOT NULL THEN
      UPDATE camas SET estado='disponible', updated_at=now() WHERE id=OLD.cama_id;
    END IF;
    IF NEW.cama_id IS DISTINCT FROM OLD.cama_id THEN
      IF OLD.cama_id IS NOT NULL THEN
        UPDATE camas SET estado='disponible', updated_at=now() WHERE id=OLD.cama_id;
      END IF;
      IF NEW.cama_id IS NOT NULL AND NEW.estado='activa' THEN
        UPDATE camas SET estado='ocupada', updated_at=now() WHERE id=NEW.cama_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_admision_cama ON public.admisiones;
CREATE TRIGGER trg_admision_cama AFTER INSERT OR UPDATE ON public.admisiones
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_estado_cama();

-- ============================================================
-- 6. TRIAJE (Manchester)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.triaje_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL,
  admision_id uuid REFERENCES public.admisiones(id) ON DELETE SET NULL,
  workspace_id uuid,
  sucursal_id uuid,
  nivel integer NOT NULL CHECK (nivel BETWEEN 1 AND 5), -- 1=rojo (inmediato) ... 5=azul (no urgente)
  color text NOT NULL, -- rojo, naranja, amarillo, verde, azul
  motivo_consulta text NOT NULL,
  signos_vitales jsonb NOT NULL DEFAULT '{}', -- TA, FC, FR, T°, SpO2, glucemia
  flujograma text, -- Manchester flowchart
  discriminador text, -- discriminador clave
  alergias_relevantes text,
  enfermera_id uuid,
  tiempo_objetivo_min integer, -- min hasta atención según nivel
  fecha_triaje timestamptz NOT NULL DEFAULT now(),
  derivado_a text, -- consultorio, observacion, uci
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.triaje_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "triaje_select" ON public.triaje_eventos FOR SELECT TO authenticated
  USING (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id) OR (workspace_id IS NOT NULL AND is_workspace_member(auth.uid(), workspace_id)));
CREATE POLICY "triaje_insert" ON public.triaje_eventos FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id) OR (workspace_id IS NOT NULL AND is_workspace_member(auth.uid(), workspace_id)));
CREATE POLICY "triaje_update" ON public.triaje_eventos FOR UPDATE TO authenticated
  USING (is_admin_or_coordinador(auth.uid()) OR (workspace_id IS NOT NULL AND is_workspace_member(auth.uid(), workspace_id)));

-- ============================================================
-- 7. UCI: notas, ventilación, infusiones, balance, kardex, pase de turno
-- ============================================================
CREATE TABLE IF NOT EXISTS public.uci_notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admision_id uuid NOT NULL REFERENCES public.admisiones(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL,
  profesional_id uuid,
  fecha timestamptz NOT NULL DEFAULT now(),
  sofa_score integer,
  apache_ii_score integer,
  glasgow integer,
  ventilacion jsonb NOT NULL DEFAULT '{}', -- modo, FiO2, PEEP, VT, FR
  hemodinamia jsonb NOT NULL DEFAULT '{}', -- TAM, PVC, lactato
  estado_neurologico text,
  estado_respiratorio text,
  estado_cardiovascular text,
  estado_renal text,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.uci_notas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uci_notas_rw" ON public.uci_notas FOR ALL TO authenticated
  USING (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id))
  WITH CHECK (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id));

CREATE TABLE IF NOT EXISTS public.uci_infusiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admision_id uuid NOT NULL REFERENCES public.admisiones(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL,
  medicamento text NOT NULL,
  dosis text,
  via text DEFAULT 'IV',
  velocidad text,
  fecha_inicio timestamptz NOT NULL DEFAULT now(),
  fecha_fin timestamptz,
  notas text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.uci_infusiones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uci_inf_rw" ON public.uci_infusiones FOR ALL TO authenticated
  USING (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id))
  WITH CHECK (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id));

CREATE TABLE IF NOT EXISTS public.uci_balance_hidrico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admision_id uuid NOT NULL REFERENCES public.admisiones(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL,
  fecha timestamptz NOT NULL DEFAULT now(),
  ingresos_ml numeric NOT NULL DEFAULT 0,
  ingresos_detalle jsonb NOT NULL DEFAULT '{}',
  egresos_ml numeric NOT NULL DEFAULT 0,
  egresos_detalle jsonb NOT NULL DEFAULT '{}',
  balance_ml numeric GENERATED ALWAYS AS (ingresos_ml - egresos_ml) STORED,
  notas text,
  registrado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.uci_balance_hidrico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uci_bal_rw" ON public.uci_balance_hidrico FOR ALL TO authenticated
  USING (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id))
  WITH CHECK (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id));

CREATE TABLE IF NOT EXISTS public.kardex_enfermeria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admision_id uuid NOT NULL REFERENCES public.admisiones(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL,
  turno text NOT NULL, -- mañana, tarde, noche
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  medicacion jsonb NOT NULL DEFAULT '[]',
  cuidados jsonb NOT NULL DEFAULT '[]',
  observaciones text,
  enfermera_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kardex_enfermeria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kardex_rw" ON public.kardex_enfermeria FOR ALL TO authenticated
  USING (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id))
  WITH CHECK (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id));

CREATE TABLE IF NOT EXISTS public.pase_turno (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admision_id uuid NOT NULL REFERENCES public.admisiones(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL,
  turno_saliente text NOT NULL,
  turno_entrante text NOT NULL,
  fecha timestamptz NOT NULL DEFAULT now(),
  resumen text NOT NULL,
  pendientes text,
  alertas text,
  entregado_por uuid,
  recibido_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pase_turno ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pase_turno_rw" ON public.pase_turno FOR ALL TO authenticated
  USING (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id))
  WITH CHECK (is_admin_or_coordinador(auth.uid()) OR is_staff_clinico_de_paciente(auth.uid(), paciente_id));

-- ============================================================
-- 8. API PÚBLICA: tokens de portal
-- ============================================================
CREATE TABLE IF NOT EXISTS public.public_appointment_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  sucursal_id uuid,
  nombre text NOT NULL, -- ej: "Portal Web Centro"
  api_key text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32),'hex'),
  permisos jsonb NOT NULL DEFAULT '{"consultar":true,"agendar":true,"cancelar":true}',
  activo boolean NOT NULL DEFAULT true,
  ultimo_uso timestamptz,
  total_llamadas integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);
ALTER TABLE public.public_appointment_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pat_select_admin" ON public.public_appointment_tokens FOR SELECT TO authenticated
  USING (is_workspace_admin(auth.uid(), workspace_id) OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "pat_modify_admin" ON public.public_appointment_tokens FOR ALL TO authenticated
  USING (is_workspace_admin(auth.uid(), workspace_id) OR has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (is_workspace_admin(auth.uid(), workspace_id) OR has_role(auth.uid(),'admin'::app_role));

-- ============================================================
-- 9. Catálogo inicial de especialidades
-- ============================================================
INSERT INTO public.especialidades_medicas (codigo, nombre, categoria) VALUES
  ('med_general','Medicina General','clinica'),
  ('cardio','Cardiología','clinica'),
  ('endocrino','Endocrinología','clinica'),
  ('neuro','Neurología','clinica'),
  ('pediatria','Pediatría','clinica'),
  ('ginecologia','Ginecología','clinica'),
  ('dermato','Dermatología','clinica'),
  ('psiquiatria','Psiquiatría','clinica'),
  ('cir_general','Cirugía General','quirurgica'),
  ('trauma','Traumatología','quirurgica'),
  ('intensivista','Medicina Intensiva (UCI)','clinica'),
  ('emergenciologia','Medicina de Emergencia','clinica'),
  ('enf_general','Enfermería General','enfermeria'),
  ('enf_uci','Enfermería UCI','enfermeria'),
  ('enf_quirurgica','Enfermería Quirúrgica','enfermeria')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================
-- 10. AUDITORÍA en tablas críticas nuevas
-- ============================================================
DROP TRIGGER IF EXISTS audit_admisiones ON public.admisiones;
CREATE TRIGGER audit_admisiones AFTER INSERT OR UPDATE OR DELETE ON public.admisiones
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

DROP TRIGGER IF EXISTS audit_triaje ON public.triaje_eventos;
CREATE TRIGGER audit_triaje AFTER INSERT OR UPDATE OR DELETE ON public.triaje_eventos
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

DROP TRIGGER IF EXISTS audit_uci_notas ON public.uci_notas;
CREATE TRIGGER audit_uci_notas AFTER INSERT OR UPDATE OR DELETE ON public.uci_notas
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

DROP TRIGGER IF EXISTS audit_escalas ON public.escalas_clinicas;
CREATE TRIGGER audit_escalas AFTER INSERT OR UPDATE OR DELETE ON public.escalas_clinicas
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

DROP TRIGGER IF EXISTS audit_afil ON public.afiliaciones_profesional;
CREATE TRIGGER audit_afil AFTER INSERT OR UPDATE OR DELETE ON public.afiliaciones_profesional
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

-- ============================================================
-- 11. Índices útiles
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_admisiones_paciente ON public.admisiones(paciente_id);
CREATE INDEX IF NOT EXISTS idx_admisiones_estado ON public.admisiones(estado);
CREATE INDEX IF NOT EXISTS idx_triaje_paciente ON public.triaje_eventos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_triaje_fecha ON public.triaje_eventos(fecha_triaje DESC);
CREATE INDEX IF NOT EXISTS idx_escalas_paciente ON public.escalas_clinicas(paciente_id, fecha_evaluacion DESC);
CREATE INDEX IF NOT EXISTS idx_consultorios_sucursal ON public.consultorios(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_camas_estado ON public.camas(estado);
CREATE INDEX IF NOT EXISTS idx_afil_user ON public.afiliaciones_profesional(user_id, estado);
