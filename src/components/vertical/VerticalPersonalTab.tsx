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
import { toast } from "sonner";
import { Plus, Phone, Mail } from "lucide-react";

interface Props {
  /** Label for professionals e.g. "Doctores", "Enfermeras", "Terapeutas" */
  profesionalLabel?: string;
  /** Specialty options */
  especialidades?: string[];
}

const DEFAULT_ESPECIALIDADES = ["General", "Especialista", "Auxiliar", "Técnico"];

export default function VerticalPersonalTab({ profesionalLabel = "Profesionales", especialidades = DEFAULT_ESPECIALIDADES }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", apellido: "", telefono: "", email: "", especialidad: "", cargo: "" });

  const { data: personal = [], refetch } = useQuery({
    queryKey: ["personal_salud", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase.from("personal_salud").select("*").eq("workspace_id", wsId!).order("nombre");
      return data || [];
    },
  });

  const crear = async () => {
    if (!wsId || !form.nombre) return;
    const { error } = await supabase.from("personal_salud").insert({
      workspace_id: wsId,
      nombre: form.nombre,
      apellido: form.apellido || null,
      telefono: form.telefono || null,
      email: form.email || null,
      especialidad: form.especialidad || null,
      cargo: form.cargo || null,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Profesional agregado");
    setOpen(false);
    setForm({ nombre: "", apellido: "", telefono: "", email: "", especialidad: "", cargo: "" });
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{profesionalLabel}</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Agregar</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo {profesionalLabel.slice(0, -1).toLowerCase()}</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nombre</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></div>
                <div><Label>Apellido</Label><Input value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Teléfono</Label><Input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} /></div>
                <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Especialidad</Label>
                  <Select value={form.especialidad} onValueChange={v => setForm({ ...form, especialidad: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>{especialidades.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Cargo</Label><Input value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })} /></div>
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
              <TableHead>Especialidad</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {personal.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nombre} {p.apellido || ""}</TableCell>
                <TableCell>{p.especialidad || "—"}</TableCell>
                <TableCell>{p.cargo || "—"}</TableCell>
                <TableCell className="space-x-2">
                  {p.telefono && <a href={`tel:${p.telefono}`} className="text-primary hover:underline inline-flex items-center gap-1"><Phone className="h-3 w-3" />{p.telefono}</a>}
                  {p.email && <a href={`mailto:${p.email}`} className="text-primary hover:underline inline-flex items-center gap-1"><Mail className="h-3 w-3" />{p.email}</a>}
                </TableCell>
                <TableCell><Badge variant={p.activo !== false ? "default" : "secondary"}>{p.activo !== false ? "Activo" : "Inactivo"}</Badge></TableCell>
              </TableRow>
            ))}
            {!personal.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin personal registrado</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
