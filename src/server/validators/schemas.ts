/**
 * Validadores Zod para la API v1 (Fase 2 / S6)
 * Cumplimiento estricto: Validación de body y query, límite máximo de 100 registros.
 */
import { z } from 'zod';

// 1. Pacientes - Query Schema (listado)
export const patientQuerySchema = z.object({
  branchId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50), // S6: max 100
});

// 2. Pacientes - Create Schema
export const createPatientSchema = z.object({
  branchId: z.string().optional().nullable(),
  firstName: z.string().min(1, 'El nombre es obligatorio').max(100),
  lastName: z.string().min(1, 'El apellido es obligatorio').max(100),
  docType: z.enum(['cedula', 'passport', 'other']).default('cedula'),
  docNumber: z.string().min(1, 'El documento de identidad es obligatorio').max(50),
  birthDate: z.string().optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  address: z.string().max(255).optional().nullable(),
  emergencyContactName: z.string().max(100).optional().nullable(),
  emergencyContactPhone: z.string().max(30).optional().nullable(),
  bloodType: z.string().max(10).optional().nullable(),
  allergies: z.string().max(500).optional().nullable(),
  associatedClinic: z.string().max(150).optional().nullable(), // Pro Consultorios
  notes: z.string().max(2000).optional().nullable(),
});

// 3. Citas / Appointments - Query Schema
export const appointmentQuerySchema = z.object({
  branchId: z.string().optional(),
  professionalId: z.string().optional(),
  patientId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50), // S6: max 100
});

// 4. Citas / Appointments - Create Schema
export const createAppointmentSchema = z.object({
  branchId: z.string().min(1, 'La sucursal es obligatoria'),
  patientId: z.string().min(1, 'El paciente es obligatorio'),
  professionalId: z.string().min(1, 'El profesional asignado es obligatorio'),
  serviceName: z.string().min(1, 'El nombre del servicio es obligatorio').max(150),
  appointmentType: z.enum(['ambulatorio', 'domicilio']).default('ambulatorio'),
  startTime: z.string().min(1, 'La fecha y hora de inicio es obligatoria'),
  endTime: z.string().min(1, 'La fecha y hora de fin es obligatoria'),
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).default('scheduled'),
  notes: z.string().max(2000).optional().nullable(),
  cancellationReason: z.string().max(500).optional().nullable(),
});

// 5. Historias Clínicas / Medical Records - Query Schema
export const medicalRecordQuerySchema = z.object({
  patientId: z.string().optional(),
  professionalId: z.string().optional(),
  branchId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// 6. Historias Clínicas / Medical Records - Create Schema
export const createMedicalRecordSchema = z.object({
  patientId: z.string().min(1, 'El paciente es obligatorio'),
  branchId: z.string().min(1, 'La sucursal es obligatoria'),
  professionalId: z.string().min(1, 'El profesional es obligatorio'),
  consultationDate: z.string().min(1, 'La fecha de consulta es obligatoria'),
  reason: z.string().min(1, 'El motivo de consulta es obligatorio').max(500),
  vitalSigns: z.object({
    bloodPressure: z.string().optional(),
    heartRate: z.number().optional(),
    respiratoryRate: z.number().optional(),
    temperature: z.number().optional(),
    weightKg: z.number().optional(),
    heightCm: z.number().optional(),
    bmi: z.number().optional(),
  }).optional(),
  physicalExam: z.string().max(3000).optional().nullable(),
  diagnosisCie10: z.string().max(50).optional().nullable(),
  diagnosisText: z.string().max(1000).optional().nullable(),
  treatmentPlan: z.string().max(3000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

// 7. Recetas / Prescriptions - Query Schema
export const prescriptionQuerySchema = z.object({
  patientId: z.string().optional(),
  professionalId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// 8. Recetas / Prescriptions - Create Schema
export const createPrescriptionSchema = z.object({
  patientId: z.string().min(1, 'El paciente es obligatorio'),
  professionalId: z.string().min(1, 'El profesional es obligatorio'),
  medicalRecordId: z.string().optional().nullable(),
  medications: z.array(z.object({
    name: z.string().min(1, 'El nombre del medicamento es obligatorio'),
    dosage: z.string().min(1, 'La dosis es obligatoria'),
    frequency: z.string().min(1, 'La frecuencia es obligatoria'),
    duration: z.string().min(1, 'La duración es obligatoria'),
    route: z.string().optional(),
    instructions: z.string().optional(),
  })).min(1, 'Debe incluir al menos un medicamento'),
  instructions: z.string().max(2000).optional().nullable(),
  validUntil: z.string().optional().nullable(),
});

// 9. Facturación / Invoices - Query Schema
export const invoiceQuerySchema = z.object({
  patientId: z.string().optional(),
  branchId: z.string().optional(),
  status: z.enum(['draft', 'pending', 'paid', 'cancelled']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// 10. Facturación / Invoices - Create Schema
export const createInvoiceSchema = z.object({
  branchId: z.string().min(1, 'La sucursal es obligatoria'),
  patientId: z.string().min(1, 'El paciente es obligatorio'),
  invoiceNumber: z.string().min(1, 'El número de factura es obligatorio'),
  issueDate: z.string().min(1, 'La fecha de emisión es obligatoria'),
  dueDate: z.string().optional().nullable(),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'insurance', 'other']).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(z.object({
    description: z.string().min(1, 'La descripción es obligatoria'),
    quantity: z.number().positive('La cantidad debe ser mayor a 0'),
    unitPrice: z.number().nonnegative('El precio unitario no puede ser negativo'),
    discount: z.number().nonnegative().default(0),
  })).min(1, 'Debe incluir al menos un item'),
});

// 11. Sucursales / Branches - Create Schema
export const createBranchSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  address: z.string().max(255).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  isMain: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

// 12. Exportación a Turso - Request Schema
export const exportToTursoSchema = z.object({
  workspaceId: z.string().min(1, 'El workspaceId es obligatorio'),
  clinicId: z.string().optional(),
  dryRun: z.boolean().default(false),
});

