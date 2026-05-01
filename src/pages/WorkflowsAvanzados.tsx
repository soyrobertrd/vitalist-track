import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Workflow, Plus, Zap, Activity, CheckCircle2, XCircle, Clock, BarChart3 } from "lucide-react";
import { format } from "date-fns";

const EVENTOS = [
  { v: "cita_no_confirmada",  l: "Paciente no confirma cita" },
  { v: "cita_proxima_24h",    l: "Cita en próximas 24 horas" },
  { v: "cirugia_manana",      l: "Cirugía programada mañana" },
  { v: "balance_pendiente",   l: "Balance pendiente" },
  { v: "lab_listo",           l: "Resultado de laboratorio listo" },
  { v: "paciente_sin_volver", l: "Paciente sin volver (>6 meses)" },
  { v: "no_show_detectado",   l: "No-show detectado" },
  { v: "medicamento_entregado", l: "Medicamento entregado" },
  { v: "alta_firmada",        l: "Alta médica firmada" },
  { v: "triaje_critico",      l: "Triaje crítico" },
  { v: "documento_subido",    l: "Documento subido" },
  { v: "factura_vencida",     l: "Factura vencida" },
  { v: "manual",              l: "Disparo manual" },
];

const ACCIONES = [
  { v: "enviar_whatsapp",    l: "Enviar WhatsApp" },
  { v: "enviar_email",       l: "Enviar email" },
  { v: "enviar_sms",         l: "Enviar SMS" },
  { v: "crear_tarea",        l: "Crear tarea interna" },
  { v: "notificar_equipo",   l: "Notificar equipo" },
  { v: "agendar_seguimiento",l: "Agendar seguimiento" },
  { v: "actualizar_estado",  l: "Actualizar estado" },
  { v: "enviar_campana",     l: "Enviar a campaña" },
];

const ESTADO_COLOR: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  ejecutando: "bg-blue-100 text-blue-800",
  completado: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
};

export default function WorkflowsAvanzados() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [reglas, setReglas] = useState<any[]>([]);
  const [ejecuciones, setEjecuciones] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    nombre: "", descripcion: "", evento: "", retraso_minutos: 0, prioridad: 0, acciones: [] as string[],
  });

  const cargar = async () => {
    if (!wsId) return;
    const [r, e] = await Promise.all([
      (supabase.from("workflow_reglas_globales") as any)
        .select("*").eq("workspace_id", wsId).order("prioridad", { ascending: false }),
      (supabase.from("workflow_ejecuciones_globales") as any)
        .select("*, workflow_reglas_globales(nombre)").eq("workspace_id", wsId)
        .order("created_at", { ascending: false }).limit(50),
    ]);
    setReglas(r.data || []);
    setEjecuciones(e.data || []);
  };

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [wsId]);

  const toggleAccion = (a: string) => {
    setForm({ ...form, acciones: form.acciones.includes(a)
      ? form.acciones.filter((x: string) => x !== a) : [...form.acciones, a] });
  };

  const crear = async () => {
    if (!form.nombre || !form.evento || form.acciones.length === 0) {
      toast.error("Completa nombre, evento y al menos una acción"); return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase.from("workflow_reglas_globales") as any).insert({
      workspace_id: wsId, nombre: form.nombre, descripcion: form.descripcion || null,
      evento: form.evento, retraso_minutos: form.retraso_minutos || 0, prioridad: form.prioridad || 0,
      acciones: form.acciones.map((a: string) => ({ tipo: a })),
      created_by: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Regla creada");
    setOpen(false);
    setForm({ nombre: "", descripcion: "", evento: "", retraso_minutos: 0, prioridad: 0, acciones: [] });
    cargar();
  };

  const toggleActiva = async (id: string, activa: boolean) => {
    await (supabase.from("workflow_reglas_globales") as any).update({ activa }).eq("id", id);
    cargar();
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Workflow className="h-7 w-7 text-primary" /> Motor de Workflows
          </h1>
          <p className="text-muted-foreground">Automatiza procesos: si A entonces B. Reduce trabajo administrativo.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nueva regla</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nueva regla de automatización</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nombre</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Recordatorio cita no confirmada" /></div>
              <div><Label>Descripción</Label><Textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} /></div>
              <div>
                <Label>Cuándo (evento) *</Label>
                <Select value={form.evento} onValueChange={v => setForm({ ...form, evento: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona evento..." /></SelectTrigger>
                  <SelectContent>{EVENTOS.map(e => <SelectItem key={e.v} value={e.v}>{e.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Retraso (min)</Label><Input type="number" value={form.retraso_minutos} onChange={e => setForm({ ...form, retraso_minutos: +e.target.value })} /></div>
                <div><Label>Prioridad</Label><Input type="number" value={form.prioridad} onChange={e => setForm({ ...form, prioridad: +e.target.value })} /></div>
              </div>
              <div>
                <Label className="mb-2 block">Entonces (acciones) *</Label>
                <div className="flex flex-wrap gap-2">
                  {ACCIONES.map(a => (
                    <Badge key={a.v} variant={form.acciones.includes(a.v) ? "default" : "outline"}
                      className="cursor-pointer" onClick={() => toggleAccion(a.v)}>{a.l}</Badge>
                  ))}
                </div>
              </div>
              <Button onClick={crear} className="w-full">Guardar regla</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="reglas">
        <TabsList>
          <TabsTrigger value="reglas"><Zap className="h-3.5 w-3.5 mr-1" /> Reglas ({reglas.length})</TabsTrigger>
          <TabsTrigger value="historial"><Activity className="h-3.5 w-3.5 mr-1" /> Historial ({ejecuciones.length})</TabsTrigger>
          <TabsTrigger value="estadisticas"><BarChart3 className="h-3.5 w-3.5 mr-1" /> Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="reglas" className="space-y-2 mt-3">
          {reglas.length === 0 && <p className="text-muted-foreground text-center py-8 text-sm">No hay reglas. Crea la primera para automatizar tu operación.</p>}
          {reglas.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="py-3 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium">{r.nombre}</p>
                  {r.descripcion && <p className="text-xs text-muted-foreground">{r.descripcion}</p>}
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="secondary" className="text-xs">SI: {EVENTOS.find(e => e.v === r.evento)?.l || r.evento}</Badge>
                    {(r.acciones || []).map((a: any, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">→ {ACCIONES.find(ac => ac.v === a.tipo)?.l || a.tipo}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ejecuciones: {r.ejecuciones_total} · éxito: {r.ejecuciones_exito}
                    {r.retraso_minutos > 0 && ` · retraso ${r.retraso_minutos}min`}
                  </p>
                </div>
                <Switch checked={r.activa} onCheckedChange={(v) => toggleActiva(r.id, v)} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="historial" className="space-y-2 mt-3">
          {ejecuciones.length === 0 && <p className="text-muted-foreground text-center py-8 text-sm">Sin ejecuciones todavía.</p>}
          {ejecuciones.map((e: any) => (
            <Card key={e.id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{e.workflow_reglas_globales?.nombre || "Regla eliminada"}</p>
                  <p className="text-xs text-muted-foreground">
                    {EVENTOS.find(ev => ev.v === e.evento)?.l} · {format(new Date(e.created_at), "PPp")}
                  </p>
                  {e.error_mensaje && <p className="text-xs text-destructive mt-0.5">{e.error_mensaje}</p>}
                </div>
                <Badge className={ESTADO_COLOR[e.estado]}>
                  {e.estado === "completado" ? <CheckCircle2 className="h-3 w-3 mr-0.5" /> :
                   e.estado === "error" ? <XCircle className="h-3 w-3 mr-0.5" /> :
                   <Clock className="h-3 w-3 mr-0.5" />}
                  {e.estado}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="estadisticas" className="mt-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Reglas activas</p><p className="text-2xl font-bold">{reglas.filter(r => r.activa).length}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total ejecuciones</p><p className="text-2xl font-bold">{reglas.reduce((s, r) => s + (r.ejecuciones_total || 0), 0)}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Éxitos</p><p className="text-2xl font-bold text-green-600">{reglas.reduce((s, r) => s + (r.ejecuciones_exito || 0), 0)}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Errores recientes</p><p className="text-2xl font-bold text-destructive">{ejecuciones.filter(e => e.estado === "error").length}</p></CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
