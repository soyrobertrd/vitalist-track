---
name: Fase DD - Verticales por centro y alta hospitalaria
description: Sistema de tipos de centro (clinica/dental/aesthetic/recovery/vision) por workspace, asignación de vertical por usuario, conmutador en sidebar y módulo de alta hospitalaria
type: feature
---
- Tabla `workspace_verticales` (workspace_id, vertical, activa, es_principal). Un workspace puede tener múltiples verticales habilitadas.
- Columna `profiles.vertical_asignada` (enum `vertical_tipo`): cada miembro ve solo su vertical. Admins/coordinadores con `null` ven todas.
- `VerticalContext` + `VerticalSwitcher`: admin puede alternar "Todas" o vertical específica. No-admin queda fijo en su vertical asignada.
- Layout filtra el menú lateral: items comunes (Agenda, Pacientes, Personal, Nómina, Finanzas, Telemedicina, RRHH, Inventario, etc.) se muestran siempre. Items con `verticales: VerticalTipo[]` solo aparecen si la vertical activa coincide.
- Migración compatible: workspaces existentes quedan con vertical "clinica" habilitada.
- Página `/verticales` (admin): habilita verticales del workspace y asigna vertical por miembro.
- Módulo `/alta-hospitalaria`: tabla `altas_hospitalarias` con tipo de alta, dx principal, resumen, indicaciones, dieta, signos de alarma, medicamentos al alta (jsonb), próxima cita, médico, firmas, estados (pendiente→firmada→entregada/anulada).
- Telemedicina ahora es item común en el menú (ya no anidado en Hospital).
