/**
 * Test unitario para verificar S2: Cifrado AES-256-GCM de tokens Turso
 */
process.env.TENANT_TOKEN_KEY ||= 'clave-de-prueba-solo-para-tests-0123456789';
import { encryptTenantToken, decryptTenantToken } from '../src/server/lib/crypto';

console.log('🧪 Ejecutando test de seguridad S2: Cifrado y descifrado AES-256-GCM...');

const originalToken = 'turso-jwt-token-production-sec-9876543210-sample';

// 1. Cifrar
const encrypted = encryptTenantToken(originalToken);
console.log('  -> Token original:', originalToken);
console.log('  -> Token cifrado (AES-256-GCM):', encrypted);

if (encrypted === originalToken) {
  console.error('❌ Error: El token no fue cifrado');
  process.exit(1);
}

const parts = encrypted.split(':');
if (parts.length !== 3) {
  console.error('❌ Error: El formato cifrado debe ser iv:tag:ciphertext');
  process.exit(1);
}

// 2. Descifrar
const decrypted = decryptTenantToken(encrypted);
console.log('  -> Token descifrado:', decrypted);

if (decrypted !== originalToken) {
  console.error('❌ Error: El token descifrado no coincide con el original');
  process.exit(1);
}

// 3. Fail-closed: texto plano o datos alterados deben lanzar error
for (const malo of ['file:local-tenant.db', encrypted.slice(0, -2) + (encrypted.endsWith('00') ? '11' : '00')]) {
  let lanzo = false;
  try { decryptTenantToken(malo); } catch { lanzo = true; }
  if (!lanzo) {
    console.error('❌ Error: se aceptó un token no cifrado o alterado:', malo);
    process.exit(1);
  }
}

console.log('✅ Test S2 completado con éxito: Cifrado, descifrado y rechazo de tokens no cifrados/alterados verificados.\n');
