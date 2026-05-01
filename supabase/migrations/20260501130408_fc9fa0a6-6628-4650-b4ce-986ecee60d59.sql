
-- ============================================================
-- FASE W: Internamientos, rondas médicas, enfermería, laboratorio
-- y agendamiento universal multi-área
-- ============================================================

-- ============== 1. RONDAS / VISITAS MÉDICAS ==============
CREATE TABLE public.rondas_medicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  sucursal_id uuid,
  fecha_ronda timestamptz NOT NULL DEFAULT now(),
  tipo text NOT NULL DEFAULT 'general' CHECK (tipo IN ('general','uci','urgencia','docente','interconsulta')),
  ala_id uuid,
  medico_lider_id uuid REFERENCES public.personal_salud(id),
  participantes jsonb DEFAULT '[]'::jsonb,
  estado text DEFAULT 'planificada' CHECK (estado IN ('planificada','en_curso','finalizada','cancelada')),
  observaciones_generales text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.ronda_paciente_notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ronda_id uuid NOT NULL REFERENCES public.rondas_medicas(id) ON DELETE CASCADE,
  admision_id uuid REFERENCES public.admisiones(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  evolucion text,
  cambios_plan text,
  ordenes_nuevas jsonb DEFAULT '[]'::jsonb,
  estado_paciente text CHECK (estado_paciente IN ('estable','mejoria','critico','deterioro','alta_proxima')),
  duracion_minutos int,
  created_at timestamptz DEFAULT now()
);

-- ============== 2. ENFERMERÍA AVANZADA ==============
CREATE TABLE public.valoracion_inicial_enfermeria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admision_id uuid NOT NULL REFERENCES public.admisiones(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  enfermera_id uuid REFERENCES public.personal_salud(id),
  fecha timestamptz NOT NULL DEFAULT now(),
  motivo_ingreso text,
  antecedentes text,
  alergias text,
  medicacion_habitual text,
  patrones_funcionales jsonb DEFAULT '{}'::jsonb,
  riesgo_caidas int,
  riesgo_upp int,
  estado_nutricional text,
  estado_emocional text,
  red_apoyo text,
  observaciones text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.plan_cuidados_enfermeria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admision_id uuid NOT NULL REFERENCES public.admisiones(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  diagnostico_nanda text NOT NULL,
  resultado_noc text,
  intervencion_nic text,
  prioridad text DEFAULT 'media' CHECK (prioridad IN ('alta','media','baja')),
  estado text DEFAULT 'activo' CHECK (estado IN ('activo','resuelto','suspendido')),
  fecha_inicio date DEFAULT CURRENT_DATE,
  fecha_evaluacion date,
  observaciones text,
  enfermera_id uuid REFERENCES public.personal_salud(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.signos_vitales_turno (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admision_id uuid REFERENCES public.admisiones(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  fecha_registro timestamptz NOT NULL DEFAULT now(),
  turno text CHECK (turno IN ('manana','tarde','noche')),
  ta_sistolica int, ta_diastolica int,
  fc int, fr int,
  temperatura numeric(4,1),
  saturacion int,
  glicemia numeric(5,1),
  dolor_eva int CHECK (dolor_eva BETWEEN 0 AND 10),
  diuresis_ml int,
  observaciones text,
  enfermera_id uuid REFERENCES public.personal_salud(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.procedimientos_enfermeria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admision_id uuid REFERENCES public.admisiones(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  tipo text NOT NULL,
  descripcion text,
  fecha_hora timestamptz NOT NULL DEFAULT now(),
  realizado_por uuid REFERENCES public.personal_salud(id),
  resultado text,
  complicaciones text,
  insumos_usados jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.administracion_medicamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admision_id uuid REFERENCES public.admisiones(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  medicamento text NOT NULL,
  dosis text,
  via text,
  hora_programada timestamptz,
  hora_administrada timestamptz,
  estado text DEFAULT 'programada' CHECK (estado IN ('programada','administrada','omitida','rechazada','retrasada')),
  motivo_omision text,
  enfermera_id uuid REFERENCES public.personal_salud(id),
  observaciones text,
  created_at timestamptz DEFAULT now()
);

-- ============== 3. LABORATORIO AVANZADO ==============
CREATE TABLE public.muestras_laboratorio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id uuid NOT NULL REFERENCES public.ordenes_laboratorio(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  tipo_muestra text NOT NULL,
  codigo_barras text UNIQUE,
  recipiente text,
  volumen text,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente','recolectada','en_transito','recibida','procesada','rechazada')),
  motivo_rechazo text,
  flebotomista_id uuid REFERENCES public.personal_salud(id),
  fecha_recoleccion timestamptz,
  fecha_recepcion timestamptz,
  temperatura_transporte text,
  observaciones text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.procesamiento_lab (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  muestra_id uuid NOT NULL REFERENCES public.muestras_laboratorio(id) ON DELETE CASCADE,
  prueba_id uuid REFERENCES public.pruebas_laboratorio(id) ON DELETE CASCADE,
  equipo text,
  tecnico_id uuid REFERENCES public.personal_salud(id),
  fecha_procesamiento timestamptz DEFAULT now(),
  resultado text,
  unidad text,
  valor_referencia text,
  fuera_rango boolean DEFAULT false,
  critico boolean DEFAULT false,
  validado_por uuid REFERENCES public.personal_salud(id),
  fecha_validacion timestamptz,
  observaciones text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.control_calidad_lab (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  equipo text NOT NULL,
  prueba text NOT NULL,
  nivel_control text,
  valor_obtenido numeric,
  valor_esperado numeric,
  desviacion numeric,
  aprobado boolean DEFAULT true,
  tecnico_id uuid REFERENCES public.personal_salud(id),
  fecha timestamptz DEFAULT now(),
  observaciones text
);

CREATE TABLE public.alertas_laboratorio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id),
  orden_id uuid REFERENCES public.ordenes_laboratorio(id),
  tipo text CHECK (tipo IN ('valor_critico','panel_anormal','muestra_rechazada','retraso')),
  severidad text DEFAULT 'media' CHECK (severidad IN ('baja','media','alta','critica')),
  descripcion text NOT NULL,
  notificado_a uuid REFERENCES public.personal_salud(id),
  notificado_at timestamptz,
  resuelto boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============== 4. AGENDAMIENTO UNIVERSAL MULTI-ÁREA ==============
CREATE TABLE public.areas_servicio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  codigo text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('consulta','laboratorio','imagenologia','quirofano','rehabilitacion','odontologia','vision','estetica','vacunacion','procedimiento','telemedicina','recovery','enfermeria')),
  duracion_default_min int DEFAULT 30,
  requiere_ayuno boolean DEFAULT false,
  requiere_preparacion text,
  capacidad_simultanea int DEFAULT 1,
  color text DEFAULT '#3b82f6',
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, codigo)
);

CREATE TABLE public.citas_universales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  sucursal_id uuid,
  area_id uuid REFERENCES public.areas_servicio(id),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  profesional_id uuid REFERENCES public.personal_salud(id),
  recurso_id uuid,
  fecha_inicio timestamptz NOT NULL,
  fecha_fin timestamptz NOT NULL,
  motivo text,
  notas text,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente','confirmada','en_curso','completada','cancelada','no_asistio','reprogramada')),
  prioridad text DEFAULT 'normal' CHECK (prioridad IN ('baja','normal','alta','urgente')),
  origen text DEFAULT 'manual' CHECK (origen IN ('manual','online','recepcion','interconsulta','derivacion')),
  cita_padre_id uuid REFERENCES public.citas_universales(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_citas_univ_fecha ON public.citas_universales(fecha_inicio);
CREATE INDEX idx_citas_univ_paciente ON public.citas_universales(paciente_id);
CREATE INDEX idx_citas_univ_profesional ON public.citas_universales(profesional_id);
CREATE INDEX idx_citas_univ_area ON public.citas_universales(area_id);

-- ============== TRIGGERS DE updated_at ==============
CREATE TRIGGER trg_rondas_upd BEFORE UPDATE ON public.rondas_medicas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_plan_cuidados_upd BEFORE UPDATE ON public.plan_cuidados_enfermeria FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_muestras_upd BEFORE UPDATE ON public.muestras_laboratorio FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_citas_univ_upd BEFORE UPDATE ON public.citas_universales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== AUDITORÍA ==============
CREATE TRIGGER audit_rondas AFTER INSERT OR UPDATE OR DELETE ON public.rondas_medicas FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
CREATE TRIGGER audit_plan_cuidados AFTER INSERT OR UPDATE OR DELETE ON public.plan_cuidados_enfermeria FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
CREATE TRIGGER audit_admin_med AFTER INSERT OR UPDATE OR DELETE ON public.administracion_medicamentos FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
CREATE TRIGGER audit_citas_univ AFTER INSERT OR UPDATE OR DELETE ON public.citas_universales FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

-- ============== RLS ==============
ALTER TABLE public.rondas_medicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ronda_paciente_notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valoracion_inicial_enfermeria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_cuidados_enfermeria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signos_vitales_turno ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedimientos_enfermeria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administracion_medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muestras_laboratorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procesamiento_lab ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_calidad_lab ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_laboratorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas_universales ENABLE ROW LEVEL SECURITY;

-- Políticas por workspace
CREATE POLICY "ws_rondas" ON public.rondas_medicas FOR ALL TO authenticated
  USING (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "ws_ronda_notas" ON public.ronda_paciente_notas FOR ALL TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id))
  WITH CHECK (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));

CREATE POLICY "ws_valoracion" ON public.valoracion_inicial_enfermeria FOR ALL TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id))
  WITH CHECK (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));

CREATE POLICY "ws_plan_cuid" ON public.plan_cuidados_enfermeria FOR ALL TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id))
  WITH CHECK (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));

CREATE POLICY "ws_signos" ON public.signos_vitales_turno FOR ALL TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id))
  WITH CHECK (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));

CREATE POLICY "ws_proc_enf" ON public.procedimientos_enfermeria FOR ALL TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id))
  WITH CHECK (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));

CREATE POLICY "ws_admin_med" ON public.administracion_medicamentos FOR ALL TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id))
  WITH CHECK (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));

CREATE POLICY "ws_muestras" ON public.muestras_laboratorio FOR ALL TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id))
  WITH CHECK (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));

CREATE POLICY "ws_procesamiento" ON public.procesamiento_lab FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "ws_cc_lab" ON public.control_calidad_lab FOR ALL TO authenticated
  USING (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "ws_alertas_lab" ON public.alertas_laboratorio FOR ALL TO authenticated
  USING (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "ws_areas" ON public.areas_servicio FOR ALL TO authenticated
  USING (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "ws_citas_univ" ON public.citas_universales FOR ALL TO authenticated
  USING (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id));
