
-- Fase V (retry sin campanas_marketing)

CREATE TABLE IF NOT EXISTS public.camas_vertical (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vertical_tipo text NOT NULL CHECK (vertical_tipo IN ('dental','estetica','recuperacion','vision')),
  nombre text NOT NULL, piso text, sala text,
  tipo text NOT NULL DEFAULT 'estandar' CHECK (tipo IN ('estandar','uci','aislamiento','recovery','observacion')),
  estado text NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible','ocupada','limpieza','mantenimiento','reservada')),
  paciente_id uuid REFERENCES public.pacientes(id),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.camas_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_camas_v" ON public.camas_vertical FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TABLE IF NOT EXISTS public.ocupacion_camas_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  cama_id uuid NOT NULL REFERENCES public.camas_vertical(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id),
  fecha_ingreso timestamptz NOT NULL DEFAULT now(), fecha_egreso timestamptz, motivo_egreso text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ocupacion_camas_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_ocup_log" ON public.ocupacion_camas_log FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TABLE IF NOT EXISTS public.reportes_regulatorios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vertical_tipo text NOT NULL CHECK (vertical_tipo IN ('dental','estetica','recuperacion','vision')),
  tipo_reporte text NOT NULL,
  entidad_destino text NOT NULL DEFAULT 'SISALRIL' CHECK (entidad_destino IN ('SISALRIL','SENASA','MSP','DGII','otro')),
  periodo_inicio date, periodo_fin date,
  estado text NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','generado','enviado','aceptado','rechazado')),
  datos jsonb DEFAULT '{}'::jsonb, fecha_vencimiento date, enviado_at timestamptz,
  generado_por uuid REFERENCES auth.users(id), notas text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reportes_regulatorios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_rep_reg" ON public.reportes_regulatorios FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TABLE IF NOT EXISTS public.calendario_regulatorio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  entidad text NOT NULL, nombre text NOT NULL,
  frecuencia text NOT NULL DEFAULT 'mensual' CHECK (frecuencia IN ('mensual','trimestral','semestral','anual')),
  dia_vencimiento int DEFAULT 15, activo boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.calendario_regulatorio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_cal_reg" ON public.calendario_regulatorio FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TABLE IF NOT EXISTS public.programa_fidelizacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vertical_tipo text NOT NULL CHECK (vertical_tipo IN ('dental','estetica','recuperacion','vision')),
  nombre text NOT NULL,
  tipo text NOT NULL DEFAULT 'puntos' CHECK (tipo IN ('puntos','referidos','descuentos','mixto')),
  puntos_por_unidad numeric(10,2) DEFAULT 1, descripcion text, activo boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.programa_fidelizacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_fideliz" ON public.programa_fidelizacion FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TABLE IF NOT EXISTS public.puntos_paciente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  programa_id uuid NOT NULL REFERENCES public.programa_fidelizacion(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  puntos numeric(12,2) NOT NULL DEFAULT 0,
  tipo text NOT NULL DEFAULT 'acumulado' CHECK (tipo IN ('acumulado','canjeado','expirado','ajuste')),
  descripcion text, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.puntos_paciente ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_puntos" ON public.puntos_paciente FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TABLE IF NOT EXISTS public.referidos_paciente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  referidor_id uuid NOT NULL REFERENCES public.pacientes(id),
  referido_id uuid NOT NULL REFERENCES public.pacientes(id),
  programa_id uuid REFERENCES public.programa_fidelizacion(id),
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','confirmado','recompensado','cancelado')),
  puntos_otorgados numeric(10,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referidos_paciente ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_referidos" ON public.referidos_paciente FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TABLE IF NOT EXISTS public.nps_encuestas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  score int NOT NULL CHECK (score >= 0 AND score <= 10),
  comentario text,
  categoria text GENERATED ALWAYS AS (
    CASE WHEN score >= 9 THEN 'promotor' WHEN score >= 7 THEN 'pasivo' ELSE 'detractor' END
  ) STORED,
  vertical_tipo text CHECK (vertical_tipo IN ('dental','estetica','recuperacion','vision')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.nps_encuestas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_nps" ON public.nps_encuestas FOR ALL USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TABLE IF NOT EXISTS public.api_keys_externas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL, key_hash text NOT NULL, key_prefix text NOT NULL,
  permisos jsonb DEFAULT '["read"]'::jsonb,
  rate_limit_por_minuto int DEFAULT 60, activa boolean DEFAULT true,
  ultimo_uso timestamptz, total_requests bigint DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.api_keys_externas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_admin_apikeys" ON public.api_keys_externas FOR ALL USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE TABLE IF NOT EXISTS public.webhooks_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL, url text NOT NULL, eventos text[] NOT NULL DEFAULT '{}',
  secret text, activo boolean DEFAULT true,
  ultimo_envio timestamptz, fallos_consecutivos int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.webhooks_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_admin_webhooks" ON public.webhooks_config FOR ALL USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE TABLE IF NOT EXISTS public.webhooks_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  webhook_id uuid NOT NULL REFERENCES public.webhooks_config(id) ON DELETE CASCADE,
  evento text NOT NULL, payload jsonb, status_code int, response_body text,
  duracion_ms int, exitoso boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.webhooks_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_admin_wh_log" ON public.webhooks_log FOR ALL USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE INDEX IF NOT EXISTS idx_camas_v_ws ON public.camas_vertical(workspace_id, vertical_tipo);
CREATE INDEX IF NOT EXISTS idx_rep_reg_ws ON public.reportes_regulatorios(workspace_id, vertical_tipo);
CREATE INDEX IF NOT EXISTS idx_puntos_pac ON public.puntos_paciente(paciente_id, programa_id);
CREATE INDEX IF NOT EXISTS idx_nps_ws ON public.nps_encuestas(workspace_id, vertical_tipo);
CREATE INDEX IF NOT EXISTS idx_wh_log_wh ON public.webhooks_log(webhook_id, created_at DESC);
