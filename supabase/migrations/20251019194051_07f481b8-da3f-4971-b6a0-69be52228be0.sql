-- Parte 1: Agregar valores a enums y columnas

-- Agregar nuevos valores al enum estado_llamada si no existen
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pendiente' AND enumtypid = 'estado_llamada'::regtype) THEN
    ALTER TYPE estado_llamada ADD VALUE 'pendiente';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'reagendada' AND enumtypid = 'estado_llamada'::regtype) THEN
    ALTER TYPE estado_llamada ADD VALUE 'reagendada';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'no_contesta' AND enumtypid = 'estado_llamada'::regtype) THEN
    ALTER TYPE estado_llamada ADD VALUE 'no_contesta';
  END IF;
END $$;

-- Agregar nuevos valores al enum resultado_seguimiento si no existen
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'llamada_fallida' AND enumtypid = 'resultado_seguimiento'::regtype) THEN
    ALTER TYPE resultado_seguimiento ADD VALUE 'llamada_fallida';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'requiere_seguimiento' AND enumtypid = 'resultado_seguimiento'::regtype) THEN
    ALTER TYPE resultado_seguimiento ADD VALUE 'requiere_seguimiento';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'visita_agendada' AND enumtypid = 'resultado_seguimiento'::regtype) THEN
    ALTER TYPE resultado_seguimiento ADD VALUE 'visita_agendada';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'paciente_decline' AND enumtypid = 'resultado_seguimiento'::regtype) THEN
    ALTER TYPE resultado_seguimiento ADD VALUE 'paciente_decline';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'no_disponible' AND enumtypid = 'resultado_seguimiento'::regtype) THEN
    ALTER TYPE resultado_seguimiento ADD VALUE 'no_disponible';
  END IF;
END $$;

-- Agregar nuevas columnas a la tabla registro_llamadas
ALTER TABLE registro_llamadas 
  ADD COLUMN IF NOT EXISTS duracion_estimada integer,
  ADD COLUMN IF NOT EXISTS requiere_seguimiento boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS recordatorio_enviado boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notas_adicionales text,
  ADD COLUMN IF NOT EXISTS archivos_adjuntos jsonb DEFAULT '[]'::jsonb;

-- Actualizar políticas RLS para permitir UPDATE
DROP POLICY IF EXISTS "Authenticated users can update llamadas" ON registro_llamadas;
CREATE POLICY "Authenticated users can update llamadas" 
ON registro_llamadas
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);