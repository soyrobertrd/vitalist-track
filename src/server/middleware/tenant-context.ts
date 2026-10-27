import { getTenantDb, type TenantDb } from '../db/connection-manager';
import { AppError } from '../errors/problem-details';

export interface TenantContext {
  clinicId: string;
  db: TenantDb;
}

/**
 * Resolves the tenant context from the incoming request.
 * Enforces strict multi-tenant boundary checks (Fail-Closed).
 */
export async function resolveTenantContext(req: Request): Promise<TenantContext> {
  // S1 (Fail-Closed): aún no hay validación de sesión (Better Auth, Fase 1), así que la API rechaza todo.
  // Solo en local se puede abrir con ALLOW_INSECURE_DEV_API=1; nunca en producción.
  const devBypass =
    process.env.ALLOW_INSECURE_DEV_API === '1' && process.env.NODE_ENV !== 'production' && !process.env.VERCEL;
  if (!devBypass) {
    throw new AppError(
      'Unauthorized',
      'Se requiere una sesión autenticada válida para acceder a la API.',
      401,
      'https://vitalisttrack.com/errors/unauthorized'
    );
  }

  const clinicId = req.headers.get('x-clinic-id');

  if (!clinicId) {
    throw new AppError(
      'MissingTenantHeader',
      'La cabecera x-clinic-id es obligatoria para acceder a los recursos de la clínica.',
      400,
      'https://vitalisttrack.com/errors/missing-tenant-id'
    );
  }

  // Obtain dedicated Turso client for this specific clinic
  const db = await getTenantDb(clinicId);

  return {
    clinicId,
    db,
  };
}
