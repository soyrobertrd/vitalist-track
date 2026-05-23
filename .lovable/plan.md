# Fase 2 — Psicología/Psiquiatría: Reportes, Telepsicología, Privacidad y Plan Free

Base ya implementada en Fase 1: `pacientes_psicologia`, `sesiones_psicologia`, `notas_psicologia`, `evaluaciones_psicometricas`, `prescripciones_psiquiatricas`, `paquetes_sesiones`, RLS por terapeuta/supervisor/admin.

Esta fase añade reportes BI, telepsicología cifrada y endurece privacidad.

## 1. Base de datos (migración)

**Bitácora de acceso a notas privadas** (HIPAA/GDPR):
- `acceso_notas_psicologia_log` — `user_id`, `nota_id`, `paciente_id`, `accion` (view/edit/print), `ip`, `user_agent`, `created_at`. RLS: solo admin/supervisor lee. Trigger automático en SELECT vía RPC `leer_nota_psicologia(_id)` que registra y devuelve la nota.

**Telepsicología**:
- `teleconsultas` — `sesion_id`, `paciente_id`, `terapeuta_id`, `sala_codigo` (uuid público), `pin_paciente` (6 dígitos), `pin_terapeuta`, `estado` (programada/en_sala_espera/en_curso/finalizada/cancelada), `inicio_at`, `fin_at`, `duracion_min`, `grabacion_url` (opcional), `consentimiento_id`.
- `consentimientos_teleconsulta` — `paciente_id`, `texto_version`, `firmado_at`, `firma_data` (base64 trazo), `ip`, `valido_hasta`.
- `chat_teleconsulta` — `teleconsulta_id`, `autor` (paciente/terapeuta), `mensaje` cifrado simétrico (placeholder), `created_at`, `leido_at`. RLS: solo participantes.
- `documentos_compartidos` — `teleconsulta_id`/`paciente_id`, `nombre`, `url_storage`, `subido_por`, `visible_paciente` bool, `permisos` (ver/descargar), `expira_at`.
- Bucket Storage privado `teleconsulta-docs` con RLS por `paciente_id`.

**Vistas/RPCs para reportes**:
- `reporte_asistencia_psicologia(_workspace, _desde, _hasta)` — por paciente: total citas, asistidas, no-show, canceladas, % asistencia.
- `reporte_evolucion_escalas(_paciente_id)` — series PHQ-9/GAD-7/BDI con fecha+puntaje+severidad.
- `reporte_pacientes_inactivos_psico(_workspace, _meses)` — sin sesión hace N meses.
- `reporte_retencion_terapeutica(_workspace, _desde, _hasta)` — cohortes mensuales: pacientes nuevos vs activos a 1/3/6 meses.
- `reporte_cancelaciones_psico(_workspace, _desde, _hasta)` — motivos agrupados.

## 2. Frontend nuevo

**Reportes** (`src/pages/psicologia/ReportesPsicologia.tsx`):
- Tabs: Asistencia · Evolución escalas · Inactivos · Cancelaciones · Retención.
- Gráficas con `recharts` (LineChart PHQ-9/GAD-7, BarChart asistencia, Funnel retención).
- Filtros: rango fechas, terapeuta, paciente.
- Exportar CSV.

**Telepsicología**:
- `src/pages/psicologia/SalaTeleconsulta.tsx` — sala virtual: pre-check (cámara/mic), espera, integración WebRTC vía Jitsi Meet embed (sala pública con PIN), chat lateral, panel documentos.
- `src/components/psicologia/ConsentimientoTeleconsulta.tsx` — modal con texto legal + canvas de firma + checkbox "acepto".
- `src/components/psicologia/ChatTeleconsulta.tsx` — realtime via supabase channel.
- `src/components/psicologia/DocumentosCompartidos.tsx` — upload/download con permisos.
- Botón "Iniciar teleconsulta" en `sesiones_psicologia` cuando `modalidad='virtual'`.

**Bitácora**:
- `src/pages/psicologia/AuditoriaNotasPsico.tsx` (solo admin/supervisor) — tabla quién accedió a qué nota cuándo.
- Refactor `notas` tab de `PsicologiaPro.tsx` para usar RPC `leer_nota_psicologia` que registra acceso.

## 3. Plan Free — psicología

Actualizar `useFreePlan.tsx`/`useFreePlanWriteAccess.tsx` añadiendo vertical `psicologia`:
- **Permitido (Free)**: Dashboard, Agenda sesiones, Pacientes (máx 100), Ficha clínica básica, Notas privadas (1 tipo: narrativa), PHQ-9 + GAD-7.
- **Bloqueado (Pro)**: Telepsicología, escalas extra (BDI/PCL-5/ASRS), prescripción psiquiátrica, paquetes/membresías, casos de nicho (infantil/adicciones/pareja/EAP), reportes BI avanzados, supervisor lock, documentos compartidos.
- Reusar `PlanLimitAlert` en cada pantalla bloqueada.

## 4. Memoria

Añadir entradas:
- `features/psicologia-telepsicologia-fase2` — telepsicología, consentimiento, chat, docs.
- `features/psicologia-reportes-clinicos` — reportes BI y métricas.
- `security/bitacora-acceso-notas-psico` — auditoría obligatoria.
- `features/plan-free-psicologia` — restricciones específicas.

## Notas técnicas

- Video: Jitsi Meet iframe (`https://meet.jit.si/{sala_codigo}#userInfo.displayName=...`) — cumple cifrado E2EE, sin costo. Alternativa Daily.co si el usuario aporta API key.
- Chat: realtime postgres_changes en `chat_teleconsulta`, RLS por participantes.
- Storage: bucket privado, signed URLs con expiración 1h.
- Recharts ya está en deps.
- Toda lectura de `notas_psicologia` pasa por RPC para garantizar log.

¿Procedo con la migración + frontend completo en este turno?
