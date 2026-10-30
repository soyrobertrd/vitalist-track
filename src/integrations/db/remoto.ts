/**
 * Cliente de datos contra la API propia sobre Turso (/api/v1/db y /api/v1/auth/*).
 * La sesión va en una cookie httpOnly: el navegador nunca ve el token.
 */
import { Consulta, type Descriptor, type Resultado } from "./consulta";

const BASE = "/api/v1";

async function llamar(ruta: string, init?: RequestInit): Promise<any> {
  try {
    const r = await fetch(`${BASE}${ruta}`, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    return await r.json().catch(() => ({ error: { message: `Error ${r.status}` } }));
  } catch {
    return { error: { message: "No se pudo conectar con el servidor" } };
  }
}

const ejecutarRemoto = (d: Descriptor): Promise<Resultado> =>
  llamar("/db", { method: "POST", body: JSON.stringify(d) }).then((r) => ({
    data: r.data ?? null,
    error: r.error ?? null,
    count: r.count ?? null,
  }));

// ---------- auth ----------
type Oyente = (evento: string, sesion: any) => void;
const oyentes = new Set<Oyente>();
let usuarioActual: any = undefined; // undefined = aún no consultado

const sesionDe = (user: any) => (user ? { access_token: "cookie", token_type: "bearer", user } : null);
function emitir(evento: string, user: any) {
  usuarioActual = user;
  oyentes.forEach((o) => o(evento, sesionDe(user)));
}
async function cargarUsuario() {
  if (usuarioActual === undefined) usuarioActual = (await llamar("/auth/session")).user ?? null;
  return usuarioActual;
}

const auth = {
  async getSession() {
    return { data: { session: sesionDe(await cargarUsuario()) }, error: null };
  },
  async getUser(_jwt?: string) {
    return { data: { user: await cargarUsuario() }, error: null };
  },
  onAuthStateChange(cb: Oyente) {
    oyentes.add(cb);
    cargarUsuario().then((u) => cb("INITIAL_SESSION", sesionDe(u)));
    return { data: { subscription: { unsubscribe: () => void oyentes.delete(cb) } } };
  },
  async signInWithPassword(cred: { email: string; password: string }) {
    const r = await llamar("/auth/login", { method: "POST", body: JSON.stringify(cred) });
    if (r.error) return { data: { user: null, session: null }, error: r.error };
    emitir("SIGNED_IN", r.user);
    return { data: { user: r.user, session: sesionDe(r.user) }, error: null };
  },
  async signUp({ email, password, options }: { email: string; password: string; options?: { data?: Record<string, unknown> } }) {
    const r = await llamar("/auth/signup", { method: "POST", body: JSON.stringify({ email, password, data: options?.data }) });
    if (r.error) return { data: { user: null, session: null }, error: r.error };
    emitir("SIGNED_IN", r.user);
    return { data: { user: r.user, session: sesionDe(r.user) }, error: null };
  },
  async signOut(_o?: unknown) {
    await llamar("/auth/logout", { method: "POST" });
    emitir("SIGNED_OUT", null);
    return { error: null };
  },
  async updateUser(attrs: { password?: string }) {
    if (!attrs.password) return { data: { user: await cargarUsuario() }, error: null };
    const r = await llamar("/auth/password", { method: "POST", body: JSON.stringify({ password: attrs.password }) });
    if (r.error) return { data: { user: null }, error: r.error };
    emitir("USER_UPDATED", r.user);
    return { data: { user: r.user }, error: null };
  },
  async resetPasswordForEmail(_email: string, _o?: unknown) {
    return { data: null, error: { message: "La recuperación por correo aún no está disponible; pide al administrador una clave nueva." } };
  },
  async refreshSession() {
    const user = await cargarUsuario();
    return { data: { session: sesionDe(user), user }, error: null };
  },
  mfa: {
    async listFactors() { return { data: { all: [], totp: [] }, error: null }; },
    async getAuthenticatorAssuranceLevel() { return { data: { currentLevel: "aal1", nextLevel: "aal1" }, error: null }; },
    async enroll(_o?: unknown) { return { data: null, error: { message: "La verificación en dos pasos aún no está disponible" } }; },
    async challenge(_o?: unknown) { return { data: null, error: { message: "La verificación en dos pasos aún no está disponible" } }; },
    async verify(_o?: unknown) { return { data: null, error: { message: "La verificación en dos pasos aún no está disponible" } }; },
    async unenroll(_o?: unknown) { return { data: null, error: null }; },
  },
};

const pendiente = (que: string) => ({ data: null, error: { message: `${que} aún no está migrado a Turso` } });

export const clienteRemoto = {
  from: (t: string) => new Consulta(t, ejecutarRemoto),
  auth,
  rpc: async (nombre: string, _args?: unknown) => pendiente(`La función "${nombre}"`),
  functions: { invoke: async (nombre: string, _o?: unknown) => pendiente(`"${nombre}"`) },
  storage: {
    from: (_b: string) => ({
      upload: async (..._a: unknown[]) => pendiente("El almacenamiento de archivos"),
      remove: async (..._a: unknown[]) => pendiente("El almacenamiento de archivos"),
      createSignedUrl: async (..._a: unknown[]) => pendiente("El almacenamiento de archivos"),
      download: async (..._a: unknown[]) => pendiente("El almacenamiento de archivos"),
      list: async (..._a: unknown[]) => pendiente("El almacenamiento de archivos"),
      getPublicUrl: (_p: string) => ({ data: { publicUrl: "" } }),
    }),
  },
  channel: (_n: string) => {
    const canal = { on: (..._a: unknown[]) => canal, subscribe: (cb?: (s: string) => void) => (cb?.("SUBSCRIBED"), canal), unsubscribe: async () => "ok" };
    return canal;
  },
  removeChannel: async (_c: unknown) => "ok",
  removeAllChannels: async () => [],
};
