-- Telemedicina: token público y estado de sala
ALTER TABLE public.control_visitas
  ADD COLUMN IF NOT EXISTS video_token uuid UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS video_estado text DEFAULT 'programada',
  ADD COLUMN IF NOT EXISTS video_iniciado_at timestamptz,
  ADD COLUMN IF NOT EXISTS video_finalizado_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_control_visitas_video_token ON public.control_visitas(video_token);

-- Auditoría: alertas de acceso sospechoso
CREATE TABLE IF NOT EXISTS public.auditoria_alertas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid,
  user_id uuid NOT NULL,
  tipo text NOT NULL, -- 'fuera_horario' | 'acceso_masivo' | 'descarga_excesiva' | 'paciente_no_asignado'
  severidad text NOT NULL DEFAULT 'media', -- 'baja' | 'media' | 'alta' | 'critica'
  descripcion text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  resuelto boolean NOT NULL DEFAULT false,
  resuelto_por uuid,
  resuelto_at timestamptz,
  notas_resolucion text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auditoria_alertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auditoria_alertas_select_admin" ON public.auditoria_alertas
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR (workspace_id IS NOT NULL AND is_workspace_admin(auth.uid(), workspace_id)));

CREATE POLICY "auditoria_alertas_insert_authenticated" ON public.auditoria_alertas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auditoria_alertas_update_admin" ON public.auditoria_alertas
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR (workspace_id IS NOT NULL AND is_workspace_admin(auth.uid(), workspace_id)));

CREATE INDEX IF NOT EXISTS idx_auditoria_alertas_workspace ON public.auditoria_alertas(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_alertas_resuelto ON public.auditoria_alertas(resuelto, severidad);

-- Auditoría: registro de exportes firmados
CREATE TABLE IF NOT EXISTS public.auditoria_exportes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid,
  exportado_por uuid NOT NULL,
  tipo text NOT NULL, -- 'pdf_logs' | 'csv_logs' | 'pdf_paciente'
  rango_inicio date,
  rango_fin date,
  total_registros integer NOT NULL DEFAULT 0,
  filtros jsonb NOT NULL DEFAULT '{}'::jsonb,
  hash_sha256 text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auditoria_exportes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auditoria_exportes_select_admin" ON public.auditoria_exportes
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR (workspace_id IS NOT NULL AND is_workspace_admin(auth.uid(), workspace_id)));

CREATE POLICY "auditoria_exportes_insert_authenticated" ON public.auditoria_exportes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = exportado_por);

CREATE INDEX IF NOT EXISTS idx_auditoria_exportes_workspace ON public.auditoria_exportes(workspace_id, created_at DESC);

-- Función para detectar accesos sospechosos en las últimas 24h
CREATE OR REPLACE FUNCTION public.detectar_accesos_sospechosos(_workspace_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alertas_creadas integer := 0;
  rec record;
BEGIN
  -- Acceso fuera de horario (10pm - 6am)
  FOR rec IN
    SELECT user_id, workspace_id, COUNT(*) as cnt
    FROM acceso_fichas_log
    WHERE created_at > now() - interval '24 hours'
      AND (EXTRACT(hour FROM created_at AT TIME ZONE 'America/Santo_Domingo') >= 22
           OR EXTRACT(hour FROM created_at AT TIME ZONE 'America/Santo_Domingo') < 6)
      AND (_workspace_id IS NULL OR workspace_id = _workspace_id)
    GROUP BY user_id, workspace_id
    HAVING COUNT(*) >= 3
  LOOP
    INSERT INTO auditoria_alertas (workspace_id, user_id, tipo, severidad, descripcion, metadata)
    SELECT rec.workspace_id, rec.user_id, 'fuera_horario', 'media',
           format('Usuario accedió %s fichas fuera de horario laboral (10pm-6am) en las últimas 24h', rec.cnt),
           jsonb_build_object('total_accesos', rec.cnt, 'periodo_horas', 24)
    WHERE NOT EXISTS (
      SELECT 1 FROM auditoria_alertas
      WHERE user_id = rec.user_id AND tipo = 'fuera_horario'
        AND created_at > now() - interval '24 hours' AND resuelto = false
    );
    alertas_creadas := alertas_creadas + 1;
  END LOOP;

  -- Acceso masivo (>50 fichas distintas en 1 hora)
  FOR rec IN
    SELECT user_id, workspace_id, COUNT(DISTINCT paciente_id) as cnt
    FROM acceso_fichas_log
    WHERE created_at > now() - interval '1 hour'
      AND (_workspace_id IS NULL OR workspace_id = _workspace_id)
    GROUP BY user_id, workspace_id
    HAVING COUNT(DISTINCT paciente_id) >= 50
  LOOP
    INSERT INTO auditoria_alertas (workspace_id, user_id, tipo, severidad, descripcion, metadata)
    SELECT rec.workspace_id, rec.user_id, 'acceso_masivo', 'alta',
           format('Usuario accedió %s pacientes distintos en 1 hora — posible exfiltración', rec.cnt),
           jsonb_build_object('pacientes_distintos', rec.cnt, 'periodo_horas', 1)
    WHERE NOT EXISTS (
      SELECT 1 FROM auditoria_alertas
      WHERE user_id = rec.user_id AND tipo = 'acceso_masivo'
        AND created_at > now() - interval '6 hours' AND resuelto = false
    );
    alertas_creadas := alertas_creadas + 1;
  END LOOP;

  -- Descargas excesivas (>20 descargas/exports en 24h)
  FOR rec IN
    SELECT user_id, workspace_id, COUNT(*) as cnt
    FROM acceso_fichas_log
    WHERE created_at > now() - interval '24 hours'
      AND accion IN ('export', 'download', 'print')
      AND (_workspace_id IS NULL OR workspace_id = _workspace_id)
    GROUP BY user_id, workspace_id
    HAVING COUNT(*) >= 20
  LOOP
    INSERT INTO auditoria_alertas (workspace_id, user_id, tipo, severidad, descripcion, metadata)
    SELECT rec.workspace_id, rec.user_id, 'descarga_excesiva', 'alta',
           format('Usuario realizó %s descargas/exportes en 24h', rec.cnt),
           jsonb_build_object('total_acciones', rec.cnt)
    WHERE NOT EXISTS (
      SELECT 1 FROM auditoria_alertas
      WHERE user_id = rec.user_id AND tipo = 'descarga_excesiva'
        AND created_at > now() - interval '24 hours' AND resuelto = false
    );
    alertas_creadas := alertas_creadas + 1;
  END LOOP;

  RETURN alertas_creadas;
END;
$$;