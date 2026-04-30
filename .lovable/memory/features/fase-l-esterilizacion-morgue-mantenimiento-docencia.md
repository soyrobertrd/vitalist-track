---
name: Fase L - Esterilización, Morgue, Mantenimiento, Docencia
description: Four hospital modules: sterilization/CEYE (cycles/surgical packs), morgue/pathology (deaths/studies), hospital maintenance (equipment/work orders), teaching/research (programs/residents/protocols)
type: feature
---
## Esterilización y CEYE
- `ciclos_esterilizacion`: EST-YYYY-NNNNN, métodos (autoclave/óxido etileno/plasma/glutaraldehído), indicadores bio/químicos, estados (preparado/en_proceso/completado/fallido)
- `paquetes_quirurgicos`: trazabilidad con ciclo, estados (disponible/en_uso/en_esterilizacion/retirado)
- Ruta: `/esterilizacion`

## Morgue y Patología
- `registros_morgue`: MRG-YYYY-NNNNN, causa muerte, autopsia, estados (ingresado/en_estudio/autopsia/liberado)
- `estudios_patologia`: PAT-YYYY-NNNNN, tipos (biopsia/citología/histopatología/autopsia/inmunohistoquímica), diagnóstico macro/micro/final
- Ruta: `/morgue`

## Mantenimiento Hospitalario
- `equipos_hospitalarios`: marca, modelo, serie, ubicación, estados (operativo/en_mantenimiento/fuera_servicio/baja)
- `ordenes_mantenimiento`: MNT-YYYY-NNNNN, tipos (preventivo/correctivo/calibración/instalación), prioridad, costo, repuestos
- Ruta: `/mantenimiento`

## Docencia e Investigación
- `programas_docencia`: tipos (residencia/rotación/pasantía/fellowship/diplomado/curso), cupo, coordinador
- `residentes_rotaciones`: programa, universidad, evaluaciones JSONB, calificación
- `protocolos_investigacion`: INV-YYYY-NNNNN, comité ética (pendiente/aprobado/rechazado/suspendido/exento), financiamiento, publicaciones
- Ruta: `/docencia`
