
-- Salas de operación
CREATE TABLE public.salas_operacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  sucursal_id uuid REFERENCES public.sucursales(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  capacidad int DEFAULT 1,
  equipamiento jsonb DEFAULT '[]'::jsonb,
  activa boolean NOT NULL DEFAULT true,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.salas_operacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws members manage salas_op" ON public.salas_operacion FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

-- Enum estados cirugía
CREATE TYPE public.estado_cirugia AS ENUM ('programada','en_curso','completada','cancelada','suspendida');
CREATE TYPE public.prioridad_cirugia AS ENUM ('electiva','urgente','emergencia');
CREATE TYPE public.rol_quirurgico AS ENUM ('cirujano_principal','asistente','anestesiologo','instrumentista','circulante');

-- Cirugías
CREATE TABLE public.cirugias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  sucursal_id uuid REFERENCES public.sucursales(id) ON DELETE SET NULL,
  sala_id uuid REFERENCES public.salas_operacion(id) ON DELETE SET NULL,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE CASCADE NOT NULL,
  profesional_id uuid REFERENCES public.personal_salud(id) ON DELETE SET NULL,
  tipo_cirugia text NOT NULL,
  diagnostico_preop text,
  fecha_programada date NOT NULL,
  hora_inicio time,
  hora_fin time,
  duracion_estimada_min int,
  estado estado_cirugia NOT NULL DEFAULT 'programada',
  prioridad prioridad_cirugia NOT NULL DEFAULT 'electiva',
  anestesiologo text,
  tipo_anestesia text,
  instrumentista text,
  consentimiento_firmado boolean DEFAULT false,
  checklist_preop jsonb DEFAULT '[]'::jsonb,
  checklist_intraop jsonb DEFAULT '[]'::jsonb,
  insumos_utilizados jsonb DEFAULT '[]'::jsonb,
  costo_estimado numeric(12,2) DEFAULT 0,
  costo_real numeric(12,2),
  notas_operatorias text,
  complicaciones text,
  sangrado_ml int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cirugias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws members manage cirugias" ON public.cirugias FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE INDEX idx_cirugias_fecha ON public.cirugias(fecha_programada);
CREATE INDEX idx_cirugias_paciente ON public.cirugias(paciente_id);
CREATE INDEX idx_cirugias_sala ON public.cirugias(sala_id);

-- Auditoría
CREATE TRIGGER audit_cirugias AFTER INSERT OR UPDATE OR DELETE ON public.cirugias
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();

-- Equipo quirúrgico
CREATE TABLE public.equipo_quirurgico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cirugia_id uuid REFERENCES public.cirugias(id) ON DELETE CASCADE NOT NULL,
  profesional_id uuid REFERENCES public.personal_salud(id) ON DELETE CASCADE NOT NULL,
  rol rol_quirurgico NOT NULL,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.equipo_quirurgico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws members via cirugia" ON public.equipo_quirurgico FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cirugias c WHERE c.id = cirugia_id AND public.is_workspace_member(auth.uid(), c.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cirugias c WHERE c.id = cirugia_id AND public.is_workspace_member(auth.uid(), c.workspace_id)));

-- Triggers updated_at
CREATE TRIGGER update_salas_op_updated_at BEFORE UPDATE ON public.salas_operacion
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cirugias_updated_at BEFORE UPDATE ON public.cirugias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
