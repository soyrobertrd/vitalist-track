import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Link2 } from "lucide-react";
import { toast } from "sonner";

interface Props { pacienteId: string }

export default function PortalPacienteAdmin({ pacienteId }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [dias, setDias] = useState(30);
  const [loading, setLoading] = useState(false);

  const generar = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("generar_token_portal_paciente", { _paciente_id: pacienteId, _dias_validez: dias });
    if (error) toast.error(error.message);
    else { setToken(data as string); toast.success("Token generado"); }
    setLoading(false);
  };

  const url = token ? `${window.location.origin}/portal-psico/${token}` : "";

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5"/>Acceso al portal del paciente</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 items-end">
          <div className="flex-1"><Label>Días de validez</Label><Input type="number" value={dias} onChange={e => setDias(parseInt(e.target.value) || 30)}/></div>
          <Button onClick={generar} disabled={loading}>Generar enlace</Button>
        </div>
        {token && (
          <div className="border rounded p-3 bg-muted">
            <p className="text-xs text-muted-foreground mb-1">Comparta este enlace con el paciente:</p>
            <div className="flex gap-2">
              <Input value={url} readOnly className="text-xs"/>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(url); toast.success("Copiado"); }}>
                <Copy className="h-4 w-4"/>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
