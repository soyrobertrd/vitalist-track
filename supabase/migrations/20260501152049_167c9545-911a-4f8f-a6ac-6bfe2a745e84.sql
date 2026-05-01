-- ===== WORKFLOWS GLOBALES =====
DO $$ BEGIN
  CREATE TYPE public.wf_evento AS ENUM (
    'cita_no_confirmada','cita_proxima_24h','cirugia_manana','balance_pendiente',
    'lab_listo','paciente_sin_volver','no_show_detectado','medicamento_entregado',
    'alta_firmada','triaje_critico','documento_subido','factura_vencida','manual'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.workflow_reglas_globales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  evento public.wf_evento NOT NULL,
  condiciones jsonb NOT NULL DEFAULT '{}'::jsonb,
  acciones jsonb NOT NULL DEFAULT '[]'::jsonb,
  retraso_minutos int NOT NULL DEFAULT 0,
  prioridad int NOT NULL DEFAULT 0,
  activa boolean NOT NULL DEFAULT true,
  ejecuciones_total int NOT NULL DEFAULT 0,
  ejecuciones_exito int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wf_reglas_ws ON public.workflow_reglas_globales(workspace_id, activa);
ALTER TABLE public.workflow_reglas_globales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins ven reglas de workflow"
ON public.workflow_reglas_globales FOR SELECT
USING (EXISTS (SELECT 1 FROM public.workspace_members wm
  WHERE wm.workspace_id = workflow_reglas_globales.workspace_id
    AND wm.user_id = auth.uid() AND wm.role IN ('owner','admin')));
CREATE POLICY "Admins gestionan reglas de workflow"
ON public.workflow_reglas_globales FOR ALL
USING (EXISTS (SELECT 1 FROM public.workspace_members wm
  WHERE wm.workspace_id = workflow_reglas_globales.workspace_id
    AND wm.user_id = auth.uid() AND wm.role IN ('owner','admin')))
WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm
  WHERE wm.workspace_id = workflow_reglas_globales.workspace_id
    AND wm.user_id = auth.uid() AND wm.role IN ('owner','admin')));

CREATE TABLE IF NOT EXISTS public.workflow_ejecuciones_globales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  regla_id uuid REFERENCES public.workflow_reglas_globales(id) ON DELETE SET NULL,
  evento public.wf_evento NOT NULL,
  contexto jsonb NOT NULL DEFAULT '{}'::jsonb,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','ejecutando','completado','error')),
  resultado jsonb,
  error_mensaje text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completado_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_wf_eje_ws ON public.workflow_ejecuciones_globales(workspace_id, created_at DESC);
ALTER TABLE public.workflow_ejecuciones_globales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins ven ejecuciones"
ON public.workflow_ejecuciones_globales FOR SELECT
USING (EXISTS (SELECT 1 FROM public.workspace_members wm
  WHERE wm.workspace_id = workflow_ejecuciones_globales.workspace_id
    AND wm.user_id = auth.uid() AND wm.role IN ('owner','admin')));
CREATE POLICY "Miembros insertan ejecuciones"
ON public.workflow_ejecuciones_globales FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm
  WHERE wm.workspace_id = workflow_ejecuciones_globales.workspace_id
    AND wm.user_id = auth.uid()));

-- ===== TAREAS INTERNAS (Trello/Asana) =====
CREATE TABLE IF NOT EXISTS public.tareas_internas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descripcion text,
  departamento text NOT NULL DEFAULT 'general'
    CHECK (departamento IN ('general','recepcion','enfermeria','facturacion','medico','casos_abiertos','seguimiento','administracion')),
  prioridad text NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja','media','alta','urgente')),
  estado text NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','en_progreso','bloqueada','hecha','archivada')),
  asignado_a uuid REFERENCES auth.users(id),
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  fecha_limite timestamptz,
  etiquetas text[] DEFAULT '{}',
  orden int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  completado_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tareas_ws_dpto ON public.tareas_internas(workspace_id, departamento, estado);
CREATE INDEX IF NOT EXISTS idx_tareas_asignado ON public.tareas_internas(asignado_a);
ALTER TABLE public.tareas_internas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Miembros ven tareas del workspace"
ON public.tareas_internas FOR SELECT
USING (EXISTS (SELECT 1 FROM public.workspace_members wm
  WHERE wm.workspace_id = tareas_internas.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Miembros crean tareas"
ON public.tareas_internas FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm
  WHERE wm.workspace_id = tareas_internas.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Creador, asignado o admin actualizan"
ON public.tareas_internas FOR UPDATE
USING (
  created_by = auth.uid() OR asignado_a = auth.uid()
  OR EXISTS (SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = tareas_internas.workspace_id
      AND wm.user_id = auth.uid() AND wm.role IN ('owner','admin'))
);
CREATE POLICY "Creador o admin eliminan"
ON public.tareas_internas FOR DELETE
USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = tareas_internas.workspace_id
      AND wm.user_id = auth.uid() AND wm.role IN ('owner','admin'))
);

CREATE TABLE IF NOT EXISTS public.tareas_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id uuid NOT NULL REFERENCES public.tareas_internas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contenido text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tareas_com ON public.tareas_comentarios(tarea_id, created_at);
ALTER TABLE public.tareas_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Miembros ven comentarios"
ON public.tareas_comentarios FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.tareas_internas t
  JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
  WHERE t.id = tareas_comentarios.tarea_id AND wm.user_id = auth.uid()
));
CREATE POLICY "Usuario crea su comentario"
ON public.tareas_comentarios FOR INSERT
WITH CHECK (user_id = auth.uid() AND EXISTS (
  SELECT 1 FROM public.tareas_internas t
  JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
  WHERE t.id = tareas_comentarios.tarea_id AND wm.user_id = auth.uid()
));

-- ===== CHAT INTERNO SEGURO =====
CREATE TABLE IF NOT EXISTS public.chat_canales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo text NOT NULL DEFAULT 'general'
    CHECK (tipo IN ('general','departamento','directo','paciente','sucursal')),
  descripcion text,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE CASCADE,
  privado boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_canales_ws ON public.chat_canales(workspace_id);
ALTER TABLE public.chat_canales ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.chat_canal_miembros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canal_id uuid NOT NULL REFERENCES public.chat_canales(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rol text NOT NULL DEFAULT 'miembro' CHECK (rol IN ('admin','miembro')),
  ultima_lectura timestamptz NOT NULL DEFAULT now(),
  notificaciones boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (canal_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_chat_mem_user ON public.chat_canal_miembros(user_id);
ALTER TABLE public.chat_canal_miembros ENABLE ROW LEVEL SECURITY;

-- helper para evitar recursion
CREATE OR REPLACE FUNCTION public.es_miembro_canal(_canal_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_canal_miembros
    WHERE canal_id = _canal_id AND user_id = _user_id
  );
$$;

CREATE POLICY "Miembros ven sus canales"
ON public.chat_canales FOR SELECT
USING (
  (NOT privado AND EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = chat_canales.workspace_id AND wm.user_id = auth.uid()
  ))
  OR public.es_miembro_canal(id, auth.uid())
);
CREATE POLICY "Miembros del workspace crean canales"
ON public.chat_canales FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workspace_members wm
  WHERE wm.workspace_id = chat_canales.workspace_id AND wm.user_id = auth.uid()
));
CREATE POLICY "Creador o admin canal actualizan"
ON public.chat_canales FOR UPDATE
USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.chat_canal_miembros cm
    WHERE cm.canal_id = chat_canales.id AND cm.user_id = auth.uid() AND cm.rol = 'admin')
);

CREATE POLICY "Miembros ven membresía de sus canales"
ON public.chat_canal_miembros FOR SELECT
USING (
  user_id = auth.uid()
  OR public.es_miembro_canal(canal_id, auth.uid())
);
CREATE POLICY "Usuarios pueden añadirse a canales públicos"
ON public.chat_canal_miembros FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.chat_canal_miembros cm
    WHERE cm.canal_id = chat_canal_miembros.canal_id AND cm.user_id = auth.uid() AND cm.rol = 'admin')
);
CREATE POLICY "Usuarios actualizan su propia membresía"
ON public.chat_canal_miembros FOR UPDATE
USING (user_id = auth.uid());
CREATE POLICY "Salir del canal"
ON public.chat_canal_miembros FOR DELETE
USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.chat_mensajes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canal_id uuid NOT NULL REFERENCES public.chat_canales(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contenido text NOT NULL,
  tipo text NOT NULL DEFAULT 'texto' CHECK (tipo IN ('texto','archivo','imagen','sistema')),
  archivo_url text,
  responde_a uuid REFERENCES public.chat_mensajes(id) ON DELETE SET NULL,
  editado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_msg_canal ON public.chat_mensajes(canal_id, created_at);
ALTER TABLE public.chat_mensajes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Miembros del canal ven mensajes"
ON public.chat_mensajes FOR SELECT
USING (public.es_miembro_canal(canal_id, auth.uid()));
CREATE POLICY "Miembros del canal envían"
ON public.chat_mensajes FOR INSERT
WITH CHECK (user_id = auth.uid() AND public.es_miembro_canal(canal_id, auth.uid()));
CREATE POLICY "Autor edita mensaje"
ON public.chat_mensajes FOR UPDATE
USING (user_id = auth.uid());
CREATE POLICY "Autor elimina mensaje"
ON public.chat_mensajes FOR DELETE
USING (user_id = auth.uid());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_mensajes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tareas_internas;

-- ===== FIRMAS DIGITALES =====
CREATE TABLE IF NOT EXISTS public.firmas_digitales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tipo_documento text NOT NULL
    CHECK (tipo_documento IN ('medicamento_entrega','documento_recepcion','alta_medica','consentimiento','equipo_entrega','muestra_lab','otro')),
  referencia_tabla text,
  referencia_id uuid,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  firmante_nombre text NOT NULL,
  firmante_cedula text,
  firmante_rol text,
  firmante_user_id uuid REFERENCES auth.users(id),
  firma_imagen_url text,
  ip_firma text,
  user_agent text,
  contenido_firmado jsonb,
  notas text,
  estado text NOT NULL DEFAULT 'valida' CHECK (estado IN ('valida','anulada')),
  motivo_anulacion text,
  firmado_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_firmas_ws ON public.firmas_digitales(workspace_id, firmado_at DESC);
CREATE INDEX IF NOT EXISTS idx_firmas_paciente ON public.firmas_digitales(paciente_id);
CREATE INDEX IF NOT EXISTS idx_firmas_ref ON public.firmas_digitales(referencia_tabla, referencia_id);
ALTER TABLE public.firmas_digitales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Miembros ven firmas"
ON public.firmas_digitales FOR SELECT
USING (EXISTS (SELECT 1 FROM public.workspace_members wm
  WHERE wm.workspace_id = firmas_digitales.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Miembros crean firmas"
ON public.firmas_digitales FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm
  WHERE wm.workspace_id = firmas_digitales.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "Admins anulan firmas"
ON public.firmas_digitales FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.workspace_members wm
  WHERE wm.workspace_id = firmas_digitales.workspace_id
    AND wm.user_id = auth.uid() AND wm.role IN ('owner','admin')));

-- Triggers updated_at
CREATE TRIGGER trg_wf_reglas_upd BEFORE UPDATE ON public.workflow_reglas_globales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_tareas_upd BEFORE UPDATE ON public.tareas_internas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_chat_canales_upd BEFORE UPDATE ON public.chat_canales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-añadir creador como admin del canal
CREATE OR REPLACE FUNCTION public.chat_auto_add_creator()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.chat_canal_miembros (canal_id, user_id, rol)
    VALUES (NEW.id, NEW.created_by, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_chat_canal_creator
AFTER INSERT ON public.chat_canales
FOR EACH ROW EXECUTE FUNCTION public.chat_auto_add_creator();