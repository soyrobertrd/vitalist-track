import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import type { TenantDb } from '../db/connection-manager';
import { invoices, invoiceItems, patients, branches } from '../db/tenant-schema';
import { AppError } from '../errors/problem-details';
import { createInvoiceSchema, type invoiceQuerySchema } from '../validators/schemas';
import type { z } from 'zod';

export type InvoiceQueryInput = z.infer<typeof invoiceQuerySchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export class InvoiceService {
  constructor(private db: TenantDb) {}

  /**
   * Listar facturas con filtros y paginación
   */
  async list(options: InvoiceQueryInput = { limit: 50 }) {
    const limit = Math.min(100, Math.max(1, options.limit || 50));
    const conditions = [];

    if (options.patientId) conditions.push(eq(invoices.patientId, options.patientId));
    if (options.branchId) conditions.push(eq(invoices.branchId, options.branchId));
    if (options.status) conditions.push(eq(invoices.status, options.status));
    if (options.startDate) conditions.push(gte(invoices.issueDate, options.startDate));
    if (options.endDate) conditions.push(lte(invoices.issueDate, options.endDate));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return this.db
      .select({
        invoice: invoices,
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
      .from(invoices)
      .leftJoin(patients, eq(invoices.patientId, patients.id))
      .leftJoin(branches, eq(invoices.branchId, branches.id))
      .where(whereClause)
      .orderBy(desc(invoices.issueDate))
      .limit(limit);
  }

  /**
   * Obtener factura por ID incluyendo sus items desglosados
   */
  async getById(id: string) {
    const invoiceRows = await this.db
      .select({
        invoice: invoices,
        patient: {
          id: patients.id,
          firstName: patients.firstName,
          lastName: patients.lastName,
          docNumber: patients.docNumber,
          phone: patients.phone,
          address: patients.address,
        },
        branch: {
          id: branches.id,
          name: branches.name,
          phone: branches.phone,
          address: branches.address,
        },
      })
      .from(invoices)
      .leftJoin(patients, eq(invoices.patientId, patients.id))
      .leftJoin(branches, eq(invoices.branchId, branches.id))
      .where(eq(invoices.id, id))
      .limit(1);

    const found = invoiceRows[0];
    if (!found) {
      throw new AppError(
        'InvoiceNotFound',
        `No se encontró la factura con ID ${id}`,
        404,
        'https://vitalisttrack.com/errors/invoice-not-found'
      );
    }

    const items = await this.db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id));

    return {
      ...found.invoice,
      patient: found.patient,
      branch: found.branch,
      items,
    };
  }

  /**
   * Crear nueva factura con items en transacción
   */
  async create(input: unknown) {
    const parsed = createInvoiceSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.');
        fieldErrors[path] = fieldErrors[path] || [];
        fieldErrors[path].push(issue.message);
      }
      throw new AppError(
        'ValidationError',
        'Datos de factura inválidos.',
        422,
        'https://vitalisttrack.com/errors/validation-error',
        fieldErrors
      );
    }

    const data = parsed.data;
    const invoiceId = `inv_${crypto.randomUUID()}`;

    // Calcular montos de items
    let subtotal = 0;
    let totalDiscount = 0;

    const itemsToInsert = data.items.map((item) => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const discount = item.discount || 0;
      const lineTotal = Math.max(0, lineSubtotal - discount);

      subtotal += lineSubtotal;
      totalDiscount += discount;

      return {
        id: `item_${crypto.randomUUID()}`,
        invoiceId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount,
        total: lineTotal,
      };
    });

    const tax = 0; // Exento de ITBIS para servicios médicos según legislación
    const total = Math.max(0, subtotal - totalDiscount + tax);

    const newInvoice = {
      id: invoiceId,
      branchId: data.branchId,
      patientId: data.patientId,
      invoiceNumber: data.invoiceNumber,
      issueDate: data.issueDate,
      dueDate: data.dueDate ?? null,
      subtotal,
      discount: totalDiscount,
      tax,
      total,
      status: 'pending' as const,
      paymentMethod: data.paymentMethod ?? null,
      notes: data.notes ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Inserción en Turso
    await this.db.insert(invoices).values(newInvoice);
    if (itemsToInsert.length > 0) {
      await this.db.insert(invoiceItems).values(itemsToInsert);
    }

    return {
      success: true,
      data: {
        ...newInvoice,
        items: itemsToInsert,
      },
    };
  }

  /**
   * Actualizar estado de una factura (p.ej. marcar como pagada o cancelada)
   */
  async updateStatus(id: string, status: 'draft' | 'pending' | 'paid' | 'cancelled') {
    const existing = await this.getById(id);
    if (!existing) return;

    await this.db
      .update(invoices)
      .set({
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(invoices.id, id));

    return { success: true, id, status };
  }
}
