
-- RECETAS / PRESCRIPCIONES DIGITALES
CREATE TYPE public.estado_receta AS ENUM ('activa','dispensada','vencida','cancelada');

CREATE TABLE public.recetas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  profesional_id uuid NOT NULL REFERENCES public.personal_salud(id),
  visita_id uuid REFERENCES public.control_visitas(id),
  diagnostico_texto text,
  indicaciones_generales text,
  vigencia_dias int NOT NULL DEFAULT 30,
  estado estado_receta NOT NULL DEFAULT 'activa',
  fecha_emision timestamptz NOT NULL DEFAULT now(),
  workspace_id uuid REFERENCES public.workspaces(id),
  sucursal_id uuid REFERENCES public.sucursales(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.recetas_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receta_id uuid NOT NULL REFERENCES public.recetas(id) ON DELETE CASCADE,
  medicamento text NOT NULL,
  presentacion text,
  dosis text,
  via_administracion text DEFAULT 'oral',
  frecuencia text,
  duracion text,
  cantidad text,
  indicaciones text,
  orden int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recetas_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recetas_select" ON public.recetas FOR SELECT TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));
CREATE POLICY "recetas_insert" ON public.recetas FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));
CREATE POLICY "recetas_update" ON public.recetas FOR UPDATE TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));
CREATE POLICY "recetas_delete" ON public.recetas FOR DELETE TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));

CREATE POLICY "recetas_items_select" ON public.recetas_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.recetas r WHERE r.id = receta_id AND (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), r.paciente_id))));
CREATE POLICY "recetas_items_insert" ON public.recetas_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.recetas r WHERE r.id = receta_id AND (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), r.paciente_id))));
CREATE POLICY "recetas_items_update" ON public.recetas_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.recetas r WHERE r.id = receta_id AND (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), r.paciente_id))));
CREATE POLICY "recetas_items_delete" ON public.recetas_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.recetas r WHERE r.id = receta_id AND public.is_admin_or_coordinador(auth.uid())));

CREATE TRIGGER audit_recetas AFTER INSERT OR UPDATE OR DELETE ON public.recetas FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
CREATE TRIGGER audit_recetas_items AFTER INSERT OR UPDATE OR DELETE ON public.recetas_items FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
CREATE TRIGGER update_recetas_updated_at BEFORE UPDATE ON public.recetas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PLANTILLAS POR ESPECIALIDAD
CREATE TYPE public.especialidad_medica AS ENUM (
  'medicina_general','pediatria','ginecologia','cardiologia',
  'dermatologia','odontologia','psicologia','laboratorio',
  'imagenes','emergencias','otro'
);

CREATE TABLE public.plantillas_especialidad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id),
  especialidad especialidad_medica NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  campos_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  activo boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.consultas_especialidad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  profesional_id uuid NOT NULL REFERENCES public.personal_salud(id),
  plantilla_id uuid REFERENCES public.plantillas_especialidad(id),
  visita_id uuid REFERENCES public.control_visitas(id),
  especialidad especialidad_medica NOT NULL,
  datos_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  workspace_id uuid REFERENCES public.workspaces(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plantillas_especialidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultas_especialidad ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plantillas_select" ON public.plantillas_especialidad FOR SELECT TO authenticated USING (true);
CREATE POLICY "plantillas_insert" ON public.plantillas_especialidad FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_coordinador(auth.uid()));
CREATE POLICY "plantillas_update" ON public.plantillas_especialidad FOR UPDATE TO authenticated USING (public.is_admin_or_coordinador(auth.uid()));
CREATE POLICY "plantillas_delete" ON public.plantillas_especialidad FOR DELETE TO authenticated USING (public.is_admin_or_coordinador(auth.uid()));

CREATE POLICY "consultas_esp_select" ON public.consultas_especialidad FOR SELECT TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));
CREATE POLICY "consultas_esp_insert" ON public.consultas_especialidad FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));
CREATE POLICY "consultas_esp_update" ON public.consultas_especialidad FOR UPDATE TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()) OR public.is_staff_clinico_de_paciente(auth.uid(), paciente_id));

CREATE TRIGGER audit_consultas_esp AFTER INSERT OR UPDATE OR DELETE ON public.consultas_especialidad FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
CREATE TRIGGER update_plantillas_updated_at BEFORE UPDATE ON public.plantillas_especialidad FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_consultas_esp_updated_at BEFORE UPDATE ON public.consultas_especialidad FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_recetas_paciente ON public.recetas(paciente_id);
CREATE INDEX idx_recetas_profesional ON public.recetas(profesional_id);
CREATE INDEX idx_recetas_items_receta ON public.recetas_items(receta_id);
CREATE INDEX idx_consultas_esp_paciente ON public.consultas_especialidad(paciente_id);
CREATE INDEX idx_plantillas_esp ON public.plantillas_especialidad(especialidad);
