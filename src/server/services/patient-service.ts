import { z } from 'zod';
import { eq, and, isNull, or, like, desc, sql } from 'drizzle-orm';
import type { TenantDb } from '../db/connection-manager';
import { patients } from '../db/tenant-schema';
import { AppError } from '../errors/problem-details';

// Validation Schemas
export const createPatientSchema = z.object({
  branchId: z.string().optional().nullable(),
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  docType: z.enum(['cedula', 'passport', 'other']).default('cedula'),
  docNumber: z.string().min(3, 'El número de documento es obligatorio'),
  birthDate: z.string().optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable(),
  address: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  bloodType: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updatePatientSchema = createPatientSchema.partial();

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

export interface ListPatientsOptions {
  branchId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Deep Module for Patient Management.
 * Encapsulates validation, search, pagination, and legal soft deletes.
 */
export class PatientService {
  constructor(private db: TenantDb) {}

  /**
   * Lists patients with search and pagination, excluding soft-deleted ones.
   */
  async list(options: ListPatientsOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const conditions = [isNull(patients.deletedAt)];

    if (options.branchId) {
      conditions.push(eq(patients.branchId, options.branchId));
    }

    if (options.search && options.search.trim()) {
      const term = `%${options.search.trim()}%`;
      conditions.push(
        or(
          like(patients.firstName, term),
          like(patients.lastName, term),
          like(patients.docNumber, term),
          like(patients.phone, term)
        )!
      );
    }

    const whereClause = and(...conditions);

    // Fetch total count and paginated items in parallel
    const [countResult, items] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(patients)
        .where(whereClause),
      this.db
        .select()
        .from(patients)
        .where(whereClause)
        .orderBy(desc(patients.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = Number(countResult[0]?.count || 0);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves a single patient by ID.
   */
  async getById(id: string) {
    const result = await this.db
      .select()
      .from(patients)
      .where(and(eq(patients.id, id), isNull(patients.deletedAt)))
      .limit(1);

    const patient = result[0];
    if (!patient) {
      throw new AppError(
        'PatientNotFound',
        `No se encontró el paciente con ID ${id}`,
        404,
        'https://vitalisttrack.com/errors/patient-not-found'
      );
    }

    return patient;
  }

  /**
   * Creates a new patient within the clinic's isolated tenant DB.
   */
  async create(input: unknown) {
    const parsed = createPatientSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.');
        fieldErrors[path] = fieldErrors[path] || [];
        fieldErrors[path].push(issue.message);
      }
      throw new AppError(
        'ValidationError',
        'Los datos del paciente no cumplen las reglas de validación.',
        422,
        'https://vitalisttrack.com/errors/validation-error',
        fieldErrors
      );
    }

    const data = parsed.data;

    // Check document uniqueness among active patients
    const existing = await this.db
      .select({ id: patients.id })
      .from(patients)
      .where(and(eq(patients.docNumber, data.docNumber), isNull(patients.deletedAt)))
      .limit(1);

    if (existing.length > 0) {
      throw new AppError(
        'DuplicatePatientDocument',
        `Ya existe un paciente activo registrado con el documento ${data.docNumber}.`,
        409,
        'https://vitalisttrack.com/errors/duplicate-patient-doc'
      );
    }

    const id = `pat_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const [created] = await this.db
      .insert(patients)
      .values({
        id,
        branchId: data.branchId || null,
        firstName: data.firstName,
        lastName: data.lastName,
        docType: data.docType,
        docNumber: data.docNumber,
        birthDate: data.birthDate || null,
        gender: data.gender || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
        bloodType: data.bloodType || null,
        allergies: data.allergies || null,
        notes: data.notes || null,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return created;
  }

  /**
   * Updates an existing patient.
   */
  async update(id: string, input: unknown) {
    await this.getById(id); // Ensure existence

    const parsed = updatePatientSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(
        'ValidationError',
        'Datos de actualización inválidos.',
        422,
        'https://vitalisttrack.com/errors/validation-error'
      );
    }

    const now = new Date().toISOString();
    const [updated] = await this.db
      .update(patients)
      .set({
        ...parsed.data,
        updatedAt: now,
      })
      .where(eq(patients.id, id))
      .returning();

    return updated;
  }

  /**
   * Performs medical compliance soft delete.
   */
  async softDelete(id: string, actorId: string) {
    await this.getById(id);

    const now = new Date().toISOString();
    await this.db
      .update(patients)
      .set({
        deletedAt: now,
        deletedBy: actorId,
        updatedAt: now,
      })
      .where(eq(patients.id, id));

    return { success: true, message: 'Paciente archivado correctamente.' };
  }
}
