
-- ===========================================
-- FASE S: Roles Avanzados, Agenda IA, Comunicaciones, Reportes Financieros
-- ===========================================

-- 1. Roles granulares por vertical
CREATE TABLE public.roles_vertical (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vertical_tipo text NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  permisos jsonb NOT NULL DEFAULT '{}',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, vertical_tipo, nombre)
);
ALTER TABLE public.roles_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_select_roles_v" ON public.roles_vertical FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_admin_all_roles_v" ON public.roles_vertical FOR ALL USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- 2. Asignaciones de roles verticales
CREATE TABLE public.asignaciones_rol_vertical (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rol_vertical_id uuid NOT NULL REFERENCES public.roles_vertical(id) ON DELETE CASCADE,
  vertical_tipo text NOT NULL,
  vigencia_inicio timestamptz DEFAULT now(),
  vigencia_fin timestamptz,
  asignado_por uuid REFERENCES auth.users(id),
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id, rol_vertical_id)
);
ALTER TABLE public.asignaciones_rol_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_select_asign_v" ON public.asignaciones_rol_vertical FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_admin_all_asign_v" ON public.asignaciones_rol_vertical FOR ALL USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- 3. Delegaciones temporales
CREATE TABLE public.delegaciones_acceso_vertical (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vertical_tipo text NOT NULL,
  delegante_user_id uuid NOT NULL REFERENCES auth.users(id),
  delegado_user_id uuid NOT NULL REFERENCES auth.users(id),
  permisos_delegados jsonb NOT NULL DEFAULT '{}',
  motivo text,
  inicio timestamptz NOT NULL DEFAULT now(),
  fin timestamptz NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.delegaciones_acceso_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_select_deleg_v" ON public.delegaciones_acceso_vertical FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_admin_all_deleg_v" ON public.delegaciones_acceso_vertical FOR ALL USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- 4. Agenda IA predicciones
CREATE TABLE public.agenda_ia_predicciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vertical_tipo text NOT NULL,
  cita_id uuid,
  paciente_id uuid,
  tipo_prediccion text NOT NULL DEFAULT 'no_show',
  probabilidad numeric(5,2) NOT NULL DEFAULT 0,
  factores jsonb DEFAULT '{}',
  accion_sugerida text,
  estado text NOT NULL DEFAULT 'pendiente',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agenda_ia_predicciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_select_ia_pred" ON public.agenda_ia_predicciones FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_admin_all_ia_pred" ON public.agenda_ia_predicciones FOR ALL USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- 5. Agenda IA sugerencias
CREATE TABLE public.agenda_ia_sugerencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vertical_tipo text NOT NULL,
  tipo_sugerencia text NOT NULL DEFAULT 'reagendamiento',
  descripcion text NOT NULL,
  datos jsonb DEFAULT '{}',
  prioridad text NOT NULL DEFAULT 'media',
  estado text NOT NULL DEFAULT 'pendiente',
  aplicada_por uuid REFERENCES auth.users(id),
  aplicada_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agenda_ia_sugerencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_select_ia_sug" ON public.agenda_ia_sugerencias FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_admin_all_ia_sug" ON public.agenda_ia_sugerencias FOR ALL USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- 6. Comunicaciones multicanal
CREATE TABLE public.comunicaciones_multicanal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vertical_tipo text,
  canal text NOT NULL DEFAULT 'email',
  destinatario_tipo text NOT NULL DEFAULT 'paciente',
  destinatario_id uuid,
  destinatario_contacto text,
  asunto text,
  contenido text NOT NULL,
  plantilla_id uuid,
  campana_id uuid,
  estado text NOT NULL DEFAULT 'pendiente',
  enviado_at timestamptz,
  entregado_at timestamptz,
  leido_at timestamptz,
  error_detalle text,
  metadata jsonb DEFAULT '{}',
  enviado_por uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.comunicaciones_multicanal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_select_comms" ON public.comunicaciones_multicanal FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_member_insert_comms" ON public.comunicaciones_multicanal FOR INSERT WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_admin_all_comms" ON public.comunicaciones_multicanal FOR ALL USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- 7. Plantillas de comunicación
CREATE TABLE public.plantillas_comunicacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vertical_tipo text,
  nombre text NOT NULL,
  canal text NOT NULL DEFAULT 'email',
  evento text,
  asunto_template text,
  contenido_template text NOT NULL,
  variables jsonb DEFAULT '[]',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.plantillas_comunicacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_select_plantillas_com" ON public.plantillas_comunicacion FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_admin_all_plantillas_com" ON public.plantillas_comunicacion FOR ALL USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- 8. Campañas de comunicación
CREATE TABLE public.campanas_comunicacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vertical_tipo text,
  nombre text NOT NULL,
  tipo text NOT NULL DEFAULT 'masiva',
  canal text NOT NULL DEFAULT 'email',
  segmentacion jsonb DEFAULT '{}',
  plantilla_id uuid REFERENCES public.plantillas_comunicacion(id),
  estado text NOT NULL DEFAULT 'borrador',
  programada_para timestamptz,
  enviados int NOT NULL DEFAULT 0,
  entregados int NOT NULL DEFAULT 0,
  abiertos int NOT NULL DEFAULT 0,
  errores int NOT NULL DEFAULT 0,
  creado_por uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.campanas_comunicacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_select_campanas" ON public.campanas_comunicacion FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_admin_all_campanas" ON public.campanas_comunicacion FOR ALL USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- 9. Reportes financieros por vertical
CREATE TABLE public.reportes_financieros_vertical (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vertical_tipo text NOT NULL,
  tipo_reporte text NOT NULL DEFAULT 'estado_resultados',
  periodo_inicio date NOT NULL,
  periodo_fin date NOT NULL,
  datos jsonb NOT NULL DEFAULT '{}',
  totales jsonb DEFAULT '{}',
  notas text,
  generado_por uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reportes_financieros_vertical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_select_rep_fin" ON public.reportes_financieros_vertical FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_admin_all_rep_fin" ON public.reportes_financieros_vertical FOR ALL USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- 10. Proyecciones financieras
CREATE TABLE public.proyecciones_financieras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vertical_tipo text NOT NULL,
  tipo text NOT NULL DEFAULT 'ingresos',
  periodo text NOT NULL,
  valor_proyectado numeric(14,2) NOT NULL DEFAULT 0,
  valor_real numeric(14,2),
  supuestos jsonb DEFAULT '{}',
  notas text,
  generado_por uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.proyecciones_financieras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_member_select_proy_fin" ON public.proyecciones_financieras FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_admin_all_proy_fin" ON public.proyecciones_financieras FOR ALL USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- Audit triggers
CREATE TRIGGER audit_roles_vertical AFTER INSERT OR UPDATE OR DELETE ON public.roles_vertical FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
CREATE TRIGGER audit_asignaciones_rol_vertical AFTER INSERT OR UPDATE OR DELETE ON public.asignaciones_rol_vertical FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
CREATE TRIGGER audit_delegaciones_acceso_vertical AFTER INSERT OR UPDATE OR DELETE ON public.delegaciones_acceso_vertical FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
CREATE TRIGGER audit_comunicaciones_multicanal AFTER INSERT OR UPDATE OR DELETE ON public.comunicaciones_multicanal FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_auditoria();
