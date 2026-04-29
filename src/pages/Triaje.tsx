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
import { AlertTriangle, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const NIVELES = [
  { nivel: 1, color: "rojo", label: "Rojo — Inmediato", className: "bg-red-600 text-white", tiempo: 0 },
  { nivel: 2, color: "naranja", label: "Naranja — Muy urgente", className: "bg-orange-500 text-white", tiempo: 10 },
  { nivel: 3, color: "amarillo", label: "Amarillo — Urgente", className: "bg-yellow-400 text-black", tiempo: 60 },
  { nivel: 4, color: "verde", label: "Verde — Normal", className: "bg-green-500 text-white", tiempo: 120 },
  { nivel: 5, color: "azul", label: "Azul — No urgente", className: "bg-blue-500 text-white", tiempo: 240 },
];

interface Triaje {
  id: string; nivel: number; color: string; motivo_consulta: string; fecha_triaje: string;
  signos_vitales: any; derivado_a: string | null; paciente_id: string;
  pacientes?: { nombre: string; apellido: string };
}

export default function Triaje() {
  const [items, setItems] = useState<Triaje[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const desde = new Date(); desde.setHours(0,0,0,0);
    const { data, error } = await supabase.from("triaje_eventos" as any)
      .select("*, pacientes(nombre,apellido)")
      .gte("fecha_triaje", desde.toISOString())
      .order("nivel", { ascending: true })
      .order("fecha_triaje", { ascending: true });
    if (error) toast.error(error.message);
    setItems((data as any) ?? []);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="h-6 w-6"/>Triaje (Manchester)</h1>
          <p className="text-sm text-muted-foreground">Clasificación de pacientes en emergencia</p>
        </div>
        <NuevoTriajeDialog onCreated={load} />
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Cargando...</p> :
        items.length === 0 ? <Card><CardContent className="py-10 text-center text-muted-foreground">Sin triajes hoy</CardContent></Card> :
        <div className="space-y-3">
          {NIVELES.map(n => {
            const grupo = items.filter(i => i.nivel === n.nivel);
            if (grupo.length === 0) return null;
            return (
              <div key={n.nivel}>
                <Badge className={n.className + " mb-2"}>{n.label} ({grupo.length})</Badge>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {grupo.map(t => (
                    <Card key={t.id} className="hover:shadow-md">
                      <CardContent className="pt-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <strong className="text-sm">{t.pacientes?.nombre} {t.pacientes?.apellido}</strong>
                          <span className="text-xs text-muted-foreground">{format(new Date(t.fecha_triaje), "HH:mm", { locale: es })}</span>
                        </div>
                        <p className="text-sm">{t.motivo_consulta}</p>
                        {t.signos_vitales && Object.keys(t.signos_vitales).length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {t.signos_vitales.ta && `TA ${t.signos_vitales.ta} `}
                            {t.signos_vitales.fc && `FC ${t.signos_vitales.fc} `}
                            {t.signos_vitales.spo2 && `SpO₂ ${t.signos_vitales.spo2}`}
                          </p>
                        )}
                        {t.derivado_a && <Badge variant="outline">→ {t.derivado_a}</Badge>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      }
    </div>
  );
}

function NuevoTriajeDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ nivel: 3 });
  const [pacientes, setPacientes] = useState<any[]>([]);

  useEffect(() => {
    if (open) supabase.from("pacientes").select("id,nombre,apellido,cedula").order("nombre").limit(200).then(({ data }) => setPacientes(data ?? []));
  }, [open]);

  async function submit() {
    if (!form.paciente_id || !form.motivo_consulta) return toast.error("Paciente y motivo requeridos");
    const n = NIVELES.find(x => x.nivel === parseInt(form.nivel))!;
    const { error } = await supabase.from("triaje_eventos" as any).insert({
      paciente_id: form.paciente_id,
      nivel: n.nivel,
      color: n.color,
      motivo_consulta: form.motivo_consulta,
      tiempo_objetivo_min: n.tiempo,
      signos_vitales: {
        ta: form.ta || null, fc: form.fc || null, fr: form.fr || null,
        temp: form.temp || null, spo2: form.spo2 || null,
      },
      derivado_a: form.derivado_a || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Triaje registrado");
    setForm({ nivel: 3 }); setOpen(false); onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>Nuevo triaje</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nuevo triaje</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Paciente *</Label>
            <Select value={form.paciente_id ?? ""} onValueChange={(v) => setForm({ ...form, paciente_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecciona"/></SelectTrigger>
              <SelectContent>{pacientes.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Nivel *</Label>
            <Select value={String(form.nivel)} onValueChange={(v) => setForm({ ...form, nivel: v })}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>{NIVELES.map(n => <SelectItem key={n.nivel} value={String(n.nivel)}>{n.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Motivo *</Label><Textarea value={form.motivo_consulta ?? ""} onChange={(e) => setForm({ ...form, motivo_consulta: e.target.value })}/></div>
          <div className="grid grid-cols-5 gap-2">
            <div><Label className="text-xs">TA</Label><Input value={form.ta ?? ""} onChange={(e) => setForm({ ...form, ta: e.target.value })}/></div>
            <div><Label className="text-xs">FC</Label><Input value={form.fc ?? ""} onChange={(e) => setForm({ ...form, fc: e.target.value })}/></div>
            <div><Label className="text-xs">FR</Label><Input value={form.fr ?? ""} onChange={(e) => setForm({ ...form, fr: e.target.value })}/></div>
            <div><Label className="text-xs">T°</Label><Input value={form.temp ?? ""} onChange={(e) => setForm({ ...form, temp: e.target.value })}/></div>
            <div><Label className="text-xs">SpO₂</Label><Input value={form.spo2 ?? ""} onChange={(e) => setForm({ ...form, spo2: e.target.value })}/></div>
          </div>
          <div><Label>Derivar a</Label>
            <Select value={form.derivado_a ?? ""} onValueChange={(v) => setForm({ ...form, derivado_a: v })}>
              <SelectTrigger><SelectValue placeholder="Sin asignar"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="consultorio">Consultorio</SelectItem>
                <SelectItem value="observacion">Observación</SelectItem>
                <SelectItem value="uci">UCI</SelectItem>
                <SelectItem value="cirugia">Cirugía</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button onClick={submit}>Registrar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
