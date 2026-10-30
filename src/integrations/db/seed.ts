/** Datos iniciales del modo mockup, a partir del seed canónico de la demo. */
import { DEMO_CITAS, DEMO_DOCTORES, DEMO_PACIENTES, DEMO_PLANES, DEMO_WORKSPACES } from "@/lib/mock-live-seed";

export const USUARIO_DEMO = { id: "usr-admin-demo", email: "demo@vitalisttrack.com" };

export function sembrarDatos(): Record<string, Record<string, any>[]> {
  const ahora = new Date().toISOString();
  const base = { created_at: ahora, updated_at: ahora };

  const workspaces = DEMO_WORKSPACES.map(({ role: _r, vertical: _v, ...w }) => ({ ...base, ...w }));
  return {
    profiles: [{ ...base, ...USUARIO_DEMO, nombre: "Admin", apellido: "Demo", cedula: "", rol: "admin", activo: true, approved: true }],
    planes: DEMO_PLANES.map((p) => ({ ...base, ...p })),
    workspaces,
    workspace_members: workspaces.map((w) => ({ ...base, id: `wm-${w.id}`, workspace_id: w.id, user_id: USUARIO_DEMO.id, role: "owner" })),
    workspace_verticales: DEMO_WORKSPACES.map((w) => ({ ...base, id: `wv-${w.id}`, workspace_id: w.id, vertical: w.vertical, activo: true })),
    personal_salud: DEMO_DOCTORES.map((d) => ({ ...base, ...d, activo: true })),
    pacientes: DEMO_PACIENTES.map((p) => ({ ...base, ...p })),
    control_visitas: DEMO_CITAS.map(({ pacientes: _p, personal_salud: _s, ...c }) => ({ ...base, ...c })),
  };
}
