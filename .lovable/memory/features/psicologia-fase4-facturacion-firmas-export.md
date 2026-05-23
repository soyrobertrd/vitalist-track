---
name: Psicología Fase 4 – Facturación, recetas firmadas y exportación HC
description: Facturación de sesiones, firma digital de prescripciones psiquiátricas con hash SHA-256, y exportación auditable de historia clínica.
type: feature
---

- `facturas_psicologia`: factura por sesión/paquete (numero único por workspace, subtotal/itbis/total, estado, método pago).
- `firmas_prescripciones_psiq`: una firma única por receta. Campos: hash SHA-256 del contenido (medicamento+dosis+frecuencia+paciente), firma_base64 (canvas), ip, user_agent.
- `prescripciones_psiquiatricas.firmada` + `firmada_at`: marca al firmar.
- RPC `firmar_prescripcion_psiquiatrica`: SECURITY DEFINER, valida workspace, evita doble firma.
- `exportaciones_historia_clinica`: log de exportaciones (motivo obligatorio, destinatario, hash SHA-256 del bundle JSON).
- RPC `exportar_historia_clinica_psico`: arma bundle (paciente, ficha psico, sesiones, notas NO privadas, evaluaciones, prescripciones), calcula hash con `extensions.digest`, registra y devuelve `{hash, bundle}`. Las notas privadas/ultra-privadas NO se exportan por privacidad.
- UI: 2 tabs nuevos en PsicologiaPro (`Facturación`, `Exportar HC`) + botón `Firmar` en cada prescripción.
