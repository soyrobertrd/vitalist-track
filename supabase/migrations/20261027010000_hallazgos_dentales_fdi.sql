-- La carta dental usa numeración FDI (11-18, 21-28, 31-38, 41-48), pero el CHECK original
-- solo aceptaba 1-32 (numeración universal): los dientes 33-48 no se podían registrar.
ALTER TABLE public.hallazgos_dentales DROP CONSTRAINT IF EXISTS hallazgos_dentales_numero_diente_check;
ALTER TABLE public.hallazgos_dentales ADD CONSTRAINT hallazgos_dentales_numero_diente_check
  CHECK (numero_diente BETWEEN 1 AND 32 OR (numero_diente / 10 BETWEEN 1 AND 4 AND numero_diente % 10 BETWEEN 1 AND 8));
