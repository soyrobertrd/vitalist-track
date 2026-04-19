// Re-export internationalized validators. The legacy regex/helpers below remain
// exported for backwards compatibility but now delegate to libphonenumber-js
// using a default country (Dominican Republic) when no other context exists.

import {
  validateIntlPhone,
  isValidIntlPhone,
  toE164,
  formatNationalDisplay,
  arePhonesEqual,
} from "./intlPhone";
import type { CountryCode } from "libphonenumber-js";

const LEGACY_DEFAULT: CountryCode = "DO";

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string;
  formatted: string;
  errors: string[];
}

/** @deprecated prefer toE164 with explicit country */
export function normalizePhoneNumber(phone: string, country: CountryCode = LEGACY_DEFAULT): string {
  return toE164(phone, country);
}

/** @deprecated prefer formatNationalDisplay with explicit country */
export function formatPhoneNumber(phone: string, country: CountryCode = LEGACY_DEFAULT): string {
  return formatNationalDisplay(phone, country) || phone;
}

/** @deprecated prefer validateIntlPhone */
export function validatePhoneNumber(phone: string, country: CountryCode = LEGACY_DEFAULT): PhoneValidationResult {
  if (!phone || phone.trim() === "") {
    return { isValid: false, normalized: "", formatted: "", errors: ["El número de teléfono es requerido"] };
  }
  const r = validateIntlPhone(phone, country);
  return {
    isValid: r.isValid,
    normalized: r.e164,
    formatted: r.isValid ? r.national : phone,
    errors: r.errors,
  };
}

export function comparePhoneNumbers(phone1: string, phone2: string, country: CountryCode = LEGACY_DEFAULT): boolean {
  return arePhonesEqual(phone1, phone2, country);
}

// ===== Cédula dominicana (kept country-specific intentionally) =====
export function validarCedula(cedula: string): boolean {
  const cedulaLimpia = cedula.replace(/[-\s]/g, "");
  if (!/^\d{11}$/.test(cedulaLimpia)) return false;
  const digitoVerificador = parseInt(cedulaLimpia[10]);
  let suma = 0;
  for (let i = 0; i < 10; i++) {
    const digito = parseInt(cedulaLimpia[i]);
    const multiplicador = i % 2 === 0 ? 1 : 2;
    let resultado = digito * multiplicador;
    if (resultado > 9) resultado = Math.floor(resultado / 10) + (resultado % 10);
    suma += resultado;
  }
  const verificadorCalculado = (10 - (suma % 10)) % 10;
  return digitoVerificador === verificadorCalculado;
}

// ===== Legacy DR-specific exports (kept for backward compatibility) =====
// These now delegate to libphonenumber-js so non-DR numbers also pass when valid.
export const TELEFONO_DOMINICANO_REGEX = /^(809|829|849)[-\s]?\d{3}[-\s]?\d{4}$/;

/**
 * Backwards-compatible validator. Now accepts any internationally valid phone,
 * defaulting to DR when no country code is provided.
 */
export function validarTelefonoDominicano(telefono: string | undefined | null, country: CountryCode = LEGACY_DEFAULT): boolean {
  if (!telefono) return true; // Allow empty if optional
  return isValidIntlPhone(telefono.trim(), country);
}

export function formatearTelefonoDominicano(telefono: string, country: CountryCode = LEGACY_DEFAULT): string {
  return formatNationalDisplay(telefono, country) || telefono;
}

export const TELEFONO_ERROR_MESSAGE = "Número de teléfono inválido";
