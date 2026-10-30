/** Sesiones propias con cookie httpOnly; el token solo se guarda hasheado (sha256) en auth_sesiones. */
import { createHash, randomBytes } from "node:crypto";
import type { Client } from "@libsql/client";

const COOKIE = "vt_sesion";
const DURACION_MS = 1000 * 60 * 60 * 24 * 30;
const hash = (t: string) => createHash("sha256").update(t).digest("hex");
const segura = () => process.env.NODE_ENV === "production" || !!process.env.VERCEL;

function cookie(valor: string, maxAge: number) {
  return `${COOKIE}=${valor}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${segura() ? "; Secure" : ""}`;
}

export async function crearSesion(db: Client, userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const ahora = new Date();
  await db.execute({
    sql: "INSERT INTO auth_sesiones (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    args: [hash(token), userId, new Date(ahora.getTime() + DURACION_MS).toISOString(), ahora.toISOString()],
  });
  return cookie(token, DURACION_MS / 1000);
}

function tokenDe(req: Request): string | null {
  const m = (req.headers.get("cookie") ?? "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  return m ? m[1] : null;
}

/** Id del usuario de la sesión, o null si no hay sesión válida. */
export async function usuarioDeRequest(db: Client, req: Request): Promise<string | null> {
  const token = tokenDe(req);
  if (!token) return null;
  const r = await db.execute({
    sql: "SELECT user_id FROM auth_sesiones WHERE token_hash = ? AND expires_at > ?",
    args: [hash(token), new Date().toISOString()],
  });
  return r.rows.length ? String(r.rows[0].user_id) : null;
}

export async function cerrarSesion(db: Client, req: Request): Promise<string> {
  const token = tokenDe(req);
  if (token) await db.execute({ sql: "DELETE FROM auth_sesiones WHERE token_hash = ?", args: [hash(token)] });
  return cookie("", 0);
}
