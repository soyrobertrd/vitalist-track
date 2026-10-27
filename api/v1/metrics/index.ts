import { resolveTenantContext } from '../../../src/server/middleware/tenant-context';
import { MetricsService } from '../../../src/server/services/metrics-service';
import { createProblemResponse } from '../../../src/server/errors/problem-details';

export async function GET(req: Request) {
  try {
    const { db } = await resolveTenantContext(req);
    const service = new MetricsService(db);

    const summary = await service.getSummary();
    return Response.json(summary, { status: 200 });
  } catch (error) {
    const { status, body } = createProblemResponse(error, req.url);
    return Response.json(body, { status });
  }
}
