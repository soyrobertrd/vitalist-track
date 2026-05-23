import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, AlertTriangle, ShieldCheck } from "lucide-react";

const TIPOS = ["exequatur", "colegiatura", "especialidad", "certificacion", "malpractice", "rcm", "otro"];

export default function CredencialesProfesionales() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [list, setList] = useState<any[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ profesional_id: "", tipo: "exequatur", numero: "", autoridad: "", fecha_emision: "", fecha_vencimiento: "", verificado: false, notas: "" });

  const load = async () => {
    if (!wsId) return;
    const [c, p] = await Promise.all([
      supabase.from("credenciales_profesionales").select("*, personal_salud(nombre,apellido,especialidad)").eq("workspace_id", wsId).order("fecha_vencimiento"),
      supabase.from("personal_salud").select("id,nombre,apellido,especialidad").eq("workspace_id", wsId).eq("activo", true),
    ]);
    setList(c.data || []); setProfesionales(p.data || []);
  };
  useEffect(() => { load(); }, [wsId]);

  const save = async () => {
    if (!wsId || !form.profesional_id) return toast.error("Seleccione profesional");
    const payload: any = { ...form, workspace_id: wsId };
    if (!payload.fecha_emision) delete payload.fecha_emision;
    if (!payload.fecha_vencimiento) delete payload.fecha_vencimiento;
    const { error } = await supabase.from("credenciales_profesionales").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Credencial guardada");
    setOpen(false); load();
    setForm({ profesional_id: "", tipo: "exequatur", numero: "", autoridad: "", fecha_emision: "", fecha_vencimiento: "", verificado: false, notas: "" });
  };

  const vence = (d?: string) => {
    if (!d) return null;
    const days = Math.floor((new Date(d).getTime() - Date.now()) / 86400000);
    if (days < 0) return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Vencida</Badge>;
    if (days < 60) return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Vence en {days}d</Badge>;
    return <Badge variant="secondary">Vigente</Badge>;
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Credenciales y Licencias Profesionales</h1>
          <p className="text-sm text-muted-foreground">Exequátur, colegiatura, especialidades, certificaciones y seguros de mala práctica.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nueva credencial</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar credencial</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Profesional</Label>
                <Select value={form.profesional_id} onValueChange={v => setForm({ ...form, profesional_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{profesionales.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Número</Label><Input value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} /></div>
                <div><Label>Autoridad</Label><Input value={form.autoridad} onChange={e => setForm({ ...form, autoridad: e.target.value })} placeholder="MSP, CMD, etc." /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Emisión</Label><Input type="date" value={form.fecha_emision} onChange={e => setForm({ ...form, fecha_emision: e.target.value })} /></div>
                <div><Label>Vencimiento</Label><Input type="date" value={form.fecha_vencimiento} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })} /></div>
              </div>
              <div><Label>Notas</Label><Input value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} /></div>
              <Button onClick={save} className="w-full">Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardContent className="pt-6">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Profesional</TableHead><TableHead>Tipo</TableHead><TableHead>Número</TableHead>
            <TableHead>Autoridad</TableHead><TableHead>Vencimiento</TableHead><TableHead>Estado</TableHead><TableHead>Verificada</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {list.map(c => (
              <TableRow key={c.id}>
                <TableCell>{c.personal_salud?.nombre} {c.personal_salud?.apellido}</TableCell>
                <TableCell><Badge variant="outline">{c.tipo}</Badge></TableCell>
                <TableCell>{c.numero || "—"}</TableCell>
                <TableCell>{c.autoridad || "—"}</TableCell>
                <TableCell>{c.fecha_vencimiento || "—"}</TableCell>
                <TableCell>{vence(c.fecha_vencimiento)}</TableCell>
                <TableCell>{c.verificado ? <ShieldCheck className="h-4 w-4 text-green-600" /> : "—"}</TableCell>
              </TableRow>
            ))}
            {!list.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sin credenciales registradas</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
