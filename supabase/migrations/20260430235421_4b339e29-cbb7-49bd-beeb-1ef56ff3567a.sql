-- =============================================
-- DENTAL ENHANCEMENTS
-- =============================================

-- Dental chairs/stations
CREATE TABLE public.sillones_dentales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  nombre text NOT NULL,
  ubicacion text,
  equipamiento text[],
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.sillones_dentales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_sillones" ON public.sillones_dentales FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Professional commissions
CREATE TABLE public.comisiones_profesional (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  profesional_id uuid REFERENCES public.personal_salud(id) ON DELETE CASCADE NOT NULL,
  tipo_procedimiento text,
  porcentaje numeric(5,2) DEFAULT 0,
  monto_fijo numeric(12,2) DEFAULT 0,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.comisiones_profesional ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_comisiones" ON public.comisiones_profesional FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Smile quotes / budgets (antes/después, firma)
CREATE TABLE public.presupuestos_sonrisa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  numero text,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  profesional_id uuid REFERENCES public.personal_salud(id) ON DELETE SET NULL,
  procedimientos jsonb DEFAULT '[]',
  foto_antes_url text,
  foto_despues_url text,
  simulacion_ia_url text,
  monto_total numeric(12,2) DEFAULT 0,
  estado text DEFAULT 'borrador' CHECK (estado IN ('borrador','presentado','aprobado','rechazado','en_progreso','completado')),
  firma_digital_url text,
  fecha_firma timestamptz,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.presupuestos_sonrisa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_presupuestos_sonrisa" ON public.presupuestos_sonrisa FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE OR REPLACE FUNCTION public.generar_numero_presupuesto_sonrisa()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.presupuestos_sonrisa WHERE numero LIKE 'PSR-' || v_year || '-%';
    NEW.numero := 'PSR-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_numero_presupuesto_sonrisa BEFORE INSERT ON public.presupuestos_sonrisa FOR EACH ROW EXECUTE FUNCTION public.generar_numero_presupuesto_sonrisa();

-- Loyalty/marketing reminders (dental + optica)
CREATE TABLE public.recordatorios_fidelizacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE CASCADE NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('limpieza_semestral','reactivacion','control_ortodoncia','examen_anual','promo','upgrade','cumpleanos','referido')),
  canal text DEFAULT 'whatsapp' CHECK (canal IN ('whatsapp','email','sms','llamada')),
  proxima_fecha date NOT NULL,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente','enviado','respondido','cancelado')),
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.recordatorios_fidelizacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_recordatorios_fid" ON public.recordatorios_fidelizacion FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

-- =============================================
-- ESTÉTICA ENHANCEMENTS
-- =============================================

-- Treatment cabins/rooms
CREATE TABLE public.cabinas_estetica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  nombre text NOT NULL,
  tipo text CHECK (tipo IN ('facial','corporal','laser','cirugia','mixta')),
  equipos text[],
  capacidad int DEFAULT 1,
  estado text DEFAULT 'disponible' CHECK (estado IN ('disponible','ocupada','mantenimiento','reservada')),
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.cabinas_estetica ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_cabinas" ON public.cabinas_estetica FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Memberships
CREATE TABLE public.membresias_estetica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  numero text,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  plan_nombre text NOT NULL,
  tipo text DEFAULT 'mensual' CHECK (tipo IN ('mensual','trimestral','semestral','anual','paquete')),
  sesiones_incluidas int DEFAULT 0,
  sesiones_usadas int DEFAULT 0,
  precio numeric(12,2) DEFAULT 0,
  fecha_inicio date NOT NULL,
  fecha_fin date,
  estado text DEFAULT 'activa' CHECK (estado IN ('activa','pausada','vencida','cancelada')),
  auto_renovar boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.membresias_estetica ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_membresias" ON public.membresias_estetica FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE OR REPLACE FUNCTION public.generar_numero_membresia()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.membresias_estetica WHERE numero LIKE 'MBR-' || v_year || '-%';
    NEW.numero := 'MBR-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_numero_membresia BEFORE INSERT ON public.membresias_estetica FOR EACH ROW EXECUTE FUNCTION public.generar_numero_membresia();

-- Evolution photos
CREATE TABLE public.fotos_evolucion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE CASCADE NOT NULL,
  procedimiento text,
  tipo text NOT NULL CHECK (tipo IN ('antes','durante','despues')),
  foto_url text NOT NULL,
  angulo text,
  notas text,
  consentimiento_uso boolean DEFAULT false,
  fecha_foto date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.fotos_evolucion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_fotos_evol" ON public.fotos_evolucion FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Promotions
CREATE TABLE public.promociones_estetica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  tipo_descuento text DEFAULT 'porcentaje' CHECK (tipo_descuento IN ('porcentaje','monto_fijo','paquete')),
  valor_descuento numeric(12,2) DEFAULT 0,
  codigo text,
  vigencia_inicio date,
  vigencia_fin date,
  usos_maximos int,
  usos_actuales int DEFAULT 0,
  activa boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.promociones_estetica ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_promos" ON public.promociones_estetica FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

-- =============================================
-- RECOVERY ENHANCEMENTS
-- =============================================

-- Room reservations
CREATE TABLE public.reservas_recovery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  numero text,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  habitacion_id uuid,
  paquete text CHECK (paquete IN ('basico_3','premium_5','premium_7','vip_10','custom')),
  check_in date NOT NULL,
  check_out date,
  noches int,
  acompanante_nombre text,
  acompanante_telefono text,
  tipo_cirugia text,
  medico_tratante text,
  pais_origen text,
  idioma text DEFAULT 'español',
  requiere_traductor boolean DEFAULT false,
  traslado_aeropuerto boolean DEFAULT false,
  estado text DEFAULT 'reservada' CHECK (estado IN ('reservada','confirmada','check_in','en_estadia','check_out','cancelada','no_show')),
  deposito numeric(12,2) DEFAULT 0,
  total numeric(12,2) DEFAULT 0,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.reservas_recovery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_reservas_rec" ON public.reservas_recovery FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE OR REPLACE FUNCTION public.generar_numero_reserva_recovery()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.reservas_recovery WHERE numero LIKE 'RSV-' || v_year || '-%';
    NEW.numero := 'RSV-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_numero_reserva_recovery BEFORE INSERT ON public.reservas_recovery FOR EACH ROW EXECUTE FUNCTION public.generar_numero_reserva_recovery();

-- Emergency alerts
CREATE TABLE public.alertas_emergencia_recovery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  reserva_id uuid REFERENCES public.reservas_recovery(id) ON DELETE SET NULL,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('caida','fiebre','sangrado','dolor_severo','reaccion_alergica','dificultad_respirar','otro')),
  severidad text DEFAULT 'media' CHECK (severidad IN ('baja','media','alta','critica')),
  descripcion text,
  reportado_por uuid,
  resuelta boolean DEFAULT false,
  resolucion text,
  resuelta_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.alertas_emergencia_recovery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_alertas_emerg" ON public.alertas_emergencia_recovery FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Concierge services
CREATE TABLE public.servicios_concierge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  reserva_id uuid REFERENCES public.reservas_recovery(id) ON DELETE CASCADE NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('traslado_aeropuerto','chofer','traductor','compras','excursion','spa','otro')),
  fecha date NOT NULL,
  hora time,
  detalles text,
  proveedor text,
  costo numeric(12,2) DEFAULT 0,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente','confirmado','en_curso','completado','cancelado')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.servicios_concierge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_concierge" ON public.servicios_concierge FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

-- =============================================
-- ÓPTICA ENHANCEMENTS
-- =============================================

-- Optical combos/bundles
CREATE TABLE public.combos_optica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  incluye_montura boolean DEFAULT true,
  incluye_lentes boolean DEFAULT true,
  tratamientos_incluidos text[],
  precio_regular numeric(12,2) DEFAULT 0,
  precio_combo numeric(12,2) DEFAULT 0,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.combos_optica ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_combos_opt" ON public.combos_optica FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Warranties
CREATE TABLE public.garantias_optica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  orden_id uuid,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('montura','lentes','tratamiento','completa')),
  duracion_meses int DEFAULT 12,
  fecha_inicio date DEFAULT CURRENT_DATE,
  fecha_vencimiento date,
  estado text DEFAULT 'vigente' CHECK (estado IN ('vigente','reclamada','vencida','anulada')),
  reclamacion_descripcion text,
  reclamacion_fecha timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.garantias_optica ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_garantias_opt" ON public.garantias_optica FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));