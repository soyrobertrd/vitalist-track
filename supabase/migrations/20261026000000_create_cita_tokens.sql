-- Migración para S11: Tabla segura de tokens para confirmación y reagendamiento de citas
CREATE TABLE IF NOT EXISTS public.cita_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cita_id UUID NOT NULL,
  hash TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL, -- 'llamada' | 'visita'
  expira_en TIMESTAMPTZ NOT NULL,
  usado_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cita_tokens_hash ON public.cita_tokens(hash);
CREATE INDEX IF NOT EXISTS idx_cita_tokens_cita_id ON public.cita_tokens(cita_id);

ALTER TABLE public.cita_tokens ENABLE ROW LEVEL SECURITY;

-- Permitir lectura anónima por hash para la confirmación de la cita
DROP POLICY IF EXISTS "Permitir consultar token por hash" ON public.cita_tokens;
CREATE POLICY "Permitir consultar token por hash" ON public.cita_tokens
  FOR SELECT USING (true);

-- Permitir marcar el token como usado cuando no ha sido usado
DROP POLICY IF EXISTS "Permitir marcar token usado" ON public.cita_tokens;
CREATE POLICY "Permitir marcar token usado" ON public.cita_tokens
  FOR UPDATE USING (usado_en IS NULL) WITH CHECK (true);
