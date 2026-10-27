#!/usr/bin/env node
import { createClient as createLibsqlClient } from '@libsql/client';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

// Cargar variables de entorno desde .env o .env.local si existen
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const TENANT_SCHEMA_DDL = `
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
`;

function toIso(val, fallback) {
  if (!val) return fallback || new Date().toISOString();
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? (fallback || new Date().toISOString()) : d.toISOString();
  } catch {
    return fallback || new Date().toISOString();
  }
}

async function run() {
  console.log('🚀 Iniciando script de exportación Supabase -> Turso...');

  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  // Supabase Client
  const sbUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://qkjjyiymzaouqslzbxrp.supabase.co';
  const sbKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFramp5aXltemFvdXFzbHpieHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MzMwNTAsImV4cCI6MjA3NjAwOTA1MH0.u6bPHPxs_Rf63A9kIsIKdZVYIQiAjKojIcVgCEdd5RM';

  if (!sbUrl || !sbKey) {
    console.error('❌ Error: Variables VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY no encontradas.');
    process.exit(1);
  }

  const supabase = createSupabaseClient(sbUrl, sbKey);

  // Turso Client
  const tursoUrl = process.env.TURSO_DATABASE_URL || 'file:turso-export-demo.db';
  const tursoToken = process.env.TURSO_AUTH_TOKEN || undefined;

  console.log(`🔌 Conectando a Turso: ${tursoUrl.startsWith('file:') ? tursoUrl : tursoUrl.slice(0, 20) + '...'}`);
  const libsql = createLibsqlClient({ url: tursoUrl, authToken: tursoToken });

  // 1. Inicializar Esquema en Turso
  if (!isDryRun) {
    console.log('📦 Inicializando esquema de tablas en Turso...');
    await libsql.executeMultiple(TENANT_SCHEMA_DDL);
    console.log('✅ Esquema DDL aplicado correctamente.');
  }

  // 2. Extraer Workspace objetivo
  let targetWorkspaceId = null;
  const wsArgIdx = args.indexOf('--workspace-id');
  if (wsArgIdx !== -1 && args[wsArgIdx + 1]) {
    targetWorkspaceId = args[wsArgIdx + 1];
  } else {
    // Tomar primer paciente o sucursal para obtener workspaceId
    const { data: samplePx } = await supabase.from('pacientes').select('workspace_id').not('workspace_id', 'is', null).limit(1);
    if (samplePx && samplePx[0]?.workspace_id) {
      targetWorkspaceId = samplePx[0].workspace_id;
    } else {
      targetWorkspaceId = 'ws_default_vitalist';
    }
  }

  console.log(`🏢 Workspace seleccionado: ${targetWorkspaceId} ${isDryRun ? '(MODO DRY RUN - Sin escritura)' : ''}`);

  const counts = { branches: 0, patients: 0, appointments: 0, prescriptions: 0, invoices: 0 };
  const defaultBranchId = `br_main_${targetWorkspaceId}`;

  // 3. Exportar Sucursales
  console.log('📍 Extrayendo sucursales...');
  const { data: sucursales } = await supabase.from('sucursales').select('*').eq('workspace_id', targetWorkspaceId);
  const branchList = (sucursales && sucursales.length > 0) ? sucursales : [
    {
      id: defaultBranchId,
      nombre: 'Sede Principal',
      direccion: 'Sede Central',
      telefono: null,
      email: null,
      es_principal: true,
      activo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ];

  for (const b of branchList) {
    counts.branches++;
    if (!isDryRun) {
      await libsql.execute({
        sql: `INSERT OR REPLACE INTO branches (id, name, address, phone, email, is_main, is_active, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          b.id,
          b.nombre || 'Sede Principal',
          b.direccion || null,
          b.telefono || null,
          b.email || null,
          b.es_principal ? 1 : 0,
          b.activo !== false ? 1 : 0,
          toIso(b.created_at),
          toIso(b.updated_at),
        ],
      });
    }
  }
  console.log(`✅ ${counts.branches} sucursales procesadas.`);

  // 4. Exportar Pacientes
  console.log('👥 Extrayendo pacientes...');
  const { data: pacientes } = await supabase.from('pacientes').select('*').eq('workspace_id', targetWorkspaceId);
  if (pacientes) {
    for (const p of pacientes) {
      counts.patients++;
      if (!isDryRun) {
        const docNum = p.numero_documento || p.cedula || `PX-${p.id.slice(0, 8)}`;
        const status = (p.status_px === 'inactivo' || p.motivo_inactividad) ? 'inactive' : 'active';
        await libsql.execute({
          sql: `INSERT OR REPLACE INTO patients (
                  id, branch_id, first_name, last_name, doc_type, doc_number,
                  birth_date, gender, phone, email, address, emergency_contact_name,
                  emergency_contact_phone, notes, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            p.id,
            p.sucursal_id || defaultBranchId,
            p.nombre || 'Sin Nombre',
            p.apellido || 'Sin Apellido',
            'cedula',
            docNum,
            p.fecha_nacimiento || null,
            p.sexo ? (p.sexo.toLowerCase().startsWith('m') ? 'male' : 'female') : null,
            p.contacto_px || p.numero_principal || null,
            p.email_px || null,
            p.direccion_domicilio || null,
            p.nombre_cuidador || null,
            p.contacto_cuidador || null,
            p.historia_medica_basica || null,
            status,
            toIso(p.created_at),
            toIso(p.updated_at),
          ],
        });
      }
    }
  }
  console.log(`✅ ${counts.patients} pacientes procesados.`);

  // 5. Exportar Citas
  console.log('📅 Extrayendo citas y visitas...');
  const { data: visitas } = await supabase.from('control_visitas').select('*').eq('workspace_id', targetWorkspaceId);
  if (visitas) {
    for (const v of visitas) {
      if (!v.paciente_id) continue;
      counts.appointments++;
      if (!isDryRun) {
        const start = toIso(v.fecha_hora_visita);
        const end = new Date(new Date(start).getTime() + 30 * 60000).toISOString();
        await libsql.execute({
          sql: `INSERT OR REPLACE INTO appointments (
                  id, branch_id, patient_id, professional_id, service_name,
                  start_time, end_time, status, notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            v.id,
            v.sucursal_id || defaultBranchId,
            v.paciente_id,
            v.profesional_id || 'usr_profesional',
            v.motivo_visita || v.tipo_visita || 'Consulta Médica',
            start,
            end,
            'scheduled',
            v.notas_visita || null,
            toIso(v.created_at),
            toIso(v.updated_at),
          ],
        });
      }
    }
  }
  console.log(`✅ ${counts.appointments} citas procesadas.`);

  // 6. Exportar Recetas
  console.log('💊 Extrayendo recetas médicas...');
  const { data: recetas } = await supabase.from('recetas').select('*, recetas_items(*)').eq('workspace_id', targetWorkspaceId);
  if (recetas) {
    for (const rx of recetas) {
      if (!rx.paciente_id) continue;
      counts.prescriptions++;
      if (!isDryRun) {
        const meds = (rx.recetas_items || []).map((it) => ({
          name: it.medicamento,
          dosage: it.dosis || '1 dosis',
          frequency: it.frecuencia || 'Cada 8h',
          duration: it.duracion || '7 días',
        }));
        await libsql.execute({
          sql: `INSERT OR REPLACE INTO prescriptions (
                  id, patient_id, professional_id, medications_json, instructions, valid_until, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [
            rx.id,
            rx.paciente_id,
            rx.profesional_id || 'usr_profesional',
            JSON.stringify(meds),
            rx.indicaciones_generales || null,
            null,
            toIso(rx.created_at),
          ],
        });
      }
    }
  }
  console.log(`✅ ${counts.prescriptions} recetas procesadas.`);

  // 7. Exportar Facturas
  console.log('🧾 Extrayendo facturas...');
  const { data: facturas } = await supabase.from('facturas').select('*').eq('workspace_id', targetWorkspaceId);
  if (facturas) {
    for (const f of facturas) {
      if (!f.paciente_id) continue;
      counts.invoices++;
      if (!isDryRun) {
        const total = Number(f.monto_total || 0);
        await libsql.execute({
          sql: `INSERT OR REPLACE INTO invoices (
                  id, branch_id, patient_id, invoice_number, issue_date,
                  due_date, subtotal, discount, tax, total, status,
                  payment_method, notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            f.id,
            defaultBranchId,
            f.paciente_id,
            f.numero_factura || `FAC-${f.id.slice(0, 8)}`,
            toIso(f.fecha_emision),
            f.fecha_vencimiento ? toIso(f.fecha_vencimiento) : null,
            total,
            0,
            0,
            total,
            'pending',
            f.metodo_pago || 'cash',
            f.notas || f.descripcion || null,
            toIso(f.created_at),
            toIso(f.updated_at),
          ],
        });
      }
    }
  }
  console.log(`✅ ${counts.invoices} facturas procesadas.`);

  // 8. Bitácora de Auditoría
  if (!isDryRun) {
    await libsql.execute({
      sql: `INSERT INTO audit_logs (id, actor_id, action, resource_type, resource_id, ip_address, payload_json, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        `aud_cli_${Date.now()}`,
        'cli_migration_script',
        'export',
        'workspace_data',
        targetWorkspaceId,
        'local_cli',
        JSON.stringify(counts),
        new Date().toISOString(),
      ],
    });
  }

  console.log('\n=============================================');
  console.log('🎉 EXPORTACIÓN A TURSO COMPLETADA CON ÉXITO');
  console.log('=============================================');
  console.table(counts);
}

run().catch((err) => {
  console.error('💥 Error durante la exportación a Turso:', err);
  process.exit(1);
});
