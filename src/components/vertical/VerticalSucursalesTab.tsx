import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, MapPin, Phone, Clock } from "lucide-react";

interface Props {
  verticalTipo: "dental" | "estetica" | "recovery" | "vision";
}

export default function VerticalSucursalesTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", direccion: "", telefono: "", email: "", horario_apertura: "08:00", horario_cierre: "18:00" });

  const { data: sucursales = [], refetch } = useQuery({
    queryKey: ["sucursales_vertical", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("sucursales_vertical") as any).select("*").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo).order("nombre");
      return data || [];
    },
  });

  const crear = async () => {
    if (!wsId || !form.nombre) return;
    const { error } = await (supabase.from("sucursales_vertical") as any).insert({
      workspace_id: wsId, vertical_tipo: verticalTipo, nombre: form.nombre,
      direccion: form.direccion || null, telefono: form.telefono || null, email: form.email || null,
      horario_apertura: form.horario_apertura, horario_cierre: form.horario_cierre,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Sucursal creada");
    setOpen(false);
    setForm({ nombre: "", direccion: "", telefono: "", email: "", horario_apertura: "08:00", horario_cierre: "18:00" });
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Sucursales</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nueva sucursal</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva sucursal</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Nombre</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></div>
              <div><Label>Dirección</Label><Input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Teléfono</Label><Input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} /></div>
                <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Apertura</Label><Input type="time" value={form.horario_apertura} onChange={e => setForm({ ...form, horario_apertura: e.target.value })} /></div>
                <div><Label>Cierre</Label><Input type="time" value={form.horario_cierre} onChange={e => setForm({ ...form, horario_cierre: e.target.value })} /></div>
              </div>
              <Button onClick={crear}>Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Horario</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sucursales.map((s: any) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.nombre}</TableCell>
                <TableCell>{s.direccion ? <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{s.direccion}</span> : "—"}</TableCell>
                <TableCell><span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{s.horario_apertura?.slice(0,5)} - {s.horario_cierre?.slice(0,5)}</span></TableCell>
                <TableCell>{s.telefono ? <a href={`tel:${s.telefono}`} className="text-primary hover:underline inline-flex items-center gap-1"><Phone className="h-3 w-3" />{s.telefono}</a> : "—"}</TableCell>
                <TableCell><Badge variant={s.activo ? "default" : "secondary"}>{s.activo ? "Activa" : "Inactiva"}</Badge></TableCell>
              </TableRow>
            ))}
            {!sucursales.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin sucursales</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
