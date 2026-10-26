import { createClient } from '@libsql/client';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function seed() {
  console.log('🚀 Iniciando creación de usuario local y entorno de pruebas en LibSQL/SQLite...');

  // 1. Control Plane Database (local-control-plane.db)
  const cpClient = createClient({ url: 'file:local-control-plane.db' });

  console.log('  -> Inicializando esquema de Control Plane...');
  await cpClient.execute(`
    CREATE TABLE IF NOT EXISTS clinics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      phone TEXT,
      subdomain TEXT,
      custom_domain TEXT,
      custom_domain_verified INTEGER NOT NULL DEFAULT 0,
      plan TEXT NOT NULL DEFAULT 'solo',
      status TEXT NOT NULL DEFAULT 'trialing',
      trial_ends_at TEXT,
      max_branches INTEGER NOT NULL DEFAULT 1,
      max_users INTEGER NOT NULL DEFAULT 3,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Migraciones idempotentes de columnas nuevas si la tabla ya existía
  try { await cpClient.execute("ALTER TABLE clinics ADD COLUMN subdomain TEXT;"); } catch {}
  try { await cpClient.execute("ALTER TABLE clinics ADD COLUMN custom_domain TEXT;"); } catch {}
  try { await cpClient.execute("ALTER TABLE clinics ADD COLUMN custom_domain_verified INTEGER DEFAULT 0;"); } catch {}
  try { await cpClient.execute("ALTER TABLE clinics ADD COLUMN trial_ends_at TEXT;"); } catch {}

  await cpClient.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      system_role TEXT NOT NULL DEFAULT 'user',
      two_factor_enabled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await cpClient.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      active_clinic_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await cpClient.execute(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      expires_at TEXT,
      password TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await cpClient.execute(`
    CREATE TABLE IF NOT EXISTS verifications (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await cpClient.execute(`
    CREATE TABLE IF NOT EXISTS memberships (
      id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await cpClient.execute(`
    CREATE TABLE IF NOT EXISTS clinic_databases (
      id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL UNIQUE REFERENCES clinics(id) ON DELETE CASCADE,
      turso_db_name TEXT NOT NULL,
      turso_db_url TEXT NOT NULL,
      turso_auth_token_encrypted TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'provisioning',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await cpClient.execute(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      clinic_id TEXT,
      actor_id TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      ip_address TEXT,
      payload_json TEXT,
      timestamp TEXT NOT NULL
    );
  `);

  const now = new Date().toISOString();
  const userId = 'usr_robert_robles';
  const email = 'robertgrobles@gmail.com';
  const plainPassword = '12345678';
  const passwordHash = hashPassword(plainPassword);
  const clinicId = 'c_vitalist_test';

  // Seed Clinic (con subdominio y dominio personalizado activo)
  const trialEnds = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await cpClient.execute({
    sql: `
      INSERT INTO clinics (id, name, slug, email, phone, subdomain, custom_domain, custom_domain_verified, plan, status, trial_ends_at, max_branches, max_users, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        slug = excluded.slug,
        email = excluded.email,
        subdomain = excluded.subdomain,
        custom_domain = excluded.custom_domain,
        custom_domain_verified = excluded.custom_domain_verified,
        plan = 'business',
        trial_ends_at = excluded.trial_ends_at,
        updated_at = excluded.updated_at
    `,
    args: [
      clinicId,
      'Clínica Vitalist Principal',
      'vitalist-principal',
      email,
      '809-555-0100',
      'vitalist-principal', // Subdominio: vitalist-principal.vitalisttrack.com
      'citas.vitalistprincipal.com', // Dominio personalizado propio
      1, // Verificado
      'business', // Plan de pago con soporte de dominio
      'active',
      trialEnds,
      5,
      20,
      now,
      now
    ]
  });

  // Seed User
  await cpClient.execute({
    sql: `
      INSERT INTO users (id, name, email, email_verified, image, system_role, two_factor_enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        email = excluded.email,
        email_verified = 1,
        system_role = 'superadmin',
        updated_at = excluded.updated_at
    `,
    args: [userId, 'Robert Robles', email, 1, null, 'superadmin', 0, now, now]
  });

  // Seed Account (Credentials)
  await cpClient.execute({
    sql: `
      INSERT INTO accounts (id, user_id, account_id, provider_id, password, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        password = excluded.password,
        updated_at = excluded.updated_at
    `,
    args: [`acc_${userId}`, userId, email, 'credential', passwordHash, now, now]
  });

  // Seed Membership (Owner)
  await cpClient.execute({
    sql: `
      INSERT INTO memberships (id, clinic_id, user_id, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        role = 'owner',
        status = 'active',
        updated_at = excluded.updated_at
    `,
    args: [`mem_${userId}_${clinicId}`, clinicId, userId, 'owner', 'active', now, now]
  });

  // Seed Clinic Database mapping (points to file:local-tenant.db)
  await cpClient.execute({
    sql: `
      INSERT INTO clinic_databases (id, clinic_id, turso_db_name, turso_db_url, turso_auth_token_encrypted, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(clinic_id) DO UPDATE SET
        turso_db_url = excluded.turso_db_url,
        status = 'active',
        updated_at = excluded.updated_at
    `,
    args: [`cdb_${clinicId}`, clinicId, 'local-tenant', 'file:local-tenant.db', 'local-token-dev', 'active', now, now]
  });

  console.log('  ✅ Usuario y Control Plane creados con éxito:');
  console.log(`     👤 Email: ${email}`);
  console.log(`     🔑 Password: ${plainPassword}`);
  console.log(`     🏢 Clínica ID: ${clinicId} (Rol: owner)`);

  // 2. Tenant Database (local-tenant.db)
  console.log('\n  -> Inicializando esquema de Tenant Database (local-tenant.db)...');
  const tenantClient = createClient({ url: 'file:local-tenant.db' });

  await tenantClient.execute(`
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
  `);

  await tenantClient.execute(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      branch_id TEXT REFERENCES branches(id),
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
      deleted_by TEXT
    );
  `);

  try { await tenantClient.execute("ALTER TABLE patients ADD COLUMN associated_clinic TEXT;"); } catch {}

  await tenantClient.execute(`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL REFERENCES branches(id),
      patient_id TEXT NOT NULL REFERENCES patients(id),
      professional_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled',
      notes TEXT,
      cancellation_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Seed default Branch
  await tenantClient.execute({
    sql: `
      INSERT INTO branches (id, name, address, phone, email, is_main, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name
    `,
    args: ['br_santo_domingo', 'Sede Central Santo Domingo', 'Av. Winston Churchill 1099', '809-555-0101', 'sd@vitalist.com', 1, 1, now, now]
  });

  // Seed test Patient
  await tenantClient.execute({
    sql: `
      INSERT INTO patients (id, branch_id, first_name, last_name, doc_type, doc_number, phone, email, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET first_name = excluded.first_name
    `,
    args: ['pat_demo_01', 'br_santo_domingo', 'Carlos', 'Santana Gómez', 'cedula', '402-9876543-2', '829-555-0202', 'carlos.santana@example.com', 'active', now, now]
  });

  // Seed test Appointment
  await tenantClient.execute({
    sql: `
      INSERT INTO appointments (id, branch_id, patient_id, professional_id, service_name, start_time, end_time, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET service_name = excluded.service_name
    `,
    args: ['app_demo_01', 'br_santo_domingo', 'pat_demo_01', userId, 'Consulta Medicina Preventiva', '2026-11-02T10:00:00.000Z', '2026-11-02T10:30:00.000Z', 'scheduled', 'Chequeo general inicial', now, now]
  });

  console.log('  ✅ Base de datos de la clínica (Tenant) inicializada:');
  console.log('     🏢 Sede: Sede Central Santo Domingo (br_santo_domingo)');
  console.log('     🩺 Paciente demo: Carlos Santana Gómez (pat_demo_01)');
  console.log('     📅 Cita demo: Consulta Medicina Preventiva (app_demo_01)');

  cpClient.close();
  tenantClient.close();

  // 3. Update .env with TURSO_CONTROL_PLANE_URL if missing
  const envPath = path.resolve('.env');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  if (!envContent.includes('TURSO_CONTROL_PLANE_URL')) {
    envContent += `\nTURSO_CONTROL_PLANE_URL="file:local-control-plane.db"\n`;
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('  ✅ .env actualizado con TURSO_CONTROL_PLANE_URL="file:local-control-plane.db"');
  }

  console.log('\n🎉 ¡Entorno y usuario local creados y listos para pruebas!');
}

seed().catch((err) => {
  console.error('\n❌ Error al crear usuario local:', err);
  process.exit(1);
});
