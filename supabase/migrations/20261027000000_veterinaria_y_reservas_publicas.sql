-- 1) Vertical Veterinaria
ALTER TYPE public.vertical_tipo ADD VALUE IF NOT EXISTS 'veterinaria';

-- Ficha de la mascota (extiende pacientes: nombre = nombre de la mascota)
CREATE TABLE IF NOT EXISTS public.vet_mascotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL UNIQUE REFERENCES public.pacientes(id) ON DELETE CASCADE,
  especie text NOT NULL CHECK (especie IN ('perro','gato','ave','conejo','reptil','roedor','equino','otro')),
  raza text,
  sexo text CHECK (sexo IN ('macho','hembra')),
  fecha_nacimiento date,
  peso_kg numeric(6,2) CHECK (peso_kg IS NULL OR peso_kg > 0),
  color text,
  microchip text,
  esterilizado boolean NOT NULL DEFAULT false,
  tutor_nombre text NOT NULL,
  tutor_telefono text,
  tutor_email text,
  alergias text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vet_vacunas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  vacuna text NOT NULL,
  fecha_aplicada date NOT NULL,
  proxima_dosis date,
  lote text,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vet_vacunas_proxima ON public.vet_vacunas(workspace_id, proxima_dosis);

ALTER TABLE public.vet_mascotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vet_vacunas ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['vet_mascotas','vet_vacunas'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_ws_all" ON public.%1$I', t);
    EXECUTE format('CREATE POLICY "%1$s_ws_all" ON public.%1$I FOR ALL TO authenticated
      USING (public.is_workspace_member(auth.uid(), workspace_id))
      WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id))', t);
  END LOOP;
END $$;

-- 2) Reservas públicas: la cita puede existir sin paciente (plan gratis / solo doctor)
ALTER TABLE public.control_visitas
  ADD COLUMN IF NOT EXISTS solicitante_nombre text,
  ADD COLUMN IF NOT EXISTS solicitante_telefono text,
  ADD COLUMN IF NOT EXISTS solicitante_email text,
  ADD COLUMN IF NOT EXISTS origen text NOT NULL DEFAULT 'interno',
  ADD COLUMN IF NOT EXISTS pendiente_registro boolean NOT NULL DEFAULT false;

-- Una cita sin paciente debe traer al menos nombre y teléfono del solicitante
ALTER TABLE public.control_visitas DROP CONSTRAINT IF EXISTS control_visitas_paciente_o_solicitante;
ALTER TABLE public.control_visitas ADD CONSTRAINT control_visitas_paciente_o_solicitante
  CHECK (paciente_id IS NOT NULL OR (solicitante_nombre IS NOT NULL AND solicitante_telefono IS NOT NULL)) NOT VALID;

-- Enlace público de reservas por centro (se apaga desde Configuración)
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS reservas_publicas_activas boolean NOT NULL DEFAULT true;

-- Límite anti-abuso: registro de reservas por IP (lo usa solo la edge function con service role)
CREATE TABLE IF NOT EXISTS public.reservas_publicas_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  workspace_id uuid NOT NULL,
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reservas_log_ip ON public.reservas_publicas_log(ip_hash, created_at);
ALTER TABLE public.reservas_publicas_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reservas_publicas_log FROM anon, authenticated;
