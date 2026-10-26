import { getControlPlaneDb } from '../../src/server/db/connection-manager';
import { sql } from 'drizzle-orm';
import { createProblemResponse } from '../../src/server/errors/problem-details';

export async function GET(req: Request) {
  const startTime = Date.now();

  try {
    const cpDb = getControlPlaneDb();
    await cpDb.run(sql`SELECT 1`);
    const latencyMs = Date.now() - startTime;

    return Response.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'turso-libsql',
        latencyMs,
        version: '2.1.0',
      },
      { status: 200 }
    );
  } catch (error) {
    const { status, body } = createProblemResponse(error, req.url);
    return Response.json(
      {
        status: 'unhealthy',
        latencyMs: Date.now() - startTime,
        error: body,
      },
      { status: 503 }
    );
  }
}
