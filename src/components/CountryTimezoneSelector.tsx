import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";

/** Common IANA timezones grouped for readability */
const COMMON_TIMEZONES = [
  // Americas
  "America/Santo_Domingo",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "America/Caracas",
  "America/Argentina/Buenos_Aires",
  "America/Santiago",
  "America/Sao_Paulo",
  "America/Panama",
  "America/Costa_Rica",
  "America/Guatemala",
  "America/Tegucigalpa",
  "America/El_Salvador",
  "America/Managua",
  "America/Havana",
  "America/Puerto_Rico",
  // Europe
  "Europe/Madrid",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Lisbon",
  // Other
  "Atlantic/Canary",
  "UTC",
];

const REGION_NAMES = new Intl.DisplayNames(["es"], { type: "region" });

interface Props {
  countryCode: string | null | undefined;
  timezone: string | null | undefined;
  onChange: (next: { countryCode: string; timezone: string }) => void;
  disabled?: boolean;
}

export function CountryTimezoneSelector({ countryCode, timezone, onChange, disabled }: Props) {
  const countries = useMemo(() => {
    return getCountries()
      .map((c) => {
        let name = c;
        try { name = REGION_NAMES.of(c) || c; } catch { /* ignore */ }
        let code = "";
        try { code = `+${getCountryCallingCode(c)}`; } catch { /* ignore */ }
        return { iso: c, name, code };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, []);

  const tzOptions = useMemo(() => {
    const browser = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const set = new Set<string>([...(browser ? [browser] : []), ...COMMON_TIMEZONES, ...(timezone ? [timezone] : [])]);
    return Array.from(set).sort();
  }, [timezone]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>País</Label>
        <Select
          value={countryCode || ""}
          onValueChange={(v) => onChange({ countryCode: v, timezone: timezone || "UTC" })}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona país..." />
          </SelectTrigger>
          <SelectContent className="max-h-[320px]">
            {countries.map((c) => (
              <SelectItem key={c.iso} value={c.iso}>
                {c.name} {c.code && <span className="text-muted-foreground">({c.code})</span>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Usado para validar y formatear números de teléfono.</p>
      </div>

      <div className="space-y-2">
        <Label>Zona horaria</Label>
        <Select
          value={timezone || ""}
          onValueChange={(v) => onChange({ countryCode: countryCode || "", timezone: v })}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona zona horaria..." />
          </SelectTrigger>
          <SelectContent className="max-h-[320px]">
            {tzOptions.map((tz) => (
              <SelectItem key={tz} value={tz}>{tz}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Las fechas y horas se mostrarán en esta zona.</p>
      </div>
    </div>
  );
}
