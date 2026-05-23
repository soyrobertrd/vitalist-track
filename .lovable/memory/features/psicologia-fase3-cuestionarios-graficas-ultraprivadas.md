---
name: Psicología Fase 3 - cuestionarios, gráficas y notas ultra privadas
description: Cuestionarios pre-sesión vía token público, gráficas de progreso emocional y notas ultra privadas auditadas
type: feature
---
## Tablas
- `cuestionarios_plantillas` (preguntas jsonb, horas_antes, enviar_automatico)
- `cuestionarios_envios` (token único, expira_at 7d, respuestas jsonb, alerta_clinica)
- `notas_ultra_privadas` (solo terapeuta autor lee — ni admin ni supervisor)
- `notas_ultra_privadas_accesos` (auditoría obligatoria de lecturas)

## RPCs
- `leer_cuestionario_por_token(token)` — pública (anon+auth), retorna plantilla + estado
- `responder_cuestionario_publico(token, respuestas, puntaje, alerta)` — pública, valida expiración y respondido_at
- `leer_nota_ultra_privada(id)` — security definer, valida autor + registra acceso

## UI
- `src/pages/CuestionarioPublico.tsx` ruta `/cuestionario/:token`
- Tabs nuevos en PsicologiaPro: Cuestionarios, Progreso (recharts), Ultra privadas

## Seguridad
- Notas ultra privadas: RLS solo `terapeuta_id = auth.uid()`. Política de auditoría permite ver propios accesos.
- Cuestionarios: token público con expiración, sin exponer otros datos del workspace.
