import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CalendarRange, Plus, Settings } from "lucide-react";
import { format } from "date-fns";

const TIPOS_AREA = [
  "consulta","laboratorio","imagenologia","quirofano","rehabilitacion",
  "odontologia","vision","estetica","vacunacion","procedimiento","telemedicina","recovery","enfermeria"
];

export default function AgendaUniversal() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><CalendarRange className="h-6 w-6"/>Agendamiento Universal</h1>
        <p className="text-sm text-muted-foreground">Una sola agenda para todas las áreas: consultas, lab, imagen, cirugía, rehab y más</p>
      </div>
      <Tabs defaultValue="citas">
        <TabsList>
          <TabsTrigger value="citas">Citas</TabsTrigger>
          <TabsTrigger value="areas"><Settings className="h-4 w-4 mr-1"/>Áreas</TabsTrigger>
        </TabsList>
        <TabsContent value="citas" className="mt-4"><CitasTab/></TabsContent>
        <TabsContent value="areas" className="mt-4"><AreasTab/></TabsContent>
      </Tabs>
    </div>
  );
}

function CitasTab() {
  const { currentWorkspace } = useWorkspace();
  const [items, setItems] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [filterArea, setFilterArea] = useState<string>("all");
  const [form, setForm] = useState<any>({ prioridad: "normal" });

  useEffect(() => { if (currentWorkspace) { load(); loadCombos(); } }, [currentWorkspace, filterArea]);

  async function load() {
    let q = (supabase.from("citas_universales" as any) as any).select("*, pacientes(nombre,apellido), personal_salud(nombre,apellido), areas_servicio(nombre,tipo,color)").eq("workspace_id", currentWorkspace!.id).order("fecha_inicio",{ ascending: true }).limit(100);
    if (filterArea !== "all") q = q.eq("area_id", filterArea);
    const { data } = await q;
    setItems(data ?? []);
  }
  async function loadCombos() {
    const [a, p, pr] = await Promise.all([
      (supabase.from("areas_servicio" as any) as any).select("id,nombre,tipo,duracion_default_min").eq("workspace_id", currentWorkspace!.id).eq("activo",true),
      (supabase.from("pacientes") as any).select("id,nombre,apellido").eq("workspace_id", currentWorkspace!.id).eq("activo",true).limit(500),
      (supabase.from("personal_salud") as any).select("id,nombre,apellido").eq("workspace_id", currentWorkspace!.id),
    ]);
    setAreas(a.data ?? []); setPacientes(p.data ?? []); setProfesionales(pr.data ?? []);
  }
  async function save() {
    if (!form.area_id || !form.paciente_id || !form.fecha_inicio) return toast.error("Faltan datos");
    const area = areas.find(a => a.id === form.area_id);
    const inicio = new Date(form.fecha_inicio);
    const fin = new Date(inicio.getTime() + (area?.duracion_default_min ?? 30) * 60000);
    const { error } = await (supabase.from("citas_universales" as any) as any).insert({
      workspace_id: currentWorkspace!.id,
      area_id: form.area_id, paciente_id: form.paciente_id,
      profesional_id: form.profesional_id || null,
      fecha_inicio: inicio.toISOString(), fecha_fin: fin.toISOString(),
      motivo: form.motivo, notas: form.notas, prioridad: form.prioridad,
      origen: "manual",
    });
    if (error) return toast.error(error.message);
    toast.success("Cita agendada"); setOpen(false); setForm({ prioridad: "normal" }); load();
  }
  async function cambiarEstado(id: string, estado: string) {
    await (supabase.from("citas_universales" as any) as any).update({ estado }).eq("id", id);
    load();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <Select value={filterArea} onValueChange={setFilterArea}>
          <SelectTrigger className="w-64"><SelectValue/></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las áreas</SelectItem>
            {areas.map((a:any) => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>Nueva cita</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Agendar cita</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Área *</Label>
                <Select value={form.area_id ?? ""} onValueChange={v => setForm({...form, area_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar"/></SelectTrigger>
                  <SelectContent>{areas.map((a:any) => <SelectItem key={a.id} value={a.id}>{a.nombre} ({a.tipo})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Paciente *</Label>
                <Select value={form.paciente_id ?? ""} onValueChange={v => setForm({...form, paciente_id: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{pacientes.map((p:any) => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Profesional</Label>
                <Select value={form.profesional_id ?? ""} onValueChange={v => setForm({...form, profesional_id: v})}>
                  <SelectTrigger><SelectValue placeholder="(opcional)"/></SelectTrigger>
                  <SelectContent>{profesionales.map((p:any) => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Fecha y hora *</Label><Input type="datetime-local" value={form.fecha_inicio ?? ""} onChange={e => setForm({...form, fecha_inicio: e.target.value})}/></div>
                <div><Label>Prioridad</Label>
                  <Select value={form.prioridad} onValueChange={v => setForm({...form, prioridad: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Motivo</Label><Input value={form.motivo ?? ""} onChange={e => setForm({...form, motivo: e.target.value})}/></div>
              <div><Label>Notas</Label><Textarea value={form.notas ?? ""} onChange={e => setForm({...form, notas: e.target.value})}/></div>
            </div>
            <DialogFooter><Button onClick={save}>Agendar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-2">
        {items.map(i => (
          <Card key={i.id}><CardContent className="py-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-1 h-12 rounded" style={{ background: i.areas_servicio?.color || "#3b82f6" }}/>
              <div>
                <p className="font-medium">{i.pacientes?.nombre} {i.pacientes?.apellido}</p>
                <p className="text-xs text-muted-foreground">{i.areas_servicio?.nombre} • {format(new Date(i.fecha_inicio),"dd/MM HH:mm")} {i.personal_salud && `• Dr. ${i.personal_salud.nombre}`}</p>
                {i.motivo && <p className="text-xs">{i.motivo}</p>}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {i.prioridad === "urgente" && <Badge variant="destructive">Urgente</Badge>}
              <Badge variant="outline">{i.estado}</Badge>
              {i.estado === "pendiente" && <Button size="sm" onClick={() => cambiarEstado(i.id, "confirmada")}>Confirmar</Button>}
              {i.estado === "confirmada" && <Button size="sm" onClick={() => cambiarEstado(i.id, "completada")}>Completar</Button>}
              {!["completada","cancelada"].includes(i.estado) && <Button size="sm" variant="outline" onClick={() => cambiarEstado(i.id, "cancelada")}>Cancelar</Button>}
            </div>
          </CardContent></Card>
        ))}
        {items.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">Sin citas</CardContent></Card>}
      </div>
    </div>
  );
}

function AreasTab() {
  const { currentWorkspace } = useWorkspace();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ tipo: "consulta", duracion: 30, color: "#3b82f6" });

  useEffect(() => { if (currentWorkspace) load(); }, [currentWorkspace]);
  async function load() {
    const { data } = await (supabase.from("areas_servicio" as any) as any).select("*").eq("workspace_id", currentWorkspace!.id).order("nombre");
    setItems(data ?? []);
  }
  async function save() {
    if (!form.nombre || !form.codigo) return toast.error("Nombre y código requeridos");
    const { error } = await (supabase.from("areas_servicio" as any) as any).insert({
      workspace_id: currentWorkspace!.id,
      nombre: form.nombre, codigo: form.codigo.toUpperCase(), tipo: form.tipo,
      duracion_default_min: parseInt(form.duracion), color: form.color,
      requiere_ayuno: !!form.ayuno, requiere_preparacion: form.preparacion,
      capacidad_simultanea: parseInt(form.capacidad ?? "1"),
    });
    if (error) return toast.error(error.message);
    toast.success("Área creada"); setOpen(false); setForm({ tipo: "consulta", duracion: 30, color: "#3b82f6" }); load();
  }
  async function toggle(id: string, activo: boolean) {
    await (supabase.from("areas_servicio" as any) as any).update({ activo: !activo }).eq("id", id);
    load();
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>Nueva área</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Área de servicio</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Nombre *</Label><Input value={form.nombre ?? ""} onChange={e => setForm({...form, nombre: e.target.value})}/></div>
                <div><Label>Código *</Label><Input value={form.codigo ?? ""} onChange={e => setForm({...form, codigo: e.target.value})}/></div>
              </div>
              <div><Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setForm({...form, tipo: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{TIPOS_AREA.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Duración (min)</Label><Input type="number" value={form.duracion} onChange={e => setForm({...form, duracion: e.target.value})}/></div>
                <div><Label>Capacidad</Label><Input type="number" value={form.capacidad ?? "1"} onChange={e => setForm({...form, capacidad: e.target.value})}/></div>
                <div><Label>Color</Label><Input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})}/></div>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.ayuno} onChange={e => setForm({...form, ayuno: e.target.checked})}/> Requiere ayuno</label>
              <div><Label>Preparación</Label><Textarea value={form.preparacion ?? ""} onChange={e => setForm({...form, preparacion: e.target.value})}/></div>
            </div>
            <DialogFooter><Button onClick={save}>Crear</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {items.map(i => (
          <Card key={i.id}><CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-10 rounded" style={{ background: i.color }}/>
              <div>
                <p className="font-medium">{i.nombre} <Badge variant="outline" className="ml-1 text-xs">{i.codigo}</Badge></p>
                <p className="text-xs text-muted-foreground">{i.tipo} • {i.duracion_default_min} min • cap {i.capacidad_simultanea}</p>
              </div>
            </div>
            <Button size="sm" variant={i.activo ? "outline" : "secondary"} onClick={() => toggle(i.id, i.activo)}>{i.activo ? "Activa" : "Inactiva"}</Button>
          </CardContent></Card>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8 col-span-2">Crea tu primera área</p>}
      </div>
    </div>
  );
}
