import {
  parsePhoneNumberFromString,
  isValidPhoneNumber as libIsValid,
  AsYouType,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";

export interface IntlPhoneValidation {
  isValid: boolean;
  e164: string;        // +18091234567
  national: string;    // (809) 123-4567
  international: string; // +1 809 123 4567
  country: CountryCode | null;
  errors: string[];
}

/**
 * Validate any phone number against a default country (used when the user
 * types a national number without country code).
 */
export function validateIntlPhone(input: string, defaultCountry: CountryCode): IntlPhoneValidation {
  const errors: string[] = [];
  const trimmed = (input ?? "").trim();
  if (!trimmed) {
    return { isValid: false, e164: "", national: "", international: "", country: null, errors: ["Número requerido"] };
  }
  try {
    const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
    if (!parsed || !parsed.isValid()) {
      errors.push("Número de teléfono inválido");
      return { isValid: false, e164: "", national: trimmed, international: trimmed, country: null, errors };
    }
    return {
      isValid: true,
      e164: parsed.number, // already E.164
      national: parsed.formatNational(),
      international: parsed.formatInternational(),
      country: parsed.country ?? defaultCountry,
      errors: [],
    };
  } catch {
    errors.push("Formato inválido");
    return { isValid: false, e164: "", national: trimmed, international: trimmed, country: null, errors };
  }
}

/** Quick boolean check */
export function isValidIntlPhone(input: string, defaultCountry: CountryCode): boolean {
  if (!input) return false;
  try {
    return libIsValid(input, defaultCountry);
  } catch {
    return false;
  }
}

/** Normalize to E.164 (e.g. +18091234567), or "" if invalid */
export function toE164(input: string, defaultCountry: CountryCode): string {
  if (!input) return "";
  try {
    const p = parsePhoneNumberFromString(input, defaultCountry);
    return p?.isValid() ? p.number : "";
  } catch {
    return "";
  }
}

/** Format as the user types, country-aware */
export function formatAsYouType(input: string, country: CountryCode): string {
  if (!input) return "";
  try {
    return new AsYouType(country).input(input);
  } catch {
    return input;
  }
}

/** Format for display (national format, falls back to input) */
export function formatNationalDisplay(input: string, defaultCountry: CountryCode): string {
  if (!input) return "";
  try {
    const p = parsePhoneNumberFromString(input, defaultCountry);
    return p?.formatNational() || input;
  } catch {
    return input;
  }
}

/** Compare two numbers regardless of formatting */
export function arePhonesEqual(a: string, b: string, defaultCountry: CountryCode): boolean {
  const e1 = toE164(a, defaultCountry);
  const e2 = toE164(b, defaultCountry);
  return !!e1 && e1 === e2;
}

/** Build a wa.me URL (digits only, no +) */
export function toWhatsAppDigits(input: string, defaultCountry: CountryCode): string {
  const e164 = toE164(input, defaultCountry);
  return e164 ? e164.replace(/^\+/, "") : "";
}

/** Helper for placeholder text per country */
export function placeholderForCountry(country: CountryCode): string {
  try {
    const code = getCountryCallingCode(country);
    return `+${code} ...`;
  } catch {
    return "";
  }
}
