import { resolveTenantContext } from '../../../src/server/middleware/tenant-context';
import { PatientService } from '../../../src/server/services/patient-service';
import { createProblemResponse } from '../../../src/server/errors/problem-details';

function extractId(req: Request, params?: { id?: string }): string {
  if (params?.id) return params.id;
  const parts = new URL(req.url).pathname.split('/');
  return parts[parts.length - 1];
}

export async function GET(req: Request, context?: { params?: { id?: string } }) {
  try {
    const { db } = await resolveTenantContext(req);
    const service = new PatientService(db);
    const id = extractId(req, context?.params);

    const patient = await service.getById(id);
    return Response.json(patient, { status: 200 });
  } catch (error) {
    const { status, body } = createProblemResponse(error, req.url);
    return Response.json(body, { status });
  }
}

export async function PUT(req: Request, context?: { params?: { id?: string } }) {
  try {
    const { db } = await resolveTenantContext(req);
    const service = new PatientService(db);
    const id = extractId(req, context?.params);

    const body = await req.json();
    const updated = await service.update(id, body);

    return Response.json(updated, { status: 200 });
  } catch (error) {
    const { status, body } = createProblemResponse(error, req.url);
    return Response.json(body, { status });
  }
}

export async function DELETE(req: Request, context?: { params?: { id?: string } }) {
  try {
    const { db } = await resolveTenantContext(req);
    const service = new PatientService(db);
    const id = extractId(req, context?.params);

    // Extract actor ID from session/header or default to system
    const actorId = req.headers.get('x-user-id') || 'system';
    const result = await service.softDelete(id, actorId);

    return Response.json(result, { status: 200 });
  } catch (error) {
    const { status, body } = createProblemResponse(error, req.url);
    return Response.json(body, { status });
  }
}
