import { ExportTursoService } from '../../../src/server/services/export-turso-service';
import { createProblemResponse, AppError } from '../../../src/server/errors/problem-details';
import { exportToTursoSchema } from '../../../src/server/validators/schemas';

export async function POST(req: Request) {
  try {
    // Verificación de autorización administrativa
    const authHeader = req.headers.get('authorization');
    const adminKey = process.env.ADMIN_MIGRATION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const isDev = process.env.NODE_ENV !== 'production' || process.env.ALLOW_INSECURE_DEV_API === '1';

    if (!isDev && (!adminKey || authHeader !== `Bearer ${adminKey}`)) {
      throw new AppError(
        'UnauthorizedMigration',
        'Se requieren credenciales administrativas para exportar datos a Turso.',
        403,
        'https://vitalisttrack.com/errors/unauthorized-migration'
      );
    }

    const rawBody = await req.json().catch(() => ({}));
    const validatedBody = exportToTursoSchema.parse(rawBody);

    const service = new ExportTursoService();
    const result = await service.exportWorkspace({
      workspaceId: validatedBody.workspaceId,
      clinicId: validatedBody.clinicId,
      dryRun: validatedBody.dryRun,
      actorId: 'admin_api',
    });

    return Response.json(result, { status: 200 });
  } catch (error) {
    const { status, body } = createProblemResponse(error, req.url);
    return Response.json(body, { status });
  }
}
