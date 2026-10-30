// Prueba de la API sobre Turso con una base SQLite temporal: npm run test:api
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const archivo = path.join(os.tmpdir(), `vt-test-${Date.now()}.db`);
process.env.TURSO_DATABASE_URL = `file:${archivo}`;
delete process.env.TURSO_AUTH_TOKEN;

const auth = await import("../api/v1/auth/[accion]");
const api = await import("../api/v1/db");

const req = (ruta: string, body?: unknown, cookie?: string) =>
  new Request(`http://localhost/api/v1/${ruta}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const cookieDe = (r: Response) => r.headers.get("set-cookie")!.split(";")[0];
const consulta = async (cookie: string, d: Record<string, unknown>) =>
  (await api.POST(req("db", { columnas: "*", devolver: false, filtros: [], orden: [], op: "select", ...d }, cookie))).json();

// registro de dos usuarios en clínicas distintas
const a = await auth.POST(req("auth/signup", { email: "a@test.com", password: "clave-segura-1" }));
assert.equal(a.status, 201);
const ca = cookieDe(a);
const b = cookieDe(await auth.POST(req("auth/signup", { email: "b@test.com", password: "clave-segura-2" })));

const wsA = await consulta(ca, { tabla: "workspaces", op: "insert", payload: { nombre: "Clínica A", slug: "a", plan_codigo: "pro", estado: "activo", owner_id: "otro" }, devolver: true, unico: "single" });
assert.equal(wsA.error, null, JSON.stringify(wsA.error));
assert.notEqual(wsA.data.owner_id, "otro", "el dueño lo pone el servidor");
const wsB = await consulta(b, { tabla: "workspaces", op: "insert", payload: { nombre: "Clínica B", slug: "b", plan_codigo: "pro", estado: "activo" }, devolver: true, unico: "single" });

// cada uno solo ve su clínica
assert.deepEqual((await consulta(ca, { tabla: "workspaces", columnas: "nombre" })).data, [{ nombre: "Clínica A" }]);

// inserción con embed y filtros
const px = await consulta(ca, { tabla: "pacientes", op: "insert", payload: { workspace_id: wsA.data.id, nombre: "Ana", apellido: "Pérez", cedula: "1", status_px: "activo" }, devolver: true, unico: "single" });
assert.equal(px.error, null, JSON.stringify(px.error));
await consulta(ca, { tabla: "control_visitas", op: "insert", payload: { workspace_id: wsA.data.id, paciente_id: px.data.id, fecha_hora_visita: "2026-11-01T10:00:00Z", estado: "pendiente" } });
const citas = await consulta(ca, { tabla: "control_visitas", columnas: "id, estado, pacientes(nombre)", filtros: [{ t: "op", col: "estado", op: "eq", val: "pendiente" }] });
assert.equal(citas.data[0].pacientes.nombre, "Ana", "embed muchos-a-uno");
const conteo = await consulta(ca, { tabla: "pacientes", soloCabecera: true, contar: true });
assert.equal(conteo.count, 1);

// aislamiento: B no ve ni modifica datos de A
assert.deepEqual((await consulta(b, { tabla: "pacientes" })).data, []);
const ajeno = await consulta(b, { tabla: "pacientes", op: "insert", payload: { workspace_id: wsA.data.id, nombre: "X", apellido: "Y", cedula: "2" } });
assert.ok(ajeno.error, "no puede insertar en otra clínica");
await consulta(b, { tabla: "pacientes", op: "update", payload: { nombre: "Hack" }, filtros: [{ t: "op", col: "id", op: "eq", val: px.data.id }] });
assert.equal((await consulta(ca, { tabla: "pacientes", columnas: "nombre" })).data[0].nombre, "Ana", "update ajeno sin efecto");
const mover = await consulta(ca, { tabla: "pacientes", op: "update", payload: { workspace_id: wsB.data.id }, filtros: [{ t: "op", col: "id", op: "eq", val: px.data.id }] });
assert.ok(mover.error, "no se puede mover un registro a otra clínica");

// errores de esquema y sesión
assert.ok((await consulta(ca, { tabla: "pacientes", columnas: "no_existe" })).error);
assert.ok((await consulta(ca, { tabla: "tabla_inventada" })).error);
assert.equal((await api.POST(req("db", { tabla: "pacientes" }))).status, 401);

// login, sesión y logout
const login = await auth.POST(req("auth/login", { email: "a@test.com", password: "clave-segura-1" }));
assert.equal(login.status, 200);
assert.equal((await auth.POST(req("auth/login", { email: "a@test.com", password: "mala-clave-x" }))).status, 401);
assert.equal((await (await auth.GET(req("auth/session", undefined, cookieDe(login)))).json()).user.email, "a@test.com");
await auth.POST(req("auth/logout", {}, cookieDe(login)));
assert.equal((await (await auth.GET(req("auth/session", undefined, cookieDe(login)))).json()).user, null);

(await import("../src/server/db/conexion-app")).getAppDb().close();
try { fs.rmSync(archivo, { force: true }); } catch { /* Windows mantiene el archivo bloqueado hasta salir */ }
console.log("api-turso OK");
