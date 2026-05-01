import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ClipboardList, Plus, Play, CheckCircle2, BookOpen } from "lucide-react";

interface Protocolo {
  id: string;
  codigo: string;
  nombre: string;
  especialidad: string | null;
  categoria: string | null;
  descripcion: string | null;
  pasos: any[];
  evidencia_nivel: string | null;
  es_global: boolean;
  activo: boolean;
}

const especialidades = ["emergencias", "cardiologia", "neurologia", "pediatria", "ginecologia", "medicina_interna", "cirugia", "uci"];

export default function ProtocolosClinicos() {
  const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [filtroEsp, setFiltroEsp] = useState<string>("todos");
  const [openCreate, setOpenCreate] = useState(false);
  const [openApply, setOpenApply] = useState(false);
  const [sel, setSel] = useState<Protocolo | null>(null);
  const [pacienteId, setPacienteId] = useState("");
  const [form, setForm] = useState({ codigo: "", nombre: "", especialidad: "", descripcion: "", pasos: "" });

  const cargar = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("protocolos_clinicos")
      .select("*")
      .eq("activo", true)
      .order("es_global", { ascending: false })
      .order("nombre");
    setProtocolos(data || []);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const crear = async () => {
    if (!form.codigo || !form.nombre) return;
    const pasos = form.pasos.split("\n").filter(Boolean).map((p, i) => ({ orden: i + 1, accion: p.trim() }));
    const { error } = await (supabase as any).from("protocolos_clinicos").insert({
      codigo: form.codigo,
      nombre: form.nombre,
      especialidad: form.especialidad || null,
      descripcion: form.descripcion || null,
      pasos,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Protocolo creado");
    setOpenCreate(false);
    setForm({ codigo: "", nombre: "", especialidad: "", descripcion: "", pasos: "" });
    cargar();
  };

  const aplicar = async () => {
    if (!sel || !pacienteId) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data: ws } = await supabase.from("workspaces").select("id").limit(1).maybeSingle();
    if (!ws) { toast.error("Sin workspace"); return; }
    const { error } = await (supabase as any).from("protocolos_aplicaciones").insert({
      workspace_id: ws.id,
      protocolo_id: sel.id,
      paciente_id: pacienteId,
      iniciado_por: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Protocolo ${sel.codigo} aplicado`);
    setOpenApply(false);
    setPacienteId("");
    setSel(null);
  };

  const filtrados = protocolos.filter(p =>
    (filtroEsp === "todos" || p.especialidad === filtroEsp) &&
    (!filtro || p.nombre.toLowerCase().includes(filtro.toLowerCase()) || p.codigo.toLowerCase().includes(filtro.toLowerCase()))
  );

  if (loading) return <div className="p-6">Cargando protocolos...</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-primary" /> Protocolos Clínicos
          </h1>
          <p className="text-sm text-muted-foreground">Bibliotecas basadas en evidencia para estandarizar la atención</p>
        </div>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nuevo protocolo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear protocolo clínico</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Código</Label><Input value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} placeholder="PROT-XXX" /></div>
              <div><Label>Nombre</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></div>
              <div>
                <Label>Especialidad</Label>
                <Select value={form.especialidad} onValueChange={v => setForm({ ...form, especialidad: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{especialidades.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Descripción</Label><Textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} /></div>
              <div><Label>Pasos (uno por línea)</Label><Textarea rows={6} value={form.pasos} onChange={e => setForm({ ...form, pasos: e.target.value })} placeholder="Paso 1&#10;Paso 2" /></div>
              <Button onClick={crear}>Crear</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Buscar por nombre o código..." value={filtro} onChange={e => setFiltro(e.target.value)} className="max-w-sm" />
        <Select value={filtroEsp} onValueChange={setFiltroEsp}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las especialidades</SelectItem>
            {especialidades.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.map(p => (
          <Card key={p.id} className="hover:shadow-md transition">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{p.nombre}</CardTitle>
                {p.es_global && <Badge variant="outline"><BookOpen className="h-3 w-3 mr-1" />Global</Badge>}
              </div>
              <div className="flex gap-1 flex-wrap">
                <Badge variant="secondary" className="text-xs">{p.codigo}</Badge>
                {p.especialidad && <Badge variant="outline" className="text-xs">{p.especialidad}</Badge>}
                {p.evidencia_nivel && <Badge className="text-xs bg-emerald-500/10 text-emerald-700">Evidencia {p.evidencia_nivel}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">{p.descripcion}</p>
              <div className="text-xs space-y-1">
                {(p.pasos || []).slice(0, 3).map((paso: any, i: number) => (
                  <div key={i} className="flex gap-2"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /><span>{paso.accion}</span></div>
                ))}
                {(p.pasos?.length || 0) > 3 && <div className="text-xs text-muted-foreground pl-5">+{p.pasos.length - 3} pasos más</div>}
              </div>
              <Button size="sm" className="w-full" onClick={() => { setSel(p); setOpenApply(true); }}>
                <Play className="h-4 w-4 mr-1" /> Aplicar a paciente
              </Button>
            </CardContent>
          </Card>
        ))}
        {!filtrados.length && <div className="col-span-full text-center text-muted-foreground py-8">Sin protocolos</div>}
      </div>

      <Dialog open={openApply} onOpenChange={setOpenApply}>
        <DialogContent>
          <DialogHeader><DialogTitle>Aplicar: {sel?.nombre}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>ID del paciente (UUID)</Label><Input value={pacienteId} onChange={e => setPacienteId(e.target.value)} /></div>
            <div className="text-xs text-muted-foreground">Se registrarán {sel?.pasos?.length || 0} pasos a seguir.</div>
            <Button onClick={aplicar} disabled={!pacienteId}>Confirmar aplicación</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
