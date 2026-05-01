
-- ===== CENSO & CAMAS =====
CREATE TABLE public.mapa_camas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  piso text NOT NULL,
  sala text NOT NULL,
  numero_cama text NOT NULL,
  tipo text DEFAULT 'general' CHECK (tipo IN ('general','uci','intermedia','aislamiento','pediatrica','obstetrica','neonatal','recovery','quirurgica')),
  estado text DEFAULT 'disponible' CHECK (estado IN ('disponible','ocupada','limpieza','mantenimiento','reservada','bloqueada')),
  paciente_actual_id uuid REFERENCES public.pacientes(id),
  fecha_ocupacion timestamptz,
  notas text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, piso, sala, numero_cama)
);

CREATE TABLE public.censo_diario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  servicio text NOT NULL,
  camas_disponibles int DEFAULT 0,
  camas_ocupadas int DEFAULT 0,
  ingresos int DEFAULT 0,
  egresos int DEFAULT 0,
  defunciones int DEFAULT 0,
  porcentaje_ocupacion numeric(5,2),
  created_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, fecha, servicio)
);

CREATE TABLE public.traslados_internos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id),
  cama_origen_id uuid REFERENCES public.mapa_camas(id),
  cama_destino_id uuid REFERENCES public.mapa_camas(id),
  fecha_traslado timestamptz DEFAULT now(),
  motivo text NOT NULL,
  solicitado_por_id uuid REFERENCES public.personal_salud(id),
  autorizado_por_id uuid REFERENCES public.personal_salud(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.lista_espera_admision (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id),
  servicio_solicitado text NOT NULL,
  prioridad text DEFAULT 'normal' CHECK (prioridad IN ('emergencia','alta','normal','programada')),
  fecha_solicitud timestamptz DEFAULT now(),
  motivo text,
  estado text DEFAULT 'esperando' CHECK (estado IN ('esperando','asignada','cancelada')),
  cama_asignada_id uuid REFERENCES public.mapa_camas(id),
  created_at timestamptz DEFAULT now()
);

-- ===== ONCOLOGÍA =====
CREATE TABLE public.protocolos_quimio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo_cancer text,
  intencion text CHECK (intencion IN ('curativa','adyuvante','neoadyuvante','paliativa')),
  duracion_ciclos int,
  intervalo_dias int,
  medicamentos jsonb DEFAULT '[]'::jsonb,
  premedicaciones jsonb DEFAULT '[]'::jsonb,
  notas text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.ciclos_quimio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id),
  protocolo_id uuid REFERENCES public.protocolos_quimio(id),
  numero_ciclo int NOT NULL,
  fecha_programada date NOT NULL,
  fecha_realizada date,
  peso_kg numeric(5,2),
  talla_cm numeric(5,1),
  bsa_m2 numeric(4,2),
  estado text DEFAULT 'programado' CHECK (estado IN ('programado','en_curso','completado','aplazado','suspendido')),
  oncologo_id uuid REFERENCES public.personal_salud(id),
  motivo_aplazamiento text,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.dosis_quimio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo_id uuid REFERENCES public.ciclos_quimio(id) ON DELETE CASCADE,
  medicamento text NOT NULL,
  dosis_mg_m2 numeric(8,2),
  dosis_total_mg numeric(10,2),
  via_administracion text CHECK (via_administracion IN ('iv','oral','sc','im','intratecal')),
  duracion_infusion_min int,
  hora_inicio timestamptz,
  hora_fin timestamptz,
  enfermera_id uuid REFERENCES public.personal_salud(id),
  notas text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.sillones_infusion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  numero text NOT NULL,
  ubicacion text,
  estado text DEFAULT 'libre' CHECK (estado IN ('libre','ocupado','limpieza','mantenimiento')),
  ciclo_actual_id uuid REFERENCES public.ciclos_quimio(id),
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.toxicidades_oncologicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo_id uuid REFERENCES public.ciclos_quimio(id) ON DELETE CASCADE,
  fecha_evaluacion date DEFAULT CURRENT_DATE,
  tipo_toxicidad text NOT NULL,
  grado_ctcae int CHECK (grado_ctcae BETWEEN 1 AND 5),
  manejo text,
  requiere_ajuste_dosis boolean DEFAULT false,
  evaluador_id uuid REFERENCES public.personal_salud(id),
  notas text,
  created_at timestamptz DEFAULT now()
);

-- ===== MATERNIDAD & NEONATOLOGÍA =====
CREATE TABLE public.control_prenatal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id),
  numero_consulta int,
  fecha date NOT NULL,
  edad_gestacional_semanas numeric(4,1),
  peso_kg numeric(5,2),
  presion_arterial text,
  altura_uterina_cm numeric(4,1),
  fcf_lpm int,
  presentacion text CHECK (presentacion IN ('cefalica','podalica','transversa','indeterminada')),
  movimientos_fetales boolean,
  edemas boolean,
  observaciones text,
  obstetra_id uuid REFERENCES public.personal_salud(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.partogramas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id),
  fecha_inicio_trabajo timestamptz NOT NULL,
  registros jsonb DEFAULT '[]'::jsonb,
  estado text DEFAULT 'activo' CHECK (estado IN ('activo','finalizado','cesarea')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.registros_parto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id),
  partograma_id uuid REFERENCES public.partogramas(id),
  fecha_parto timestamptz NOT NULL,
  tipo_parto text CHECK (tipo_parto IN ('vaginal_espontaneo','vaginal_instrumentado','cesarea_electiva','cesarea_urgencia')),
  duracion_dilatacion_min int,
  duracion_expulsivo_min int,
  duracion_alumbramiento_min int,
  tipo_anestesia text,
  episiotomia boolean DEFAULT false,
  desgarro text,
  sangrado_ml int,
  complicaciones text,
  obstetra_id uuid REFERENCES public.personal_salud(id),
  observaciones text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.recien_nacidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  parto_id uuid REFERENCES public.registros_parto(id),
  madre_paciente_id uuid REFERENCES public.pacientes(id),
  fecha_nacimiento timestamptz NOT NULL,
  sexo text CHECK (sexo IN ('masculino','femenino','indeterminado')),
  peso_g int,
  talla_cm numeric(4,1),
  perimetro_cefalico_cm numeric(4,1),
  apgar_1min int CHECK (apgar_1min BETWEEN 0 AND 10),
  apgar_5min int CHECK (apgar_5min BETWEEN 0 AND 10),
  apgar_10min int CHECK (apgar_10min BETWEEN 0 AND 10),
  edad_gestacional_semanas numeric(4,1),
  estado text DEFAULT 'vivo' CHECK (estado IN ('vivo','obito','muerte_neonatal')),
  destino text CHECK (destino IN ('alojamiento_conjunto','neonatologia','uci_neonatal','quirofano','defuncion')),
  observaciones text,
  pediatra_id uuid REFERENCES public.personal_salud(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.lactancia_seguimiento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recien_nacido_id uuid REFERENCES public.recien_nacidos(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  tipo text CHECK (tipo IN ('exclusiva','mixta','formula')),
  frecuencia_tomas int,
  problemas text,
  intervencion text,
  responsable_id uuid REFERENCES public.personal_salud(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.vacunacion_neonatal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recien_nacido_id uuid REFERENCES public.recien_nacidos(id) ON DELETE CASCADE,
  vacuna text NOT NULL CHECK (vacuna IN ('bcg','hepatitis_b','vitamina_k','profilaxis_ocular','otros')),
  fecha timestamptz DEFAULT now(),
  lote text,
  dosis text,
  via text,
  responsable_id uuid REFERENCES public.personal_salud(id),
  observaciones text,
  created_at timestamptz DEFAULT now()
);

-- ===== RLS =====
ALTER TABLE public.mapa_camas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.censo_diario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traslados_internos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lista_espera_admision ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocolos_quimio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ciclos_quimio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dosis_quimio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sillones_infusion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toxicidades_oncologicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_prenatal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partogramas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_parto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recien_nacidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lactancia_seguimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacunacion_neonatal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws members mapa_camas" ON public.mapa_camas FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws members censo" ON public.censo_diario FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws members traslados" ON public.traslados_internos FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws members lista_espera" ON public.lista_espera_admision FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "ws members protocolos_quimio" ON public.protocolos_quimio FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws members ciclos_quimio" ON public.ciclos_quimio FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws members dosis_quimio" ON public.dosis_quimio FOR ALL USING (EXISTS (SELECT 1 FROM public.ciclos_quimio c WHERE c.id = ciclo_id AND public.is_workspace_member(auth.uid(), c.workspace_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.ciclos_quimio c WHERE c.id = ciclo_id AND public.is_workspace_member(auth.uid(), c.workspace_id)));
CREATE POLICY "ws members sillones" ON public.sillones_infusion FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws members toxicidades" ON public.toxicidades_oncologicas FOR ALL USING (EXISTS (SELECT 1 FROM public.ciclos_quimio c WHERE c.id = ciclo_id AND public.is_workspace_member(auth.uid(), c.workspace_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.ciclos_quimio c WHERE c.id = ciclo_id AND public.is_workspace_member(auth.uid(), c.workspace_id)));

CREATE POLICY "ws members prenatal" ON public.control_prenatal FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws members partogramas" ON public.partogramas FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws members partos" ON public.registros_parto FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws members rn" ON public.recien_nacidos FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws members lactancia" ON public.lactancia_seguimiento FOR ALL USING (EXISTS (SELECT 1 FROM public.recien_nacidos rn WHERE rn.id = recien_nacido_id AND public.is_workspace_member(auth.uid(), rn.workspace_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.recien_nacidos rn WHERE rn.id = recien_nacido_id AND public.is_workspace_member(auth.uid(), rn.workspace_id)));
CREATE POLICY "ws members vacunacion_neo" ON public.vacunacion_neonatal FOR ALL USING (EXISTS (SELECT 1 FROM public.recien_nacidos rn WHERE rn.id = recien_nacido_id AND public.is_workspace_member(auth.uid(), rn.workspace_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.recien_nacidos rn WHERE rn.id = recien_nacido_id AND public.is_workspace_member(auth.uid(), rn.workspace_id)));

-- Triggers updated_at
CREATE TRIGGER trg_mapa_camas_upd BEFORE UPDATE ON public.mapa_camas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_protoq_upd BEFORE UPDATE ON public.protocolos_quimio FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ciclos_upd BEFORE UPDATE ON public.ciclos_quimio FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sillones_upd BEFORE UPDATE ON public.sillones_infusion FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_partogr_upd BEFORE UPDATE ON public.partogramas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_rn_upd BEFORE UPDATE ON public.recien_nacidos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_mapa_camas_estado ON public.mapa_camas(workspace_id, estado);
CREATE INDEX idx_ciclos_paciente ON public.ciclos_quimio(paciente_id, fecha_programada DESC);
CREATE INDEX idx_prenatal_pac ON public.control_prenatal(paciente_id, fecha DESC);
CREATE INDEX idx_rn_madre ON public.recien_nacidos(madre_paciente_id);
