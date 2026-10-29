import type { Client } from '@libsql/client';

/**
 * Script DDL completo para inicializar las tablas de un tenant en Turso / LibSQL.
 * Idempotente (CREATE TABLE IF NOT EXISTS e índices).
 */
export const TENANT_SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  is_main INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  branch_id TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  doc_type TEXT NOT NULL DEFAULT 'cedula',
  doc_number TEXT NOT NULL,
  birth_date TEXT,
  gender TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  blood_type TEXT,
  allergies TEXT,
  associated_clinic TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  deleted_by TEXT,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  professional_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  cancellation_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE IF NOT EXISTS medical_records (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  professional_id TEXT NOT NULL,
  consultation_date TEXT NOT NULL,
  reason TEXT NOT NULL,
  vital_signs_json TEXT,
  physical_exam TEXT,
  diagnosis_cie10 TEXT,
  diagnosis_text TEXT,
  treatment_plan TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id TEXT PRIMARY KEY,
  medical_record_id TEXT,
  patient_id TEXT NOT NULL,
  professional_id TEXT NOT NULL,
  medications_json TEXT NOT NULL,
  instructions TEXT,
  valid_until TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (medical_record_id) REFERENCES medical_records(id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  issue_date TEXT NOT NULL,
  due_date TEXT,
  subtotal REAL NOT NULL,
  discount REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  discount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  current_stock REAL NOT NULL DEFAULT 0,
  min_stock REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'unidad',
  unit_cost REAL NOT NULL DEFAULT 0,
  sale_price REAL NOT NULL DEFAULT 0,
  expiration_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  inventory_item_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  movement_type TEXT NOT NULL,
  quantity REAL NOT NULL,
  reason TEXT,
  actor_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  ip_address TEXT,
  payload_json TEXT,
  timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hospital_wings (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  name TEXT NOT NULL,
  floor_number INTEGER NOT NULL,
  service_type TEXT NOT NULL,
  bed_capacity INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS hospital_beds (
  id TEXT PRIMARY KEY,
  wing_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  bed_number TEXT NOT NULL,
  bed_type TEXT NOT NULL DEFAULT 'estandar',
  status TEXT NOT NULL DEFAULT 'disponible',
  current_patient_id TEXT,
  isolation_type TEXT,
  last_cleaned_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (wing_id) REFERENCES hospital_wings(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (current_patient_id) REFERENCES patients(id)
);

CREATE TABLE IF NOT EXISTS staff_shifts (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  shift_date TEXT NOT NULL,
  shift_type TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'programado',
  handover_completed INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS shift_handover_sbar (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  shift_id TEXT,
  handing_over_user_id TEXT NOT NULL,
  receiving_user_id TEXT NOT NULL,
  handover_date TEXT NOT NULL,
  crash_cart_checked INTEGER NOT NULL DEFAULT 0,
  crash_cart_sealed INTEGER NOT NULL DEFAULT 1,
  census_total_beds INTEGER NOT NULL DEFAULT 0,
  census_occupied_beds INTEGER NOT NULL DEFAULT 0,
  census_critically_ill INTEGER NOT NULL DEFAULT 0,
  shift_incidents_summary TEXT,
  handing_over_signature_svg TEXT,
  receiving_signature_svg TEXT,
  status TEXT NOT NULL DEFAULT 'borrador',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (shift_id) REFERENCES staff_shifts(id)
);

CREATE TABLE IF NOT EXISTS sbar_patient_notes (
  id TEXT PRIMARY KEY,
  handover_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  bed_number TEXT NOT NULL,
  situation TEXT NOT NULL,
  background TEXT NOT NULL,
  assessment TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  news2_score INTEGER NOT NULL DEFAULT 0,
  alert_level TEXT NOT NULL DEFAULT 'bajo',
  created_at TEXT NOT NULL,
  FOREIGN KEY (handover_id) REFERENCES shift_handover_sbar(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE IF NOT EXISTS surgical_consents (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  physician_user_id TEXT NOT NULL,
  procedure_name TEXT NOT NULL,
  procedure_risks TEXT NOT NULL,
  alternative_treatments TEXT,
  patient_signature_svg TEXT NOT NULL,
  physician_signature_svg TEXT NOT NULL,
  witness_name TEXT,
  witness_signature_svg TEXT,
  signed_at TEXT NOT NULL,
  valid INTEGER NOT NULL DEFAULT 1,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS high_risk_drug_verifications (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  nurse1_user_id TEXT NOT NULL,
  nurse1_pin_verified INTEGER NOT NULL DEFAULT 1,
  nurse2_user_id TEXT NOT NULL,
  nurse2_pin_verified INTEGER NOT NULL DEFAULT 1,
  drug_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  concentration TEXT NOT NULL,
  infusion_rate TEXT NOT NULL,
  route TEXT NOT NULL,
  pump_channel TEXT,
  verified_at TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS blood_bank_units (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  unit_code TEXT NOT NULL UNIQUE,
  component_type TEXT NOT NULL,
  blood_type TEXT NOT NULL,
  volume_ml INTEGER NOT NULL,
  donation_date TEXT NOT NULL,
  expiration_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disponible',
  donor_doc_number TEXT,
  serology_tested INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS transfusion_adverse_reactions (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  reporting_nurse_user_id TEXT NOT NULL,
  reaction_date TEXT NOT NULL,
  symptom_onset_minutes INTEGER NOT NULL,
  symptoms_json TEXT NOT NULL,
  severity_level TEXT NOT NULL,
  imputability TEXT NOT NULL,
  outcome TEXT,
  corrective_actions TEXT,
  notified_to_health_authority INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (unit_id) REFERENCES blood_bank_units(id),
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE IF NOT EXISTS dicom_diagnostic_reports (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  patient_id TEXT,
  study_instance_uid TEXT NOT NULL,
  modality TEXT NOT NULL,
  technique TEXT,
  comparison_text TEXT,
  structured_findings TEXT NOT NULL,
  conclusion TEXT NOT NULL,
  rads_classification TEXT,
  cobb_angle REAL,
  caliper_mm REAL,
  hounsfield_density_hu INTEGER,
  radiologist_user_id TEXT NOT NULL,
  radiologist_signature TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE INDEX IF NOT EXISTS idx_patients_doc ON patients(doc_number);
CREATE INDEX IF NOT EXISTS idx_appointments_start ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_beds_status ON hospital_beds(status);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON staff_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_blood_units_code ON blood_bank_units(unit_code);
CREATE INDEX IF NOT EXISTS idx_blood_units_type ON blood_bank_units(blood_type);
`;

/**
 * Asegura que todas las tablas del tenant existan en la base de datos Turso
 */
export async function ensureTenantTables(client: Client): Promise<void> {
  await client.executeMultiple(TENANT_SCHEMA_DDL);
}
