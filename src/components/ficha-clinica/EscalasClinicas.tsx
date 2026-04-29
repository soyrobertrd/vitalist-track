import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ClipboardList, Plus } from "lucide-react";

const TIPOS = [
  { value: "glasgow", label: "Glasgow Coma Scale", max: 15, items: [
    { name: "ocular", label: "Apertura ocular", options: [["Espontánea",4],["Al hablar",3],["Al dolor",2],["Ninguna",1]] },
    { name: "verbal", label: "Respuesta verbal", options: [["Orientada",5],["Confusa",4],["Inapropiada",3],["Incomprensible",2],["Ninguna",1]] },
    { name: "motora", label: "Respuesta motora", options: [["Obedece",6],["Localiza",5],["Retira",4],["Flexión",3],["Extensión",2],["Ninguna",1]] },
  ]},
  { value: "barthel", label: "Barthel (independencia AVD)", max: 100 },
  { value: "braden", label: "Braden (riesgo úlceras)", max: 23 },
  { value: "news2", label: "NEWS2 (deterioro)", max: 20 },
  { value: "eva_dolor", label: "EVA Dolor", max: 10 },
  { value: "norton", label: "Norton (úlceras)", max: 20 },
  { value: "morse", label: "Morse (caídas)", max: 125 },
];

interface Escala {
  id: string; tipo: string; puntaje: number; interpretacion: string | null;
  fecha_evaluacion: string; notas: string | null;
}

export function EscalasClinicasPaciente({ pacienteId }: { pacienteId: string }) {
  const [items, setItems] = useState<Escala[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, [pacienteId]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("escalas_clinicas" as any)
      .select("*").eq("paciente_id", pacienteId).order("fecha_evaluacion", { ascending: false });
    setItems((data as any) ?? []);
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2"><ClipboardList className="h-4 w-4"/>Escalas clínicas</h3>
        <NuevaEscalaDialog pacienteId={pacienteId} onCreated={load} />
      </div>
      {loading ? <p className="text-sm text-muted-foreground">Cargando...</p> :
       items.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">Sin escalas registradas</p> :
        <div className="space-y-2">
          {items.map(e => {
            const tipo = TIPOS.find(t => t.value === e.tipo);
            return (
              <Card key={e.id}>
                <CardContent className="pt-3 pb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{tipo?.label ?? e.tipo}</p>
                    <p className="text-xs text-muted-foreground">{new Date(e.fecha_evaluacion).toLocaleString()}</p>
                    {e.notas && <p className="text-xs mt-1">{e.notas}</p>}
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-base">{e.puntaje}{tipo?.max && `/${tipo.max}`}</Badge>
                    {e.interpretacion && <p className="text-xs text-muted-foreground mt-1">{e.interpretacion}</p>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      }
    </div>
  );
}

function NuevaEscalaDialog({ pacienteId, onCreated }: { pacienteId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState("glasgow");
  const [items, setItems] = useState<Record<string, number>>({});
  const [puntaje, setPuntaje] = useState<string>("");
  const [notas, setNotas] = useState("");

  const def = TIPOS.find(t => t.value === tipo);
  const computed = def?.items ? def.items.reduce((s, it) => s + (items[it.name] ?? 0), 0) : null;
  const finalScore = computed !== null ? computed : parseFloat(puntaje || "0");

  function interpretar() {
    if (tipo === "glasgow") {
      if (finalScore <= 8) return "Severo";
      if (finalScore <= 12) return "Moderado";
      return "Leve";
    }
    if (tipo === "eva_dolor") {
      if (finalScore <= 3) return "Leve";
      if (finalScore <= 6) return "Moderado";
      return "Severo";
    }
    return null;
  }

  async function save() {
    const { error } = await supabase.from("escalas_clinicas" as any).insert({
      paciente_id: pacienteId, tipo, puntaje: finalScore,
      interpretacion: interpretar(),
      detalles: items, notas: notas || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Escala registrada"); setOpen(false); setItems({}); setPuntaje(""); setNotas(""); onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1"/>Nueva escala</Button></DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nueva escala clínica</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => { setTipo(v); setItems({}); setPuntaje(""); }}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>{TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {def?.items ? def.items.map(it => (
            <div key={it.name}><Label>{it.label}</Label>
              <Select value={String(items[it.name] ?? "")} onValueChange={(v) => setItems({ ...items, [it.name]: parseInt(v) })}>
                <SelectTrigger><SelectValue placeholder="Selecciona"/></SelectTrigger>
                <SelectContent>{it.options.map(([l, v]) => <SelectItem key={String(v)} value={String(v)}>{l} ({v})</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )) : (
            <div><Label>Puntaje (máx {def?.max})</Label><Input type="number" value={puntaje} onChange={(e) => setPuntaje(e.target.value)}/></div>
          )}
          {computed !== null && <p className="text-sm">Total: <strong>{computed}/{def?.max}</strong> {interpretar() && <Badge variant="outline" className="ml-2">{interpretar()}</Badge>}</p>}
          <div><Label>Notas</Label><Textarea value={notas} onChange={(e) => setNotas(e.target.value)}/></div>
        </div>
        <DialogFooter><Button onClick={save}>Guardar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
