CREATE TABLE IF NOT EXISTS public.casos_psico_infantil (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  paciente_id uuid NOT NULL,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);