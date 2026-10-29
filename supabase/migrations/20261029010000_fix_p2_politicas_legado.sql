-- Auditoría de seguridad run-1 (P2): políticas antiguas USING(true) que, al sumarse (OR) a las
-- políticas por clínica, seguían dejando leer datos de todas las clínicas.

-- personal_salud: ya existe personal_select_workspace; la antigua la anulaba.
DROP POLICY IF EXISTS "Authenticated users can view personal" ON public.personal_salud;

-- historial_recordatorios: se acota por la clínica del paciente.
DROP POLICY IF EXISTS "Authenticated users can view historial_recordatorios" ON public.historial_recordatorios;
CREATE POLICY "ws_member_historial_recordatorios_select" ON public.historial_recordatorios
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pacientes p
                 WHERE p.id = paciente_id AND public.is_workspace_member(auth.uid(), p.workspace_id)));

-- excepciones_duplicados: se acota por la clínica del paciente existente.
DROP POLICY IF EXISTS "Authenticated users can view excepciones" ON public.excepciones_duplicados;
CREATE POLICY "ws_member_excepciones_select" ON public.excepciones_duplicados
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pacientes p
                 WHERE p.id = paciente_existente_id AND public.is_workspace_member(auth.uid(), p.workspace_id)));
