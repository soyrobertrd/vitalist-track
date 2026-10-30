/**
 * Constructor de consultas compartido por el cliente y el servidor.
 * Las páginas encadenan .from().select().eq()...; eso produce un Descriptor serializable
 * que ejecuta el motor en memoria (mockup) o la API sobre Turso (/api/v1/db).
 */

export type Operacion = "select" | "insert" | "update" | "upsert" | "delete";
export type OpFiltro =
  | "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "is" | "in" | "contains" | "overlaps";

export type Filtro =
  | { t: "op"; col: string; op: OpFiltro; val: unknown; neg?: boolean }
  | { t: "and" | "or"; hijos: Filtro[] };

export interface Orden {
  col: string;
  asc: boolean;
  nullsFirst?: boolean;
  tablaRef?: string;
}

export interface Descriptor {
  tabla: string;
  op: Operacion;
  columnas: string;
  devolver: boolean;
  filtros: Filtro[];
  orden: Orden[];
  limite?: number;
  desde?: number;
  hasta?: number;
  unico?: "single" | "maybe";
  payload?: unknown;
  conflicto?: string;
  contar?: boolean;
  soloCabecera?: boolean;
}

export interface ErrorDb {
  message: string;
  code?: string;
}
export interface Resultado<T = any> {
  data: T;
  error: ErrorDb | null;
  count?: number | null;
  status?: number;
}

export type Ejecutor = (d: Descriptor) => Promise<Resultado>;

// ---------- parser de select ----------
export interface Campo {
  alias: string;
  nombre: string;
  hint?: string;
  inner?: boolean;
  hijos?: Campo[];
}

/** Divide por comas de primer nivel (ignora las que están dentro de paréntesis). */
export function partir(s: string): string[] {
  const out: string[] = [];
  let nivel = 0;
  let actual = "";
  for (const ch of s) {
    if (ch === "(") nivel++;
    if (ch === ")") nivel--;
    if (ch === "," && nivel === 0) {
      out.push(actual);
      actual = "";
    } else actual += ch;
  }
  if (actual.trim()) out.push(actual);
  return out.map((x) => x.trim()).filter(Boolean);
}

export function parsearSelect(s: string): Campo[] {
  return partir(s.replace(/\s+/g, " ")).map((parte) => {
    const m = parte.match(/^(?:(\w+):)?\s*([\w*]+)(?:::\w+)?(?:!(\w+))?(?:!(inner|left))?\s*(?:\(([\s\S]*)\))?$/);
    if (!m) return { alias: parte, nombre: parte };
    const [, alias, nombre, hint, modo, sub] = m;
    return {
      alias: alias ?? nombre,
      nombre,
      hint: hint === "inner" || hint === "left" ? undefined : hint,
      inner: modo === "inner" || hint === "inner",
      hijos: sub !== undefined ? parsearSelect(sub || "*") : undefined,
    };
  });
}

// ---------- parser de .or("a.eq.1,b.ilike.%x%,and(c.eq.2,d.is.null)") ----------
export function valorTexto(raw: string): unknown {
  if (raw === "null") return null;
  if (raw === "true") return true;
  if (raw === "false") return false;
  return raw;
}

const listaIn = (raw: string) =>
  raw.replace(/^\(|\)$/g, "").split(",").map((x) => x.trim().replace(/^"|"$/g, ""));

const OPS_TEXTO: Record<string, OpFiltro> = { cs: "contains", ov: "overlaps" };

export function parsearLogico(expr: string, tipo: "and" | "or" = "or"): Filtro {
  const hijos = partir(expr).map((p): Filtro => {
    const grupo = p.match(/^(and|or)\(([\s\S]*)\)$/);
    if (grupo) return parsearLogico(grupo[2], grupo[1] as "and" | "or");
    const m = p.match(/^([\w>-]+)\.(not\.)?(\w+)\.([\s\S]*)$/);
    if (!m) throw new Error(`Filtro no válido: ${p}`);
    const [, col, neg, opRaw, raw] = m;
    const op = (OPS_TEXTO[opRaw] ?? opRaw) as OpFiltro;
    return { t: "op", col, op, val: op === "in" ? listaIn(raw) : valorTexto(raw), neg: !!neg };
  });
  return { t: tipo, hijos };
}

// ---------- builder ----------
export class Consulta implements PromiseLike<Resultado> {
  private d: Descriptor;

  constructor(tabla: string, private ejecutor: Ejecutor) {
    this.d = { tabla, op: "select", columnas: "*", devolver: false, filtros: [], orden: [] };
  }

  select(cols = "*", opts?: { count?: string; head?: boolean }) {
    if (this.d.op !== "select") this.d.devolver = true;
    this.d.columnas = cols;
    if (opts?.count) this.d.contar = true;
    if (opts?.head) this.d.soloCabecera = true;
    return this;
  }
  insert(v: unknown, _o?: unknown) {
    this.d.op = "insert";
    this.d.payload = v;
    return this;
  }
  upsert(v: unknown, o?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.d.op = "upsert";
    this.d.payload = v;
    this.d.conflicto = o?.onConflict;
    return this;
  }
  update(v: unknown, _o?: unknown) {
    this.d.op = "update";
    this.d.payload = v;
    return this;
  }
  delete(_o?: unknown) {
    this.d.op = "delete";
    return this;
  }

  private f(col: string, op: OpFiltro, val: unknown, neg = false) {
    this.d.filtros.push({ t: "op", col, op, val, neg });
    return this;
  }
  eq(c: string, v: unknown) { return this.f(c, "eq", v); }
  neq(c: string, v: unknown) { return this.f(c, "neq", v); }
  gt(c: string, v: unknown) { return this.f(c, "gt", v); }
  gte(c: string, v: unknown) { return this.f(c, "gte", v); }
  lt(c: string, v: unknown) { return this.f(c, "lt", v); }
  lte(c: string, v: unknown) { return this.f(c, "lte", v); }
  like(c: string, v: string) { return this.f(c, "like", v); }
  ilike(c: string, v: string) { return this.f(c, "ilike", v); }
  is(c: string, v: unknown) { return this.f(c, "is", v); }
  in(c: string, v: readonly unknown[]) { return this.f(c, "in", [...v]); }
  contains(c: string, v: unknown) { return this.f(c, "contains", v); }
  overlaps(c: string, v: unknown) { return this.f(c, "overlaps", v); }
  match(o: Record<string, unknown>) {
    Object.entries(o).forEach(([c, v]) => this.eq(c, v));
    return this;
  }
  not(c: string, op: string, v: unknown) {
    const operador = (OPS_TEXTO[op] ?? op) as OpFiltro;
    const val = operador === "in" && typeof v === "string" ? listaIn(v) : typeof v === "string" ? valorTexto(v) : v;
    return this.f(c, operador, val, true);
  }
  filter(c: string, op: string, v: unknown) {
    const operador = (OPS_TEXTO[op] ?? op) as OpFiltro;
    const val = operador === "in" && typeof v === "string" ? listaIn(v) : typeof v === "string" ? valorTexto(v) : v;
    return this.f(c, operador, val);
  }
  or(expr: string, _o?: unknown) {
    this.d.filtros.push(parsearLogico(expr, "or"));
    return this;
  }
  textSearch(c: string, q: string, _o?: unknown) { return this.f(c, "ilike", `%${q}%`); }
  order(col: string, o?: { ascending?: boolean; nullsFirst?: boolean; foreignTable?: string; referencedTable?: string }) {
    this.d.orden.push({ col, asc: o?.ascending !== false, nullsFirst: o?.nullsFirst, tablaRef: o?.foreignTable ?? o?.referencedTable });
    return this;
  }
  limit(n: number, _o?: unknown) {
    this.d.limite = n;
    return this;
  }
  range(a: number, b: number) {
    this.d.desde = a;
    this.d.hasta = b;
    return this;
  }
  single() {
    this.d.unico = "single";
    return this;
  }
  maybeSingle() {
    this.d.unico = "maybe";
    return this;
  }
  abortSignal(_s: AbortSignal) { return this; }
  returns<_T>() { return this; }
  throwOnError() { return this; }

  then<A = Resultado, B = never>(
    ok?: ((v: Resultado) => A | PromiseLike<A>) | null,
    err?: ((e: unknown) => B | PromiseLike<B>) | null,
  ): PromiseLike<A | B> {
    return this.ejecutor(this.d).then(ok, err);
  }
}
