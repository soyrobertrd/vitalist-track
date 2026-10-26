-- ==============================================================================
-- MIGRACIÓN DE DATOS SEED PARA PRUEBAS EN VIVO MULTI-VERTICAL Y MULTI-PLAN
-- ==============================================================================
-- Incluye:
-- 1. Planes actualizados (solo $15, pro $35, plus $85, business $165, free $0)
-- 2. 6 Centros de Salud (uno por cada vertical médica con su respectivo plan)
-- 3. Doctores y especialistas asignados por vertical
-- 4. Pacientes con clínicas de origen (para Pro Consultorios) y patologías reales
-- 5. Citas, llamadas y visitas con tokens seguros de confirmación
-- ==============================================================================

-- 1. Asegurar planes actualizados con la nueva tabla de precios
INSERT INTO public.planes (codigo, nombre, descripcion, precio_mensual_usd, precio_mensual_dop, limite_pacientes, limite_usuarios, limite_profesionales, caracteristicas, orden)
VALUES
('free', 'Prueba Gratuita', 'Plan degradado tras período de prueba', 0, 0, 25, 1, 1,
  '{"whatsapp": true, "recordatorios": false, "encuestas": false, "automatizaciones": false, "auditoria": false, "portal_paciente": false, "subdominio": false, "custom_domain": false, "portal_paciente_marca": false, "db_independiente": false, "soporte": "comunidad"}'::jsonb, 0),
('solo', 'Básico (Solo Doctor)', '1 usuario / 2 dispositivos / 85 px', 15, 900, 85, 1, 1,
  '{"whatsapp": true, "recordatorios": true, "encuestas": true, "automatizaciones": false, "auditoria": false, "portal_paciente": false, "subdominio": false, "custom_domain": false, "portal_paciente_marca": false, "db_independiente": false, "soporte": "email", "trial_dias": 30}'::jsonb, 1),
('pro', 'Pro Consultorios', '3 usuarios / 5 dispositivos / 5 profesionales (hasta 3 clínicas asociadas)', 35, 2100, 500, 3, 5,
  '{"whatsapp": true, "recordatorios": true, "encuestas": true, "automatizaciones": true, "auditoria": true, "portal_paciente": true, "subdominio": false, "custom_domain": false, "portal_paciente_marca": false, "clinicas_externas_max": 3, "db_independiente": false, "soporte": "prioritario", "trial_dias": 30}'::jsonb, 2),
('plus', 'Clínica Plus', '8 usuarios / 10 dispositivos / 15 profesionales con portal y marca propia', 85, 5100, 1500, 8, 15,
  '{"whatsapp": true, "recordatorios": true, "encuestas": true, "automatizaciones": true, "auditoria": true, "portal_paciente": true, "mapa": true, "subdominio": true, "custom_domain": true, "portal_paciente_marca": true, "telemedicina": true, "db_independiente": false, "soporte": "prioritario", "trial_dias": 30}'::jsonb, 3),
('business', 'Business Enterprise', 'Base de datos independiente dedicada, usuarios y pacientes ilimitados', 165, 9900, NULL, NULL, NULL,
  '{"whatsapp": true, "recordatorios": true, "encuestas": true, "automatizaciones": true, "auditoria": true, "portal_paciente": true, "mapa": true, "subdominio": true, "custom_domain": true, "portal_paciente_marca": true, "telemedicina": true, "db_independiente": true, "soporte": "dedicado", "sso": true, "api": true, "trial_dias": 30}'::jsonb, 4)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  precio_mensual_usd = EXCLUDED.precio_mensual_usd,
  precio_mensual_dop = EXCLUDED.precio_mensual_dop,
  limite_pacientes = EXCLUDED.limite_pacientes,
  limite_usuarios = EXCLUDED.limite_usuarios,
  limite_profesionales = EXCLUDED.limite_profesionales,
  caracteristicas = EXCLUDED.caracteristicas,
  orden = EXCLUDED.orden;

-- 2. Crear los 6 Workspaces por vertical y plan con usuario owner por defecto
DO $$
DECLARE
  v_user_id uuid;
  ws_clinica uuid := 'a1111111-1111-4111-8111-111111111111';
  ws_dental uuid  := 'a2222222-2222-4222-8222-222222222222';
  ws_aesthe uuid  := 'a3333333-3333-4333-8333-333333333333';
  ws_recov uuid   := 'a4444444-4444-4444-8444-444444444444';
  ws_vision uuid  := 'a5555555-5555-4555-8555-555555555555';
  ws_psico uuid   := 'a6666666-6666-4666-8666-666666666666';

  doc_carlos uuid := 'b1111111-1111-4111-8111-111111111111';
  doc_laura uuid  := 'b2222222-2222-4222-8222-222222222222';
  doc_miguel uuid := 'b3333333-3333-4333-8333-333333333333';
  doc_ana uuid    := 'b4444444-4444-4444-8444-444444444444';
  doc_robert uuid := 'b5555555-5555-4555-8555-555555555555';
  doc_patri uuid  := 'b6666666-6666-4666-8666-666666666666';

  px_1 uuid := 'c1111111-1111-4111-8111-111111111111';
  px_2 uuid := 'c2222222-2222-4222-8222-222222222222';
  px_3 uuid := 'c3333333-3333-4333-8333-333333333333';
  px_4 uuid := 'c4444444-4444-4444-8444-444444444444';
  px_5 uuid := 'c5555555-5555-4555-8555-555555555555';
  px_6 uuid := 'c6666666-6666-4666-8666-666666666666';

  cita_1 uuid := 'd1111111-1111-4111-8111-111111111111';
  cita_2 uuid := 'd2222222-2222-4222-8222-222222222222';
BEGIN
  -- Tomar el primer usuario existente de auth.users como owner de pruebas
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  IF v_user_id IS NULL THEN
    v_user_id := '00000000-0000-0000-0000-000000000001';
  END IF;

  -- 1) Centro Hospitalario General (Vertical: clinica, Plan: business - USD 165)
  INSERT INTO public.workspaces (id, nombre, slug, owner_id, plan_codigo, estado, configuracion)
  VALUES (
    ws_clinica,
    'Hospital Metropolitano Santiago',
    'hospital-metropolitano',
    v_user_id,
    'business',
    'activo',
    jsonb_build_object(
      'vertical_principal', 'clinica',
      'crm_name', 'Hospital Metropolitano Santiago',
      'formato_fecha', 'dd/mm/yyyy',
      'color', '217 91% 52%',
      'db_independiente_activa', true
    )
  ) ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    plan_codigo = EXCLUDED.plan_codigo,
    configuracion = EXCLUDED.configuracion;

  -- 2) Centro Odontológico Especializado (Vertical: dental, Plan: plus - USD 85)
  INSERT INTO public.workspaces (id, nombre, slug, owner_id, plan_codigo, estado, configuracion)
  VALUES (
    ws_dental,
    'DentalCare Pro Bella Vista',
    'dentalcare-pro',
    v_user_id,
    'plus',
    'activo',
    jsonb_build_object(
      'vertical_principal', 'dental',
      'crm_name', 'DentalCare Pro Bella Vista',
      'formato_fecha', 'dd/mm/yyyy',
      'subdominio_propio', 'dentalcare',
      'color', '188 86% 36%'
    )
  ) ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    plan_codigo = EXCLUDED.plan_codigo,
    configuracion = EXCLUDED.configuracion;

  -- 3) Centro Médico Estético (Vertical: aesthetic, Plan: pro - USD 35)
  INSERT INTO public.workspaces (id, nombre, slug, owner_id, plan_codigo, estado, configuracion)
  VALUES (
    ws_aesthe,
    'Aesthetic & Plastic Surgery Studio',
    'aesthetic-studio',
    v_user_id,
    'pro',
    'activo',
    jsonb_build_object(
      'vertical_principal', 'aesthetic',
      'crm_name', 'Aesthetic & Plastic Surgery Studio',
      'formato_fecha', 'dd/mm/yyyy',
      'clinicas_asociadas', jsonb_build_array('Clínica Abreu', 'Hospiten Santo Domingo', 'Centro Médico Real'),
      'color', '330 65% 50%'
    )
  ) ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    plan_codigo = EXCLUDED.plan_codigo,
    configuracion = EXCLUDED.configuracion;

  -- 4) Recovery Care Domiciliario y Suites (Vertical: recovery, Plan: pro - USD 35)
  INSERT INTO public.workspaces (id, nombre, slug, owner_id, plan_codigo, estado, configuracion)
  VALUES (
    ws_recov,
    'Vitalist Recovery Suites & Care',
    'vitalist-recovery',
    v_user_id,
    'pro',
    'activo',
    jsonb_build_object(
      'vertical_principal', 'recovery',
      'crm_name', 'Vitalist Recovery Suites & Care',
      'formato_fecha', 'dd/mm/yyyy',
      'clinicas_asociadas', jsonb_build_array('Plaza de la Salud', 'CEDIMAT'),
      'color', '158 64% 34%'
    )
  ) ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    plan_codigo = EXCLUDED.plan_codigo,
    configuracion = EXCLUDED.configuracion;

  -- 5) Centro Oftalmológico (Vertical: vision, Plan: solo - USD 15)
  INSERT INTO public.workspaces (id, nombre, slug, owner_id, plan_codigo, estado, configuracion)
  VALUES (
    ws_vision,
    'VisionCare Retina & Óptica',
    'visioncare-optica',
    v_user_id,
    'solo',
    'activo',
    jsonb_build_object(
      'vertical_principal', 'vision',
      'crm_name', 'VisionCare Retina & Óptica',
      'formato_fecha', 'dd/mm/yyyy',
      'color', '245 58% 55%'
    )
  ) ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    plan_codigo = EXCLUDED.plan_codigo,
    configuracion = EXCLUDED.configuracion;

  -- 6) Centro de Psicología y Psiquiatría (Vertical: psicologia, Plan: pro - USD 35)
  INSERT INTO public.workspaces (id, nombre, slug, owner_id, plan_codigo, estado, configuracion)
  VALUES (
    ws_psico,
    'Mente Sana Psicología Integral',
    'mente-sana-psicologia',
    v_user_id,
    'pro',
    'activo',
    jsonb_build_object(
      'vertical_principal', 'psicologia',
      'crm_name', 'Mente Sana Psicología Integral',
      'formato_fecha', 'dd/mm/yyyy',
      'clinicas_asociadas', jsonb_build_array('Centro Médico Dominico Cubano', 'Consultorios Piantini'),
      'color', '265 45% 52%'
    )
  ) ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    plan_codigo = EXCLUDED.plan_codigo,
    configuracion = EXCLUDED.configuracion;

  -- 3. Vincular al usuario en todos los centros como owner
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES
    (ws_clinica, v_user_id, 'owner'),
    (ws_dental,  v_user_id, 'owner'),
    (ws_aesthe,  v_user_id, 'owner'),
    (ws_recov,   v_user_id, 'owner'),
    (ws_vision,  v_user_id, 'owner'),
    (ws_psico,   v_user_id, 'owner')
  ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = 'owner';

  -- 4. Personal de salud / Doctores especializados
  INSERT INTO public.personal_salud (id, workspace_id, cedula, nombre, apellido, especialidad, contacto, email_contacto, activo)
  VALUES
    (doc_robert, ws_clinica, '001-1111111-1', 'Roberto', 'Robles', 'Medicina Interna y Críticos', '809-555-0101', 'dr.robles@hospital.com', true),
    (doc_carlos, ws_dental,  '001-2222222-2', 'Carlos', 'Mendoza', 'Implantología y Odontopediatría', '809-555-0202', 'dr.mendoza@dentalcare.com', true),
    (doc_laura,  ws_aesthe,  '001-3333333-3', 'Laura', 'Gómez', 'Cirugía Plástica y Armonización', '809-555-0303', 'dra.gomez@aesthetic.com', true),
    (doc_patri,  ws_recov,   '001-4444444-4', 'Patricia', 'Peña', 'Fisioterapia Postquirúrgica', '809-555-0404', 'lic.pena@recovery.com', true),
    (doc_miguel, ws_vision,  '001-5555555-5', 'Miguel Ángel', 'Santos', 'Oftalmología y Cirugía Refractiva', '809-555-0505', 'dr.santos@visioncare.com', true),
    (doc_ana,    ws_psico,   '001-6666666-6', 'Ana Sofía', 'Martínez', 'Psicología Clínica y Terapia Familiar', '809-555-0606', 'lic.martinez@mentesana.com', true)
  ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    apellido = EXCLUDED.apellido,
    especialidad = EXCLUDED.especialidad;

  -- 5. Pacientes con clínicas de origen asignadas
  INSERT INTO public.pacientes (
    id, workspace_id, cedula, nombre, apellido, contacto_px, email_px,
    whatsapp_px, sexo, fecha_nacimiento, direccion_domicilio, zona, barrio,
    historia_medica_basica, grado_dificultad, tipo_atencion, status_px,
    profesional_asignado_id, clinica_origen, es_sospechoso
  ) VALUES
    -- Paciente Dental
    (px_1, ws_dental, '402-1000001-1', 'Alejandro', 'Vargas', '809-555-1101', 'alejandro.vargas@email.com',
     true, 'M', '1988-04-12', 'Av. Sarasota 45, Bella Vista', 'Distrito Nacional', 'Bella Vista',
     'Rehabilitación sobre implantes pieza 14 y 15. Bruxismo nocturno.', 'medio', 'ambulatorio', 'activo',
     doc_carlos, null, false),

    -- Paciente Aesthetic (Pro Consultorios: con clínica de origen Abreu)
    (px_2, ws_aesthe, '402-1000002-2', 'Camila', 'Fernández', '809-555-1102', 'camila.fernandez@email.com',
     true, 'F', '1994-09-20', 'Calle Federico Geraldino 12, Piantini', 'Distrito Nacional', 'Piantini',
     'Post-operatorio Lipoescultura HD + Renuvion (Día 14). Sin seroma.', 'alto', 'ambulatorio', 'activo',
     doc_laura, 'Clínica Abreu', false),

    -- Paciente Recovery (Pro Consultorios: Hospiten Santo Domingo)
    (px_3, ws_recov, '402-1000003-3', 'Lucía', 'Santana', '809-555-1103', 'lucia.santana@email.com',
     true, 'F', '1982-11-05', 'Av. Anacaona 88, Los Cacicazgos', 'Distrito Nacional', 'Los Cacicazgos',
     'Drenaje linfático post-operatorio. Vendaje compresivo y monitoreo Hb.', 'alto', 'domiciliario', 'activo',
     doc_patri, 'Hospiten Santo Domingo', false),

    -- Paciente Vision
    (px_4, ws_vision, '402-1000004-4', 'Marcos', 'Díaz', '809-555-1104', 'marcos.diaz@email.com',
     false, 'M', '1970-02-18', 'Calle El Sol 24, Santiago Centro', 'Santiago', 'Centro',
     'Miopía -3.50 OD / -3.75 OI. Astigmatismo corneal. Control anual.', 'bajo', 'ambulatorio', 'activo',
     doc_miguel, null, false),

    -- Paciente Psicología (Pro Consultorios: Consultorios Piantini)
    (px_5, ws_psico, '402-1000005-5', 'Valeria', 'Peña', '809-555-1105', 'valeria.pena@email.com',
     true, 'F', '1999-06-30', 'Av. Gustavo Mejía Ricart 55', 'Distrito Nacional', 'Naco',
     'Manejo de trastorno de ansiedad generalizada y estrés laboral.', 'medio', 'ambulatorio', 'activo',
     doc_ana, 'Consultorios Piantini', false),

    -- Paciente Hospital General
    (px_6, ws_clinica, '402-1000006-6', 'Domingo', 'Guerrero', '809-555-1106', 'domingo.guerrero@email.com',
     true, 'M', '1955-08-14', 'Av. 27 de Febrero 200', 'Santo Domingo Este', 'Alma Rosa',
     'Hipertensión arterial estadio 2. Diabetes Mellitus tipo 2 compensada.', 'alto', 'domiciliario', 'activo',
     doc_robert, null, false)
  ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    apellido = EXCLUDED.apellido,
    clinica_origen = EXCLUDED.clinica_origen,
    historia_medica_basica = EXCLUDED.historia_medica_basica;

  -- 6. Citas y Visitas con datos para el dashboard y agenda en vivo
  INSERT INTO public.control_visitas (
    id, workspace_id, paciente_id, personal_id, fecha_hora_visita, estado, tipo_visita, notas_visita
  ) VALUES
    (cita_1, ws_aesthe, px_2, doc_laura, (NOW() + interval '1 day'), 'pendiente', 'ambulatorio', 'Revisión y retiro de puntos en Clínica Abreu'),
    (cita_2, ws_recov,  px_3, doc_patri, (NOW() + interval '2 days'), 'pendiente', 'domicilio', 'Sesión de drenaje linfático número 4')
  ON CONFLICT (id) DO UPDATE SET
    fecha_hora_visita = EXCLUDED.fecha_hora_visita,
    estado = EXCLUDED.estado;

  -- 7. Registro de llamadas de seguimiento
  INSERT INTO public.registro_llamadas (
    workspace_id, paciente_id, personal_id, fecha_agendada, estado, notas_adicionales
  ) VALUES
    (ws_dental, px_1, doc_carlos, (NOW() + interval '3 days'), 'pendiente', 'Confirmar adaptación de implante'),
    (ws_psico,  px_5, doc_ana,    (NOW() + interval '1 day'), 'pendiente', 'Monitoreo de tareas semanales de relajación')
  ON CONFLICT DO NOTHING;

  -- 8. Token criptográfico de prueba para S11
  INSERT INTO public.cita_tokens (
    cita_id, hash, tipo, expira_en, usado_en
  ) VALUES (
    cita_1,
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'visita',
    NOW() + interval '7 days',
    null
  ) ON CONFLICT (hash) DO NOTHING;

END $$;
