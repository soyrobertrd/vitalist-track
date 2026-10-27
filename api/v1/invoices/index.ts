import { resolveTenantContext } from '../../../src/server/middleware/tenant-context';
import { InvoiceService } from '../../../src/server/services/invoice-service';
import { createProblemResponse } from '../../../src/server/errors/problem-details';
import { invoiceQuerySchema, createInvoiceSchema } from '../../../src/server/validators/schemas';

export async function GET(req: Request) {
  try {
    const { db } = await resolveTenantContext(req);
    const service = new InvoiceService(db);

    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedQuery = invoiceQuerySchema.parse(queryParams);

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
    const service = new InvoiceService(db);

    const rawBody = await req.json();
    const validatedBody = createInvoiceSchema.parse(rawBody);

    const created = await service.create(validatedBody);
    return Response.json(created, { status: 201 });
  } catch (error) {
    const { status, body } = createProblemResponse(error, req.url);
    return Response.json(body, { status });
  }
}
