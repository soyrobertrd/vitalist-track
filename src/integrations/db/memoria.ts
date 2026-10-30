/**
 * Cliente de datos en modo mockup: misma API de consultas que usan las páginas
 * (from/select/eq/insert/update/delete/rpc/auth/storage/functions/channel),
 * pero los datos viven en memoria y se guardan en localStorage.
 * Es la capa que se sustituirá por la API sobre Turso sin tocar las páginas.
 */
import relaciones from "./relaciones.json";
import { sembrarDatos } from "./seed";
import { Consulta, parsearSelect, type Campo, type Descriptor, type Filtro, type Resultado } from "./consulta";

type Fila = Record<string, any>;
type Tablas = Record<string, Fila[]>;

const CLAVE_DB = "vt-mock-db-v1";
const CLAVE_SESION = "vt-mock-session-v1";

// ---------- almacenamiento ----------
let tablas: Tablas = cargar();

function cargar(): Tablas {
  try {
    const raw = localStorage.getItem(CLAVE_DB);
    if (raw) return JSON.parse(raw);
  } catch {
    /* sin localStorage o datos corruptos: se vuelve a sembrar */
  }
  const t = sembrarDatos();
  guardarEn(t);
  return t;
}

function guardarEn(t: Tablas) {
  try {
    localStorage.setItem(CLAVE_DB, JSON.stringify(t));
  } catch {
    /* cuota llena o modo privado: los datos siguen en memoria */
  }
}

const guardar = () => guardarEn(tablas);
const tabla = (nombre: string) => (tablas[nombre] ??= []);

/** Borra todos los datos locales y vuelve a sembrar la demo. */
export function reiniciarDatosMock() {
  tablas = sembrarDatos();
  guardar();
}

const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });

// ---------- relaciones (generadas desde el esquema) ----------
const FK = relaciones as [string, string, string][];
const fkSalida = (t: string, col: string) => FK.find(([a, c]) => a === t && c === col)?.[2];

/** Resuelve un embed tipo `pacientes(...)`, `alias:col(...)` o `tabla!hint(...)`. */
function resolverEmbed(origen: string, nombre: string, hint?: string) {
  // nombre es una columna FK de la tabla origen: muchos-a-uno
  const directa = fkSalida(origen, nombre);
  if (directa) return { tabla: directa, local: nombre, remoto: "id", muchos: false };
  if (hint) {
    if (fkSalida(origen, hint) === nombre) return { tabla: nombre, local: hint, remoto: "id", muchos: false };
    if (fkSalida(nombre, hint) === origen) return { tabla: nombre, local: "id", remoto: hint, muchos: true };
  }
  const salida = FK.find(([a, , r]) => a === origen && r === nombre);
  if (salida) return { tabla: nombre, local: salida[1], remoto: "id", muchos: false };
  const entrada = FK.find(([a, , r]) => a === nombre && r === origen);
  if (entrada) return { tabla: nombre, local: "id", remoto: entrada[1], muchos: true };
  // sin FK declarada: convención <singular>_id
  const singular = nombre.replace(/es$|s$/, "");
  return { tabla: nombre, local: `${singular}_id`, remoto: "id", muchos: false };
}

// ---------- proyección ----------
function proyectar(origen: string, fila: Fila, campos: Campo[]): Fila | null {
  const out: Fila = {};
  for (const c of campos) {
    if (c.nombre === "*") {
      Object.assign(out, fila);
      continue;
    }
    if (!c.hijos) {
      out[c.alias] = fila[c.nombre] ?? null;
      continue;
    }
    const r = resolverEmbed(origen, c.nombre, c.hint);
    const candidatas = tabla(r.tabla).filter((x) => x[r.remoto] != null && x[r.remoto] === fila[r.local]);
    const proyectadas = candidatas.map((x) => proyectar(r.tabla, x, c.hijos!)).filter(Boolean) as Fila[];
    const valor = r.muchos ? proyectadas : proyectadas[0] ?? null;
    if (c.inner && (r.muchos ? proyectadas.length === 0 : !valor)) return null;
    out[c.alias] = valor;
  }
  return out;
}

// ---------- filtros ----------
type Pred = (f: Fila) => boolean;
const comoTexto = (v: any) => (v == null ? "" : String(v));
const patron = (p: string, i: boolean) =>
  new RegExp("^" + p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".") + "$", i ? "i" : "");

function predicado(f: Filtro): Pred {
  if (f.t !== "op") {
    const hijos = f.hijos.map(predicado);
    return f.t === "and" ? (x) => hijos.every((h) => h(x)) : (x) => hijos.some((h) => h(x));
  }
  const { col, op, val } = f;
  const leer = (x: Fila) => {
    const [base, ...ruta] = col.split(/->>?/);
    return ruta.reduce((acc, k) => acc?.[k], x[base]);
  };
  let p: Pred;
  switch (op) {
    case "eq": p = (x) => leer(x) == val; break; // == para comparar "1" con 1, igual que la API
    case "neq": p = (x) => leer(x) != val; break;
    case "gt": p = (x) => leer(x) > (val as any); break;
    case "gte": p = (x) => leer(x) >= (val as any); break;
    case "lt": p = (x) => leer(x) < (val as any); break;
    case "lte": p = (x) => leer(x) <= (val as any); break;
    case "like": p = (x) => patron(String(val), false).test(comoTexto(leer(x))); break;
    case "ilike": p = (x) => patron(String(val), true).test(comoTexto(leer(x))); break;
    case "is": p = (x) => (val === null ? leer(x) == null : leer(x) === val); break;
    case "in": p = (x) => (val as unknown[]).some((v) => v == leer(x)); break;
    case "contains":
      p = (x) => {
        const v = leer(x);
        if (Array.isArray(val)) return Array.isArray(v) && val.every((e) => v.includes(e));
        if (val && typeof val === "object") return v && Object.entries(val).every(([k, e]) => v[k] === e);
        return comoTexto(v).includes(comoTexto(val));
      };
      break;
    case "overlaps": p = (x) => Array.isArray(leer(x)) && (val as unknown[]).some((e) => leer(x).includes(e)); break;
    default: p = () => true;
  }
  return f.neg ? (x) => !p(x) : p;
}

// ---------- ejecución de consultas ----------
function insertar(d: Descriptor, upsert: boolean): Fila[] {
  const lista = (Array.isArray(d.payload) ? d.payload : [d.payload]) as Fila[];
  const t = tabla(d.tabla);
  const claves = (d.conflicto ?? "id").split(",").map((x) => x.trim());
  const ahora = new Date().toISOString();
  return lista.map((v) => {
    if (upsert) {
      const existente = t.find((f) => claves.every((k) => v[k] !== undefined && f[k] == v[k]));
      if (existente) return Object.assign(existente, v, { updated_at: ahora });
    }
    const fila = { id: uuid(), created_at: ahora, updated_at: ahora, ...v };
    t.push(fila);
    return fila;
  });
}

export async function ejecutarEnMemoria(d: Descriptor): Promise<Resultado> {
  try {
    const preds = d.filtros.map(predicado);
    const filtradas = () => tabla(d.tabla).filter((f) => preds.every((p) => p(f)));
    let filas: Fila[];
    switch (d.op) {
      case "insert":
      case "upsert":
        filas = insertar(d, d.op === "upsert");
        guardar();
        break;
      case "update": {
        const ahora = new Date().toISOString();
        filas = filtradas();
        filas.forEach((f) => Object.assign(f, d.payload, "updated_at" in f ? { updated_at: ahora } : {}));
        guardar();
        break;
      }
      case "delete": {
        filas = filtradas();
        const fuera = new Set(filas);
        tablas[d.tabla] = tabla(d.tabla).filter((f) => !fuera.has(f));
        guardar();
        break;
      }
      default:
        filas = filtradas();
    }
    if (d.op !== "select" && !d.devolver) return { data: null, error: null, status: 201 };

    for (const o of [...d.orden].reverse()) {
      if (o.tablaRef) continue;
      filas = [...filas].sort((a, b) => {
        const x = a[o.col], y = b[o.col];
        if (x == null && y == null) return 0;
        if (x == null) return (o.nullsFirst ?? !o.asc) ? -1 : 1;
        if (y == null) return (o.nullsFirst ?? !o.asc) ? 1 : -1;
        return (x < y ? -1 : x > y ? 1 : 0) * (o.asc ? 1 : -1);
      });
    }
    const total = filas.length;
    if (d.soloCabecera) return { data: null, error: null, count: total };
    const campos = parsearSelect(d.columnas);
    let datos = filas.map((f) => proyectar(d.tabla, f, campos)).filter(Boolean) as Fila[];
    if (d.desde !== undefined) datos = datos.slice(d.desde, (d.hasta ?? datos.length - 1) + 1);
    if (d.limite !== undefined) datos = datos.slice(0, d.limite);
    datos = JSON.parse(JSON.stringify(datos)); // copia: las páginas no deben mutar el almacén

    if (d.unico) {
      if (datos.length > 1) return { data: null, error: { message: "Se esperaba una sola fila", code: "PGRST116" } };
      if (!datos.length)
        return d.unico === "maybe" ? { data: null, error: null } : { data: null, error: { message: "No se encontró la fila", code: "PGRST116" } };
      return { data: datos[0], error: null };
    }
    return { data: datos, error: null, count: d.contar ? total : null };
  } catch (e: any) {
    return { data: null, error: { message: e?.message ?? String(e) } };
  }
}

// ---------- auth ----------
interface Usuario {
  id: string;
  email: string;
  user_metadata: Record<string, any>;
  app_metadata: Record<string, any>;
  aud: string;
  created_at: string;
}
type Oyente = (evento: string, sesion: any) => void;
const oyentes = new Set<Oyente>();

function leerSesion(): any {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION) ?? "null");
  } catch {
    return null;
  }
}
function escribirSesion(s: any, evento: string) {
  try {
    if (s) localStorage.setItem(CLAVE_SESION, JSON.stringify(s));
    else localStorage.removeItem(CLAVE_SESION);
  } catch {
    /* sin localStorage */
  }
  oyentes.forEach((o) => o(evento, s));
}
function sesionDe(u: Usuario) {
  return { access_token: "mock-" + u.id, refresh_token: "mock", token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: u };
}
function usuarioDePerfil(p: Fila): Usuario {
  return {
    id: p.id,
    email: p.email,
    user_metadata: { nombre: p.nombre, apellido: p.apellido },
    app_metadata: {},
    aud: "authenticated",
    created_at: p.created_at ?? new Date().toISOString(),
  };
}

const auth = {
  async getSession() {
    return { data: { session: leerSesion() }, error: null };
  },
  async getUser(_jwt?: string) {
    return { data: { user: leerSesion()?.user ?? null }, error: null };
  },
  onAuthStateChange(cb: Oyente) {
    oyentes.add(cb);
    setTimeout(() => cb("INITIAL_SESSION", leerSesion()), 0);
    return { data: { subscription: { unsubscribe: () => void oyentes.delete(cb) } } };
  },
  // shortcut: modo mockup acepta cualquier contraseña; la autenticación real llega con la API de Turso.
  async signInWithPassword({ email }: { email: string; password: string }) {
    const perfil = tabla("profiles").find((p) => p.email?.toLowerCase() === email.toLowerCase());
    if (!perfil) return { data: { user: null, session: null }, error: { message: "Invalid login credentials" } };
    const s = sesionDe(usuarioDePerfil(perfil));
    escribirSesion(s, "SIGNED_IN");
    return { data: { user: s.user, session: s }, error: null };
  },
  async signUp({ email, options }: { email: string; password: string; options?: { data?: Record<string, any>; emailRedirectTo?: string } }) {
    if (tabla("profiles").some((p) => p.email?.toLowerCase() === email.toLowerCase()))
      return { data: { user: null, session: null }, error: { message: "User already registered" } };
    const perfil = { id: uuid(), email, nombre: options?.data?.nombre ?? "", apellido: options?.data?.apellido ?? "", created_at: new Date().toISOString() };
    tabla("profiles").push(perfil);
    guardar();
    const s = sesionDe(usuarioDePerfil(perfil));
    escribirSesion(s, "SIGNED_IN");
    return { data: { user: s.user, session: s }, error: null };
  },
  async signOut(_o?: any) {
    escribirSesion(null, "SIGNED_OUT");
    return { error: null };
  },
  async updateUser(attrs: { password?: string; email?: string; data?: Record<string, any> }) {
    const s = leerSesion();
    if (!s) return { data: { user: null }, error: { message: "No hay sesión" } };
    if (attrs.email) s.user.email = attrs.email;
    if (attrs.data) s.user.user_metadata = { ...s.user.user_metadata, ...attrs.data };
    escribirSesion(s, "USER_UPDATED");
    return { data: { user: s.user }, error: null };
  },
  async resetPasswordForEmail(_email: string, _o?: any) {
    return { data: {}, error: null };
  },
  async refreshSession() {
    return { data: { session: leerSesion(), user: leerSesion()?.user ?? null }, error: null };
  },
  mfa: {
    async listFactors() {
      return { data: { all: [], totp: [] }, error: null };
    },
    async getAuthenticatorAssuranceLevel() {
      return { data: { currentLevel: "aal1", nextLevel: "aal1" }, error: null };
    },
    async enroll(_o?: any) {
      return { data: null, error: { message: "MFA no disponible en modo mockup" } };
    },
    async challenge(_o?: any) {
      return { data: null, error: { message: "MFA no disponible en modo mockup" } };
    },
    async verify(_o?: any) {
      return { data: null, error: { message: "MFA no disponible en modo mockup" } };
    },
    async unenroll(_o?: any) {
      return { data: null, error: null };
    },
  },
};

// ---------- rpc ----------
const MODULOS = ["pacientes", "profesionales", "usuarios"];
const rpcs: Record<string, (args: any) => any> = {
  get_user_module_permissions: () =>
    MODULOS.map((m) => ({ module_name: m, can_view: true, can_create: true, can_edit: true, can_delete: true })),
  registrar_acceso_ficha: () => null,
};

async function rpc(nombre: string, args?: any): Promise<Resultado> {
  const fn = rpcs[nombre];
  if (!fn) return { data: null, error: { message: `Función "${nombre}" no disponible en modo mockup` } };
  try {
    return { data: fn(args ?? {}), error: null };
  } catch (e: any) {
    return { data: null, error: { message: e?.message ?? String(e) } };
  }
}

// ---------- storage (archivos como data URL en memoria) ----------
const archivos = new Map<string, string>();
const storage = {
  from(bucket: string) {
    const clave = (p: string) => `${bucket}/${p}`;
    return {
      async upload(path: string, file: Blob, _o?: unknown) {
        const url = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result));
          r.onerror = () => rej(r.error);
          r.readAsDataURL(file);
        });
        archivos.set(clave(path), url);
        return { data: { path }, error: null };
      },
      async remove(paths: string[]) {
        paths.forEach((p) => archivos.delete(clave(p)));
        return { data: paths.map((name) => ({ name })), error: null };
      },
      async createSignedUrl(path: string, _exp: number, _o?: unknown) {
        const url = archivos.get(clave(path));
        return url ? { data: { signedUrl: url }, error: null } : { data: null, error: { message: "Archivo no encontrado" } };
      },
      getPublicUrl(path: string) {
        return { data: { publicUrl: archivos.get(clave(path)) ?? "" } };
      },
      async download(path: string) {
        const url = archivos.get(clave(path));
        if (!url) return { data: null, error: { message: "Archivo no encontrado" } };
        return { data: await (await fetch(url)).blob(), error: null };
      },
      async list(_prefix?: string) {
        return { data: [...archivos.keys()].filter((k) => k.startsWith(bucket + "/")).map((k) => ({ name: k.slice(bucket.length + 1) })), error: null };
      },
    };
  },
};

// ---------- funciones de servidor y realtime ----------
const functions = {
  async invoke(nombre: string, _o?: any) {
    return { data: null, error: { message: `"${nombre}" requiere el backend; no está disponible en modo mockup` } };
  },
};

function channel(_nombre: string) {
  const canal = {
    on: (..._a: any[]) => canal,
    subscribe: (cb?: (s: string) => void) => {
      cb?.("SUBSCRIBED");
      return canal;
    },
    unsubscribe: async () => "ok",
    send: async (_m: any) => "ok",
  };
  return canal;
}

export const clienteMemoria = {
  from: (t: string) => new Consulta(t, ejecutarEnMemoria),
  rpc,
  auth,
  storage,
  functions,
  channel,
  removeChannel: async (_c: any) => "ok",
  removeAllChannels: async () => [],
};
