
-- 1) Vertical enum
ALTER TYPE public.vertical_tipo ADD VALUE IF NOT EXISTS 'psicologia';

-- 2) Pacientes psicológicos (perfil clínico ampliado)
CREATE TABLE IF NOT EXISTS public.pacientes_psicologia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE CASCADE,
  terapeuta_id uuid,
  contacto_emergencia_nombre text,
  contacto_emergencia_telefono text,
  contacto_emergencia_relacion text,
  es_menor boolean DEFAULT false,
  tutor_nombre text,
  tutor_telefono text,
  tutor_relacion text,
  motivo_consulta text,
  antecedentes_familiares text,
  diagnosticos_previos text,
  medicacion_actual text,
  consumo_sustancias text,
  riesgo_suicida text CHECK (riesgo_suicida IN ('ninguno','bajo','moderado','alto','critico')) DEFAULT 'ninguno',
  riesgo_autolesion text CHECK (riesgo_autolesion IN ('ninguno','bajo','moderado','alto','critico')) DEFAULT 'ninguno',
  alerta_interna_activa boolean DEFAULT false,
  historia_trauma text,
  historia_trauma_restringida boolean DEFAULT true,
  notas_generales text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

-- 3) Sesiones (agenda terapéutica)
CREATE TABLE IF NOT EXISTS public.sesiones_psicologia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  paciente_id uuid NOT NULL,
  terapeuta_id uuid,
  fecha_hora timestamptz NOT NULL,
  duracion_minutos int DEFAULT 50,
  tipo_sesion text NOT NULL CHECK (tipo_sesion IN (
    'primera_evaluacion','psicoterapia_individual','terapia_pareja','terapia_familiar',
    'terapia_grupal','seguimiento_psiquiatrico','teleconsulta','emergencia_emocional'
  )),
  modalidad text CHECK (modalidad IN ('presencial','virtual','telefono')) DEFAULT 'presencial',
  estado text CHECK (estado IN ('agendada','confirmada','realizada','no_show','cancelada','reagendada')) DEFAULT 'agendada',
  recurrencia_semanal boolean DEFAULT false,
  lista_espera boolean DEFAULT false,
  sala_virtual_token text,
  notas_previas text,
  motivo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Notas clínicas privadas
CREATE TABLE IF NOT EXISTS public.notas_psicologia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  paciente_id uuid NOT NULL,
  sesion_id uuid REFERENCES public.sesiones_psicologia(id) ON DELETE SET NULL,
  terapeuta_id uuid,
  tipo_nota text NOT NULL CHECK (tipo_nota IN ('soap','evolutiva','plan_terapeutico','narrativa','observacion_conductual')),
  contenido text,
  contenido_compartible text,
  es_privada boolean DEFAULT true,
  bloqueada_supervisor boolean DEFAULT false,
  supervisor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE TABLE IF NOT EXISTS public.notas_psicologia_accesos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nota_id uuid NOT NULL REFERENCES public.notas_psicologia(id) ON DELETE CASCADE,
  user_id uuid,
  accion text DEFAULT 'view',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5) Evaluaciones psicométricas
CREATE TABLE IF NOT EXISTS public.evaluaciones_psicometricas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  paciente_id uuid NOT NULL,
  terapeuta_id uuid,
  escala text NOT NULL CHECK (escala IN ('phq9','gad7','bdi','pcl5','asrs','escala_infantil','riesgo_suicida','otro')),
  respuestas jsonb DEFAULT '{}'::jsonb,
  puntaje_total numeric,
  severidad text CHECK (severidad IN ('minima','leve','moderada','moderada_severa','severa','critica')),
  auto_completado_paciente boolean DEFAULT false,
  token_paciente text,
  fecha_aplicacion timestamptz DEFAULT now(),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6) Tareas terapéuticas
CREATE TABLE IF NOT EXISTS public.tareas_terapeuticas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  paciente_id uuid NOT NULL,
  terapeuta_id uuid,
  sesion_id uuid REFERENCES public.sesiones_psicologia(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  descripcion text,
  fecha_asignacion date DEFAULT CURRENT_DATE,
  fecha_limite date,
  cumplida boolean DEFAULT false,
  fecha_cumplimiento date,
  comentario_paciente text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7) Seguimiento emocional semanal
CREATE TABLE IF NOT EXISTS public.seguimiento_emocional (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  paciente_id uuid NOT NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  animo int CHECK (animo BETWEEN 0 AND 10),
  ansiedad int CHECK (ansiedad BETWEEN 0 AND 10),
  sueno int CHECK (sueno BETWEEN 0 AND 10),
  estres int CHECK (estres BETWEEN 0 AND 10),
  disparadores text,
  crisis_reciente boolean DEFAULT false,
  notas text,
  objetivo_terapeutico text,
  reportado_por_paciente boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8) Prescripciones psiquiátricas
CREATE TABLE IF NOT EXISTS public.prescripciones_psiquiatricas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  paciente_id uuid NOT NULL,
  psiquiatra_id uuid,
  medicamento text NOT NULL,
  dosis text,
  frecuencia text,
  via text,
  fecha_inicio date DEFAULT CURRENT_DATE,
  fecha_fin date,
  estado text CHECK (estado IN ('activa','ajustada','suspendida','completada')) DEFAULT 'activa',
  efectos_secundarios text,
  adherencia int CHECK (adherencia BETWEEN 0 AND 100),
  alerta_interaccion boolean DEFAULT false,
  alerta_suspension_abrupta boolean DEFAULT false,
  refill_pendiente boolean DEFAULT false,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 9) Submódulos por nicho
CREATE TABLE IF NOT EXISTS public.casos_infantil_psico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  paciente_id uuid NOT NULL,
  padres_separados boolean DEFAULT false,
  custodia text,
  escuela_nombre text,
  reporte_conducta text,
  hitos_desarrollo text,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.casos_adicciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  paciente_id uuid NOT NULL,
  sustancia_principal text,
  fecha_ultima_recaida date,
  total_recaidas int DEFAULT 0,
  prueba_toxicologica jsonb DEFAULT '{}'::jsonb,
  sponsor_nombre text,
  sponsor_contacto text,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.casos_pareja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  paciente_id_a uuid NOT NULL,
  paciente_id_b uuid,
  acuerdos text,
  cronologia_conflicto text,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.casos_eap_corporativo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  paciente_id uuid NOT NULL,
  empresa text NOT NULL,
  empleado_codigo text,
  sesiones_cubiertas int DEFAULT 0,
  sesiones_usadas int DEFAULT 0,
  anonimo_en_reportes boolean DEFAULT true,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 10) Paquetes / membresías
CREATE TABLE IF NOT EXISTS public.paquetes_sesiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  paciente_id uuid,
  nombre text NOT NULL,
  tipo text CHECK (tipo IN ('bono_4','bono_8','membresia_mensual','paquete_custom')),
  total_sesiones int,
  sesiones_usadas int DEFAULT 0,
  precio numeric(12,2),
  fee_cancelacion_tardia numeric(12,2),
  cobro_automatico boolean DEFAULT false,
  activo boolean DEFAULT true,
  fecha_inicio date DEFAULT CURRENT_DATE,
  fecha_vencimiento date,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 11) RLS
ALTER TABLE public.pacientes_psicologia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones_psicologia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_psicologia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_psicologia_accesos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluaciones_psicometricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas_terapeuticas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seguimiento_emocional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescripciones_psiquiatricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casos_infantil_psico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casos_adicciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casos_pareja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casos_eap_corporativo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paquetes_sesiones ENABLE ROW LEVEL SECURITY;

-- Policies estándar workspace member
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'pacientes_psicologia','sesiones_psicologia','evaluaciones_psicometricas',
    'tareas_terapeuticas','seguimiento_emocional','prescripciones_psiquiatricas',
    'casos_infantil_psico','casos_adicciones','casos_pareja','casos_eap_corporativo',
    'paquetes_sesiones'
  ] LOOP
    EXECUTE format('CREATE POLICY "%I_ws_select" ON public.%I FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id))', t, t);
    EXECUTE format('CREATE POLICY "%I_ws_ins"    ON public.%I FOR INSERT WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id))', t, t);
    EXECUTE format('CREATE POLICY "%I_ws_upd"    ON public.%I FOR UPDATE USING (public.is_workspace_member(auth.uid(), workspace_id))', t, t);
    EXECUTE format('CREATE POLICY "%I_ws_del"    ON public.%I FOR DELETE USING (public.is_workspace_admin(auth.uid(), workspace_id))', t, t);
  END LOOP;
END $$;

-- Notas privadas: solo terapeuta dueño, supervisor o admin
CREATE POLICY "notas_psico_select_priv" ON public.notas_psicologia
  FOR SELECT USING (
    public.is_workspace_admin(auth.uid(), workspace_id)
    OR terapeuta_id = auth.uid()
    OR supervisor_id = auth.uid()
    OR (es_privada = false AND public.is_workspace_member(auth.uid(), workspace_id))
  );
CREATE POLICY "notas_psico_ins" ON public.notas_psicologia
  FOR INSERT WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "notas_psico_upd" ON public.notas_psicologia
  FOR UPDATE USING (
    (terapeuta_id = auth.uid() AND bloqueada_supervisor = false)
    OR supervisor_id = auth.uid()
    OR public.is_workspace_admin(auth.uid(), workspace_id)
  );
CREATE POLICY "notas_psico_del" ON public.notas_psicologia
  FOR DELETE USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "notas_acc_select" ON public.notas_psicologia_accesos
  FOR SELECT USING (
    EXISTS(SELECT 1 FROM public.notas_psicologia n
           WHERE n.id = nota_id AND (
             public.is_workspace_admin(auth.uid(), n.workspace_id)
             OR n.terapeuta_id = auth.uid() OR n.supervisor_id = auth.uid()
           ))
  );
CREATE POLICY "notas_acc_ins" ON public.notas_psicologia_accesos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 12) Triggers de auditoría y updated_at
CREATE TRIGGER trg_pac_psico_aud  AFTER INSERT OR UPDATE OR DELETE ON public.pacientes_psicologia
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
CREATE TRIGGER trg_ses_psico_aud  AFTER INSERT OR UPDATE OR DELETE ON public.sesiones_psicologia
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
CREATE TRIGGER trg_notas_psico_aud AFTER INSERT OR UPDATE OR DELETE ON public.notas_psicologia
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
CREATE TRIGGER trg_psiquiatricas_aud AFTER INSERT OR UPDATE OR DELETE ON public.prescripciones_psiquiatricas
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

CREATE TRIGGER trg_pac_psico_upd BEFORE UPDATE ON public.pacientes_psicologia
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ses_psico_upd BEFORE UPDATE ON public.sesiones_psicologia
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_notas_psico_upd BEFORE UPDATE ON public.notas_psicologia
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_psiquiatricas_upd BEFORE UPDATE ON public.prescripciones_psiquiatricas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13) Índices útiles
CREATE INDEX IF NOT EXISTS ix_ses_psico_ws_fecha ON public.sesiones_psicologia(workspace_id, fecha_hora);
CREATE INDEX IF NOT EXISTS ix_ses_psico_pac ON public.sesiones_psicologia(paciente_id);
CREATE INDEX IF NOT EXISTS ix_notas_psico_pac ON public.notas_psicologia(paciente_id);
CREATE INDEX IF NOT EXISTS ix_eval_psico_pac ON public.evaluaciones_psicometricas(paciente_id, escala);
CREATE INDEX IF NOT EXISTS ix_seg_emo_pac ON public.seguimiento_emocional(paciente_id, fecha);
CREATE INDEX IF NOT EXISTS ix_pres_psiq_pac ON public.prescripciones_psiquiatricas(paciente_id);
