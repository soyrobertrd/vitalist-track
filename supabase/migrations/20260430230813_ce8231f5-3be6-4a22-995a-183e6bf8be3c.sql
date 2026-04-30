
-- =============================================
-- FASE M: Residuos, Seguridad Física, Lavandería, Trabajo Social
-- =============================================

-- =============== GESTIÓN DE RESIDUOS ===============

CREATE TABLE public.residuos_hospitalarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  numero text NOT NULL DEFAULT '',
  tipo text NOT NULL DEFAULT 'comun' CHECK (tipo IN ('biologico_infeccioso','punzocortante','quimico','farmaceutico','radioactivo','comun','anatomopatologico')),
  peso_kg numeric(8,2),
  volumen_litros numeric(8,2),
  area_generadora text,
  responsable_id uuid REFERENCES public.personal_salud(id),
  estado text NOT NULL DEFAULT 'generado' CHECK (estado IN ('generado','recolectado','almacenado','transportado','tratado','dispuesto')),
  contenedor text,
  fecha_generacion timestamptz DEFAULT now(),
  fecha_recoleccion timestamptz,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.manifiestos_residuos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  numero text NOT NULL DEFAULT '',
  transportista text NOT NULL,
  destino text NOT NULL,
  vehiculo_placa text,
  conductor text,
  peso_total_kg numeric(10,2),
  tipos_residuo text[] DEFAULT '{}',
  fecha_salida timestamptz,
  fecha_entrega timestamptz,
  verificado boolean DEFAULT false,
  verificado_por text,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.residuos_hospitalarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manifiestos_residuos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "residuos_workspace" ON public.residuos_hospitalarios FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "manifiestos_workspace" ON public.manifiestos_residuos FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE OR REPLACE FUNCTION public.generar_numero_residuo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.residuos_hospitalarios WHERE numero LIKE 'RES-' || v_year || '-%';
    NEW.numero := 'RES-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.generar_numero_manifiesto()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.manifiestos_residuos WHERE numero LIKE 'MAN-' || v_year || '-%';
    NEW.numero := 'MAN-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_numero_residuo BEFORE INSERT ON public.residuos_hospitalarios FOR EACH ROW EXECUTE FUNCTION public.generar_numero_residuo();
CREATE TRIGGER trg_numero_manifiesto BEFORE INSERT ON public.manifiestos_residuos FOR EACH ROW EXECUTE FUNCTION public.generar_numero_manifiesto();
CREATE TRIGGER update_residuos_ts BEFORE UPDATE ON public.residuos_hospitalarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_manifiestos_ts BEFORE UPDATE ON public.manifiestos_residuos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== SEGURIDAD FÍSICA ===============

CREATE TABLE public.areas_seguridad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  nivel_acceso text NOT NULL DEFAULT 'publico' CHECK (nivel_acceso IN ('publico','restringido','critico')),
  ubicacion text,
  capacidad int,
  tiene_camaras boolean DEFAULT false,
  cantidad_camaras int DEFAULT 0,
  activa boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bitacora_accesos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  numero text NOT NULL DEFAULT '',
  area_id uuid REFERENCES public.areas_seguridad(id),
  persona_nombre text NOT NULL,
  persona_cedula text,
  tipo text NOT NULL DEFAULT 'entrada' CHECK (tipo IN ('entrada','salida')),
  tipo_persona text NOT NULL DEFAULT 'empleado' CHECK (tipo_persona IN ('empleado','visitante','proveedor','contratista','paciente')),
  metodo_verificacion text DEFAULT 'visual' CHECK (metodo_verificacion IN ('visual','cedula','tarjeta','biometrico','codigo')),
  motivo_visita text,
  persona_visitada text,
  autorizado_por text,
  fecha_hora timestamptz DEFAULT now(),
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.credenciales_acceso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  persona_nombre text NOT NULL,
  persona_cedula text,
  tipo text NOT NULL DEFAULT 'empleado' CHECK (tipo IN ('empleado','visitante','proveedor','temporal')),
  codigo_credencial text,
  areas_permitidas text[] DEFAULT '{}',
  fecha_emision date DEFAULT CURRENT_DATE,
  fecha_vencimiento date,
  estado text NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','suspendida','revocada','vencida')),
  foto_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.areas_seguridad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitacora_accesos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credenciales_acceso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "areas_seg_workspace" ON public.areas_seguridad FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "bitacora_acc_workspace" ON public.bitacora_accesos FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "credenciales_workspace" ON public.credenciales_acceso FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE OR REPLACE FUNCTION public.generar_numero_acceso()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    SELECT COUNT(*) + 1 INTO v_count FROM public.bitacora_accesos
      WHERE workspace_id = NEW.workspace_id AND DATE(fecha_hora) = CURRENT_DATE;
    NEW.numero := 'ACC-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(v_count::text, 4, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_numero_acceso BEFORE INSERT ON public.bitacora_accesos FOR EACH ROW EXECUTE FUNCTION public.generar_numero_acceso();
CREATE TRIGGER update_areas_seg_ts BEFORE UPDATE ON public.areas_seguridad FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_credenciales_ts BEFORE UPDATE ON public.credenciales_acceso FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== LAVANDERÍA Y ROPERÍA ===============

CREATE TABLE public.ordenes_lavanderia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  numero text NOT NULL DEFAULT '',
  servicio_solicitante text NOT NULL,
  tipo_ropa text NOT NULL DEFAULT 'ropa_cama' CHECK (tipo_ropa IN ('ropa_cama','uniformes','batas','toallas','cortinas','quirurgica','otro')),
  cantidad_piezas int,
  peso_kg numeric(8,2),
  estado text NOT NULL DEFAULT 'recibida' CHECK (estado IN ('recibida','en_lavado','secado','planchado','lista','entregada')),
  prioridad text NOT NULL DEFAULT 'normal' CHECK (prioridad IN ('normal','urgente')),
  fecha_recepcion timestamptz DEFAULT now(),
  fecha_entrega timestamptz,
  recibido_por text,
  entregado_a text,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.inventario_ropa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  descripcion text,
  cantidad_total int DEFAULT 0,
  cantidad_disponible int DEFAULT 0,
  en_lavado int DEFAULT 0,
  en_baja int DEFAULT 0,
  stock_minimo int DEFAULT 10,
  costo_unitario numeric(10,2),
  proveedor text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ordenes_lavanderia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_ropa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ordenes_lav_workspace" ON public.ordenes_lavanderia FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "inventario_ropa_workspace" ON public.inventario_ropa FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE OR REPLACE FUNCTION public.generar_numero_lavanderia()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.ordenes_lavanderia WHERE numero LIKE 'LAV-' || v_year || '-%';
    NEW.numero := 'LAV-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_numero_lavanderia BEFORE INSERT ON public.ordenes_lavanderia FOR EACH ROW EXECUTE FUNCTION public.generar_numero_lavanderia();
CREATE TRIGGER update_ordenes_lav_ts BEFORE UPDATE ON public.ordenes_lavanderia FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventario_ropa_ts BEFORE UPDATE ON public.inventario_ropa FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== TRABAJO SOCIAL ===============

CREATE TABLE public.casos_trabajo_social (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  numero text NOT NULL DEFAULT '',
  paciente_id uuid REFERENCES public.pacientes(id),
  trabajador_social_id uuid REFERENCES public.personal_salud(id),
  tipo_caso text NOT NULL DEFAULT 'evaluacion_socioeconomica' CHECK (tipo_caso IN ('evaluacion_socioeconomica','apoyo_familiar','violencia','abandono','adicciones','discapacidad','seguimiento_comunitario','indigencia','migrante','otro')),
  prioridad text NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja','media','alta','urgente')),
  estado text NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto','en_seguimiento','referido','cerrado','archivado')),
  descripcion text,
  evaluacion text,
  plan_intervencion text,
  nivel_socioeconomico text CHECK (nivel_socioeconomico IS NULL OR nivel_socioeconomico IN ('A','B','C','D','E')),
  composicion_familiar jsonb DEFAULT '[]'::jsonb,
  ingresos_mensuales numeric(12,2),
  fecha_apertura date DEFAULT CURRENT_DATE,
  fecha_cierre date,
  motivo_cierre text,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.referimientos_sociales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  caso_id uuid NOT NULL REFERENCES public.casos_trabajo_social(id) ON DELETE CASCADE,
  institucion_destino text NOT NULL,
  contacto_institucion text,
  telefono_institucion text,
  motivo text NOT NULL,
  documentos_enviados text[] DEFAULT '{}',
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','enviado','aceptado','rechazado','completado')),
  fecha_referimiento date DEFAULT CURRENT_DATE,
  fecha_respuesta date,
  resultado text,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.casos_trabajo_social ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referimientos_sociales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "casos_ts_workspace" ON public.casos_trabajo_social FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "referimientos_workspace" ON public.referimientos_sociales FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE OR REPLACE FUNCTION public.generar_numero_caso_ts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.casos_trabajo_social WHERE numero LIKE 'CTS-' || v_year || '-%';
    NEW.numero := 'CTS-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_numero_caso_ts BEFORE INSERT ON public.casos_trabajo_social FOR EACH ROW EXECUTE FUNCTION public.generar_numero_caso_ts();
CREATE TRIGGER update_casos_ts_ts BEFORE UPDATE ON public.casos_trabajo_social FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_referimientos_ts BEFORE UPDATE ON public.referimientos_sociales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
