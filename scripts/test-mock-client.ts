// Autoverificación del cliente mockup: npx tsx scripts/test-mock-client.ts
import assert from "node:assert/strict";
const mem = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v), removeItem: (k: string) => mem.delete(k) };

const { clienteMemoria: db } = await import("../src/integrations/db/memoria");

const { data: pac } = await db.from("pacientes").select("id, nombre").eq("workspace_id", "ws-clinica").order("nombre");
assert.ok(pac.length > 0, "hay pacientes sembrados");
assert.deepEqual(Object.keys(pac[0]), ["id", "nombre"]);

const { data: citas } = await db.from("control_visitas").select("*, pacientes(nombre), personal_salud!profesional_id(nombre)").limit(1);
assert.ok(citas[0].pacientes?.nombre, "embed muchos-a-uno");
assert.ok(citas[0].personal_salud?.nombre, "embed con hint");

const { data: conCitas } = await db.from("pacientes").select("id, control_visitas(id)").eq("id", citas[0].paciente_id).single();
assert.ok(conCitas.control_visitas.length >= 1, "embed uno-a-muchos");

const { data: nuevo } = await db.from("pacientes").insert({ nombre: "Ana", apellido: "Pérez", workspace_id: "ws-clinica" }).select().single();
assert.ok(nuevo.id && nuevo.created_at);
await db.from("pacientes").update({ apellido: "Gómez" }).eq("id", nuevo.id);
const { data: or } = await db.from("pacientes").select("apellido").or(`apellido.eq.Gómez,nombre.ilike.%zzz%`);
assert.equal(or.length, 1);
const { count } = await db.from("pacientes").select("*", { count: "exact", head: true }).eq("workspace_id", "ws-clinica");
assert.ok(count! > 1);
await db.from("workspace_verticales").upsert({ workspace_id: "ws-clinica", vertical: "veterinaria", activo: true }, { onConflict: "workspace_id,vertical" });
await db.from("workspace_verticales").upsert({ workspace_id: "ws-clinica", vertical: "veterinaria", activo: false }, { onConflict: "workspace_id,vertical" });
const { data: vets } = await db.from("workspace_verticales").select("activo").eq("vertical", "veterinaria");
assert.deepEqual(vets, [{ activo: false }], "upsert no duplica");
await db.from("pacientes").delete().eq("id", nuevo.id);
const { data: borrado } = await db.from("pacientes").select("id").eq("id", nuevo.id).maybeSingle();
assert.equal(borrado, null);

const { error } = await db.auth.signInWithPassword({ email: "demo@vitalisttrack.com", password: "x" });
assert.equal(error, null);
const { data: { user } } = await db.auth.getUser();
assert.equal(user?.id, "usr-admin-demo");
console.log("mock-client OK");
