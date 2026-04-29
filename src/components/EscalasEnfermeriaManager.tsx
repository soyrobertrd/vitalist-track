import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ClipboardList, Plus, Trash2 } from "lucide-react";

const TIPOS = [
  { value: "braden", label: "Braden (riesgo úlceras)", max: 23 },
  { value: "norton", label: "Norton (riesgo úlceras)", max: 20 },
  { value: "morse", label: "Morse (riesgo caídas)", max: 125 },
  { value: "downton", label: "Downton (riesgo caídas)", max: 11 },
  { value: "eva", label: "EVA (dolor 0-10)", max: 10 },
  { value: "barthel", label: "Barthel (independencia)", max: 100 },
];

function calcularRiesgo(tipo: string, score: number): string {
  switch (tipo) {
    case "braden": return score <= 9 ? "muy_alto" : score <= 12 ? "alto" : score <= 14 ? "moderado" : "bajo";
    case "norton": return score <= 12 ? "alto" : score <= 14 ? "moderado" : "bajo";
    case "morse": return score >= 51 ? "alto" : score >= 25 ? "moderado" : "bajo";
    case "downton": return score >= 3 ? "alto" : "bajo";
    case "eva": return score >= 7 ? "alto" : score >= 4 ? "moderado" : "bajo";
    case "barthel": return score < 20 ? "muy_alto" : score < 60 ? "alto" : score < 90 ? "moderado" : "bajo";
    default: return "bajo";
  }
}

interface Item {
  id: string; tipo: string; puntaje: number | null; riesgo: string | null;
  observaciones: string | null; fecha: string;
}

export function EscalasEnfermeriaManager({ pacienteId, visitaId }: { pacienteId: string; visitaId?: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [adding, setAdding] = useState(false);
  const [tipo, setTipo] = useState("braden");
  const [puntaje, setPuntaje] = useState("");
  const [obs, setObs] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("escalas_enfermeria")
      .select("id, tipo, puntaje, riesgo, observaciones, fecha")
      .eq("paciente_id", pacienteId)
      .order("fecha", { ascending: false });
    setItems((data as any) || []);
  };

  useEffect(() => { load(); }, [pacienteId]);

  const guardar = async () => {
    const score = parseFloat(puntaje);
    if (isNaN(score)) { toast.error("Puntaje requerido"); return; }
    const { data: u } = await supabase.auth.getUser();
    const riesgo = calcularRiesgo(tipo, score);
    const { error } = await supabase.from("escalas_enfermeria").insert({
      paciente_id: pacienteId,
      visita_id: visitaId || null,
      tipo, puntaje: score, riesgo,
      observaciones: obs || null,
      registrado_por: u.user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Riesgo: ${riesgo.replace("_", " ")}`);
    setAdding(false); setPuntaje(""); setObs("");
    load();
  };

  const eliminar = async (id: string) => {
    const { error } = await supabase.from("escalas_enfermeria").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const tipoSel = TIPOS.find((t) => t.value === tipo);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><ClipboardList className="h-4 w-4" />Escalas de enfermería</CardTitle>
        {!adding && <Button size="sm" onClick={() => setAdding(true)}><Plus className="h-4 w-4 mr-1" />Nueva</Button>}
      </CardHeader>
      <CardContent className="space-y-3">
        {adding && (
          <div className="rounded-md border p-3 space-y-3 bg-muted/40">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Puntaje (max {tipoSel?.max})</Label>
                <Input type="number" min={0} max={tipoSel?.max} value={puntaje} onChange={(e) => setPuntaje(e.target.value)} />
              </div>
            </div>
            <Textarea placeholder="Observaciones" value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancelar</Button>
              <Button size="sm" onClick={guardar}>Guardar</Button>
            </div>
          </div>
        )}

        {items.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground text-center py-4">Sin escalas registradas</p>
        )}

        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-2 rounded-md border p-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs uppercase">{it.tipo}</Badge>
                  <span className="font-mono text-sm">{it.puntaje}</span>
                  <Badge variant={it.riesgo === "alto" || it.riesgo === "muy_alto" ? "destructive" : it.riesgo === "moderado" ? "default" : "secondary"} className="text-xs">
                    {it.riesgo?.replace("_", " ")}
                  </Badge>
                </div>
                {it.observaciones && <p className="text-xs text-muted-foreground mt-1">{it.observaciones}</p>}
                <p className="text-xs text-muted-foreground">{new Date(it.fecha).toLocaleString("es-DO")}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => eliminar(it.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default EscalasEnfermeriaManager;
