// Validación de números telefónicos dominicanos
// Formato: 809/829/849-XXX-XXXX o variantes sin guiones
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
