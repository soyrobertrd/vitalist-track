-- 1) Tabla portal_solicitudes
CREATE TABLE IF NOT EXISTS public.portal_solicitudes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  cita_id uuid,
  tipo text NOT NULL CHECK (tipo IN ('confirmar_cita','reagendar_cita','mensaje','cancelar_cita')),
  mensaje text,
  fecha_propuesta timestamptz,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','atendida','rechazada')),
  respuesta text,
  atendida_por uuid REFERENCES auth.users(id),
  atendida_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_solicitudes_ws ON public.portal_solicitudes(workspace_id, estado);
CREATE INDEX IF NOT EXISTS idx_portal_solicitudes_paciente ON public.portal_solicitudes(paciente_id);

ALTER TABLE public.portal_solicitudes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ws_member_select_portal_solicitudes" ON public.portal_solicitudes;
CREATE POLICY "ws_member_select_portal_solicitudes"
ON public.portal_solicitudes FOR SELECT TO authenticated
USING (public.is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "ws_member_update_portal_solicitudes" ON public.portal_solicitudes;
CREATE POLICY "ws_member_update_portal_solicitudes"
ON public.portal_solicitudes FOR UPDATE TO authenticated
USING (public.is_workspace_member(auth.uid(), workspace_id))
WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

-- 2) Reemplazar portal_paciente_datos con info adaptada por vertical
CREATE OR REPLACE FUNCTION public.portal_paciente_datos(_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tok public.portal_paciente_tokens;
  v_pac public.pacientes;
  v_citas jsonb;
  v_recetas jsonb;
  v_alergias jsonb;
  v_seguros jsonb;
  v_facturas jsonb;
  v_planes_dental jsonb;
  v_recetas_oft jsonb;
  v_seg_recovery jsonb;
  v_odontogramas jsonb;
BEGIN
  SELECT * INTO v_tok FROM public.portal_paciente_tokens
  WHERE token = _token AND activo = true AND expires_at > now()
  LIMIT 1;

  IF v_tok.id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Token inválido o expirado');
  END IF;

  SELECT * INTO v_pac FROM public.pacientes WHERE id = v_tok.paciente_id;

  -- Citas (control_visitas)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', v.id,
    'fecha', v.fecha_hora_visita,
    'tipo', v.tipo_visita,
    'estado', v.estado,
    'profesional', COALESCE(ps.nombre, '') || ' ' || COALESCE(ps.apellido, '')
  ) ORDER BY v.fecha_hora_visita), '[]'::jsonb) INTO v_citas
  FROM public.control_visitas v
  LEFT JOIN public.personal_salud ps ON ps.id = v.profesional_id
  WHERE v.paciente_id = v_tok.paciente_id
    AND v.fecha_hora_visita >= now() - interval '180 days'
  LIMIT 50;

  -- Recetas médicas
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'medicamento', r.nombre_medicamento, 'dosis', r.dosis,
    'frecuencia', r.frecuencia, 'inicio', r.fecha_inicio,
    'fin', r.fecha_fin, 'estado', r.estado
  )), '[]'::jsonb) INTO v_recetas
  FROM public.recetas_medicas r
  WHERE r.paciente_id = v_tok.paciente_id
    AND r.estado IN ('activa', 'completada')
  LIMIT 30;

  -- Alergias
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'sustancia', a.sustancia, 'tipo', a.tipo,
    'severidad', a.severidad, 'reaccion', a.reaccion
  )), '[]'::jsonb) INTO v_alergias
  FROM public.alergias_paciente a
  WHERE a.paciente_id = v_tok.paciente_id;

  -- Seguros
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'aseguradora', s.aseguradora, 'plan', s.plan,
    'numero_afiliado', s.numero_afiliado, 'activo', s.activo
  )), '[]'::jsonb) INTO v_seguros
  FROM public.seguros_paciente s
  WHERE s.paciente_id = v_tok.paciente_id AND s.activo = true;

  -- Facturas (todas verticales)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'numero', f.numero_factura, 'fecha', f.fecha_emision,
    'total', f.monto_total, 'pagado', f.monto_pagado,
    'pendiente', GREATEST(f.monto_total - f.monto_pagado - f.monto_seguro, 0),
    'estado', f.estado, 'descripcion', f.descripcion
  ) ORDER BY f.fecha_emision DESC), '[]'::jsonb) INTO v_facturas
  FROM public.facturas f
  WHERE f.paciente_id = v_tok.paciente_id
  LIMIT 30;

  -- Planes de tratamiento dental
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'numero', p.numero, 'estado', p.estado,
    'presupuesto', p.presupuesto_total, 'cuotas', p.numero_cuotas,
    'aprobado', p.aprobado, 'fecha', p.created_at
  )), '[]'::jsonb) INTO v_planes_dental
  FROM public.planes_tratamiento_dental p
  WHERE p.paciente_id = v_tok.paciente_id
  LIMIT 10;

  -- Recetas oftálmicas
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'numero', r.numero,
    'od', jsonb_build_object('esfera', r.od_esfera, 'cilindro', r.od_cilindro, 'eje', r.od_eje, 'add', r.od_add),
    'oi', jsonb_build_object('esfera', r.oi_esfera, 'cilindro', r.oi_cilindro, 'eje', r.oi_eje, 'add', r.oi_add),
    'dp', r.distancia_pupilar,
    'tipo_lente', r.tipo_lente_recomendado,
    'vigencia', r.vigencia_hasta,
    'fecha', r.created_at
  ) ORDER BY r.created_at DESC), '[]'::jsonb) INTO v_recetas_oft
  FROM public.recetas_oftalmicas r
  WHERE r.paciente_id = v_tok.paciente_id
  LIMIT 10;

  -- Seguimiento Recovery (últimos 14 días)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'fecha', s.fecha, 'turno', s.turno,
    'temperatura', s.temperatura,
    'presion', COALESCE(s.presion_sistolica::text,'') || '/' || COALESCE(s.presion_diastolica::text,''),
    'fc', s.frecuencia_cardiaca, 'sat', s.saturacion_o2,
    'dolor', s.nivel_dolor, 'inflamacion', s.inflamacion,
    'notas', s.notas_enfermeria
  ) ORDER BY s.fecha DESC), '[]'::jsonb) INTO v_seg_recovery
  FROM public.seguimiento_diario_recovery s
  JOIN public.pacientes_recovery pr ON pr.id = s.paciente_recovery_id
  WHERE pr.paciente_id = v_tok.paciente_id
    AND s.fecha >= CURRENT_DATE - interval '14 days'
  LIMIT 30;

  -- Odontogramas
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'fecha', o.fecha_evaluacion, 'notas', o.notas
  ) ORDER BY o.fecha_evaluacion DESC), '[]'::jsonb) INTO v_odontogramas
  FROM public.odontogramas o
  WHERE o.paciente_id = v_tok.paciente_id
  LIMIT 10;

  RETURN jsonb_build_object(
    'valid', true,
    'paciente', jsonb_build_object(
      'id', v_pac.id,
      'nombre', v_pac.nombre || ' ' || COALESCE(v_pac.apellido, ''),
      'fecha_nacimiento', v_pac.fecha_nacimiento,
      'sexo', v_pac.sexo,
      'vertical', v_pac.vertical
    ),
    'citas', v_citas,
    'recetas', v_recetas,
    'alergias', v_alergias,
    'seguros', v_seguros,
    'facturas', v_facturas,
    'planes_dental', v_planes_dental,
    'recetas_oft', v_recetas_oft,
    'seguimiento_recovery', v_seg_recovery,
    'odontogramas', v_odontogramas
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('valid', true, 'error_partial', SQLERRM,
    'paciente', jsonb_build_object('nombre', v_pac.nombre || ' ' || COALESCE(v_pac.apellido,''),
                                   'vertical', v_pac.vertical),
    'citas', COALESCE(v_citas, '[]'::jsonb),
    'recetas', COALESCE(v_recetas, '[]'::jsonb),
    'alergias', COALESCE(v_alergias, '[]'::jsonb),
    'seguros', COALESCE(v_seguros, '[]'::jsonb),
    'facturas', COALESCE(v_facturas, '[]'::jsonb)
  );
END;
$$;

-- 3) Función para que el paciente solicite acciones desde el portal
CREATE OR REPLACE FUNCTION public.portal_paciente_solicitar_accion(
  _token text,
  _tipo text,
  _cita_id uuid DEFAULT NULL,
  _mensaje text DEFAULT NULL,
  _fecha_propuesta timestamptz DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tok public.portal_paciente_tokens;
  v_id uuid;
BEGIN
  IF _tipo NOT IN ('confirmar_cita','reagendar_cita','mensaje','cancelar_cita') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tipo inválido');
  END IF;

  SELECT * INTO v_tok FROM public.portal_paciente_tokens
  WHERE token = _token AND activo = true AND expires_at > now()
  LIMIT 1;

  IF v_tok.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Token inválido o expirado');
  END IF;

  INSERT INTO public.portal_solicitudes (workspace_id, paciente_id, cita_id, tipo, mensaje, fecha_propuesta)
  VALUES (v_tok.workspace_id, v_tok.paciente_id, _cita_id, _tipo, _mensaje, _fecha_propuesta)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'id', v_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.portal_paciente_solicitar_accion(text, text, uuid, text, timestamptz) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_paciente_datos(text) TO anon, authenticated;