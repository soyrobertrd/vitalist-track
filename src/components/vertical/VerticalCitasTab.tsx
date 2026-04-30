import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, CalendarDays, Clock } from "lucide-react";

interface Props {
  citaLabel?: string;
  tiposCita?: string[];
}

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  confirmada: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  en_curso: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  completada: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelada: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  no_asistio: "bg-muted text-muted-foreground",
};

export default function VerticalCitasTab({ citaLabel = "Citas", tiposCita = ["Consulta", "Control", "Procedimiento", "Emergencia"] }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ paciente_nombre: "", fecha: "", hora: "", tipo: "", notas: "", profesional_nombre: "" });

  const { data: citas = [], refetch } = useQuery({
    queryKey: ["vertical_citas", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("control_visitas") as any).select("*, pacientes(nombre, apellido), personal_salud(nombre, apellido)").eq("workspace_id", wsId!).order("fecha_hora_visita", { ascending: false }).limit(100);
      return data || [];
    },
  });

  const { data: pacientes = [] } = useQuery({
    queryKey: ["pacientes_combo", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase.from("pacientes").select("id, nombre, apellido").eq("workspace_id", wsId!).eq("activo", true).order("nombre").limit(500);
      return data || [];
    },
  });

  const { data: profesionales = [] } = useQuery({
    queryKey: ["profesionales_combo", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase.from("personal_salud").select("id, nombre, apellido").eq("workspace_id", wsId!).order("nombre").limit(200);
      return data || [];
    },
  });

  const crear = async () => {
    if (!wsId || !form.fecha || !form.hora) { toast.error("Fecha y hora requeridos"); return; }
    const fechaHora = `${form.fecha}T${form.hora}:00`;
    const { error } = await supabase.from("control_visitas").insert({
      workspace_id: wsId,
      paciente_id: form.paciente_nombre || null,
      profesional_id: form.profesional_nombre || null,
      fecha_hora_visita: fechaHora,
      tipo_visita: "ambulatoria",
      notas_visita: form.notas || null,
      estado: "pendiente",
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Cita agendada");
    setOpen(false);
    setForm({ paciente_nombre: "", fecha: "", hora: "", tipo: "", notas: "", profesional_nombre: "" });
    refetch();
  };

  const hoy = new Date().toISOString().slice(0, 10);
  const citasHoy = citas.filter((c: any) => c.fecha_hora_visita?.slice(0, 10) === hoy).length;
  const pendientes = citas.filter((c: any) => c.estado === "pendiente").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Citas hoy</p><p className="text-2xl font-bold">{citasHoy}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Pendientes</p><p className="text-2xl font-bold">{pendientes}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{citas.length}</p></CardContent></Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{citaLabel}</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nueva cita</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Agendar cita</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Paciente</Label>
                <Select value={form.paciente_nombre} onValueChange={v => setForm({ ...form, paciente_nombre: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
                  <SelectContent>{pacientes.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido || ""}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Profesional</Label>
                <Select value={form.profesional_nombre} onValueChange={v => setForm({ ...form, profesional_nombre: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar profesional" /></SelectTrigger>
                  <SelectContent>{profesionales.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido || ""}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Fecha</Label><Input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} /></div>
                <div><Label>Hora</Label><Input type="time" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} /></div>
              </div>
              <div><Label>Notas</Label><Textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2} /></div>
              <Button onClick={crear}>Agendar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Profesional</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {citas.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell>{c.fecha_hora_visita?.slice(0, 10)}</TableCell>
                <TableCell>{c.fecha_hora_visita?.slice(11, 16)}</TableCell>
                <TableCell className="font-medium">{c.pacientes ? `${c.pacientes.nombre} ${c.pacientes.apellido || ""}` : "—"}</TableCell>
                <TableCell>{c.personal_salud ? `${c.personal_salud.nombre} ${c.personal_salud.apellido || ""}` : "—"}</TableCell>
                <TableCell><Badge className={ESTADO_COLORS[c.estado] || ""}>{c.estado}</Badge></TableCell>
              </TableRow>
            ))}
            {!citas.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin citas registradas</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
