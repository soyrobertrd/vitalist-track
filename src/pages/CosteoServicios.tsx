import { useEffect, useMemo, useState } from "react";
import { db } from "@/integrations/db/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Calculator,
  Plus,
  Building,
  DollarSign,
  TrendingUp,
  BarChart3,
  Percent,
  Layers,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

export default function CosteoServicios() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [centros, setCentros] = useState<any[]>([]);
  const [costeo, setCosteo] = useState<any[]>([]);
  const [openCC, setOpenCC] = useState(false);
  const [openCS, setOpenCS] = useState(false);
  const [formCC, setFormCC] = useState({ codigo: "", nombre: "", presupuesto_anual: "" });
  const [formCS, setFormCS] = useState({
    codigo_servicio: "",
    nombre_servicio: "",
    centro_costo_id: "",
    costo_directo: "",
    costo_indirecto: "",
    precio_venta: "",
  });

  const cargar = async () => {
    if (!wsId) return;
    const [{ data: a }, { data: b }] = await Promise.all([
      (db as any)
        .from("centros_costo")
        .select("*")
        .eq("workspace_id", wsId)
        .eq("activo", true)
        .order("codigo"),
      (db as any)
        .from("costeo_servicios")
        .select("*, centros_costo(nombre)")
        .eq("workspace_id", wsId)
        .eq("activo", true)
        .order("nombre_servicio"),
    ]);
    setCentros(a || []);
    setCosteo(b || []);
  };

  useEffect(() => {
    cargar();
  }, [wsId]);

  const guardarCC = async () => {
    if (!wsId) return;
    if (!formCC.codigo.trim() || !formCC.nombre.trim()) {
      toast.error("Código y nombre del centro son obligatorios");
      return;
    }
    const { error } = await (db as any).from("centros_costo").insert({
      workspace_id: wsId,
      codigo: formCC.codigo,
      nombre: formCC.nombre,
      presupuesto_anual: parseFloat(formCC.presupuesto_anual) || 0,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Centro de costo creado");
    setOpenCC(false);
    setFormCC({ codigo: "", nombre: "", presupuesto_anual: "" });
    cargar();
  };

  const guardarCS = async () => {
    if (!wsId) return;
    if (!formCS.nombre_servicio.trim()) {
      toast.error("El nombre del servicio es obligatorio");
      return;
    }
    const directo = parseFloat(formCS.costo_directo) || 0;
    const indirecto = parseFloat(formCS.costo_indirecto) || 0;
    const venta = parseFloat(formCS.precio_venta) || 0;
    const total = directo + indirecto;
    const margen = venta > 0 ? ((venta - total) / venta) * 100 : 0;

    const { error } = await (db as any).from("costeo_servicios").insert({
      workspace_id: wsId,
      codigo_servicio: formCS.codigo_servicio || `SRV-${Date.now().toString().slice(-4)}`,
      nombre_servicio: formCS.nombre_servicio,
      centro_costo_id: formCS.centro_costo_id || null,
      costo_directo: directo,
      costo_indirecto: indirecto,
      precio_venta: venta,
      margen_bruto: margen.toFixed(2),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Estructura de costeo guardada con éxito");
    setOpenCS(false);
    setFormCS({
      codigo_servicio: "",
      nombre_servicio: "",
      centro_costo_id: "",
      costo_directo: "",
      costo_indirecto: "",
      precio_venta: "",
    });
    cargar();
  };

  // Métricas globales
  const margenPromedio = useMemo(() => {
    if (!costeo.length) return 0;
    const suma = costeo.reduce((s, c) => s + Number(c.margen_bruto || 0), 0);
    return suma / costeo.length;
  }, [costeo]);

  const presupuestoTotal = useMemo(() => {
    return centros.reduce((s, c) => s + Number(c.presupuesto_anual || 0), 0);
  }, [centros]);

  // Datos para gráfico de costo vs precio
  const dataCostos = useMemo(() => {
    return costeo.slice(0, 10).map((c) => ({
      nombre: c.nombre_servicio.length > 18 ? `${c.nombre_servicio.slice(0, 16)}...` : c.nombre_servicio,
      nombreCompleto: c.nombre_servicio,
      "Costo Directo": Number(c.costo_directo || 0),
      "Costo Indirecto": Number(c.costo_indirecto || 0),
      "Precio Venta": Number(c.precio_venta || 0),
      Margen: Number(c.margen_bruto || 0),
    }));
  }, [costeo]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Modo B */}
      <ClinicalPageHeader
        title="Costeo Clínico & Centros de Costo"
        subtitle="Estructura de costos directos, costos indirectos asignados, precios de venta y márgenes de rentabilidad"
        icon={Calculator}
        badge="Contabilidad de Costos"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Dialog open={openCC} onOpenChange={setOpenCC}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl border-border/80 text-xs gap-1.5">
                  <Building className="h-4 w-4 text-blue-600" /> Nuevo Centro
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-600" /> Crear Centro de Costo
                  </DialogTitle>
                  <CardDescription>Demarcación presupuestaria para agregación de costos</CardDescription>
                </DialogHeader>
                <div className="space-y-3.5 py-2">
                  <div className="space-y-1.5">
                    <Label>Código Contable / Identificador *</Label>
                    <Input
                      placeholder="Ej: CC-QUIROFANO"
                      className="rounded-xl font-mono uppercase"
                      value={formCC.codigo}
                      onChange={(e) => setFormCC({ ...formCC, codigo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nombre del Centro *</Label>
                    <Input
                      placeholder="Ej: Unidad Quirúrgica Central"
                      className="rounded-xl"
                      value={formCC.nombre}
                      onChange={(e) => setFormCC({ ...formCC, nombre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Presupuesto Anual Estimado (RD$ / USD)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="rounded-xl font-mono"
                      value={formCC.presupuesto_anual}
                      onChange={(e) => setFormCC({ ...formCC, presupuesto_anual: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setOpenCC(false)} className="rounded-xl">
                    Cancelar
                  </Button>
                  <Button onClick={guardarCC} className="rounded-xl">
                    Guardar Centro
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={openCS} onOpenChange={setOpenCS}>
              <DialogTrigger asChild>
                <Button className="rounded-xl shadow-sm gap-2">
                  <Plus className="h-4 w-4" /> Nuevo Costeo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" /> Estructurar Costo de Servicio
                  </DialogTitle>
                  <CardDescription>Defina costos directos, indirectos y precio de venta</CardDescription>
                </DialogHeader>
                <div className="space-y-3.5 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Código</Label>
                      <Input
                        placeholder="Ej: SRV-001"
                        className="rounded-xl font-mono uppercase"
                        value={formCS.codigo_servicio}
                        onChange={(e) => setFormCS({ ...formCS, codigo_servicio: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Nombre del Servicio *</Label>
                      <Input
                        placeholder="Ej: Consulta Especializada"
                        className="rounded-xl"
                        value={formCS.nombre_servicio}
                        onChange={(e) => setFormCS({ ...formCS, nombre_servicio: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Centro de Costo Vinculado</Label>
                    <Select
                      value={formCS.centro_costo_id || "none"}
                      onValueChange={(v) => setFormCS({ ...formCS, centro_costo_id: v === "none" ? "" : v })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="— Sin asignar —" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Sin asignar —</SelectItem>
                        {centros.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.codigo} - {c.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Costo Directo</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="rounded-xl font-mono text-xs"
                        value={formCS.costo_directo}
                        onChange={(e) => setFormCS({ ...formCS, costo_directo: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Costo Indirecto</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="rounded-xl font-mono text-xs"
                        value={formCS.costo_indirecto}
                        onChange={(e) => setFormCS({ ...formCS, costo_indirecto: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Precio de Venta</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="rounded-xl font-mono text-xs font-semibold"
                        value={formCS.precio_venta}
                        onChange={(e) => setFormCS({ ...formCS, precio_venta: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setOpenCS(false)} className="rounded-xl">
                    Cancelar
                  </Button>
                  <Button onClick={guardarCS} className="rounded-xl">
                    Guardar Costeo
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* KPI Cards Modo B */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Servicios Costeados"
          value={costeo.length}
          subtitle="Procedimientos con desglose formal"
          icon={Calculator}
          variant="primary"
        />
        <ClinicalKpiCard
          title="Margen Bruto Promedio"
          value={`${margenPromedio.toFixed(1)}%`}
          subtitle="Rentabilidad sobre precio de venta"
          icon={Percent}
          variant={margenPromedio >= 25 ? "emerald" : margenPromedio >= 10 ? "amber" : "rose"}
        />
        <ClinicalKpiCard
          title="Centros de Costo"
          value={centros.length}
          subtitle="Unidades operativas presupuestarias"
          icon={Building}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Presupuesto Asignado"
          value={`$${presupuestoTotal.toLocaleString("es-DO")}`}
          subtitle="Presupuesto anual consolidado"
          icon={DollarSign}
          variant="teal"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="costeo" className="space-y-4">
        <TabsList className="bg-card border border-border/80 rounded-xl p-1">
          <TabsTrigger value="costeo" className="rounded-lg gap-2 text-xs">
            <Layers className="w-4 h-4" /> Costeo de Servicios ({costeo.length})
          </TabsTrigger>
          <TabsTrigger value="graficos" className="rounded-lg gap-2 text-xs">
            <BarChart3 className="w-4 h-4" /> Analítica de Estructura de Costo
          </TabsTrigger>
          <TabsTrigger value="centros" className="rounded-lg gap-2 text-xs">
            <Building className="w-4 h-4" /> Centros de Costo ({centros.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Tabla de Servicios */}
        <TabsContent value="costeo" className="space-y-4 mt-0">
          <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-semibold">Catálogo y Rentabilidad por Procedimiento</CardTitle>
              <CardDescription>
                Desglose de costo directo (insumos/honorarios), indirecto (gastos generales) y margen resultante
              </CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-24">Código</TableHead>
                    <TableHead>Nombre del Servicio</TableHead>
                    <TableHead>Centro de Costo</TableHead>
                    <TableHead className="text-right">C. Directo</TableHead>
                    <TableHead className="text-right">C. Indirecto</TableHead>
                    <TableHead className="text-right">Costo Total</TableHead>
                    <TableHead className="text-right">Precio Venta</TableHead>
                    <TableHead className="text-center w-28">Margen Bruto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costeo.map((c) => {
                    const margen = Number(c.margen_bruto || 0);
                    const totalCosto = Number(c.costo_directo || 0) + Number(c.costo_indirecto || 0);

                    return (
                      <TableRow key={c.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                          {c.codigo_servicio}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{c.nombre_servicio}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.centros_costo?.nombre || "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono">${Number(c.costo_directo).toLocaleString("es-DO")}</TableCell>
                        <TableCell className="text-right font-mono">${Number(c.costo_indirecto).toLocaleString("es-DO")}</TableCell>
                        <TableCell className="text-right font-mono font-semibold text-foreground">
                          ${totalCosto.toLocaleString("es-DO")}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          ${Number(c.precio_venta).toLocaleString("es-DO")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={`rounded-full px-2.5 py-0.5 text-xs font-mono font-semibold ${
                              margen >= 30
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                : margen >= 15
                                ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30"
                                : margen >= 0
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                                : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30"
                            }`}
                          >
                            {margen.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!costeo.length && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                        No hay servicios costeados actualmente. Presiona "Nuevo Costeo" para estructurar un procedimiento.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Gráficos de Costos */}
        <TabsContent value="graficos" className="space-y-6 mt-0">
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Estructura de Costos vs. Precio de Venta (Top Servicios)
              </CardTitle>
              <CardDescription>
                Comparativa directa entre Costo Directo, Costo Indirecto y Precio al Público
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-80 w-full">
                {dataCostos.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    No hay datos de costeo suficientes para generar gráficos
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataCostos} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="nombre" tickLine={false} interval={0} tick={{ fontSize: 11 }} />
                      <YAxis
                        tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(val: number) => [`$${val.toLocaleString("es-DO")}`, ""]}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid rgba(0,0,0,0.1)",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Costo Directo" fill="#3b82f6" stackId="costo" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Costo Indirecto" fill="#f59e0b" stackId="costo" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Precio Venta" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Centros de Costo */}
        <TabsContent value="centros" className="space-y-4 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {centros.map((c) => (
              <Card key={c.id} className="rounded-2xl border-border/80 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                      <Building className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{c.nombre}</h4>
                      <Badge variant="outline" className="text-[10px] font-mono mt-0.5">
                        {c.codigo}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-1 pt-2 border-t border-border/60">
                  <span className="text-xs text-muted-foreground">Presupuesto Anual Asignado</span>
                  <div className="text-xl font-bold font-mono text-foreground">
                    ${Number(c.presupuesto_anual || 0).toLocaleString("es-DO")}
                  </div>
                </div>
              </Card>
            ))}
            {!centros.length && (
              <div className="col-span-full text-center text-muted-foreground py-12">
                No hay centros de costo configurados. Presiona "Nuevo Centro" para dar de alta una unidad.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

