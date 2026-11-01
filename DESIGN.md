# DESIGN.md — Vitalist Track

Reglas de diseño vigentes para la app interna (todo lo que vive dentro de `Layout`). Las páginas públicas (`Landing`, `Auth`, `Planes`, portales y tickets públicos) pueden salirse de estas reglas.

## Principio: "Modo B", CRM médico limpio y plano

- **Sin sombras.** Las superficies se separan con borde (`border`), no con `shadow-*`. `Card` y `GlassCard` ya traen `shadow-none`; no se lo quites.
- **Hover en tarjetas:** solo `hover:border-primary/40` con `transition-colors`.
- Densidad equilibrada, componentes de shadcn/ui (`src/components/ui/*`) y ningún archivo de más de 900 líneas.

## Color: siempre tokens, nunca colores de Tailwind escritos a mano

Los tokens están en `src/index.css` (`:root`, `.dark`) y se exponen en `tailwind.config.ts`.

| Uso | Token | Ejemplo |
| --- | --- | --- |
| Marca, acción principal, elementos destacados | `primary` | `bg-primary/10 text-primary` |
| Éxito, pagado, activo | `success` | `text-success`, `bg-success/10` |
| Pendiente, atención, por vencer | `warning` | `text-warning` |
| Error, deuda, riesgo, alergia | `destructive` | `text-destructive` |
| Informativo, neutral con color | `info` | `bg-info/10 text-info` |
| Texto secundario | `muted-foreground` | |
| Gráficos | `chart-1` … `chart-5` | `chart-1` = `primary` de la vertical |

- Los tokens ya resuelven el modo oscuro: no agregues variantes `dark:text-*-400`.
- La opacidad va sobre el token: `bg-success/10`, `border-destructive/40`.
- `src/components/ui/*` no se toca para cambiar colores de una página.

### Color por vertical

`VerticalProvider` pone `data-vertical` en `<html>`. Cada bloque `[data-vertical="…"]` de `index.css` sobrescribe `--primary`, `--ring`, `--sidebar-primary`, `--sidebar-ring`, `--accent` y `--chart-1`. Los colores semánticos (`success`, `warning`, `destructive`, `info`) **no cambian** entre verticales.

| Vertical | `--primary` claro |
| --- | --- |
| clinica / todas | azul `217 91% 60%` |
| dental | cian `188 86% 36%` |
| aesthetic | frambuesa `330 65% 50%` |
| recovery | salvia `158 64% 34%` |
| vision | índigo `245 58% 55%` |
| psicologia | lavanda `265 45% 52%` |
| veterinaria | ámbar oscuro `28 85% 38%` |
| fisioterapia | verde azulado `174 72% 30%` |
| nutricion | verde hoja `142 64% 30%` |
| ginecologia | rosa profundo `340 70% 42%` |
| pediatria | azul cielo `199 89% 36%` |

Texto blanco sobre `--primary` en claro debe dar contraste ≥ 4.5:1.

## Forma

- Controles (Button, Input, Select, Textarea, Toggle): `rounded-control` (8px, `--radius-control`). Nada de píldoras en controles.
- Tarjetas: `rounded-xl` (de `Card`).

## Tipografía

- Título de página `text-2xl font-bold tracking-tight` (lo pone `ClinicalPageHeader`), sección `text-lg font-semibold`, cuerpo `text-sm`.
- Números en tablas y métricas: `tabular-nums`.

## Encabezado de página

Las páginas internas usan `ClinicalPageHeader` (`src/components/common/ClinicalPageHeader.tsx`) con `title`, `subtitle`, `icon` y `actions`.

## Estados

- Carga con `Skeleton`, no con el texto "Cargando...".
- Listas vacías: una frase que explique qué falta y un botón para crearlo.
