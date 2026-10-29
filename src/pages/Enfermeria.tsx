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
import { Heart, Plus, Activity, Pill, ClipboardCheck, AlertOctagon, Droplets, Bed, Baby, FileCheck2 } from "lucide-react";
import { format } from "date-fns";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EnfermeriaEmergenciasTab } from "@/components/enfermeria/areas/EnfermeriaEmergenciasTab";
import { EnfermeriaUciTab } from "@/components/enfermeria/areas/EnfermeriaUciTab";
import { EnfermeriaPisoHospitalizacionTab } from "@/components/enfermeria/areas/EnfermeriaPisoHospitalizacionTab";
import { EnfermeriaPediatricaNeonatalTab } from "@/components/enfermeria/areas/EnfermeriaPediatricaNeonatalTab";
import { PaseGuardiaSbarTab } from "@/components/enfermeria/sbar/PaseGuardiaSbarTab";

export default function Enfermeria() {
  const [counts, setCounts] = useState({ signos: 0, planes: 0, meds: 0, proc: 0 });

  useEffect(() => {
    Promise.all([
      (supabase.from("signos_vitales_turno" as any) as any).select("id", { count: "exact", head: true }),
      (supabase.from("plan_cuidados_enfermeria" as any) as any).select("id", { count: "exact", head: true }).eq("estado", "activo"),
      (supabase.from("administracion_medicamentos" as any) as any).select("id", { count: "exact", head: true }).eq("estado", "programada"),
      (supabase.from("procedimientos_enfermeria" as any) as any).select("id", { count: "exact", head: true }),
    ]).then(([s, pl, m, pr]) => {
      setCounts({
        signos: s.count || 0,
        planes: pl.count || 0,
        meds: m.count || 0,
        proc: pr.count || 0,
      });
    });
  }, []);

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="Enfermería & Cuidados Clínicos"
        subtitle="Valoración integral, signos vitales por turno, planes NANDA/NIC/NOC y administración de fármacos"
        icon={Heart}
        variant="teal"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ClinicalKpiCard
          title="Signos vitales tomados"
          value={counts.signos}
          icon={Activity}
          variant="teal"
        />
        <ClinicalKpiCard
          title="Planes activos NANDA"
          value={counts.planes}
          icon={ClipboardCheck}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Fármacos programados"
          value={counts.meds}
          icon={Pill}
          variant="purple"
          alert={counts.meds > 0}
        />
        <ClinicalKpiCard
          title="Procedimientos"
          value={counts.proc}
          icon={Heart}
          variant="emerald"
        />
      </div>

      <Tabs defaultValue="emergencias" className="space-y-4">
        <TabsList className="w-full flex-wrap justify-start gap-1 p-1.5 bg-muted/40 rounded-2xl border border-border/70 h-auto">
          <TabsTrigger value="emergencias" className="rounded-xl px-3.5 py-2 text-xs font-semibold gap-1.5">
            <AlertOctagon className="h-4 w-4 text-red-600"/>
            Emergencias (Triage & STAT)
          </TabsTrigger>
          <TabsTrigger value="uci" className="rounded-xl px-3.5 py-2 text-xs font-semibold gap-1.5">
            <Droplets className="h-4 w-4 text-blue-600"/>
            UCI (Balance Hídrico & RASS)
          </TabsTrigger>
          <TabsTrigger value="piso" className="rounded-xl px-3.5 py-2 text-xs font-semibold gap-1.5">
            <Bed className="h-4 w-4 text-purple-600"/>
            Piso / Habitaciones (Kardex 5C)
          </TabsTrigger>
          <TabsTrigger value="pediatria" className="rounded-xl px-3.5 py-2 text-xs font-semibold gap-1.5">
            <Baby className="h-4 w-4 text-teal-600"/>
            Pediátrico & Neonatal
          </TabsTrigger>
          <TabsTrigger value="sbar" className="rounded-xl px-3.5 py-2 text-xs font-semibold gap-1.5">
            <FileCheck2 className="h-4 w-4 text-cyan-600"/>
            Pase de Guardia (SBAR)
          </TabsTrigger>
          <TabsTrigger value="signos" className="rounded-xl px-3.5 py-2 text-xs font-semibold gap-1.5">
            <Activity className="h-4 w-4 text-emerald-600"/>
            Signos Vitales
          </TabsTrigger>
          <TabsTrigger value="plan" className="rounded-xl px-3.5 py-2 text-xs font-semibold gap-1.5">
            <ClipboardCheck className="h-4 w-4 text-amber-600"/>
            Planes NANDA
          </TabsTrigger>
          <TabsTrigger value="med" className="rounded-xl px-3.5 py-2 text-xs font-semibold gap-1.5">
            <Pill className="h-4 w-4 text-indigo-600"/>
            Fármacos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="emergencias" className="mt-4"><EnfermeriaEmergenciasTab/></TabsContent>
        <TabsContent value="uci" className="mt-4"><EnfermeriaUciTab/></TabsContent>
        <TabsContent value="piso" className="mt-4"><EnfermeriaPisoHospitalizacionTab/></TabsContent>
        <TabsContent value="pediatria" className="mt-4"><EnfermeriaPediatricaNeonatalTab/></TabsContent>
        <TabsContent value="sbar" className="mt-4"><PaseGuardiaSbarTab/></TabsContent>
        <TabsContent value="signos" className="mt-4"><SignosVitalesTab/></TabsContent>
        <TabsContent value="plan" className="mt-4"><PlanCuidadosTab/></TabsContent>
        <TabsContent value="med" className="mt-4"><AdminMedicamentosTab/></TabsContent>
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
      <div className="grid gap-2.5">
        {items.map(i => (
          <Card key={i.id} className="rounded-2xl border-border/80 shadow-none hover:border-teal-500/40 transition-colors">
            <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-semibold text-foreground text-sm flex items-center gap-2">
                  {i.pacientes?.nombre} {i.pacientes?.apellido} 
                  <Badge variant="outline" className="rounded-full text-[11px] capitalize">{i.turno}</Badge>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(i.fecha_registro), "dd/MM HH:mm")}</p>
              </div>
              <div className="text-xs flex gap-2.5 flex-wrap">
                {i.ta_sistolica && <span className="px-2.5 py-1 rounded-lg bg-muted/60 font-medium">TA: <b>{i.ta_sistolica}/{i.ta_diastolica}</b></span>}
                {i.fc && <span className="px-2.5 py-1 rounded-lg bg-muted/60 font-medium">FC: <b>{i.fc}</b> lpm</span>}
                {i.temperatura && <span className="px-2.5 py-1 rounded-lg bg-muted/60 font-medium">T°: <b>{i.temperatura}°C</b></span>}
                {i.saturacion && <span className="px-2.5 py-1 rounded-lg bg-muted/60 font-medium">SatO2: <b>{i.saturacion}%</b></span>}
                {i.dolor_eva != null && <span className="px-2.5 py-1 rounded-lg bg-muted/60 font-medium">EVA: <b>{i.dolor_eva}/10</b></span>}
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sin registros de signos vitales</p>}
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="rounded-xl shadow-none"><Plus className="h-4 w-4 mr-1.5"/>Nuevo plan</Button></DialogTrigger>
          <DialogContent className="rounded-2xl">
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
            <DialogFooter><Button onClick={save} className="rounded-xl">Crear Plan</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map(i => (
          <Card key={i.id} className="rounded-2xl border-border/80 shadow-none hover:border-blue-500/40 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="font-semibold text-foreground text-sm">{i.pacientes?.nombre} {i.pacientes?.apellido}</p>
                <Badge variant={i.prioridad === "alta" ? "destructive" : "secondary"} className="rounded-full text-[10px] capitalize">Prioridad {i.prioridad}</Badge>
              </div>
              <p className="text-sm font-medium text-foreground">{i.diagnostico_nanda}</p>
              {i.intervencion_nic && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{i.intervencion_nic}</p>}
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <p className="col-span-2 text-sm text-muted-foreground text-center py-8">Sin planes de cuidados activos</p>}
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="rounded-xl shadow-none"><Plus className="h-4 w-4 mr-1.5"/>Programar fármaco</Button></DialogTrigger>
          <DialogContent className="rounded-2xl">
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
            <DialogFooter><Button onClick={save} className="rounded-xl">Programar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-2.5">
        {items.map(i => (
          <Card key={i.id} className="rounded-2xl border-border/80 shadow-none hover:border-purple-500/40 transition-colors">
            <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-semibold text-foreground text-sm">{i.medicamento} <span className="text-xs font-normal text-muted-foreground">({i.dosis} · {i.via})</span></p>
                <p className="text-xs text-muted-foreground mt-0.5">{i.pacientes?.nombre} {i.pacientes?.apellido} • {i.hora_programada && format(new Date(i.hora_programada),"dd/MM HH:mm")}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={i.estado} />
                {i.estado === "programada" && <>
                  <Button size="sm" className="rounded-xl h-8 px-2.5" onClick={() => marcar(i.id, "administrada")}>✓ Administrar</Button>
                  <Button size="sm" variant="outline" className="rounded-xl h-8 px-2.5" onClick={() => marcar(i.id, "omitida")}>Omitir</Button>
                </>}
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sin medicamentos programados</p>}
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="rounded-xl shadow-none"><Plus className="h-4 w-4 mr-1.5"/>Nuevo procedimiento</Button></DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle>Procedimiento de enfermería</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Paciente</Label><PacienteSelect value={form.admision_id ?? ""} onChange={(v,p) => setForm({...form, admision_id: v, paciente_id: p})}/></div>
              <div><Label>Tipo *</Label><Input value={form.tipo ?? ""} onChange={e => setForm({...form, tipo: e.target.value})} placeholder="Curación, sondaje, venoclisis..."/></div>
              <div><Label>Descripción</Label><Textarea value={form.descripcion ?? ""} onChange={e => setForm({...form, descripcion: e.target.value})}/></div>
              <div><Label>Resultado</Label><Textarea value={form.resultado ?? ""} onChange={e => setForm({...form, resultado: e.target.value})}/></div>
            </div>
            <DialogFooter><Button onClick={save} className="rounded-xl">Guardar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-2.5">
        {items.map(i => (
          <Card key={i.id} className="rounded-2xl border-border/80 shadow-none hover:border-emerald-500/40 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-foreground text-sm">{i.tipo}</p>
                <span className="text-xs text-muted-foreground">{format(new Date(i.fecha_hora),"dd/MM HH:mm")}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{i.pacientes?.nombre} {i.pacientes?.apellido}</p>
              {i.descripcion && <p className="text-sm mt-1.5 text-foreground/90">{i.descripcion}</p>}
              {i.resultado && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Resultado: {i.resultado}</p>}
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sin procedimientos registrados</p>}
      </div>
    </div>
  );
}
