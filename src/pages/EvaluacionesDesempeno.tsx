import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award, Plus, Star } from "lucide-react";
import { toast } from "sonner";

const estadoColor: Record<string, string> = {
  borrador: "bg-muted text-muted-foreground",
  enviada: "bg-blue-500/10 text-blue-700",
  firmada: "bg-emerald-500/10 text-emerald-700",
  cerrada: "bg-purple-500/10 text-purple-700",
};

export default function EvaluacionesDesempeno() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [evals, setEvals] = useState<any[]>([]);
  const [personal, setPersonal] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ empleado_id: "", periodo: "", calificacion_global: "", fortalezas: "", areas_mejora: "", plan_accion: "" });

  const cargar = async () => {
    if (!wsId) return;
    const [{ data: a }, { data: b }] = await Promise.all([
      (supabase as any).from("evaluaciones_desempeno").select("*").eq("workspace_id", wsId).order("fecha_evaluacion", { ascending: false }),
      supabase.from("personal_salud").select("id, nombre, apellido").eq("activo", true).order("nombre"),
    ]);
    setEvals(a || []);
    setPersonal(b || []);
  };

  useEffect(() => { cargar(); }, [wsId]);

  const empleadoNombre = (id: string) => {
    const p = personal.find(x => x.id === id);
    return p ? `${p.nombre} ${p.apellido}` : id;
  };

  const guardar = async () => {
    if (!wsId || !form.empleado_id || !form.periodo) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("evaluaciones_desempeno").insert({
      workspace_id: wsId,
      empleado_id: form.empleado_id,
      evaluador_id: user?.id,
      periodo: form.periodo,
      calificacion_global: parseFloat(form.calificacion_global) || null,
      fortalezas: form.fortalezas || null,
      areas_mejora: form.areas_mejora || null,
      plan_accion: form.plan_accion || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Evaluación creada");
    setOpen(false);
    setForm({ empleado_id: "", periodo: "", calificacion_global: "", fortalezas: "", areas_mejora: "", plan_accion: "" });
    cargar();
  };

  const promedio = evals.filter(e => e.calificacion_global).reduce((s, e) => s + Number(e.calificacion_global), 0) / Math.max(evals.filter(e => e.calificacion_global).length, 1);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Award className="h-7 w-7 text-primary" /> Evaluaciones de Desempeño
          </h1>
          <p className="text-sm text-muted-foreground">Ciclos de evaluación, competencias y planes de mejora</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nueva evaluación</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nueva evaluación</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Empleado</Label>
                <select className="w-full border rounded p-2 bg-background" value={form.empleado_id} onChange={e => setForm({ ...form, empleado_id: e.target.value })}>
                  <option value="">— Seleccionar —</option>
                  {personal.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Periodo</Label><Input placeholder="2026-Q1" value={form.periodo} onChange={e => setForm({ ...form, periodo: e.target.value })} /></div>
                <div><Label>Calificación (0-5)</Label><Input type="number" step="0.1" min="0" max="5" value={form.calificacion_global} onChange={e => setForm({ ...form, calificacion_global: e.target.value })} /></div>
              </div>
              <div><Label>Fortalezas</Label><Textarea value={form.fortalezas} onChange={e => setForm({ ...form, fortalezas: e.target.value })} /></div>
              <div><Label>Áreas de mejora</Label><Textarea value={form.areas_mejora} onChange={e => setForm({ ...form, areas_mejora: e.target.value })} /></div>
              <div><Label>Plan de acción</Label><Textarea value={form.plan_accion} onChange={e => setForm({ ...form, plan_accion: e.target.value })} /></div>
              <Button onClick={guardar}>Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center"><div className="text-3xl font-bold">{evals.length}</div><div className="text-xs text-muted-foreground">Evaluaciones</div></Card>
        <Card className="p-4 text-center"><div className="text-3xl font-bold flex items-center justify-center gap-1">{promedio.toFixed(1)}<Star className="h-5 w-5 fill-yellow-500 text-yellow-500" /></div><div className="text-xs text-muted-foreground">Promedio global</div></Card>
        <Card className="p-4 text-center"><div className="text-3xl font-bold text-emerald-600">{evals.filter(e => e.estado === "firmada").length}</div><div className="text-xs text-muted-foreground">Firmadas</div></Card>
        <Card className="p-4 text-center"><div className="text-3xl font-bold text-blue-600">{evals.filter(e => e.estado === "borrador").length}</div><div className="text-xs text-muted-foreground">En borrador</div></Card>
      </div>

      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Empleado</TableHead><TableHead>Periodo</TableHead><TableHead>Fecha</TableHead><TableHead className="text-center">Calificación</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
          <TableBody>
            {evals.map(e => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{empleadoNombre(e.empleado_id)}</TableCell>
                <TableCell>{e.periodo}</TableCell>
                <TableCell className="text-sm">{new Date(e.fecha_evaluacion + "T12:00:00").toLocaleDateString()}</TableCell>
                <TableCell className="text-center">
                  {e.calificacion_global ? (
                    <Badge variant={Number(e.calificacion_global) >= 4 ? "default" : Number(e.calificacion_global) >= 3 ? "secondary" : "destructive"}>
                      {Number(e.calificacion_global).toFixed(1)} / 5
                    </Badge>
                  ) : "—"}
                </TableCell>
                <TableCell><Badge className={estadoColor[e.estado]}>{e.estado}</Badge></TableCell>
              </TableRow>
            ))}
            {!evals.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin evaluaciones</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
