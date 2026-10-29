/**
 * Escapado para HTML generado como texto (impresión con window.open + document.write).
 * React escapa solo el JSX; estas plantillas no, así que todo dato de paciente debe pasar por aquí.
 */
const MAPA: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  return String(valor).replace(/[&<>"']/g, (c) => MAPA[c]);
}

type Escapado<T> = T extends string ? string : T extends (infer U)[] ? Escapado<U>[] : T extends object ? { [K in keyof T]: Escapado<T[K]> } : T;

/** Copia del objeto con todos los strings escapados (números, null y fechas se conservan). */
export function escapeDeep<T>(valor: T): Escapado<T> {
  if (typeof valor === "string") return escapeHtml(valor) as Escapado<T>;
  if (Array.isArray(valor)) return valor.map(escapeDeep) as Escapado<T>;
  if (valor && typeof valor === "object" && !(valor instanceof Date)) {
    return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, escapeDeep(v)])) as Escapado<T>;
  }
  return valor as Escapado<T>;
}

/** Solo acepta colores hex para interpolar en CSS; cualquier otra cosa usa el respaldo. */
export function safeColor(color: string | null | undefined, respaldo: string): string {
  return color && /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : respaldo;
}
