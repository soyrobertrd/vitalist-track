
-- Branding de workspace para tickets
ALTER TABLE public.workspaces 
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS direccion text,
  ADD COLUMN IF NOT EXISTS telefono text,
  ADD COLUMN IF NOT EXISTS email_contacto text,
  ADD COLUMN IF NOT EXISTS sitio_web text,
  ADD COLUMN IF NOT EXISTS instrucciones_cita text DEFAULT 'Por favor llegue 15 minutos antes de su cita y traiga su documento de identidad.';

-- Tabla de tickets de cita
CREATE TABLE IF NOT EXISTS public.cita_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tipo_cita text NOT NULL CHECK (tipo_cita IN ('visita', 'llamada')),
  visita_id uuid REFERENCES public.control_visitas(id) ON DELETE CASCADE,
  llamada_id uuid REFERENCES public.registro_llamadas(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE CASCADE,
  codigo_corto text NOT NULL UNIQUE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  estado_checkin text NOT NULL DEFAULT 'pendiente' CHECK (estado_checkin IN ('pendiente','llegado','atendido','no_show','cancelado')),
  fecha_llegada timestamp with time zone,
  fecha_atencion timestamp with time zone,
  checkin_por uuid,
  notas_checkin text,
  enviado_whatsapp boolean DEFAULT false,
  enviado_email boolean DEFAULT false,
  impreso boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cita_tickets_one_ref CHECK (
    (visita_id IS NOT NULL AND llamada_id IS NULL) OR
    (visita_id IS NULL AND llamada_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_cita_tickets_visita ON public.cita_tickets(visita_id);
CREATE INDEX IF NOT EXISTS idx_cita_tickets_llamada ON public.cita_tickets(llamada_id);
CREATE INDEX IF NOT EXISTS idx_cita_tickets_codigo ON public.cita_tickets(codigo_corto);
CREATE INDEX IF NOT EXISTS idx_cita_tickets_token ON public.cita_tickets(token);
CREATE INDEX IF NOT EXISTS idx_cita_tickets_workspace ON public.cita_tickets(workspace_id);

-- Función para generar código corto único (formato ABC-1234)
CREATE OR REPLACE FUNCTION public.generar_codigo_ticket()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  letras text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  numeros text := '23456789';
  codigo text;
  intentos int := 0;
BEGIN
  LOOP
    codigo := substr(letras, 1 + floor(random() * length(letras))::int, 1) ||
              substr(letras, 1 + floor(random() * length(letras))::int, 1) ||
              substr(letras, 1 + floor(random() * length(letras))::int, 1) ||
              '-' ||
              substr(numeros, 1 + floor(random() * length(numeros))::int, 1) ||
              substr(numeros, 1 + floor(random() * length(numeros))::int, 1) ||
              substr(numeros, 1 + floor(random() * length(numeros))::int, 1) ||
              substr(numeros, 1 + floor(random() * length(numeros))::int, 1);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.cita_tickets WHERE codigo_corto = codigo);
    intentos := intentos + 1;
    IF intentos > 50 THEN
      RAISE EXCEPTION 'No se pudo generar un código único';
    END IF;
  END LOOP;
  RETURN codigo;
END;
$$;

-- Trigger para auto-generar código si no se provee
CREATE OR REPLACE FUNCTION public.cita_tickets_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.codigo_corto IS NULL OR NEW.codigo_corto = '' THEN
    NEW.codigo_corto := public.generar_codigo_ticket();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cita_tickets_before_insert ON public.cita_tickets;
CREATE TRIGGER trg_cita_tickets_before_insert
  BEFORE INSERT ON public.cita_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.cita_tickets_before_insert();

DROP TRIGGER IF EXISTS trg_cita_tickets_updated_at ON public.cita_tickets;
CREATE TRIGGER trg_cita_tickets_updated_at
  BEFORE UPDATE ON public.cita_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.cita_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY cita_tickets_select_ownership ON public.cita_tickets
  FOR SELECT TO authenticated
  USING (
    is_admin_or_coordinador(auth.uid())
    OR (paciente_id IS NOT NULL AND is_staff_clinico_de_paciente(auth.uid(), paciente_id))
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  );

CREATE POLICY cita_tickets_insert_ownership ON public.cita_tickets
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_or_coordinador(auth.uid())
    OR (paciente_id IS NOT NULL AND is_staff_clinico_de_paciente(auth.uid(), paciente_id))
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  );

CREATE POLICY cita_tickets_update_ownership ON public.cita_tickets
  FOR UPDATE TO authenticated
  USING (
    is_admin_or_coordinador(auth.uid())
    OR (paciente_id IS NOT NULL AND is_staff_clinico_de_paciente(auth.uid(), paciente_id))
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  );

CREATE POLICY cita_tickets_delete_admin ON public.cita_tickets
  FOR DELETE TO authenticated
  USING (is_admin_or_coordinador(auth.uid()));
