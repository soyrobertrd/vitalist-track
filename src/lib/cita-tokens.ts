/**
 * Utilidades criptográficas para tokens de citas seguras (S11).
 * Utiliza Web Crypto API (crypto.subtle) soportada en navegadores y Node.js 19+.
 */

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateSecureToken(byteLength = 32): string {
  const rawBytes = new Uint8Array(byteLength);
  crypto.getRandomValues(rawBytes);
  return Array.from(rawBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
