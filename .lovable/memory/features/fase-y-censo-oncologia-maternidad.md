---
name: Fase Y — Censo de Camas, Oncología y Maternidad/Neonatología
description: Mapa de camas en tiempo real con traslados y lista de espera; oncología con protocolos quimio, ciclos BSA, sillones y toxicidades CTCAE; maternidad con prenatal, partograma, parto, RN, lactancia y vacunas neonatales
type: feature
---
- Censo: mapa_camas (UNIQUE piso/sala/numero), censo_diario, traslados_internos, lista_espera_admision
- Oncología: protocolos_quimio, ciclos_quimio (BSA m²), dosis_quimio (mg/m²), sillones_infusion, toxicidades_oncologicas (CTCAE 1-5)
- Maternidad: control_prenatal, partogramas (jsonb registros), registros_parto, recien_nacidos (APGAR 1/5/10), lactancia_seguimiento, vacunacion_neonatal (BCG, HepB, vit K, profilaxis ocular)
- RLS: workspace-based via is_workspace_member
- Páginas: /censo-camas, /oncologia, /maternidad-neonatologia
