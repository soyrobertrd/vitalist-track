/**
 * Utilidades para enlaces de videoconsulta.
 * Soporta Jitsi (autogenerado), Zoom, Google Meet, Microsoft Teams (manual).
 */

export type VideoProveedor = "jitsi" | "zoom" | "meet" | "teams" | "otro";

export const VIDEO_PROVEEDORES: { value: VideoProveedor; label: string; autoGenera: boolean }[] = [
  { value: "jitsi", label: "Jitsi Meet (gratis, autogenerado)", autoGenera: true },
  { value: "zoom", label: "Zoom (pegar enlace)", autoGenera: false },
  { value: "meet", label: "Google Meet (pegar enlace)", autoGenera: false },
  { value: "teams", label: "Microsoft Teams (pegar enlace)", autoGenera: false },
  { value: "otro", label: "Otro (pegar enlace)", autoGenera: false },
];

/**
 * Genera una sala única de Jitsi para una cita.
 * Usa un slug derivado del workspace + token para evitar colisiones.
 */
export function generarSalaJitsi(opts: {
  workspaceSlug?: string | null;
  visitaId: string;
}): string {
  const slug = (opts.workspaceSlug || "clinica")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  const idShort = opts.visitaId.replace(/-/g, "").slice(0, 12);
  return `https://meet.jit.si/${slug}-${idShort}`;
}

export function validarEnlaceVideo(proveedor: VideoProveedor, enlace: string): string | null {
  if (!enlace || !enlace.trim()) return "El enlace no puede estar vacío";
  let url: URL;
  try {
    url = new URL(enlace);
  } catch {
    return "Enlace no válido";
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return "Debe ser un enlace HTTP(S)";
  }
  const dominiosEsperados: Record<VideoProveedor, string[]> = {
    jitsi: ["meet.jit.si", "jitsi"],
    zoom: ["zoom.us", "zoom.com"],
    meet: ["meet.google.com"],
    teams: ["teams.microsoft.com", "teams.live.com"],
    otro: [],
  };
  const esperados = dominiosEsperados[proveedor];
  if (esperados.length > 0 && !esperados.some((d) => url.hostname.includes(d))) {
    return `El enlace no parece ser de ${proveedor}. Verifica el dominio.`;
  }
  return null;
}

export function etiquetaProveedor(p?: string | null): string {
  if (!p) return "Videoconsulta";
  const found = VIDEO_PROVEEDORES.find((x) => x.value === p);
  return found?.label.split(" (")[0] ?? p;
}
