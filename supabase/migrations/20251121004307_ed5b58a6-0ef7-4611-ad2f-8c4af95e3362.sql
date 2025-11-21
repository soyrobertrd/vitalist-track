-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.crear_notificacion_plan_accion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create notification when visit changes to 'realizada'
  IF NEW.estado = 'realizada' AND (OLD.estado IS NULL OR OLD.estado != 'realizada') THEN
    INSERT INTO public.notificaciones_plan_accion (visita_id, paciente_id, notas_visita)
    VALUES (NEW.id, NEW.paciente_id, NEW.notas_visita)
    ON CONFLICT (visita_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;