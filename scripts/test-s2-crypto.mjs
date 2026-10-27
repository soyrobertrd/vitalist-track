import crypto from 'node:crypto';

process.env.TENANT_TOKEN_KEY = 'clave-de-prueba-solo-para-tests-0123456789-muy-segura';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getKey() {
  const secret = process.env.TENANT_TOKEN_KEY;
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptTenantToken(plainText) {
  if (!plainText) return plainText;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decryptTenantToken(cipherText) {
  if (!cipherText) return cipherText;
  const parts = cipherText.split(':');
  const [ivHex, authTagHex, encryptedHex] = parts;
  if (parts.length !== 3 || !ivHex || !authTagHex || !encryptedHex) {
    throw new Error('Token de tenant no cifrado o con formato inválido');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

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
