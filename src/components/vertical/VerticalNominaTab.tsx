import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Calculator, Check, X, DollarSign } from "lucide-react";
import { formatCurrency, resolveCurrency } from "@/lib/currency";

const SFS_RATE = 0.0304;
const AFP_RATE = 0.0287;

const ESTADO_COLORS: Record<string, string> = {
  borrador: "bg-muted text-muted-foreground",
  calculado: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  aprobado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  pagado: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  anulado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function VerticalNominaTab() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const cur = resolveCurrency(currentWorkspace);
  const fmt = (v: number) => formatCurrency(v, cur);

  const [empleados, setEmpleados] = useState<any[]>([]);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [detalles, setDetalles] = useState<any[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string | null>(null);
  const [openPeriodo, setOpenPeriodo] = useState(false);
  const [perForm, setPerForm] = useState({ nombre: "", fecha_inicio: "", fecha_fin: "" });

  const fetchEmpleados = async () => {
    if (!wsId) return;
    const { data } = await supabase.from("empleados_nomina").select("*").eq("workspace_id", wsId).order("nombre");
    if (data) setEmpleados(data as any);
  };
  const fetchPeriodos = async () => {
    if (!wsId) return;
    const { data } = await supabase.from("periodos_nomina").select("*").eq("workspace_id", wsId).order("fecha_inicio", { ascending: false });
    if (data) setPeriodos(data as any);
  };
  const fetchDetalles = async (pid: string) => {
    const { data } = await supabase.from("detalle_nomina").select("*").eq("periodo_id", pid);
    if (data) setDetalles(data as any);
  };

  useEffect(() => { fetchEmpleados(); fetchPeriodos(); }, [wsId]);
  useEffect(() => { if (selectedPeriodo) fetchDetalles(selectedPeriodo); }, [selectedPeriodo]);

  const crearPeriodo = async () => {
    if (!wsId || !perForm.fecha_inicio || !perForm.fecha_fin) return;
    const { error } = await supabase.from("periodos_nomina").insert({ ...perForm, workspace_id: wsId } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Período creado");
    setOpenPeriodo(false);
    setPerForm({ nombre: "", fecha_inicio: "", fecha_fin: "" });
    fetchPeriodos();
  };

  const calcularNomina = async () => {
    if (!selectedPeriodo) return;
    const activos = empleados.filter((e) => e.activo);
    if (!activos.length) { toast.error("No hay empleados activos"); return; }
    await supabase.from("detalle_nomina").delete().eq("periodo_id", selectedPeriodo);
    const rows = activos.map((e: any) => {
      const bruto = e.salario_base;
      const sfs = Math.round(bruto * SFS_RATE * 100) / 100;
      const afp = Math.round(bruto * AFP_RATE * 100) / 100;
      return { periodo_id: selectedPeriodo, empleado_id: e.id, salario_base: bruto, horas_extra: 0, bono: 0, comisiones: 0, deducciones_sfs: sfs, deducciones_afp: afp, deducciones_isr: 0, otras_deducciones: 0, total_bruto: bruto, total_deducciones: sfs + afp, neto_pagar: bruto - sfs - afp };
    });
    const { error } = await supabase.from("detalle_nomina").insert(rows as any);
    if (error) { toast.error(error.message); return; }
    await supabase.from("periodos_nomina").update({ estado: "calculado" } as any).eq("id", selectedPeriodo);
    toast.success("Nómina calculada");
    fetchPeriodos();
    fetchDetalles(selectedPeriodo);
  };

  const cambiarEstado = async (estado: string) => {
    if (!selectedPeriodo) return;
    await supabase.from("periodos_nomina").update({ estado } as any).eq("id", selectedPeriodo);
    toast.success(`Período ${estado}`);
    fetchPeriodos();
  };

  const periodoActual = periodos.find((p: any) => p.id === selectedPeriodo);
  const empMap = useMemo(() => Object.fromEntries(empleados.map((e: any) => [e.id, e])), [empleados]);
  const masaTotal = empleados.filter((e: any) => e.activo).reduce((s: number, e: any) => s + e.salario_base, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Empleados activos</p><p className="text-2xl font-bold">{empleados.filter((e: any) => e.activo).length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Masa salarial</p><p className="text-2xl font-bold">{fmt(masaTotal)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Períodos</p><p className="text-2xl font-bold">{periodos.length}</p></CardContent></Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Nómina</h3>
        <Dialog open={openPeriodo} onOpenChange={setOpenPeriodo}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo período</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo período</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Nombre</Label><Input value={perForm.nombre} onChange={e => setPerForm({ ...perForm, nombre: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Inicio</Label><Input type="date" value={perForm.fecha_inicio} onChange={e => setPerForm({ ...perForm, fecha_inicio: e.target.value })} /></div>
                <div><Label>Fin</Label><Input type="date" value={perForm.fecha_fin} onChange={e => setPerForm({ ...perForm, fecha_fin: e.target.value })} /></div>
              </div>
              <Button onClick={crearPeriodo}>Crear</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Períodos list */}
      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Número</TableHead><TableHead>Nombre</TableHead><TableHead>Desde</TableHead><TableHead>Hasta</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Neto</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {periodos.map((p: any) => (
              <TableRow key={p.id} className={selectedPeriodo === p.id ? "bg-accent/30" : ""}>
                <TableCell className="font-mono text-xs">{p.numero}</TableCell>
                <TableCell>{p.nombre || "—"}</TableCell>
                <TableCell>{p.fecha_inicio}</TableCell>
                <TableCell>{p.fecha_fin}</TableCell>
                <TableCell><Badge className={ESTADO_COLORS[p.estado] || ""}>{p.estado}</Badge></TableCell>
                <TableCell className="text-right font-semibold">{fmt(p.total_neto || 0)}</TableCell>
                <TableCell><Button size="sm" variant="outline" onClick={() => setSelectedPeriodo(p.id)}>Ver</Button></TableCell>
              </TableRow>
            ))}
            {!periodos.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sin períodos</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      {/* Detalle */}
      {selectedPeriodo && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium">Período: {periodoActual?.numero}</span>
            <Badge className={ESTADO_COLORS[periodoActual?.estado || ""] || ""}>{periodoActual?.estado}</Badge>
            <div className="ml-auto flex gap-2">
              {periodoActual?.estado === "borrador" && <Button size="sm" onClick={calcularNomina}><Calculator className="h-4 w-4 mr-1" /> Calcular</Button>}
              {periodoActual?.estado === "calculado" && <Button size="sm" onClick={() => cambiarEstado("aprobado")}><Check className="h-4 w-4 mr-1" /> Aprobar</Button>}
              {periodoActual?.estado === "aprobado" && <Button size="sm" onClick={() => cambiarEstado("pagado")}><DollarSign className="h-4 w-4 mr-1" /> Pagado</Button>}
              {["borrador", "calculado"].includes(periodoActual?.estado || "") && <Button size="sm" variant="destructive" onClick={() => cambiarEstado("anulado")}><X className="h-4 w-4 mr-1" /> Anular</Button>}
            </div>
          </div>
          <Card>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Empleado</TableHead><TableHead className="text-right">Salario</TableHead><TableHead className="text-right">SFS</TableHead><TableHead className="text-right">AFP</TableHead><TableHead className="text-right">Neto</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {detalles.map((d: any) => {
                  const emp = empMap[d.empleado_id];
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{emp ? `${emp.nombre} ${emp.apellido || ""}` : "—"}</TableCell>
                      <TableCell className="text-right">{fmt(d.salario_base)}</TableCell>
                      <TableCell className="text-right">{fmt(d.deducciones_sfs)}</TableCell>
                      <TableCell className="text-right">{fmt(d.deducciones_afp)}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(d.neto_pagar)}</TableCell>
                    </TableRow>
                  );
                })}
                {!detalles.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Calcule la nómina primero</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}
