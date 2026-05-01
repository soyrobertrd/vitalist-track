-- ============================================
-- Fase FF — Sistema dual de afiliados + Hubs verticales + Paciente 360
-- ============================================

-- 1) COMISIONES DE EMPLEADOS (afiliados internos / referidores)
CREATE TABLE IF NOT EXISTS public.comisiones_empleados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  empleado_id uuid NOT NULL, -- personal_salud.id o profile id
  paciente_id uuid,
  concepto text NOT NULL,
  origen text NOT NULL DEFAULT 'referido', -- 'referido' | 'venta' | 'meta' | 'cierre'
  monto_base numeric(12,2) NOT NULL DEFAULT 0,
  porcentaje numeric(5,2) NOT NULL DEFAULT 0,
  monto_comision numeric(12,2) NOT NULL DEFAULT 0,
  fecha_generada date NOT NULL DEFAULT CURRENT_DATE,
  estado text NOT NULL DEFAULT 'pendiente', -- pendiente | aprobada | pagada | cancelada
  fecha_pago date,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comisiones_emp_ws ON public.comisiones_empleados(workspace_id);
CREATE INDEX IF NOT EXISTS idx_comisiones_emp_emp ON public.comisiones_empleados(empleado_id);
ALTER TABLE public.comisiones_empleados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/coordinador ven todas las comisiones del workspace"
ON public.comisiones_empleados FOR SELECT TO authenticated
USING (public.is_admin_or_coordinador(auth.uid()));

CREATE POLICY "Empleados ven sus propias comisiones"
ON public.comisiones_empleados FOR SELECT TO authenticated
USING (
  empleado_id IN (
    SELECT id FROM public.personal_salud WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admin gestiona comisiones"
ON public.comisiones_empleados FOR ALL TO authenticated
USING (public.is_admin_or_coordinador(auth.uid()))
WITH CHECK (public.is_admin_or_coordinador(auth.uid()));

CREATE TRIGGER trg_comisiones_emp_upd
BEFORE UPDATE ON public.comisiones_empleados
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) BENEFICIOS / LOYALTY DE USUARIOS (pacientes individuales)
CREATE TABLE IF NOT EXISTS public.beneficios_usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL,
  workspace_id uuid,
  tipo text NOT NULL DEFAULT 'puntos', -- puntos | descuento | nivel | upgrade
  concepto text NOT NULL,
  puntos integer DEFAULT 0,
  monto_descuento numeric(12,2) DEFAULT 0,
  nivel text, -- bronce | plata | oro | platino
  origen text, -- referido | compra | campana | bienvenida
  estado text NOT NULL DEFAULT 'activo', -- activo | usado | expirado
  fecha_otorgado date NOT NULL DEFAULT CURRENT_DATE,
  fecha_expiracion date,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_beneficios_pac ON public.beneficios_usuarios(paciente_id);
ALTER TABLE public.beneficios_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gestiona beneficios"
ON public.beneficios_usuarios FOR ALL TO authenticated
USING (public.is_admin_or_coordinador(auth.uid()))
WITH CHECK (public.is_admin_or_coordinador(auth.uid()));

CREATE POLICY "Staff clínico ve beneficios de sus pacientes"
ON public.beneficios_usuarios FOR SELECT TO authenticated
USING (public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));

CREATE TRIGGER trg_benef_upd
BEFORE UPDATE ON public.beneficios_usuarios
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) PROGRAMA DE REFERIDOS
CREATE TABLE IF NOT EXISTS public.referidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid,
  referidor_tipo text NOT NULL, -- 'paciente' | 'empleado'
  referidor_id uuid NOT NULL,
  paciente_referido_id uuid,
  nombre_prospecto text,
  contacto_prospecto text,
  estado text NOT NULL DEFAULT 'pendiente', -- pendiente | contactado | convertido | descartado
  recompensa_otorgada boolean NOT NULL DEFAULT false,
  fecha_referido date NOT NULL DEFAULT CURRENT_DATE,
  fecha_conversion date,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gestiona referidos"
ON public.referidos FOR ALL TO authenticated
USING (public.is_admin_or_coordinador(auth.uid()))
WITH CHECK (public.is_admin_or_coordinador(auth.uid()));

CREATE POLICY "Empleado ve sus propios referidos"
ON public.referidos FOR SELECT TO authenticated
USING (
  referidor_tipo = 'empleado' AND referidor_id IN (
    SELECT id FROM public.personal_salud WHERE user_id = auth.uid()
  )
);

CREATE TRIGGER trg_referidos_upd
BEFORE UPDATE ON public.referidos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) SEGMENTOS DE PACIENTES (para campañas)
CREATE TABLE IF NOT EXISTS public.segmentos_pacientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid,
  nombre text NOT NULL,
  descripcion text,
  criterios jsonb NOT NULL DEFAULT '{}'::jsonb,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.segmentos_pacientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gestiona segmentos"
ON public.segmentos_pacientes FOR ALL TO authenticated
USING (public.is_admin_or_coordinador(auth.uid()))
WITH CHECK (public.is_admin_or_coordinador(auth.uid()));

CREATE TRIGGER trg_segmentos_upd
BEFORE UPDATE ON public.segmentos_pacientes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) PERFIL DE VALOR (LTV / scoring del paciente)
CREATE TABLE IF NOT EXISTS public.perfil_valor_paciente (
  paciente_id uuid PRIMARY KEY,
  workspace_id uuid,
  ltv_total numeric(12,2) NOT NULL DEFAULT 0,
  ltv_anual numeric(12,2) NOT NULL DEFAULT 0,
  visitas_totales integer NOT NULL DEFAULT 0,
  ultima_visita date,
  frecuencia_dias integer,
  nivel_engagement text DEFAULT 'medio', -- bajo | medio | alto | vip
  riesgo_churn text DEFAULT 'bajo',     -- bajo | medio | alto
  nps_promedio numeric(4,2),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.perfil_valor_paciente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin ve perfiles de valor"
ON public.perfil_valor_paciente FOR ALL TO authenticated
USING (public.is_admin_or_coordinador(auth.uid()))
WITH CHECK (public.is_admin_or_coordinador(auth.uid()));

CREATE POLICY "Staff clínico ve perfil de valor de sus pacientes"
ON public.perfil_valor_paciente FOR SELECT TO authenticated
USING (public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));