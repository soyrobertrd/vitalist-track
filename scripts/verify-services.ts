import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as tenantSchema from '../src/server/db/tenant-schema';
import { PatientService } from '../src/server/services/patient-service';
import { AppointmentService } from '../src/server/services/appointment-service';
import { sql } from 'drizzle-orm';

/**
 * End-to-End Verification Test Script
 * Validates PatientService and AppointmentService logic against a real LibSQL database.
 * Conforms to master-qa-security: Zero Guesswork, proven execution.
 */
async function runVerification() {
  console.log('🧪 Iniciando verificación de servicios multi-tenant...');

  const client = createClient({ url: 'file::memory:?cache=shared' });
  const db = drizzle(client, { schema: tenantSchema });

  // 1. Initialize schema in memory
  console.log('  -> Creando tablas en memoria...');
  await client.execute(`
    CREATE TABLE branches (
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

  await client.execute(`
    CREATE TABLE patients (
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
      deleted_by TEXT
    );
  `);

  await client.execute(`
    CREATE TABLE appointments (
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
      updated_at TEXT NOT NULL
    );
  `);

  // Insert a test branch
  await client.execute(`
    INSERT INTO branches (id, name, is_main, is_active, created_at, updated_at)
    VALUES ('br_santo_domingo', 'Sede Central Santo Domingo', 1, 1, datetime('now'), datetime('now'));
  `);

  // 2. Test PatientService
  console.log('  -> Probando PatientService (creación, duplicados, soft delete)...');
  const patientService = new PatientService(db as any);

  const patient1 = await patientService.create({
    branchId: 'br_santo_domingo',
    firstName: 'Juan',
    lastName: 'Pérez',
    docType: 'cedula',
    docNumber: '402-1234567-8',
    phone: '809-555-0101',
    email: 'juan.perez@example.com',
  });
  console.log(`     ✅ Paciente creado: ${patient1.id} (${patient1.firstName} ${patient1.lastName})`);

  // Verify duplicate prevention
  try {
    await patientService.create({
      branchId: 'br_santo_domingo',
      firstName: 'Otro',
      lastName: 'Pérez',
      docType: 'cedula',
      docNumber: '402-1234567-8', // Duplicate
    });
    throw new Error('❌ Falló: Se permitió documento duplicado');
  } catch (err: any) {
    if (err.name === 'DuplicatePatientDocument') {
      console.log('     ✅ Prevención de duplicado comprobada (409 Conflict)');
    } else {
      throw err;
    }
  }

  // 3. Test AppointmentService
  console.log('  -> Probando AppointmentService (agendamiento y detección de solapamiento)...');
  const appointmentService = new AppointmentService(db as any);

  const appointment1 = await appointmentService.create({
    branchId: 'br_santo_domingo',
    patientId: patient1.id,
    professionalId: 'dr_martinez',
    serviceName: 'Consulta Odontológica General',
    startTime: '2026-11-01T09:00:00.000Z',
    endTime: '2026-11-01T09:30:00.000Z',
  });
  console.log(`     ✅ Cita agendada: ${appointment1.id} (09:00 - 09:30)`);

  // Verify schedule collision check
  try {
    await appointmentService.create({
      branchId: 'br_santo_domingo',
      patientId: patient1.id,
      professionalId: 'dr_martinez',
      serviceName: 'Limpieza Dental',
      startTime: '2026-11-01T09:15:00.000Z', // Overlaps with 09:00-09:30!
      endTime: '2026-11-01T09:45:00.000Z',
    });
    throw new Error('❌ Falló: Se permitió solapamiento de horario para el doctor');
  } catch (err: any) {
    if (err.name === 'ScheduleConflict') {
      console.log('     ✅ Detección de solapamiento/colisión comprobada (409 Conflict)');
    } else {
      throw err;
    }
  }

  // 4. Test Soft Delete
  console.log('  -> Probando Soft Delete legal de paciente...');
  await patientService.softDelete(patient1.id, 'user_admin_01');
  const listAfterDelete = await patientService.list({ search: 'Pérez' });
  if (listAfterDelete.data.length === 0) {
    console.log('     ✅ Paciente correctamente archivado (no aparece en búsquedas activas)');
  } else {
    throw new Error('❌ Falló: El paciente eliminado sigue apareciendo en la lista activa');
  }

  console.log('\n🎉 ¡TODAS LAS PRUEBAS DE SERVICIO PASARON CON 100% DE ÉXITO!');
  client.close();
}

runVerification().catch((err) => {
  console.error('\n❌ ERROR EN VERIFICACIÓN:', err);
  process.exit(1);
});
