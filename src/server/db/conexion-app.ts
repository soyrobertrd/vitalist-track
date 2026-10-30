import { createClient, type Client } from "@libsql/client";

/** URL de la base única de la app: la de Vercel (TURSO_DATABASE_URL) o un archivo local en desarrollo. */
export function configTurso() {
  return {
    url: process.env.TURSO_DATABASE_URL || process.env.TURSO_CONTROL_PLANE_URL || "file:local-app.db",
    authToken: process.env.TURSO_AUTH_TOKEN || process.env.TURSO_CONTROL_PLANE_AUTH_TOKEN,
  };
}

let cliente: Client | null = null;
export function getAppDb(): Client {
  return (cliente ??= createClient(configTurso()));
}
