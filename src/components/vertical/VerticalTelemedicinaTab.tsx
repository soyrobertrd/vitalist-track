import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Video, Clock, FileText } from "lucide-react";

interface Props {
  verticalTipo: "dental" | "estetica" | "recovery" | "vision";
}

export default function VerticalTelemedicinaTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fecha_hora: "", duracion_minutos: "30", notas_clinicas: "", enlace_sala: "",
  });

  const { data: consultas = [], refetch } = useQuery({
    queryKey: ["teleconsultas_vertical", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("teleconsultas_vertical") as any)
        .select("*").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo)
        .order("fecha_hora", { ascending: false }).limit(200);
      return data || [];
    },
  });

  const crear = async () => {
    if (!wsId || !form.fecha_hora) return;
    const { error } = await (supabase.from("teleconsultas_vertical") as any).insert({
      workspace_id: wsId, vertical_tipo: verticalTipo,
      fecha_hora: form.fecha_hora, duracion_minutos: parseInt(form.duracion_minutos) || 30,
      notas_clinicas: form.notas_clinicas || null, enlace_sala: form.enlace_sala || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Teleconsulta programada");
    setOpen(false);
    setForm({ fecha_hora: "", duracion_minutos: "30", notas_clinicas: "", enlace_sala: "" });
    refetch();
  };

  const estadoColor = (e: string) => {
    const map: Record<string, "default" | "secondary" | "destructive"> = {
      programada: "secondary", en_curso: "default", completada: "default", cancelada: "destructive", no_show: "destructive",
    };
    return map[e] || "secondary";
  };

  const enCurso = consultas.filter((c: any) => c.estado === "en_curso").length;
  const completadas = consultas.filter((c: any) => c.estado === "completada").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center"><div className="text-2xl font-bold">{consultas.length}</div><div className="text-xs text-muted-foreground">Total consultas</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{enCurso}</div><div className="text-xs text-muted-foreground">En curso</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{completadas}</div><div className="text-xs text-muted-foreground">Completadas</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-red-600">{consultas.filter((c: any) => c.estado === "no_show").length}</div><div className="text-xs text-muted-foreground">No Show</div></Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Teleconsultas</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nueva teleconsulta</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Programar teleconsulta</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Fecha y hora</Label><Input type="datetime-local" value={form.fecha_hora} onChange={e => setForm({ ...form, fecha_hora: e.target.value })} /></div>
                <div><Label>Duración (min)</Label><Input type="number" value={form.duracion_minutos} onChange={e => setForm({ ...form, duracion_minutos: e.target.value })} /></div>
              </div>
              <div><Label>Enlace de sala</Label><Input value={form.enlace_sala} onChange={e => setForm({ ...form, enlace_sala: e.target.value })} placeholder="https://meet.google.com/..." /></div>
              <div><Label>Notas clínicas</Label><Textarea value={form.notas_clinicas} onChange={e => setForm({ ...form, notas_clinicas: e.target.value })} /></div>
              <Button onClick={crear}><Video className="h-4 w-4 mr-1" />Programar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Duración</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Sala</TableHead>
              <TableHead>Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consultas.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="text-sm">{new Date(c.fecha_hora).toLocaleString()}</TableCell>
                <TableCell><span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{c.duracion_minutos} min</span></TableCell>
                <TableCell><Badge variant={estadoColor(c.estado)}>{c.estado}</Badge></TableCell>
                <TableCell>{c.enlace_sala ? <a href={c.enlace_sala} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm">Unirse</a> : "—"}</TableCell>
                <TableCell className="text-sm truncate max-w-[200px]">{c.notas_clinicas || "—"}</TableCell>
              </TableRow>
            ))}
            {!consultas.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin teleconsultas</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
