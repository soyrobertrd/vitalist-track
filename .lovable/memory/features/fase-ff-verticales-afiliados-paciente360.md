---
name: Fase FF — Verticales completas + Afiliados Dual + Paciente 360
description: Landings públicos por vertical, sistema dual de afiliados (comisiones empleados + beneficios usuarios), referidos, segmentación, perfil de valor, reorganización de menú
type: feature
---

## Landings públicos por vertical
Cada vertical tiene su propio landing en una ruta dedicada accesible sin login:
- `/clinica` → LandingClinica.tsx (hospitales, UCI, quirófano, urgencias)
- `/odontologia` → LandingDental.tsx (odontograma, sillones, presupuestos)
- `/aesthetic` → LandingAesthetic.tsx (fichas estéticas, before/after, paquetes)
- `/recovery` → LandingRecovery.tsx (post-operatorio, rehabilitación)
- `/vision` → LandingVision.tsx (recetas, exámenes, tienda óptica)

El landing principal (`/`) tiene una sección "Productos" con tarjetas que llevan a cada vertical.

## Sistema dual de afiliados (decisión: dos sistemas separados)

### Comisiones de empleados (`comisiones_empleados`)
- Para personal interno que refiere o cierra ventas/metas
- Flujo: pendiente → aprobada → pagada (con fecha_pago)
- RLS: empleado ve solo las suyas; admin/coordinador ven todo
- Página: `/comisiones-empleados` (dentro de Equipo & RRHH)

### Beneficios / Loyalty de usuarios (`beneficios_usuarios`)
- Para pacientes individuales: puntos, descuentos, niveles (bronce/plata/oro/platino)
- Origen: referido, compra, campaña, bienvenida
- Página: `/beneficios-usuarios` (dentro de CRM & Marketing)

## Programa de referidos unificado (`referidos`)
- Campo `referidor_tipo`: 'paciente' | 'empleado'
- Estado: pendiente → contactado → convertido | descartado
- Página: `/referidos` (dentro de CRM & Marketing)

## Segmentación de pacientes (`segmentos_pacientes`)
- Criterios en JSONB para campañas dirigidas
- Página: `/segmentacion`

## Perfil de valor / LTV (`perfil_valor_paciente`)
- Métricas: ltv_total, visitas, frecuencia, engagement (bajo/medio/alto/vip), riesgo de churn (bajo/medio/alto), NPS
- Página: `/perfil-valor`

## Reorganización del menú lateral
- **Afiliaciones**: movida desde nivel raíz → submenu de **Configuración**
- **Organizaciones**: aparece en **Equipo & RRHH** Y en **Configuración** (en ambos lugares según solicitado)
- **CRM & Marketing**: ahora con submenu (CRM principal, Segmentación, Perfil de valor, Referidos, Beneficios)
- **Equipo & RRHH**: incluye Personal, RRHH, Organizaciones, Comisiones empleados
