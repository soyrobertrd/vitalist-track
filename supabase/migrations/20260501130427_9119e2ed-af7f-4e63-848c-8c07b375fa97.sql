
DROP POLICY IF EXISTS "ws_procesamiento" ON public.procesamiento_lab;

CREATE POLICY "ws_procesamiento_select" ON public.procesamiento_lab FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.muestras_laboratorio m
    JOIN public.pacientes p ON p.id = m.paciente_id
    WHERE m.id = procesamiento_lab.muestra_id
      AND (public.is_admin_or_coordinador(auth.uid())
           OR public.is_workspace_member(auth.uid(), p.workspace_id))
  ));

CREATE POLICY "ws_procesamiento_write" ON public.procesamiento_lab FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.muestras_laboratorio m
    JOIN public.pacientes p ON p.id = m.paciente_id
    WHERE m.id = procesamiento_lab.muestra_id
      AND public.is_workspace_member(auth.uid(), p.workspace_id)
  ));

CREATE POLICY "ws_procesamiento_update" ON public.procesamiento_lab FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.muestras_laboratorio m
    JOIN public.pacientes p ON p.id = m.paciente_id
    WHERE m.id = procesamiento_lab.muestra_id
      AND public.is_workspace_member(auth.uid(), p.workspace_id)
  ));

CREATE POLICY "ws_procesamiento_delete" ON public.procesamiento_lab FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.muestras_laboratorio m
    JOIN public.pacientes p ON p.id = m.paciente_id
    WHERE m.id = procesamiento_lab.muestra_id
      AND public.is_admin_or_coordinador(auth.uid())
  ));
