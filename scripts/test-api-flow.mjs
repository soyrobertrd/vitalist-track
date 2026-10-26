import { getControlPlaneDb, getTenantDb } from '../src/server/db/connection-manager.js';
import { PatientService } from '../src/server/services/patient-service.js';
import { AppointmentService } from '../src/server/services/appointment-service.js';

// Setup environment variable
process.env.TURSO_CONTROL_PLANE_URL = 'file:local-control-plane.db';

async function testApiFlow() {
  console.log('🧪 Probando flujo de servicios reales con Control Plane y Tenant DB...');

  // 1. Resolve Tenant DB via ConnectionManager
  const tenantDb = await getTenantDb('c_vitalist_test');
  console.log('  ✅ Conexión con Tenant DB de c_vitalist_test establecida exitosamente');

  // 2. Query patients via PatientService
  const patientService = new PatientService(tenantDb);
  const patients = await patientService.list({});
  console.log(`  ✅ PatientService.list(): ${patients.data.length} pacientes encontrados`);
  for (const p of patients.data) {
    console.log(`     -> [${p.id}] ${p.firstName} ${p.lastName} (${p.docNumber})`);
  }

  // 3. Query appointments via AppointmentService
  const appointmentService = new AppointmentService(tenantDb);
  const appointments = await appointmentService.list({ branchId: 'br_santo_domingo' });
  console.log(`  ✅ AppointmentService.list(): ${appointments.length} citas encontradas`);
  for (const a of appointments) {
    console.log(`     -> [${a.id}] ${a.serviceName} | Estado: ${a.status}`);
  }

  console.log('\n🎉 ¡INTEGRACIÓN DE CAPA DE SERVICIOS Y CONNECTION MANAGER 100% OPERATIVA!');
}

testApiFlow().catch((err) => {
  console.error('\n❌ Error en flujo de servicios:', err);
  process.exit(1);
});
