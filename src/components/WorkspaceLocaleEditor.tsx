import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CountryTimezoneSelector } from "@/components/CountryTimezoneSelector";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Loader2, Save, Building2 } from "lucide-react";

export function WorkspaceLocaleEditor() {
  const { currentWorkspace, refresh } = useWorkspace();
  const [country, setCountry] = useState<string>("");
  const [timezone, setTimezone] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentWorkspace) return;
    (async () => {
      const { data } = await supabase
        .from("workspaces")
        .select("country_code, timezone")
        .eq("id", currentWorkspace.id)
        .maybeSingle();
      setCountry(data?.country_code || "DO");
      setTimezone(data?.timezone || "America/Santo_Domingo");
      setLoading(false);
    })();
  }, [currentWorkspace]);

  const handleSave = async () => {
    if (!currentWorkspace) return;
    setSaving(true);
    const { error } = await supabase
      .from("workspaces")
      .update({ country_code: country || null, timezone: timezone || null })
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
          Esta configuración aplica a toda la clínica. Los usuarios pueden sobrescribirla en su perfil personal.
        </p>
      </div>
      <CountryTimezoneSelector
        countryCode={country}
        timezone={timezone}
        onChange={({ countryCode, timezone }) => { setCountry(countryCode); setTimezone(timezone); }}
      />
      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Guardar configuración regional
      </Button>
    </div>
  );
}
