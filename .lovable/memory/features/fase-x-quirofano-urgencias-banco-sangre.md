---
name: Fase X — Quirófano, Urgencias y Banco de Sangre
description: Quirófano con checklist OMS y URPA Aldrete; urgencias con triage Manchester; banco de sangre con donantes, hemocomponentes, pruebas cruzadas y transfusiones
type: feature
---
- Tablas: quirofanos, programaciones_quirurgicas, checklist_oms (entrada/pausa/salida), conteo_gasas_instrumental, recuperacion_post_anestesica (Aldrete generated col)
- Urgencias: registros_urgencias, triage_manchester (rojo/naranja/amarillo/verde/azul), observacion_urgencias, derivaciones_urgencias
- Banco de Sangre: donantes (ABO/Rh), donaciones_sangre, inventario_hemocomponentes (codigo_unidad UNIQUE, vencimiento), pruebas_cruzadas, transfusiones
- RLS: workspace-based via is_workspace_member
- Páginas: /quirofano-avanzado, /urgencias-triage, /banco-sangre-avanzado
