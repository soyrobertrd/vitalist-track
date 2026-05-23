import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface Props { pacienteId: string; pacienteNombre?: string; }

export function ExportarDatosGDPR({ pacienteId, pacienteNombre }: Props) {
  const [loading, setLoading] = useState(false);

  const exportar = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("exportar-datos-paciente-gdpr", {
        body: { paciente_id: pacienteId },
      });
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `paciente-${(pacienteNombre ?? pacienteId).replace(/\s+/g, "_")}-gdpr.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success("Datos exportados (GDPR/HIPAA)");
    } catch (e: any) {
      toast.error(e.message ?? "Error al exportar");
    } finally { setLoading(false); }
  };

  return (
    <Button variant="outline" size="sm" onClick={exportar} disabled={loading}>
      <Download className="h-4 w-4 mr-1" /> {loading ? "Exportando…" : "Exportar GDPR"}
    </Button>
  );
}
