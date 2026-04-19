
CREATE TABLE public.contactos_landing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  empresa TEXT,
  telefono TEXT,
  pais TEXT,
  tamano_clinica TEXT,
  mensaje TEXT NOT NULL,
  plan_interes TEXT,
  estado TEXT NOT NULL DEFAULT 'nuevo',
  notas_internas TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contactos_landing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gestiona leads landing"
ON public.contactos_landing
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_contactos_landing_updated_at
BEFORE UPDATE ON public.contactos_landing
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_contactos_landing_estado ON public.contactos_landing(estado);
CREATE INDEX idx_contactos_landing_created_at ON public.contactos_landing(created_at DESC);
