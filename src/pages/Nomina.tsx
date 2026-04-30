import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { MobilePageHeader } from "@/components/MobilePageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Users, CalendarDays, DollarSign, Calculator, Check, X } from "lucide-react";
import { formatCurrency, resolveCurrency } from "@/lib/currency";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Empleado {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string | null;
  cargo: string | null;
  departamento: string | null;
  salario_base: number;
  cuenta_banco: string | null;
  banco: string | null;
  fecha_ingreso: string | null;
  activo: boolean;
}

interface Periodo {
  id: string;
  numero: string | null;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  total_bruto: number;
  total_deducciones: number;
  total_neto: number;
}

interface Detalle {
  id: string;
  periodo_id: string;
  empleado_id: string;
  salario_base: number;
  horas_extra: number;
  bono: number;
  comisiones: number;
  deducciones_sfs: number;
  deducciones_afp: number;
  deducciones_isr: number;
  otras_deducciones: number;
  total_bruto: number;
  total_deducciones: number;
  neto_pagar: number;
}

const ESTADO_COLORS: Record<string, string> = {
  borrador: "bg-muted text-muted-foreground",
  calculado: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  aprobado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  pagado: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  anulado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

// DR legal rates
const SFS_RATE = 0.0304; // 3.04%
const AFP_RATE = 0.0287; // 2.87%

export default function Nomina() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const cur = resolveCurrency(currentWorkspace);
  const fmt = (v: number) => formatCurrency(v, cur);

  /* ---- state ---- */
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [detalles, setDetalles] = useState<Detalle[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string | null>(null);
  const [openEmpleado, setOpenEmpleado] = useState(false);
  const [openPeriodo, setOpenPeriodo] = useState(false);

  // New empleado form
  const [empForm, setEmpForm] = useState({ nombre: "", apellido: "", cedula: "", cargo: "", departamento: "", salario_base: 0, cuenta_banco: "", banco: "" });
  // New periodo form
  const [perForm, setPerForm] = useState({ nombre: "", fecha_inicio: "", fecha_fin: "" });

  /* ---- fetch ---- */
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
  const fetchDetalles = async (periodoId: string) => {
    const { data } = await supabase.from("detalle_nomina").select("*").eq("periodo_id", periodoId);
    if (data) setDetalles(data as any);
  };

  useEffect(() => { fetchEmpleados(); fetchPeriodos(); }, [wsId]);
  useEffect(() => { if (selectedPeriodo) fetchDetalles(selectedPeriodo); }, [selectedPeriodo]);

  /* ---- create empleado ---- */
  const crearEmpleado = async () => {
    if (!wsId || !empForm.nombre) return;
    const { error } = await supabase.from("empleados_nomina").insert({ ...empForm, workspace_id: wsId } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Empleado agregado");
    setOpenEmpleado(false);
    setEmpForm({ nombre: "", apellido: "", cedula: "", cargo: "", departamento: "", salario_base: 0, cuenta_banco: "", banco: "" });
    fetchEmpleados();
  };

  /* ---- create periodo ---- */
  const crearPeriodo = async () => {
    if (!wsId || !perForm.fecha_inicio || !perForm.fecha_fin) return;
    const { error } = await supabase.from("periodos_nomina").insert({ ...perForm, workspace_id: wsId } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Período creado");
    setOpenPeriodo(false);
    setPerForm({ nombre: "", fecha_inicio: "", fecha_fin: "" });
    fetchPeriodos();
  };

  /* ---- calcular nómina ---- */
  const calcularNomina = async () => {
    if (!selectedPeriodo) return;
    const activos = empleados.filter((e) => e.activo);
    if (!activos.length) { toast.error("No hay empleados activos"); return; }

    // Delete existing details and recalculate
    await supabase.from("detalle_nomina").delete().eq("periodo_id", selectedPeriodo);

    const rows = activos.map((e) => {
      const bruto = e.salario_base;
      const sfs = Math.round(bruto * SFS_RATE * 100) / 100;
      const afp = Math.round(bruto * AFP_RATE * 100) / 100;
      const totalDed = sfs + afp;
      return {
        periodo_id: selectedPeriodo,
        empleado_id: e.id,
        salario_base: bruto,
        horas_extra: 0,
        bono: 0,
        comisiones: 0,
        deducciones_sfs: sfs,
        deducciones_afp: afp,
        deducciones_isr: 0,
        otras_deducciones: 0,
        total_bruto: bruto,
        total_deducciones: totalDed,
        neto_pagar: bruto - totalDed,
      };
    });

    const { error } = await supabase.from("detalle_nomina").insert(rows as any);
    if (error) { toast.error(error.message); return; }

    await supabase.from("periodos_nomina").update({ estado: "calculado" } as any).eq("id", selectedPeriodo);
    toast.success("Nómina calculada");
    fetchPeriodos();
    fetchDetalles(selectedPeriodo);
  };

  /* ---- aprobar / pagar ---- */
  const cambiarEstadoPeriodo = async (estado: string) => {
    if (!selectedPeriodo) return;
    await supabase.from("periodos_nomina").update({ estado } as any).eq("id", selectedPeriodo);
    toast.success(`Período ${estado}`);
    fetchPeriodos();
  };

  const periodoActual = periodos.find((p) => p.id === selectedPeriodo);
  const empMap = useMemo(() => Object.fromEntries(empleados.map((e) => [e.id, e])), [empleados]);

  /* ---- stats ---- */
  const totalEmpleados = empleados.filter((e) => e.activo).length;
  const masaTotal = empleados.filter((e) => e.activo).reduce((s, e) => s + e.salario_base, 0);

  return (
    <div className="space-y-6">
      <MobilePageHeader title="Nómina" description="Gestión de empleados y cálculo de nómina" />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Empleados activos</p><p className="text-2xl font-bold">{totalEmpleados}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Masa salarial</p><p className="text-2xl font-bold">{fmt(masaTotal)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Períodos</p><p className="text-2xl font-bold">{periodos.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Último neto</p><p className="text-2xl font-bold">{periodos[0] ? fmt(periodos[0].total_neto) : "—"}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="empleados" className="w-full">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="empleados" className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Empleados</TabsTrigger>
          <TabsTrigger value="periodos" className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> Períodos</TabsTrigger>
          <TabsTrigger value="detalle" className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> Detalle</TabsTrigger>
        </TabsList>

        {/* ---- EMPLEADOS ---- */}
        <TabsContent value="empleados" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={openEmpleado} onOpenChange={setOpenEmpleado}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Agregar empleado</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nuevo empleado</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Nombre</Label><Input value={empForm.nombre} onChange={(e) => setEmpForm({ ...empForm, nombre: e.target.value })} /></div>
                    <div><Label>Apellido</Label><Input value={empForm.apellido} onChange={(e) => setEmpForm({ ...empForm, apellido: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Cédula</Label><Input value={empForm.cedula} onChange={(e) => setEmpForm({ ...empForm, cedula: e.target.value })} /></div>
                    <div><Label>Cargo</Label><Input value={empForm.cargo} onChange={(e) => setEmpForm({ ...empForm, cargo: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Departamento</Label><Input value={empForm.departamento} onChange={(e) => setEmpForm({ ...empForm, departamento: e.target.value })} /></div>
                    <div><Label>Salario base</Label><Input type="number" value={empForm.salario_base} onChange={(e) => setEmpForm({ ...empForm, salario_base: +e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Banco</Label><Input value={empForm.banco} onChange={(e) => setEmpForm({ ...empForm, banco: e.target.value })} /></div>
                    <div><Label>Cuenta banco</Label><Input value={empForm.cuenta_banco} onChange={(e) => setEmpForm({ ...empForm, cuenta_banco: e.target.value })} /></div>
                  </div>
                  <Button onClick={crearEmpleado}>Guardar</Button>
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
                  <TableHead>Cargo</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead className="text-right">Salario base</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empleados.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.nombre} {e.apellido}</TableCell>
                    <TableCell>{e.cedula || "—"}</TableCell>
                    <TableCell>{e.cargo || "—"}</TableCell>
                    <TableCell>{e.departamento || "—"}</TableCell>
                    <TableCell className="text-right">{fmt(e.salario_base)}</TableCell>
                    <TableCell><Badge variant={e.activo ? "default" : "secondary"}>{e.activo ? "Activo" : "Inactivo"}</Badge></TableCell>
                  </TableRow>
                ))}
                {!empleados.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin empleados registrados</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ---- PERÍODOS ---- */}
        <TabsContent value="periodos" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={openPeriodo} onOpenChange={setOpenPeriodo}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo período</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nuevo período de nómina</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Nombre (ej: Enero 2026 Q1)</Label><Input value={perForm.nombre} onChange={(e) => setPerForm({ ...perForm, nombre: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Fecha inicio</Label><Input type="date" value={perForm.fecha_inicio} onChange={(e) => setPerForm({ ...perForm, fecha_inicio: e.target.value })} /></div>
                    <div><Label>Fecha fin</Label><Input type="date" value={perForm.fecha_fin} onChange={(e) => setPerForm({ ...perForm, fecha_fin: e.target.value })} /></div>
                  </div>
                  <Button onClick={crearPeriodo}>Crear</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead>Hasta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Bruto</TableHead>
                  <TableHead className="text-right">Deducciones</TableHead>
                  <TableHead className="text-right">Neto</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodos.map((p) => (
                  <TableRow key={p.id} className={selectedPeriodo === p.id ? "bg-accent/30" : ""}>
                    <TableCell className="font-mono text-xs">{p.numero}</TableCell>
                    <TableCell>{p.nombre || "—"}</TableCell>
                    <TableCell>{p.fecha_inicio}</TableCell>
                    <TableCell>{p.fecha_fin}</TableCell>
                    <TableCell><Badge className={ESTADO_COLORS[p.estado] || ""}>{p.estado}</Badge></TableCell>
                    <TableCell className="text-right">{fmt(p.total_bruto)}</TableCell>
                    <TableCell className="text-right">{fmt(p.total_deducciones)}</TableCell>
                    <TableCell className="text-right font-semibold">{fmt(p.total_neto)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setSelectedPeriodo(p.id)}>Ver</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!periodos.length && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Sin períodos</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ---- DETALLE ---- */}
        <TabsContent value="detalle" className="mt-4 space-y-4">
          {!selectedPeriodo ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Seleccione un período en la pestaña "Períodos"</CardContent></Card>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium">Período: {periodoActual?.numero} — {periodoActual?.nombre}</span>
                <Badge className={ESTADO_COLORS[periodoActual?.estado || ""] || ""}>{periodoActual?.estado}</Badge>
                <div className="ml-auto flex gap-2">
                  {periodoActual?.estado === "borrador" && (
                    <Button size="sm" onClick={calcularNomina}><Calculator className="h-4 w-4 mr-1" /> Calcular</Button>
                  )}
                  {periodoActual?.estado === "calculado" && (
                    <Button size="sm" variant="default" onClick={() => cambiarEstadoPeriodo("aprobado")}><Check className="h-4 w-4 mr-1" /> Aprobar</Button>
                  )}
                  {periodoActual?.estado === "aprobado" && (
                    <Button size="sm" variant="default" onClick={() => cambiarEstadoPeriodo("pagado")}><DollarSign className="h-4 w-4 mr-1" /> Marcar pagado</Button>
                  )}
                  {["borrador", "calculado"].includes(periodoActual?.estado || "") && (
                    <Button size="sm" variant="destructive" onClick={() => cambiarEstadoPeriodo("anulado")}><X className="h-4 w-4 mr-1" /> Anular</Button>
                  )}
                </div>
              </div>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead className="text-right">Salario</TableHead>
                      <TableHead className="text-right">H. Extra</TableHead>
                      <TableHead className="text-right">Bono</TableHead>
                      <TableHead className="text-right">SFS</TableHead>
                      <TableHead className="text-right">AFP</TableHead>
                      <TableHead className="text-right">ISR</TableHead>
                      <TableHead className="text-right">Otras Ded.</TableHead>
                      <TableHead className="text-right">Bruto</TableHead>
                      <TableHead className="text-right">Deducciones</TableHead>
                      <TableHead className="text-right font-semibold">Neto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detalles.map((d) => {
                      const emp = empMap[d.empleado_id];
                      return (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">{emp ? `${emp.nombre} ${emp.apellido}` : d.empleado_id.slice(0, 8)}</TableCell>
                          <TableCell className="text-right">{fmt(d.salario_base)}</TableCell>
                          <TableCell className="text-right">{fmt(d.horas_extra)}</TableCell>
                          <TableCell className="text-right">{fmt(d.bono)}</TableCell>
                          <TableCell className="text-right">{fmt(d.deducciones_sfs)}</TableCell>
                          <TableCell className="text-right">{fmt(d.deducciones_afp)}</TableCell>
                          <TableCell className="text-right">{fmt(d.deducciones_isr)}</TableCell>
                          <TableCell className="text-right">{fmt(d.otras_deducciones)}</TableCell>
                          <TableCell className="text-right">{fmt(d.total_bruto)}</TableCell>
                          <TableCell className="text-right">{fmt(d.total_deducciones)}</TableCell>
                          <TableCell className="text-right font-semibold">{fmt(d.neto_pagar)}</TableCell>
                        </TableRow>
                      );
                    })}
                    {!detalles.length && <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-8">Sin detalle — calcule la nómina primero</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
