import type { Config } from 'drizzle-kit';

export default {
  schema: './src/server/db/control-plane-schema.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  driver: 'turso',
  dbCredentials: {
    url: process.env.TURSO_CONTROL_PLANE_URL || 'file:local-control-plane.db',
    authToken: process.env.TURSO_CONTROL_PLANE_AUTH_TOKEN,
  },
} satisfies Config;
