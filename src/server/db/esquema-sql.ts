/**
 * Esquema SQLite de la app en Turso (una sola base en esta fase de pruebas).
 * Las tablas salen de src/integrations/db/esquema.json, generado con scripts/generar-esquema-sqlite.mjs.
 */
import type { Client } from "@libsql/client";
import esquemaJson from "../../integrations/db/esquema.json";

export type TipoColumna = "text" | "real" | "bool" | "json";
export const ESQUEMA = esquemaJson as Record<string, Record<string, TipoColumna>>;

const TIPO_SQL: Record<TipoColumna, string> = { text: "TEXT", real: "REAL", bool: "INTEGER", json: "TEXT" };
export const q = (id: string) => `"${id.replace(/"/g, '""')}"`;

/** Tablas propias de la autenticación (no forman parte del esquema de la app). */
const DDL_AUTH = [
  `CREATE TABLE IF NOT EXISTS auth_usuarios (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS auth_sesiones (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_auth_sesiones_user ON auth_sesiones(user_id)`,
];

export function ddlTabla(tabla: string): string[] {
  const cols = ESQUEMA[tabla];
  const defs = Object.entries(cols).map(([c, t]) => `${q(c)} ${TIPO_SQL[t]}${c === "id" ? " PRIMARY KEY" : ""}`);
  const sentencias = [`CREATE TABLE IF NOT EXISTS ${q(tabla)} (${defs.join(", ")})`];
  if (cols.workspace_id) sentencias.push(`CREATE INDEX IF NOT EXISTS ${q(`idx_${tabla}_ws`)} ON ${q(tabla)}(workspace_id)`);
  return sentencias;
}

/** Crea las tablas que falten y añade las columnas nuevas a las que ya existen. Idempotente. */
export async function asegurarEsquema(db: Client, log: (m: string) => void = () => {}) {
  await db.batch(DDL_AUTH, "write");
  const existentes = new Set(
    (await db.execute("SELECT name FROM sqlite_master WHERE type = 'table'")).rows.map((r) => String(r.name)),
  );
  const nuevas = Object.keys(ESQUEMA).filter((t) => !existentes.has(t));
  for (let i = 0; i < nuevas.length; i += 50) {
    await db.batch(nuevas.slice(i, i + 50).flatMap(ddlTabla), "write");
  }
  if (nuevas.length) log(`Tablas creadas: ${nuevas.length}`);

  let columnas = 0;
  for (const t of Object.keys(ESQUEMA).filter((x) => existentes.has(x))) {
    const actuales = new Set((await db.execute(`PRAGMA table_info(${q(t)})`)).rows.map((r) => String(r.name)));
    const faltan = Object.entries(ESQUEMA[t]).filter(([c]) => !actuales.has(c));
    for (const [c, tipo] of faltan) await db.execute(`ALTER TABLE ${q(t)} ADD COLUMN ${q(c)} ${TIPO_SQL[tipo]}`);
    columnas += faltan.length;
  }
  if (columnas) log(`Columnas añadidas: ${columnas}`);
}

/** Convierte un valor JS al formato almacenado en SQLite según el tipo de columna. */
export function aSql(tipo: TipoColumna | undefined, v: unknown): string | number | null {
  if (v === undefined || v === null) return null;
  if (tipo === "json") return typeof v === "string" ? v : JSON.stringify(v);
  if (tipo === "bool") return v ? 1 : 0;
  if (tipo === "real") return Number(v);
  return typeof v === "object" ? JSON.stringify(v) : (v as string | number);
}

/** Convierte un valor leído de SQLite al tipo que espera la app. */
export function desdeSql(tipo: TipoColumna | undefined, v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (tipo === "bool") return Number(v) === 1;
  if (tipo === "real") return Number(v);
  if (tipo === "json" && typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return typeof v === "bigint" ? Number(v) : v;
}

/** Inserta o reemplaza filas en lotes. Ignora columnas que no estén en el esquema. */
export async function insertarFilas(db: Client, tabla: string, filas: Record<string, unknown>[]) {
  const cols = ESQUEMA[tabla];
  if (!cols || !filas.length) return 0;
  const nombres = Object.keys(cols);
  const sql = `INSERT OR REPLACE INTO ${q(tabla)} (${nombres.map(q).join(", ")}) VALUES (${nombres.map(() => "?").join(", ")})`;
  for (let i = 0; i < filas.length; i += 200) {
    await db.batch(
      filas.slice(i, i + 200).map((f) => ({ sql, args: nombres.map((c) => aSql(cols[c], f[c])) })),
      "write",
    );
  }
  return filas.length;
}
