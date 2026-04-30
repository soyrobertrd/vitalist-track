-- ============= CRON EJECUCIONES =============
CREATE TABLE IF NOT EXISTS public.cron_ejecuciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  exitoso boolean NOT NULL DEFAULT true,
  duracion_ms integer,
  resultado jsonb DEFAULT '{}'::jsonb,
  error text,
  ejecutado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cron_ejec_job_fecha ON public.cron_ejecuciones (job_name, ejecutado_en DESC);

ALTER TABLE public.cron_ejecuciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins ven cron_ejecuciones"
  ON public.cron_ejecuciones FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- service role inserta vía edge functions (bypass RLS por service role)

-- ============= PUSH SUBSCRIPTIONS =============
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  user_agent text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_sub_user ON public.push_subscriptions (user_id) WHERE activo = true;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario maneja sus push subs"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER push_subs_updated
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= FUNCIONES =============
CREATE OR REPLACE FUNCTION public.registrar_cron_ejecucion(
  _job text, _exitoso boolean, _duracion_ms int DEFAULT NULL,
  _resultado jsonb DEFAULT '{}'::jsonb, _error text DEFAULT NULL
) RETURNS uuid
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  INSERT INTO public.cron_ejecuciones (job_name, exitoso, duracion_ms, resultado, error)
  VALUES (_job, _exitoso, _duracion_ms, COALESCE(_resultado,'{}'::jsonb), _error)
  RETURNING id;
$$;

CREATE OR REPLACE FUNCTION public.estadisticas_salud_sistema()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_alertas_activas int;
  v_alertas_criticas int;
  v_candidatos_anon int;
  v_recordatorios_pend int;
  v_ultimos_crons jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Solo admins';
  END IF;

  SELECT COUNT(*) INTO v_alertas_activas
    FROM public.auditoria_alertas WHERE resuelto = false;

  SELECT COUNT(*) INTO v_alertas_criticas
    FROM public.auditoria_alertas WHERE resuelto = false AND severidad IN ('alta','critica');

  SELECT COUNT(*) INTO v_candidatos_anon
    FROM public.pacientes p
    WHERE p.anonimizado = false
      AND COALESCE(p.updated_at, p.created_at) < now() - interval '60 months';

  SELECT COUNT(*) INTO v_recordatorios_pend
    FROM (
      SELECT id FROM public.control_visitas
       WHERE estado = 'pendiente'::estado_visita
         AND fecha_hora_visita BETWEEN now() AND now() + interval '24 hours'
      UNION ALL
      SELECT id FROM public.registro_llamadas
       WHERE estado IN ('agendada'::estado_llamada,'pendiente'::estado_llamada)
         AND fecha_agendada BETWEEN now() AND now() + interval '24 hours'
    ) x;

  SELECT jsonb_agg(j) INTO v_ultimos_crons FROM (
    SELECT DISTINCT ON (job_name)
      job_name, exitoso, duracion_ms, resultado, error, ejecutado_en
    FROM public.cron_ejecuciones
    ORDER BY job_name, ejecutado_en DESC
  ) j;

  RETURN jsonb_build_object(
    'alertas_activas', v_alertas_activas,
    'alertas_criticas', v_alertas_criticas,
    'candidatos_anonimizar', v_candidatos_anon,
    'recordatorios_pendientes', v_recordatorios_pend,
    'ultimos_crons', COALESCE(v_ultimos_crons, '[]'::jsonb),
    'generado_en', now()
  );
END;
$$;