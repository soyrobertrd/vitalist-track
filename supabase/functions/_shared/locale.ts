/**
 * Resuelve el timezone y locale para una cita usando el workspace asociado.
 * Fallback: America/Santo_Domingo + es-DO si el workspace no tiene preferencia.
 */
export interface WorkspaceLocale {
  timezone: string;
  locale: string;
  countryCode: string;
}

export const DEFAULT_TZ = "America/Santo_Domingo";
export const DEFAULT_COUNTRY = "DO";
export const DEFAULT_LOCALE = "es-DO";

export async function resolveWorkspaceLocale(
  supabase: any,
  workspaceId: string | null | undefined,
): Promise<WorkspaceLocale> {
  if (!workspaceId) {
    return { timezone: DEFAULT_TZ, locale: DEFAULT_LOCALE, countryCode: DEFAULT_COUNTRY };
  }
  try {
    const { data } = await supabase
      .from("workspaces")
      .select("country_code, timezone")
      .eq("id", workspaceId)
      .maybeSingle();
    const tz = data?.timezone || DEFAULT_TZ;
    const cc = (data?.country_code || DEFAULT_COUNTRY).toUpperCase();
    // Locale: español por defecto, pero ajusta el región al country.
    const locale = `es-${cc}`;
    return { timezone: tz, locale, countryCode: cc };
  } catch (_e) {
    return { timezone: DEFAULT_TZ, locale: DEFAULT_LOCALE, countryCode: DEFAULT_COUNTRY };
  }
}

/** Formatea una fecha en la zona horaria indicada usando Intl. */
export function formatDateInTz(date: Date, timezone: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: timezone,
    }).format(date);
  } catch {
    return date.toLocaleDateString(DEFAULT_LOCALE, { day: "2-digit", month: "long", year: "numeric" });
  }
}

export function formatTimeInTz(date: Date, timezone: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone,
    }).format(date);
  } catch {
    return date.toLocaleTimeString(DEFAULT_LOCALE, { hour: "2-digit", minute: "2-digit", hour12: true });
  }
}
