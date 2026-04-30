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
import { Plus, Phone, Search } from "lucide-react";

interface Props {
  pacienteLabel?: string;
}

export default function VerticalPacientesTab({ pacienteLabel = "Pacientes" }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ nombre: "", apellido: "", cedula: "", telefono: "", email: "", sexo: "", fecha_nacimiento: "" });

  const { data: pacientes = [], refetch } = useQuery({
    queryKey: ["pacientes_vertical", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase.from("pacientes").select("*").eq("workspace_id", wsId!).eq("activo", true).order("nombre").limit(500);
      return data || [];
    },
  });

  const crear = async () => {
    if (!wsId || !form.nombre) return;
    const { error } = await supabase.from("pacientes").insert({
      workspace_id: wsId,
      nombre: form.nombre,
      apellido: form.apellido || null,
      cedula: form.cedula || null,
      numero_principal: form.telefono || null,
      email: form.email || null,
      sexo: form.sexo || null,
      fecha_nacimiento: form.fecha_nacimiento || null,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Paciente registrado");
    setOpen(false);
    setForm({ nombre: "", apellido: "", cedula: "", telefono: "", email: "", sexo: "", fecha_nacimiento: "" });
    refetch();
  };

  const filtered = search
    ? pacientes.filter((p: any) => `${p.nombre} ${p.apellido || ""} ${p.cedula || ""}`.toLowerCase().includes(search.toLowerCase()))
    : pacientes;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar paciente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo paciente</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar paciente</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nombre</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></div>
                <div><Label>Apellido</Label><Input value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Cédula</Label><Input value={form.cedula} onChange={e => setForm({ ...form, cedula: e.target.value })} /></div>
                <div><Label>Teléfono</Label><Input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div>
                  <Label>Sexo</Label>
                  <Select value={form.sexo} onValueChange={v => setForm({ ...form, sexo: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Fecha de nacimiento</Label><Input type="date" value={form.fecha_nacimiento} onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })} /></div>
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
              <TableHead>Cédula</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Sexo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nombre} {p.apellido || ""}</TableCell>
                <TableCell>{p.cedula || "—"}</TableCell>
                <TableCell>{p.numero_principal ? <a href={`tel:${p.numero_principal}`} className="text-primary hover:underline inline-flex items-center gap-1"><Phone className="h-3 w-3" />{p.numero_principal}</a> : "—"}</TableCell>
                <TableCell>{p.email || "—"}</TableCell>
                <TableCell>{p.sexo || "—"}</TableCell>
              </TableRow>
            ))}
            {!filtered.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin pacientes</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
