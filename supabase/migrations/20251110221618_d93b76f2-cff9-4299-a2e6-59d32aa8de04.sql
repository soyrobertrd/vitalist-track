-- Agregar campos para control de WhatsApp y número principal de contacto
ALTER TABLE public.pacientes 
ADD COLUMN whatsapp_px boolean DEFAULT false,
ADD COLUMN whatsapp_cuidador boolean DEFAULT false,
ADD COLUMN numero_principal text CHECK (numero_principal IN ('paciente', 'cuidador'));

-- Agregar comentarios para documentación
COMMENT ON COLUMN public.pacientes.whatsapp_px IS 'Indica si el número del paciente tiene WhatsApp';
COMMENT ON COLUMN public.pacientes.whatsapp_cuidador IS 'Indica si el número del cuidador tiene WhatsApp';
COMMENT ON COLUMN public.pacientes.numero_principal IS 'Indica cuál es el número principal de contacto: paciente o cuidador';