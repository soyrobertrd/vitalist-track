-- FHIR
CREATE TABLE public.fhir_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  resource_type text NOT NULL CHECK (resource_type IN ('Patient','Observation','Encounter','MedicationRequest','Condition','Procedure','AllergyIntolerance','Immunization','DiagnosticReport','ServiceRequest','Practitioner','Organization','Appointment')),
  fhir_id text NOT NULL,
  version_id integer NOT NULL DEFAULT 1,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  payload jsonb NOT NULL,
  source text DEFAULT 'internal' CHECK (source IN ('internal','external','imported')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE (workspace_id, resource_type, fhir_id, version_id)
);

CREATE TABLE public.fhir_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  local_table text NOT NULL,
  local_id uuid NOT NULL,
  fhir_resource_type text NOT NULL,
  fhir_id text NOT NULL,
  external_system text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, local_table, local_id, fhir_resource_type)
);

CREATE TABLE public.fhir_export_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  resource_types text[] NOT NULL,
  filters jsonb DEFAULT '{}'::jsonb,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','en_proceso','completado','fallido')),
  total_resources integer DEFAULT 0,
  exported_resources integer DEFAULT 0,
  result_url text,
  error_message text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE public.fhir_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  source_system text,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','en_proceso','completado','fallido')),
  total_resources integer DEFAULT 0,
  imported_resources integer DEFAULT 0,
  failed_resources integer DEFAULT 0,
  errors jsonb DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- HL7
CREATE TABLE public.hl7_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('laboratorio','pacs','his','farmacia','otro')),
  url text,
  protocolo text DEFAULT 'mllp' CHECK (protocolo IN ('mllp','http','https','sftp')),
  activo boolean NOT NULL DEFAULT true,
  configuracion jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hl7_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  endpoint_id uuid REFERENCES public.hl7_endpoints(id) ON DELETE SET NULL,
  message_type text NOT NULL,
  trigger_event text,
  direccion text NOT NULL CHECK (direccion IN ('inbound','outbound')),
  control_id text,
  raw_message text NOT NULL,
  parsed_json jsonb,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','procesado','error','ignorado')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX idx_hl7_messages_workspace ON public.hl7_messages(workspace_id, created_at DESC);
CREATE INDEX idx_fhir_resources_paciente ON public.fhir_resources(paciente_id);

-- DICOM
CREATE TABLE public.dicom_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  study_instance_uid text NOT NULL,
  accession_number text,
  study_date date,
  study_time text,
  modality text,
  description text,
  referring_physician text,
  num_series integer DEFAULT 0,
  num_instances integer DEFAULT 0,
  estado text DEFAULT 'disponible' CHECK (estado IN ('disponible','procesando','archivado','eliminado')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, study_instance_uid)
);

CREATE TABLE public.dicom_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id uuid NOT NULL REFERENCES public.dicom_studies(id) ON DELETE CASCADE,
  series_instance_uid text NOT NULL,
  series_number integer,
  modality text,
  description text,
  num_instances integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (study_id, series_instance_uid)
);

CREATE TABLE public.dicom_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES public.dicom_series(id) ON DELETE CASCADE,
  sop_instance_uid text NOT NULL,
  instance_number integer,
  storage_path text NOT NULL,
  size_bytes bigint,
  preview_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (series_id, sop_instance_uid)
);

CREATE INDEX idx_dicom_studies_paciente ON public.dicom_studies(paciente_id, study_date DESC);

-- PWA
CREATE TABLE public.offline_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  device_id text,
  operation_type text NOT NULL CHECK (operation_type IN ('insert','update','delete')),
  table_name text NOT NULL,
  record_id uuid,
  payload jsonb NOT NULL,
  client_timestamp timestamptz NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','sincronizado','error','conflicto')),
  intentos integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  synced_at timestamptz
);

CREATE INDEX idx_offline_queue_user ON public.offline_sync_queue(user_id, estado, created_at);

CREATE TABLE public.device_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  device_name text,
  platform text CHECK (platform IN ('ios','android','web','tablet')),
  push_token text,
  app_version text,
  last_sync_at timestamptz,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_id)
);

INSERT INTO storage.buckets (id, name, public)
VALUES ('dicom-files', 'dicom-files', false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.fhir_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fhir_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fhir_export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fhir_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hl7_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hl7_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dicom_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dicom_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dicom_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws fhir_resources" ON public.fhir_resources FOR ALL
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws fhir_mappings" ON public.fhir_mappings FOR ALL
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws fhir_export_jobs" ON public.fhir_export_jobs FOR ALL
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws fhir_import_jobs" ON public.fhir_import_jobs FOR ALL
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws hl7_endpoints" ON public.hl7_endpoints FOR ALL
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws hl7_messages" ON public.hl7_messages FOR ALL
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ws dicom_studies" ON public.dicom_studies FOR ALL
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "ws dicom_series" ON public.dicom_series FOR ALL
  USING (EXISTS (SELECT 1 FROM public.dicom_studies s WHERE s.id = study_id AND public.is_workspace_member(auth.uid(), s.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.dicom_studies s WHERE s.id = study_id AND public.is_workspace_member(auth.uid(), s.workspace_id)));

CREATE POLICY "ws dicom_instances" ON public.dicom_instances FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.dicom_series se
    JOIN public.dicom_studies st ON st.id = se.study_id
    WHERE se.id = series_id AND public.is_workspace_member(auth.uid(), st.workspace_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.dicom_series se
    JOIN public.dicom_studies st ON st.id = se.study_id
    WHERE se.id = series_id AND public.is_workspace_member(auth.uid(), st.workspace_id)
  ));

CREATE POLICY "own offline_queue" ON public.offline_sync_queue FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own device_registrations" ON public.device_registrations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dicom_files_select_aa" ON storage.objects FOR SELECT
  USING (bucket_id = 'dicom-files' AND auth.uid() IS NOT NULL);
CREATE POLICY "dicom_files_insert_aa" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'dicom-files' AND auth.uid() IS NOT NULL);
CREATE POLICY "dicom_files_update_aa" ON storage.objects FOR UPDATE
  USING (bucket_id = 'dicom-files' AND auth.uid() IS NOT NULL);
CREATE POLICY "dicom_files_delete_aa" ON storage.objects FOR DELETE
  USING (bucket_id = 'dicom-files' AND auth.uid() IS NOT NULL);

CREATE TRIGGER update_fhir_resources_updated_at BEFORE UPDATE ON public.fhir_resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_hl7_endpoints_updated_at BEFORE UPDATE ON public.hl7_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_device_registrations_updated_at BEFORE UPDATE ON public.device_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();