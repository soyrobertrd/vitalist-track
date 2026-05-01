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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pill, FileSignature } from "lucide-react";

interface Props {
  verticalTipo: "dental" | "estetica" | "recovery" | "vision";
}

export default function VerticalRecetasTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ medicamentos: "", indicaciones: "", vigencia_dias: "30" });

  const { data: recetas = [], refetch } = useQuery({
    queryKey: ["recetas_digitales_vertical", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("recetas_digitales_vertical") as any)
        .select("*").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo)
        .order("created_at", { ascending: false }).limit(200);
      return data || [];
    },
  });

  const crear = async () => {
    if (!wsId || !form.medicamentos) return;
    const meds = form.medicamentos.split("\n").filter(Boolean).map(m => ({ nombre: m.trim() }));
    const { error } = await (supabase.from("recetas_digitales_vertical") as any).insert({
      workspace_id: wsId, vertical_tipo: verticalTipo,
      medicamentos: meds, indicaciones: form.indicaciones || null,
      vigencia_dias: parseInt(form.vigencia_dias) || 30,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Receta creada");
    setOpen(false);
    setForm({ medicamentos: "", indicaciones: "", vigencia_dias: "30" });
    refetch();
  };

  const activas = recetas.filter((r: any) => r.estado === "activa").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="p-3 text-center"><div className="text-2xl font-bold">{recetas.length}</div><div className="text-xs text-muted-foreground">Total recetas</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{activas}</div><div className="text-xs text-muted-foreground">Activas</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-orange-600">{recetas.filter((r: any) => r.firmada).length}</div><div className="text-xs text-muted-foreground">Firmadas</div></Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Recetas Digitales</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nueva receta</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Emitir receta digital</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Medicamentos (uno por línea)</Label><Textarea rows={4} value={form.medicamentos} onChange={e => setForm({ ...form, medicamentos: e.target.value })} placeholder="Amoxicilina 500mg c/8h&#10;Ibuprofeno 400mg PRN" /></div>
              <div><Label>Indicaciones</Label><Textarea value={form.indicaciones} onChange={e => setForm({ ...form, indicaciones: e.target.value })} /></div>
              <div><Label>Vigencia (días)</Label><Input type="number" value={form.vigencia_dias} onChange={e => setForm({ ...form, vigencia_dias: e.target.value })} /></div>
              <Button onClick={crear}><Pill className="h-4 w-4 mr-1" />Emitir receta</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Medicamentos</TableHead>
              <TableHead>Vigencia</TableHead>
              <TableHead>Firmada</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recetas.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-sm">{r.numero}</TableCell>
                <TableCell className="text-sm">{new Date(r.fecha_emision + "T12:00:00").toLocaleDateString()}</TableCell>
                <TableCell className="text-sm">{Array.isArray(r.medicamentos) ? r.medicamentos.map((m: any) => m.nombre).join(", ") : "—"}</TableCell>
                <TableCell>{r.vigencia_dias} días</TableCell>
                <TableCell>{r.firmada ? <Badge><FileSignature className="h-3 w-3 mr-1" />Sí</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
                <TableCell><Badge variant={r.estado === "activa" ? "default" : r.estado === "vencida" ? "destructive" : "secondary"}>{r.estado}</Badge></TableCell>
              </TableRow>
            ))}
            {!recetas.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin recetas</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
