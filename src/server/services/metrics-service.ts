import { sql, isNull } from 'drizzle-orm';
import type { TenantDb } from '../db/connection-manager';
import { patients, appointments, invoices, prescriptions } from '../db/tenant-schema';

export interface ClinicMetrics {
  patients: {
    total: number;
    active: number;
    inactive: number;
  };
  appointments: {
    total: number;
    scheduled: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  billing: {
    totalBilled: number;
    totalPaid: number;
    totalPending: number;
    invoiceCount: number;
  };
  prescriptions: {
    totalIssued: number;
  };
  generatedAt: string;
}

export class MetricsService {
  constructor(private db: TenantDb) {}

  /**
   * Obtener métricas consolidadas clínicas y financieras en tiempo real
   */
  async getSummary(): Promise<ClinicMetrics> {
    // 1. Pacientes por estado
    const patientStats = await this.db
      .select({
        status: patients.status,
        count: sql<number>`count(*)`,
      })
      .from(patients)
      .where(isNull(patients.deletedAt))
      .groupBy(patients.status);

    let activePatients = 0;
    let inactivePatients = 0;
    let totalPatients = 0;

    for (const stat of patientStats) {
      const c = Number(stat.count || 0);
      totalPatients += c;
      if (stat.status === 'active') activePatients += c;
      else inactivePatients += c;
    }

    // 2. Citas por estado
    const appointmentStats = await this.db
      .select({
        status: appointments.status,
        count: sql<number>`count(*)`,
      })
      .from(appointments)
      .groupBy(appointments.status);

    let scheduled = 0;
    let confirmed = 0;
    let completed = 0;
    let cancelled = 0;
    let noShow = 0;
    let totalAppointments = 0;

    for (const stat of appointmentStats) {
      const c = Number(stat.count || 0);
      totalAppointments += c;
      if (stat.status === 'scheduled') scheduled += c;
      else if (stat.status === 'confirmed') confirmed += c;
      else if (stat.status === 'completed') completed += c;
      else if (stat.status === 'cancelled') cancelled += c;
      else if (stat.status === 'no_show') noShow += c;
    }

    // 3. Facturación consolidada
    const billingStats = await this.db
      .select({
        status: invoices.status,
        totalSum: sql<number>`sum(total)`,
        count: sql<number>`count(*)`,
      })
      .from(invoices)
      .groupBy(invoices.status);

    let totalBilled = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let invoiceCount = 0;

    for (const row of billingStats) {
      const amount = Number(row.totalSum || 0);
      const c = Number(row.count || 0);
      invoiceCount += c;
      totalBilled += amount;
      if (row.status === 'paid') {
        totalPaid += amount;
      } else if (row.status === 'pending' || row.status === 'draft') {
        totalPending += amount;
      }
    }

    // 4. Recetas emitidas
    const rxStats = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(prescriptions);

    const totalIssuedRx = Number(rxStats[0]?.count || 0);

    return {
      patients: {
        total: totalPatients,
        active: activePatients,
        inactive: inactivePatients,
      },
      appointments: {
        total: totalAppointments,
        scheduled,
        confirmed,
        completed,
        cancelled,
        noShow,
      },
      billing: {
        totalBilled,
        totalPaid,
        totalPending,
        invoiceCount,
      },
      prescriptions: {
        totalIssued: totalIssuedRx,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}
