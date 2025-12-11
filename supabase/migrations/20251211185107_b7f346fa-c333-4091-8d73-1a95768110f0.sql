-- Create table for confirmed duplicate exceptions
CREATE TABLE public.excepciones_duplicados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_existente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  campo_duplicado TEXT NOT NULL, -- 'telefono_px', 'telefono_cuidador', 'nombre_completo', 'cedula'
  valor_duplicado TEXT NOT NULL,
  confirmado_por UUID REFERENCES auth.users(id),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index to prevent duplicate exceptions
CREATE UNIQUE INDEX idx_excepciones_duplicados_unique 
ON public.excepciones_duplicados(paciente_existente_id, campo_duplicado, valor_duplicado);

-- Enable RLS
ALTER TABLE public.excepciones_duplicados ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view excepciones" 
ON public.excepciones_duplicados 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert excepciones" 
ON public.excepciones_duplicados 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete excepciones" 
ON public.excepciones_duplicados 
FOR DELETE 
USING (true);

-- Add comment
COMMENT ON TABLE public.excepciones_duplicados IS 'Stores confirmed duplicate exceptions (e.g., spouses sharing same phone number)';