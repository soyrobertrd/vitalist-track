-- 1) Configuración por workspace
CREATE TABLE IF NOT EXISTS public.auditoria_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
  hora_nocturna_inicio smallint NOT NULL DEFAULT 22 CHECK (hora_nocturna_inicio BETWEEN 0 AND 23),
  hora_nocturna_fin smallint NOT NULL DEFAULT 6 CHECK (hora_nocturna_fin BETWEEN 0 AND 23),
  umbral_fuera_horario int NOT NULL DEFAULT 3 CHECK (umbral_fuera_horario > 0),
  umbral_acceso_masivo int NOT NULL DEFAULT 50 CHECK (umbral_acceso_masivo > 0),
  umbral_descargas int NOT NULL DEFAULT 20 CHECK (umbral_descargas > 0),
  umbral_cambios_criticos int NOT NULL DEFAULT 10 CHECK (umbral_cambios_criticos > 0),
  ventana_horas_acceso_masivo int NOT NULL DEFAULT 1 CHECK (ventana_horas_acceso_masivo > 0),
  detectar_cambios_criticos boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auditoria_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auditoria_config_select_admin" ON public.auditoria_config
FOR SELECT USING (
  workspace_id IS NULL OR public.is_workspace_admin(auth.uid(), workspace_id)
);

CREATE POLICY "auditoria_config_modify_admin" ON public.auditoria_config
FOR ALL USING (
  workspace_id IS NULL OR public.is_workspace_admin(auth.uid(), workspace_id)
) WITH CHECK (
  workspace_id IS NULL OR public.is_workspace_admin(auth.uid(), workspace_id)
);

CREATE TRIGGER trg_auditoria_config_updated
BEFORE UPDATE ON public.auditoria_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Ruteo de alertas por severidad
CREATE TABLE IF NOT EXISTS public.alertas_ruteo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  severidad text NOT NULL CHECK (severidad IN ('baja','media','alta','critica')),
  roles text[] NOT NULL DEFAULT ARRAY['owner','admin']::text[],
  canal_inapp boolean NOT NULL DEFAULT true,
  canal_email boolean NOT NULL DEFAULT false,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, severidad)
);

ALTER TABLE public.alertas_ruteo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alertas_ruteo_select_admin" ON public.alertas_ruteo
FOR SELECT USING (
  workspace_id IS NULL OR public.is_workspace_admin(auth.uid(), workspace_id)
);

CREATE POLICY "alertas_ruteo_modify_admin" ON public.alertas_ruteo
FOR ALL USING (
  workspace_id IS NULL OR public.is_workspace_admin(auth.uid(), workspace_id)
) WITH CHECK (
  workspace_id IS NULL OR public.is_workspace_admin(auth.uid(), workspace_id)
);

CREATE TRIGGER trg_alertas_ruteo_updated
BEFORE UPDATE ON public.alertas_ruteo
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Categoría en alertas
ALTER TABLE public.auditoria_alertas
  ADD COLUMN IF NOT EXISTS categoria text;

-- Backfill por tipo conocido
UPDATE public.auditoria_alertas SET categoria = CASE
  WHEN tipo = 'fuera_horario' THEN 'acceso_horario'
  WHEN tipo = 'acceso_masivo' THEN 'acceso_masivo'
  WHEN tipo = 'descarga_excesiva' THEN 'exportacion_masiva'
  WHEN tipo = 'cambio_critico' THEN 'cambio_critico'
  ELSE 'otro' END
WHERE categoria IS NULL;

-- Canal en notificaciones (in-app por defecto, email opcional)
ALTER TABLE public.alertas_notificaciones
  ADD COLUMN IF NOT EXISTS canal text NOT NULL DEFAULT 'in_app';

-- 4) Detección con umbrales configurables
CREATE OR REPLACE FUNCTION public.detectar_accesos_sospechosos(_workspace_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  alertas_creadas int := 0;
  cfg record;
  rec record;
  v_h_ini int; v_h_fin int;
BEGIN
  -- Carga config (o usa defaults globales)
  SELECT * INTO cfg FROM public.auditoria_config
   WHERE (_workspace_id IS NULL AND workspace_id IS NULL) OR workspace_id = _workspace_id
   LIMIT 1;

  v_h_ini := COALESCE(cfg.hora_nocturna_inicio, 22);
  v_h_fin := COALESCE(cfg.hora_nocturna_fin, 6);

  -- Acceso fuera de horario
  FOR rec IN
    SELECT user_id, workspace_id, COUNT(*) AS cnt
    FROM public.acceso_fichas_log
    WHERE created_at > now() - interval '24 hours'
      AND (
        (v_h_ini <= v_h_fin AND EXTRACT(hour FROM created_at AT TIME ZONE 'America/Santo_Domingo') BETWEEN v_h_ini AND v_h_fin)
        OR (v_h_ini > v_h_fin AND (
              EXTRACT(hour FROM created_at AT TIME ZONE 'America/Santo_Domingo') >= v_h_ini
           OR EXTRACT(hour FROM created_at AT TIME ZONE 'America/Santo_Domingo') < v_h_fin))
      )
      AND (_workspace_id IS NULL OR workspace_id = _workspace_id)
    GROUP BY user_id, workspace_id
    HAVING COUNT(*) >= COALESCE(cfg.umbral_fuera_horario, 3)
  LOOP
    INSERT INTO public.auditoria_alertas (workspace_id, user_id, tipo, categoria, severidad, descripcion, metadata)
    SELECT rec.workspace_id, rec.user_id, 'fuera_horario', 'acceso_horario', 'media',
      format('Usuario accedió %s fichas fuera de horario laboral en las últimas 24h', rec.cnt),
      jsonb_build_object('total_accesos', rec.cnt, 'umbral', COALESCE(cfg.umbral_fuera_horario,3))
    WHERE NOT EXISTS (
      SELECT 1 FROM public.auditoria_alertas
      WHERE user_id = rec.user_id AND tipo = 'fuera_horario'
        AND created_at > now() - interval '24 hours' AND resuelto = false
    );
    alertas_creadas := alertas_creadas + 1;
  END LOOP;

  -- Acceso masivo
  FOR rec IN
    SELECT user_id, workspace_id, COUNT(DISTINCT paciente_id) AS cnt
    FROM public.acceso_fichas_log
    WHERE created_at > now() - (COALESCE(cfg.ventana_horas_acceso_masivo,1) || ' hours')::interval
      AND (_workspace_id IS NULL OR workspace_id = _workspace_id)
    GROUP BY user_id, workspace_id
    HAVING COUNT(DISTINCT paciente_id) >= COALESCE(cfg.umbral_acceso_masivo, 50)
  LOOP
    INSERT INTO public.auditoria_alertas (workspace_id, user_id, tipo, categoria, severidad, descripcion, metadata)
    SELECT rec.workspace_id, rec.user_id, 'acceso_masivo', 'acceso_masivo', 'alta',
      format('Usuario accedió %s pacientes distintos — posible exfiltración', rec.cnt),
      jsonb_build_object('pacientes_distintos', rec.cnt, 'umbral', COALESCE(cfg.umbral_acceso_masivo,50))
    WHERE NOT EXISTS (
      SELECT 1 FROM public.auditoria_alertas
      WHERE user_id = rec.user_id AND tipo = 'acceso_masivo'
        AND created_at > now() - interval '6 hours' AND resuelto = false
    );
    alertas_creadas := alertas_creadas + 1;
  END LOOP;

  -- Exportaciones masivas
  FOR rec IN
    SELECT user_id, workspace_id, COUNT(*) AS cnt
    FROM public.acceso_fichas_log
    WHERE created_at > now() - interval '24 hours'
      AND accion IN ('export','download','print')
      AND (_workspace_id IS NULL OR workspace_id = _workspace_id)
    GROUP BY user_id, workspace_id
    HAVING COUNT(*) >= COALESCE(cfg.umbral_descargas, 20)
  LOOP
    INSERT INTO public.auditoria_alertas (workspace_id, user_id, tipo, categoria, severidad, descripcion, metadata)
    SELECT rec.workspace_id, rec.user_id, 'descarga_excesiva', 'exportacion_masiva', 'alta',
      format('Usuario realizó %s descargas/exportes en 24h', rec.cnt),
      jsonb_build_object('total_acciones', rec.cnt, 'umbral', COALESCE(cfg.umbral_descargas,20))
    WHERE NOT EXISTS (
      SELECT 1 FROM public.auditoria_alertas
      WHERE user_id = rec.user_id AND tipo = 'descarga_excesiva'
        AND created_at > now() - interval '24 hours' AND resuelto = false
    );
    alertas_creadas := alertas_creadas + 1;
  END LOOP;

  -- Cambios críticos (mucha actividad de UPDATE/DELETE en tablas sensibles)
  IF COALESCE(cfg.detectar_cambios_criticos, true) THEN
    FOR rec IN
      SELECT usuario_id AS user_id, COUNT(*) AS cnt
      FROM public.auditoria_cambios
      WHERE created_at > now() - interval '1 hour'
        AND accion IN ('UPDATE','DELETE')
        AND tabla IN ('pacientes','diagnosticos_clinicos','medicamentos_paciente','admisiones','triaje_eventos')
      GROUP BY usuario_id
      HAVING COUNT(*) >= COALESCE(cfg.umbral_cambios_criticos, 10)
    LOOP
      INSERT INTO public.auditoria_alertas (workspace_id, user_id, tipo, categoria, severidad, descripcion, metadata)
      SELECT _workspace_id, rec.user_id, 'cambio_critico', 'cambio_critico', 'critica',
        format('Usuario realizó %s cambios sensibles en la última hora', rec.cnt),
        jsonb_build_object('total_cambios', rec.cnt, 'umbral', COALESCE(cfg.umbral_cambios_criticos,10))
      WHERE rec.user_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.auditoria_alertas
        WHERE user_id = rec.user_id AND tipo = 'cambio_critico'
          AND created_at > now() - interval '6 hours' AND resuelto = false
      );
      alertas_creadas := alertas_creadas + 1;
    END LOOP;
  END IF;

  RETURN alertas_creadas;
END;
$$;

-- 5) Fan-out usando ruteo configurable
CREATE OR REPLACE FUNCTION public.fan_out_alerta_notificacion()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  rec record;
  v_titulo text;
  v_ruteo record;
  v_roles text[];
BEGIN
  v_titulo := CASE NEW.tipo
    WHEN 'fuera_horario' THEN '🌙 Acceso fuera de horario detectado'
    WHEN 'acceso_masivo' THEN '🚨 Posible exfiltración de datos'
    WHEN 'descarga_excesiva' THEN '⬇️ Descargas masivas detectadas'
    WHEN 'cambio_critico' THEN '⚠️ Cambio crítico en datos sensibles'
    ELSE '🔔 Alerta de auditoría: ' || NEW.tipo
  END;

  -- Toma ruteo del workspace o ruteo global; si no hay, usa default seguro
  SELECT * INTO v_ruteo FROM public.alertas_ruteo
   WHERE severidad = NEW.severidad
     AND activo = true
     AND ((NEW.workspace_id IS NULL AND workspace_id IS NULL) OR workspace_id = NEW.workspace_id)
   ORDER BY workspace_id NULLS LAST
   LIMIT 1;

  IF v_ruteo.id IS NULL THEN
    v_roles := ARRAY['owner','admin'];
  ELSE
    v_roles := v_ruteo.roles;
  END IF;

  -- In-app
  IF v_ruteo.id IS NULL OR v_ruteo.canal_inapp THEN
    FOR rec IN
      SELECT DISTINCT wm.user_id
      FROM public.workspace_members wm
      WHERE (NEW.workspace_id IS NULL OR wm.workspace_id = NEW.workspace_id)
        AND wm.role::text = ANY (v_roles)
    LOOP
      INSERT INTO public.alertas_notificaciones (
        workspace_id, alerta_id, destinatario_user_id, titulo, cuerpo, severidad, canal
      ) VALUES (
        NEW.workspace_id, NEW.id, rec.user_id, v_titulo, NEW.descripcion, NEW.severidad, 'in_app'
      );
    END LOOP;
  END IF;

  -- Email (sólo registra el "envío pendiente"; el envío real lo procesa edge function)
  IF v_ruteo.id IS NOT NULL AND v_ruteo.canal_email THEN
    FOR rec IN
      SELECT DISTINCT wm.user_id
      FROM public.workspace_members wm
      WHERE (NEW.workspace_id IS NULL OR wm.workspace_id = NEW.workspace_id)
        AND wm.role::text = ANY (v_roles)
    LOOP
      INSERT INTO public.alertas_notificaciones (
        workspace_id, alerta_id, destinatario_user_id, titulo, cuerpo, severidad, canal
      ) VALUES (
        NEW.workspace_id, NEW.id, rec.user_id, v_titulo, NEW.descripcion, NEW.severidad, 'email'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;