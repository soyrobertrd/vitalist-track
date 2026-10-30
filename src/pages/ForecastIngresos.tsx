import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Plus,
  DollarSign,
  Calculator,
  Target,
  BarChart3,
  Calendar,
  PieChart as PieChartIcon,
  Trash2,
  FileSpreadsheet,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

const CATEGORIAS: { id: string; label: string; color: string }[] = [
  { id: "consultas", label: "Consultas Médicas", color: "#3b82f6" },
  { id: "cirugias", label: "Procedimientos Quirúrgicos", color: "#8b5cf6" },
  { id: "laboratorio", label: "Laboratorio Clínico", color: "#10b981" },
  { id: "imagenologia", label: "Imagenología & Rayos X", color: "#f59e0b" },
  { id: "farmacia", label: "Farmacia & Medicamentos", color: "#ec4899" },
  { id: "procedimientos", label: "Procedimientos Menores", color: "#06b6d4" },
  { id: "membresias", label: "Planes & Membresías", color: "#6366f1" },
  { id: "otros", label: "Otros Servicios", color: "#64748b" },
];

export default function ForecastIngresos() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [rows, setRows] = useState<any[]>([]);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [open, setOpen] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [form, setForm] = useState({
    mes: "1",
    categoria: "consultas",
    monto_estimado: "",
    monto_real: "",
    notas: "",
  });

  const cargar = async () => {
    if (!wsId) return;
    const { data, error } = await (supabase as any)
      .from("forecast_ingresos")
      .select("*")
      .eq("workspace_id", wsId)
      .eq("anio", anio)
      .order("mes")
      .order("categoria");

    if (error) {
      toast.error(error.message);
      return;
    }
    setRows(data || []);
  };

  useEffect(() => {
    cargar();
  }, [wsId, anio]);

  const guardar = async () => {
    if (!wsId) return;
    if (!form.monto_estimado && !form.monto_real) {
      toast.error("Debe ingresar al menos un monto proyectado o real");
      return;
    }

    const { error } = await (supabase as any).from("forecast_ingresos").insert({
      workspace_id: wsId,
      anio,
      mes: parseInt(form.mes),
      categoria: form.categoria,
      monto_estimado: parseFloat(form.monto_estimado) || 0,
      monto_real: parseFloat(form.monto_real) || 0,
      notas: form.notas || null,
    });

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Proyección guardada correctamente");
    setForm({ mes: "1", categoria: "consultas", monto_estimado: "", monto_real: "", notas: "" });
    setOpen(false);
    cargar();
  };

  const eliminar = async (id: string) => {
    const { error } = await (supabase as any).from("forecast_ingresos").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar");
    } else {
      toast.success("Registro eliminado");
      cargar();
    }
  };

  // Métricas globales
  const totalEst = useMemo(() => rows.reduce((s, r) => s + Number(r.monto_estimado || 0), 0), [rows]);
  const totalReal = useMemo(() => rows.reduce((s, r) => s + Number(r.monto_real || 0), 0), [rows]);
  const variacionTotal = totalReal - totalEst;
  const cumplimientoGlobal = totalEst > 0 ? (totalReal / totalEst) * 100 : 0;

  // Datos para gráfico de evolución mensual (12 meses)
  const dataMensual = useMemo(() => {
    return MESES.map((nombreMes, index) => {
      const numMes = index + 1;
      const filasMes = rows.filter((r) => r.mes === numMes);
      const est = filasMes.reduce((s, r) => s + Number(r.monto_estimado || 0), 0);
      const real = filasMes.reduce((s, r) => s + Number(r.monto_real || 0), 0);
      return {
        mes: nombreMes,
        Estimado: est,
        Real: real,
        Diferencia: real - est,
      };
    });
  }, [rows]);

  // Datos para gráfico de barras por categoría
  const dataCategorias = useMemo(() => {
    return CATEGORIAS.map((cat) => {
      const filasCat = rows.filter((r) => r.categoria === cat.id);
      const est = filasCat.reduce((s, r) => s + Number(r.monto_estimado || 0), 0);
      const real = filasCat.reduce((s, r) => s + Number(r.monto_real || 0), 0);
      return {
        categoria: cat.label.split(" ")[0],
        nombreCompleto: cat.label,
        Estimado: est,
        Real: real,
        color: cat.color,
      };
    }).filter((c) => c.Estimado > 0 || c.Real > 0);
  }, [rows]);

  // Datos para distribución por categoría del Real Ejecutado
  const dataPie = useMemo(() => {
    return CATEGORIAS.map((cat) => {
      const filasCat = rows.filter((r) => r.categoria === cat.id);
      const real = filasCat.reduce((s, r) => s + Number(r.monto_real || 0), 0);
      return {
        name: cat.label,
        value: real,
        color: cat.color,
      };
    }).filter((item) => item.value > 0);
  }, [rows]);

  // Filas filtradas para la tabla
  const rowsFiltradas = useMemo(() => {
    if (filtroCategoria === "todas") return rows;
    return rows.filter((r) => r.categoria === filtroCategoria);
  }, [rows, filtroCategoria]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Clínico Modo B */}
      <ClinicalPageHeader
        title="Forecast & Proyecciones Financieras"
        subtitle={`Presupuesto, metas de facturación clínica y comparativa mensual ejecutada (${anio})`}
        icon={TrendingUp}
        badge="BI Financiero"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={anio.toString()} onValueChange={(v) => setAnio(parseInt(v))}>
              <SelectTrigger className="w-32 bg-card border-border/80 rounded-xl">
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027].map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    Año {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl shadow-sm gap-2">
                  <Plus className="h-4 w-4" /> Nueva Proyección
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" /> Registrar Proyección de Ingreso
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Mes Proyectado</Label>
                      <Select value={form.mes} onValueChange={(v) => setForm({ ...form, mes: v })}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MESES.map((m, i) => (
                            <SelectItem key={i} value={(i + 1).toString()}>
                              {m} ({i + 1})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Línea / Servicio</Label>
                      <Select
                        value={form.categoria}
                        onValueChange={(v) => setForm({ ...form, categoria: v })}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIAS.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Monto Estimado / Meta (RD$ / USD)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="rounded-xl font-mono"
                      value={form.monto_estimado}
                      onChange={(e) => setForm({ ...form, monto_estimado: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Monto Real Ejecutado (Opcional)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="rounded-xl font-mono"
                      value={form.monto_real}
                      onChange={(e) => setForm({ ...form, monto_real: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Notas u Observaciones</Label>
                    <Input
                      placeholder="Ej: Campaña de chequeos anuales"
                      className="rounded-xl"
                      value={form.notas}
                      onChange={(e) => setForm({ ...form, notas: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
                    Cancelar
                  </Button>
                  <Button onClick={guardar} className="rounded-xl">
                    Guardar Pronóstico
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
          title={`Estimado Anual ${anio}`}
          value={`$${totalEst.toLocaleString("es-DO")}`}
          subtitle="Meta presupuestaria total"
          icon={Calculator}
          variant="primary"
        />
        <ClinicalKpiCard
          title="Real Ejecutado"
          value={`$${totalReal.toLocaleString("es-DO")}`}
          subtitle="Ingresos cobrados acumulados"
          icon={DollarSign}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="Variación Neta"
          value={`${variacionTotal >= 0 ? "+" : ""}$${variacionTotal.toLocaleString("es-DO")}`}
          subtitle={variacionTotal >= 0 ? "Superávit presupuestario" : "Déficit respecto a meta"}
          icon={TrendingUp}
          variant={variacionTotal >= 0 ? "teal" : "rose"}
        />
        <ClinicalKpiCard
          title="Cumplimiento Global"
          value={`${cumplimientoGlobal.toFixed(1)}%`}
          subtitle={`${rows.length} líneas de forecast registradas`}
          icon={Target}
          variant={cumplimientoGlobal >= 100 ? "emerald" : cumplimientoGlobal >= 80 ? "amber" : "blue"}
        />
      </div>

      {/* Vistas en Pestañas */}
      <Tabs defaultValue="graficos" className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList className="bg-card border border-border/80 rounded-xl p-1">
            <TabsTrigger value="graficos" className="rounded-lg gap-2">
              <BarChart3 className="w-4 h-4" /> Analítica & Gráficos
            </TabsTrigger>
            <TabsTrigger value="tabla" className="rounded-lg gap-2">
              <FileSpreadsheet className="w-4 h-4" /> Detalle Presupuestario
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Gráficos Recharts */}
        <TabsContent value="graficos" className="space-y-6 mt-0">
          {/* Gráfico 1: Área de Tendencia Mensual */}
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" /> Curva de Evolución Temporal (Estimado vs. Real)
                  </CardTitle>
                  <CardDescription>
                    Comparación mes a mes de los ingresos proyectados frente a la recaudación real
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dataMensual} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEstimado" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="mes" tickLine={false} />
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
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="Estimado"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorEstimado)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Real"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorReal)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Grilla de 2 Gráficos: Barras por Categoría y Distribución de Ingreso Real */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico 2: Barras agrupadas por categoría */}
            <Card className="rounded-2xl border-border/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" /> Ejecución por Línea de Servicio
                </CardTitle>
                <CardDescription>
                  Comparativa de meta y real alcanzado en cada unidad clínica
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-72 w-full">
                  {dataCategorias.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                      No hay datos suficientes para graficar categorías en {anio}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dataCategorias} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="categoria" tickLine={false} />
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
                        <Bar dataKey="Estimado" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Real" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Gráfico 3: Distribución Pie de Ingresos Reales */}
            <Card className="rounded-2xl border-border/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-emerald-600" /> Mezcla de Ingresos Reales
                </CardTitle>
                <CardDescription>
                  Participación porcentual de cada servicio en los ingresos cobrados
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-72 w-full">
                  {dataPie.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                      Aún no se han registrado ingresos reales para {anio}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dataPie}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {dataPie.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: number) => [`$${val.toLocaleString("es-DO")}`, "Total"]}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid rgba(0,0,0,0.1)",
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Tabla de Datos */}
        <TabsContent value="tabla" className="mt-0">
          <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold">Desglose Detallado de Proyecciones</CardTitle>
                  <CardDescription>Registro línea por línea de montos proyectados y variaciones</CardDescription>
                </div>
                <div className="w-56">
                  <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                    <SelectTrigger className="rounded-xl h-9">
                      <SelectValue placeholder="Filtrar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas las categorías</SelectItem>
                      {CATEGORIAS.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-24">Mes</TableHead>
                    <TableHead>Categoría / Servicio</TableHead>
                    <TableHead className="text-right">Meta Estimada</TableHead>
                    <TableHead className="text-right">Real Ejecutado</TableHead>
                    <TableHead className="text-right">Variación</TableHead>
                    <TableHead className="text-center w-28">Cumplimiento</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="w-16 text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rowsFiltradas.map((r) => {
                    const est = Number(r.monto_estimado || 0);
                    const real = Number(r.monto_real || 0);
                    const variacion = real - est;
                    const pct = est > 0 ? (real / est) * 100 : 0;
                    const catObj = CATEGORIAS.find((c) => c.id === r.categoria);

                    return (
                      <TableRow key={r.id} className="hover:bg-muted/30">
                        <TableCell className="font-semibold text-foreground">
                          {MESES[r.mes - 1]}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-md font-medium">
                            {catObj?.label || r.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          ${est.toLocaleString("es-DO")}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium text-foreground">
                          ${real.toLocaleString("es-DO")}
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono font-semibold ${
                            variacion >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {variacion >= 0 ? "+" : ""}${variacion.toLocaleString("es-DO")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={`rounded-full px-2 text-xs font-mono ${
                              pct >= 100
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                : pct >= 75
                                ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {pct.toFixed(0)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                          {r.notas || "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-rose-600 rounded-lg"
                            onClick={() => eliminar(r.id)}
                            title="Eliminar registro"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!rowsFiltradas.length && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                        No hay proyecciones registradas para {anio} {filtroCategoria !== "todas" ? "en esta categoría" : ""}.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

