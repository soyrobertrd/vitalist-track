---
name: Fase T - Gestión Documental, Workflows, i18n/Accesibilidad
description: Expedientes digitales con firma electrónica y OCR, motor de workflows if/then con cadenas, multi-idioma ES/EN/FR y configuración WCAG 2.1 AA
type: feature
---
## DB Tables (new)
- `firmas_electronicas` — Firmas digitales por documento con tipo_firmante, ip, hash
- `escaneos_ocr` — Resultados OCR con texto_extraido, confianza, idioma
- `workflow_reglas` — Motor if/then: evento_trigger → condiciones → acciones (JSON)
- `workflow_ejecuciones` — Log de ejecuciones con estado, resultado, error
- `workflow_cadenas` — Cadenas secuenciales con pasos y progreso
- `preferencias_idioma` — Idioma, zona horaria, formato fecha/moneda por usuario
- `configuracion_accesibilidad` — Alto contraste, tamaño fuente, daltonismo, lector pantalla

## DB Tables (modified)
- `documentos_clinicos` — Added workspace_id, profesional_id, archivo_url, firmado, version, documento_padre_id, metadata, created_by, tipo

## Shared Components
- `VerticalDocumentosTab` — Expedientes, firmas electrónicas, escaneos OCR (subtabs)
- `VerticalWorkflowsTab` — Reglas if/then, ejecuciones log, cadenas de tareas
- `VerticalIdiomaAccesibilidadTab` — Preferencias i18n + WCAG accesibilidad settings

## Integration
All four verticals include tabs: Documentos, Workflows, i18n/A11y
