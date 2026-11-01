/** Aislamiento entre clínicas del motor de datos (/api/v1/db). Uso: npx tsx scripts/test-motor-sql.ts */
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { asegurarEsquema, insertarFilas } from "../src/server/db/esquema-sql.js";
import { contextoDe, ejecutarDescriptor } from "../src/server/db/motor-sql.js";
import type { Descriptor } from "../src/integrations/db/consulta.js";

const db = createClient({ url: ":memory:" });
await asegurarEsquema(db);

// Clínica A (usuario a, dueño) y clínica B (usuario b, dueño)
await insertarFilas(db, "workspaces", [
  { id: "wa", nombre: "A", slug: "clinica-a", owner_id: "a", plan_codigo: "free" },
  { id: "wb", nombre: "B", slug: "clinica-b", owner_id: "b", plan_codigo: "free" },
]);
await insertarFilas(db, "workspace_members", [
  { id: "ma", workspace_id: "wa", user_id: "a", role: "owner" },
  { id: "mb", workspace_id: "wb", user_id: "b", role: "owner" },
]);
await insertarFilas(db, "pacientes", [{ id: "pb", workspace_id: "wb", nombre: "Paciente B" }]);
await insertarFilas(db, "escalas_clinicas", [{ id: "eb", paciente_id: "pb", tipo: "PHQ-9", puntaje: 20 }]);
await insertarFilas(db, "auditoria_cambios", [{ id: "ab", tabla: "pacientes", registro_id: "pb", datos_nuevos: { nombre: "Paciente B" } }]);
await insertarFilas(db, "push_subscriptions", [{ id: "sb", user_id: "b", endpoint: "x", auth_key: "secreto" }]);

const base = { columnas: "*", devolver: true, filtros: [], orden: [] };
const sel = (tabla: string): Descriptor => ({ ...base, tabla, op: "select" }) as Descriptor;
const ctxA = await contextoDe(db, "a");

// Hallazgo 1: tablas sin workspace_id
assert.equal((await ejecutarDescriptor(db, sel("escalas_clinicas"), ctxA)).data?.length, 0, "escalas de otra clínica visibles");
assert.equal((await ejecutarDescriptor(db, sel("push_subscriptions"), ctxA)).data?.length, 0, "push de otro usuario visible");
assert.equal((await ejecutarDescriptor(db, sel("auditoria_cambios"), ctxA)).status, 403, "auditoría global legible");
assert.ok(((await ejecutarDescriptor(db, sel("planes"), ctxA)).data?.length ?? 0) >= 0, "catálogo debe seguir legible");
assert.equal(((await ejecutarDescriptor(db, sel("escalas_clinicas"), await contextoDe(db, "b"))).data ?? []).length, 1, "la propia clínica sí ve sus escalas");

// Hallazgo 2: upsert sobre la clínica de otro por slug
const upsert = (await ejecutarDescriptor(
  db,
  { ...base, tabla: "workspaces", op: "upsert", conflicto: "slug", payload: { slug: "clinica-b", nombre: "pwned", owner_id: "a" } } as Descriptor,
  ctxA,
)) as { status?: number };
assert.equal(upsert.status, 403, "upsert de clínica ajena permitido");
const b = await db.execute(`SELECT nombre, owner_id FROM workspaces WHERE id = 'wb'`);
assert.deepEqual([b.rows[0].nombre, b.rows[0].owner_id], ["B", "b"]);

console.log("✅ motor-sql: aislamiento entre clínicas OK");
