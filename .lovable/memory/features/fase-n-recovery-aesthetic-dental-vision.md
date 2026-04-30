---
name: Fase N - Recovery Care, Aesthetic Pro, DentalCare Pro, VisionCare Pro
description: Four health verticals: postoperative recovery houses, aesthetic clinics/medical spa, dental offices/orthodontics, optics/ophthalmology
type: feature
---
## Recovery Care (`/recovery-care`)
- `habitaciones_recovery`: tipo (privada/compartida/suite/vip), tarifa diaria, amenidades
- `planes_recovery`: días, categoría (básico/premium/vip), servicios incluidos, precio
- `pacientes_recovery`: RCV-YYYY-NNNNN, cirugía, médico, país, turismo médico, acompañante, idioma, concierge
- `seguimiento_diario_recovery`: signos vitales, dolor 0-10, inflamación, drenajes, curas, fotos, medicamentos
- `servicios_recovery`: masaje linfático, cura, retiro puntos, consulta, traslado aeropuerto, etc.
- `agenda_servicios_recovery`: programación de servicios por paciente

## Aesthetic Pro (`/aesthetic-pro`)
- `leads_estetica`: AES-YYYY-NNNNN, origen (instagram/whatsapp/meta_ads/google_ads/web/referido), CRM pipeline
- `evaluaciones_esteticas`: EVA-YYYY-NNNNN, medidas, fotos antes, IMC, presupuesto
- `galeria_antes_despues`: fotos antes/durante/después, consentimiento uso imagen
- `procedimientos_esteticos`: categorías (facial/corporal/capilar/invasivo/no_invasivo)
- `paquetes_esteticos`: bundles con precio regular vs paquete
- `financiamiento_estetico`: FIN-YYYY-NNNNN, separación, cuotas, balance pendiente

## DentalCare Pro (`/dental-care`)
- `expedientes_dentales`: historial, alergias, hábitos, bruxismo, radiografías
- `planes_tratamiento_dental`: PTD-YYYY-NNNNN, procedimientos, fases, cuotas, firma digital
- `controles_ortodoncia`: progreso %, cambio ligas, arco, pago mensual
- `ordenes_laboratorio_dental`: OLD-YYYY-NNNNN, corona/prótesis/retenedor/férula/puente/implante

## VisionCare Pro (`/vision-care`)
- `expedientes_visuales`: agudeza OD/OI, presión intraocular, antecedentes oculares
- `recetas_oftalmicas`: ROF-YYYY-NNNNN, esfera/cilindro/eje/ADD/prisma para OD y OI, DP
- `inventario_optica`: monturas/lentes/contactos/accesorios, marca, modelo, stock, precio
- `ordenes_trabajo_optica`: OPT-YYYY-NNNNN, tratamientos (antirreflejo/transitions/progresivo), laboratorio
