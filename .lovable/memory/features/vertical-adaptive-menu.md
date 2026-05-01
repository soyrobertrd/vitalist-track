---
name: Vertical Adaptive Sidebar Menu
description: Sidebar reorganizes dynamically per active vertical — specific options integrated into logical groups + dedicated "Resumen [vertical]" entry on top
type: feature
---

## Strategy
Each vertical (clinica, dental, aesthetic, recovery, vision) shows a **distributed menu**:
- "Resumen [Vertical]" link on top (link to vertical root: `/dental-care`, `/aesthetic-pro`, etc.)
- Specific options integrated into existing groups: Pacientes, Agenda, Recursos, Financiero, CRM & Marketing, Clínico, Diagnóstico, Avanzado.
- Non-applicable options (e.g. Hospitalización in Dental) are hidden completely.

## Convention (in `src/components/Layout.tsx`)
SubItems can declare:
- `verticales: VerticalTipo[]` → only visible in those verticals
- `excludeVerticales: VerticalTipo[]` → hidden in those
- Items without either prop are visible in all verticals

Top-level items with `verticales` prop are hidden when active vertical doesn't match.
Groups whose subItems all get filtered out are hidden automatically.

## Vertical-specific subItems live where they belong:
- **Pacientes**: Odontograma, Planes tratamiento (dental); Evaluaciones, Fotos evolución, Membresías (aesthetic); Recetas ópticas (vision); Planes cuidado, Seguimiento, Concierge, Alertas (recovery)
- **Recursos**: Sillones, Lab dental (dental); Cabinas, Procedimientos, Paquetes (aesthetic); Inventario óptico, Órdenes lab, Combos, Garantías (vision); Habitaciones, Reservas (recovery)
- **CRM & Marketing**: Leads estética, Promociones (aesthetic); Fidelización dental (dental)
- **Financiero**: Comisiones doctores (dental); Financiamiento (aesthetic)
- **Agenda**: Llamadas (clinica only); Visitas, Rutas (clinica + recovery); Agenda universal (clinica)

## Hospital-only top-level groups
Clínico, Diagnóstico, Turnos, Avanzado.

## Pacientes label adapts: "Clientes" in aesthetic, "Pacientes" elsewhere.
