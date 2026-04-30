
-- =============================================
-- FASE L: Esterilización, Morgue, Mantenimiento, Docencia
-- =============================================

-- =============== ESTERILIZACIÓN Y CEYE ===============

CREATE TABLE public.ciclos_esterilizacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  numero text NOT NULL DEFAULT '',
  equipo text NOT NULL DEFAULT '',
  metodo text NOT NULL DEFAULT 'autoclave' CHECK (metodo IN ('autoclave','oxido_etileno','plasma','glutaraldehido','otro')),
  temperatura_c numeric(5,1),
  presion_psi numeric(5,1),
  duracion_minutos int,
  indicador_biologico boolean DEFAULT false,
  indicador_quimico boolean DEFAULT false,
  resultado text NOT NULL DEFAULT 'preparado' CHECK (resultado IN ('preparado','en_proceso','completado','fallido')),
  operador_id uuid REFERENCES public.personal_salud(id),
  observaciones text,
  fecha_inicio timestamptz DEFAULT now(),
  fecha_fin timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.paquetes_quirurgicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  codigo text,
  contenido jsonb DEFAULT '[]'::jsonb,
  estado text NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible','en_uso','en_esterilizacion','retirado')),
  ultimo_ciclo_id uuid REFERENCES public.ciclos_esterilizacion(id),
  fecha_vencimiento_esterilizacion timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ciclos_esterilizacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paquetes_quirurgicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ciclos_est_workspace" ON public.ciclos_esterilizacion FOR ALL USING (
  public.is_workspace_member(auth.uid(), workspace_id)
);
CREATE POLICY "paquetes_qx_workspace" ON public.paquetes_quirurgicos FOR ALL USING (
  public.is_workspace_member(auth.uid(), workspace_id)
);

CREATE OR REPLACE FUNCTION public.generar_numero_ciclo_est()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.ciclos_esterilizacion WHERE numero LIKE 'EST-' || v_year || '-%';
    NEW.numero := 'EST-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_numero_ciclo_est BEFORE INSERT ON public.ciclos_esterilizacion
FOR EACH ROW EXECUTE FUNCTION public.generar_numero_ciclo_est();

CREATE TRIGGER update_ciclos_est_ts BEFORE UPDATE ON public.ciclos_esterilizacion
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_paquetes_qx_ts BEFORE UPDATE ON public.paquetes_quirurgicos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== MORGUE Y PATOLOGÍA ===============

CREATE TABLE public.registros_morgue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  numero text NOT NULL DEFAULT '',
  paciente_id uuid REFERENCES public.pacientes(id),
  nombre_fallecido text,
  causa_muerte text,
  fecha_defuncion timestamptz,
  hora_defuncion time,
  autopsia boolean DEFAULT false,
  estado text NOT NULL DEFAULT 'ingresado' CHECK (estado IN ('ingresado','en_estudio','autopsia','liberado')),
  medico_certificante_id uuid REFERENCES public.personal_salud(id),
  familiar_receptor text,
  cedula_receptor text,
  fecha_liberacion timestamptz,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.estudios_patologia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  numero text NOT NULL DEFAULT '',
  paciente_id uuid REFERENCES public.pacientes(id),
  tipo text NOT NULL DEFAULT 'biopsia' CHECK (tipo IN ('biopsia','citologia','histopatologia','autopsia','inmunohistoquimica')),
  muestra text NOT NULL DEFAULT '',
  sitio_anatomico text,
  medico_solicitante_id uuid REFERENCES public.personal_salud(id),
  patologo_id uuid REFERENCES public.personal_salud(id),
  diagnostico_macro text,
  diagnostico_micro text,
  diagnostico_final text,
  estado text NOT NULL DEFAULT 'recibido' CHECK (estado IN ('recibido','en_proceso','completado','entregado')),
  fecha_recepcion timestamptz DEFAULT now(),
  fecha_resultado timestamptz,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.registros_morgue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudios_patologia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "morgue_workspace" ON public.registros_morgue FOR ALL USING (
  public.is_workspace_member(auth.uid(), workspace_id)
);
CREATE POLICY "patologia_workspace" ON public.estudios_patologia FOR ALL USING (
  public.is_workspace_member(auth.uid(), workspace_id)
);

CREATE OR REPLACE FUNCTION public.generar_numero_morgue()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.registros_morgue WHERE numero LIKE 'MRG-' || v_year || '-%';
    NEW.numero := 'MRG-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.generar_numero_patologia()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.estudios_patologia WHERE numero LIKE 'PAT-' || v_year || '-%';
    NEW.numero := 'PAT-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_numero_morgue BEFORE INSERT ON public.registros_morgue
FOR EACH ROW EXECUTE FUNCTION public.generar_numero_morgue();
CREATE TRIGGER trg_numero_patologia BEFORE INSERT ON public.estudios_patologia
FOR EACH ROW EXECUTE FUNCTION public.generar_numero_patologia();

CREATE TRIGGER update_morgue_ts BEFORE UPDATE ON public.registros_morgue
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patologia_ts BEFORE UPDATE ON public.estudios_patologia
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== MANTENIMIENTO HOSPITALARIO ===============

CREATE TABLE public.equipos_hospitalarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  modelo text,
  numero_serie text,
  marca text,
  ubicacion text,
  departamento text,
  estado text NOT NULL DEFAULT 'operativo' CHECK (estado IN ('operativo','en_mantenimiento','fuera_servicio','baja')),
  fecha_adquisicion date,
  fecha_ultimo_mantenimiento date,
  proximo_mantenimiento date,
  garantia_hasta date,
  costo_adquisicion numeric(12,2),
  proveedor text,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ordenes_mantenimiento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  numero text NOT NULL DEFAULT '',
  equipo_id uuid NOT NULL REFERENCES public.equipos_hospitalarios(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'correctivo' CHECK (tipo IN ('preventivo','correctivo','calibracion','instalacion')),
  prioridad text NOT NULL DEFAULT 'normal' CHECK (prioridad IN ('baja','normal','alta','urgente')),
  estado text NOT NULL DEFAULT 'solicitada' CHECK (estado IN ('solicitada','asignada','en_proceso','completada','cancelada')),
  descripcion text,
  tecnico_asignado text,
  fecha_solicitud timestamptz DEFAULT now(),
  fecha_inicio timestamptz,
  fecha_fin timestamptz,
  costo numeric(12,2),
  repuestos_usados jsonb DEFAULT '[]'::jsonb,
  resultado text,
  solicitado_por uuid REFERENCES public.personal_salud(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.equipos_hospitalarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_mantenimiento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "equipos_hosp_workspace" ON public.equipos_hospitalarios FOR ALL USING (
  public.is_workspace_member(auth.uid(), workspace_id)
);
CREATE POLICY "ordenes_mnt_workspace" ON public.ordenes_mantenimiento FOR ALL USING (
  public.is_workspace_member(auth.uid(), workspace_id)
);

CREATE OR REPLACE FUNCTION public.generar_numero_orden_mnt()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.ordenes_mantenimiento WHERE numero LIKE 'MNT-' || v_year || '-%';
    NEW.numero := 'MNT-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_numero_orden_mnt BEFORE INSERT ON public.ordenes_mantenimiento
FOR EACH ROW EXECUTE FUNCTION public.generar_numero_orden_mnt();

CREATE TRIGGER update_equipos_hosp_ts BEFORE UPDATE ON public.equipos_hospitalarios
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ordenes_mnt_ts BEFORE UPDATE ON public.ordenes_mantenimiento
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== DOCENCIA E INVESTIGACIÓN ===============

CREATE TABLE public.programas_docencia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo text NOT NULL DEFAULT 'residencia' CHECK (tipo IN ('residencia','rotacion','pasantia','fellowship','diplomado','curso')),
  especialidad text,
  duracion_meses int,
  cupo_maximo int,
  coordinador_id uuid REFERENCES public.personal_salud(id),
  descripcion text,
  requisitos text,
  activo boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.residentes_rotaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  programa_id uuid NOT NULL REFERENCES public.programas_docencia(id) ON DELETE CASCADE,
  profesional_id uuid REFERENCES public.personal_salud(id),
  nombre_residente text,
  universidad text,
  periodo_inicio date,
  periodo_fin date,
  area_rotacion text,
  supervisor_id uuid REFERENCES public.personal_salud(id),
  evaluaciones jsonb DEFAULT '[]'::jsonb,
  calificacion_final numeric(4,2),
  estado text NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','completada','cancelada','suspendida')),
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.protocolos_investigacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  numero text NOT NULL DEFAULT '',
  titulo text NOT NULL,
  investigador_principal_id uuid REFERENCES public.personal_salud(id),
  co_investigadores jsonb DEFAULT '[]'::jsonb,
  resumen text,
  objetivo text,
  metodologia text,
  poblacion_estudio text,
  tamano_muestra int,
  comite_etica text NOT NULL DEFAULT 'pendiente' CHECK (comite_etica IN ('pendiente','aprobado','rechazado','suspendido','exento')),
  fecha_aprobacion_etica date,
  estado text NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','en_revision','activo','completado','suspendido','cancelado')),
  fecha_inicio date,
  fecha_fin_estimada date,
  financiamiento text,
  monto_financiamiento numeric(12,2),
  resultados text,
  publicaciones jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.programas_docencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.residentes_rotaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocolos_investigacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "programas_doc_workspace" ON public.programas_docencia FOR ALL USING (
  public.is_workspace_member(auth.uid(), workspace_id)
);
CREATE POLICY "residentes_rot_workspace" ON public.residentes_rotaciones FOR ALL USING (
  public.is_workspace_member(auth.uid(), workspace_id)
);
CREATE POLICY "protocolos_inv_workspace" ON public.protocolos_investigacion FOR ALL USING (
  public.is_workspace_member(auth.uid(), workspace_id)
);

CREATE OR REPLACE FUNCTION public.generar_numero_protocolo_inv()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.protocolos_investigacion WHERE numero LIKE 'INV-' || v_year || '-%';
    NEW.numero := 'INV-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_numero_protocolo_inv BEFORE INSERT ON public.protocolos_investigacion
FOR EACH ROW EXECUTE FUNCTION public.generar_numero_protocolo_inv();

CREATE TRIGGER update_programas_doc_ts BEFORE UPDATE ON public.programas_docencia
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_residentes_rot_ts BEFORE UPDATE ON public.residentes_rotaciones
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_protocolos_inv_ts BEFORE UPDATE ON public.protocolos_investigacion
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
