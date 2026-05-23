---
name: 2FA admin + Exportación GDPR paciente
description: Activación TOTP MFA en Configuración → Seguridad. Exportación completa de datos de paciente (HIPAA/GDPR) desde Hub Paciente 360.
type: feature
---
- Componente `TwoFactorSetup` usa `supabase.auth.mfa` (enroll/challenge/verify/unenroll) con QR + clave manual. Disponible para todos los usuarios en Configuración → Seguridad; recomendado para admins.
- Edge function `exportar-datos-paciente-gdpr` (verify_jwt=true) valida membresía del workspace vía `is_workspace_member`, recolecta ~22 tablas con `paciente_id` y devuelve JSON descargable. Audita el acceso como `exportacion_gdpr` vía `registrar_acceso_ficha`.
- Botón "Exportar GDPR" en `HubPaciente360` invoca la función y descarga JSON. Cumple GDPR Art.20 y HIPAA Right of Access.
- Panel de salud del sistema ya existente en `AuditoriaHIPAA` → pestaña "Salud" (componente `PanelSaludSistema`).
