import { createClient } from '@libsql/client';
import crypto from 'node:crypto';

function verifyPassword(password, stored) {
  const [salt, key] = stored.split(':');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === key;
}

async function testAuthAndTenant() {
  console.log('🧪 Verificando autenticación y resolución multi-tenant del usuario local...');

  const cpClient = createClient({ url: 'file:local-control-plane.db' });

  // 1. Check user by email
  const userRes = await cpClient.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: ['robertgrobles@gmail.com']
  });

  if (userRes.rows.length === 0) {
    throw new Error('❌ Usuario no encontrado en local-control-plane.db');
  }

  const user = userRes.rows[0];
  console.log(`  ✅ Usuario encontrado: ${user.name} (${user.email}) - Rol: ${user.system_role}`);

  // 2. Check password credentials
  const accRes = await cpClient.execute({
    sql: 'SELECT * FROM accounts WHERE user_id = ? AND provider_id = ?',
    args: [user.id, 'credential']
  });

  if (accRes.rows.length === 0) {
    throw new Error('❌ Cuenta de credenciales no encontrada');
  }

  const isValid = verifyPassword('12345678', String(accRes.rows[0].password));
  if (!isValid) {
    throw new Error('❌ Contraseña inválida');
  }
  console.log('  ✅ Validación de contraseña (12345678): Correcta (scrypt hash verificado)');

  // 3. Check Clinic & Membership
  const memRes = await cpClient.execute({
    sql: `
      SELECT m.*, c.name as clinic_name, c.plan as clinic_plan
      FROM memberships m
      JOIN clinics c ON m.clinic_id = c.id
      WHERE m.user_id = ?
    `,
    args: [user.id]
  });

  if (memRes.rows.length === 0) {
    throw new Error('❌ No se encontraron membresías para este usuario');
  }

  const mem = memRes.rows[0];
  console.log(`  ✅ Membresía activa: Clínica "${mem.clinic_name}" (${mem.clinic_id}) - Rol en clínica: ${mem.role}`);

  // 4. Resolve Clinic Database
  const dbRes = await cpClient.execute({
    sql: 'SELECT * FROM clinic_databases WHERE clinic_id = ?',
    args: [mem.clinic_id]
  });

  if (dbRes.rows.length === 0) {
    throw new Error('❌ Base de datos de la clínica no encontrada en control plane');
  }

  const cdb = dbRes.rows[0];
  console.log(`  ✅ Base de datos Turso resuelta: ${cdb.turso_db_name} (${cdb.turso_db_url})`);

  // 5. Connect to Tenant DB and query data
  const tenantClient = createClient({ url: String(cdb.turso_db_url) });
  const patientsRes = await tenantClient.execute("SELECT * FROM patients WHERE status = 'active'");
  console.log(`  ✅ Consulta de pacientes en tenant DB: ${patientsRes.rows.length} paciente(s) encontrado(s)`);
  for (const row of patientsRes.rows) {
    console.log(`     -> Paciente: ${row.first_name} ${row.last_name} | Cédula: ${row.doc_number}`);
  }

  const appRes = await tenantClient.execute('SELECT * FROM appointments');
  console.log(`  ✅ Consulta de citas en tenant DB: ${appRes.rows.length} cita(s) agendada(s)`);
  for (const row of appRes.rows) {
    console.log(`     -> Cita: ${row.service_name} | Horario: ${row.start_time}`);
  }

  cpClient.close();
  tenantClient.close();

  console.log('\n🎉 ¡VERIFICACIÓN EXITOSA: El usuario local está 100% operativo en LibSQL/SQLite!');
}

testAuthAndTenant().catch((err) => {
  console.error('\n❌ ERROR:', err);
  process.exit(1);
});
