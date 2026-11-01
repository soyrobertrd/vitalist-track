import { getAppDb } from "../../src/server/db/conexion-app.js";
import { asegurarEsquema } from "../../src/server/db/esquema-sql.js";
import { ejecutarDescriptor } from "../../src/server/db/motor-sql.js";
import { Consulta } from "../../src/integrations/db/consulta.js";
import { reservasPublicas } from "../../src/integrations/db/reservas-publicas.js";

let esquemaListo: Promise<void> | null = null;

// shortcut: límite por IP en memoria de cada instancia serverless; pasar a una tabla o a Upstash si hay abuso real.
const MAX_RESERVAS_POR_HORA = 5;
const reservasPorIp = new Map<string, number[]>();
function excedeLimite(ip: string) {
  const ahora = Date.now();
  const recientes = (reservasPorIp.get(ip) ?? []).filter((t) => ahora - t < 3600_000);
  reservasPorIp.set(ip, [...recientes, ahora]);
  return recientes.length >= MAX_RESERVAS_POR_HORA;
}

/** Directorio médico y reservas sin sesión. Solo ve y escribe en clínicas con reservas públicas activas. */
export async function POST(req: Request) {
  const db = getAppDb();
  await (esquemaListo ??= asegurarEsquema(db));
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return Response.json({ error: "Solicitud no válida" }, { status: 400 });

  if (body.accion === "reservar") {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "desconocida";
    if (excedeLimite(ip)) return Response.json({ error: "Demasiadas reservas seguidas. Intenta más tarde." }, { status: 429 });
  }

  // El visitante actúa con un contexto limitado a las clínicas que aceptan reservas: el motor sigue aplicando el aislamiento.
  const r = await db.execute(
    `SELECT "id" FROM "workspaces" WHERE json_extract("configuracion", '$.reservas_publicas') = 1 AND COALESCE("estado", '') <> 'suspendido'`,
  );
  const ctx = { userId: "publico", roles: new Map(r.rows.map((x) => [String(x.id), "publico"])) };
  const from = (t: string) => new Consulta(t, (d) => ejecutarDescriptor(db, d, ctx));

  const { status, data } = await reservasPublicas(from, body);
  return Response.json(data, { status });
}
