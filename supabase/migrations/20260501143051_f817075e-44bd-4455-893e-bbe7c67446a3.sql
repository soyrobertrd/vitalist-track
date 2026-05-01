-- INDICADORES DE CALIDAD
CREATE TABLE public.indicadores_calidad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  nombre text NOT NULL,
  categoria text NOT NULL CHECK (categoria IN ('mortalidad','infecciones','readmision','estancia_media','satisfaccion','seguridad','eficiencia','clinico','financiero','otro')),
  descripcion text,
  formula text,
  unidad text DEFAULT '%',
  meta numeric,
  umbral_alerta numeric,
  umbral_critico numeric,
  estandar text CHECK (estandar IN ('JCI','ISO_9001','MINISTERIO','INTERNO','OTRO')),
  frecuencia text DEFAULT 'mensual' CHECK (frecuencia IN ('diario','semanal','mensual','trimestral','anual')),
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, codigo)
);

CREATE TABLE public.mediciones_indicadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  indicador_id uuid NOT NULL REFERENCES public.indicadores_calidad(id) ON DELETE CASCADE,
  sucursal_id uuid,
  periodo_inicio date NOT NULL,
  periodo_fin date NOT NULL,
  numerador numeric NOT NULL DEFAULT 0,
  denominador numeric NOT NULL DEFAULT 0,
  resultado numeric,
  cumple_meta boolean,
  observaciones text,
  registrado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mediciones_periodo ON public.mediciones_indicadores(workspace_id, periodo_inicio DESC);

-- EVENTOS ADVERSOS
CREATE TABLE public.eventos_adversos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  numero text,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  fecha_evento timestamptz NOT NULL DEFAULT now(),
  tipo text NOT NULL CHECK (tipo IN ('medicacion','caida','infeccion_iaas','error_quirurgico','identificacion','transfusion','equipos','procedimiento','documentacion','comunicacion','otro')),
  severidad text NOT NULL CHECK (severidad IN ('leve','moderado','grave','centinela')),
  departamento text,
  descripcion text NOT NULL,
  causa_raiz text,
  consecuencias text,
  reportado_por uuid,
  involucrados jsonb DEFAULT '[]'::jsonb,
  notificado_paciente boolean DEFAULT false,
  notificado_familia boolean DEFAULT false,
  estado text NOT NULL DEFAULT 'reportado' CHECK (estado IN ('reportado','en_investigacion','con_plan_accion','cerrado')),
  fecha_cierre timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_eventos_adversos_ws ON public.eventos_adversos(workspace_id, fecha_evento DESC);

CREATE TABLE public.acciones_correctivas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  evento_id uuid REFERENCES public.eventos_adversos(id) ON DELETE CASCADE,
  no_conformidad_id uuid,
  descripcion text NOT NULL,
  responsable_id uuid,
  fecha_limite date,
  fecha_completado date,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','en_proceso','completada','vencida','cancelada')),
  evidencia text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- COMITÉS Y AUDITORÍAS
CREATE TABLE public.comites_calidad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('etica','infecciones','mortalidad','farmacoterapeutico','seguridad','calidad','tejidos','historia_clinica','otro')),
  descripcion text,
  miembros jsonb DEFAULT '[]'::jsonb,
  presidente_id uuid,
  frecuencia_reunion text DEFAULT 'mensual',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.reuniones_comite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  comite_id uuid NOT NULL REFERENCES public.comites_calidad(id) ON DELETE CASCADE,
  fecha_reunion timestamptz NOT NULL,
  agenda text,
  asistentes jsonb DEFAULT '[]'::jsonb,
  acuerdos text,
  acta_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.auditorias_calidad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('interna','externa','seguimiento','certificacion')),
  estandar text CHECK (estandar IN ('JCI','ISO_9001','MINISTERIO','INTERNO','OTRO')),
  fecha_inicio date NOT NULL,
  fecha_fin date,
  alcance text,
  auditor text,
  estado text NOT NULL DEFAULT 'planificada' CHECK (estado IN ('planificada','en_ejecucion','completada','cancelada')),
  resultado_general text,
  puntaje numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.no_conformidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  auditoria_id uuid REFERENCES public.auditorias_calidad(id) ON DELETE SET NULL,
  codigo text,
  area text NOT NULL,
  descripcion text NOT NULL,
  severidad text NOT NULL CHECK (severidad IN ('observacion','menor','mayor','critica')),
  requisito text,
  responsable_id uuid,
  fecha_deteccion date NOT NULL DEFAULT CURRENT_DATE,
  fecha_limite_cierre date,
  fecha_cierre date,
  estado text NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta','en_correccion','cerrada','vencida')),
  evidencia_cierre text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- CHAT TELEMEDICINA
CREATE TABLE public.telemedicina_chat_mensajes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id uuid NOT NULL REFERENCES public.telemedicina_sesiones(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  remitente_tipo text NOT NULL CHECK (remitente_tipo IN ('paciente','profesional','sistema')),
  remitente_user_id uuid,
  remitente_nombre text,
  mensaje text NOT NULL,
  archivo_url text,
  leido boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_sesion ON public.telemedicina_chat_mensajes(sesion_id, created_at);

-- RLS
ALTER TABLE public.indicadores_calidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mediciones_indicadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_adversos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acciones_correctivas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comites_calidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reuniones_comite ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditorias_calidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.no_conformidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemedicina_chat_mensajes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws indicadores_calidad" ON public.indicadores_calidad FOR ALL
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws mediciones_indicadores" ON public.mediciones_indicadores FOR ALL
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws eventos_adversos" ON public.eventos_adversos FOR ALL
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws acciones_correctivas" ON public.acciones_correctivas FOR ALL
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws comites_calidad" ON public.comites_calidad FOR ALL
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws reuniones_comite" ON public.reuniones_comite FOR ALL
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws auditorias_calidad" ON public.auditorias_calidad FOR ALL
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws no_conformidades" ON public.no_conformidades FOR ALL
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws telemed_chat" ON public.telemedicina_chat_mensajes FOR ALL
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER update_indicadores_calidad_updated_at BEFORE UPDATE ON public.indicadores_calidad
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_eventos_adversos_updated_at BEFORE UPDATE ON public.eventos_adversos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_acciones_correctivas_updated_at BEFORE UPDATE ON public.acciones_correctivas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_comites_calidad_updated_at BEFORE UPDATE ON public.comites_calidad
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_auditorias_calidad_updated_at BEFORE UPDATE ON public.auditorias_calidad
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_no_conformidades_updated_at BEFORE UPDATE ON public.no_conformidades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto numerar evento adverso
CREATE OR REPLACE FUNCTION public.generar_numero_evento_adverso()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.eventos_adversos
      WHERE workspace_id = NEW.workspace_id AND numero LIKE 'EA-' || v_year || '-%';
    NEW.numero := 'EA-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_evento_numero BEFORE INSERT ON public.eventos_adversos
  FOR EACH ROW EXECUTE FUNCTION public.generar_numero_evento_adverso();