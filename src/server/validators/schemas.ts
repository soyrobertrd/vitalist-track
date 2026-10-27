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
