
-- ============================================================
-- FASE K: Turnos/Colas, Banco de Sangre, Nutrición, Rehabilitación
-- ============================================================

-- ===================== TURNOS Y COLAS =====================
CREATE TABLE public.turnos_cola (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) NOT NULL,
  sucursal_id uuid REFERENCES public.sucursales(id),
  numero text NOT NULL,
  paciente_id uuid REFERENCES public.pacientes(id),
  servicio text NOT NULL DEFAULT 'general',
  prioridad text NOT NULL DEFAULT 'normal' CHECK (prioridad IN ('normal','prioritario','emergencia')),
  estado text NOT NULL DEFAULT 'esperando' CHECK (estado IN ('esperando','llamado','atendiendo','completado','no_presentado')),
  profesional_id uuid REFERENCES public.personal_salud(id),
  consultorio text,
  hora_llegada timestamptz NOT NULL DEFAULT now(),
  hora_llamado timestamptz,
  hora_atencion timestamptz,
  hora_fin timestamptz,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.turnos_cola ENABLE ROW LEVEL SECURITY;

CREATE POLICY "turnos_select" ON public.turnos_cola FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "turnos_insert" ON public.turnos_cola FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "turnos_update" ON public.turnos_cola FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "turnos_delete" ON public.turnos_cola FOR DELETE TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));

CREATE TABLE public.pantallas_turno (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) NOT NULL,
  sucursal_id uuid REFERENCES public.sucursales(id),
  nombre text NOT NULL,
  servicios text[] DEFAULT '{}',
  activa boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pantallas_turno ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pantallas_select" ON public.pantallas_turno FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "pantallas_manage" ON public.pantallas_turno FOR ALL TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));

-- Auto-numbering turnos
CREATE OR REPLACE FUNCTION public.generar_numero_turno()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    SELECT COUNT(*) + 1 INTO v_count FROM public.turnos_cola
      WHERE workspace_id = NEW.workspace_id AND DATE(hora_llegada) = CURRENT_DATE;
    NEW.numero := 'T-' || LPAD(v_count::text, 4, '0');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_numero_turno BEFORE INSERT ON public.turnos_cola
  FOR EACH ROW EXECUTE FUNCTION public.generar_numero_turno();

ALTER PUBLICATION supabase_realtime ADD TABLE public.turnos_cola;

-- ===================== BANCO DE SANGRE =====================
CREATE TABLE public.donantes_sangre (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) NOT NULL,
  paciente_id uuid REFERENCES public.pacientes(id),
  nombre text NOT NULL,
  apellido text,
  cedula text,
  tipo_sangre text NOT NULL CHECK (tipo_sangre IN ('A','B','AB','O')),
  factor_rh text NOT NULL DEFAULT '+' CHECK (factor_rh IN ('+','-')),
  elegible boolean DEFAULT true,
  ultima_donacion date,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.donantes_sangre ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donantes_select" ON public.donantes_sangre FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "donantes_insert" ON public.donantes_sangre FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "donantes_update" ON public.donantes_sangre FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "donantes_delete" ON public.donantes_sangre FOR DELETE TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));

CREATE TABLE public.unidades_sangre (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) NOT NULL,
  donante_id uuid REFERENCES public.donantes_sangre(id),
  tipo_sangre text NOT NULL CHECK (tipo_sangre IN ('A','B','AB','O')),
  factor_rh text NOT NULL DEFAULT '+' CHECK (factor_rh IN ('+','-')),
  componente text NOT NULL DEFAULT 'sangre_total' CHECK (componente IN ('sangre_total','globulos_rojos','plaquetas','plasma','crioprecipitado')),
  lote text,
  volumen_ml numeric(8,2) DEFAULT 450,
  fecha_extraccion date NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento date,
  estado text NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible','reservada','transfundida','descartada','vencida')),
  temperatura_almacenamiento text,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.unidades_sangre ENABLE ROW LEVEL SECURITY;
CREATE POLICY "unidades_select" ON public.unidades_sangre FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "unidades_insert" ON public.unidades_sangre FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "unidades_update" ON public.unidades_sangre FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TABLE public.solicitudes_transfusion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) NOT NULL,
  numero text,
  paciente_id uuid REFERENCES public.pacientes(id) NOT NULL,
  tipo_sangre_paciente text,
  componente_solicitado text NOT NULL DEFAULT 'globulos_rojos',
  cantidad int DEFAULT 1,
  urgencia text NOT NULL DEFAULT 'normal' CHECK (urgencia IN ('normal','urgente','emergencia')),
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pruebas_cruzadas','aprobada','en_proceso','completada','cancelada')),
  unidad_sangre_id uuid REFERENCES public.unidades_sangre(id),
  prueba_compatibilidad boolean DEFAULT false,
  medico_solicitante_id uuid REFERENCES public.personal_salud(id),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.solicitudes_transfusion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sol_trans_select" ON public.solicitudes_transfusion FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "sol_trans_insert" ON public.solicitudes_transfusion FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "sol_trans_update" ON public.solicitudes_transfusion FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE OR REPLACE FUNCTION public.generar_numero_solicitud_transfusion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.solicitudes_transfusion WHERE numero LIKE 'TRX-' || v_year || '-%';
    NEW.numero := 'TRX-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_numero_transfusion BEFORE INSERT ON public.solicitudes_transfusion
  FOR EACH ROW EXECUTE FUNCTION public.generar_numero_solicitud_transfusion();

-- ===================== NUTRICIÓN =====================
CREATE TABLE public.evaluaciones_nutricionales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) NOT NULL,
  paciente_id uuid REFERENCES public.pacientes(id) NOT NULL,
  profesional_id uuid REFERENCES public.personal_salud(id),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  peso_kg numeric(6,2),
  talla_cm numeric(6,2),
  imc numeric(5,2),
  circunferencia_cintura numeric(5,2),
  circunferencia_brazo numeric(5,2),
  diagnostico_nutricional text CHECK (diagnostico_nutricional IN ('desnutricion_severa','desnutricion_moderada','desnutricion_leve','normal','sobrepeso','obesidad_i','obesidad_ii','obesidad_iii')),
  plan_alimenticio text,
  restricciones text,
  suplementos text,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.evaluaciones_nutricionales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eval_nut_select" ON public.evaluaciones_nutricionales FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "eval_nut_insert" ON public.evaluaciones_nutricionales FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "eval_nut_update" ON public.evaluaciones_nutricionales FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TABLE public.dietas_hospitalarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) NOT NULL,
  paciente_id uuid REFERENCES public.pacientes(id) NOT NULL,
  admision_id uuid REFERENCES public.admisiones(id),
  tipo_dieta text NOT NULL DEFAULT 'normal' CHECK (tipo_dieta IN ('normal','blanda','liquida','hipocalorica','hipercalorica','hiposodica','diabetica','renal','hepatica','sin_gluten','sin_lactosa','parenteral','enteral')),
  calorias_objetivo numeric(8,2),
  restricciones_alergenos text,
  preferencias text,
  estado text NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','suspendida','completada')),
  fecha_inicio date NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin date,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dietas_hospitalarias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dietas_select" ON public.dietas_hospitalarias FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "dietas_insert" ON public.dietas_hospitalarias FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "dietas_update" ON public.dietas_hospitalarias FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TABLE public.menus_dieta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dieta_id uuid REFERENCES public.dietas_hospitalarias(id) ON DELETE CASCADE NOT NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  comida text NOT NULL CHECK (comida IN ('desayuno','almuerzo','cena','merienda_am','merienda_pm','colacion')),
  descripcion text NOT NULL,
  calorias numeric(8,2),
  preparado boolean DEFAULT false,
  entregado boolean DEFAULT false,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.menus_dieta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menus_select" ON public.menus_dieta FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.dietas_hospitalarias d WHERE d.id = dieta_id AND public.is_workspace_member(auth.uid(), d.workspace_id)));
CREATE POLICY "menus_insert" ON public.menus_dieta FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.dietas_hospitalarias d WHERE d.id = dieta_id AND public.is_workspace_member(auth.uid(), d.workspace_id)));
CREATE POLICY "menus_update" ON public.menus_dieta FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.dietas_hospitalarias d WHERE d.id = dieta_id AND public.is_workspace_member(auth.uid(), d.workspace_id)));

-- ===================== REHABILITACIÓN =====================
CREATE TABLE public.planes_rehabilitacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) NOT NULL,
  numero text,
  paciente_id uuid REFERENCES public.pacientes(id) NOT NULL,
  profesional_id uuid REFERENCES public.personal_salud(id),
  tipo text NOT NULL DEFAULT 'fisioterapia' CHECK (tipo IN ('fisioterapia','ocupacional','respiratoria','neurologica','cardiaca','deportiva')),
  diagnostico text,
  objetivos text,
  duracion_semanas int DEFAULT 8,
  sesiones_por_semana int DEFAULT 3,
  estado text NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','pausado','completado','cancelado')),
  fecha_inicio date NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin date,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.planes_rehabilitacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rehab_select" ON public.planes_rehabilitacion FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "rehab_insert" ON public.planes_rehabilitacion FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "rehab_update" ON public.planes_rehabilitacion FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE OR REPLACE FUNCTION public.generar_numero_plan_rehabilitacion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.planes_rehabilitacion WHERE numero LIKE 'RHB-' || v_year || '-%';
    NEW.numero := 'RHB-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_numero_rehab BEFORE INSERT ON public.planes_rehabilitacion
  FOR EACH ROW EXECUTE FUNCTION public.generar_numero_plan_rehabilitacion();

CREATE TABLE public.sesiones_rehabilitacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES public.planes_rehabilitacion(id) ON DELETE CASCADE NOT NULL,
  numero_sesion int NOT NULL DEFAULT 1,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  duracion_minutos int DEFAULT 45,
  ejercicios jsonb DEFAULT '[]',
  dolor_antes int CHECK (dolor_antes BETWEEN 0 AND 10),
  dolor_despues int CHECK (dolor_despues BETWEEN 0 AND 10),
  progreso_pct numeric(5,2) DEFAULT 0,
  asistio boolean DEFAULT true,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sesiones_rehabilitacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sesiones_rehab_select" ON public.sesiones_rehabilitacion FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.planes_rehabilitacion p WHERE p.id = plan_id AND public.is_workspace_member(auth.uid(), p.workspace_id)));
CREATE POLICY "sesiones_rehab_insert" ON public.sesiones_rehabilitacion FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.planes_rehabilitacion p WHERE p.id = plan_id AND public.is_workspace_member(auth.uid(), p.workspace_id)));
CREATE POLICY "sesiones_rehab_update" ON public.sesiones_rehabilitacion FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.planes_rehabilitacion p WHERE p.id = plan_id AND public.is_workspace_member(auth.uid(), p.workspace_id)));

-- Audit triggers for critical tables
CREATE TRIGGER audit_donantes_sangre AFTER INSERT OR UPDATE OR DELETE ON public.donantes_sangre
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
CREATE TRIGGER audit_unidades_sangre AFTER INSERT OR UPDATE OR DELETE ON public.unidades_sangre
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
CREATE TRIGGER audit_solicitudes_transfusion AFTER INSERT OR UPDATE OR DELETE ON public.solicitudes_transfusion
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
CREATE TRIGGER audit_planes_rehabilitacion AFTER INSERT OR UPDATE OR DELETE ON public.planes_rehabilitacion
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
