import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function TarifariosProfesional() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [list, setList] = useState<any[]>([]);
  const [pros, setPros] = useState<any[]>([]);
  const [srvs, setSrvs] = useState<any[]>([]);
  const [aseguradoras, setAseguradoras] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ profesional_id: "", servicio_id: "", aseguradora_id: "", precio: 0, comision_pct: 0 });

  const load = async () => {
    if (!wsId) return;
    const [t, p, s, a] = await Promise.all([
      supabase.from("tarifas_profesional_ars").select("*, personal_salud(nombre,apellido), servicios_catalogo(nombre)").eq("workspace_id", wsId),
      supabase.from("personal_salud").select("id,nombre,apellido").eq("workspace_id", wsId).eq("activo", true),
      supabase.from("servicios_catalogo").select("id,nombre").eq("workspace_id", wsId).eq("activo", true),
      supabase.from("aseguradoras").select("id,nombre").eq("workspace_id", wsId).limit(200) as any,
    ]);
    setList(t.data || []); setPros(p.data || []); setSrvs(s.data || []); setAseguradoras((a as any).data || []);
  };
  useEffect(() => { load(); }, [wsId]);

  const save = async () => {
    if (!wsId) return;
    const payload: any = { ...form, workspace_id: wsId };
    if (!payload.aseguradora_id) payload.aseguradora_id = null;
    const { error } = await supabase.from("tarifas_profesional_ars").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Tarifa guardada"); setOpen(false); load();
    setForm({ profesional_id: "", servicio_id: "", aseguradora_id: "", precio: 0, comision_pct: 0 });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tarifarios por Profesional y ARS</h1>
          <p className="text-sm text-muted-foreground">Precios distintos por procedimiento, aseguradora y profesional con comisiones.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nueva tarifa</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tarifa</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Profesional</Label>
                <Select value={form.profesional_id} onValueChange={v => setForm({ ...form, profesional_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{pros.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Servicio</Label>
                <Select value={form.servicio_id} onValueChange={v => setForm({ ...form, servicio_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{srvs.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>ARS (opcional, vacío = particular)</Label>
                <Select value={form.aseguradora_id || "none"} onValueChange={v => setForm({ ...form, aseguradora_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Particular</SelectItem>
                    {aseguradoras.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Precio</Label><Input type="number" value={form.precio} onChange={e => setForm({ ...form, precio: +e.target.value })} /></div>
                <div><Label>Comisión %</Label><Input type="number" value={form.comision_pct} onChange={e => setForm({ ...form, comision_pct: +e.target.value })} /></div>
              </div>
              <Button onClick={save} className="w-full">Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardContent className="pt-6">
        <Table>
          <TableHeader><TableRow><TableHead>Profesional</TableHead><TableHead>Servicio</TableHead><TableHead>ARS</TableHead><TableHead>Precio</TableHead><TableHead>Comisión</TableHead></TableRow></TableHeader>
          <TableBody>
            {list.map((t: any) => (
              <TableRow key={t.id}>
                <TableCell>{t.personal_salud?.nombre} {t.personal_salud?.apellido}</TableCell>
                <TableCell>{t.servicios_catalogo?.nombre}</TableCell>
                <TableCell>{t.aseguradora_id ? aseguradoras.find(a => a.id === t.aseguradora_id)?.nombre : "Particular"}</TableCell>
                <TableCell>RD$ {t.precio}</TableCell>
                <TableCell>{t.comision_pct}%</TableCell>
              </TableRow>
            ))}
            {!list.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin tarifas</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
