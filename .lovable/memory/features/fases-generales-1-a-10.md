---
name: Fases 1-10 - Generalización profesionales + módulos clínicos + NCF + IA + regulatorios
description: Catálogo especialidades configurable, servicios, credenciales con vencimiento, tarifas por ARS/profesional, NCF/e-CF dominicano, vacunas/crónicos/prenatal/pediatría/ocupacional, IA clínica (esqueleto sin integración real) y reportes SINAVE/MSP.
type: feature
---

## Rutas nuevas
- `/catalogo-especialidades` — gestión de tipos de profesionales (60+ globales precargados)
- `/servicios-profesionales` — servicios + asignación profesional↔servicio
- `/credenciales-profesionales` — exequátur, colegiatura, certificaciones con alertas de vencimiento
- `/tarifarios-profesional` — precios distintos por profesional/servicio/ARS con comisión
- `/facturacion-electronica-rd` — secuencias NCF (B01-B16) y comprobantes fiscales DGII
- `/modulos-clinicos` — vacunación, crónicos, prenatal, pediatría, salud ocupacional
- `/ia-clinica` — esqueleto sin integración real (resumen, dx diferencial, scribe, interacciones)
- `/reportes-regulatorios` — SINAVE, MSP, enfermedades notificables (16 precargadas)

## Tablas
especialidades_catalogo, servicios_catalogo, profesional_servicios, profesional_ubicaciones, credenciales_profesionales, tarifas_profesional_ars, ncf_secuencias, comprobantes_fiscales, vacunas_catalogo (+15 precargadas), vacunas_paciente, programas_cronicos, enrolamientos_cronicos, controles_prenatales, controles_pediatricos, salud_ocupacional, ia_configuracion, ia_solicitudes, enfermedades_notificables (+16 precargadas), reportes_regulatorios.

## Cambios importantes
- `usePersonal` ya NO filtra por `["Médico","Enfermera","Medico Internista"]` hardcoded; ahora consulta dinámicamente `especialidades_catalogo` y excluye solo categoría `administrativa`.
- `EspecialidadCombobox` componente reutilizable que lee del catálogo.

## RLS
- Catálogos globales (especialidades, vacunas, enfermedades): SELECT a todo autenticado, mod solo admin global.
- Workspace data: member SELECT, admin para tarifas/credenciales/NCF/regulatorios; member para vacunas/prenatal/pediatría/ocupacional/IA (CRUD operativo).

## IA Clínica
Solo esqueleto. No hay integración con modelos reales. Las tablas `ia_solicitudes` y `ia_configuracion` están listas para que cuando se decida integrar, basta con escribir una edge function que consuma `ia_solicitudes` pendientes.
