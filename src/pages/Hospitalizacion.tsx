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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BedDouble, Plus, LogOut, Activity } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Admision {
  id: string; paciente_id: string; tipo: string; motivo_ingreso: string; estado: string;
  fecha_ingreso: string; fecha_alta: string | null; cama_id: string | null;
  pacientes?: { nombre: string; apellido: string };
  camas?: { identificador: string; tipo: string };
}

const TIPOS = [
  { value: "hospitalizacion", label: "Hospitalización", color: "bg-blue-100 text-blue-700" },
  { value: "emergencia", label: "Emergencia", color: "bg-red-100 text-red-700" },
  { value: "uci", label: "UCI", color: "bg-purple-100 text-purple-700" },
  { value: "observacion", label: "Observación", color: "bg-yellow-100 text-yellow-700" },
];

export default function Hospitalizacion() {
  const { currentWorkspace } = useWorkspace();
  const [tab, setTab] = useState("activas");
  const [admisiones, setAdmisiones] = useState<Admision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, [tab]);

  async function load() {
    setLoading(true);
    const q = supabase.from("admisiones" as any).select("*, pacientes(nombre,apellido), camas(identificador,tipo)")
      .order("fecha_ingreso", { ascending: false });
    if (tab === "activas") q.eq("estado", "activa");
    if (tab === "historico") q.in("estado", ["alta", "traslado"]);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setAdmisiones((data as any) ?? []);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BedDouble className="h-6 w-6"/>Hospitalización</h1>
          <p className="text-sm text-muted-foreground">Admisiones, emergencias, UCI</p>
        </div>
        <NuevaAdmisionDialog onCreated={load} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="activas">Activas</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? <p className="text-sm text-muted-foreground">Cargando...</p> :
           admisiones.length === 0 ? <Card><CardContent className="py-10 text-center text-muted-foreground">Sin admisiones</CardContent></Card> :
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {admisiones.map(a => <AdmisionCard key={a.id} a={a} onUpdated={load} />)}
            </div>
          }
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdmisionCard({ a, onUpdated }: { a: Admision; onUpdated: () => void }) {
  const tipo = TIPOS.find(t => t.value === a.tipo);
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{a.pacientes?.nombre} {a.pacientes?.apellido}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(a.fecha_ingreso), "dd MMM yyyy HH:mm", { locale: es })}
            </p>
          </div>
          <Badge className={tipo?.color}>{tipo?.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-2">
        <p className="text-sm"><strong>Motivo:</strong> {a.motivo_ingreso}</p>
        {a.camas && <p className="text-xs text-muted-foreground">Cama {a.camas.identificador} ({a.camas.tipo})</p>}
        <div className="flex gap-2 pt-2">
          {a.tipo === "uci" && <UciNotaDialog admisionId={a.id} pacienteId={a.paciente_id} />}
          {a.estado === "activa" && <DarAltaButton admisionId={a.id} onDone={onUpdated} />}
        </div>
      </CardContent>
    </Card>
  );
}

function NuevaAdmisionDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ tipo: "hospitalizacion" });
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [camas, setCamas] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      supabase.from("pacientes").select("id,nombre,apellido,cedula").order("nombre").limit(200).then(({ data }) => setPacientes(data ?? []));
      supabase.from("camas" as any).select("id,identificador,tipo,estado").eq("estado", "disponible").then(({ data }) => setCamas((data as any) ?? []));
    }
  }, [open]);

  async function submit() {
    if (!form.paciente_id || !form.motivo_ingreso) return toast.error("Paciente y motivo requeridos");
    const { error } = await supabase.from("admisiones" as any).insert({
      paciente_id: form.paciente_id,
      tipo: form.tipo,
      motivo_ingreso: form.motivo_ingreso,
      diagnostico_ingreso: form.diagnostico_ingreso || null,
      cama_id: form.cama_id || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Admisión creada");
    setForm({ tipo: "hospitalizacion" });
    setOpen(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>Nueva admisión</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nueva admisión</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Paciente *</Label>
            <Select value={form.paciente_id ?? ""} onValueChange={(v) => setForm({ ...form, paciente_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
              <SelectContent>{pacientes.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido} ({p.cedula})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Tipo *</Label>
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>{TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Motivo *</Label><Input value={form.motivo_ingreso ?? ""} onChange={(e) => setForm({ ...form, motivo_ingreso: e.target.value })} /></div>
          <div><Label>Diagnóstico de ingreso</Label><Textarea value={form.diagnostico_ingreso ?? ""} onChange={(e) => setForm({ ...form, diagnostico_ingreso: e.target.value })} /></div>
          <div><Label>Cama (disponibles)</Label>
            <Select value={form.cama_id ?? ""} onValueChange={(v) => setForm({ ...form, cama_id: v })}>
              <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
              <SelectContent>{camas.map(c => <SelectItem key={c.id} value={c.id}>{c.identificador} ({c.tipo})</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button onClick={submit}>Crear admisión</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DarAltaButton({ admisionId, onDone }: { admisionId: string; onDone: () => void }) {
  return (
    <Button size="sm" variant="outline" onClick={async () => {
      const { error } = await supabase.from("admisiones" as any).update({ estado: "alta", fecha_alta: new Date().toISOString(), tipo_alta: "medica" }).eq("id", admisionId);
      if (error) toast.error(error.message); else { toast.success("Paciente dado de alta"); onDone(); }
    }}><LogOut className="h-3 w-3 mr-1"/>Dar de alta</Button>
  );
}

function UciNotaDialog({ admisionId, pacienteId }: { admisionId: string; pacienteId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  async function save() {
    const { error } = await supabase.from("uci_notas" as any).insert({
      admision_id: admisionId, paciente_id: pacienteId,
      sofa_score: form.sofa ? parseInt(form.sofa) : null,
      apache_ii_score: form.apache ? parseInt(form.apache) : null,
      glasgow: form.glasgow ? parseInt(form.glasgow) : null,
      ventilacion: form.ventilacion ? { texto: form.ventilacion } : {},
      notas: form.notas || null,
    });
    if (error) toast.error(error.message); else { toast.success("Nota UCI guardada"); setOpen(false); setForm({}); }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Activity className="h-3 w-3 mr-1"/>Nota UCI</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nota UCI</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div><Label>SOFA</Label><Input type="number" value={form.sofa ?? ""} onChange={(e) => setForm({ ...form, sofa: e.target.value })}/></div>
            <div><Label>APACHE II</Label><Input type="number" value={form.apache ?? ""} onChange={(e) => setForm({ ...form, apache: e.target.value })}/></div>
            <div><Label>Glasgow</Label><Input type="number" max={15} value={form.glasgow ?? ""} onChange={(e) => setForm({ ...form, glasgow: e.target.value })}/></div>
          </div>
          <div><Label>Ventilación</Label><Input placeholder="Modo, FiO2, PEEP, VT, FR" value={form.ventilacion ?? ""} onChange={(e) => setForm({ ...form, ventilacion: e.target.value })}/></div>
          <div><Label>Notas</Label><Textarea value={form.notas ?? ""} onChange={(e) => setForm({ ...form, notas: e.target.value })}/></div>
        </div>
        <DialogFooter><Button onClick={save}>Guardar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
