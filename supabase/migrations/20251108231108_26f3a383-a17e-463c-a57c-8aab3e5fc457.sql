-- Agregar campo activo a profiles para poder suspender usuarios
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;

-- Crear tabla para historial de actividades de usuarios (opcional pero útil para auditoría)
CREATE TABLE IF NOT EXISTS public.user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  accion text NOT NULL,
  descripcion text,
  realizado_por uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- RLS para user_activity
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver el historial de actividades
CREATE POLICY "Admins can view user activity"
ON public.user_activity
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Solo admins pueden insertar actividades
CREATE POLICY "Admins can insert user activity"
ON public.user_activity
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));