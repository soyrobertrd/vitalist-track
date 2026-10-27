import { eq, desc } from 'drizzle-orm';
import type { TenantDb } from '../db/connection-manager';
import { branches } from '../db/tenant-schema';
import { AppError } from '../errors/problem-details';
import { createBranchSchema } from '../validators/schemas';

export class BranchService {
  constructor(private db: TenantDb) {}

  /**
   * Listar todas las sucursales de la clínica
   */
  async list() {
    return this.db
      .select()
      .from(branches)
      .orderBy(desc(branches.isMain), branches.name);
  }

  /**
   * Obtener sucursal por ID
   */
  async getById(id: string) {
    const rows = await this.db
      .select()
      .from(branches)
      .where(eq(branches.id, id))
      .limit(1);

    const found = rows[0];
    if (!found) {
      throw new AppError(
        'BranchNotFound',
        `No se encontró la sucursal con ID ${id}`,
        404,
        'https://vitalisttrack.com/errors/branch-not-found'
      );
    }
    return found;
  }

  /**
   * Crear nueva sucursal
   */
  async create(input: unknown) {
    const parsed = createBranchSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.');
        fieldErrors[path] = fieldErrors[path] || [];
        fieldErrors[path].push(issue.message);
      }
      throw new AppError(
        'ValidationError',
        'Datos de sucursal inválidos.',
        422,
        'https://vitalisttrack.com/errors/validation-error',
        fieldErrors
      );
    }

    const data = parsed.data;
    const branchId = `br_${crypto.randomUUID()}`;

    // Si es marcada como principal, desmarcar anteriores
    if (data.isMain) {
      await this.db
        .update(branches)
        .set({ isMain: false, updatedAt: new Date().toISOString() });
    }

    const newBranch = {
      id: branchId,
      name: data.name,
      address: data.address ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      isMain: data.isMain,
      isActive: data.isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.db.insert(branches).values(newBranch);

    return {
      success: true,
      data: newBranch,
    };
  }
}
