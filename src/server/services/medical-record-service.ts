import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import type { TenantDb } from '../db/connection-manager';
import { medicalRecords, patients, branches } from '../db/tenant-schema';
import { AppError } from '../errors/problem-details';
import { createMedicalRecordSchema, type medicalRecordQuerySchema } from '../validators/schemas';
import type { z } from 'zod';

export type MedicalRecordQueryInput = z.infer<typeof medicalRecordQuerySchema>;
export type CreateMedicalRecordInput = z.infer<typeof createMedicalRecordSchema>;

export class MedicalRecordService {
  constructor(private db: TenantDb) {}

  /**
   * Listar consultas e historias clínicas filtradas
   */
  async list(options: MedicalRecordQueryInput = { page: 1, limit: 50 }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 50));
    const offset = (page - 1) * limit;

    const conditions = [isNull(medicalRecords.deletedAt)];

    if (options.patientId) {
      conditions.push(eq(medicalRecords.patientId, options.patientId));
    }
    if (options.professionalId) {
      conditions.push(eq(medicalRecords.professionalId, options.professionalId));
    }
    if (options.branchId) {
      conditions.push(eq(medicalRecords.branchId, options.branchId));
    }

    const whereClause = and(...conditions);

    const [countResult, items] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(medicalRecords)
        .where(whereClause),
      this.db
        .select({
          record: medicalRecords,
          patient: {
            id: patients.id,
            firstName: patients.firstName,
            lastName: patients.lastName,
            docNumber: patients.docNumber,
          },
          branch: {
            id: branches.id,
            name: branches.name,
          },
        })
        .from(medicalRecords)
        .leftJoin(patients, eq(medicalRecords.patientId, patients.id))
        .leftJoin(branches, eq(medicalRecords.branchId, branches.id))
        .where(whereClause)
        .orderBy(desc(medicalRecords.consultationDate))
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
   * Obtener una historia clínica por ID
   */
  async getById(id: string) {
    const result = await this.db
      .select({
        record: medicalRecords,
        patient: {
          id: patients.id,
          firstName: patients.firstName,
          lastName: patients.lastName,
          docNumber: patients.docNumber,
          birthDate: patients.birthDate,
          gender: patients.gender,
          bloodType: patients.bloodType,
          allergies: patients.allergies,
        },
        branch: {
          id: branches.id,
          name: branches.name,
        },
      })
      .from(medicalRecords)
      .leftJoin(patients, eq(medicalRecords.patientId, patients.id))
      .leftJoin(branches, eq(medicalRecords.branchId, branches.id))
      .where(and(eq(medicalRecords.id, id), isNull(medicalRecords.deletedAt)))
      .limit(1);

    const found = result[0];
    if (!found) {
      throw new AppError(
        'MedicalRecordNotFound',
        `No se encontró la consulta médica con ID ${id}`,
        404,
        'https://vitalisttrack.com/errors/medical-record-not-found'
      );
    }

    return found;
  }

  /**
   * Registrar una nueva consulta médica
   */
  async create(input: unknown) {
    const parsed = createMedicalRecordSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.');
        fieldErrors[path] = fieldErrors[path] || [];
        fieldErrors[path].push(issue.message);
      }
      throw new AppError(
        'ValidationError',
        'Datos de historia clínica inválidos.',
        422,
        'https://vitalisttrack.com/errors/validation-error',
        fieldErrors
      );
    }

    const data = parsed.data;
    const recordId = `rec_${crypto.randomUUID()}`;

    const newRecord = {
      id: recordId,
      patientId: data.patientId,
      branchId: data.branchId,
      professionalId: data.professionalId,
      consultationDate: data.consultationDate,
      reason: data.reason,
      vitalSignsJson: data.vitalSigns ? JSON.stringify(data.vitalSigns) : null,
      physicalExam: data.physicalExam ?? null,
      diagnosisCie10: data.diagnosisCie10 ?? null,
      diagnosisText: data.diagnosisText ?? null,
      treatmentPlan: data.treatmentPlan ?? null,
      notes: data.notes ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    await this.db.insert(medicalRecords).values(newRecord);

    return {
      success: true,
      data: newRecord,
    };
  }

  /**
   * Soft delete para cumplimiento legal
   */
  async delete(id: string) {
    const record = await this.getById(id);
    if (!record) return;

    await this.db
      .update(medicalRecords)
      .set({
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(medicalRecords.id, id));

    return { success: true, message: 'Consulta eliminada lógicamente.' };
  }
}
