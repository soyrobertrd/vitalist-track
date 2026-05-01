---
name: Fase BB - Gestión de Calidad + Centro de Telemedicina
description: Indicadores JCI/ISO, eventos adversos/centinela, comités, auditorías, no conformidades y centro unificado de telemedicina con chat seguro
type: feature
---
- Reutiliza módulos existentes: `telemedicina_sesiones`, `telemedicina_recetas_digitales`, `teleconsultas_vertical`, `recetas_*`, `SalaVirtual`, `control_calidad_lab`. No duplica.
- Calidad: `indicadores_calidad` (categoría mortalidad/infecciones/readmision/satisfaccion/seguridad, estándar JCI/ISO_9001/MINISTERIO, meta + umbrales), `mediciones_indicadores` (numerador/denominador/resultado calculado, cumple_meta), `eventos_adversos` (tipo medicacion/caida/iaas/etc, severidad leve/moderado/grave/centinela, RCA), `acciones_correctivas`, `comites_calidad` (etica/infecciones/mortalidad/etc + miembros jsonb), `reuniones_comite`, `auditorias_calidad`, `no_conformidades` (severidad observacion/menor/mayor/critica).
- Telemedicina: nueva tabla `telemedicina_chat_mensajes` (sesion_id, remitente_tipo paciente/profesional/sistema). Página `/telemedicina` agrupa sesiones + chat + recetas digitales en una sola vista.
- Numeración auto eventos adversos: `EA-YYYY-NNNNN` por workspace.
- RLS workspace-based con `is_workspace_member(auth.uid(), workspace_id)`.
- Páginas: /calidad, /telemedicina
