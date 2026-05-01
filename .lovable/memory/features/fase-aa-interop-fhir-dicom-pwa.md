---
name: Fase AA - Interoperabilidad HL7/FHIR + DICOM + PWA Offline
description: Intercambio FHIR R4, mensajes HL7 v2, visor DICOM y cola de sincronización offline para personal móvil
type: feature
---
- FHIR R4: tablas `fhir_resources` (Patient/Observation/Encounter/MedicationRequest/etc), `fhir_mappings`, `fhir_export_jobs`, `fhir_import_jobs`. Página `/interoperabilidad` exporta Patient real desde `pacientes`.
- HL7 v2: tablas `hl7_endpoints` (laboratorio/pacs/his/farmacia con protocolo mllp/http/https/sftp) y `hl7_messages` (ADT/ORU/ORM, inbound/outbound, raw + parsed_json). Parser básico pipe-delimited en UI.
- DICOM: tablas `dicom_studies` (StudyInstanceUID, modalidad CT/MR/CR/DX/US/MG/PT/NM), `dicom_series`, `dicom_instances` (SOPInstanceUID + storage_path). Bucket privado `dicom-files`. Página `/visor-dicom` con visor stub (zoom/brillo/navegación entre instancias).
- PWA Offline: `offline_sync_queue` (insert/update/delete con payload jsonb, intentos, estado pendiente/sincronizado/error/conflicto) y `device_registrations` (device_id, platform, push_token). Página `/pwa-offline` con replay automático al reconectar.
- RLS: workspace-based (is_workspace_member(auth.uid(), workspace_id)) excepto offline_queue y device_registrations que son por user_id.
- Páginas: /interoperabilidad, /visor-dicom, /pwa-offline
