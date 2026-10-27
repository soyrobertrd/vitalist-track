import { resolveTenantContext } from '../../../src/server/middleware/tenant-context';
import { MedicalRecordService } from '../../../src/server/services/medical-record-service';
import { createProblemResponse } from '../../../src/server/errors/problem-details';
import { medicalRecordQuerySchema, createMedicalRecordSchema } from '../../../src/server/validators/schemas';

export async function GET(req: Request) {
  try {
    const { db } = await resolveTenantContext(req);
    const service = new MedicalRecordService(db);

    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedQuery = medicalRecordQuerySchema.parse(queryParams);

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
    const service = new MedicalRecordService(db);

    const rawBody = await req.json();
    const validatedBody = createMedicalRecordSchema.parse(rawBody);

    const created = await service.create(validatedBody);
    return Response.json(created, { status: 201 });
  } catch (error) {
    const { status, body } = createProblemResponse(error, req.url);
    return Response.json(body, { status });
  }
}
