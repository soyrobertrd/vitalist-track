import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Stethoscope, Plus, ClipboardList, Users } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const TIPOS = [
  { value: "general", label: "Ronda general", color: "bg-blue-100 text-blue-700" },
  { value: "uci", label: "UCI", color: "bg-purple-100 text-purple-700" },
  { value: "urgencia", label: "Urgencia", color: "bg-red-100 text-red-700" },
  { value: "docente", label: "Docente", color: "bg-amber-100 text-amber-700" },
  { value: "interconsulta", label: "Interconsulta", color: "bg-green-100 text-green-700" },
];

export default function RondasMedicas() {
  const { currentWorkspace } = useWorkspace();
  const [tab, setTab] = useState("activas");
  const [rondas, setRondas] = useState<any[]>([]);

  useEffect(() => { if (currentWorkspace) load(); }, [currentWorkspace, tab]);

  async function load() {
    let q = (supabase.from("rondas_medicas" as any) as any).select("*, personal_salud!medico_lider_id(nombre,apellido)").eq("workspace_id", currentWorkspace!.id).order("fecha_ronda", { ascending: false });
    if (tab === "activas") q = q.in("estado", ["planificada","en_curso"]);
    else q = q.in("estado", ["finalizada","cancelada"]);
    const { data } = await q;
    setRondas(data ?? []);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Stethoscope className="h-6 w-6"/>Rondas / Visitas Médicas</h1>
          <p className="text-sm text-muted-foreground">Pase de visita organizado por servicio y tipo</p>
        </div>
        <NuevaRondaDialog onCreated={load} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="activas">Activas</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          {rondas.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">Sin rondas</CardContent></Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {rondas.map(r => <RondaCard key={r.id} r={r} onUpdated={load} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RondaCard({ r, onUpdated }: { r: any; onUpdated: () => void }) {
  const tipo = TIPOS.find(t => t.value === r.tipo);
  return (
    <Card className="hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{format(new Date(r.fecha_ronda), "dd MMM yyyy HH:mm", { locale: es })}</CardTitle>
            {r.personal_salud && <p className="text-xs text-muted-foreground mt-1">Líder: Dr. {r.personal_salud.nombre} {r.personal_salud.apellido}</p>}
          </div>
          <Badge className={tipo?.color}>{tipo?.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-2">
        <Badge variant="outline">{r.estado}</Badge>
        {r.observaciones_generales && <p className="text-sm text-muted-foreground line-clamp-2">{r.observaciones_generales}</p>}
        <div className="flex gap-2 pt-2">
          <NotaRondaDialog rondaId={r.id} />
          {r.estado === "planificada" && <Button size="sm" variant="outline" onClick={async () => { await (supabase.from("rondas_medicas" as any) as any).update({ estado: "en_curso" }).eq("id", r.id); toast.success("Ronda iniciada"); onUpdated(); }}>Iniciar</Button>}
          {r.estado === "en_curso" && <Button size="sm" onClick={async () => { await (supabase.from("rondas_medicas" as any) as any).update({ estado: "finalizada" }).eq("id", r.id); toast.success("Ronda finalizada"); onUpdated(); }}>Finalizar</Button>}
        </div>
      </CardContent>
    </Card>
  );
}

function NuevaRondaDialog({ onCreated }: { onCreated: () => void }) {
  const { currentWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ tipo: "general", fecha_ronda: new Date().toISOString().slice(0,16) });
  const [profesionales, setProfesionales] = useState<any[]>([]);

  useEffect(() => {
    if (open && currentWorkspace) {
      supabase.from("personal_salud").select("id,nombre,apellido").eq("workspace_id", currentWorkspace.id).order("nombre").then(({ data }) => setProfesionales(data ?? []));
    }
  }, [open, currentWorkspace]);

  async function submit() {
    if (!currentWorkspace) return;
    const { error } = await (supabase.from("rondas_medicas" as any) as any).insert({
      workspace_id: currentWorkspace.id,
      tipo: form.tipo,
      fecha_ronda: form.fecha_ronda,
      medico_lider_id: form.medico_lider_id || null,
      observaciones_generales: form.obs || null,
      estado: "planificada",
    });
    if (error) return toast.error(error.message);
    toast.success("Ronda creada");
    setOpen(false); setForm({ tipo: "general", fecha_ronda: new Date().toISOString().slice(0,16) });
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>Nueva ronda</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Programar ronda médica</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={v => setForm({...form, tipo: v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>{TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Fecha y hora</Label><Input type="datetime-local" value={form.fecha_ronda} onChange={e => setForm({...form, fecha_ronda: e.target.value})}/></div>
          <div><Label>Médico líder</Label>
            <Select value={form.medico_lider_id ?? ""} onValueChange={v => setForm({...form, medico_lider_id: v})}>
              <SelectTrigger><SelectValue placeholder="Seleccionar"/></SelectTrigger>
              <SelectContent>{profesionales.map((p:any) => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Observaciones</Label><Textarea value={form.obs ?? ""} onChange={e => setForm({...form, obs: e.target.value})}/></div>
        </div>
        <DialogFooter><Button onClick={submit}>Crear</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NotaRondaDialog({ rondaId }: { rondaId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const [pacientes, setPacientes] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      supabase.from("admisiones" as any).select("id,paciente_id,pacientes(nombre,apellido)").eq("estado", "activa").then(({ data }: any) => setPacientes(data ?? []));
    }
  }, [open]);

  async function save() {
    if (!form.admision_id) return toast.error("Selecciona paciente");
    const adm = pacientes.find(p => p.id === form.admision_id);
    const { error } = await (supabase.from("ronda_paciente_notas" as any) as any).insert({
      ronda_id: rondaId,
      admision_id: form.admision_id,
      paciente_id: adm.paciente_id,
      evolucion: form.evolucion,
      cambios_plan: form.cambios_plan,
      estado_paciente: form.estado_paciente,
      duracion_minutos: form.duracion_minutos ? parseInt(form.duracion_minutos) : null,
    });
    if (error) return toast.error(error.message);
    toast.success("Nota guardada"); setOpen(false); setForm({});
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><ClipboardList className="h-3 w-3 mr-1"/>Nota paciente</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nota de paciente en ronda</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Paciente admitido</Label>
            <Select value={form.admision_id ?? ""} onValueChange={v => setForm({...form, admision_id: v})}>
              <SelectTrigger><SelectValue placeholder="Seleccionar"/></SelectTrigger>
              <SelectContent>{pacientes.map((p:any) => <SelectItem key={p.id} value={p.id}>{p.pacientes?.nombre} {p.pacientes?.apellido}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Estado</Label>
            <Select value={form.estado_paciente ?? ""} onValueChange={v => setForm({...form, estado_paciente: v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="estable">Estable</SelectItem>
                <SelectItem value="mejoria">Mejoría</SelectItem>
                <SelectItem value="critico">Crítico</SelectItem>
                <SelectItem value="deterioro">Deterioro</SelectItem>
                <SelectItem value="alta_proxima">Alta próxima</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Evolución</Label><Textarea value={form.evolucion ?? ""} onChange={e => setForm({...form, evolucion: e.target.value})}/></div>
          <div><Label>Cambios al plan</Label><Textarea value={form.cambios_plan ?? ""} onChange={e => setForm({...form, cambios_plan: e.target.value})}/></div>
          <div><Label>Duración (min)</Label><Input type="number" value={form.duracion_minutos ?? ""} onChange={e => setForm({...form, duracion_minutos: e.target.value})}/></div>
        </div>
        <DialogFooter><Button onClick={save}>Guardar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
