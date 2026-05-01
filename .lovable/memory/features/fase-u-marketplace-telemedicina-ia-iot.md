---
name: Fase U - Marketplace, Telemedicina Avanzada, IA Predictiva, IoT
description: Catálogo público con booking/reviews, videoconsulta con grabación/recetas digitales, modelos predictivos con alertas tempranas, y dispositivos IoT con lecturas/umbrales
type: feature
---
## DB Tables (new)
- `marketplace_servicios` — Catálogo público por vertical (precio, duración, SEO, rating)
- `marketplace_reviews` — Reviews verificadas de pacientes (1-5 estrellas)
- `marketplace_bookings` — Reservas online desde catálogo público
- `telemedicina_sesiones` — Videoconsulta con compartir pantalla, grabación, chat log
- `telemedicina_recetas_digitales` — Recetas post-consulta con firma digital y QR verificación
- `ia_modelos_predictivos` — Modelos IA (no-show, complicación, tendencia, demanda, abandono)
- `ia_alertas_tempranas` — Alertas por patrones clínicos con severidad y recomendación
- `dispositivos_iot` — Registro dispositivos (oxímetro, tensiómetro, glucómetro, ECG, wearable)
- `lecturas_iot` — Lecturas de signos vitales con valor/unidad
- `umbrales_alerta_iot` — Configuración min/max por dispositivo para alertas automáticas

## Shared Components
- `VerticalMarketplaceTab` — Catálogo, reviews, reservas online
- `VerticalTelemedicinaAvanzadaTab` — Sesiones avanzadas, recetas digitales
- `VerticalIAPredictivaTab` — Modelos predictivos, alertas tempranas, tendencias
- `VerticalIoTTab` — Dispositivos conectados, lecturas en tiempo real, umbrales

## Integration
All four verticals include tabs: Marketplace, Telemedicina Avz, IA Predictiva, IoT
