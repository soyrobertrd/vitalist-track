-- FASE GG: CLÍNICO PRO

CREATE TABLE public.protocolos_clinicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID,
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  especialidad TEXT,
  categoria TEXT,
  descripcion TEXT,
  criterios_inclusion JSONB DEFAULT '[]'::jsonb,
  criterios_exclusion JSONB DEFAULT '[]'::jsonb,
  pasos JSONB DEFAULT '[]'::jsonb,
  ordenes_sugeridas JSONB DEFAULT '[]'::jsonb,
  medicamentos_sugeridos JSONB DEFAULT '[]'::jsonb,
  duracion_estimada_horas INTEGER,
  evidencia_nivel TEXT,
  referencia_bibliografica TEXT,
  es_global BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.protocolos_clinicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver protocolos" ON public.protocolos_clinicos FOR SELECT TO authenticated
  USING (es_global = true OR public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Gestionar protocolos" ON public.protocolos_clinicos FOR ALL TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()) OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id)))
  WITH CHECK (public.is_admin_or_coordinador(auth.uid()) OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id)));

CREATE TABLE public.protocolos_aplicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  protocolo_id UUID NOT NULL REFERENCES public.protocolos_clinicos(id),
  paciente_id UUID NOT NULL,
  iniciado_por UUID,
  fecha_inicio TIMESTAMPTZ DEFAULT now(),
  fecha_fin TIMESTAMPTZ,
  estado TEXT DEFAULT 'activo',
  paso_actual INTEGER DEFAULT 0,
  pasos_completados JSONB DEFAULT '[]'::jsonb,
  observaciones TEXT,
  resultado TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.protocolos_aplicaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aplicaciones del workspace" ON public.protocolos_aplicaciones FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TABLE public.catalogo_cie10 (
  codigo TEXT PRIMARY KEY,
  descripcion TEXT NOT NULL,
  categoria TEXT,
  capitulo TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.catalogo_cie10 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura CIE-10" ON public.catalogo_cie10 FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin CIE-10" ON public.catalogo_cie10 FOR ALL TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid())) WITH CHECK (public.is_admin_or_coordinador(auth.uid()));
CREATE INDEX idx_cie10_desc ON public.catalogo_cie10 USING gin(to_tsvector('spanish', descripcion));

CREATE TABLE public.catalogo_cpt (
  codigo TEXT PRIMARY KEY,
  descripcion TEXT NOT NULL,
  categoria TEXT,
  tarifa_referencia NUMERIC(12,2),
  unidades_rvu NUMERIC(8,2),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.catalogo_cpt ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura CPT" ON public.catalogo_cpt FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin CPT" ON public.catalogo_cpt FOR ALL TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid())) WITH CHECK (public.is_admin_or_coordinador(auth.uid()));
CREATE INDEX idx_cpt_desc ON public.catalogo_cpt USING gin(to_tsvector('spanish', descripcion));

CREATE TABLE public.catalogo_medicamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE,
  nombre_comercial TEXT NOT NULL,
  principio_activo TEXT NOT NULL,
  concentracion TEXT,
  forma_farmaceutica TEXT,
  via_administracion TEXT,
  laboratorio TEXT,
  grupo_terapeutico TEXT,
  requiere_receta BOOLEAN DEFAULT true,
  controlado BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.catalogo_medicamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura meds" ON public.catalogo_medicamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin meds" ON public.catalogo_medicamentos FOR ALL TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid())) WITH CHECK (public.is_admin_or_coordinador(auth.uid()));
CREATE INDEX idx_meds_pa ON public.catalogo_medicamentos(principio_activo);
CREATE INDEX idx_meds_nom ON public.catalogo_medicamentos USING gin(to_tsvector('spanish', nombre_comercial));

CREATE TABLE public.interacciones_farmacologicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  principio_activo_a TEXT NOT NULL,
  principio_activo_b TEXT NOT NULL,
  severidad TEXT NOT NULL CHECK (severidad IN ('leve','moderada','severa','contraindicada')),
  mecanismo TEXT,
  efecto_clinico TEXT,
  recomendacion TEXT,
  referencia TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(principio_activo_a, principio_activo_b)
);
ALTER TABLE public.interacciones_farmacologicas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura interacciones" ON public.interacciones_farmacologicas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin interacciones" ON public.interacciones_farmacologicas FOR ALL TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid())) WITH CHECK (public.is_admin_or_coordinador(auth.uid()));

CREATE TABLE public.reglas_clinicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID,
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT,
  evento_disparador TEXT NOT NULL,
  condiciones JSONB NOT NULL DEFAULT '{}'::jsonb,
  acciones JSONB NOT NULL DEFAULT '[]'::jsonb,
  severidad TEXT DEFAULT 'media' CHECK (severidad IN ('baja','media','alta','critica')),
  es_global BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  veces_disparada INTEGER DEFAULT 0,
  ultima_ejecucion TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.reglas_clinicas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver reglas" ON public.reglas_clinicas FOR SELECT TO authenticated
  USING (es_global = true OR public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admin reglas" ON public.reglas_clinicas FOR ALL TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()) OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id)))
  WITH CHECK (public.is_admin_or_coordinador(auth.uid()) OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id)));

CREATE TABLE public.reglas_ejecuciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regla_id UUID NOT NULL REFERENCES public.reglas_clinicas(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,
  paciente_id UUID,
  contexto JSONB DEFAULT '{}'::jsonb,
  resultado TEXT,
  acciones_ejecutadas JSONB DEFAULT '[]'::jsonb,
  fecha_ejecucion TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.reglas_ejecuciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ejecuciones del workspace" ON public.reglas_ejecuciones FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER trg_protocolos_updated BEFORE UPDATE ON public.protocolos_clinicos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_protocolos_apl_updated BEFORE UPDATE ON public.protocolos_aplicaciones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_reglas_updated BEFORE UPDATE ON public.reglas_clinicas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.catalogo_cie10 (codigo, descripcion, categoria, capitulo) VALUES
('I10','Hipertensión esencial (primaria)','Cardiovascular','IX'),
('E11','Diabetes mellitus tipo 2','Endocrino','IV'),
('J18','Neumonía, organismo no especificado','Respiratorio','X'),
('A41','Sepsis, no especificada','Infeccioso','I'),
('I21','Infarto agudo de miocardio','Cardiovascular','IX'),
('I63','Infarto cerebral','Neurológico','IX'),
('K35','Apendicitis aguda','Digestivo','XI'),
('N39.0','Infección de vías urinarias','Genitourinario','XIV'),
('J45','Asma','Respiratorio','X'),
('F32','Episodio depresivo','Psiquiátrico','V')
ON CONFLICT DO NOTHING;

INSERT INTO public.catalogo_cpt (codigo, descripcion, categoria, tarifa_referencia) VALUES
('99213','Consulta médica establecida nivel 3','Evaluación',1500),
('99214','Consulta médica establecida nivel 4','Evaluación',2200),
('99281','Visita de emergencia nivel 1','Emergencia',1200),
('93000','Electrocardiograma completo','Cardiología',800),
('80050','Panel metabólico general','Laboratorio',1800),
('71045','Radiografía de tórax','Imagenología',1500),
('45378','Colonoscopía diagnóstica','Procedimiento',18000),
('29881','Artroscopía de rodilla','Cirugía',35000)
ON CONFLICT DO NOTHING;

INSERT INTO public.catalogo_medicamentos (nombre_comercial, principio_activo, concentracion, forma_farmaceutica, via_administracion, grupo_terapeutico) VALUES
('Amoxil','Amoxicilina','500mg','Cápsula','Oral','Antibiótico'),
('Aspirina','Ácido acetilsalicílico','100mg','Tableta','Oral','Antiagregante'),
('Warfarina','Warfarina','5mg','Tableta','Oral','Anticoagulante'),
('Metformina','Metformina','850mg','Tableta','Oral','Antidiabético'),
('Losartán','Losartán','50mg','Tableta','Oral','Antihipertensivo'),
('Omeprazol','Omeprazol','20mg','Cápsula','Oral','IBP'),
('Ibuprofeno','Ibuprofeno','400mg','Tableta','Oral','AINE'),
('Clopidogrel','Clopidogrel','75mg','Tableta','Oral','Antiagregante'),
('Simvastatina','Simvastatina','20mg','Tableta','Oral','Hipolipemiante'),
('Tramadol','Tramadol','50mg','Cápsula','Oral','Analgésico opioide')
ON CONFLICT DO NOTHING;

INSERT INTO public.interacciones_farmacologicas (principio_activo_a, principio_activo_b, severidad, mecanismo, efecto_clinico, recomendacion) VALUES
('Warfarina','Ácido acetilsalicílico','severa','Sinergia antiagregante/anticoagulante','Riesgo elevado de sangrado','Evitar o monitorizar INR'),
('Warfarina','Ibuprofeno','severa','Inhibición plaquetaria + anticoagulación','Sangrado GI','Evitar; usar paracetamol'),
('Clopidogrel','Omeprazol','moderada','Inhibición CYP2C19','Reducción del efecto antiagregante','Preferir pantoprazol'),
('Tramadol','Warfarina','moderada','Aumenta efecto anticoagulante','Riesgo de sangrado','Monitorizar INR'),
('Simvastatina','Amoxicilina','leve','Posible interferencia metabólica','Sin relevancia clínica','Monitorización estándar')
ON CONFLICT DO NOTHING;

INSERT INTO public.protocolos_clinicos (codigo, nombre, especialidad, categoria, descripcion, pasos, es_global, evidencia_nivel) VALUES
('PROT-SEPSIS-1H','Bundle de Sepsis 1 Hora','emergencias','sepsis','Surviving Sepsis Campaign - bundle 1h',
 '[{"orden":1,"accion":"Medir lactato sérico"},{"orden":2,"accion":"Hemocultivos antes de antibióticos"},{"orden":3,"accion":"Antibiótico amplio espectro"},{"orden":4,"accion":"Cristaloides 30 ml/kg"},{"orden":5,"accion":"Vasopresores si MAP <65"}]'::jsonb, true, 'IA'),
('PROT-IAM-STEMI','Manejo IAM con elevación ST','cardiologia','cardiovascular','SCA con elevación del ST',
 '[{"orden":1,"accion":"ECG 12 derivaciones <10 min"},{"orden":2,"accion":"AAS 300mg masticable"},{"orden":3,"accion":"Clopidogrel carga 600mg"},{"orden":4,"accion":"Activar hemodinamia"},{"orden":5,"accion":"PCI primaria <90 min"}]'::jsonb, true, 'IA'),
('PROT-ACV-AGUDO','ACV isquémico agudo','neurologia','cerebrovascular','Activación código ictus',
 '[{"orden":1,"accion":"NIHSS al ingreso"},{"orden":2,"accion":"TC cráneo sin contraste <25 min"},{"orden":3,"accion":"Glucemia, INR, plaquetas"},{"orden":4,"accion":"Trombolisis tPA si <4.5h"},{"orden":5,"accion":"Trombectomía si oclusión gran vaso"}]'::jsonb, true, 'IA')
ON CONFLICT DO NOTHING;

INSERT INTO public.reglas_clinicas (codigo, nombre, descripcion, categoria, evento_disparador, condiciones, acciones, severidad, es_global) VALUES
('REGLA-SIRS','Detección SIRS/Sepsis','Alerta cuando paciente cumple ≥2 criterios SIRS','sepsis','signos_vitales_actualizados',
 '{"criterios":[{"campo":"temperatura","op":">","valor":38},{"campo":"fc","op":">","valor":90},{"campo":"fr","op":">","valor":20}],"minimo_cumplir":2}'::jsonb,
 '[{"tipo":"crear_alerta","severidad":"alta","mensaje":"Posible SIRS - evaluar sepsis"},{"tipo":"sugerir_protocolo","protocolo":"PROT-SEPSIS-1H"}]'::jsonb, 'alta', true),
('REGLA-VAL-CRITICO-K','Potasio crítico','Alerta para hiper/hipokalemia severa','laboratorio','resultado_laboratorio',
 '{"analito":"potasio","rango_critico":{"min":3.0,"max":6.0}}'::jsonb,
 '[{"tipo":"crear_alerta","severidad":"critica","mensaje":"Potasio fuera de rango crítico"},{"tipo":"notificar","destino":"medico_tratante"}]'::jsonb, 'critica', true),
('REGLA-INTERACCION-MED','Interacción medicamentosa severa','Alerta al recetar meds con interacción severa','farmacologia','receta_creada',
 '{"verificar":"interacciones_farmacologicas","severidad_minima":"severa"}'::jsonb,
 '[{"tipo":"crear_alerta","severidad":"alta","mensaje":"Interacción medicamentosa severa"},{"tipo":"requerir_confirmacion"}]'::jsonb, 'alta', true)
ON CONFLICT DO NOTHING;