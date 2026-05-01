import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Video, MessageSquare, FileText, Plus, ExternalLink, Calendar } from "lucide-react";

export default function CentroTelemedicina() {
  const { currentWorkspace } = useWorkspace();
  const [sesiones, setSesiones] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [recetas, setRecetas] = useState<any[]>([]);
  const [openNew, setOpenNew] = useState(false);
  const [openChat, setOpenChat] = useState<any | null>(null);
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [nuevoMsg, setNuevoMsg] = useState("");

  const [form, setForm] = useState({
    paciente_id: "", profesional_id: "", fecha_inicio: "", duracion_minutos: "30",
  });

  const load = async () => {
    if (!currentWorkspace) return;
    const ws = currentWorkspace.id;
    const [s, p, pr, r] = await Promise.all([
      supabase.from("telemedicina_sesiones")
        .select("*, pacientes(nombre, apellido), personal_salud(nombre, apellido)")
        .eq("workspace_id", ws).order("fecha_inicio", { ascending: false }).limit(50),
      supabase.from("pacientes").select("id, nombre, apellido").limit(200),
      supabase.from("personal_salud").select("id, nombre, apellido").limit(100),
      supabase.from("telemedicina_recetas_digitales").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    setSesiones(s.data || []);
    setPacientes(p.data || []);
    setProfesionales(pr.data || []);
    setRecetas(r.data || []);
  };

  useEffect(() => { load(); }, [currentWorkspace?.id]);

  const programarSesion = async () => {
    if (!currentWorkspace) return;
    const { error } = await supabase.from("telemedicina_sesiones").insert({
      workspace_id: currentWorkspace.id,
      paciente_id: form.paciente_id || null,
      profesional_id: form.profesional_id || null,
      fecha_inicio: form.fecha_inicio,
      duracion_minutos: +form.duracion_minutos,
      estado: "programada",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Sesión programada");
    setOpenNew(false);
    setForm({ paciente_id: "", profesional_id: "", fecha_inicio: "", duracion_minutos: "30" });
    load();
  };

  const cambiarEstado = async (id: string, estado: string) => {
    const updates: any = { estado };
    if (estado === "finalizada") updates.fecha_fin = new Date().toISOString();
    await supabase.from("telemedicina_sesiones").update(updates).eq("id", id);
    toast.success("Estado actualizado");
    load();
  };

  const abrirChat = async (sesion: any) => {
    setOpenChat(sesion);
    const { data } = await supabase.from("telemedicina_chat_mensajes")
      .select("*").eq("sesion_id", sesion.id).order("created_at");
    setMensajes(data || []);
  };

  const enviarMsg = async () => {
    if (!nuevoMsg.trim() || !openChat || !currentWorkspace) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("telemedicina_chat_mensajes").insert({
      sesion_id: openChat.id,
      workspace_id: currentWorkspace.id,
      remitente_tipo: "profesional",
      remitente_user_id: user?.id,
      mensaje: nuevoMsg,
    });
    if (error) { toast.error(error.message); return; }
    setNuevoMsg("");
    abrirChat(openChat);
  };

  const estadoColor: Record<string, string> = {
    programada: "bg-blue-500", en_curso: "bg-green-500", finalizada: "bg-gray-500", cancelada: "bg-red-500",
  };

  const stats = {
    hoy: sesiones.filter(s => new Date(s.fecha_inicio).toDateString() === new Date().toDateString()).length,
    en_curso: sesiones.filter(s => s.estado === "en_curso").length,
    programadas: sesiones.filter(s => s.estado === "programada").length,
    finalizadas: sesiones.filter(s => s.estado === "finalizada").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Centro de Telemedicina</h1>
          <p className="text-muted-foreground">Videoconsultas, chat seguro y recetas digitales</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Programar sesión</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Programar videoconsulta</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Paciente</Label>
                <Select value={form.paciente_id} onValueChange={v => setForm({...form, paciente_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>{pacientes.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Profesional</Label>
                <Select value={form.profesional_id} onValueChange={v => setForm({...form, profesional_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>{profesionales.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Fecha y hora</Label><Input type="datetime-local" value={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio: e.target.value})} /></div>
                <div><Label>Duración (min)</Label><Input type="number" value={form.duracion_minutos} onChange={e => setForm({...form, duracion_minutos: e.target.value})} /></div>
              </div>
              <Button onClick={programarSesion} className="w-full">Programar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{stats.hoy}</div><p className="text-xs text-muted-foreground">Hoy</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-500">{stats.en_curso}</div><p className="text-xs text-muted-foreground">En curso</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-blue-500">{stats.programadas}</div><p className="text-xs text-muted-foreground">Programadas</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{stats.finalizadas}</div><p className="text-xs text-muted-foreground">Finalizadas</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Video className="h-5 w-5" />Sesiones</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sesiones.map(s => (
              <Card key={s.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={estadoColor[s.estado]}>{s.estado}</Badge>
                        <span className="font-semibold">
                          {s.pacientes ? `${s.pacientes.nombre} ${s.pacientes.apellido}` : "Sin paciente"}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Dr. {s.personal_salud?.nombre || ""} {s.personal_salud?.apellido || ""}
                      </div>
                      <div className="text-xs flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(s.fecha_inicio).toLocaleString()} · {s.duracion_minutos} min
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => abrirChat(s)}><MessageSquare className="h-4 w-4" /></Button>
                      {s.estado === "programada" && (
                        <Button size="sm" onClick={() => cambiarEstado(s.id, "en_curso")}><Video className="h-4 w-4 mr-1" />Iniciar</Button>
                      )}
                      {s.estado === "en_curso" && (
                        <Button size="sm" variant="default" onClick={() => cambiarEstado(s.id, "finalizada")}>Finalizar</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {sesiones.length === 0 && <p className="text-sm text-muted-foreground">Sin sesiones. Programa una arriba.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Recetas digitales recientes</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recetas.map(r => (
              <div key={r.id} className="border rounded p-2 text-sm flex items-center justify-between">
                <div>
                  <Badge variant="outline">{(r as any).numero || r.id.substring(0, 8)}</Badge>
                  <span className="ml-2">{(r as any).medicamento || (r as any).nombre_medicamento || "Receta"}</span>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            ))}
            {recetas.length === 0 && <p className="text-sm text-muted-foreground">Sin recetas digitales</p>}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!openChat} onOpenChange={(o) => !o && setOpenChat(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chat — {openChat?.pacientes?.nombre} {openChat?.pacientes?.apellido}</DialogTitle>
          </DialogHeader>
          <div className="border rounded p-2 h-80 overflow-auto space-y-2 bg-muted/30">
            {mensajes.map(m => (
              <div key={m.id} className={`flex ${m.remitente_tipo === "profesional" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-lg p-2 text-sm ${m.remitente_tipo === "profesional" ? "bg-primary text-primary-foreground" : "bg-card border"}`}>
                  <div className="text-xs opacity-70 mb-1">{m.remitente_tipo}</div>
                  {m.mensaje}
                </div>
              </div>
            ))}
            {mensajes.length === 0 && <p className="text-sm text-muted-foreground text-center pt-10">Sin mensajes</p>}
          </div>
          <div className="flex gap-2">
            <Input value={nuevoMsg} onChange={e => setNuevoMsg(e.target.value)} placeholder="Escribe un mensaje..." onKeyDown={e => e.key === "Enter" && enviarMsg()} />
            <Button onClick={enviarMsg}>Enviar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
