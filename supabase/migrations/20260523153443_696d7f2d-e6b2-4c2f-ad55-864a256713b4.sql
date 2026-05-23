
CREATE TABLE IF NOT EXISTS public.teleconsulta_sesiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  cita_id uuid,
  paciente_id uuid,
  profesional_id uuid NOT NULL,
  sala_codigo text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12),'hex'),
  estado text NOT NULL DEFAULT 'pendiente',
  iniciada_at timestamptz,
  finalizada_at timestamptz,
  duracion_segundos integer,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.teleconsulta_sesiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ts_admin_all" ON public.teleconsulta_sesiones FOR ALL
  USING (is_admin_or_coordinador(auth.uid()) OR is_workspace_admin(auth.uid(), workspace_id))
  WITH CHECK (is_admin_or_coordinador(auth.uid()) OR is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "ts_profesional_select" ON public.teleconsulta_sesiones FOR SELECT
  USING (profesional_id IN (SELECT id FROM personal_salud WHERE user_id = auth.uid()));

CREATE POLICY "ts_profesional_update" ON public.teleconsulta_sesiones FOR UPDATE
  USING (profesional_id IN (SELECT id FROM personal_salud WHERE user_id = auth.uid()));

CREATE TRIGGER trg_teleconsulta_sesiones_updated
  BEFORE UPDATE ON public.teleconsulta_sesiones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.teleconsulta_signaling (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id uuid NOT NULL REFERENCES public.teleconsulta_sesiones(id) ON DELETE CASCADE,
  emisor_user_id uuid NOT NULL,
  tipo text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ts_signaling_sesion ON public.teleconsulta_signaling(sesion_id, created_at);
ALTER TABLE public.teleconsulta_signaling ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tss_participants_all" ON public.teleconsulta_signaling FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teleconsulta_sesiones s
      WHERE s.id = sesion_id AND (
        is_workspace_admin(auth.uid(), s.workspace_id)
        OR s.profesional_id IN (SELECT id FROM personal_salud WHERE user_id = auth.uid())
      )
    )
  )
  WITH CHECK (emisor_user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.teleconsulta_signaling;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teleconsulta_sesiones;

CREATE OR REPLACE FUNCTION public.generar_ncf(_workspace_id uuid, _tipo text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_serie text;
  v_actual bigint;
  v_fin bigint;
  v_ncf text;
BEGIN
  SELECT id, serie, actual, fin INTO v_id, v_serie, v_actual, v_fin
  FROM ncf_secuencias
  WHERE workspace_id = _workspace_id AND tipo_ncf = _tipo AND activo = true
  ORDER BY created_at DESC LIMIT 1
  FOR UPDATE;

  IF v_id IS NULL THEN RAISE EXCEPTION 'No hay secuencia NCF activa para tipo %', _tipo; END IF;
  IF v_actual > v_fin THEN RAISE EXCEPTION 'Secuencia NCF % agotada', _tipo; END IF;

  v_ncf := COALESCE(v_serie,'') || _tipo || lpad(v_actual::text, 8, '0');
  UPDATE ncf_secuencias SET actual = v_actual + 1 WHERE id = v_id;
  RETURN v_ncf;
END;
$$;

SELECT cron.schedule(
  'psico-recordatorios-cron',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://qkjjyiymzaouqslzbxrp.supabase.co/functions/v1/dispatch-recordatorios-psico',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
