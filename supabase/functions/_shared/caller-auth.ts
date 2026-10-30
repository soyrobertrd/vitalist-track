import { safeEqual } from "./cron-auth.ts";

/**
 * Autoriza a quien llama una función con service_role: o es un proceso interno
 * (Bearer = service key) o es un usuario miembro del workspace del recurso.
 */
// deno-lint-ignore no-explicit-any
export async function puedeActuarEnWorkspace(req: Request, admin: any, workspaceId: string | null | undefined) {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const esInterno = token.length > 0 && safeEqual(token, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  if (esInterno) return { ok: true, esInterno: true };
  if (!token || !workspaceId) return { ok: false, esInterno: false };
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return { ok: false, esInterno: false };
  const { data: member } = await admin.from("workspace_members").select("user_id")
    .eq("workspace_id", workspaceId).eq("user_id", user.id).maybeSingle();
  return { ok: !!member, esInterno: false };
}

/** Escapa texto para interpolarlo en HTML de emails. */
export function escapeHtml(v: unknown): string {
  return String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
