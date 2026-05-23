import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { FileDown, History } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ExportarHistoriaPsico({ pacientes }: { pacientes: any[] }) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [pacienteId, setPacienteId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: log = [], refetch } = useQuery({
    queryKey: ["exp_hc_psico", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("exportaciones_historia_clinica" as any) as any)
        .select("*, pacientes(nombre, apellido)").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const exportar = async () => {
    if (!pacienteId || !motivo) { toast.error("Paciente y motivo requeridos"); return; }
    setLoading(true);
    const { data, error } = await (supabase as any).rpc("exportar_historia_clinica_psico", {
      _paciente_id: pacienteId, _motivo: motivo, _destinatario: destinatario || null, _formato: "json",
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const pac = pacientes.find(p => p.id === pacienteId);
    a.href = url; a.download = `historia_${pac?.apellido || "paciente"}_${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Historia exportada y registrada");
    setMotivo(""); setDestinatario(""); refetch();
  };

  return (
    <div className="space-y-4">
      <Card><CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2"><FileDown className="h-5 w-5 text-primary" /><h3 className="font-semibold">Exportar historia clínica</h3></div>
        <div><Label>Paciente</Label>
          <Select value={pacienteId} onValueChange={setPacienteId}>
            <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
            <SelectContent>{pacientes.map((p:any)=><SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Motivo (obligatorio)</Label>
          <Textarea value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Solicitud del paciente / derivación / requerimiento legal..." />
        </div>
        <div><Label>Destinatario</Label><Input value={destinatario} onChange={e=>setDestinatario(e.target.value)} placeholder="Nombre o entidad receptora" /></div>
        <Button onClick={exportar} disabled={loading} className="w-full">{loading ? "Exportando..." : "Exportar y registrar"}</Button>
      </CardContent></Card>

      <div>
        <h3 className="font-semibold flex items-center gap-2 mb-2"><History className="h-4 w-4" />Log de exportaciones</h3>
        {log.length === 0
          ? <Card><CardContent className="py-6 text-center text-muted-foreground text-sm">Sin exportaciones</CardContent></Card>
          : log.map((l:any)=>(
            <Card key={l.id} className="mb-2"><CardContent className="py-3 text-sm">
              <p className="font-medium">{l.pacientes?.nombre} {l.pacientes?.apellido} — {l.motivo}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(l.created_at), "dd/MM/yyyy HH:mm")} · {l.destinatario || "—"} · hash: <code className="text-[10px]">{l.hash_contenido?.slice(0,16)}…</code></p>
            </CardContent></Card>
          ))}
      </div>
    </div>
  );
}
