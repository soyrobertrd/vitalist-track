import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import * as controlPlaneSchema from './control-plane-schema';
import * as tenantSchema from './tenant-schema';
import { eq } from 'drizzle-orm';
import { AppError } from '../errors/problem-details';
import { decryptTenantToken } from '../lib/crypto';

/**
 * TURSO CONNECTION MANAGER & LRU CLIENT POOL
 * High-performance, serverless-friendly connection manager.
 * Caches active LibSQL client instances per tenant.
 */

export type ControlPlaneDb = LibSQLDatabase<typeof controlPlaneSchema>;
export type TenantDb = LibSQLDatabase<typeof tenantSchema>;

interface CachedTenantConnection {
  client: Client;
  db: TenantDb;
  lastUsed: number;
}

const MAX_CACHED_CONNECTIONS = 50;
const CONNECTION_TTL_MS = 1000 * 60 * 15; // 15 minutes idle timeout
const tenantPool = new Map<string, CachedTenantConnection>();

let controlPlaneClient: Client | null = null;
let controlPlaneDb: ControlPlaneDb | null = null;

/**
 * Returns the central Control Plane database instance.
 */
export function getControlPlaneDb(): ControlPlaneDb {
  if (controlPlaneDb) {
    return controlPlaneDb;
  }

  const url = process.env.TURSO_CONTROL_PLANE_URL || process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_CONTROL_PLANE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new AppError(
      'MissingConfiguration',
      'TURSO_CONTROL_PLANE_URL no está configurada.',
      500,
      'https://vitalisttrack.com/errors/missing-config'
    );
  }

  controlPlaneClient = createClient({
    url,
    authToken,
  });

  controlPlaneDb = drizzle(controlPlaneClient, { schema: controlPlaneSchema });
  return controlPlaneDb;
}

/**
 * Evicts expired or LRU connections when pool reaches limit.
 */
function evictOldConnections() {
  const now = Date.now();
  for (const [clinicId, conn] of tenantPool.entries()) {
    if (now - conn.lastUsed > CONNECTION_TTL_MS) {
      conn.client.close();
      tenantPool.delete(clinicId);
    }
  }

  if (tenantPool.size >= MAX_CACHED_CONNECTIONS) {
    // Evict oldest used
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [clinicId, conn] of tenantPool.entries()) {
      if (conn.lastUsed < oldestTime) {
        oldestTime = conn.lastUsed;
        oldestKey = clinicId;
      }
    }

    if (oldestKey) {
      const conn = tenantPool.get(oldestKey);
      conn?.client.close();
      tenantPool.delete(oldestKey);
    }
  }
}

/**
 * Retrieves the dedicated Drizzle LibSQL database for a specific clinic.
 * Connects via database-per-tenant isolation.
 */
export async function getTenantDb(clinicId: string): Promise<TenantDb> {
  if (!clinicId) {
    throw new AppError(
      'InvalidTenant',
      'El identificador de clínica (clinicId) es obligatorio.',
      400,
      'https://vitalisttrack.com/errors/invalid-tenant'
    );
  }

  // 1. Check in-memory connection pool
  const cached = tenantPool.get(clinicId);
  if (cached) {
    cached.lastUsed = Date.now();
    return cached.db;
  }

  // 2. Fetch clinic credentials from Control Plane
  const cpDb = getControlPlaneDb();
  const dbRecords = await cpDb
    .select()
    .from(controlPlaneSchema.clinicDatabases)
    .where(eq(controlPlaneSchema.clinicDatabases.clinicId, clinicId))
    .limit(1);

  const dbConfig = dbRecords[0];

  if (!dbConfig) {
    throw new AppError(
      'TenantDatabaseNotFound',
      `No se encontró base de datos provisionada para la clínica ${clinicId}.`,
      404,
      'https://vitalisttrack.com/errors/tenant-db-not-found'
    );
  }

  if (dbConfig.status !== 'active') {
    throw new AppError(
      'TenantDatabaseSuspended',
      `La base de datos de la clínica se encuentra en estado: ${dbConfig.status}.`,
      403,
      'https://vitalisttrack.com/errors/tenant-db-suspended'
    );
  }

  // 3. Evict if pool is saturated
  evictOldConnections();

  // 4. Create new client with decrypted token (S2)
  const client = createClient({
    url: dbConfig.tursoDbUrl,
    // Un archivo local (file:) no lleva token; cualquier BD remota exige token cifrado.
    authToken: dbConfig.tursoDbUrl.startsWith('file:') ? undefined : decryptTenantToken(dbConfig.tursoAuthTokenEncrypted),
  });

  const db = drizzle(client, { schema: tenantSchema });

  tenantPool.set(clinicId, {
    client,
    db,
    lastUsed: Date.now(),
  });

  return db;
}
