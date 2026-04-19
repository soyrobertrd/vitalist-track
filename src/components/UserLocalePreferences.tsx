import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CountryTimezoneSelector } from "@/components/CountryTimezoneSelector";
import { useLocale } from "@/hooks/useLocale";
import { Loader2, Save, Globe } from "lucide-react";

export function UserLocalePreferences() {
  const { source, countryCode: resolved, timezone: resolvedTz } = useLocale();
  const [country, setCountry] = useState<string>("");
  const [timezone, setTimezone] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("profiles")
        .select("country_code, timezone")
        .eq("id", user.id)
        .maybeSingle();
      setCountry(data?.country_code || "");
      setTimezone(data?.timezone || "");
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { error } = await supabase
      .from("profiles")
      .update({ country_code: country || null, timezone: timezone || null })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error("No se pudo guardar"); 
    else toast.success("Preferencias guardadas. Recarga para ver los cambios.");
  };

  if (loading) return <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
        <Globe className="h-4 w-4 mt-0.5 text-muted-foreground" />
        <div>
          <p className="text-foreground font-medium">Configuración activa: {resolved} · {resolvedTz}</p>
          <p className="text-muted-foreground text-xs">
            Origen: {source === "workspace" ? "Clínica" : source === "user" ? "Usuario" : "Navegador"}.
            Si dejas estos campos vacíos, se usará la configuración de la clínica o se detectará automáticamente.
          </p>
        </div>
      </div>
      <CountryTimezoneSelector
        countryCode={country}
        timezone={timezone}
        onChange={({ countryCode, timezone }) => { setCountry(countryCode); setTimezone(timezone); }}
      />
      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Guardar preferencias
      </Button>
    </div>
  );
}
