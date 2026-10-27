// Avatares de iniciales con color estable por persona (como en las referencias de diseño).
// Usa la paleta de gráficos del tema, así respeta modo oscuro y verticales.
const PALETA = [
  "bg-[hsl(var(--chart-1)/0.12)] text-[hsl(var(--chart-1))]",
  "bg-[hsl(var(--chart-2)/0.12)] text-[hsl(var(--chart-2))]",
  "bg-[hsl(var(--chart-3)/0.12)] text-[hsl(var(--chart-3))]",
  "bg-[hsl(var(--chart-4)/0.15)] text-[hsl(var(--chart-4))]",
  "bg-[hsl(var(--chart-5)/0.12)] text-[hsl(var(--chart-5))]",
];

export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return PALETA[Math.abs(h) % PALETA.length];
}

export function iniciales(nombre?: string | null, apellido?: string | null): string {
  return `${nombre?.trim()[0] ?? ""}${apellido?.trim()[0] ?? ""}`.toUpperCase() || "?";
}

const PARTICULAS = new Set(["de", "del", "la", "las", "los", "y", "da", "do", "dos", "van", "von"]);

/** "AGUSTINA DE LA CRUZ" → "Agustina de la Cruz" (los nombres importados suelen venir en mayúsculas). */
export function tituloNombre(nombre: string): string {
  return nombre
    .trim()
    .toLocaleLowerCase("es")
    .split(/\s+/)
    .map((p, i) => (i > 0 && PARTICULAS.has(p) ? p : p.replace(/(^|[-'])(\p{L})/gu, (_, s, c) => s + c.toLocaleUpperCase("es"))))
    .join(" ");
}
