-- Añadir columna `vertical` a tablas core para aislamiento por vertical
DO $$
DECLARE
  t text;
  tablas text[] := ARRAY[
    'pacientes','citas_universales','personal_salud','facturas',
    'registro_llamadas','control_visitas','consultas_especialidad',
    'altas_hospitalarias','admisiones','recetas_medicas','ordenes_medicas'
  ];
BEGIN
  FOREACH t IN ARRAY tablas LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t)
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='vertical') THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN vertical public.vertical_tipo NOT NULL DEFAULT ''clinica''', t);
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_vertical ON public.%I (vertical)', t, t);
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_ws_vertical ON public.%I (workspace_id, vertical)', t, t);
    END IF;
  END LOOP;
END $$;

-- Asegurar que datos existentes queden como 'clinica' (Hospital)
UPDATE public.pacientes SET vertical='clinica' WHERE vertical IS NULL;
UPDATE public.citas_universales SET vertical='clinica' WHERE vertical IS NULL;
UPDATE public.personal_salud SET vertical='clinica' WHERE vertical IS NULL;
UPDATE public.facturas SET vertical='clinica' WHERE vertical IS NULL;