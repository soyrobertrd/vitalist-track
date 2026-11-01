# Plan 01 — Aplicar Modo B y tokens de color en las páginas internas

- Estado: ejecutado y revisado visualmente (2026-11-01, Playwright, claro y oscuro)
- Base: commit `3e2648b` + cambios sin commitear del árbol
- Contrato: `DESIGN.md` (sin sombras, color solo con tokens, escala tipográfica)

## 1. Quitar sombras en páginas internas

**Problema:** 155 usos de `shadow-sm|md|lg|xl|2xl` en 51 archivos de `src/pages`; 63 están sobre `<Card>` y anulan su `shadow-none`.

**Cambio:**
- `hover:shadow-*` → `hover:border-primary/40`
- `shadow-*` (incluye `data-[state=active]:shadow-*` y sombras de color `shadow-primary/20`) → se elimina
- `transition-shadow` → `transition-colors`

**Fuera de alcance:** páginas públicas `Landing`, `Auth`, `Planes`, `TicketPublico`, `PortalPublicoDisponibilidad`, `PortalPacientePsico`. `src/components/ui/*` no se toca.

## 2. Colores escritos a mano → tokens (Fase 6 del plan maestro)

**Archivos:** `DentalCarePro`, `PsicologiaPro`, `AestheticPro`, `VisionCarePro`, `ConfiguracionAdmin`.

**Mapa:**
- blue, indigo, purple, violet, pink, fuchsia, sky, cyan, teal → `primary`
- green, emerald → `success`
- amber, yellow, orange → `warning`
- red, rose → `destructive`

**Tono:** se elimina el número y se conserva la opacidad (`bg-rose-500/10` → `bg-destructive/10`). `bg-*-100` → `/15`. Se eliminan las variantes `dark:` de color, porque el token ya resuelve el modo oscuro.

## 3. Título de Reportes

`src/pages/Reportes.tsx`: `h1` de `text-3xl font-bold` → `text-2xl font-bold tracking-tight` (la escala de `ClinicalPageHeader`).

## Verificación

- `npm run typecheck` y `npm run build` en verde.
- `grep -rE "shadow-(sm|md|lg|xl|2xl)" src/pages` solo debe devolver las páginas públicas.
- Revisión visual hecha: Dental, Psicología, Estética, Visión y Pacientes en claro y oscuro.

## Ajuste tras la revisión visual

- `.dark --destructive` subió de `0 63% 31%` a `0 72% 51%`: como texto (por ejemplo "Alertas riesgo") no se leía sobre fondo oscuro.
