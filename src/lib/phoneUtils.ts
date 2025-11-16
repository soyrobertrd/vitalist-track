/**
 * Formatea un teléfono al formato dominicano 829-123-1234
 * @param phone - Número de teléfono con o sin guiones
 * @returns Teléfono formateado o vacío si es inválido
 */
export function formatPhoneDR(phone: string): string {
  if (!phone) return "";
  
  // Remover todos los caracteres que no sean dígitos
  const digits = phone.replace(/\D/g, "");
  
  // Verificar que tenga exactamente 10 dígitos
  if (digits.length !== 10) {
    return phone; // Retornar el original si no tiene 10 dígitos
  }
  
  // Formatear: XXX-XXX-XXXX
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/**
 * Valida y formatea un teléfono mientras el usuario escribe
 * @param value - Valor actual del input
 * @returns Valor formateado
 */
export function handlePhoneInput(value: string): string {
  // Remover todos los caracteres que no sean dígitos
  const digits = value.replace(/\D/g, "");
  
  // Limitar a 10 dígitos
  const limitedDigits = digits.slice(0, 10);
  
  // Formatear según la cantidad de dígitos
  if (limitedDigits.length <= 3) {
    return limitedDigits;
  } else if (limitedDigits.length <= 6) {
    return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3)}`;
  } else {
    return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
  }
}

/**
 * Limpia el teléfono para almacenar en base de datos
 * @param phone - Teléfono formateado
 * @returns Solo los dígitos con guiones en formato 829-123-1234
 */
export function cleanPhone(phone: string): string {
  if (!phone) return "";
  return formatPhoneDR(phone);
}
