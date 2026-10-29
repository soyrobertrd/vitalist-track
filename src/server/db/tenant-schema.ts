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

// 13. Hospital Wings & Floors (Edificación Hospitalaria)
export const hospitalWings = sqliteTable('hospital_wings', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').notNull().references(() => branches.id),
  name: text('name').notNull(),
  floorNumber: integer('floor_number').notNull(),
  serviceType: text('service_type').notNull(), // 'uci', 'urgencias', 'hospitalizacion', 'quirofano'
  bedCapacity: integer('bed_capacity').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 14. Hospital Beds (Censo de Camas)
export const hospitalBeds = sqliteTable('hospital_beds', {
  id: text('id').primaryKey(),
  wingId: text('wing_id').notNull().references(() => hospitalWings.id),
  branchId: text('branch_id').notNull().references(() => branches.id),
  bedNumber: text('bed_number').notNull(),
  bedType: text('bed_type').notNull().default('estandar'), // 'estandar', 'uci_critica', 'aislamiento_infeccioso', 'cuna'
  status: text('status', {
    enum: ['disponible', 'ocupada', 'limpieza', 'aislamiento', 'mantenimiento'],
  }).default('disponible').notNull(),
  currentPatientId: text('current_patient_id').references(() => patients.id),
  isolationType: text('isolation_type'), // 'contacto', 'gotitas', 'aerosoles', null
  lastCleanedAt: text('last_cleaned_at'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 15. Staff Shifts & Rostering (Turnos del Personal Médico y Enfermería)
export const staffShifts = sqliteTable('staff_shifts', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').notNull().references(() => branches.id),
  userId: text('user_id').notNull(),
  role: text('role', { enum: ['medico', 'enfermera', 'coordinador', 'tecnico'] }).notNull(),
  shiftDate: text('shift_date').notNull(),
  shiftType: text('shift_type', { enum: ['dia', 'noche', 'guardia_24h'] }).notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  department: text('department').notNull(),
  status: text('status', {
    enum: ['programado', 'en_curso', 'completado', 'ausente', 'intercambiado'],
  }).default('programado').notNull(),
  handOverCompleted: integer('handover_completed', { mode: 'boolean' }).default(false).notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 16. Shift Handover Protocol SBAR (Pases de Guardia Digital)
export const shiftHandoverSbar = sqliteTable('shift_handover_sbar', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').notNull().references(() => branches.id),
  shiftId: text('shift_id').references(() => staffShifts.id),
  handingOverUserId: text('handing_over_user_id').notNull(),
  receivingUserId: text('receiving_user_id').notNull(),
  handoverDate: text('handover_date').notNull(),
  crashCartChecked: integer('crash_cart_checked', { mode: 'boolean' }).default(false).notNull(),
  crashCartSealed: integer('crash_cart_sealed', { mode: 'boolean' }).default(true).notNull(),
  censusTotalBeds: integer('census_total_beds').notNull().default(0),
  censusOccupiedBeds: integer('census_occupied_beds').notNull().default(0),
  censusCriticallyIll: integer('census_critically_ill').notNull().default(0),
  shiftIncidentsSummary: text('shift_incidents_summary'),
  handingOverSignatureSvg: text('handing_over_signature_svg'),
  receivingSignatureSvg: text('receiving_signature_svg'),
  status: text('status', { enum: ['borrador', 'firmado', 'archivado'] }).default('borrador').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 17. SBAR Patient Handover Notes (Detalle Clínico SBAR por Paciente)
export const sbarPatientNotes = sqliteTable('sbar_patient_notes', {
  id: text('id').primaryKey(),
  handoverId: text('handover_id').notNull().references(() => shiftHandoverSbar.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => patients.id),
  bedNumber: text('bed_number').notNull(),
  situation: text('situation').notNull(),
  background: text('background').notNull(),
  assessment: text('assessment').notNull(),
  recommendation: text('recommendation').notNull(),
  news2Score: integer('news2_score').default(0).notNull(),
  alertLevel: text('alert_level', { enum: ['bajo', 'medio', 'alto', 'critico'] }).default('bajo').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 18. Surgical & Invasive Consents (Consentimientos Informados Digitales)
export const surgicalConsents = sqliteTable('surgical_consents', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id),
  branchId: text('branch_id').notNull().references(() => branches.id),
  physicianUserId: text('physician_user_id').notNull(),
  procedureName: text('procedure_name').notNull(),
  procedureRisks: text('procedure_risks').notNull(),
  alternativeTreatments: text('alternative_treatments'),
  patientSignatureSvg: text('patient_signature_svg').notNull(),
  physicianSignatureSvg: text('physician_signature_svg').notNull(),
  witnessName: text('witness_name'),
  witnessSignatureSvg: text('witness_signature_svg'),
  signedAt: text('signed_at').notNull().$defaultFn(() => new Date().toISOString()),
  valid: integer('valid', { mode: 'boolean' }).default(true).notNull(),
  revokedAt: text('revoked_at'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 19. High-Risk Drug Independent Double-Check (ISMP Protocol)
export const highRiskDrugVerifications = sqliteTable('high_risk_drug_verifications', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id),
  branchId: text('branch_id').notNull().references(() => branches.id),
  nurse1UserId: text('nurse1_user_id').notNull(),
  nurse1PinVerified: integer('nurse1_pin_verified', { mode: 'boolean' }).default(true).notNull(),
  nurse2UserId: text('nurse2_user_id').notNull(),
  nurse2PinVerified: integer('nurse2_pin_verified', { mode: 'boolean' }).default(true).notNull(),
  drugName: text('drug_name').notNull(),
  dosage: text('dosage').notNull(),
  concentration: text('concentration').notNull(),
  infusionRate: text('infusion_rate').notNull(),
  route: text('route').notNull(), // 'iv_continua', 'iv_bolo', 'epidural'
  pumpChannel: text('pump_channel'),
  verifiedAt: text('verified_at').notNull().$defaultFn(() => new Date().toISOString()),
  notes: text('notes'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 20. Blood Bank Units (Banco de Sangre y Hemocomponentes)
export const bloodBankUnits = sqliteTable('blood_bank_units', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').notNull().references(() => branches.id),
  unitCode: text('unit_code').notNull().unique(),
  componentType: text('component_type', {
    enum: ['globulos_rojos', 'plasma_fresco', 'plaquetas', 'crioprecipitados'],
  }).notNull(),
  bloodType: text('blood_type', {
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  }).notNull(),
  volumeMl: integer('volume_ml').notNull(),
  donationDate: text('donation_date').notNull(),
  expirationDate: text('expiration_date').notNull(),
  status: text('status', {
    enum: ['disponible', 'reservada', 'transfundida', 'descartada', 'cuarentena'],
  }).default('disponible').notNull(),
  donorDocNumber: text('donor_doc_number'),
  serologyTested: integer('serology_tested', { mode: 'boolean' }).default(true).notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 21. Transfusion Adverse Reactions (Hemovigilancia RAT)
export const transfusionAdverseReactions = sqliteTable('transfusion_adverse_reactions', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').notNull().references(() => branches.id),
  unitId: text('unit_id').notNull().references(() => bloodBankUnits.id),
  patientId: text('patient_id').notNull().references(() => patients.id),
  reportingNurseUserId: text('reporting_nurse_user_id').notNull(),
  reactionDate: text('reaction_date').notNull(),
  symptomOnsetMinutes: integer('symptom_onset_minutes').notNull(),
  symptomsJson: text('symptoms_json').notNull(),
  severityLevel: text('severity_level', {
    enum: ['leve', 'moderada', 'grave', 'amenaza_vital'],
  }).notNull(),
  imputability: text('imputability', {
    enum: ['definitiva', 'probable', 'posible', 'dudosa'],
  }).notNull(),
  outcome: text('outcome'),
  correctiveActions: text('corrective_actions'),
  notifiedToHealthAuthority: integer('notified_to_health_authority', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 22. DICOM Diagnostic Reports & Measurements
export const dicomDiagnosticReports = sqliteTable('dicom_diagnostic_reports', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').notNull().references(() => branches.id),
  patientId: text('patient_id').references(() => patients.id),
  studyInstanceUid: text('study_instance_uid').notNull(),
  modality: text('modality').notNull(),
  technique: text('technique'),
  comparisonText: text('comparison_text'),
  structuredFindings: text('structured_findings').notNull(),
  conclusion: text('conclusion').notNull(),
  radsClassification: text('rads_classification'),
  cobbAngle: real('cobb_angle'),
  caliperMm: real('caliper_mm'),
  hounsfieldDensityHu: integer('hounsfield_density_hu'),
  radiologistUserId: text('radiologist_user_id').notNull(),
  radiologistSignature: text('radiologist_signature'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// ==========================================
// TIPOS DE INFERENCIA DRIZZLE
// ==========================================
export type Branch = typeof branches.$inferSelect;
export type Patient = typeof patients.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type Prescription = typeof prescriptions.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type HospitalWing = typeof hospitalWings.$inferSelect;
export type HospitalBed = typeof hospitalBeds.$inferSelect;
export type StaffShift = typeof staffShifts.$inferSelect;
export type ShiftHandoverSbar = typeof shiftHandoverSbar.$inferSelect;
export type SbarPatientNote = typeof sbarPatientNotes.$inferSelect;
export type SurgicalConsent = typeof surgicalConsents.$inferSelect;
export type HighRiskDrugVerification = typeof highRiskDrugVerifications.$inferSelect;
export type BloodBankUnit = typeof bloodBankUnits.$inferSelect;
export type TransfusionAdverseReaction = typeof transfusionAdverseReactions.$inferSelect;
export type DicomDiagnosticReport = typeof dicomDiagnosticReports.$inferSelect;

