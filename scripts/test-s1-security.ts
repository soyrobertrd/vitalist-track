import { GET as getPatients } from '../api/v1/patients/index';
import { GET as getAppointments } from '../api/v1/appointments/index';

process.env.TURSO_CONTROL_PLANE_URL = 'file:local-control-plane.db';

async function testS1Security() {
  console.log('🔒 Verificando S1: Fail-Closed y Autenticación en API v1...');

  // 1. Probar llamada directa a GET /api/v1/patients sin credenciales
  const unauthReqPatients = new Request('http://localhost:8080/api/v1/patients', {
    method: 'GET',
    headers: {
      'x-clinic-id': 'c_vitalist_test',
    },
  });

  const resPatients = await getPatients(unauthReqPatients);
  console.log(`  -> GET /api/v1/patients sin auth devolvió status: ${resPatients.status}`);
  if (resPatients.status !== 401) {
    throw new Error(`Se esperaba status 401 pero se obtuvo ${resPatients.status}`);
  }
  const bodyPatients = await resPatients.json();
  if (bodyPatients.title !== 'Unauthorized') {
    throw new Error(`Se esperaba title 'Unauthorized' pero se obtuvo ${bodyPatients.title}`);
  }
  console.log('  ✅ GET /api/v1/patients rechazado correctamente con 401');

  // 2. Probar llamada directa a GET /api/v1/appointments sin credenciales
  const unauthReqAppt = new Request('http://localhost:8080/api/v1/appointments', {
    method: 'GET',
    headers: {
      'x-clinic-id': 'c_vitalist_test',
    },
  });

  const resAppt = await getAppointments(unauthReqAppt);
  console.log(`  -> GET /api/v1/appointments sin auth devolvió status: ${resAppt.status}`);
  if (resAppt.status !== 401) {
    throw new Error(`Se esperaba status 401 pero se obtuvo ${resAppt.status}`);
  }
  console.log('  ✅ GET /api/v1/appointments rechazado correctamente con 401');

  // 3. Una cabecera de auth cualquiera (sin sesión validada) también debe dar 401
  const fakeAuth = await getPatients(new Request('http://localhost:8080/api/v1/patients', {
    headers: { authorization: 'Bearer cualquier-cosa', cookie: 'x=1', 'x-clinic-id': 'c_vitalist_test' },
  }));
  if (fakeAuth.status !== 401) {
    throw new Error(`Cabeceras falsas: se esperaba 401 pero se obtuvo ${fakeAuth.status}`);
  }
  console.log('  ✅ Cabeceras de auth sin sesión válida rechazadas con 401');

  console.log('\n🛡️ ¡TEST S1 SEGURIDAD COMPLETADO CON ÉXITO! Fail-Closed 401 verificado.');
}

testS1Security().catch((err) => {
  console.error('\n❌ ERROR EN TEST S1:', err);
  process.exit(1);
});
