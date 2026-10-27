import { resolveTenantContext } from '../../../src/server/middleware/tenant-context';
import { PatientService } from '../../../src/server/services/patient-service';
import { createProblemResponse } from '../../../src/server/errors/problem-details';
import { patientQuerySchema, createPatientSchema } from '../../../src/server/validators/schemas';

export async function GET(req: Request) {
  try {
    const { db } = await resolveTenantContext(req);
    const service = new PatientService(db);

    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedQuery = patientQuerySchema.parse(queryParams);

    const result = await service.list(validatedQuery);

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

    const rawBody = await req.json();
    const validatedBody = createPatientSchema.parse(rawBody);

    const created = await service.create(validatedBody as any);

    return Response.json(created, { status: 201 });
  } catch (error) {
    const { status, body } = createProblemResponse(error, req.url);
    return Response.json(body, { status });
  }
}
