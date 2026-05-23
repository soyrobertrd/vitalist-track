
-- ============ SERVICIOS ============
CREATE TABLE IF NOT EXISTS public.servicios_catalogo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  codigo text,
  nombre text NOT NULL,
  modalidad text NOT NULL DEFAULT 'consulta',
  duracion_min int DEFAULT 30,
  precio_referencia numeric(12,2) DEFAULT 0,
  descripcion text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.servicios_catalogo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "srv_cat_sel" ON public.servicios_catalogo FOR SELECT TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "srv_cat_mod" ON public.servicios_catalogo FOR ALL TO authenticated USING (public.is_workspace_admin(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));
CREATE TRIGGER trg_srv_cat_upd BEFORE UPDATE ON public.servicios_catalogo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.profesional_servicios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  profesional_id uuid NOT NULL REFERENCES public.personal_salud(id) ON DELETE CASCADE,
  servicio_id uuid NOT NULL REFERENCES public.servicios_catalogo(id) ON DELETE CASCADE,
  precio numeric(12,2),
  comision_pct numeric(5,2) DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profesional_id, servicio_id)
);
ALTER TABLE public.profesional_servicios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prof_srv_sel" ON public.profesional_servicios FOR SELECT TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "prof_srv_mod" ON public.profesional_servicios FOR ALL TO authenticated USING (public.is_workspace_admin(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE TABLE IF NOT EXISTS public.profesional_ubicaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  profesional_id uuid NOT NULL REFERENCES public.personal_salud(id) ON DELETE CASCADE,
  sucursal_id uuid,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profesional_ubicaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prof_ubic_sel" ON public.profesional_ubicaciones FOR SELECT TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "prof_ubic_mod" ON public.profesional_ubicaciones FOR ALL TO authenticated USING (public.is_workspace_admin(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));

-- ============ CREDENCIALES ============
CREATE TABLE IF NOT EXISTS public.credenciales_profesionales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  profesional_id uuid NOT NULL REFERENCES public.personal_salud(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  numero text,
  autoridad text,
  fecha_emision date,
  fecha_vencimiento date,
  archivo_url text,
  verificado boolean NOT NULL DEFAULT false,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.credenciales_profesionales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cred_sel" ON public.credenciales_profesionales FOR SELECT TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "cred_mod" ON public.credenciales_profesionales FOR ALL TO authenticated USING (public.is_workspace_admin(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));
CREATE TRIGGER trg_cred_upd BEFORE UPDATE ON public.credenciales_profesionales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ TARIFAS POR ARS ============
CREATE TABLE IF NOT EXISTS public.tarifas_profesional_ars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  profesional_id uuid NOT NULL REFERENCES public.personal_salud(id) ON DELETE CASCADE,
  servicio_id uuid NOT NULL REFERENCES public.servicios_catalogo(id) ON DELETE CASCADE,
  aseguradora_id uuid,
  precio numeric(12,2) NOT NULL DEFAULT 0,
  comision_pct numeric(5,2) DEFAULT 0,
  vigente_desde date DEFAULT CURRENT_DATE,
  vigente_hasta date,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tarifas_profesional_ars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tar_par_sel" ON public.tarifas_profesional_ars FOR SELECT TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "tar_par_mod" ON public.tarifas_profesional_ars FOR ALL TO authenticated USING (public.is_workspace_admin(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));

-- ============ NCF / E-CF (Rep. Dominicana) ============
CREATE TABLE IF NOT EXISTS public.ncf_secuencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tipo_ncf text NOT NULL,
  serie text NOT NULL DEFAULT 'B',
  inicio bigint NOT NULL,
  fin bigint NOT NULL,
  actual bigint NOT NULL,
  fecha_vencimiento date,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ncf_secuencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ncf_sec_sel" ON public.ncf_secuencias FOR SELECT TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ncf_sec_mod" ON public.ncf_secuencias FOR ALL TO authenticated USING (public.is_workspace_admin(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE TABLE IF NOT EXISTS public.comprobantes_fiscales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  factura_id uuid REFERENCES public.facturas(id) ON DELETE SET NULL,
  ncf text NOT NULL,
  tipo_ncf text NOT NULL,
  rnc_cliente text,
  total numeric(12,2),
  itbis numeric(12,2),
  xml_url text,
  estado_dgii text NOT NULL DEFAULT 'pendiente',
  enviado_at timestamptz,
  respuesta_dgii jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.comprobantes_fiscales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cf_sel" ON public.comprobantes_fiscales FOR SELECT TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "cf_mod" ON public.comprobantes_fiscales FOR ALL TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

-- ============ VACUNAS ============
CREATE TABLE IF NOT EXISTS public.vacunas_catalogo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  enfermedad text,
  esquema_dosis int,
  edad_recomendada text,
  activo boolean NOT NULL DEFAULT true
);
ALTER TABLE public.vacunas_catalogo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vac_cat_sel" ON public.vacunas_catalogo FOR SELECT TO authenticated USING (true);
CREATE POLICY "vac_cat_mod" ON public.vacunas_catalogo FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.vacunas_catalogo (nombre, enfermedad, esquema_dosis, edad_recomendada) VALUES
('BCG','Tuberculosis',1,'Recién nacido'),
('Hepatitis B','Hepatitis B',3,'0-2-6 meses'),
('Pentavalente','Difteria-Tétanos-Tos ferina-Hib-HepB',3,'2-4-6 meses'),
('Polio (IPV/OPV)','Poliomielitis',4,'2-4-6-18 meses'),
('Rotavirus','Gastroenteritis',2,'2-4 meses'),
('Neumococo conjugada','Neumococo',3,'2-4-12 meses'),
('SRP / MMR','Sarampión-Rubéola-Paperas',2,'12 meses y 4-6 años'),
('Varicela','Varicela',2,'12 meses y 4-6 años'),
('DPT refuerzo','Difteria-Tétanos-Tos ferina',1,'4-6 años'),
('VPH','Virus Papiloma Humano',2,'9-14 años'),
('Influenza','Gripe estacional',1,'Anual'),
('COVID-19','SARS-CoV-2',2,'Según esquema'),
('Tdap (adulto)','Tétanos-Difteria-Tos ferina',1,'Cada 10 años'),
('Fiebre amarilla','Fiebre amarilla',1,'Adultos en riesgo'),
('Hepatitis A','Hepatitis A',2,'12-18 meses')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.vacunas_paciente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  vacuna_id uuid REFERENCES public.vacunas_catalogo(id),
  vacuna_nombre text NOT NULL,
  dosis int NOT NULL DEFAULT 1,
  fecha_aplicacion date NOT NULL,
  lote text,
  via text,
  sitio text,
  aplicador text,
  proxima_dosis date,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vacunas_paciente ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vac_pac_sel" ON public.vacunas_paciente FOR SELECT TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "vac_pac_mod" ON public.vacunas_paciente FOR ALL TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

-- ============ PROGRAMAS CRÓNICOS ============
CREATE TABLE IF NOT EXISTS public.programas_cronicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  enfermedad text,
  protocolo text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.programas_cronicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prog_cron_sel" ON public.programas_cronicos FOR SELECT TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "prog_cron_mod" ON public.programas_cronicos FOR ALL TO authenticated USING (public.is_workspace_admin(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE TABLE IF NOT EXISTS public.enrolamientos_cronicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  programa_id uuid NOT NULL REFERENCES public.programas_cronicos(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  fecha_inicio date NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin date,
  estado text NOT NULL DEFAULT 'activo',
  ultimos_controles jsonb DEFAULT '{}'::jsonb,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.enrolamientos_cronicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enr_cron_sel" ON public.enrolamientos_cronicos FOR SELECT TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "enr_cron_mod" ON public.enrolamientos_cronicos FOR ALL TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

-- ============ CONTROLES PRENATALES ============
CREATE TABLE IF NOT EXISTS public.controles_prenatales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  fum date,
  fpp date,
  semanas_gestacion int,
  numero_control int DEFAULT 1,
  fecha_control date NOT NULL DEFAULT CURRENT_DATE,
  peso numeric(5,2),
  presion_arterial text,
  altura_uterina numeric(5,2),
  frecuencia_fetal int,
  movimientos_fetales boolean,
  edemas text,
  hallazgos text,
  laboratorios jsonb DEFAULT '{}'::jsonb,
  proximo_control date,
  profesional_id uuid REFERENCES public.personal_salud(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.controles_prenatales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prenatal_sel" ON public.controles_prenatales FOR SELECT TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "prenatal_mod" ON public.controles_prenatales FOR ALL TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

-- ============ PEDIATRÍA ============
CREATE TABLE IF NOT EXISTS public.controles_pediatricos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  edad_meses int,
  peso_kg numeric(5,2),
  talla_cm numeric(5,2),
  perimetro_cefalico numeric(5,2),
  imc numeric(5,2),
  percentil_peso int,
  percentil_talla int,
  percentil_pc int,
  hitos_desarrollo text,
  observaciones text,
  profesional_id uuid REFERENCES public.personal_salud(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.controles_pediatricos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ped_sel" ON public.controles_pediatricos FOR SELECT TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ped_mod" ON public.controles_pediatricos FOR ALL TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

-- ============ SALUD OCUPACIONAL ============
CREATE TABLE IF NOT EXISTS public.salud_ocupacional (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  empleado_paciente_id uuid REFERENCES public.pacientes(id),
  empresa text,
  cargo text,
  tipo text NOT NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  riesgos jsonb,
  conclusiones text,
  apto boolean,
  documento_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.salud_ocupacional ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ocup_sel" ON public.salud_ocupacional FOR SELECT TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ocup_mod" ON public.salud_ocupacional FOR ALL TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

-- ============ IA CLÍNICA (esqueleto, sin integración) ============
CREATE TABLE IF NOT EXISTS public.ia_configuracion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
  habilitada boolean NOT NULL DEFAULT false,
  modelo_preferido text,
  resumenes_automaticos boolean NOT NULL DEFAULT false,
  scribe_activo boolean NOT NULL DEFAULT false,
  interacciones_tiempo_real boolean NOT NULL DEFAULT false,
  consentimiento_paciente_requerido boolean NOT NULL DEFAULT true,
  notas text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ia_configuracion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ia_cfg_sel" ON public.ia_configuracion FOR SELECT TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ia_cfg_mod" ON public.ia_configuracion FOR ALL TO authenticated USING (public.is_workspace_admin(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE TABLE IF NOT EXISTS public.ia_solicitudes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  paciente_id uuid REFERENCES public.pacientes(id),
  tipo text NOT NULL,
  prompt text,
  contexto jsonb DEFAULT '{}'::jsonb,
  respuesta text,
  estado text NOT NULL DEFAULT 'pendiente',
  modelo text,
  error_msg text,
  created_at timestamptz NOT NULL DEFAULT now(),
  procesado_at timestamptz
);
ALTER TABLE public.ia_solicitudes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ia_sol_sel" ON public.ia_solicitudes FOR SELECT TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ia_sol_mod" ON public.ia_solicitudes FOR ALL TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

-- ============ REPORTES REGULATORIOS ============
CREATE TABLE IF NOT EXISTS public.enfermedades_notificables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE,
  nombre text NOT NULL,
  categoria text,
  inmediata boolean NOT NULL DEFAULT false,
  activo boolean NOT NULL DEFAULT true
);
ALTER TABLE public.enfermedades_notificables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enf_not_sel" ON public.enfermedades_notificables FOR SELECT TO authenticated USING (true);
CREATE POLICY "enf_not_mod" ON public.enfermedades_notificables FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.enfermedades_notificables (codigo, nombre, categoria, inmediata) VALUES
('A00','Cólera','Bacteriana',true),
('A09','Diarrea aguda','Gastrointestinal',false),
('A37','Tos ferina','Respiratoria',true),
('A39','Enfermedad meningocócica','Bacteriana',true),
('A75','Tifus exantemático','Bacteriana',true),
('A90','Dengue','Vectorial',true),
('A92','Chikungunya','Vectorial',true),
('A98','Fiebre hemorrágica','Viral',true),
('B05','Sarampión','Viral',true),
('B06','Rubéola','Viral',true),
('B16','Hepatitis B aguda','Viral',false),
('B20','VIH/SIDA','Viral',false),
('B50','Malaria','Parasitaria',true),
('J09','Influenza pandémica','Respiratoria',true),
('U07','COVID-19','Viral',true),
('Y58','EAVI - eventos post vacunación','Vigilancia',true)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.reportes_regulatorios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  periodo_inicio date,
  periodo_fin date,
  contenido jsonb DEFAULT '{}'::jsonb,
  estado text NOT NULL DEFAULT 'borrador',
  generado_por uuid REFERENCES auth.users(id),
  enviado_at timestamptz,
  archivo_url text,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reportes_regulatorios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reg_sel" ON public.reportes_regulatorios FOR SELECT TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "reg_mod" ON public.reportes_regulatorios FOR ALL TO authenticated USING (public.is_workspace_admin(auth.uid(), workspace_id)) WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));
