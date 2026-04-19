import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CountryTimezoneSelector } from "@/components/CountryTimezoneSelector";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Loader2, Save, Building2 } from "lucide-react";
import { getCurrencyFromCountry } from "@/lib/currency";

const COMMON_CURRENCIES = [
  "DOP", "USD", "EUR", "MXN", "COP", "ARS", "CLP", "PEN", "BRL", "GBP",
  "CAD", "GTQ", "CRC", "HNL", "NIO", "PYG", "UYU", "BOB", "VES",
];

export function WorkspaceLocaleEditor() {
  const { currentWorkspace, refresh } = useWorkspace();
  const [country, setCountry] = useState<string>("");
  const [timezone, setTimezone] = useState<string>("");
  const [currency, setCurrency] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentWorkspace) return;
    (async () => {
      const { data } = await supabase
        .from("workspaces")
        .select("country_code, timezone, currency_code")
        .eq("id", currentWorkspace.id)
        .maybeSingle();
      setCountry(data?.country_code || "DO");
      setTimezone(data?.timezone || "America/Santo_Domingo");
      setCurrency((data as any)?.currency_code || "DOP");
      setLoading(false);
    })();
  }, [currentWorkspace]);

  const handleCountryChange = ({ countryCode, timezone: tz }: { countryCode: string; timezone: string }) => {
    setCountry(countryCode);
    setTimezone(tz);
    // Auto-sugerir moneda del país si el usuario no ha tocado el campo
    const suggested = getCurrencyFromCountry(countryCode);
    if (!currency || COMMON_CURRENCIES.includes(currency)) {
      setCurrency(suggested);
    }
  };

  const handleSave = async () => {
    if (!currentWorkspace) return;
    setSaving(true);
    const { error } = await supabase
      .from("workspaces")
      .update({
        country_code: country || null,
        timezone: timezone || null,
        currency_code: currency || null,
      } as any)
      .eq("id", currentWorkspace.id);
    setSaving(false);
    if (error) { toast.error("No se pudo guardar"); return; }
    toast.success("Configuración regional actualizada");
    await refresh();
  };

  if (loading) return <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
        <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
        <p className="text-muted-foreground text-xs">
          Esta configuración aplica a toda la clínica: zona horaria de las citas, formato de fechas,
          moneda de facturación y validación de teléfonos. Los usuarios pueden sobrescribir su zona horaria personal.
        </p>
      </div>

      <CountryTimezoneSelector
        countryCode={country}
        timezone={timezone}
        onChange={handleCountryChange}
      />

      <div className="space-y-2">
        <Label>Moneda de facturación</Label>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona moneda..." />
          </SelectTrigger>
          <SelectContent>
            {COMMON_CURRENCIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Se usa en facturas, pagos y recordatorios de cobro.</p>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Guardar configuración regional
      </Button>
    </div>
  );
}
