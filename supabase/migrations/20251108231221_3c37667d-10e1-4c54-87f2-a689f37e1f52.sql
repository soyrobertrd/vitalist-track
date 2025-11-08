-- Habilitar realtime para las tablas de llamadas y visitas
ALTER PUBLICATION supabase_realtime ADD TABLE public.registro_llamadas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.control_visitas;