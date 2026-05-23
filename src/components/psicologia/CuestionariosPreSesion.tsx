import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Send, Copy, ClipboardList, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type Pregunta = { id: string; texto: string; tipo: "escala" | "texto" | "si_no"; min?: number; max?: number };
type Paciente = { id: string; nombre: string; apellido: string };

export default function CuestionariosPreSesion({ pacientes }: { pacientes: Paciente[] }) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const sb = supabase as any;

  const { data: plantillas = [], refetch: refPl } = useQuery({
    queryKey: ["cuest_plantillas", wsId], enabled: !!wsId,
    queryFn: async () => (await sb.from("cuestionarios_plantillas").select("*").eq("workspace_id", wsId).order("created_at", { ascending: false })).data || [],
  });

  const { data: envios = [], refetch: refEn } = useQuery({
    queryKey: ["cuest_envios", wsId], enabled: !!wsId,
    queryFn: async () => (await sb.from("cuestionarios_envios").select("*, pacientes(nombre, apellido), cuestionarios_plantillas(nombre)").eq("workspace_id", wsId).order("created_at", { ascending: false }).limit(100)).data || [],
  });

  const [openPl, setOpenPl] = useState(false);
  const [plForm, setPlForm] = useState<{ nombre: string; descripcion: string; horas_antes: number; preguntas: Pregunta[] }>({
    nombre: "", descripcion: "", horas_antes: 24, preguntas: [],
  });
  const addPregunta = () => setPlForm({ ...plForm, preguntas: [...plForm.preguntas, { id: crypto.randomUUID(), texto: "", tipo: "escala", min: 0, max: 10 }] });
  const updPregunta = (i: number, patch: Partial<Pregunta>) => {
    const next = [...plForm.preguntas]; next[i] = { ...next[i], ...patch }; setPlForm({ ...plForm, preguntas: next });
  };
  const delPregunta = (i: number) => setPlForm({ ...plForm, preguntas: plForm.preguntas.filter((_, j) => j !== i) });

  const savePl = async () => {
    if (!wsId || !plForm.nombre || plForm.preguntas.length === 0) { toast.error("Nombre y al menos una pregunta"); return; }
    const { error } = await sb.from("cuestionarios_plantillas").insert({ workspace_id: wsId, ...plForm });
    if (error) return toast.error(error.message);
    toast.success("Plantilla creada"); setOpenPl(false); refPl();
    setPlForm({ nombre: "", descripcion: "", horas_antes: 24, preguntas: [] });
  };

  const [openEn, setOpenEn] = useState(false);
  const [enForm, setEnForm] = useState({ plantilla_id: "", paciente_id: "" });
  const saveEn = async () => {
    if (!wsId || !enForm.plantilla_id || !enForm.paciente_id) { toast.error("Plantilla y paciente requeridos"); return; }
    const { error } = await sb.from("cuestionarios_envios").insert({ workspace_id: wsId, ...enForm });
    if (error) return toast.error(error.message);
    toast.success("Cuestionario enviado"); setOpenEn(false); refEn();
  };

  const copiarLink = (token: string) => {
    const url = `${window.location.origin}/cuestionario/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  };

  return (
    <Tabs defaultValue="envios">
      <TabsList>
        <TabsTrigger value="envios"><Send className="h-4 w-4 mr-1" />Envíos</TabsTrigger>
        <TabsTrigger value="plantillas"><ClipboardList className="h-4 w-4 mr-1" />Plantillas</TabsTrigger>
      </TabsList>

      <TabsContent value="envios" className="space-y-3">
        <div className="flex justify-end">
          <Dialog open={openEn} onOpenChange={setOpenEn}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Enviar cuestionario</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Enviar cuestionario a paciente</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Plantilla</Label>
                  <Select value={enForm.plantilla_id} onValueChange={v => setEnForm({ ...enForm, plantilla_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>{plantillas.map((p: any) => (<SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div><Label>Paciente</Label>
                  <Select value={enForm.paciente_id} onValueChange={v => setEnForm({ ...enForm, paciente_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>{pacientes.map(p => (<SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <Button onClick={saveEn} className="w-full">Enviar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {envios.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">Sin envíos</CardContent></Card>
          : envios.map((e: any) => (
            <Card key={e.id}><CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium flex items-center gap-2">
                  {e.pacientes?.nombre} {e.pacientes?.apellido} · {e.cuestionarios_plantillas?.nombre}
                  {e.alerta_clinica && <Badge variant="destructive" className="text-[10px]"><AlertTriangle className="h-3 w-3 mr-1" />Alerta</Badge>}
                </p>
                <p className="text-xs text-muted-foreground">
                  Enviado {format(new Date(e.enviado_at || e.created_at), "dd/MM/yyyy HH:mm")} · Expira {format(new Date(e.expira_at), "dd/MM/yyyy")}
                  {e.respondido_at && ` · Respondido ${format(new Date(e.respondido_at), "dd/MM/yyyy HH:mm")} · Puntaje ${e.puntaje_total ?? "—"}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={e.respondido_at ? "default" : "secondary"}>{e.respondido_at ? "Respondido" : "Pendiente"}</Badge>
                {!e.respondido_at && <Button size="sm" variant="outline" onClick={() => copiarLink(e.token)}><Copy className="h-3.5 w-3.5 mr-1" />Link</Button>}
              </div>
            </CardContent></Card>
          ))}
      </TabsContent>

      <TabsContent value="plantillas" className="space-y-3">
        <div className="flex justify-end">
          <Dialog open={openPl} onOpenChange={setOpenPl}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nueva plantilla</Button></DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Plantilla de cuestionario pre-sesión</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nombre</Label><Input value={plForm.nombre} onChange={e => setPlForm({ ...plForm, nombre: e.target.value })} /></div>
                <div><Label>Descripción</Label><Textarea rows={2} value={plForm.descripcion} onChange={e => setPlForm({ ...plForm, descripcion: e.target.value })} /></div>
                <div><Label>Horas antes de la sesión</Label><Input type="number" value={plForm.horas_antes} onChange={e => setPlForm({ ...plForm, horas_antes: Number(e.target.value) })} /></div>
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Preguntas ({plForm.preguntas.length})</Label>
                    <Button size="sm" variant="outline" onClick={addPregunta}><Plus className="h-3.5 w-3.5 mr-1" />Pregunta</Button>
                  </div>
                  <div className="space-y-2">
                    {plForm.preguntas.map((p, i) => (
                      <Card key={p.id}><CardContent className="py-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Input placeholder={`Pregunta ${i + 1}`} value={p.texto} onChange={e => updPregunta(i, { texto: e.target.value })} />
                          <Button size="icon" variant="ghost" onClick={() => delPregunta(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Select value={p.tipo} onValueChange={(v: any) => updPregunta(i, { tipo: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="escala">Escala numérica</SelectItem>
                              <SelectItem value="texto">Respuesta libre</SelectItem>
                              <SelectItem value="si_no">Sí / No</SelectItem>
                            </SelectContent>
                          </Select>
                          {p.tipo === "escala" && (<>
                            <Input type="number" placeholder="Min" value={p.min ?? 0} onChange={e => updPregunta(i, { min: Number(e.target.value) })} />
                            <Input type="number" placeholder="Max" value={p.max ?? 10} onChange={e => updPregunta(i, { max: Number(e.target.value) })} />
                          </>)}
                        </div>
                      </CardContent></Card>
                    ))}
                  </div>
                </div>
                <Button onClick={savePl} className="w-full">Guardar plantilla</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {plantillas.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">Sin plantillas</CardContent></Card>
          : plantillas.map((p: any) => (
            <Card key={p.id}><CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.nombre}</p>
                  <p className="text-xs text-muted-foreground">{(p.preguntas?.length || 0)} preguntas · {p.horas_antes}h antes</p>
                </div>
                <Badge variant={p.activo ? "default" : "secondary"}>{p.activo ? "Activo" : "Inactivo"}</Badge>
              </div>
              {p.descripcion && <p className="text-sm text-muted-foreground mt-2">{p.descripcion}</p>}
            </CardContent></Card>
          ))}
      </TabsContent>
    </Tabs>
  );
}
