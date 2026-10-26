import { resolveTenantContext } from '../../../src/server/middleware/tenant-context';
import { PatientService } from '../../../src/server/services/patient-service';
import { createProblemResponse } from '../../../src/server/errors/problem-details';

export async function GET(req: Request) {
  try {
    const { db } = await resolveTenantContext(req);
    const service = new PatientService(db);

    const url = new URL(req.url);
    const branchId = url.searchParams.get('branchId') || undefined;
    const search = url.searchParams.get('search') || undefined;
    const page = url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined;
    const limit = url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined;

    const result = await service.list({ branchId, search, page, limit });

    return Response.json(result, { status: 200 });
  } catch (error) {
    const { status, body } = createProblemResponse(error, req.url);
    return Response.json(body, { status });
  }
}

export async function POST(req: Request) {
  try {
    const { db } = await resolveTenantContext(req);
    const service = new PatientService(db);

    const body = await req.json();
    const created = await service.create(body);

    return Response.json(created, { status: 201 });
  } catch (error) {
    const { status, body } = createProblemResponse(error, req.url);
    return Response.json(body, { status });
  }
}
