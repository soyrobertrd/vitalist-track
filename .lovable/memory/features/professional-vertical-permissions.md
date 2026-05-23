---
name: useProfessionalVertical hook
description: Hook que restringe acciones por vertical asignada en personal_salud.vertical. Admin bypassa, profesionales sin vertical no se restringen
type: feature
---

`src/hooks/useProfessionalVertical.tsx` expone `{ verticalProfesional, canActInVertical(v), canActHere, loading }`. Lee `personal_salud.vertical` vía `useUserProfile` (que ahora incluye `vertical_profesional`). Pensado para gatear botones de crear/editar en módulos clínicos (OrdenesMedicas, Recetas, AlertasClinicas, Farmacia) sin romper el comportamiento actual: si no hay vertical asignada o el usuario es admin, no restringe.

`useUserProfile` ahora también usa `.maybeSingle()` para roles, alineado con la regla del proyecto.
