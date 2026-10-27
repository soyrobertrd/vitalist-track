/**
 * Seed Local Completo para Pruebas en Vivo Autónomas
 * Inserta en local-control-plane.db y local-tenant.db:
 * - 6 Centros de Salud (uno por cada vertical: clinica, dental, aesthetic, recovery, vision, psicologia)
 * - 4 Planes (Básico $15, Pro Consultorios $35, Clínica Plus $85, Business Enterprise $165)
 * - 6 Doctores Especialistas
 * - Pacientes de prueba con clínicas de origen
 * - Citas y Consultas (ambulatorias por defecto en consultorio / domiciliarias cuando aplique)
 */

import { createClient } from '@libsql/client';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function runSeed() {
  console.log('🚀 Iniciando Seed Completo Multi-Vertical para Pruebas en Vivo...');

  // 1. Control Plane (local-control-plane.db)
  const cpClient = createClient({ url: 'file:local-control-plane.db' });

  console.log('  -> Creando/actualizando tablas de Control Plane...');
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
      status TEXT NOT NULL DEFAULT 'active',
      trial_ends_at TEXT,
      max_branches INTEGER NOT NULL DEFAULT 1,
      max_users INTEGER NOT NULL DEFAULT 3,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

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
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const now = new Date().toISOString();
  const userId = 'usr_robert_robles';
  const email = 'robertgrobles@gmail.com';

  // Seed Usuario Maestro
  await cpClient.execute({
    sql: `
      INSERT INTO users (id, name, email, email_verified, image, system_role, two_factor_enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, email = excluded.email
    `,
    args: [userId, 'Dr. Robert Robles', email, 1, null, 'superadmin', 0, now, now]
  });

  // Los 6 Centros (1 por vertical, cubriendo los 4 planes)
  const centros = [
    {
      id: 'c_clinica_metropolitano',
      name: 'Hospital Metropolitano Especializado',
      slug: 'hospital-metropolitano',
      plan: 'business', // USD 165
      subdomain: 'metropolitano',
      custom_domain: 'citas.metropolitano.com',
      verified: 1,
      branches: 5,
      users: 50,
    },
    {
      id: 'c_dentalcare_pro',
      name: 'DentalCare & Ortodoncia Avanzada',
      slug: 'dentalcare-pro',
      plan: 'pro', // USD 35 (Pro Consultorios)
      subdomain: null, // Pro Consultorios NO lleva subdominio
      custom_domain: null,
      verified: 0,
      branches: 1,
      users: 3,
    },
    {
      id: 'c_aesthetic_studio',
      name: 'Aesthetic & Skin Studio',
      slug: 'aesthetic-studio',
      plan: 'pro', // USD 35 (Pro Consultorios)
      subdomain: null,
      custom_domain: null,
      verified: 0,
      branches: 1,
      users: 3,
    },
    {
      id: 'c_recoverycare_rehab',
      name: 'RecoveryCare & Rehabilitación Activa',
      slug: 'recoverycare-rehab',
      plan: 'plus', // USD 85 (Clínica Plus)
      subdomain: 'recoverycare',
      custom_domain: 'rehab.recoverycare.com',
      verified: 1,
      branches: 2,
      users: 8,
    },
    {
      id: 'c_vistaplus_optica',
      name: 'Óptica & Oftalmología VistaPlus',
      slug: 'vistaplus-optica',
      plan: 'solo', // USD 15 (Básico)
      subdomain: null,
      custom_domain: null,
      verified: 0,
      branches: 1,
      users: 1,
    },
    {
      id: 'c_mentesana_psico',
      name: 'Centro Bienestar Emocional & Mente Sana',
      slug: 'mentesana-psicologia',
      plan: 'solo', // USD 15 (Básico)
      subdomain: null,
      custom_domain: null,
      verified: 0,
      branches: 1,
      users: 1,
    },
  ];

  console.log('  -> Insertando 6 centros de salud en Control Plane...');
  for (const c of centros) {
    await cpClient.execute({
      sql: `
        INSERT INTO clinics (id, name, slug, email, phone, subdomain, custom_domain, custom_domain_verified, plan, status, max_branches, max_users, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          slug = excluded.slug,
          plan = excluded.plan,
          subdomain = excluded.subdomain,
          custom_domain = excluded.custom_domain,
          custom_domain_verified = excluded.custom_domain_verified,
          updated_at = excluded.updated_at
      `,
      args: [
        c.id,
        c.name,
        c.slug,
        email,
        '809-555-0100',
        c.subdomain,
        c.custom_domain,
        c.verified,
        c.plan,
        'active',
        c.branches,
        c.users,
        now,
        now,
      ]
    });

    // Vincular membresía Owner
    await cpClient.execute({
      sql: `
        INSERT INTO memberships (id, clinic_id, user_id, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET role = 'owner', updated_at = excluded.updated_at
      `,
      args: [`mem_${userId}_${c.id}`, c.id, userId, 'owner', 'active', now, now]
    });

    // Mapeo de base de datos a local-tenant.db
    await cpClient.execute({
      sql: `
        INSERT INTO clinic_databases (id, clinic_id, turso_db_name, turso_db_url, turso_auth_token_encrypted, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(clinic_id) DO UPDATE SET turso_db_url = excluded.turso_db_url, updated_at = excluded.updated_at
      `,
      args: [`cdb_${c.id}`, c.id, 'local-tenant', 'file:local-tenant.db', 'local-token-dev', 'active', now, now]
    });
  }

  // 2. Tenant Database (local-tenant.db)
  console.log('\n  -> Creando/actualizando tablas de Tenant Database (local-tenant.db)...');
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
    CREATE TABLE IF NOT EXISTS professionals (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      specialty TEXT NOT NULL,
      license_number TEXT,
      phone TEXT,
      email TEXT,
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
      appointment_type TEXT NOT NULL DEFAULT 'ambulatorio',
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled',
      confirmation_status TEXT NOT NULL DEFAULT 'confirmed',
      notes TEXT,
      cancellation_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  try { await tenantClient.execute("ALTER TABLE appointments ADD COLUMN appointment_type TEXT DEFAULT 'ambulatorio';"); } catch {}
  try { await tenantClient.execute("ALTER TABLE appointments ADD COLUMN confirmation_status TEXT DEFAULT 'confirmed';"); } catch {}

  // Sedes
  await tenantClient.execute({
    sql: `
      INSERT INTO branches (id, name, address, phone, email, is_main, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name
    `,
    args: ['br_central', 'Sede Médica Central Santo Domingo', 'Av. Winston Churchill 1099', '809-555-0101', 'central@vitalist.com', 1, 1, now, now]
  });

  // Los 6 Doctores Especialistas
  const doctores = [
    { id: 'doc_ramos', fName: 'Dr. Alejandro', lName: 'Ramos', spec: 'Medicina Interna & Cirugía General', lic: 'EX-10492-MED' },
    { id: 'doc_mendoza', fName: 'Dr. Carlos', lName: 'Mendoza', spec: 'Odontología & Implantología Oral', lic: 'EX-22340-ODO' },
    { id: 'doc_valenzuela', fName: 'Dra. Sofía', lName: 'Valenzuela', spec: 'Medicina Estética & Dermatología', lic: 'EX-31980-DER' },
    { id: 'doc_silva', fName: 'Lic. Marcos', lName: 'Silva', spec: 'Fisioterapia & Kinesiología Motora', lic: 'EX-45120-FIS' },
    { id: 'doc_pena', fName: 'Dr. Roberto', lName: 'Peña', spec: 'Oftalmología & Optometría Clínica', lic: 'EX-58900-OFT' },
    { id: 'doc_morales', fName: 'Licda. Elena', lName: 'Morales', spec: 'Psicología Clínica & Terapia Cognitiva', lic: 'EX-67210-PSI' },
  ];

  console.log('  -> Insertando 6 doctores especialistas...');
  for (const d of doctores) {
    await tenantClient.execute({
      sql: `
        INSERT INTO professionals (id, first_name, last_name, specialty, license_number, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET first_name = excluded.first_name, specialty = excluded.specialty
      `,
      args: [d.id, d.fName, d.lName, d.spec, d.lic, 1, now, now]
    });
  }

  // Pacientes de prueba con clínicas de origen
  const pacientes = [
    { id: 'px_clinica', fName: 'Ramón', lName: 'Castillo Peña', cedula: '001-1827364-5', clinic: 'Clínica Abreu', phone: '809-555-7101' },
    { id: 'px_dental', fName: 'Mariana', lName: 'Guzmán Santos', cedula: '001-2948172-1', clinic: 'Hospiten Santo Domingo', phone: '829-555-7202' },
    { id: 'px_aesthetic', fName: 'Camila', lName: 'Almonte Pimentel', cedula: '402-1092837-4', clinic: 'Torre Médica Piantini', phone: '849-555-7303' },
    { id: 'px_recovery', fName: 'José', lName: 'Fernández Brea', cedula: '001-0892716-8', clinic: 'Clínica Corazones Unidos', phone: '809-555-7404' },
    { id: 'px_vision', fName: 'Lucía', lName: 'Rosario Mejía', cedula: '002-3928173-9', clinic: 'Centro Médico Real', phone: '829-555-7505' },
    { id: 'px_psico', fName: 'Gabriel', lName: 'Herrera Tavárez', cedula: '402-9988776-3', clinic: 'Clínica Abreu', phone: '849-555-7606' },
  ];

  console.log('  -> Insertando pacientes demo...');
  for (const p of pacientes) {
    await tenantClient.execute({
      sql: `
        INSERT INTO patients (id, branch_id, first_name, last_name, doc_type, doc_number, phone, associated_clinic, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET first_name = excluded.first_name, associated_clinic = excluded.associated_clinic
      `,
      args: [p.id, 'br_central', p.fName, p.lName, 'cedula', p.cedula, p.phone, p.clinic, 'active', now, now]
    });
  }

  // Citas y Consultas (ambulatorias por defecto en consultorio / domiciliarias cuando aplique)
  const citas = [
    {
      id: 'app_cli_amb',
      pId: 'px_clinica',
      docId: 'doc_ramos',
      svc: 'Consulta Medicina Interna & Riesgo Quirúrgico',
      type: 'ambulatorio', // Ambulatoria
      start: new Date(Date.now() + 3600000).toISOString(),
      end: new Date(Date.now() + 5400000).toISOString(),
      conf: 'confirmed',
      notes: 'Consultorio 304. Confirmada por paciente.',
    },
    {
      id: 'app_cli_dom',
      pId: 'px_clinica',
      docId: 'doc_ramos',
      svc: 'Visita Postquirúrgica Domiciliaria',
      type: 'domicilio', // Domiciliaria
      start: new Date(Date.now() + 86400000 * 2).toISOString(),
      end: new Date(Date.now() + 86400000 * 2 + 3600000).toISOString(),
      conf: 'pending',
      notes: 'Visita domiciliaria en Piantini.',
    },
    {
      id: 'app_den_amb',
      pId: 'px_dental',
      docId: 'doc_mendoza',
      svc: 'Alineadores Invisibles y Limpieza Profunda',
      type: 'ambulatorio', // 100% Ambulatoria
      start: new Date(Date.now() + 7200000).toISOString(),
      end: new Date(Date.now() + 9900000).toISOString(),
      conf: 'confirmed',
      notes: 'Sillón Odontológico 2. Check-in confirmado.',
    },
    {
      id: 'app_aes_amb',
      pId: 'px_aesthetic',
      docId: 'doc_valenzuela',
      svc: 'Sesión Láser CO2 y Bioestimulación',
      type: 'ambulatorio', // 100% Ambulatoria
      start: new Date(Date.now() + 86400000).toISOString(),
      end: new Date(Date.now() + 86400000 + 3600000).toISOString(),
      conf: 'confirmed',
      notes: 'Cabina VIP. Consentimiento firmado.',
    },
    {
      id: 'app_rec_dom',
      pId: 'px_recovery',
      docId: 'doc_silva',
      svc: 'Reeducación de la Marcha Domiciliaria',
      type: 'domicilio', // Domiciliaria
      start: new Date(Date.now() + 14400000).toISOString(),
      end: new Date(Date.now() + 18000000).toISOString(),
      conf: 'confirmed',
      notes: 'Atención domiciliaria Gazcue.',
    },
    {
      id: 'app_vis_amb',
      pId: 'px_vision',
      docId: 'doc_pena',
      svc: 'Examen Optométrico y Graduación de Lentes',
      type: 'ambulatorio', // 100% Ambulatoria
      start: new Date(Date.now() + 18000000).toISOString(),
      end: new Date(Date.now() + 19800000).toISOString(),
      conf: 'confirmed',
      notes: 'Gabinete de refracción.',
    },
    {
      id: 'app_psi_amb',
      pId: 'px_psico',
      docId: 'doc_morales',
      svc: 'Sesión Psicoterapia Cognitiva',
      type: 'ambulatorio', // Ambulatoria
      start: new Date(Date.now() + 86400000 + 7200000).toISOString(),
      end: new Date(Date.now() + 86400000 + 10800000).toISOString(),
      conf: 'confirmed',
      notes: 'Consultorio 2 / Teleconsulta virtual segura.',
    },
  ];

  console.log('  -> Insertando citas y consultas demo...');
  for (const a of citas) {
    await tenantClient.execute({
      sql: `
        INSERT INTO appointments (id, branch_id, patient_id, professional_id, service_name, appointment_type, start_time, end_time, status, confirmation_status, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          service_name = excluded.service_name,
          appointment_type = excluded.appointment_type,
          confirmation_status = excluded.confirmation_status
      `,
      args: [a.id, 'br_central', a.pId, a.docId, a.svc, a.type, a.start, a.end, 'scheduled', a.conf, a.notes, now, now]
    });
  }

  cpClient.close();
  tenantClient.close();

  console.log('\n✅ ¡Seed Multi-Vertical y Multi-Plan completado exitosamente!');
  console.log('   - 6 Centros (Hospital, Dental, Aesthetic, Recovery, Visión, Psicología)');
  console.log('   - 4 Planes (Básico $15, Pro $35, Plus $85, Enterprise $165)');
  console.log('   - 6 Doctores Especialistas');
  console.log('   - Citas ambulatorias (por defecto) y domiciliarias (cuando aplica)');
}

runSeed().catch((err) => {
  console.error('❌ Error en runSeed:', err);
  process.exit(1);
});
