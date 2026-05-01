import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Plus } from "lucide-react";
import { toast } from "sonner";

const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const categorias = ["consultas","cirugias","laboratorio","imagenologia","farmacia","procedimientos","membresias","otros"];

export default function ForecastIngresos() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [rows, setRows] = useState<any[]>([]);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ mes: "1", categoria: "consultas", monto_estimado: "", monto_real: "", notas: "" });

  const cargar = async () => {
    if (!wsId) return;
    const { data } = await (supabase as any).from("forecast_ingresos")
      .select("*").eq("workspace_id", wsId).eq("anio", anio).order("mes").order("categoria");
    setRows(data || []);
  };

  useEffect(() => { cargar(); }, [wsId, anio]);

  const guardar = async () => {
    if (!wsId) return;
    const { error } = await (supabase as any).from("forecast_ingresos").insert({
      workspace_id: wsId,
      anio,
      mes: parseInt(form.mes),
      categoria: form.categoria,
      monto_estimado: parseFloat(form.monto_estimado) || 0,
      monto_real: parseFloat(form.monto_real) || 0,
      notas: form.notas || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Forecast guardado");
    setOpen(false);
    cargar();
  };

  const totalEst = rows.reduce((s, r) => s + Number(r.monto_estimado || 0), 0);
  const totalReal = rows.reduce((s, r) => s + Number(r.monto_real || 0), 0);
  const cumplimiento = totalEst > 0 ? (totalReal / totalEst) * 100 : 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-primary" /> Forecast de Ingresos
          </h1>
          <p className="text-sm text-muted-foreground">Proyecciones mensuales por categoría</p>
        </div>
        <div className="flex gap-2">
          <Select value={anio.toString()} onValueChange={v => setAnio(parseInt(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nuevo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nueva proyección</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Mes</Label>
                    <Select value={form.mes} onValueChange={v => setForm({ ...form, mes: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{meses.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Categoría</Label>
                    <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Monto estimado</Label><Input type="number" value={form.monto_estimado} onChange={e => setForm({ ...form, monto_estimado: e.target.value })} /></div>
                <div><Label>Monto real (opcional)</Label><Input type="number" value={form.monto_real} onChange={e => setForm({ ...form, monto_real: e.target.value })} /></div>
                <div><Label>Notas</Label><Input value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} /></div>
                <Button onClick={guardar}>Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 text-center"><div className="text-3xl font-bold">${totalEst.toLocaleString()}</div><div className="text-sm text-muted-foreground">Estimado {anio}</div></Card>
        <Card className="p-4 text-center"><div className="text-3xl font-bold text-emerald-600">${totalReal.toLocaleString()}</div><div className="text-sm text-muted-foreground">Real ejecutado</div></Card>
        <Card className="p-4 text-center"><div className="text-3xl font-bold text-blue-600">{cumplimiento.toFixed(1)}%</div><div className="text-sm text-muted-foreground">Cumplimiento</div></Card>
      </div>

      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Mes</TableHead><TableHead>Categoría</TableHead><TableHead className="text-right">Estimado</TableHead><TableHead className="text-right">Real</TableHead><TableHead className="text-right">Variación</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map(r => {
              const variacion = Number(r.monto_real || 0) - Number(r.monto_estimado || 0);
              return (
                <TableRow key={r.id}>
                  <TableCell>{meses[r.mes - 1]}</TableCell>
                  <TableCell className="capitalize">{r.categoria}</TableCell>
                  <TableCell className="text-right font-mono">${Number(r.monto_estimado).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">${Number(r.monto_real).toLocaleString()}</TableCell>
                  <TableCell className={`text-right font-mono ${variacion >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {variacion >= 0 ? "+" : ""}${variacion.toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })}
            {!rows.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin proyecciones para {anio}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
