import { desc } from 'drizzle-orm';
import type { TenantDb } from '../db/connection-manager';
import { auditLogs } from '../db/tenant-schema';

export interface RecordAuditInput {
  actorId: string;
  action: 'create' | 'update' | 'delete' | 'export' | 'access';
  resourceType: string;
  resourceId: string;
  ipAddress?: string | null;
  payload?: unknown;
}

export class AuditService {
  constructor(private db: TenantDb) {}

  /**
   * Registrar evento en bitácora de auditoría inmutable
   */
  async log(entry: RecordAuditInput) {
    const id = `aud_${crypto.randomUUID()}`;
    await this.db.insert(auditLogs).values({
      id,
      actorId: entry.actorId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      ipAddress: entry.ipAddress ?? null,
      payloadJson: entry.payload ? JSON.stringify(entry.payload) : null,
      timestamp: new Date().toISOString(),
    });
    return id;
  }

  /**
   * Listar eventos recientes de auditoría
   */
  async list(limit = 100) {
    return this.db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
  }
}
