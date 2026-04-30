
-- =============================================
-- FASE N: Recovery Care, Aesthetic Pro, DentalCare, VisionCare
-- =============================================

-- =============== RECOVERY CARE ===============

CREATE TABLE public.habitaciones_recovery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo text NOT NULL DEFAULT 'privada' CHECK (tipo IN ('privada','compartida','suite','vip')),
  capacidad int DEFAULT 1,
  piso text,
  estado text NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible','ocupada','limpieza','mantenimiento','reservada')),
  tarifa_diaria numeric(10,2),
  amenidades jsonb DEFAULT '[]'::jsonb,
  notas text,
  activa boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.planes_recovery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  dias int NOT NULL DEFAULT 3,
  categoria text DEFAULT 'basico' CHECK (categoria IN ('basico','premium','vip','personalizado')),
  servicios_incluidos jsonb DEFAULT '[]'::jsonb,
  precio numeric(12,2),
  moneda text DEFAULT 'USD',
  activo boolean DEFAULT true,
  descripcion text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pacientes_recovery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  numero text NOT NULL DEFAULT '',
  paciente_id uuid REFERENCES public.pacientes(id),
  nombre_paciente text,
  tipo_cirugia text,
  fecha_cirugia date,
  medico_tratante text,
  clinica_origen text,
  pais_origen text DEFAULT 'RD',
  idioma text DEFAULT 'es',
  fecha_ingreso timestamptz,
  fecha_salida_estimada timestamptz,
  fecha_salida_real timestamptz,
  habitacion_id uuid REFERENCES public.habitaciones_recovery(id),
  plan_id uuid REFERENCES public.planes_recovery(id),
  riesgos_medicos text,
  medicacion_actual text,
  alergias text,
  contacto_familiar text,
  telefono_familiar text,
  acompanante_nombre text,
  acompanante_telefono text,
  turismo_medico boolean DEFAULT false,
  recogida_aeropuerto boolean DEFAULT false,
  hotel_previo text,
  hotel_posterior text,
  concierge_notas text,
  estado text NOT NULL DEFAULT 'reservado' CHECK (estado IN ('reservado','ingresado','en_recuperacion','alta','cancelado')),
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.seguimiento_diario_recovery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_recovery_id uuid NOT NULL REFERENCES public.pacientes_recovery(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  turno text DEFAULT 'am' CHECK (turno IN ('am','pm','noche')),
  enfermera_id uuid REFERENCES public.personal_salud(id),
  temperatura numeric(4,1),
  presion_sistolica int,
  presion_diastolica int,
  frecuencia_cardiaca int,
  saturacion_o2 int,
  nivel_dolor int CHECK (nivel_dolor IS NULL OR (nivel_dolor >= 0 AND nivel_dolor <= 10)),
  inflamacion text CHECK (inflamacion IS NULL OR inflamacion IN ('ninguna','leve','moderada','severa')),
  drenajes text,
  curas_realizadas text,
  medicamentos_administrados jsonb DEFAULT '[]'::jsonb,
  fotos_evolucion text[] DEFAULT '{}',
  notas_enfermeria text,
  alertas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.servicios_recovery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo text NOT NULL DEFAULT 'masaje' CHECK (tipo IN ('masaje_linfatico','cura','retiro_puntos','consulta_medica','traslado_aeropuerto','traslado','lavado_ropa','terapia','alimentacion','otro')),
  duracion_minutos int,
  costo numeric(10,2),
  activo boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.agenda_servicios_recovery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_recovery_id uuid NOT NULL REFERENCES public.pacientes_recovery(id) ON DELETE CASCADE,
  servicio_id uuid REFERENCES public.servicios_recovery(id),
  personal_id uuid REFERENCES public.personal_salud(id),
  fecha_hora timestamptz NOT NULL,
  estado text NOT NULL DEFAULT 'programado' CHECK (estado IN ('programado','en_curso','completado','cancelado')),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============== AESTHETIC PRO ===============

CREATE TABLE public.leads_estetica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  numero text NOT NULL DEFAULT '',
  nombre text NOT NULL,
  telefono text,
  email text,
  origen text NOT NULL DEFAULT 'whatsapp' CHECK (origen IN ('instagram','whatsapp','meta_ads','google_ads','web','referido','llamada','otro')),
  procedimiento_interes text,
  presupuesto_estimado numeric(12,2),
  ejecutivo_id uuid REFERENCES public.personal_salud(id),
  estado text NOT NULL DEFAULT 'nuevo' CHECK (estado IN ('nuevo','contactado','cita_agendada','evaluado','presupuestado','convertido','perdido','reactivar')),
  motivo_perdida text,
  fecha_proximo_contacto timestamptz,
  notas text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.evaluaciones_esteticas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  numero text NOT NULL DEFAULT '',
  paciente_id uuid REFERENCES public.pacientes(id),
  lead_id uuid REFERENCES public.leads_estetica(id),
  evaluador_id uuid REFERENCES public.personal_salud(id),
  peso numeric(5,1),
  altura numeric(5,1),
  imc numeric(4,1),
  medidas jsonb DEFAULT '{}'::jsonb,
  fotos_antes text[] DEFAULT '{}',
  objetivos text,
  procedimiento_recomendado text,
  presupuesto numeric(12,2),
  notas_clinicas text,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','realizada','aprobada','rechazada')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.galeria_antes_despues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id),
  procedimiento text NOT NULL,
  foto_antes text,
  foto_durante text,
  foto_despues text,
  fecha_procedimiento date,
  fecha_foto_despues date,
  consentimiento_uso_imagen boolean DEFAULT false,
  publicable boolean DEFAULT false,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.procedimientos_esteticos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  categoria text NOT NULL DEFAULT 'corporal' CHECK (categoria IN ('facial','corporal','capilar','dental_estetico','invasivo','no_invasivo')),
  descripcion text,
  duracion_minutos int,
  precio_base numeric(12,2),
  requiere_anestesia boolean DEFAULT false,
  dias_recuperacion int,
  activo boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.paquetes_esteticos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  procedimientos jsonb DEFAULT '[]'::jsonb,
  precio_regular numeric(12,2),
  precio_paquete numeric(12,2),
  vigencia_hasta date,
  activo boolean DEFAULT true,
  descripcion text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.financiamiento_estetico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  numero text NOT NULL DEFAULT '',
  paciente_id uuid REFERENCES public.pacientes(id),
  procedimiento text,
  monto_total numeric(12,2) NOT NULL,
  separacion numeric(12,2) DEFAULT 0,
  numero_cuotas int DEFAULT 1,
  monto_cuota numeric(12,2),
  balance_pendiente numeric(12,2),
  estado text NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','pagado','vencido','cancelado')),
  fecha_inicio date DEFAULT CURRENT_DATE,
  proximo_pago date,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============== DENTALCARE PRO ===============

CREATE TABLE public.expedientes_dentales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  historial_medico text,
  alergias_dentales text,
  medicamentos text,
  habitos text,
  bruxismo boolean DEFAULT false,
  tratamientos_previos jsonb DEFAULT '[]'::jsonb,
  radiografias text[] DEFAULT '{}',
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(paciente_id)
);

CREATE TABLE public.planes_tratamiento_dental (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  numero text NOT NULL DEFAULT '',
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  odontologo_id uuid REFERENCES public.personal_salud(id),
  procedimientos jsonb DEFAULT '[]'::jsonb,
  fases jsonb DEFAULT '[]'::jsonb,
  presupuesto_total numeric(12,2),
  numero_cuotas int DEFAULT 1,
  monto_cuota numeric(12,2),
  aprobado boolean DEFAULT false,
  fecha_aprobacion date,
  firma_digital text,
  estado text NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','presentado','aprobado','en_progreso','completado','cancelado')),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.controles_ortodoncia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  odontologo_id uuid REFERENCES public.personal_salud(id),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  progreso_porcentaje int DEFAULT 0,
  cambio_ligas boolean DEFAULT false,
  tipo_arco text,
  ajustes_realizados text,
  fotos text[] DEFAULT '{}',
  dolor_reportado int CHECK (dolor_reportado IS NULL OR (dolor_reportado >= 0 AND dolor_reportado <= 10)),
  proximo_control date,
  pago_mensual numeric(10,2),
  pagado boolean DEFAULT false,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ordenes_laboratorio_dental (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  numero text NOT NULL DEFAULT '',
  paciente_id uuid REFERENCES public.pacientes(id),
  odontologo_id uuid REFERENCES public.personal_salud(id),
  tipo text NOT NULL DEFAULT 'corona' CHECK (tipo IN ('corona','protesis','retenedor','ferula','puente','implante','carillla','incrustacion','otro')),
  diente text,
  material text,
  color text,
  laboratorio text,
  costo numeric(10,2),
  fecha_envio date,
  fecha_entrega_estimada date,
  fecha_entrega_real date,
  estado text NOT NULL DEFAULT 'solicitada' CHECK (estado IN ('solicitada','en_proceso','lista','entregada','devuelta')),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============== VISIONCARE PRO ===============

CREATE TABLE public.expedientes_visuales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  agudeza_od text,
  agudeza_oi text,
  presion_intraocular_od numeric(4,1),
  presion_intraocular_oi numeric(4,1),
  antecedentes_oculares jsonb DEFAULT '[]'::jsonb,
  diabetes boolean DEFAULT false,
  hipertension boolean DEFAULT false,
  usa_lentes boolean DEFAULT false,
  tipo_lentes_actual text,
  ultima_revision date,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(paciente_id)
);

CREATE TABLE public.recetas_oftalmicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  numero text NOT NULL DEFAULT '',
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  oftalmologo_id uuid REFERENCES public.personal_salud(id),
  od_esfera numeric(5,2),
  od_cilindro numeric(5,2),
  od_eje int,
  od_add numeric(4,2),
  od_prisma numeric(4,2),
  oi_esfera numeric(5,2),
  oi_cilindro numeric(5,2),
  oi_eje int,
  oi_add numeric(4,2),
  oi_prisma numeric(4,2),
  distancia_pupilar numeric(4,1),
  tipo_lente_recomendado text,
  observaciones text,
  vigencia_hasta date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.inventario_optica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'montura' CHECK (tipo IN ('montura','lente_oftalmico','lente_contacto','lente_sol','accesorio','solucion','estuche')),
  marca text,
  modelo text,
  color text,
  tamano text,
  material text,
  genero text CHECK (genero IS NULL OR genero IN ('unisex','masculino','femenino','infantil')),
  codigo_barras text,
  costo numeric(10,2),
  precio_venta numeric(10,2),
  stock int DEFAULT 0,
  stock_minimo int DEFAULT 2,
  proveedor text,
  activo boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ordenes_trabajo_optica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  numero text NOT NULL DEFAULT '',
  receta_id uuid REFERENCES public.recetas_oftalmicas(id),
  paciente_id uuid REFERENCES public.pacientes(id),
  montura_id uuid REFERENCES public.inventario_optica(id),
  tipo_lente text,
  tratamientos text[] DEFAULT '{}',
  laboratorio text,
  costo_laboratorio numeric(10,2),
  precio_total numeric(10,2),
  fecha_envio date,
  fecha_entrega_estimada date,
  fecha_entrega_real date,
  estado text NOT NULL DEFAULT 'solicitada' CHECK (estado IN ('solicitada','en_laboratorio','lista','entregada','devuelta')),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============== RLS FOR ALL ===============

ALTER TABLE public.habitaciones_recovery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes_recovery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes_recovery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seguimiento_diario_recovery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios_recovery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_servicios_recovery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_estetica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluaciones_esteticas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galeria_antes_despues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedimientos_esteticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paquetes_esteticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financiamiento_estetico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expedientes_dentales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes_tratamiento_dental ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controles_ortodoncia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_laboratorio_dental ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expedientes_visuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recetas_oftalmicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_optica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_trabajo_optica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hab_rec_ws" ON public.habitaciones_recovery FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "planes_rec_ws" ON public.planes_recovery FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "pac_rec_ws" ON public.pacientes_recovery FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "seg_rec_ws" ON public.seguimiento_diario_recovery FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "serv_rec_ws" ON public.servicios_recovery FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "agenda_rec_ws" ON public.agenda_servicios_recovery FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "leads_est_ws" ON public.leads_estetica FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "eval_est_ws" ON public.evaluaciones_esteticas FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "galeria_ws" ON public.galeria_antes_despues FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "proc_est_ws" ON public.procedimientos_esteticos FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "paq_est_ws" ON public.paquetes_esteticos FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "fin_est_ws" ON public.financiamiento_estetico FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "exp_dent_ws" ON public.expedientes_dentales FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "plan_dent_ws" ON public.planes_tratamiento_dental FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ctrl_orto_ws" ON public.controles_ortodoncia FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ord_lab_dent_ws" ON public.ordenes_laboratorio_dental FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "exp_vis_ws" ON public.expedientes_visuales FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "rec_oft_ws" ON public.recetas_oftalmicas FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "inv_opt_ws" ON public.inventario_optica FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ord_opt_ws" ON public.ordenes_trabajo_optica FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

-- =============== AUTO-NUMBERING ===============

CREATE OR REPLACE FUNCTION public.generar_numero_recovery()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.pacientes_recovery WHERE numero LIKE 'RCV-' || v_year || '-%';
    NEW.numero := 'RCV-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.generar_numero_lead_estetica()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.leads_estetica WHERE numero LIKE 'AES-' || v_year || '-%';
    NEW.numero := 'AES-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.generar_numero_eval_estetica()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.evaluaciones_esteticas WHERE numero LIKE 'EVA-' || v_year || '-%';
    NEW.numero := 'EVA-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.generar_numero_financiamiento()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.financiamiento_estetico WHERE numero LIKE 'FIN-' || v_year || '-%';
    NEW.numero := 'FIN-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.generar_numero_plan_dental()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.planes_tratamiento_dental WHERE numero LIKE 'PTD-' || v_year || '-%';
    NEW.numero := 'PTD-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.generar_numero_orden_dental()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.ordenes_laboratorio_dental WHERE numero LIKE 'OLD-' || v_year || '-%';
    NEW.numero := 'OLD-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.generar_numero_receta_oft()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.recetas_oftalmicas WHERE numero LIKE 'ROF-' || v_year || '-%';
    NEW.numero := 'ROF-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.generar_numero_orden_optica()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.ordenes_trabajo_optica WHERE numero LIKE 'OPT-' || v_year || '-%';
    NEW.numero := 'OPT-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

-- Triggers
CREATE TRIGGER trg_num_recovery BEFORE INSERT ON public.pacientes_recovery FOR EACH ROW EXECUTE FUNCTION public.generar_numero_recovery();
CREATE TRIGGER trg_num_lead_est BEFORE INSERT ON public.leads_estetica FOR EACH ROW EXECUTE FUNCTION public.generar_numero_lead_estetica();
CREATE TRIGGER trg_num_eval_est BEFORE INSERT ON public.evaluaciones_esteticas FOR EACH ROW EXECUTE FUNCTION public.generar_numero_eval_estetica();
CREATE TRIGGER trg_num_fin_est BEFORE INSERT ON public.financiamiento_estetico FOR EACH ROW EXECUTE FUNCTION public.generar_numero_financiamiento();
CREATE TRIGGER trg_num_plan_dental BEFORE INSERT ON public.planes_tratamiento_dental FOR EACH ROW EXECUTE FUNCTION public.generar_numero_plan_dental();
CREATE TRIGGER trg_num_ord_dental BEFORE INSERT ON public.ordenes_laboratorio_dental FOR EACH ROW EXECUTE FUNCTION public.generar_numero_orden_dental();
CREATE TRIGGER trg_num_rec_oft BEFORE INSERT ON public.recetas_oftalmicas FOR EACH ROW EXECUTE FUNCTION public.generar_numero_receta_oft();
CREATE TRIGGER trg_num_ord_opt BEFORE INSERT ON public.ordenes_trabajo_optica FOR EACH ROW EXECUTE FUNCTION public.generar_numero_orden_optica();

-- Updated_at triggers
CREATE TRIGGER upd_hab_rec BEFORE UPDATE ON public.habitaciones_recovery FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER upd_planes_rec BEFORE UPDATE ON public.planes_recovery FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER upd_pac_rec BEFORE UPDATE ON public.pacientes_recovery FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER upd_agenda_rec BEFORE UPDATE ON public.agenda_servicios_recovery FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER upd_leads_est BEFORE UPDATE ON public.leads_estetica FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER upd_eval_est BEFORE UPDATE ON public.evaluaciones_esteticas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER upd_proc_est BEFORE UPDATE ON public.procedimientos_esteticos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER upd_paq_est BEFORE UPDATE ON public.paquetes_esteticos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER upd_fin_est BEFORE UPDATE ON public.financiamiento_estetico FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER upd_exp_dent BEFORE UPDATE ON public.expedientes_dentales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER upd_plan_dent BEFORE UPDATE ON public.planes_tratamiento_dental FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER upd_ord_dent BEFORE UPDATE ON public.ordenes_laboratorio_dental FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER upd_exp_vis BEFORE UPDATE ON public.expedientes_visuales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER upd_inv_opt BEFORE UPDATE ON public.inventario_optica FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER upd_ord_opt BEFORE UPDATE ON public.ordenes_trabajo_optica FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
