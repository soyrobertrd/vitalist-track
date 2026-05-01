import { useEffect, useRef, useState } from "react";
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
import { MessageCircle, Plus, Send, Hash, Lock, Users } from "lucide-react";
import { format } from "date-fns";

export default function ChatInterno() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [canales, setCanales] = useState<any[]>([]);
  const [activo, setActivo] = useState<any>(null);
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [nuevo, setNuevo] = useState("");
  const [open, setOpen] = useState(false);
  const [perfiles, setPerfiles] = useState<Record<string, any>>({});
  const [form, setForm] = useState({ nombre: "", tipo: "general", descripcion: "", privado: false });
  const fin = useRef<HTMLDivElement>(null);

  const cargarCanales = async () => {
    if (!wsId) return;
    const { data } = await (supabase.from("chat_canales") as any)
      .select("*").eq("workspace_id", wsId).order("created_at");
    setCanales(data || []);
    if (!activo && (data || []).length > 0) setActivo(data[0]);
  };

  const cargarMensajes = async (canalId: string) => {
    const { data } = await (supabase.from("chat_mensajes") as any)
      .select("*").eq("canal_id", canalId).order("created_at").limit(200);
    setMensajes(data || []);
    // Cargar perfiles que faltan
    const userIds = [...new Set((data || []).map((m: any) => m.user_id))];
    const faltan = userIds.filter(id => !perfiles[id as string]);
    if (faltan.length) {
      const { data: prof } = await (supabase.from("profiles") as any)
        .select("user_id, nombre, apellido, avatar_url").in("user_id", faltan);
      const map = { ...perfiles };
      (prof || []).forEach((p: any) => { map[p.user_id] = p; });
      setPerfiles(map);
    }
    setTimeout(() => fin.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  useEffect(() => { cargarCanales(); /* eslint-disable-next-line */ }, [wsId]);
  useEffect(() => {
    if (!activo) return;
    cargarMensajes(activo.id);
    const channel = supabase.channel(`chat-${activo.id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_mensajes", filter: `canal_id=eq.${activo.id}` },
        () => cargarMensajes(activo.id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line
  }, [activo?.id]);

  const enviar = async () => {
    if (!nuevo.trim() || !activo) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase.from("chat_mensajes") as any).insert({
      canal_id: activo.id, user_id: user?.id, contenido: nuevo.trim(), tipo: "texto",
    });
    if (error) {
      // si no es miembro, lo añadimos
      if (error.message.includes("policy")) {
        await (supabase.from("chat_canal_miembros") as any).insert({ canal_id: activo.id, user_id: user?.id });
        await (supabase.from("chat_mensajes") as any).insert({ canal_id: activo.id, user_id: user?.id, contenido: nuevo.trim(), tipo: "texto" });
      } else { toast.error(error.message); return; }
    }
    setNuevo("");
  };

  const crearCanal = async () => {
    if (!form.nombre) { toast.error("Nombre requerido"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await (supabase.from("chat_canales") as any).insert({
      workspace_id: wsId, nombre: form.nombre, tipo: form.tipo,
      descripcion: form.descripcion || null, privado: form.privado, created_by: user?.id,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    toast.success("Canal creado");
    setOpen(false);
    setForm({ nombre: "", tipo: "general", descripcion: "", privado: false });
    setActivo(data);
    cargarCanales();
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col md:flex-row">
      {/* Sidebar canales */}
      <div className="w-full md:w-64 border-r bg-card overflow-y-auto">
        <div className="p-3 border-b flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><MessageCircle className="h-4 w-4" /> Canales</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7"><Plus className="h-4 w-4" /></Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo canal</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nombre</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="enfermeria" /></div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="departamento">Departamento</SelectItem>
                      <SelectItem value="sucursal">Sucursal</SelectItem>
                      <SelectItem value="paciente">Sobre paciente</SelectItem>
                      <SelectItem value="directo">Mensaje directo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Descripción</Label><Textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} /></div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="priv" checked={form.privado} onChange={e => setForm({ ...form, privado: e.target.checked })} />
                  <Label htmlFor="priv" className="cursor-pointer">Privado (solo invitados)</Label>
                </div>
                <Button onClick={crearCanal} className="w-full">Crear canal</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="p-2 space-y-0.5">
          {canales.map((c: any) => (
            <button
              key={c.id}
              onClick={() => setActivo(c)}
              className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 ${
                activo?.id === c.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
            >
              {c.privado ? <Lock className="h-3.5 w-3.5" /> : <Hash className="h-3.5 w-3.5" />}
              <span className="flex-1 truncate">{c.nombre}</span>
              <Badge variant="outline" className="text-[10px]">{c.tipo}</Badge>
            </button>
          ))}
          {canales.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No hay canales todavía. Crea el primero.</p>}
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 flex flex-col">
        {activo ? (
          <>
            <div className="p-3 border-b bg-card">
              <h3 className="font-semibold flex items-center gap-2">
                {activo.privado ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                {activo.nombre}
              </h3>
              {activo.descripcion && <p className="text-xs text-muted-foreground">{activo.descripcion}</p>}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {mensajes.map((m: any) => {
                const p = perfiles[m.user_id];
                return (
                  <div key={m.id} className="flex gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold shrink-0">
                      {p?.nombre?.[0] || "?"}{p?.apellido?.[0] || ""}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <p className="text-sm font-medium">{p ? `${p.nombre} ${p.apellido}` : "Usuario"}</p>
                        <span className="text-xs text-muted-foreground">{format(new Date(m.created_at), "PPp")}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">{m.contenido}</p>
                    </div>
                  </div>
                );
              })}
              {mensajes.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Sé el primero en escribir.</p>}
              <div ref={fin} />
            </div>
            <div className="p-3 border-t bg-card flex gap-2">
              <Input
                value={nuevo}
                onChange={e => setNuevo(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }}}
                placeholder={`Mensaje a #${activo.nombre}`}
              />
              <Button onClick={enviar} disabled={!nuevo.trim()}><Send className="h-4 w-4" /></Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Selecciona o crea un canal para empezar.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
