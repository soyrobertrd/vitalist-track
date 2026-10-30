import { z } from "zod";
import { getAppDb } from "../../src/server/db/conexion-app";
import { asegurarEsquema } from "../../src/server/db/esquema-sql";
import { usuarioDeRequest } from "../../src/server/auth/sesion";
import { contextoDe, ejecutarDescriptor } from "../../src/server/db/motor-sql";
import type { Descriptor } from "../../src/integrations/db/consulta";

const filtro: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.object({ t: z.literal("op"), col: z.string().max(120), op: z.string().max(20), val: z.unknown(), neg: z.boolean().optional() }),
    z.object({ t: z.enum(["and", "or"]), hijos: z.array(filtro).max(50) }),
  ]),
);
const descriptor = z.object({
  tabla: z.string().regex(/^\w{1,80}$/),
  op: z.enum(["select", "insert", "update", "upsert", "delete"]),
  columnas: z.string().max(4000),
  devolver: z.boolean(),
  filtros: z.array(filtro).max(50),
  orden: z.array(z.object({ col: z.string().max(120), asc: z.boolean(), nullsFirst: z.boolean().optional(), tablaRef: z.string().optional() })).max(10),
  limite: z.number().int().min(0).max(10000).optional(),
  desde: z.number().int().min(0).optional(),
  hasta: z.number().int().min(0).optional(),
  unico: z.enum(["single", "maybe"]).optional(),
  payload: z.unknown().optional(),
  conflicto: z.string().max(200).optional(),
  contar: z.boolean().optional(),
  soloCabecera: z.boolean().optional(),
});

let esquemaListo: Promise<void> | null = null;

/** Punto único de datos: ejecuta en Turso la consulta que arma el cliente, limitada a las clínicas del usuario. */
export async function POST(req: Request) {
  const db = getAppDb();
  await (esquemaListo ??= asegurarEsquema(db));
  const userId = await usuarioDeRequest(db, req);
  if (!userId) return Response.json({ data: null, error: { message: "Sesión requerida", code: "401" } }, { status: 401 });

  const p = descriptor.safeParse(await req.json().catch(() => null));
  if (!p.success) return Response.json({ data: null, error: { message: "Consulta no válida", code: "400" } }, { status: 400 });

  const resultado = await ejecutarDescriptor(db, p.data as Descriptor, await contextoDe(db, userId));
  return Response.json(resultado, { status: resultado.status ?? 200 });
}
