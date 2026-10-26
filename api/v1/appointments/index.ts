import { resolveTenantContext } from '../../../src/server/middleware/tenant-context';
import { AppointmentService } from '../../../src/server/services/appointment-service';
import { createProblemResponse } from '../../../src/server/errors/problem-details';

export async function GET(req: Request) {
  try {
    const { db } = await resolveTenantContext(req);
    const service = new AppointmentService(db);

    const url = new URL(req.url);
    const branchId = url.searchParams.get('branchId') || undefined;
    const professionalId = url.searchParams.get('professionalId') || undefined;
    const patientId = url.searchParams.get('patientId') || undefined;
    const startDate = url.searchParams.get('startDate') || undefined;
    const endDate = url.searchParams.get('endDate') || undefined;

    const appointments = await service.list({
      branchId,
      professionalId,
      patientId,
      startDate,
      endDate,
    });

    return Response.json(appointments, { status: 200 });
  } catch (error) {
    const { status, body } = createProblemResponse(error, req.url);
    return Response.json(body, { status });
  }
}

export async function POST(req: Request) {
  try {
    const { db } = await resolveTenantContext(req);
    const service = new AppointmentService(db);

    const body = await req.json();
    const created = await service.create(body);

    return Response.json(created, { status: 201 });
  } catch (error) {
    const { status, body } = createProblemResponse(error, req.url);
    return Response.json(body, { status });
  }
}
