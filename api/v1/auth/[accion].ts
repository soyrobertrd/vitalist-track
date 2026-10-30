import { z } from "zod";
import { getAppDb } from "../../../src/server/db/conexion-app";
import { asegurarEsquema } from "../../../src/server/db/esquema-sql";
import { hashClave, verificarClave } from "../../../src/server/auth/clave";
import { cerrarSesion, crearSesion, usuarioDeRequest } from "../../../src/server/auth/sesion";

const credenciales = z.object({ email: z.string().trim().toLowerCase().email().max(254), password: z.string().min(8).max(200) });
const registro = credenciales.extend({ data: z.record(z.string(), z.unknown()).optional() });

let esquemaListo: Promise<void> | null = null;
const json = (body: unknown, status = 200, cookie?: string) =>
  Response.json(body, { status, headers: cookie ? { "Set-Cookie": cookie } : undefined });
const fallo = (message: string, status: number) => json({ error: { message } }, status);
const accion = (req: Request) => new URL(req.url).pathname.split("/").pop();

async function usuarioPublico(userId: string) {
  const r = await getAppDb().execute({
    sql: "SELECT u.id, u.email, u.created_at, p.nombre, p.apellido FROM auth_usuarios u LEFT JOIN profiles p ON p.id = u.id WHERE u.id = ?",
    args: [userId],
  });
  const u = r.rows[0];
  if (!u) return null;
  return {
    id: String(u.id),
    email: String(u.email),
    created_at: String(u.created_at),
    aud: "authenticated",
    app_metadata: {},
    user_metadata: { nombre: u.nombre ?? "", apellido: u.apellido ?? "" },
  };
}

export async function GET(req: Request) {
  if (accion(req) !== "session") return fallo("No encontrado", 404);
  const db = getAppDb();
  await (esquemaListo ??= asegurarEsquema(db));
  const userId = await usuarioDeRequest(db, req);
  return json({ user: userId ? await usuarioPublico(userId) : null });
}

export async function POST(req: Request) {
  const db = getAppDb();
  await (esquemaListo ??= asegurarEsquema(db));
  const cuerpo = await req.json().catch(() => ({}));

  switch (accion(req)) {
    case "login": {
      // shortcut: sin límite de intentos; añadir rate limiting (tabla o Vercel KV) antes de producción.
      const p = credenciales.safeParse(cuerpo);
      if (!p.success) return fallo("Invalid login credentials", 400);
      const r = await db.execute({ sql: "SELECT id, password_hash FROM auth_usuarios WHERE email = ?", args: [p.data.email] });
      const fila = r.rows[0];
      const ok = await verificarClave(p.data.password, fila ? String(fila.password_hash ?? "") : null);
      if (!fila || !ok) return fallo("Invalid login credentials", 401);
      const cookie = await crearSesion(db, String(fila.id));
      return json({ user: await usuarioPublico(String(fila.id)) }, 200, cookie);
    }
    case "signup": {
      const p = registro.safeParse(cuerpo);
      if (!p.success) return fallo("Datos no válidos (la contraseña necesita al menos 8 caracteres)", 400);
      const existe = await db.execute({ sql: "SELECT 1 FROM auth_usuarios WHERE email = ?", args: [p.data.email] });
      if (existe.rows.length) return fallo("User already registered", 409);
      const id = crypto.randomUUID();
      const ahora = new Date().toISOString();
      await db.batch(
        [
          {
            sql: "INSERT INTO auth_usuarios (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
            args: [id, p.data.email, await hashClave(p.data.password), ahora],
          },
          {
            sql: "INSERT INTO profiles (id, email, nombre, apellido, cedula, rol, activo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)",
            args: [id, p.data.email, String(p.data.data?.nombre ?? ""), String(p.data.data?.apellido ?? ""), "", "user", ahora, ahora],
          },
        ],
        "write",
      );
      const cookie = await crearSesion(db, id);
      return json({ user: await usuarioPublico(id) }, 201, cookie);
    }
    case "logout":
      return json({ ok: true }, 200, await cerrarSesion(db, req));
    case "password": {
      const userId = await usuarioDeRequest(db, req);
      if (!userId) return fallo("No hay sesión", 401);
      const p = z.object({ password: z.string().min(8).max(200) }).safeParse(cuerpo);
      if (!p.success) return fallo("La contraseña necesita al menos 8 caracteres", 400);
      await db.execute({ sql: "UPDATE auth_usuarios SET password_hash = ? WHERE id = ?", args: [await hashClave(p.data.password), userId] });
      return json({ user: await usuarioPublico(userId) });
    }
    default:
      return fallo("No encontrado", 404);
  }
}
