import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Workflow, Plus, Zap, ListChecks, Activity, Play, Pause, Trash2, CheckCircle2, XCircle, Clock } from "lucide-react";

interface Props {
  verticalTipo: "dental" | "estetica" | "recovery" | "vision";
}

const eventosTrigger = [
  { value: "cita_creada", label: "Cita creada" },
  { value: "visita_completada", label: "Visita completada" },
  { value: "llamada_resultado", label: "Resultado de llamada" },
  { value: "paciente_creado", label: "Paciente creado" },
  { value: "documento_subido", label: "Documento subido" },
  { value: "pago_recibido", label: "Pago recibido" },
  { value: "inventario_bajo", label: "Stock bajo" },
  { value: "no_show", label: "No-show detectado" },
];

const accionesDisponibles = [
  { value: "enviar_email", label: "Enviar email" },
  { value: "enviar_whatsapp", label: "Enviar WhatsApp" },
  { value: "crear_tarea", label: "Crear tarea" },
  { value: "notificar_equipo", label: "Notificar equipo" },
  { value: "escalar", label: "Escalar a supervisor" },
  { value: "agendar_seguimiento", label: "Agendar seguimiento" },
  { value: "actualizar_estado", label: "Actualizar estado" },
];

const estadoColor: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  ejecutando: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  cancelado: "bg-muted text-muted-foreground",
};

export default function VerticalWorkflowsTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const qc = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [evento, setEvento] = useState("");
  const [accionesSeleccionadas, setAccionesSeleccionadas] = useState<string[]>([]);
  const [subtab, setSubtab] = useState("reglas");

  const { data: reglas = [] } = useQuery({
    queryKey: ["workflow_reglas", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("workflow_reglas") as any)
        .select("*").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo).order("prioridad", { ascending: false });
      return data || [];
    },
  });

  const { data: ejecuciones = [] } = useQuery({
    queryKey: ["workflow_ejecuciones", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("workflow_ejecuciones") as any)
        .select("*, workflow_reglas(nombre)").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(30);
      return data || [];
    },
  });

  const { data: cadenas = [] } = useQuery({
    queryKey: ["workflow_cadenas", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("workflow_cadenas") as any)
        .select("*").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  const crearRegla = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase.from("workflow_reglas") as any).insert({
        workspace_id: wsId, vertical_tipo: verticalTipo, nombre, descripcion: descripcion || null,
        evento_trigger: evento, acciones: accionesSeleccionadas.map(a => ({ tipo: a })),
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Regla de workflow creada");
      qc.invalidateQueries({ queryKey: ["workflow_reglas"] });
      setShowCreate(false);
      setNombre(""); setDescripcion(""); setEvento(""); setAccionesSeleccionadas([]);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActivo = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await (supabase.from("workflow_reglas") as any).update({ activo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflow_reglas"] }),
  });

  const toggleAccion = (accion: string) => {
    setAccionesSeleccionadas(prev =>
      prev.includes(accion) ? prev.filter(a => a !== accion) : [...prev, accion]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Workflow className="h-5 w-5" /> Automatización de Workflows</h3>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nueva regla</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Crear regla de automatización</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nombre</Label><Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Seguimiento post-cita" /></div>
              <div><Label>Descripción</Label><Textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Qué hace esta regla..." /></div>
              <div><Label>Evento disparador (IF)</Label>
                <Select value={evento} onValueChange={setEvento}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar evento..." /></SelectTrigger>
                  <SelectContent>
                    {eventosTrigger.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Acciones (THEN)</Label>
                <div className="flex flex-wrap gap-2">
                  {accionesDisponibles.map(a => (
                    <Badge key={a.value} variant={accionesSeleccionadas.includes(a.value) ? "default" : "outline"}
                      className="cursor-pointer" onClick={() => toggleAccion(a.value)}>{a.label}</Badge>
                  ))}
                </div>
              </div>
              <Button onClick={() => crearRegla.mutate()} disabled={!nombre || !evento || accionesSeleccionadas.length === 0}>Guardar regla</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={subtab} onValueChange={setSubtab}>
        <TabsList>
          <TabsTrigger value="reglas"><Zap className="h-3.5 w-3.5 mr-1" />Reglas</TabsTrigger>
          <TabsTrigger value="ejecuciones"><Activity className="h-3.5 w-3.5 mr-1" />Ejecuciones</TabsTrigger>
          <TabsTrigger value="cadenas"><ListChecks className="h-3.5 w-3.5 mr-1" />Cadenas</TabsTrigger>
        </TabsList>

        <TabsContent value="reglas" className="mt-3">
          <div className="grid gap-3">
            {reglas.map((r: any) => (
              <Card key={r.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium flex items-center gap-2">
                      {r.activo ? <Play className="h-3.5 w-3.5 text-green-600" /> : <Pause className="h-3.5 w-3.5 text-muted-foreground" />}
                      {r.nombre}
                    </p>
                    {r.descripcion && <p className="text-sm text-muted-foreground">{r.descripcion}</p>}
                    <div className="flex gap-1 mt-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs">IF: {eventosTrigger.find(e => e.value === r.evento_trigger)?.label || r.evento_trigger}</Badge>
                      {(r.acciones || []).map((a: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">THEN: {accionesDisponibles.find(ad => ad.value === a.tipo)?.label || a.tipo}</Badge>
                      ))}
                    </div>
                  </div>
                  <Switch checked={r.activo} onCheckedChange={activo => toggleActivo.mutate({ id: r.id, activo })} />
                </CardContent>
              </Card>
            ))}
            {reglas.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No hay reglas configuradas. Crea una para automatizar procesos.</p>}
          </div>
        </TabsContent>

        <TabsContent value="ejecuciones" className="mt-3">
          <div className="grid gap-2">
            {ejecuciones.map((e: any) => (
              <Card key={e.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{e.workflow_reglas?.nombre || "Regla"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</p>
                    {e.error_mensaje && <p className="text-xs text-destructive mt-0.5">{e.error_mensaje}</p>}
                  </div>
                  <Badge className={estadoColor[e.estado] || ""}>
                    {e.estado === "completado" ? <CheckCircle2 className="h-3 w-3 mr-0.5" /> :
                     e.estado === "error" ? <XCircle className="h-3 w-3 mr-0.5" /> :
                     <Clock className="h-3 w-3 mr-0.5" />}
                    {e.estado}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {ejecuciones.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No hay ejecuciones registradas.</p>}
          </div>
        </TabsContent>

        <TabsContent value="cadenas" className="mt-3">
          <div className="grid gap-2">
            {cadenas.map((c: any) => (
              <Card key={c.id}>
                <CardContent className="py-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{c.nombre}</p>
                      <p className="text-xs text-muted-foreground">Paso {c.paso_actual + 1} de {(c.pasos || []).length} · {c.estado}</p>
                    </div>
                    <Badge className={estadoColor[c.estado] || ""}>{c.estado}</Badge>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {(c.pasos || []).map((_: any, i: number) => (
                      <div key={i} className={`h-2 flex-1 rounded-full ${i <= c.paso_actual ? "bg-primary" : "bg-muted"}`} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {cadenas.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No hay cadenas de tareas.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
