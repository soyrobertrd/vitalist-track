import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, FileBarChart, AlertTriangle } from "lucide-react";

const TIPOS = [
  { v: "SINAVE", l: "SINAVE - Vigilancia epidemiológica" },
  { v: "MSP_indicadores", l: "MSP - Indicadores de salud" },
  { v: "enfermedad_notificable", l: "Enfermedad de notificación obligatoria" },
  { v: "mortalidad", l: "Reporte de mortalidad" },
  { v: "natalidad", l: "Reporte de natalidad" },
  { v: "produccion", l: "Producción de servicios" },
];

export default function ReportesRegulatorios() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [list, setList] = useState<any[]>([]);
  const [enf, setEnf] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tipo: "SINAVE", periodo_inicio: "", periodo_fin: "", notas: "" });

  const load = async () => {
    if (!wsId) return;
    const [r, e] = await Promise.all([
      supabase.from("reportes_regulatorios").select("*").eq("workspace_id", wsId).order("created_at", { ascending: false }),
      supabase.from("enfermedades_notificables").select("*").order("nombre"),
    ]);
    setList(r.data || []); setEnf(e.data || []);
  };
  useEffect(() => { load(); }, [wsId]);

  const save = async () => {
    if (!wsId) return;
    const payload: any = { ...form, workspace_id: wsId, estado: "borrador", contenido: {} };
    if (!payload.periodo_inicio) delete payload.periodo_inicio;
    if (!payload.periodo_fin) delete payload.periodo_fin;
    const { error } = await supabase.from("reportes_regulatorios").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Reporte creado"); setOpen(false); load();
    setForm({ tipo: "SINAVE", periodo_inicio: "", periodo_fin: "", notas: "" });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileBarChart className="h-6 w-6" /> Reportes Regulatorios</h1>
          <p className="text-sm text-muted-foreground">SINAVE, MSP, indicadores RD y notificación de enfermedades obligatorias.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nuevo reporte</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo reporte regulatorio</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS.map(t => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Periodo inicio</Label><Input type="date" value={form.periodo_inicio} onChange={e => setForm({ ...form, periodo_inicio: e.target.value })} /></div>
                <div><Label>Periodo fin</Label><Input type="date" value={form.periodo_fin} onChange={e => setForm({ ...form, periodo_fin: e.target.value })} /></div>
              </div>
              <div><Label>Notas</Label><Input value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} /></div>
              <Button onClick={save} className="w-full">Crear borrador</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="rep">
        <TabsList>
          <TabsTrigger value="rep">Reportes generados</TabsTrigger>
          <TabsTrigger value="enf">Enfermedades notificables</TabsTrigger>
        </TabsList>
        <TabsContent value="rep">
          <Card><CardContent className="pt-6"><Table>
            <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Periodo</TableHead><TableHead>Estado</TableHead><TableHead>Creado</TableHead><TableHead>Enviado</TableHead></TableRow></TableHeader>
            <TableBody>
              {list.map(r => <TableRow key={r.id}><TableCell><Badge>{r.tipo}</Badge></TableCell><TableCell>{r.periodo_inicio} → {r.periodo_fin}</TableCell><TableCell><Badge variant={r.estado === "enviado" ? "default" : "secondary"}>{r.estado}</Badge></TableCell><TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell><TableCell>{r.enviado_at ? new Date(r.enviado_at).toLocaleDateString() : "—"}</TableCell></TableRow>)}
              {!list.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin reportes generados</TableCell></TableRow>}
            </TableBody>
          </Table></CardContent></Card>
        </TabsContent>
        <TabsContent value="enf">
          <Card><CardContent className="pt-6"><Table>
            <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Enfermedad</TableHead><TableHead>Categoría</TableHead><TableHead>Notificación</TableHead></TableRow></TableHeader>
            <TableBody>
              {enf.map(e => <TableRow key={e.id}><TableCell className="font-mono">{e.codigo}</TableCell><TableCell>{e.nombre}</TableCell><TableCell>{e.categoria}</TableCell><TableCell>{e.inmediata ? <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Inmediata</Badge> : <Badge variant="secondary">Semanal</Badge>}</TableCell></TableRow>)}
            </TableBody>
          </Table></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
