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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Phone, Search, TrendingUp } from "lucide-react";

interface Props {
  verticalTipo: "dental" | "estetica" | "recovery" | "vision";
}

const ORIGENES = ["instagram", "facebook", "tiktok", "google", "referido", "whatsapp", "website", "otro"];
const ESTADOS = [
  { value: "nuevo", label: "Nuevo", color: "default" as const },
  { value: "contactado", label: "Contactado", color: "secondary" as const },
  { value: "cita_agendada", label: "Cita agendada", color: "default" as const },
  { value: "convertido", label: "Convertido", color: "default" as const },
  { value: "perdido", label: "Perdido", color: "destructive" as const },
];

export default function VerticalLeadsCRMTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ nombre: "", telefono: "", email: "", origen: "otro", notas: "", valor_estimado: "" });

  const { data: leads = [], refetch } = useQuery({
    queryKey: ["leads_vertical", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("leads_vertical") as any).select("*").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo).order("created_at", { ascending: false }).limit(500);
      return data || [];
    },
  });

  const crear = async () => {
    if (!wsId || !form.nombre) return;
    const { error } = await (supabase.from("leads_vertical") as any).insert({
      workspace_id: wsId, vertical_tipo: verticalTipo, nombre: form.nombre,
      telefono: form.telefono || null, email: form.email || null, origen: form.origen,
      notas: form.notas || null, valor_estimado: form.valor_estimado ? parseFloat(form.valor_estimado) : null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Lead registrado");
    setOpen(false);
    setForm({ nombre: "", telefono: "", email: "", origen: "otro", notas: "", valor_estimado: "" });
    refetch();
  };

  const cambiarEstado = async (id: string, estado: string) => {
    const { error } = await (supabase.from("leads_vertical") as any).update({ estado }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Estado actualizado");
    refetch();
  };

  const filtered = search ? leads.filter((l: any) => `${l.nombre} ${l.telefono || ""} ${l.email || ""}`.toLowerCase().includes(search.toLowerCase())) : leads;
  const stats = {
    total: leads.length,
    nuevos: leads.filter((l: any) => l.estado === "nuevo").length,
    convertidos: leads.filter((l: any) => l.estado === "convertido").length,
    valorTotal: leads.reduce((s: number, l: any) => s + (parseFloat(l.valor_estimado) || 0), 0),
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center"><div className="text-2xl font-bold">{stats.total}</div><div className="text-xs text-muted-foreground">Total leads</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-500">{stats.nuevos}</div><div className="text-xs text-muted-foreground">Nuevos</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-500">{stats.convertidos}</div><div className="text-xs text-muted-foreground">Convertidos</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold"><TrendingUp className="h-4 w-4 inline mr-1" />RD${stats.valorTotal.toLocaleString()}</div><div className="text-xs text-muted-foreground">Valor estimado</div></Card>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar lead..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo lead</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar lead</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Nombre</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Teléfono</Label><Input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} /></div>
                <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Origen</Label>
                  <Select value={form.origen} onValueChange={v => setForm({ ...form, origen: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ORIGENES.map(o => <SelectItem key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Valor estimado (RD$)</Label><Input type="number" value={form.valor_estimado} onChange={e => setForm({ ...form, valor_estimado: e.target.value })} /></div>
              </div>
              <div><Label>Notas</Label><Input value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} /></div>
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
              <TableHead>Contacto</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((l: any) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.nombre}</TableCell>
                <TableCell>
                  {l.telefono && <a href={`tel:${l.telefono}`} className="text-primary hover:underline inline-flex items-center gap-1"><Phone className="h-3 w-3" />{l.telefono}</a>}
                  {l.email && <div className="text-xs text-muted-foreground">{l.email}</div>}
                </TableCell>
                <TableCell><Badge variant="outline">{l.origen}</Badge></TableCell>
                <TableCell>{l.valor_estimado ? `RD$${parseFloat(l.valor_estimado).toLocaleString()}` : "—"}</TableCell>
                <TableCell>
                  <Select value={l.estado} onValueChange={v => cambiarEstado(l.id, v)}>
                    <SelectTrigger className="w-[140px] h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{ESTADOS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
            {!filtered.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin leads</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
