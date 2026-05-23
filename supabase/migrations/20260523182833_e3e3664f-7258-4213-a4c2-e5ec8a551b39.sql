
INSERT INTO public.especialidad_categoria_module_access (categoria, modulo_key)
VALUES ('tecnica','agenda'), ('otra','agenda')
ON CONFLICT DO NOTHING;
