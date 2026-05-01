
-- ===== QUIRÓFANO =====
CREATE TABLE public.quirofanos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo text DEFAULT 'general' CHECK (tipo IN ('general','cardiovascular','neurologia','traumatologia','oftalmologia','ambulatorio','obstetrico')),
  estado text DEFAULT 'disponible' CHECK (estado IN ('disponible','ocupado','limpieza','mantenimiento','reservado')),
  equipamiento jsonb DEFAULT '[]'::jsonb,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.programaciones_quirurgicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id),
  quirofano_id uuid REFERENCES public.quirofanos(id),
  fecha_programada timestamptz NOT NULL,
  duracion_estimada_min int DEFAULT 60,
  procedimiento text NOT NULL,
  cirujano_principal_id uuid REFERENCES public.personal_salud(id),
  anestesiologo_id uuid REFERENCES public.personal_salud(id),
  instrumentista_id uuid REFERENCES public.personal_salud(id),
  tipo_anestesia text CHECK (tipo_anestesia IN ('general','regional','local','sedacion')),
  prioridad text DEFAULT 'electiva' CHECK (prioridad IN ('emergencia','urgente','electiva')),
  estado text DEFAULT 'programada' CHECK (estado IN ('programada','en_curso','completada','suspendida','cancelada')),
  notas text,
  hora_inicio_real timestamptz,
  hora_fin_real timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.checklist_oms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programacion_id uuid REFERENCES public.programaciones_quirurgicas(id) ON DELETE CASCADE,
  fase text NOT NULL CHECK (fase IN ('entrada','pausa_quirurgica','salida')),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  completado boolean DEFAULT false,
  responsable_id uuid REFERENCES public.personal_salud(id),
  hora_completado timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.conteo_gasas_instrumental (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programacion_id uuid REFERENCES public.programaciones_quirurgicas(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('gasas','compresas','instrumental','agujas')),
  conteo_inicial int NOT NULL,
  agregado int DEFAULT 0,
  conteo_final int,
  coincide boolean,
  responsable_id uuid REFERENCES public.personal_salud(id),
  notas text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.recuperacion_post_anestesica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programacion_id uuid REFERENCES public.programaciones_quirurgicas(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id),
  hora_ingreso_urpa timestamptz DEFAULT now(),
  aldrete_actividad int CHECK (aldrete_actividad BETWEEN 0 AND 2),
  aldrete_respiracion int CHECK (aldrete_respiracion BETWEEN 0 AND 2),
  aldrete_circulacion int CHECK (aldrete_circulacion BETWEEN 0 AND 2),
  aldrete_conciencia int CHECK (aldrete_conciencia BETWEEN 0 AND 2),
  aldrete_saturacion int CHECK (aldrete_saturacion BETWEEN 0 AND 2),
  aldrete_total int GENERATED ALWAYS AS (
    COALESCE(aldrete_actividad,0)+COALESCE(aldrete_respiracion,0)+
    COALESCE(aldrete_circulacion,0)+COALESCE(aldrete_conciencia,0)+COALESCE(aldrete_saturacion,0)
  ) STORED,
  signos_vitales jsonb DEFAULT '[]'::jsonb,
  hora_alta_urpa timestamptz,
  destino text CHECK (destino IN ('hospitalizacion','domicilio','uci','otro')),
  notas text,
  created_at timestamptz DEFAULT now()
);

-- ===== URGENCIAS =====
CREATE TABLE public.registros_urgencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id),
  hora_llegada timestamptz NOT NULL DEFAULT now(),
  motivo_consulta text NOT NULL,
  modo_llegada text CHECK (modo_llegada IN ('ambulatorio','ambulancia','traslado','policia','familiar')),
  acompanante text,
  estado text DEFAULT 'en_triage' CHECK (estado IN ('en_triage','en_atencion','observacion','derivado','alta','fallecido')),
  hora_egreso timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.triage_manchester (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_urgencia_id uuid REFERENCES public.registros_urgencias(id) ON DELETE CASCADE,
  hora_triage timestamptz DEFAULT now(),
  nivel text NOT NULL CHECK (nivel IN ('rojo','naranja','amarillo','verde','azul')),
  tiempo_objetivo_min int,
  signos_vitales jsonb DEFAULT '{}'::jsonb,
  sintomas text,
  enfermera_id uuid REFERENCES public.personal_salud(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.observacion_urgencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_urgencia_id uuid REFERENCES public.registros_urgencias(id) ON DELETE CASCADE,
  hora text NOT NULL,
  signos_vitales jsonb DEFAULT '{}'::jsonb,
  evolucion text,
  responsable_id uuid REFERENCES public.personal_salud(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.derivaciones_urgencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_urgencia_id uuid REFERENCES public.registros_urgencias(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('alta','hospitalizacion','uci','quirofano','traslado_externo','defuncion')),
  destino_detalle text,
  hora_derivacion timestamptz DEFAULT now(),
  medico_id uuid REFERENCES public.personal_salud(id),
  diagnostico_egreso text,
  recomendaciones text,
  created_at timestamptz DEFAULT now()
);

-- ===== BANCO DE SANGRE =====
CREATE TABLE public.donantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  apellido text,
  cedula text,
  fecha_nacimiento date,
  sexo text CHECK (sexo IN ('masculino','femenino','otro')),
  tipo_sangre text CHECK (tipo_sangre IN ('O+','O-','A+','A-','B+','B-','AB+','AB-')),
  telefono text,
  email text,
  direccion text,
  apto boolean DEFAULT true,
  motivo_diferimiento text,
  ultima_donacion date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.donaciones_sangre (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  donante_id uuid REFERENCES public.donantes(id),
  fecha_donacion timestamptz DEFAULT now(),
  volumen_ml int DEFAULT 450,
  tipo_donacion text DEFAULT 'sangre_total' CHECK (tipo_donacion IN ('sangre_total','plaquetoaferesis','plasmaferesis')),
  hemoglobina_predonacion numeric(4,1),
  presion_arterial text,
  pulso int,
  pruebas_serologia jsonb DEFAULT '{}'::jsonb,
  apta_uso boolean DEFAULT true,
  motivo_descarte text,
  responsable_id uuid REFERENCES public.personal_salud(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.inventario_hemocomponentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  donacion_id uuid REFERENCES public.donaciones_sangre(id),
  codigo_unidad text NOT NULL UNIQUE,
  componente text NOT NULL CHECK (componente IN ('concentrado_eritrocitos','plasma_fresco','plaquetas','crioprecipitado','sangre_total')),
  tipo_sangre text NOT NULL,
  fecha_extraccion date NOT NULL,
  fecha_vencimiento date NOT NULL,
  volumen_ml int,
  estado text DEFAULT 'disponible' CHECK (estado IN ('disponible','reservado','transfundido','vencido','descartado','cuarentena')),
  ubicacion text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.pruebas_cruzadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id),
  unidad_id uuid REFERENCES public.inventario_hemocomponentes(id),
  fecha_prueba timestamptz DEFAULT now(),
  compatible boolean,
  metodo text CHECK (metodo IN ('tubo','gel','aglutinacion')),
  observaciones text,
  responsable_id uuid REFERENCES public.personal_salud(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.transfusiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id),
  unidad_id uuid REFERENCES public.inventario_hemocomponentes(id),
  hora_inicio timestamptz NOT NULL DEFAULT now(),
  hora_fin timestamptz,
  velocidad_infusion text,
  signos_vitales_pre jsonb DEFAULT '{}'::jsonb,
  signos_vitales_post jsonb DEFAULT '{}'::jsonb,
  reaccion_adversa boolean DEFAULT false,
  tipo_reaccion text,
  manejo_reaccion text,
  enfermera_id uuid REFERENCES public.personal_salud(id),
  medico_id uuid REFERENCES public.personal_salud(id),
  created_at timestamptz DEFAULT now()
);

-- ===== RLS =====
ALTER TABLE public.quirofanos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programaciones_quirurgicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_oms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conteo_gasas_instrumental ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recuperacion_post_anestesica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_urgencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.triage_manchester ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observacion_urgencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.derivaciones_urgencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donaciones_sangre ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_hemocomponentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pruebas_cruzadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfusiones ENABLE ROW LEVEL SECURITY;

-- Policies por workspace
CREATE POLICY "ws members quirofanos" ON public.quirofanos FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws members prog_qx" ON public.programaciones_quirurgicas FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws members checklist" ON public.checklist_oms FOR ALL USING (EXISTS (SELECT 1 FROM public.programaciones_quirurgicas pq WHERE pq.id = programacion_id AND public.is_workspace_member(auth.uid(), pq.workspace_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.programaciones_quirurgicas pq WHERE pq.id = programacion_id AND public.is_workspace_member(auth.uid(), pq.workspace_id)));
CREATE POLICY "ws members conteo" ON public.conteo_gasas_instrumental FOR ALL USING (EXISTS (SELECT 1 FROM public.programaciones_quirurgicas pq WHERE pq.id = programacion_id AND public.is_workspace_member(auth.uid(), pq.workspace_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.programaciones_quirurgicas pq WHERE pq.id = programacion_id AND public.is_workspace_member(auth.uid(), pq.workspace_id)));
CREATE POLICY "ws members urpa" ON public.recuperacion_post_anestesica FOR ALL USING (EXISTS (SELECT 1 FROM public.programaciones_quirurgicas pq WHERE pq.id = programacion_id AND public.is_workspace_member(auth.uid(), pq.workspace_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.programaciones_quirurgicas pq WHERE pq.id = programacion_id AND public.is_workspace_member(auth.uid(), pq.workspace_id)));

CREATE POLICY "ws members urgencias" ON public.registros_urgencias FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws members triage" ON public.triage_manchester FOR ALL USING (EXISTS (SELECT 1 FROM public.registros_urgencias r WHERE r.id = registro_urgencia_id AND public.is_workspace_member(auth.uid(), r.workspace_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.registros_urgencias r WHERE r.id = registro_urgencia_id AND public.is_workspace_member(auth.uid(), r.workspace_id)));
CREATE POLICY "ws members obs urg" ON public.observacion_urgencias FOR ALL USING (EXISTS (SELECT 1 FROM public.registros_urgencias r WHERE r.id = registro_urgencia_id AND public.is_workspace_member(auth.uid(), r.workspace_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.registros_urgencias r WHERE r.id = registro_urgencia_id AND public.is_workspace_member(auth.uid(), r.workspace_id)));
CREATE POLICY "ws members deriv urg" ON public.derivaciones_urgencias FOR ALL USING (EXISTS (SELECT 1 FROM public.registros_urgencias r WHERE r.id = registro_urgencia_id AND public.is_workspace_member(auth.uid(), r.workspace_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.registros_urgencias r WHERE r.id = registro_urgencia_id AND public.is_workspace_member(auth.uid(), r.workspace_id)));

CREATE POLICY "ws members donantes" ON public.donantes FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws members donaciones" ON public.donaciones_sangre FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws members hemo" ON public.inventario_hemocomponentes FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws members cruzadas" ON public.pruebas_cruzadas FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws members transf" ON public.transfusiones FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

-- Triggers updated_at
CREATE TRIGGER trg_quirofanos_updated BEFORE UPDATE ON public.quirofanos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_progqx_updated BEFORE UPDATE ON public.programaciones_quirurgicas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_urgencias_updated BEFORE UPDATE ON public.registros_urgencias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_donantes_updated BEFORE UPDATE ON public.donantes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_hemo_updated BEFORE UPDATE ON public.inventario_hemocomponentes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_progqx_fecha ON public.programaciones_quirurgicas(workspace_id, fecha_programada);
CREATE INDEX idx_urg_estado ON public.registros_urgencias(workspace_id, estado);
CREATE INDEX idx_hemo_estado ON public.inventario_hemocomponentes(workspace_id, estado, tipo_sangre);
CREATE INDEX idx_hemo_venc ON public.inventario_hemocomponentes(fecha_vencimiento) WHERE estado = 'disponible';
