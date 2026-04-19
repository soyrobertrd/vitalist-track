ALTER PUBLICATION supabase_realtime ADD TABLE public.cita_tickets;
ALTER TABLE public.cita_tickets REPLICA IDENTITY FULL;