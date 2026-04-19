/**
 * Helpers para formatear moneda según la configuración del workspace.
 * Mapea ISO country codes a códigos ISO 4217 cuando no hay currency_code explícito.
 */

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  DO: "DOP",
  US: "USD",
  MX: "MXN",
  CO: "COP",
  AR: "ARS",
  CL: "CLP",
  PE: "PEN",
  ES: "EUR",
  GT: "GTQ",
  PA: "USD",
  CR: "CRC",
  EC: "USD",
  SV: "USD",
  HN: "HNL",
  NI: "NIO",
  PY: "PYG",
  UY: "UYU",
  BO: "BOB",
  VE: "VES",
  PR: "USD",
  BR: "BRL",
  CA: "CAD",
  GB: "GBP",
  FR: "EUR",
  DE: "EUR",
  IT: "EUR",
  PT: "EUR",
};

export function getCurrencyFromCountry(countryCode?: string | null): string {
  if (!countryCode) return "DOP";
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] || "DOP";
}

export function resolveCurrency(workspace: any, countryCode?: string | null): string {
  const ws = workspace as { currency_code?: string | null; country_code?: string | null } | null | undefined;
  return ws?.currency_code || getCurrencyFromCountry(ws?.country_code || countryCode);
}

export function formatCurrency(
  amount: number | string,
  currencyCode: string = "DOP",
  locale: string = "es-DO",
): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(value)) return "—";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    // Fallback if currency code is invalid
    return `${currencyCode} ${value.toFixed(2)}`;
  }
}
