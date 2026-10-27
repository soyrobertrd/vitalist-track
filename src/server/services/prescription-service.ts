import { eq, and, desc, sql } from 'drizzle-orm';
import type { TenantDb } from '../db/connection-manager';
import { prescriptions, patients, medicalRecords } from '../db/tenant-schema';
import { AppError } from '../errors/problem-details';
import { createPrescriptionSchema, type prescriptionQuerySchema } from '../validators/schemas';
import type { z } from 'zod';

export type PrescriptionQueryInput = z.infer<typeof prescriptionQuerySchema>;
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;

export class PrescriptionService {
  constructor(private db: TenantDb) {}

  /**
   * Listar recetas médicas con filtros
   */
  async list(options: PrescriptionQueryInput = { limit: 50 }) {
    const limit = Math.min(100, Math.max(1, options.limit || 50));
    const conditions = [];

    if (options.patientId) {
      conditions.push(eq(prescriptions.patientId, options.patientId));
    }
    if (options.professionalId) {
      conditions.push(eq(prescriptions.professionalId, options.professionalId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select({
        prescription: prescriptions,
        patient: {
          id: patients.id,
          firstName: patients.firstName,
          lastName: patients.lastName,
          docNumber: patients.docNumber,
        },
      })
      .from(prescriptions)
      .leftJoin(patients, eq(prescriptions.patientId, patients.id))
      .where(whereClause)
      .orderBy(desc(prescriptions.createdAt))
      .limit(limit);

    return rows.map((r) => ({
      ...r.prescription,
      medications: JSON.parse(r.prescription.medicationsJson || '[]'),
      patient: r.patient,
    }));
  }

  /**
   * Obtener receta por ID con detalle de medicamentos
   */
  async getById(id: string) {
    const rows = await this.db
      .select({
        prescription: prescriptions,
        patient: {
          id: patients.id,
          firstName: patients.firstName,
          lastName: patients.lastName,
          docNumber: patients.docNumber,
          phone: patients.phone,
          allergies: patients.allergies,
        },
      })
      .from(prescriptions)
      .leftJoin(patients, eq(prescriptions.patientId, patients.id))
      .where(eq(prescriptions.id, id))
      .limit(1);

    const found = rows[0];
    if (!found) {
      throw new AppError(
        'PrescriptionNotFound',
        `No se encontró la receta médica con ID ${id}`,
        404,
        'https://vitalisttrack.com/errors/prescription-not-found'
      );
    }

    return {
      ...found.prescription,
      medications: JSON.parse(found.prescription.medicationsJson || '[]'),
      patient: found.patient,
    };
  }

  /**
   * Emitir una nueva receta médica
   */
  async create(input: unknown) {
    const parsed = createPrescriptionSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.');
        fieldErrors[path] = fieldErrors[path] || [];
        fieldErrors[path].push(issue.message);
      }
      throw new AppError(
        'ValidationError',
        'Datos de receta inválidos.',
        422,
        'https://vitalisttrack.com/errors/validation-error',
        fieldErrors
      );
    }

    const data = parsed.data;
    const prescriptionId = `rx_${crypto.randomUUID()}`;

    // Si no se especifica vigencia, por defecto 30 días
    const validUntil =
      data.validUntil ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newPrescription = {
      id: prescriptionId,
      medicalRecordId: data.medicalRecordId ?? null,
      patientId: data.patientId,
      professionalId: data.professionalId,
      medicationsJson: JSON.stringify(data.medications),
      instructions: data.instructions ?? null,
      validUntil,
      createdAt: new Date().toISOString(),
    };

    await this.db.insert(prescriptions).values(newPrescription);

    return {
      success: true,
      data: {
        ...newPrescription,
        medications: data.medications,
      },
    };
  }
}
