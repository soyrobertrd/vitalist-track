---
name: Fase GG - Clínico Pro (Protocolos, Catálogos, Vademécum, Motor de Reglas)
description: Advanced clinical engine — evidence-based protocols, ICD-10/CPT catalogs, drug-drug interaction checker, and configurable clinical rules engine that fires alerts
type: feature
---

## Tablas creadas
- `protocolos_clinicos` + `protocolos_aplicaciones` — biblioteca de protocolos por especialidad (sepsis 1h, IAM-STEMI, ACV agudo precargados) con pasos, criterios y aplicación trazable a paciente.
- `catalogo_cie10` — códigos diagnósticos con búsqueda full-text en español.
- `catalogo_cpt` — códigos de procedimientos con tarifa referencial y RVU.
- `catalogo_medicamentos` — vademécum (nombre comercial, principio activo, concentración, vía, grupo terapéutico).
- `interacciones_farmacologicas` — matriz medicamento-medicamento con severidad (leve/moderada/severa/contraindicada).
- `reglas_clinicas` + `reglas_ejecuciones` — motor de reglas con condiciones JSONB y acciones encadenadas (crear_alerta, sugerir_protocolo, requerir_confirmacion, etc.).

## Reglas globales precargadas
- **REGLA-SIRS**: detección de SIRS/Sepsis al actualizar signos vitales (≥2 criterios).
- **REGLA-VAL-CRITICO-K**: alerta crítica para potasio fuera de rango.
- **REGLA-INTERACCION-MED**: detecta interacciones severas al crear receta.

## Páginas
- `/protocolos-clinicos` — biblioteca + creación + aplicación a paciente.
- `/catalogos-clinicos` — buscador CIE-10 y CPT con tarifas.
- `/vademecum` — verificador interactivo de interacciones (selecciona principios activos → detecta conflictos) + listado meds + matriz completa.
- `/reglas-clinicas` — gestión del motor de reglas con toggle activo/inactivo y métricas de disparos.

## RLS
- Catálogos (CIE-10, CPT, meds, interacciones): lectura para todos los autenticados; gestión solo admin/coordinador.
- Protocolos y reglas: visibles si son globales o del workspace.
- Aplicaciones y ejecuciones: solo miembros del workspace.

## Helpers usados
Todas las políticas usan firmas correctas: `is_workspace_member(auth.uid(), workspace_id)` e `is_admin_or_coordinador(auth.uid())`.
