import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ExportarAuditoriaAvanzada() {
  const [origen, setOrigen] = useState("alertas");
  const [severidad, setSeveridad] = useState<string>("all");
  const [tipo, setTipo] = useState<string>("all");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [loading, setLoading] = useState(false);

  const exportar = async (formato: "csv" | "json") => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/exportar-auditoria-avanzada`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          origen, formato,
          severidad: severidad === "all" ? null : severidad,
          tipo: tipo === "all" ? null : tipo,
          desde: desde ? new Date(desde).toISOString() : null,
          hasta: hasta ? new Date(hasta + "T23:59:59").toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `auditoria_${origen}_${Date.now()}.${formato}`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("Exportación lista");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" /> Exportación HIPAA avanzada
        </CardTitle>
        <CardDescription>Filtra por origen, fechas, severidad y descarga CSV o JSON.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>Origen</Label>
            <Select value={origen} onValueChange={setOrigen}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alertas">Alertas</SelectItem>
                <SelectItem value="accesos">Accesos a fichas</SelectItem>
                <SelectItem value="cambios">Cambios auditados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Severidad</Label>
            <Select value={severidad} onValueChange={setSeveridad} disabled={origen !== "alertas"}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={setTipo} disabled={origen !== "alertas"}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="fuera_horario">Fuera de horario</SelectItem>
                <SelectItem value="acceso_masivo">Acceso masivo</SelectItem>
                <SelectItem value="descarga_excesiva">Descarga excesiva</SelectItem>
                <SelectItem value="cambio_critico">Cambio crítico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Desde</Label>
            <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div>
            <Label>Hasta</Label>
            <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button onClick={() => exportar("csv")} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />Descargar CSV
          </Button>
          <Button variant="outline" onClick={() => exportar("json")} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />Descargar JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
