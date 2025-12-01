-- Add RLS policies for dias_no_laborables table to allow admin/coordinador to manage
CREATE POLICY "Admins can insert dias no laborables"
ON public.dias_no_laborables
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coordinador'::app_role));

CREATE POLICY "Admins can update dias no laborables"
ON public.dias_no_laborables
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coordinador'::app_role));

CREATE POLICY "Admins can delete dias no laborables"
ON public.dias_no_laborables
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coordinador'::app_role));

-- Add es_ciclico column to dias_no_laborables
ALTER TABLE public.dias_no_laborables ADD COLUMN IF NOT EXISTS es_ciclico boolean DEFAULT false;

-- Create table for professional absences/leaves
CREATE TABLE IF NOT EXISTS public.ausencias_profesionales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id uuid REFERENCES public.personal_salud(id) ON DELETE CASCADE NOT NULL,
  fecha_inicio date NOT NULL,
  fecha_fin date NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('vacaciones', 'licencia', 'permiso', 'ausencia', 'enfermedad')),
  descripcion text,
  aprobado boolean DEFAULT false,
  aprobado_por uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on ausencias_profesionales
ALTER TABLE public.ausencias_profesionales ENABLE ROW LEVEL SECURITY;

-- RLS policies for ausencias_profesionales
CREATE POLICY "Authenticated users can view ausencias"
ON public.ausencias_profesionales
FOR SELECT
USING (true);

CREATE POLICY "Admins and coordinadores can insert ausencias"
ON public.ausencias_profesionales
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coordinador'::app_role));

CREATE POLICY "Admins and coordinadores can update ausencias"
ON public.ausencias_profesionales
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coordinador'::app_role));

CREATE POLICY "Admins and coordinadores can delete ausencias"
ON public.ausencias_profesionales
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coordinador'::app_role));