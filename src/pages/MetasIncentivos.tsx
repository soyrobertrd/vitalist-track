import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Target, Plus, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const estadoColor: Record<string, string> = {
  activa: "bg-blue-500/10 text-blue-700",
  completada: "bg-emerald-500/10 text-emerald-700",
  vencida: "bg-orange-500/10 text-orange-700",
  pagada: "bg-purple-500/10 text-purple-700",
  cancelada: "bg-muted text-muted-foreground",
};

export default function MetasIncentivos() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [metas, setMetas] = useState<any[]>([]);
  const [personal, setPersonal] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ empleado_id: "", titulo: "", descripcion: "", metrica: "", meta_valor: "", unidad: "", bono_monto: "", fecha_inicio: "", fecha_fin: "" });

  const cargar = async () => {
    if (!wsId) return;
    const [{ data: a }, { data: b }] = await Promise.all([
      (supabase as any).from("metas_incentivos").select("*").eq("workspace_id", wsId).order("created_at", { ascending: false }),
      supabase.from("personal_salud").select("id, nombre, apellido").eq("activo", true).order("nombre"),
    ]);
    setMetas(a || []);
    setPersonal(b || []);
  };

  useEffect(() => { cargar(); }, [wsId]);

  const empleadoNombre = (id: string) => {
    const p = personal.find(x => x.id === id);
    return p ? `${p.nombre} ${p.apellido}` : id;
  };

  const guardar = async () => {
    if (!wsId || !form.empleado_id || !form.titulo) return;
    const { error } = await (supabase as any).from("metas_incentivos").insert({
      workspace_id: wsId,
      empleado_id: form.empleado_id,
      titulo: form.titulo,
      descripcion: form.descripcion || null,
      metrica: form.metrica || null,
      meta_valor: parseFloat(form.meta_valor) || null,
      unidad: form.unidad || null,
      bono_monto: parseFloat(form.bono_monto) || 0,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Meta creada");
    setOpen(false);
    setForm({ empleado_id: "", titulo: "", descripcion: "", metrica: "", meta_valor: "", unidad: "", bono_monto: "", fecha_inicio: "", fecha_fin: "" });
    cargar();
  };

  const actualizarValor = async (id: string, valor: string) => {
    const v = parseFloat(valor);
    if (isNaN(v)) return;
    const { error } = await (supabase as any).from("metas_incentivos").update({ valor_actual: v }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Avance actualizado");
    cargar();
  };

  const totalBonos = metas.filter(m => m.estado === "completada" || m.estado === "pagada").reduce((s, m) => s + Number(m.bono_monto || 0), 0);
  const activas = metas.filter(m => m.estado === "activa").length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-7 w-7 text-primary" /> Metas e Incentivos
          </h1>
          <p className="text-sm text-muted-foreground">Objetivos cuantificables con bonos por cumplimiento</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nueva meta</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nueva meta</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Empleado</Label>
                <select className="w-full border rounded p-2 bg-background" value={form.empleado_id} onChange={e => setForm({ ...form, empleado_id: e.target.value })}>
                  <option value="">— Seleccionar —</option>
                  {personal.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                </select>
              </div>
              <div><Label>Título</Label><Input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} /></div>
              <div><Label>Descripción</Label><Textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Métrica</Label><Input placeholder="ventas" value={form.metrica} onChange={e => setForm({ ...form, metrica: e.target.value })} /></div>
                <div><Label>Valor meta</Label><Input type="number" value={form.meta_valor} onChange={e => setForm({ ...form, meta_valor: e.target.value })} /></div>
                <div><Label>Unidad</Label><Input placeholder="$ / pacientes" value={form.unidad} onChange={e => setForm({ ...form, unidad: e.target.value })} /></div>
              </div>
              <div><Label>Bono al cumplir</Label><Input type="number" value={form.bono_monto} onChange={e => setForm({ ...form, bono_monto: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Inicio</Label><Input type="date" value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} /></div>
                <div><Label>Fin</Label><Input type="date" value={form.fecha_fin} onChange={e => setForm({ ...form, fecha_fin: e.target.value })} /></div>
              </div>
              <Button onClick={guardar}>Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center"><div className="text-3xl font-bold">{metas.length}</div><div className="text-xs text-muted-foreground">Metas totales</div></Card>
        <Card className="p-4 text-center"><div className="text-3xl font-bold text-blue-600">{activas}</div><div className="text-xs text-muted-foreground">Activas</div></Card>
        <Card className="p-4 text-center"><div className="text-3xl font-bold text-emerald-600">{metas.filter(m => m.estado === "completada" || m.estado === "pagada").length}</div><div className="text-xs text-muted-foreground">Completadas</div></Card>
        <Card className="p-4 text-center"><div className="text-3xl font-bold flex items-center justify-center gap-1"><DollarSign className="h-6 w-6" />{totalBonos.toLocaleString()}</div><div className="text-xs text-muted-foreground">Bonos a pagar</div></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metas.map(m => (
          <Card key={m.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{m.titulo}</div>
                <div className="text-xs text-muted-foreground">{empleadoNombre(m.empleado_id)}</div>
              </div>
              <Badge className={estadoColor[m.estado]}>{m.estado}</Badge>
            </div>
            {m.descripcion && <p className="text-sm text-muted-foreground line-clamp-2">{m.descripcion}</p>}
            <div className="space-y-1">
              <div className="flex justify-between text-sm"><span>{Number(m.valor_actual || 0).toLocaleString()} / {Number(m.meta_valor || 0).toLocaleString()} {m.unidad}</span><span className="font-bold">{Number(m.porcentaje_cumplimiento || 0).toFixed(0)}%</span></div>
              <Progress value={Number(m.porcentaje_cumplimiento || 0)} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-emerald-600"><DollarSign className="h-4 w-4" />{Number(m.bono_monto).toLocaleString()}</div>
              <Input type="number" placeholder="Avance" className="w-24 h-8 text-sm" onBlur={e => e.target.value && actualizarValor(m.id, e.target.value)} />
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(m.fecha_inicio + "T12:00:00").toLocaleDateString()} → {new Date(m.fecha_fin + "T12:00:00").toLocaleDateString()}
            </div>
          </Card>
        ))}
        {!metas.length && <div className="col-span-full text-center text-muted-foreground py-8">Sin metas registradas</div>}
      </div>
    </div>
  );
}
