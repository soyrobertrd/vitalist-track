// Códigos de área válidos para República Dominicana
const CODIGOS_AREA_RD = ["809", "829", "849"];

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string;
  formatted: string;
  errors: string[];
}

/**
 * Normaliza un número de teléfono dominicano al formato internacional
 * @param phone - Número de teléfono a normalizar
 * @returns Número normalizado en formato +1XXXXXXXXXX
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return "";
  
  // Eliminar todos los caracteres no numéricos
  let cleaned = phone.replace(/\D/g, "");
  
  // Si empieza con 1, eliminar el 1 inicial
  if (cleaned.startsWith("1") && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }
  
  // Si tiene 10 dígitos, agregar código de país
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // Si tiene 11 dígitos y empieza con 1, agregar +
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+${cleaned}`;
  }
  
  // Si ya tiene formato correcto
  if (cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith("1"))) {
    return `+1${cleaned.length === 10 ? cleaned : cleaned.substring(1)}`;
  }
  
  return phone; // Retornar original si no se puede normalizar
}

/**
 * Formatea un número de teléfono dominicano para visualización
 * @param phone - Número de teléfono a formatear
 * @returns Número formateado como (809) 123-4567
 */
export function formatPhoneNumber(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  const cleaned = normalized.replace(/\D/g, "");
  
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    const areaCode = cleaned.substring(1, 4);
    const firstPart = cleaned.substring(4, 7);
    const secondPart = cleaned.substring(7, 11);
    return `(${areaCode}) ${firstPart}-${secondPart}`;
  }
  
  return phone;
}

/**
 * Valida un número de teléfono dominicano
 * @param phone - Número de teléfono a validar
 * @returns Objeto con resultado de validación
 */
export function validatePhoneNumber(phone: string): PhoneValidationResult {
  const errors: string[] = [];
  
  if (!phone || phone.trim() === "") {
    return {
      isValid: false,
      normalized: "",
      formatted: "",
      errors: ["El número de teléfono es requerido"]
    };
  }
  
  // Limpiar el número
  const cleaned = phone.replace(/\D/g, "");
  
  // Validar longitud
  if (cleaned.length !== 10 && !(cleaned.length === 11 && cleaned.startsWith("1"))) {
    errors.push("El número debe tener 10 dígitos");
  }
  
  // Extraer código de área
  const areaCode = cleaned.length === 11 && cleaned.startsWith("1") 
    ? cleaned.substring(1, 4) 
    : cleaned.substring(0, 3);
  
  // Validar código de área dominicano
  if (!CODIGOS_AREA_RD.includes(areaCode)) {
    errors.push(`Código de área inválido. Debe ser ${CODIGOS_AREA_RD.join(", ")}`);
  }
  
  // Validar que no sea un número secuencial o repetitivo
  const mainNumber = cleaned.length === 11 ? cleaned.substring(1) : cleaned;
  if (/^(\d)\1{9}$/.test(mainNumber)) {
    errors.push("El número no puede tener todos los dígitos iguales");
  }
  
  const isValid = errors.length === 0;
  const normalized = isValid ? normalizePhoneNumber(phone) : "";
  const formatted = isValid ? formatPhoneNumber(phone) : phone;
  
  return {
    isValid,
    normalized,
    formatted,
    errors
  };
}

/**
 * Compara dos números de teléfono normalizados
 * @param phone1 - Primer número de teléfono
 * @param phone2 - Segundo número de teléfono
 * @returns true si los números son iguales
 */
export function comparePhoneNumbers(phone1: string, phone2: string): boolean {
  const normalized1 = normalizePhoneNumber(phone1);
  const normalized2 = normalizePhoneNumber(phone2);
  return normalized1 === normalized2 && normalized1 !== "";
}

// Validación de cédula dominicana
export function validarCedula(cedula: string): boolean {
  // Eliminar guiones y espacios
  const cedulaLimpia = cedula.replace(/[-\s]/g, "");

  // Validar formato básico
  if (!/^\d{11}$/.test(cedulaLimpia)) {
    return false;
  }

  // Validar dígito verificador
  const digitoVerificador = parseInt(cedulaLimpia[10]);
  let suma = 0;

  for (let i = 0; i < 10; i++) {
    const digito = parseInt(cedulaLimpia[i]);
    const multiplicador = i % 2 === 0 ? 1 : 2;
    let resultado = digito * multiplicador;

    if (resultado > 9) {
      resultado = Math.floor(resultado / 10) + (resultado % 10);
    }

    suma += resultado;
  }

  const verificadorCalculado = (10 - (suma % 10)) % 10;
  return digitoVerificador === verificadorCalculado;
}

// Legacy exports para compatibilidad
export const TELEFONO_DOMINICANO_REGEX = /^(809|829|849)[-\s]?\d{3}[-\s]?\d{4}$/;

export function validarTelefonoDominicano(telefono: string | undefined | null): boolean {
  if (!telefono) return true; // Permitir vacío si es opcional
  
  const telefonoLimpio = telefono.trim().replace(/\s+/g, '');
  return TELEFONO_DOMINICANO_REGEX.test(telefonoLimpio);
}

export function formatearTelefonoDominicano(telefono: string): string {
  // Limpiar todo excepto números
  const numeros = telefono.replace(/\D/g, '');
  
  // Si tiene 10 dígitos, formatear como XXX-XXX-XXXX
  if (numeros.length === 10) {
    return `${numeros.slice(0, 3)}-${numeros.slice(3, 6)}-${numeros.slice(6)}`;
  }
  
  return telefono;
}

// Mensaje de error personalizado para validación
export const TELEFONO_ERROR_MESSAGE = "Formato inválido. Use: 809/829/849-XXX-XXXX";
