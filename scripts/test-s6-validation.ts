/**
 * Test unitario para verificar S6: Validación de esquemas Zod y tope de 100 en limit
 */
import { patientQuerySchema, createPatientSchema, createAppointmentSchema } from '../src/server/validators/schemas';

console.log('🧪 Ejecutando test S6: Validación de API y tope de límite...');

// 1. Validar que limit > 100 es rechazado
let limitExceededFailed = false;
try {
  patientQuerySchema.parse({ limit: 250 });
} catch (err: any) {
  limitExceededFailed = true;
  console.log('  ✅ Limit > 100 rechazado correctamente:', err.errors[0]?.message);
}

if (!limitExceededFailed) {
  console.error('❌ Error: Limit > 100 debió ser rechazado');
  process.exit(1);
}

// 2. Validar que limit <= 100 es aceptado
const validQuery = patientQuerySchema.parse({ limit: 50, page: 2 });
if (validQuery.limit !== 50 || validQuery.page !== 2) {
  console.error('❌ Error: Query válida no fue parseada');
  process.exit(1);
}
console.log('  ✅ Query válida con limit=50 aceptada');

// 3. Validar rechazo de paciente sin nombre obligatorio
let patientValidationFailed = false;
try {
  createPatientSchema.parse({
    docNumber: '402-1234567-8',
    // Falta firstName y lastName
  });
} catch (err: any) {
  patientValidationFailed = true;
  console.log('  ✅ Paciente sin nombre rechazado correctamente');
}

if (!patientValidationFailed) {
  console.error('❌ Error: Paciente sin nombre debió ser rechazado');
  process.exit(1);
}

// 4. Validar aceptación de paciente válido con clínica asociada (Pro Consultorios)
const validPatient = createPatientSchema.parse({
  firstName: 'Juan',
  lastName: 'Pérez',
  docType: 'cedula',
  docNumber: '001-9988776-5',
  associatedClinic: 'Hospiten Santo Domingo',
});

if (validPatient.firstName !== 'Juan' || validPatient.associatedClinic !== 'Hospiten Santo Domingo') {
  console.error('❌ Error: Paciente válido no fue procesado');
  process.exit(1);
}
console.log('  ✅ Paciente válido con clínica asociada aceptado correctamente');

console.log('✅ Test S6 completado con éxito: Esquemas y tope de 100 validados.\n');
