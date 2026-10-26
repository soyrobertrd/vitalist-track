import { z } from 'zod';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import type { TenantDb } from '../db/connection-manager';
import { appointments, patients } from '../db/tenant-schema';
import { AppError } from '../errors/problem-details';

export const createAppointmentSchema = z.object({
  branchId: z.string().min(1, 'La sucursal es obligatoria'),
  patientId: z.string().min(1, 'El paciente es obligatorio'),
  professionalId: z.string().min(1, 'El profesional es obligatorio'),
  serviceName: z.string().min(2, 'El nombre del servicio es obligatorio'),
  startTime: z.string().datetime({ message: 'La hora de inicio debe ser una fecha ISO válida' }),
  endTime: z.string().datetime({ message: 'La hora de finalización debe ser una fecha ISO válida' }),
  notes: z.string().optional().nullable(),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']),
  cancellationReason: z.string().optional().nullable(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export interface ListAppointmentsOptions {
  branchId?: string;
  professionalId?: string;
  patientId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Deep Module for Appointment Management.
 * Encapsulates conflict detection, status transitions, and appointment validation.
 */
export class AppointmentService {
  constructor(private db: TenantDb) {}

  /**
   * Lists appointments with optional date range, professional, or branch filters.
   */
  async list(options: ListAppointmentsOptions = {}) {
    const conditions = [];

    if (options.branchId) conditions.push(eq(appointments.branchId, options.branchId));
    if (options.professionalId) conditions.push(eq(appointments.professionalId, options.professionalId));
    if (options.patientId) conditions.push(eq(appointments.patientId, options.patientId));
    if (options.startDate) conditions.push(gte(appointments.startTime, options.startDate));
    if (options.endDate) conditions.push(lte(appointments.endTime, options.endDate));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return this.db
      .select({
        appointment: appointments,
        patient: {
          id: patients.id,
          firstName: patients.firstName,
          lastName: patients.lastName,
          phone: patients.phone,
          docNumber: patients.docNumber,
        },
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .where(whereClause)
      .orderBy(desc(appointments.startTime));
  }

  /**
   * Schedules a new appointment, preventing doctor double-booking.
   */
  async create(input: unknown) {
    const parsed = createAppointmentSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.');
        fieldErrors[path] = fieldErrors[path] || [];
        fieldErrors[path].push(issue.message);
      }
      throw new AppError(
        'ValidationError',
        'Datos de cita inválidos.',
        422,
        'https://vitalisttrack.com/errors/validation-error',
        fieldErrors
      );
    }

    const data = parsed.data;

    // 1. Verify start < end
    if (new Date(data.startTime) >= new Date(data.endTime)) {
      throw new AppError(
        'InvalidTimeRange',
        'La hora de finalización debe ser posterior a la hora de inicio.',
        400,
        'https://vitalisttrack.com/errors/invalid-time-range'
      );
    }

    // 2. Check overlap for the professional (prevent double booking)
    const overlaps = await this.db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.professionalId, data.professionalId),
          sql`${appointments.status} NOT IN ('cancelled', 'no_show')`,
          // Overlap condition: start < other.end AND end > other.start
          sql`${appointments.startTime} < ${data.endTime} AND ${appointments.endTime} > ${data.startTime}`
        )
      )
      .limit(1);

    if (overlaps.length > 0) {
      throw new AppError(
        'ScheduleConflict',
        'El profesional ya tiene una cita asignada que se solapa con el horario seleccionado.',
        409,
        'https://vitalisttrack.com/errors/schedule-conflict'
      );
    }

    const id = `app_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const [created] = await this.db
      .insert(appointments)
      .values({
        id,
        branchId: data.branchId,
        patientId: data.patientId,
        professionalId: data.professionalId,
        serviceName: data.serviceName,
        startTime: data.startTime,
        endTime: data.endTime,
        status: 'scheduled',
        notes: data.notes || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return created;
  }

  /**
   * Updates appointment status with validation.
   */
  async updateStatus(id: string, input: unknown) {
    const parsed = updateAppointmentStatusSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(
        'ValidationError',
        'Estado de cita inválido.',
        422,
        'https://vitalisttrack.com/errors/validation-error'
      );
    }

    const now = new Date().toISOString();
    const [updated] = await this.db
      .update(appointments)
      .set({
        status: parsed.data.status,
        cancellationReason: parsed.data.cancellationReason || null,
        updatedAt: now,
      })
      .where(eq(appointments.id, id))
      .returning();

    if (!updated) {
      throw new AppError(
        'AppointmentNotFound',
        `No se encontró la cita con ID ${id}`,
        404,
        'https://vitalisttrack.com/errors/appointment-not-found'
      );
    }

    return updated;
  }
}
