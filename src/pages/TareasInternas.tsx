import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ListTodo, Plus, Calendar, AlertCircle, User } from "lucide-react";
import { format } from "date-fns";

const COLUMNAS = [
  { id: "pendiente",   label: "Pendiente",   color: "bg-slate-100 dark:bg-slate-800" },
  { id: "en_progreso", label: "En progreso", color: "bg-blue-100 dark:bg-blue-900/30" },
  { id: "bloqueada",   label: "Bloqueada",   color: "bg-red-100 dark:bg-red-900/30" },
  { id: "hecha",       label: "Hecha",       color: "bg-green-100 dark:bg-green-900/30" },
];

const DEPARTAMENTOS = [
  { v: "general", l: "General" },
  { v: "recepcion", l: "Recepción" },
  { v: "enfermeria", l: "Enfermería" },
  { v: "facturacion", l: "Facturación" },
  { v: "medico", l: "Médico" },
  { v: "casos_abiertos", l: "Casos abiertos" },
  { v: "seguimiento", l: "Seguimiento" },
  { v: "administracion", l: "Administración" },
];

const PRIORIDADES = [
  { v: "baja", l: "Baja", color: "bg-gray-200 text-gray-700" },
  { v: "media", l: "Media", color: "bg-blue-200 text-blue-700" },
  { v: "alta", l: "Alta", color: "bg-orange-200 text-orange-700" },
  { v: "urgente", l: "Urgente", color: "bg-red-200 text-red-700" },
];

export default function TareasInternas() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [tareas, setTareas] = useState<any[]>([]);
  const [filtro, setFiltro] = useState<string>("todos");
  const [open, setOpen] = useState(false);
  const [miembros, setMiembros] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    titulo: "", descripcion: "", departamento: "general", prioridad: "media",
    asignado_a: "", fecha_limite: "",
  });

  const cargar = async () => {
    if (!wsId) return;
    const [t, m] = await Promise.all([
      (supabase.from("tareas_internas") as any).select("*")
        .eq("workspace_id", wsId).order("orden").order("created_at", { ascending: false }),
      (supabase.from("workspace_members") as any)
        .select("user_id, profiles!inner(nombre, apellido)").eq("workspace_id", wsId),
    ]);
    setTareas(t.data || []);
    setMiembros(m.data || []);
  };

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [wsId]);

  // Realtime
  useEffect(() => {
    if (!wsId) return;
    const channel = supabase.channel("tareas-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "tareas_internas" }, () => cargar())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line
  }, [wsId]);

  const crear = async () => {
    if (!form.titulo) { toast.error("Título requerido"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase.from("tareas_internas") as any).insert({
      workspace_id: wsId, titulo: form.titulo, descripcion: form.descripcion || null,
      departamento: form.departamento, prioridad: form.prioridad,
      asignado_a: form.asignado_a || null,
      fecha_limite: form.fecha_limite || null,
      created_by: user?.id, estado: "pendiente",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Tarea creada");
    setOpen(false);
    setForm({ titulo: "", descripcion: "", departamento: "general", prioridad: "media", asignado_a: "", fecha_limite: "" });
  };

  const moverEstado = async (id: string, nuevo: string) => {
    const update: any = { estado: nuevo };
    if (nuevo === "hecha") update.completado_at = new Date().toISOString();
    await (supabase.from("tareas_internas") as any).update(update).eq("id", id);
  };

  const filtradas = filtro === "todos" ? tareas : tareas.filter((t: any) => t.departamento === filtro);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ListTodo className="h-7 w-7 text-primary" /> Tareas internas
          </h1>
          <p className="text-muted-foreground">Tablero tipo Trello para coordinar pendientes por departamento.</p>
        </div>
        <div className="flex gap-2">
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los departamentos</SelectItem>
              {DEPARTAMENTOS.map(d => <SelectItem key={d.v} value={d.v}>{d.l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nueva tarea</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nueva tarea</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Título</Label><Input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} /></div>
                <div><Label>Descripción</Label><Textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Departamento</Label>
                    <Select value={form.departamento} onValueChange={v => setForm({ ...form, departamento: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{DEPARTAMENTOS.map(d => <SelectItem key={d.v} value={d.v}>{d.l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prioridad</Label>
                    <Select value={form.prioridad} onValueChange={v => setForm({ ...form, prioridad: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PRIORIDADES.map(p => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Asignar a</Label>
                  <Select value={form.asignado_a} onValueChange={v => setForm({ ...form, asignado_a: v })}>
                    <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                    <SelectContent>
                      {miembros.map((m: any) => (
                        <SelectItem key={m.user_id} value={m.user_id}>
                          {m.profiles?.nombre} {m.profiles?.apellido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Fecha límite</Label><Input type="datetime-local" value={form.fecha_limite} onChange={e => setForm({ ...form, fecha_limite: e.target.value })} /></div>
                <Button onClick={crear} className="w-full">Crear tarea</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {COLUMNAS.map(col => {
          const items = filtradas.filter((t: any) => t.estado === col.id);
          return (
            <div key={col.id} className={`rounded-lg p-3 ${col.color}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{col.label}</h3>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {items.map((t: any) => {
                  const prio = PRIORIDADES.find(p => p.v === t.prioridad);
                  const asignado = miembros.find((m: any) => m.user_id === t.asignado_a);
                  const vencida = t.fecha_limite && new Date(t.fecha_limite) < new Date() && t.estado !== "hecha";
                  return (
                    <Card key={t.id} className="cursor-pointer">
                      <CardContent className="p-3 space-y-1.5">
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-sm font-medium leading-tight">{t.titulo}</p>
                          <Badge className={`${prio?.color} text-[10px] shrink-0`}>{prio?.l}</Badge>
                        </div>
                        {t.descripcion && <p className="text-xs text-muted-foreground line-clamp-2">{t.descripcion}</p>}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{DEPARTAMENTOS.find(d => d.v === t.departamento)?.l}</span>
                          {asignado && <span className="flex items-center gap-1"><User className="h-3 w-3" />{asignado.profiles?.nombre}</span>}
                        </div>
                        {t.fecha_limite && (
                          <div className={`flex items-center gap-1 text-xs ${vencida ? "text-destructive" : "text-muted-foreground"}`}>
                            {vencida ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                            {format(new Date(t.fecha_limite), "dd/MM HH:mm")}
                          </div>
                        )}
                        <Select value={t.estado} onValueChange={v => moverEstado(t.id, v)}>
                          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {COLUMNAS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                            <SelectItem value="archivada">Archivar</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  );
                })}
                {items.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Sin tareas</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
