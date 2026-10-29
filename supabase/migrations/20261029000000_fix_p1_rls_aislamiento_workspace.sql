-- Auditoría de seguridad run-1 (P1): políticas USING(true) permitían leer y modificar datos
-- de cualquier clínica. Se reemplazan por pertenencia al workspace.

-- 1. Portal del paciente: anon podía listar todos los tokens.
DROP POLICY IF EXISTS "public_read_portal_token" ON public.portal_paciente_vertical;

-- 2. Tablas *_vertical (CRM, leads, WhatsApp, pagos, BI, sucursales, portal).
DO $$
DECLARE
  t text;
  p text;
BEGIN
  FOR t, p IN VALUES
    ('sucursales_vertical', 'auth_crud_sucursales_vertical'),
    ('portal_paciente_vertical', 'auth_crud_portal_vertical'),
    ('campanas_marketing_vertical', 'auth_crud_campanas_v'),
    ('leads_vertical', 'auth_crud_leads_vertical'),
    ('metricas_bi_vertical', 'auth_crud_metricas_bi'),
    ('mensajes_whatsapp_vertical', 'auth_crud_whatsapp_v'),
    ('pagos_online_vertical', 'auth_crud_pagos_online'),
    ('telemedicina_sesiones', 'Auth accede sesiones'),
    ('telemedicina_recetas_digitales', 'Auth accede recetas digitales'),
    ('ia_modelos_predictivos', 'Auth accede modelos'),
    ('ia_alertas_tempranas', 'Auth accede alertas IA'),
    ('dispositivos_iot', 'Auth accede dispositivos'),
    ('marketplace_servicios', 'Staff gestiona servicios')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'ws_member_' || t, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated
         USING (public.is_workspace_member(auth.uid(), workspace_id))
         WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id))',
      'ws_member_' || t, t);
  END LOOP;
END $$;

-- 3. Marketplace bookings: el insert público se mantiene; el staff solo ve y edita los suyos.
DROP POLICY IF EXISTS "Staff ve bookings" ON public.marketplace_bookings;
DROP POLICY IF EXISTS "Staff gestiona bookings" ON public.marketplace_bookings;
CREATE POLICY "ws_member_bookings_select" ON public.marketplace_bookings FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws_member_bookings_update" ON public.marketplace_bookings FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

-- 4. IoT hijas: sin workspace_id propio, se acotan por el dispositivo.
DROP POLICY IF EXISTS "Auth accede lecturas" ON public.lecturas_iot;
CREATE POLICY "ws_member_lecturas_iot" ON public.lecturas_iot FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.dispositivos_iot d
                 WHERE d.id = dispositivo_id AND public.is_workspace_member(auth.uid(), d.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.dispositivos_iot d
                      WHERE d.id = dispositivo_id AND public.is_workspace_member(auth.uid(), d.workspace_id)));

DROP POLICY IF EXISTS "Auth accede umbrales" ON public.umbrales_alerta_iot;
CREATE POLICY "ws_member_umbrales_iot" ON public.umbrales_alerta_iot FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.dispositivos_iot d
                 WHERE d.id = dispositivo_id AND public.is_workspace_member(auth.uid(), d.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.dispositivos_iot d
                      WHERE d.id = dispositivo_id AND public.is_workspace_member(auth.uid(), d.workspace_id)));

-- 5. Bucket teleconsulta-docs: la ruta es "<paciente_id>/<archivo>"; se exige pertenecer a la clínica del paciente.
DROP POLICY IF EXISTS "tcd_select" ON storage.objects;
DROP POLICY IF EXISTS "tcd_ins" ON storage.objects;
DROP POLICY IF EXISTS "tcd_del" ON storage.objects;
CREATE POLICY "tcd_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'teleconsulta-docs' AND EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id::text = (storage.foldername(name))[1] AND public.is_workspace_member(auth.uid(), p.workspace_id)));
CREATE POLICY "tcd_ins" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'teleconsulta-docs' AND EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id::text = (storage.foldername(name))[1] AND public.is_workspace_member(auth.uid(), p.workspace_id)));
CREATE POLICY "tcd_del" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'teleconsulta-docs' AND EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id::text = (storage.foldername(name))[1] AND public.is_workspace_admin(auth.uid(), p.workspace_id)));

-- 6. Bucket dicom-files (imágenes médicas): la ruta debe empezar por "<workspace_id>/" (CASE evita un cast inválido).
DROP POLICY IF EXISTS "dicom_files_select_aa" ON storage.objects;
DROP POLICY IF EXISTS "dicom_files_insert_aa" ON storage.objects;
DROP POLICY IF EXISTS "dicom_files_update_aa" ON storage.objects;
DROP POLICY IF EXISTS "dicom_files_delete_aa" ON storage.objects;
CREATE POLICY "dicom_files_select_ws" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'dicom-files' AND CASE WHEN (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$' THEN public.is_workspace_member(auth.uid(), ((storage.foldername(name))[1])::uuid) ELSE false END);
CREATE POLICY "dicom_files_insert_ws" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dicom-files' AND CASE WHEN (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$' THEN public.is_workspace_member(auth.uid(), ((storage.foldername(name))[1])::uuid) ELSE false END);
CREATE POLICY "dicom_files_update_ws" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'dicom-files' AND CASE WHEN (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$' THEN public.is_workspace_member(auth.uid(), ((storage.foldername(name))[1])::uuid) ELSE false END);
CREATE POLICY "dicom_files_delete_ws" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'dicom-files' AND CASE WHEN (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$' THEN public.is_workspace_admin(auth.uid(), ((storage.foldername(name))[1])::uuid) ELSE false END);
