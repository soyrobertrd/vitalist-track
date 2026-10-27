/**
 * Cifrado AES-256-GCM para datos sensibles en tránsito y reposo (Tokens de bases de datos por tenant S2)
 */
import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recomendado para GCM

function getKey(): Buffer {
  const secret = process.env.TENANT_TOKEN_KEY;
  if (!secret || secret.length < 32) {
    throw new Error('TENANT_TOKEN_KEY no configurada (mínimo 32 caracteres)');
  }
  // Generar key de exactamente 32 bytes (256 bits) usando SHA-256
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Cifra un texto plano usando AES-256-GCM con un IV único
 * Formato de retorno: ivHex:authTagHex:ciphertextHex
 */
export function encryptTenantToken(plainText: string): string {
  if (!plainText) return plainText;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Descifra un texto en formato ivHex:authTagHex:ciphertextHex
 * Lanza error si no está cifrado o si la autenticación GCM falla (clave incorrecta o datos alterados)
 */
export function decryptTenantToken(cipherText: string): string {
  if (!cipherText) return cipherText;

  const parts = cipherText.split(':');
  const [ivHex, authTagHex, encryptedHex] = parts;
  if (parts.length !== 3 || !ivHex || !authTagHex || !encryptedHex) {
    // Fail-closed: un token sin cifrar en el control plane es un error de datos, no se usa.
    throw new Error('Token de tenant no cifrado o con formato inválido');
  }

  {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
