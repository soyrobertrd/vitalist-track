-- Allow admins to delete patients
CREATE POLICY "Admins can delete pacientes"
ON public.pacientes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Create table for action plan notifications after visits
CREATE TABLE IF NOT EXISTS public.notificaciones_plan_accion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visita_id UUID NOT NULL REFERENCES public.control_visitas(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  completada BOOLEAN DEFAULT FALSE,
  notas_visita TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(visita_id)
);

-- Enable RLS
ALTER TABLE public.notificaciones_plan_accion ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their notifications"
ON public.notificaciones_plan_accion
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert notifications"
ON public.notificaciones_plan_accion
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update notifications"
ON public.notificaciones_plan_accion
FOR UPDATE
TO authenticated
USING (true);

-- Create function to automatically create notification when visit is completed
CREATE OR REPLACE FUNCTION public.crear_notificacion_plan_accion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification when visit changes to 'realizada'
  IF NEW.estado = 'realizada' AND (OLD.estado IS NULL OR OLD.estado != 'realizada') THEN
    INSERT INTO public.notificaciones_plan_accion (visita_id, paciente_id, notas_visita)
    VALUES (NEW.id, NEW.paciente_id, NEW.notas_visita)
    ON CONFLICT (visita_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic notification creation
DROP TRIGGER IF EXISTS trigger_crear_notificacion_plan_accion ON public.control_visitas;
CREATE TRIGGER trigger_crear_notificacion_plan_accion
AFTER INSERT OR UPDATE ON public.control_visitas
FOR EACH ROW
EXECUTE FUNCTION public.crear_notificacion_plan_accion();