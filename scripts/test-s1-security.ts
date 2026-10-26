import { resolveTenantContext } from '../src/server/middleware/tenant-context';
import { GET as getPatients } from '../api/v1/patients/index';
import { GET as getAppointments } from '../api/v1/appointments/index';
import { AppError } from '../src/server/errors/problem-details';

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

  // 3. Probar resolveTenantContext sin x-clinic-id pero con auth
  let errorCaught = false;
  try {
    const missingClinicReq = new Request('http://localhost:8080/api/v1/patients', {
      method: 'GET',
      headers: {
        'authorization': 'Bearer dummy-token',
      },
    });
    await resolveTenantContext(missingClinicReq);
  } catch (err: any) {
    errorCaught = true;
    if (err instanceof AppError && err.status === 400) {
      console.log('  ✅ Petición con auth pero sin x-clinic-id rechazada con 400 MissingTenantHeader');
    } else {
      throw new Error(`Se esperaba 400 MissingTenantHeader pero se obtuvo: ${err}`);
    }
  }
  if (!errorCaught) {
    throw new Error('Se esperaba error por falta de x-clinic-id');
  }

  // 4. Probar resolveTenantContext con auth y clinicId
  const validReq = new Request('http://localhost:8080/api/v1/patients', {
    method: 'GET',
    headers: {
      'authorization': 'Bearer test-token-ok',
      'x-clinic-id': 'c_vitalist_test',
    },
  });
  const ctx = await resolveTenantContext(validReq);
  if (ctx.clinicId === 'c_vitalist_test' && ctx.db) {
    console.log('  ✅ Petición con auth y x-clinic-id resuelve contexto y base de datos con éxito');
  }

  console.log('\n🛡️ ¡TEST S1 SEGURIDAD COMPLETADO CON ÉXITO! Fail-Closed 401 verificado.');
}

testS1Security().catch((err) => {
  console.error('\n❌ ERROR EN TEST S1:', err);
  process.exit(1);
});
