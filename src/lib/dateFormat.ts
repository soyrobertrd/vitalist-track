/**
 * Helpers para formatear fechas/horas en la zona horaria del workspace o usuario.
 * Centraliza el uso de Intl.DateTimeFormat para evitar 'es-DO' hardcodeado.
 */

export function formatDateTz(
  date: Date | string,
  timezone: string = "America/Santo_Domingo",
  locale: string = "es-DO",
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long", year: "numeric" },
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: timezone }).format(d);
  } catch {
    return d.toLocaleDateString(locale, options);
  }
}

export function formatTimeTz(
  date: Date | string,
  timezone: string = "America/Santo_Domingo",
  locale: string = "es-DO",
  options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hour12: true },
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: timezone }).format(d);
  } catch {
    return d.toLocaleTimeString(locale, options);
  }
}

export function formatDateTimeTz(
  date: Date | string,
  timezone: string = "America/Santo_Domingo",
  locale: string = "es-DO",
): string {
  return `${formatDateTz(date, timezone, locale)} · ${formatTimeTz(date, timezone, locale)}`;
}

export function localeFromCountry(countryCode?: string | null): string {
  const cc = (countryCode || "DO").toUpperCase();
  return `es-${cc}`;
}
