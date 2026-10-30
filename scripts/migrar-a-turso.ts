#!/usr/bin/env -S npx tsx
/**
 * Migra la base de Vitalist Track a Turso desde la terminal.
 *
 *   npm run db:migrar                      → crea/actualiza las 410 tablas (sin datos)
 *   npm run db:migrar -- --supabase        → además copia todas las filas y usuarios desde Supabase
 *   npm run db:migrar -- --demo            → además carga los datos demo (centros, médicos, pacientes, citas)
 *   npm run db:migrar -- --supabase --demo → ambas cosas
 *   añadir --local                         → escribe en vitalist-local.db (SQLite) en vez de Turso;
 *                                            luego se sube con: turso db import vitalist-local.db
 *
 * Variables (en .env.local; se bajan de Vercel con `npx vercel env pull .env.local`):
 *   TURSO_DATABASE_URL, TURSO_AUTH_TOKEN          destino (sin URL usa file:local-app.db)
 *   SUPABASE_URL (o VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY   origen, solo con --supabase
 */
import fs from "node:fs";
import { createClient } from "@libsql/client";
import { configTurso } from "../src/server/db/conexion-app";
import { ESQUEMA, asegurarEsquema, insertarFilas } from "../src/server/db/esquema-sql";

function cargarEnv() {
  for (const archivo of [".env.local", ".env"]) {
    if (!fs.existsSync(archivo)) continue;
    for (const linea of fs.readFileSync(archivo, "utf8").split(/\r?\n/)) {
      const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m || process.env[m[1]]) continue;
      process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
    }
  }
}

const args = new Set(process.argv.slice(2));
const log = (m: string) => console.log(m);

async function leerSupabase(url: string, clave: string) {
  const cabeceras = { apikey: clave, Authorization: `Bearer ${clave}` };
  const tablas: Record<string, Record<string, unknown>[]> = {};
  for (const tabla of Object.keys(ESQUEMA)) {
    const filas: Record<string, unknown>[] = [];
    for (let desde = 0; ; desde += 1000) {
      const r = await fetch(`${url}/rest/v1/${tabla}?select=*`, {
        headers: { ...cabeceras, Range: `${desde}-${desde + 999}`, "Range-Unit": "items" },
      });
      if (!r.ok) {
        log(`  ! ${tabla}: ${r.status} ${(await r.text()).slice(0, 120)}`);
        break;
      }
      const lote = (await r.json()) as Record<string, unknown>[];
      filas.push(...lote);
      if (lote.length < 1000) break;
    }
    if (filas.length) tablas[tabla] = filas;
  }

  const usuarios: { id: string; email: string; created_at: string }[] = [];
  for (let pagina = 1; ; pagina++) {
    const r = await fetch(`${url}/auth/v1/admin/users?page=${pagina}&per_page=1000`, { headers: cabeceras });
    if (!r.ok) {
      log(`  ! usuarios: ${r.status}`);
      break;
    }
    const { users } = (await r.json()) as { users: { id: string; email: string; created_at: string }[] };
    usuarios.push(...users);
    if (users.length < 1000) break;
  }
  return { tablas, usuarios };
}

async function main() {
  cargarEnv();
  const { url, authToken } = args.has("--local") ? { url: "file:vitalist-local.db", authToken: undefined } : configTurso();
  if (!args.has("--local") && url.startsWith("file:"))
    throw new Error(
      `No hay credenciales de Turso (TURSO_DATABASE_URL / TURSO_AUTH_TOKEN); se iba a escribir en el archivo local ${url}.\n` +
        "  Bájalas de Vercel con: npx vercel env pull .env.local --environment=production\n" +
        "  o usa --local si de verdad quieres una base SQLite local.",
    );
  const db = createClient({ url, authToken });
  log(`Destino: ${url.replace(/\?.*$/, "")}`);

  await asegurarEsquema(db, log);
  log(`Esquema al día (${Object.keys(ESQUEMA).length} tablas).`);

  if (args.has("--supabase")) {
    const origen = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!origen || !clave) throw new Error("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para --supabase.");
    log(`Leyendo Supabase…`);
    const { tablas, usuarios } = await leerSupabase(origen, clave);
    let total = 0;
    for (const [tabla, filas] of Object.entries(tablas)) {
      total += await insertarFilas(db, tabla, filas);
      log(`  ${tabla}: ${filas.length}`);
    }
    // Las contraseñas de Supabase no se pueden exportar: los usuarios entran con "¿Olvidaste tu contraseña?"
    // o se les asigna una con `npm run db:clave -- correo nueva-clave`.
    await db.batch(
      usuarios.map((u) => ({
        sql: "INSERT OR IGNORE INTO auth_usuarios (id, email, password_hash, created_at) VALUES (?, ?, NULL, ?)",
        args: [u.id, u.email, u.created_at],
      })),
      "write",
    );
    log(`Supabase → Turso: ${total} filas en ${Object.keys(tablas).length} tablas, ${usuarios.length} usuarios.`);
  }

  if (args.has("--demo")) {
    const { sembrarDatos, USUARIO_DEMO } = await import("../src/integrations/db/seed");
    let total = 0;
    for (const [tabla, filas] of Object.entries(sembrarDatos())) total += await insertarFilas(db, tabla, filas);
    await db.execute({
      sql: "INSERT OR IGNORE INTO auth_usuarios (id, email, password_hash, created_at) VALUES (?, ?, NULL, ?)",
      args: [USUARIO_DEMO.id, USUARIO_DEMO.email, new Date().toISOString()],
    });
    log(`Demo cargada: ${total} filas. Usuario ${USUARIO_DEMO.email} (asígnale clave con npm run db:clave).`);
  }

  db.close();
  log("Listo.");
}

main().catch((e) => {
  console.error("Error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
