import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

/**
 * TENANT DATABASE SCHEMA (One physical SQLite/LibSQL database per clinic)
 * Strictly isolated for each customer. Houses clinical, operational and financial data.
 */

// 1. Branches (Sucursales) within the clinic
export const branches = sqliteTable('branches', {
  id: text('id').primaryKey(), // br_...
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  isMain: integer('is_main', { mode: 'boolean' }).default(false).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 2. Patients (Pacientes)
export const patients = sqliteTable('patients', {
  id: text('id').primaryKey(), // pat_...
  branchId: text('branch_id').references(() => branches.id),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  docType: text('doc_type', { enum: ['cedula', 'passport', 'other'] }).default('cedula').notNull(),
  docNumber: text('doc_number').notNull(),
  birthDate: text('birth_date'),
  gender: text('gender', { enum: ['male', 'female', 'other'] }),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  emergencyContactName: text('emergency_contact_name'),
  emergencyContactPhone: text('emergency_contact_phone'),
  bloodType: text('blood_type'),
  allergies: text('allergies'),
  associatedClinic: text('associated_clinic'), // Para plan Pro Consultorios (hasta 3 clínicas asociadas)
  notes: text('notes'),
  status: text('status', { enum: ['active', 'inactive', 'archived'] }).default('active').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  deletedAt: text('deleted_at'), // Soft delete for medical records compliance
  deletedBy: text('deleted_by'),
});

// 3. Appointments (Citas)
export const appointments = sqliteTable('appointments', {
  id: text('id').primaryKey(), // app_...
  branchId: text('branch_id').notNull().references(() => branches.id),
  patientId: text('patient_id').notNull().references(() => patients.id),
  professionalId: text('professional_id').notNull(), // User ID of doctor
  serviceName: text('service_name').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  status: text('status', {
    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']
  }).default('scheduled').notNull(),
  notes: text('notes'),
  cancellationReason: text('cancellation_reason'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 4. General Medical Consultations & Clinical Records
export const medicalRecords = sqliteTable('medical_records', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id),
  branchId: text('branch_id').notNull().references(() => branches.id),
  professionalId: text('professional_id').notNull(),
  consultationDate: text('consultation_date').notNull(),
  reason: text('reason').notNull(),
  vitalSignsJson: text('vital_signs_json'), // { bp, heartRate, temp, weight, height, bmi }
  physicalExam: text('physical_exam'),
  diagnosisCie10: text('diagnosis_cie10'),
  diagnosisText: text('diagnosis_text'),
  treatmentPlan: text('treatment_plan'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  deletedAt: text('deleted_at'),
});

// 5. Medical Prescriptions (Recetas)
export const prescriptions = sqliteTable('prescriptions', {
  id: text('id').primaryKey(),
  medicalRecordId: text('medical_record_id').references(() => medicalRecords.id),
  patientId: text('patient_id').notNull().references(() => patients.id),
  professionalId: text('professional_id').notNull(),
  medicationsJson: text('medications_json').notNull(), // Array of { name, dosage, frequency, duration }
  instructions: text('instructions'),
  validUntil: text('valid_until'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 6. Dental Records & Odontogram (Odontología)
export const dentalRecords = sqliteTable('dental_records', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id),
  branchId: text('branch_id').notNull().references(() => branches.id),
  professionalId: text('professional_id').notNull(),
  odontogramStateJson: text('odontogram_state_json').notNull(), // Tooth conditions map (11-48, 51-85)
  diagnosis: text('diagnosis'),
  proceduresJson: text('procedures_json'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 7. Psychology Notes & Evaluations (Psicología)
export const psychologyNotes = sqliteTable('psychology_notes', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id),
  branchId: text('branch_id').notNull().references(() => branches.id),
  professionalId: text('professional_id').notNull(),
  sessionNumber: integer('session_number').notNull(),
  symptoms: text('symptoms'),
  evaluationScalesJson: text('evaluation_scales_json'), // GAD-7, PHQ-9, etc.
  evolutionNotes: text('evolution_notes').notNull(),
  recommendations: text('recommendations'),
  nextSessionGoals: text('next_session_goals'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 8. Invoices (Facturación Médica)
export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').notNull().references(() => branches.id),
  patientId: text('patient_id').notNull().references(() => patients.id),
  invoiceNumber: text('invoice_number').notNull().unique(),
  issueDate: text('issue_date').notNull(),
  dueDate: text('due_date'),
  subtotal: real('subtotal').notNull(),
  discount: real('discount').default(0).notNull(),
  tax: real('tax').default(0).notNull(),
  total: real('total').notNull(),
  status: text('status', { enum: ['draft', 'pending', 'paid', 'cancelled'] }).default('pending').notNull(),
  paymentMethod: text('payment_method', { enum: ['cash', 'card', 'transfer', 'insurance', 'other'] }),
  notes: text('notes'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 9. Invoice Items
export const invoiceItems = sqliteTable('invoice_items', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  quantity: real('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  discount: real('discount').default(0).notNull(),
  total: real('total').notNull(),
});

// 10. Inventory Items (Insumos y Farmacia)
export const inventoryItems = sqliteTable('inventory_items', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').notNull().references(() => branches.id),
  name: text('name').notNull(),
  sku: text('sku'),
  category: text('category'),
  currentStock: real('current_stock').default(0).notNull(),
  minStock: real('min_stock').default(0).notNull(),
  unit: text('unit').default('unidad').notNull(),
  unitCost: real('unit_cost').default(0).notNull(),
  salePrice: real('sale_price').default(0).notNull(),
  expirationDate: text('expiration_date'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 11. Stock Movements (Trazabilidad de Inventario)
export const stockMovements = sqliteTable('stock_movements', {
  id: text('id').primaryKey(),
  inventoryItemId: text('inventory_item_id').notNull().references(() => inventoryItems.id),
  branchId: text('branch_id').notNull().references(() => branches.id),
  movementType: text('movement_type', { enum: ['in', 'out', 'adjustment', 'transfer'] }).notNull(),
  quantity: real('quantity').notNull(),
  reason: text('reason'),
  actorId: text('actor_id').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 12. Audit Logs (Trazabilidad de seguridad y accesos clínicos - HIPAA / Ley 172-13)
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  actorId: text('actor_id').notNull(),
  action: text('action').notNull(), // 'create', 'update', 'delete', 'export', 'access'
  resourceType: text('resource_type').notNull(), // 'patient', 'appointment', 'medical_record'
  resourceId: text('resource_id').notNull(),
  ipAddress: text('ip_address'),
  payloadJson: text('payload_json'),
  timestamp: text('timestamp').notNull().$defaultFn(() => new Date().toISOString()),
});
