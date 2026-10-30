/**
 * Ejecuta en Turso (SQLite) las consultas que arma el cliente (Descriptor), con control de acceso:
 * cada usuario solo ve y modifica filas de los workspaces (clínicas) a los que pertenece.
 * Todas las clínicas comparten una sola base en esta fase; el aislamiento lo da este archivo.
 */
import type { Client, InValue } from "@libsql/client";
import relacionesJson from "../../integrations/db/relaciones.json";
import { parsearSelect, type Campo, type Descriptor, type Filtro, type Resultado } from "../../integrations/db/consulta";
import { ESQUEMA, aSql, desdeSql, q, type TipoColumna } from "./esquema-sql";

type Fila = Record<string, unknown>;
const FK = relacionesJson as [string, string, string][];

export interface ContextoAcceso {
  userId: string;
  /** workspace_id → rol del usuario en él */
  roles: Map<string, string>;
}

export class ErrorAcceso extends Error {
  constructor(message: string, public status = 403) {
    super(message);
  }
}

// ---------- SQL de filtros ----------
interface Sql {
  sql: string;
  args: InValue[];
}
const unir = (partes: Sql[], sep: string): Sql => ({
  sql: partes.map((p) => `(${p.sql})`).join(sep),
  args: partes.flatMap((p) => p.args),
});

function columnaSql(tabla: string, col: string): { expr: string; tipo?: TipoColumna } {
  const [base, ...ruta] = col.split(/->>?/);
  if (!ESQUEMA[tabla]?.[base]) throw new ErrorAcceso(`Columna desconocida: ${tabla}.${base}`, 400);
  if (!ruta.length) return { expr: q(base), tipo: ESQUEMA[tabla][base] };
  return { expr: `json_extract(${q(base)}, '$.${ruta.map((r) => r.replace(/[^\w]/g, "")).join(".")}')` };
}

function filtroSql(tabla: string, f: Filtro): Sql {
  if (f.t !== "op") {
    const hijos = f.hijos.map((h) => filtroSql(tabla, h));
    return hijos.length ? unir(hijos, f.t === "and" ? " AND " : " OR ") : { sql: "1", args: [] };
  }
  const { expr, tipo } = columnaSql(tabla, f.col);
  const v = (x: unknown) => (tipo === "json" ? aSql("text", x) : aSql(tipo, x)) as InValue;
  let r: Sql;
  switch (f.op) {
    case "eq": r = { sql: `${expr} = ?`, args: [v(f.val)] }; break;
    case "neq": r = { sql: `${expr} IS NOT ?`, args: [v(f.val)] }; break;
    case "gt": r = { sql: `${expr} > ?`, args: [v(f.val)] }; break;
    case "gte": r = { sql: `${expr} >= ?`, args: [v(f.val)] }; break;
    case "lt": r = { sql: `${expr} < ?`, args: [v(f.val)] }; break;
    case "lte": r = { sql: `${expr} <= ?`, args: [v(f.val)] }; break;
    case "like": r = { sql: `${expr} LIKE ?`, args: [String(f.val)] }; break;
    case "ilike": r = { sql: `lower(${expr}) LIKE lower(?)`, args: [String(f.val)] }; break;
    case "is": r = f.val === null ? { sql: `${expr} IS NULL`, args: [] } : { sql: `${expr} = ?`, args: [v(f.val)] }; break;
    case "in": {
      const lista = (f.val as unknown[]) ?? [];
      r = lista.length ? { sql: `${expr} IN (${lista.map(() => "?").join(",")})`, args: lista.map(v) } : { sql: "0", args: [] };
      break;
    }
    case "contains": {
      if (Array.isArray(f.val)) {
        r = f.val.length
          ? unir(f.val.map((x) => ({ sql: `EXISTS (SELECT 1 FROM json_each(${expr}) WHERE value = ?)`, args: [x as InValue] })), " AND ")
          : { sql: "1", args: [] };
      } else if (f.val && typeof f.val === "object") {
        const pares = Object.entries(f.val as Fila);
        r = pares.length
          ? unir(pares.map(([k, x]) => ({ sql: `json_extract(${expr}, '$.${k.replace(/[^\w]/g, "")}') = ?`, args: [aSql(undefined, x) as InValue] })), " AND ")
          : { sql: "1", args: [] };
      } else r = { sql: `instr(${expr}, ?) > 0`, args: [String(f.val)] };
      break;
    }
    case "overlaps": {
      const lista = (f.val as unknown[]) ?? [];
      r = lista.length
        ? unir(lista.map((x) => ({ sql: `EXISTS (SELECT 1 FROM json_each(${expr}) WHERE value = ?)`, args: [x as InValue] })), " OR ")
        : { sql: "0", args: [] };
      break;
    }
    default:
      throw new ErrorAcceso(`Operador no soportado: ${f.op}`, 400);
  }
  return f.neg ? { sql: `NOT (${r.sql})`, args: r.args } : r;
}

// ---------- control de acceso ----------
const TABLAS_CUENTA = new Set(["workspaces", "workspace_members", "profiles"]);
const ROLES_ADMIN = new Set(["owner", "admin"]);

/** Camino de una tabla sin workspace_id hasta una que sí lo tiene (vía FK, hasta 2 saltos). */
function caminoWorkspace(tabla: string, prof = 0): { col: string; padre: string; sub?: ReturnType<typeof caminoWorkspace> } | null {
  if (prof > 2) return null;
  for (const [t, col, padre] of FK) {
    if (t !== tabla || padre === tabla) continue;
    if (ESQUEMA[padre]?.workspace_id) return { col, padre };
  }
  for (const [t, col, padre] of FK) {
    if (t !== tabla || padre === tabla) continue;
    const sub = caminoWorkspace(padre, prof + 1);
    if (sub) return { col, padre, sub };
  }
  return null;
}

function listaWs(ctx: ContextoAcceso): Sql {
  const ids = [...ctx.roles.keys()];
  return ids.length ? { sql: ids.map(() => "?").join(","), args: ids } : { sql: "NULL", args: [] };
}

/** Condición SQL que limita una tabla a lo que el usuario puede ver. null = tabla de catálogo global (lectura libre). */
function alcance(tabla: string, ctx: ContextoAcceso): Sql | null {
  const ws = listaWs(ctx);
  if (tabla === "workspaces") return { sql: `"id" IN (${ws.sql})`, args: ws.args };
  if (tabla === "profiles")
    return {
      sql: `"id" = ? OR "id" IN (SELECT "user_id" FROM "workspace_members" WHERE "workspace_id" IN (${ws.sql}))`,
      args: [ctx.userId, ...ws.args],
    };
  if (ESQUEMA[tabla]?.workspace_id) return { sql: `"workspace_id" IN (${ws.sql})`, args: ws.args };
  const camino = caminoWorkspace(tabla);
  if (!camino) return null;
  const sub = (c: NonNullable<ReturnType<typeof caminoWorkspace>>): string =>
    c.sub
      ? `SELECT "id" FROM ${q(c.padre)} WHERE ${q(c.sub.col)} IN (${sub(c.sub)})`
      : `SELECT "id" FROM ${q(c.padre)} WHERE "workspace_id" IN (${ws.sql})`;
  const profundidad = (c: typeof camino): number => (c?.sub ? 1 + profundidad(c.sub) : 1);
  return { sql: `${q(camino.col)} IN (${sub(camino)})`, args: Array(profundidad(camino)).fill(ws.args).flat() };
}

async function verificarEscritura(db: Client, tabla: string, filas: Fila[], ctx: ContextoAcceso) {
  for (const f of filas) {
    if (tabla === "workspaces") continue; // se valida al crear (owner_id = usuario)
    if (tabla === "profiles") {
      if (f.id !== ctx.userId) throw new ErrorAcceso("Solo puedes modificar tu propio perfil.");
      continue;
    }
    if (tabla === "workspace_members") {
      const rol = ctx.roles.get(String(f.workspace_id));
      if (!rol || !ROLES_ADMIN.has(rol)) throw new ErrorAcceso("Solo un administrador puede gestionar miembros.");
      if (f.role === "owner" && rol !== "owner") throw new ErrorAcceso("Solo el dueño puede asignar el rol de dueño.");
      continue;
    }
    if (ESQUEMA[tabla]?.workspace_id) {
      if (!ctx.roles.has(String(f.workspace_id))) throw new ErrorAcceso("No perteneces a esa clínica.");
      continue;
    }
    const camino = caminoWorkspace(tabla);
    if (!camino) throw new ErrorAcceso(`La tabla ${tabla} es de solo lectura.`);
    const alc = alcance(camino.padre, ctx)!;
    const r = await db.execute({ sql: `SELECT 1 FROM ${q(camino.padre)} WHERE "id" = ? AND (${alc.sql})`, args: [f[camino.col] as InValue, ...alc.args] });
    if (!r.rows.length) throw new ErrorAcceso("El registro relacionado no pertenece a tu clínica.");
  }
}

// ---------- lectura ----------
function filaApp(tabla: string, r: Fila): Fila {
  const cols = ESQUEMA[tabla];
  const out: Fila = {};
  for (const [k, v] of Object.entries(r)) out[k] = desdeSql(cols[k], v);
  return out;
}

async function seleccionar(db: Client, tabla: string, where: Sql, ctx: ContextoAcceso, extra = ""): Promise<Fila[]> {
  const alc = alcance(tabla, ctx);
  const cond = alc ? unir([where, alc], " AND ") : where;
  const r = await db.execute({ sql: `SELECT * FROM ${q(tabla)} WHERE ${cond.sql} ${extra}`, args: cond.args });
  return r.rows.map((x) => filaApp(tabla, x as unknown as Fila));
}

function resolverEmbed(origen: string, nombre: string, hint?: string) {
  const fkDe = (t: string, c: string) => FK.find(([a, col]) => a === t && col === c)?.[2];
  const directa = fkDe(origen, nombre);
  if (directa) return { tabla: directa, local: nombre, remoto: "id", muchos: false };
  if (hint) {
    if (fkDe(origen, hint) === nombre) return { tabla: nombre, local: hint, remoto: "id", muchos: false };
    if (fkDe(nombre, hint) === origen) return { tabla: nombre, local: "id", remoto: hint, muchos: true };
  }
  const salida = FK.find(([a, , r]) => a === origen && r === nombre);
  if (salida) return { tabla: nombre, local: salida[1], remoto: "id", muchos: false };
  const entrada = FK.find(([a, , r]) => a === nombre && r === origen);
  if (entrada) return { tabla: nombre, local: "id", remoto: entrada[1], muchos: true };
  throw new ErrorAcceso(`No hay relación entre ${origen} y ${nombre}`, 400);
}

async function proyectar(db: Client, tabla: string, filas: Fila[], campos: Campo[], ctx: ContextoAcceso): Promise<Fila[]> {
  const embebidos = new Map<Campo, { r: ReturnType<typeof resolverEmbed>; porClave: Map<unknown, Fila[]> }>();
  for (const c of campos.filter((x) => x.hijos)) {
    if (!ESQUEMA[c.nombre] && !FK.some(([a, col]) => a === tabla && col === c.nombre)) throw new ErrorAcceso(`Tabla desconocida: ${c.nombre}`, 400);
    const r = resolverEmbed(tabla, c.nombre, c.hint);
    const claves = [...new Set(filas.map((f) => f[r.local]).filter((x) => x != null))] as InValue[];
    const porClave = new Map<unknown, Fila[]>();
    if (claves.length) {
      const hijos = await seleccionar(db, r.tabla, { sql: `${q(r.remoto)} IN (${claves.map(() => "?").join(",")})`, args: claves }, ctx);
      const proyectados = await proyectar(db, r.tabla, hijos, c.hijos!, ctx);
      hijos.forEach((h, i) => {
        const lista = porClave.get(h[r.remoto]) ?? [];
        lista.push(proyectados[i]);
        porClave.set(h[r.remoto], lista);
      });
    }
    embebidos.set(c, { r, porClave });
  }

  return filas.map((f) => {
    const out: Fila = {};
    for (const c of campos) {
      if (c.nombre === "*") Object.assign(out, f);
      else if (!c.hijos) {
        if (!(c.nombre in ESQUEMA[tabla])) throw new ErrorAcceso(`Columna desconocida: ${tabla}.${c.nombre}`, 400);
        out[c.alias] = f[c.nombre] ?? null;
      } else {
        const { r, porClave } = embebidos.get(c)!;
        const lista = porClave.get(f[r.local]) ?? [];
        out[c.alias] = r.muchos ? lista : lista[0] ?? null;
      }
    }
    return out;
  });
}

function cumpleInner(fila: Fila, campos: Campo[]): boolean {
  return campos.every((c) => !c.hijos || !c.inner || (Array.isArray(fila[c.alias]) ? (fila[c.alias] as Fila[]).length > 0 : fila[c.alias] != null));
}

// ---------- escritura ----------
function validarPayload(tabla: string, fila: Fila) {
  for (const k of Object.keys(fila)) {
    if (!(k in ESQUEMA[tabla])) throw new ErrorAcceso(`Columna desconocida: ${tabla}.${k}`, 400);
  }
}

function completar(tabla: string, v: Fila): Fila {
  const ahora = new Date().toISOString();
  const cols = ESQUEMA[tabla];
  return {
    ...(cols.id ? { id: crypto.randomUUID() } : {}),
    ...(cols.created_at ? { created_at: ahora } : {}),
    ...(cols.updated_at ? { updated_at: ahora } : {}),
    ...v,
  };
}

async function insertar(db: Client, tabla: string, filas: Fila[]) {
  const cols = ESQUEMA[tabla];
  await db.batch(
    filas.map((f) => {
      const nombres = Object.keys(f);
      return {
        sql: `INSERT INTO ${q(tabla)} (${nombres.map(q).join(",")}) VALUES (${nombres.map(() => "?").join(",")})`,
        args: nombres.map((c) => aSql(cols[c], f[c]) as InValue),
      };
    }),
    "write",
  );
}

async function actualizar(db: Client, tabla: string, ids: unknown[], cambios: Fila) {
  const cols = ESQUEMA[tabla];
  const datos = { ...cambios, ...(cols.updated_at && !("updated_at" in cambios) ? { updated_at: new Date().toISOString() } : {}) };
  const nombres = Object.keys(datos);
  if (!nombres.length || !ids.length) return;
  await db.execute({
    sql: `UPDATE ${q(tabla)} SET ${nombres.map((c) => `${q(c)} = ?`).join(", ")} WHERE "rowid" IN (${ids.map(() => "?").join(",")})`,
    args: [...nombres.map((c) => aSql(cols[c], datos[c]) as InValue), ...(ids as InValue[])],
  });
}

// ---------- entrada principal ----------
export async function ejecutarDescriptor(db: Client, d: Descriptor, ctx: ContextoAcceso): Promise<Resultado> {
  try {
    if (!ESQUEMA[d.tabla]) return { data: null, error: { message: `Tabla desconocida: ${d.tabla}`, code: "42P01" }, status: 404 };
    const tabla = d.tabla;
    const where = d.filtros.length ? unir(d.filtros.map((f) => filtroSql(tabla, f)), " AND ") : { sql: "1", args: [] };
    let filas: Fila[] = [];
    let total: number | undefined;

    if (d.op === "select") {
      if (d.soloCabecera || d.contar) {
        const alc = alcance(tabla, ctx);
        const cond = alc ? unir([where, alc], " AND ") : where;
        const r = await db.execute({ sql: `SELECT COUNT(*) AS n FROM ${q(tabla)} WHERE ${cond.sql}`, args: cond.args });
        if (d.soloCabecera) return { data: null, error: null, count: Number(r.rows[0].n) };
        total = Number(r.rows[0].n);
      }
      const orden = d.orden.filter((o) => !o.tablaRef);
      const orderBy = orden.length
        ? `ORDER BY ${orden.map((o) => `${columnaSql(tabla, o.col).expr} IS NULL ${o.nullsFirst ?? !o.asc ? "DESC" : "ASC"}, ${columnaSql(tabla, o.col).expr} ${o.asc ? "ASC" : "DESC"}`).join(", ")}`
        : "";
      const desde = d.desde ?? 0;
      const limite = d.hasta !== undefined ? d.hasta - desde + 1 : d.limite;
      const pag = limite !== undefined ? `LIMIT ${Math.max(0, Math.floor(limite))} OFFSET ${Math.floor(desde)}` : desde ? `LIMIT -1 OFFSET ${Math.floor(desde)}` : "";
      filas = await seleccionar(db, tabla, where, ctx, `${orderBy} ${pag}`);
    } else {
      const lista = (Array.isArray(d.payload) ? d.payload : [d.payload ?? {}]) as Fila[];
      if (d.op === "insert" || d.op === "upsert") {
        lista.forEach((f) => validarPayload(tabla, f));
        const nuevas: Fila[] = [];
        const actualizadas: Fila[] = [];
        for (const v of lista) {
          const claves = (d.conflicto ?? "id").split(",").map((x) => x.trim());
          if (d.op === "upsert" && claves.every((k) => v[k] !== undefined)) {
            const existentes = await db.execute({
              sql: `SELECT rowid AS _r, * FROM ${q(tabla)} WHERE ${claves.map((k) => `${q(k)} = ?`).join(" AND ")}`,
              args: claves.map((k) => aSql(ESQUEMA[tabla][k], v[k]) as InValue),
            });
            if (existentes.rows.length) {
              const actual = filaApp(tabla, existentes.rows[0] as unknown as Fila);
              await verificarEscritura(db, tabla, [actual, { ...actual, ...v }], ctx);
              await actualizar(db, tabla, [existentes.rows[0]._r], v);
              actualizadas.push({ ...actual, ...v });
              continue;
            }
          }
          nuevas.push(completar(tabla, v));
        }
        if (tabla === "workspaces") nuevas.forEach((w) => (w.owner_id = ctx.userId));
        await verificarEscritura(db, tabla, nuevas, ctx);
        if (nuevas.length) await insertar(db, tabla, nuevas);
        if (tabla === "workspaces" && nuevas.length) {
          // quien crea la clínica queda como dueño
          await insertar(db, "workspace_members", nuevas.map((w) => completar("workspace_members", { workspace_id: w.id, user_id: ctx.userId, role: "owner" })));
          nuevas.forEach((w) => ctx.roles.set(String(w.id), "owner"));
        }
        filas = [...actualizadas, ...nuevas];
      } else {
        const alc = alcance(tabla, ctx);
        if (!alc) throw new ErrorAcceso(`La tabla ${tabla} es de solo lectura.`);
        const cond = unir([where, alc], " AND ");
        const r = await db.execute({ sql: `SELECT rowid AS _r, * FROM ${q(tabla)} WHERE ${cond.sql}`, args: cond.args });
        const objetivo = r.rows.map((x) => ({ _r: x._r, fila: filaApp(tabla, x as unknown as Fila) }));
        if (tabla === "workspaces" || tabla === "workspace_members") {
          for (const { fila } of objetivo) {
            const ws = String(tabla === "workspaces" ? fila.id : fila.workspace_id);
            const rol = ctx.roles.get(ws);
            if (!rol || !ROLES_ADMIN.has(rol)) throw new ErrorAcceso("Solo un administrador puede hacer este cambio.");
            if (tabla === "workspace_members" && fila.role === "owner" && rol !== "owner") throw new ErrorAcceso("Solo el dueño puede modificar al dueño.");
            if (tabla === "workspaces" && d.op === "delete" && rol !== "owner") throw new ErrorAcceso("Solo el dueño puede eliminar la clínica.");
          }
        }
        const ids = objetivo.map((o) => o._r);
        if (d.op === "update") {
          const cambios = (lista[0] ?? {}) as Fila;
          validarPayload(tabla, cambios);
          if ("workspace_id" in cambios || (tabla === "workspaces" && "owner_id" in cambios) || (tabla === "profiles" && "id" in cambios))
            throw new ErrorAcceso("No se puede cambiar la clínica ni el dueño de un registro.");
          if (tabla === "profiles" && objetivo.some((o) => o.fila.id !== ctx.userId)) throw new ErrorAcceso("Solo puedes modificar tu propio perfil.");
          await actualizar(db, tabla, ids, cambios);
          filas = objetivo.map((o) => ({ ...o.fila, ...cambios }));
        } else {
          if (tabla === "profiles") throw new ErrorAcceso("Los perfiles no se eliminan desde aquí.");
          if (ids.length) await db.execute({ sql: `DELETE FROM ${q(tabla)} WHERE "rowid" IN (${ids.map(() => "?").join(",")})`, args: ids as InValue[] });
          filas = objetivo.map((o) => o.fila);
        }
      }
      if (!d.devolver) return { data: null, error: null, status: d.op === "insert" ? 201 : 200 };
    }

    const campos = parsearSelect(d.columnas);
    let datos = (await proyectar(db, tabla, filas, campos, ctx)).filter((f) => cumpleInner(f, campos));
    if (d.unico) {
      if (datos.length > 1) return { data: null, error: { message: "Se esperaba una sola fila", code: "PGRST116" }, status: 406 };
      if (!datos.length)
        return d.unico === "maybe" ? { data: null, error: null } : { data: null, error: { message: "No se encontró la fila", code: "PGRST116" }, status: 406 };
      return { data: datos[0], error: null };
    }
    return { data: datos, error: null, count: total ?? null };
  } catch (e) {
    const status = e instanceof ErrorAcceso ? e.status : 500;
    const message = e instanceof ErrorAcceso ? e.message : "Error al consultar la base de datos";
    if (!(e instanceof ErrorAcceso)) console.error("[motor-sql]", d.tabla, d.op, e);
    return { data: null, error: { message, code: String(status) }, status };
  }
}

/** Carga los roles del usuario en cada workspace. */
export async function contextoDe(db: Client, userId: string): Promise<ContextoAcceso> {
  const r = await db.execute({ sql: `SELECT "workspace_id", "role" FROM "workspace_members" WHERE "user_id" = ?`, args: [userId] });
  return { userId, roles: new Map(r.rows.map((x) => [String(x.workspace_id), String(x.role)])) };
}
