import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GraduationCap, Plus } from "lucide-react";
import { toast } from "sonner";

const estadoColor: Record<string, string> = {
  en_curso: "bg-blue-500/10 text-blue-700",
  completado: "bg-emerald-500/10 text-emerald-700",
  abandonado: "bg-muted text-muted-foreground",
  reprobado: "bg-destructive/20 text-destructive",
};

export default function CapacitacionesEmpleados() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [caps, setCaps] = useState<any[]>([]);
  const [personal, setPersonal] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ empleado_id: "", curso: "", institucion: "", modalidad: "", horas: "", fecha_inicio: "", fecha_fin: "" });

  const cargar = async () => {
    if (!wsId) return;
    const [{ data: a }, { data: b }] = await Promise.all([
      (supabase as any).from("capacitaciones_empleados").select("*").eq("workspace_id", wsId).order("created_at", { ascending: false }),
      supabase.from("personal_salud").select("id, nombre, apellido").eq("activo", true).order("nombre"),
    ]);
    setCaps(a || []);
    setPersonal(b || []);
  };

  useEffect(() => { cargar(); }, [wsId]);

  const empleadoNombre = (id: string) => {
    const p = personal.find(x => x.id === id);
    return p ? `${p.nombre} ${p.apellido}` : id;
  };

  const guardar = async () => {
    if (!wsId || !form.empleado_id || !form.curso) return;
    const { error } = await (supabase as any).from("capacitaciones_empleados").insert({
      workspace_id: wsId,
      empleado_id: form.empleado_id,
      curso: form.curso,
      institucion: form.institucion || null,
      modalidad: form.modalidad || null,
      horas: parseInt(form.horas) || null,
      fecha_inicio: form.fecha_inicio || null,
      fecha_fin: form.fecha_fin || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Capacitación creada");
    setOpen(false);
    setForm({ empleado_id: "", curso: "", institucion: "", modalidad: "", horas: "", fecha_inicio: "", fecha_fin: "" });
    cargar();
  };

  const totalHoras = caps.filter(c => c.estado === "completado").reduce((s, c) => s + Number(c.horas || 0), 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" /> Capacitaciones
          </h1>
          <p className="text-sm text-muted-foreground">Cursos y certificaciones del personal</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nueva</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva capacitación</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Empleado</Label>
                <select className="w-full border rounded p-2 bg-background" value={form.empleado_id} onChange={e => setForm({ ...form, empleado_id: e.target.value })}>
                  <option value="">— Seleccionar —</option>
                  {personal.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                </select>
              </div>
              <div><Label>Curso</Label><Input value={form.curso} onChange={e => setForm({ ...form, curso: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Institución</Label><Input value={form.institucion} onChange={e => setForm({ ...form, institucion: e.target.value })} /></div>
                <div><Label>Modalidad</Label><Input placeholder="presencial/virtual" value={form.modalidad} onChange={e => setForm({ ...form, modalidad: e.target.value })} /></div>
              </div>
              <div><Label>Horas</Label><Input type="number" value={form.horas} onChange={e => setForm({ ...form, horas: e.target.value })} /></div>
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
        <Card className="p-4 text-center"><div className="text-3xl font-bold">{caps.length}</div><div className="text-xs text-muted-foreground">Cursos</div></Card>
        <Card className="p-4 text-center"><div className="text-3xl font-bold text-emerald-600">{caps.filter(c => c.estado === "completado").length}</div><div className="text-xs text-muted-foreground">Completados</div></Card>
        <Card className="p-4 text-center"><div className="text-3xl font-bold text-blue-600">{caps.filter(c => c.estado === "en_curso").length}</div><div className="text-xs text-muted-foreground">En curso</div></Card>
        <Card className="p-4 text-center"><div className="text-3xl font-bold">{totalHoras}h</div><div className="text-xs text-muted-foreground">Horas certificadas</div></Card>
      </div>

      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Empleado</TableHead><TableHead>Curso</TableHead><TableHead>Institución</TableHead><TableHead className="text-center">Horas</TableHead><TableHead>Periodo</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
          <TableBody>
            {caps.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{empleadoNombre(c.empleado_id)}</TableCell>
                <TableCell>{c.curso}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.institucion || "—"}</TableCell>
                <TableCell className="text-center">{c.horas || "—"}</TableCell>
                <TableCell className="text-sm">
                  {c.fecha_inicio ? new Date(c.fecha_inicio + "T12:00:00").toLocaleDateString() : "—"}
                  {c.fecha_fin && ` → ${new Date(c.fecha_fin + "T12:00:00").toLocaleDateString()}`}
                </TableCell>
                <TableCell><Badge className={estadoColor[c.estado]}>{c.estado.replace("_"," ")}</Badge></TableCell>
              </TableRow>
            ))}
            {!caps.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin capacitaciones</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
