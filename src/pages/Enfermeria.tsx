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
import { Heart, Plus, Activity, Pill, ClipboardCheck } from "lucide-react";
import { format } from "date-fns";

export default function Enfermeria() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Heart className="h-6 w-6"/>Enfermería</h1>
        <p className="text-sm text-muted-foreground">Valoración, plan de cuidados, signos vitales y administración de medicamentos</p>
      </div>
      <Tabs defaultValue="signos">
        <TabsList>
          <TabsTrigger value="signos"><Activity className="h-4 w-4 mr-1"/>Signos vitales</TabsTrigger>
          <TabsTrigger value="plan"><ClipboardCheck className="h-4 w-4 mr-1"/>Plan de cuidados</TabsTrigger>
          <TabsTrigger value="med"><Pill className="h-4 w-4 mr-1"/>Administración meds</TabsTrigger>
          <TabsTrigger value="proc">Procedimientos</TabsTrigger>
        </TabsList>
        <TabsContent value="signos" className="mt-4"><SignosVitalesTab/></TabsContent>
        <TabsContent value="plan" className="mt-4"><PlanCuidadosTab/></TabsContent>
        <TabsContent value="med" className="mt-4"><AdminMedicamentosTab/></TabsContent>
        <TabsContent value="proc" className="mt-4"><ProcedimientosTab/></TabsContent>
      </Tabs>
    </div>
  );
}

function PacienteSelect({ value, onChange }: { value: string; onChange: (v: string, pid: string) => void }) {
  const [admisiones, setAdmisiones] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("admisiones" as any).select("id,paciente_id,pacientes(nombre,apellido)").eq("estado","activa").then(({ data }: any) => setAdmisiones(data ?? []));
  }, []);
  return (
    <Select value={value} onValueChange={(v) => { const a = admisiones.find(x => x.id === v); onChange(v, a?.paciente_id); }}>
      <SelectTrigger><SelectValue placeholder="Paciente admitido"/></SelectTrigger>
      <SelectContent>{admisiones.map((a:any) => <SelectItem key={a.id} value={a.id}>{a.pacientes?.nombre} {a.pacientes?.apellido}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function SignosVitalesTab() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ turno: "manana" });

  useEffect(() => { load(); }, []);
  async function load() {
    const { data } = await (supabase.from("signos_vitales_turno" as any) as any).select("*, pacientes(nombre,apellido)").order("fecha_registro",{ ascending:false }).limit(50);
    setItems(data ?? []);
  }
  async function save() {
    if (!form.admision_id) return toast.error("Paciente requerido");
    const { error } = await (supabase.from("signos_vitales_turno" as any) as any).insert({
      admision_id: form.admision_id, paciente_id: form.paciente_id, turno: form.turno,
      ta_sistolica: form.ta_sis ? parseInt(form.ta_sis) : null,
      ta_diastolica: form.ta_dia ? parseInt(form.ta_dia) : null,
      fc: form.fc ? parseInt(form.fc) : null,
      fr: form.fr ? parseInt(form.fr) : null,
      temperatura: form.temp ? parseFloat(form.temp) : null,
      saturacion: form.sat ? parseInt(form.sat) : null,
      glicemia: form.glic ? parseFloat(form.glic) : null,
      dolor_eva: form.dolor ? parseInt(form.dolor) : null,
      diuresis_ml: form.diuresis ? parseInt(form.diuresis) : null,
      observaciones: form.obs,
    });
    if (error) return toast.error(error.message);
    toast.success("Signos registrados"); setOpen(false); setForm({ turno: "manana" }); load();
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>Registrar</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Signos vitales</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Paciente</Label><PacienteSelect value={form.admision_id ?? ""} onChange={(v,p) => setForm({...form, admision_id: v, paciente_id: p})}/></div>
              <div><Label>Turno</Label>
                <Select value={form.turno} onValueChange={v => setForm({...form, turno: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="manana">Mañana</SelectItem><SelectItem value="tarde">Tarde</SelectItem><SelectItem value="noche">Noche</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>TA sis</Label><Input type="number" value={form.ta_sis ?? ""} onChange={e => setForm({...form, ta_sis: e.target.value})}/></div>
                <div><Label>TA dia</Label><Input type="number" value={form.ta_dia ?? ""} onChange={e => setForm({...form, ta_dia: e.target.value})}/></div>
                <div><Label>FC</Label><Input type="number" value={form.fc ?? ""} onChange={e => setForm({...form, fc: e.target.value})}/></div>
                <div><Label>FR</Label><Input type="number" value={form.fr ?? ""} onChange={e => setForm({...form, fr: e.target.value})}/></div>
                <div><Label>T°</Label><Input type="number" step="0.1" value={form.temp ?? ""} onChange={e => setForm({...form, temp: e.target.value})}/></div>
                <div><Label>Sat O2</Label><Input type="number" value={form.sat ?? ""} onChange={e => setForm({...form, sat: e.target.value})}/></div>
                <div><Label>Glic</Label><Input type="number" value={form.glic ?? ""} onChange={e => setForm({...form, glic: e.target.value})}/></div>
                <div><Label>Dolor</Label><Input type="number" max={10} value={form.dolor ?? ""} onChange={e => setForm({...form, dolor: e.target.value})}/></div>
                <div><Label>Diuresis</Label><Input type="number" value={form.diuresis ?? ""} onChange={e => setForm({...form, diuresis: e.target.value})}/></div>
              </div>
              <div><Label>Observaciones</Label><Textarea value={form.obs ?? ""} onChange={e => setForm({...form, obs: e.target.value})}/></div>
            </div>
            <DialogFooter><Button onClick={save}>Guardar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-2">
        {items.map(i => (
          <Card key={i.id}><CardContent className="py-3 flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-medium">{i.pacientes?.nombre} {i.pacientes?.apellido} <Badge variant="outline" className="ml-2">{i.turno}</Badge></p>
              <p className="text-xs text-muted-foreground">{format(new Date(i.fecha_registro), "dd/MM HH:mm")}</p>
            </div>
            <div className="text-sm flex gap-3 flex-wrap">
              {i.ta_sistolica && <span>TA {i.ta_sistolica}/{i.ta_diastolica}</span>}
              {i.fc && <span>FC {i.fc}</span>}
              {i.temperatura && <span>T° {i.temperatura}</span>}
              {i.saturacion && <span>SatO2 {i.saturacion}%</span>}
              {i.dolor_eva != null && <span>Dolor {i.dolor_eva}/10</span>}
            </div>
          </CardContent></Card>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sin registros</p>}
      </div>
    </div>
  );
}

function PlanCuidadosTab() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ prioridad: "media" });

  useEffect(() => { load(); }, []);
  async function load() {
    const { data } = await (supabase.from("plan_cuidados_enfermeria" as any) as any).select("*, pacientes(nombre,apellido)").eq("estado","activo").order("created_at",{ ascending:false });
    setItems(data ?? []);
  }
  async function save() {
    if (!form.diagnostico_nanda || !form.admision_id) return toast.error("Faltan datos");
    const { error } = await (supabase.from("plan_cuidados_enfermeria" as any) as any).insert({
      admision_id: form.admision_id, paciente_id: form.paciente_id,
      diagnostico_nanda: form.diagnostico_nanda, resultado_noc: form.resultado_noc,
      intervencion_nic: form.intervencion_nic, prioridad: form.prioridad,
      observaciones: form.obs,
    });
    if (error) return toast.error(error.message);
    toast.success("Plan creado"); setOpen(false); setForm({ prioridad: "media" }); load();
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>Nuevo plan</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Plan de cuidados (NANDA/NOC/NIC)</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Paciente</Label><PacienteSelect value={form.admision_id ?? ""} onChange={(v,p) => setForm({...form, admision_id: v, paciente_id: p})}/></div>
              <div><Label>Diagnóstico NANDA *</Label><Input value={form.diagnostico_nanda ?? ""} onChange={e => setForm({...form, diagnostico_nanda: e.target.value})} placeholder="Ej: Riesgo de caídas r/c..."/></div>
              <div><Label>Resultado NOC</Label><Input value={form.resultado_noc ?? ""} onChange={e => setForm({...form, resultado_noc: e.target.value})}/></div>
              <div><Label>Intervención NIC</Label><Textarea value={form.intervencion_nic ?? ""} onChange={e => setForm({...form, intervencion_nic: e.target.value})}/></div>
              <div><Label>Prioridad</Label>
                <Select value={form.prioridad} onValueChange={v => setForm({...form, prioridad: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="alta">Alta</SelectItem><SelectItem value="media">Media</SelectItem><SelectItem value="baja">Baja</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={save}>Crear</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {items.map(i => (
          <Card key={i.id}><CardContent className="py-3">
            <div className="flex items-start justify-between mb-1">
              <p className="font-medium">{i.pacientes?.nombre} {i.pacientes?.apellido}</p>
              <Badge>{i.prioridad}</Badge>
            </div>
            <p className="text-sm font-medium">{i.diagnostico_nanda}</p>
            {i.intervencion_nic && <p className="text-xs text-muted-foreground mt-1">{i.intervencion_nic}</p>}
          </CardContent></Card>
        ))}
        {items.length === 0 && <p className="col-span-2 text-sm text-muted-foreground text-center py-8">Sin planes activos</p>}
      </div>
    </div>
  );
}

function AdminMedicamentosTab() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => { load(); }, []);
  async function load() {
    const { data } = await (supabase.from("administracion_medicamentos" as any) as any).select("*, pacientes(nombre,apellido)").order("hora_programada",{ ascending:false }).limit(50);
    setItems(data ?? []);
  }
  async function save() {
    if (!form.admision_id || !form.medicamento) return toast.error("Faltan datos");
    const { error } = await (supabase.from("administracion_medicamentos" as any) as any).insert({
      admision_id: form.admision_id, paciente_id: form.paciente_id,
      medicamento: form.medicamento, dosis: form.dosis, via: form.via,
      hora_programada: form.hora_programada, estado: "programada",
    });
    if (error) return toast.error(error.message);
    toast.success("Programado"); setOpen(false); setForm({}); load();
  }
  async function marcar(id: string, estado: string) {
    const { error } = await (supabase.from("administracion_medicamentos" as any) as any).update({ estado, hora_administrada: estado === "administrada" ? new Date().toISOString() : null }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>Programar</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Administración de medicamento</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Paciente</Label><PacienteSelect value={form.admision_id ?? ""} onChange={(v,p) => setForm({...form, admision_id: v, paciente_id: p})}/></div>
              <div><Label>Medicamento *</Label><Input value={form.medicamento ?? ""} onChange={e => setForm({...form, medicamento: e.target.value})}/></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Dosis</Label><Input value={form.dosis ?? ""} onChange={e => setForm({...form, dosis: e.target.value})}/></div>
                <div><Label>Vía</Label><Input value={form.via ?? ""} onChange={e => setForm({...form, via: e.target.value})} placeholder="VO, IV, IM..."/></div>
              </div>
              <div><Label>Hora programada</Label><Input type="datetime-local" value={form.hora_programada ?? ""} onChange={e => setForm({...form, hora_programada: e.target.value})}/></div>
            </div>
            <DialogFooter><Button onClick={save}>Programar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-2">
        {items.map(i => (
          <Card key={i.id}><CardContent className="py-3 flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-medium">{i.medicamento} <span className="text-sm text-muted-foreground">{i.dosis} {i.via}</span></p>
              <p className="text-xs text-muted-foreground">{i.pacientes?.nombre} {i.pacientes?.apellido} • {i.hora_programada && format(new Date(i.hora_programada),"dd/MM HH:mm")}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant={i.estado === "administrada" ? "default" : "outline"}>{i.estado}</Badge>
              {i.estado === "programada" && <>
                <Button size="sm" onClick={() => marcar(i.id, "administrada")}>✓</Button>
                <Button size="sm" variant="outline" onClick={() => marcar(i.id, "omitida")}>Omitir</Button>
              </>}
            </div>
          </CardContent></Card>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sin medicamentos</p>}
      </div>
    </div>
  );
}

function ProcedimientosTab() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  useEffect(() => { load(); }, []);
  async function load() {
    const { data } = await (supabase.from("procedimientos_enfermeria" as any) as any).select("*, pacientes(nombre,apellido)").order("fecha_hora",{ ascending:false }).limit(50);
    setItems(data ?? []);
  }
  async function save() {
    if (!form.admision_id || !form.tipo) return toast.error("Faltan datos");
    const { error } = await (supabase.from("procedimientos_enfermeria" as any) as any).insert({
      admision_id: form.admision_id, paciente_id: form.paciente_id,
      tipo: form.tipo, descripcion: form.descripcion, resultado: form.resultado,
    });
    if (error) return toast.error(error.message);
    toast.success("Registrado"); setOpen(false); setForm({}); load();
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>Nuevo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Procedimiento de enfermería</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Paciente</Label><PacienteSelect value={form.admision_id ?? ""} onChange={(v,p) => setForm({...form, admision_id: v, paciente_id: p})}/></div>
              <div><Label>Tipo *</Label><Input value={form.tipo ?? ""} onChange={e => setForm({...form, tipo: e.target.value})} placeholder="Curación, sondaje, venoclisis..."/></div>
              <div><Label>Descripción</Label><Textarea value={form.descripcion ?? ""} onChange={e => setForm({...form, descripcion: e.target.value})}/></div>
              <div><Label>Resultado</Label><Textarea value={form.resultado ?? ""} onChange={e => setForm({...form, resultado: e.target.value})}/></div>
            </div>
            <DialogFooter><Button onClick={save}>Guardar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-2">
        {items.map(i => (
          <Card key={i.id}><CardContent className="py-3">
            <p className="font-medium">{i.tipo}</p>
            <p className="text-xs text-muted-foreground">{i.pacientes?.nombre} {i.pacientes?.apellido} • {format(new Date(i.fecha_hora),"dd/MM HH:mm")}</p>
            {i.descripcion && <p className="text-sm mt-1">{i.descripcion}</p>}
          </CardContent></Card>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sin procedimientos</p>}
      </div>
    </div>
  );
}
