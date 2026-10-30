import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Shirt, 
  Package, 
  AlertTriangle, 
  Plus, 
  Search, 
  Sparkles, 
  Waves, 
  Wind, 
  CheckCircle2, 
  Clock, 
  Scale,
  PieChart as PieChartIcon,
  ShieldCheck
} from "lucide-react";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from "recharts";

const ESTADOS_ORDEN = [
  { value: "recibida", label: "Recibida / Clasificación", color: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  { value: "en_lavado", label: "En Lavado Térmico", color: "bg-cyan-500/10 text-cyan-700 border-cyan-500/30" },
  { value: "secado", label: "En Secado", color: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  { value: "planchado", label: "Planchado & Doblado", color: "bg-purple-500/10 text-purple-700 border-purple-500/30" },
  { value: "lista", label: "Lista para Entrega", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  { value: "entregada", label: "Entregada al Servicio", color: "bg-muted text-muted-foreground" }
];

const PALETA_GRAFICOS = ["#3b82f6", "#06b6d4", "#eab308", "#a855f7", "#10b981", "#64748b"];

export default function Lavanderia() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("ordenes");
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");

  const [showNewOrden, setShowNewOrden] = useState(false);
  const [showNewPrenda, setShowNewPrenda] = useState(false);

  // Formularios
  const [formDataOrden, setFormDataOrden] = useState({
    servicio_solicitante: "Quirófano 01",
    tipo_ropa: "Ropa Quirúrgica Esterilizable",
    cantidad_piezas: "25",
    peso_kg: "12.5",
    prioridad: "normal"
  });

  const [formDataPrenda, setFormDataPrenda] = useState({
    tipo: "Sábana Clínica Estándar",
    cantidad_total: "100",
    cantidad_disponible: "80",
    stock_minimo: "20"
  });

  // Queries
  const { data: ordenes = [], isLoading: loadingOrdenes } = useQuery({
    queryKey: ["ordenes_lavanderia", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("ordenes_lavanderia" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("created_at", { ascending: false })
        .limit(150);
      return (data || []) as any[];
    }
  });

  const { data: inventario = [], isLoading: loadingInventario } = useQuery({
    queryKey: ["inventario_ropa", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("inventario_ropa" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("tipo");
      return (data || []) as any[];
    }
  });

  // Mutación: Crear Orden
  const crearOrden = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error("Workspace no activo");
      const num = `LAV-${Date.now().toString().slice(-6)}`;
      const { error } = await supabase.from("ordenes_lavanderia" as any).insert({
        workspace_id: currentWorkspace.id,
        numero: num,
        servicio_solicitante: formDataOrden.servicio_solicitante,
        tipo_ropa: formDataOrden.tipo_ropa,
        cantidad_piezas: parseInt(formDataOrden.cantidad_piezas) || 0,
        peso_kg: parseFloat(formDataOrden.peso_kg) || 0,
        prioridad: formDataOrden.prioridad,
        estado: "recibida"
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordenes_lavanderia"] });
      toast.success("Lote de lavado registrado correctamente");
      setShowNewOrden(false);
      setFormDataOrden({
        servicio_solicitante: "Quirófano 01",
        tipo_ropa: "Ropa Quirúrgica Esterilizable",
        cantidad_piezas: "25",
        peso_kg: "12.5",
        prioridad: "normal"
      });
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  // Mutación: Registrar Prenda en Inventario
  const crearPrenda = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error("Workspace no activo");
      const total = parseInt(formDataPrenda.cantidad_total) || 0;
      const disp = parseInt(formDataPrenda.cantidad_disponible) || total;
      const { error } = await supabase.from("inventario_ropa" as any).insert({
        workspace_id: currentWorkspace.id,
        tipo: formDataPrenda.tipo,
        cantidad_total: total,
        cantidad_disponible: disp,
        stock_minimo: parseInt(formDataPrenda.stock_minimo) || 10
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventario_ropa"] });
      toast.success("Lencería añadida al inventario");
      setShowNewPrenda(false);
      setFormDataPrenda({
        tipo: "Sábana Clínica Estándar",
        cantidad_total: "100",
        cantidad_disponible: "80",
        stock_minimo: "20"
      });
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  // Mutación: Avanzar Estado de Orden
  const avanzarEstado = useMutation({
    mutationFn: async ({ id, nuevoEstado }: { id: string; nuevoEstado: string }) => {
      const { error } = await supabase
        .from("ordenes_lavanderia" as any)
        .update({ estado: nuevoEstado })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordenes_lavanderia"] });
      toast.success("Estado del lote actualizado");
    },
    onError: (err: any) => toast.error(`Error al actualizar estado: ${err.message}`)
  });

  // KPIs
  const totalOrdenes = ordenes.length;
  const enProceso = ordenes.filter(o => !["lista", "entregada"].includes(o.estado)).length;
  const listas = ordenes.filter(o => o.estado === "lista").length;
  const stockBajo = inventario.filter(i => (i.cantidad_disponible || 0) < (i.stock_minimo || 10)).length;
  const kilosTotales = ordenes.reduce((acc, o) => acc + (Number(o.peso_kg) || 0), 0);

  // Filtros
  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter(o => {
      if (filterEstado !== "todos" && o.estado !== filterEstado) return false;
      if (!search) return true;
      const full = `${o.numero || ""} ${o.servicio_solicitante || ""} ${o.tipo_ropa || ""}`.toLowerCase();
      return full.includes(search.toLowerCase());
    });
  }, [ordenes, search, filterEstado]);

  const inventarioFiltrado = useMemo(() => {
    return inventario.filter(i => {
      if (!search) return true;
      return (i.tipo || "").toLowerCase().includes(search.toLowerCase());
    });
  }, [inventario, search]);

  // Datos para Gráficos
  const datosPorEstado = useMemo(() => {
    const counts: Record<string, number> = {};
    ordenes.forEach(o => {
      const label = ESTADOS_ORDEN.find(e => e.value === o.estado)?.label.split(" /")[0] || o.estado;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [ordenes]);

  const datosPorServicio = useMemo(() => {
    const counts: Record<string, number> = {};
    ordenes.forEach(o => {
      const serv = o.servicio_solicitante || "General";
      counts[serv] = (counts[serv] || 0) + (Number(o.peso_kg) || 0);
    });
    return Object.entries(counts).slice(0, 6).map(([name, kg]) => ({ 
      name, 
      kg: +kg.toFixed(1) 
    }));
  }, [ordenes]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      <ClinicalPageHeader
        title="Lavandería & Ropería Hospitalaria"
        subtitle="Control de ciclos de lavado térmico, trazabilidad de lencería quirúrgica y stock hospitalario"
        badge="Servicios Generales & Ropería"
        icon={Shirt}
        action={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="rounded-xl border-border/80 shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setShowNewPrenda(true)}
            >
              <Package className="h-4 w-4 mr-1.5 text-blue-600" />
              Nueva Prenda
            </Button>
            <Button 
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setShowNewOrden(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Nuevo Lote de Lavado
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Lotes en Proceso"
          value={enProceso}
          subtitle="En lavado, secado o planchado"
          icon={Waves}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Lencería Lista para Entrega"
          value={listas}
          subtitle="Doblada y apta para distribución"
          icon={CheckCircle2}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="Peso Procesado Acumulado"
          value={`${kilosTotales.toFixed(1)} kg`}
          subtitle="Carga textil hospitalaria total"
          icon={Scale}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Alertas de Stock Bajo"
          value={stockBajo}
          subtitle="Prendas por debajo del mínimo"
          icon={AlertTriangle}
          variant={stockBajo > 0 ? "rose" : "teal"}
          alert={stockBajo > 0}
        />
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por lote, servicio solicitante o tipo de prenda..."
            className="pl-9 rounded-xl border-border/80 bg-background/50 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-56">
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="rounded-xl border-border/80 h-10">
              <SelectValue placeholder="Estado del lote" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              {ESTADOS_ORDEN.map(e => (
                <SelectItem key={e.value} value={e.value}>{e.label.split(" /")[0]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pestañas */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl border border-border/60">
          <TabsTrigger value="ordenes" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Waves className="h-4 w-4 mr-1.5 text-blue-600" />
            Lotes de Lavado ({ordenesFiltradas.length})
          </TabsTrigger>
          <TabsTrigger value="inventario" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Package className="h-4 w-4 mr-1.5 text-purple-600" />
            Inventario de Lencería ({inventarioFiltrado.length})
          </TabsTrigger>
          <TabsTrigger value="analitica" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <PieChartIcon className="h-4 w-4 mr-1.5 text-emerald-600" />
            Volumen & Distribución
          </TabsTrigger>
          <TabsTrigger value="bioseguridad" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <ShieldCheck className="h-4 w-4 mr-1.5 text-teal-600" />
            Protocolos de Desinfección Térmica
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Órdenes */}
        <TabsContent value="ordenes">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Trazabilidad de Lotes de Lavado</CardTitle>
              <CardDescription>Flujo de desinfección, secado y entrega de ropa limpia a áreas asistenciales</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Lote #</TableHead>
                    <TableHead>Servicio Solicitante</TableHead>
                    <TableHead>Tipo de Ropa</TableHead>
                    <TableHead>Piezas / Peso</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Estado Actual</TableHead>
                    <TableHead className="pr-6 text-right">Avanzar Etapa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingOrdenes ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        Cargando lotes de lavandería...
                      </TableCell>
                    </TableRow>
                  ) : ordenesFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No hay lotes de lavado registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ordenesFiltradas.map((o) => {
                      const estMeta = ESTADOS_ORDEN.find(e => e.value === o.estado);
                      const estadoIdx = ESTADOS_ORDEN.findIndex(e => e.value === o.estado);
                      const siguienteEstado = estadoIdx < ESTADOS_ORDEN.length - 1 ? ESTADOS_ORDEN[estadoIdx + 1] : null;
                      return (
                        <TableRow key={o.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="pl-6 font-mono font-bold text-xs text-blue-700 dark:text-blue-400">
                            {o.numero}
                          </TableCell>
                          <TableCell className="font-semibold text-sm">{o.servicio_solicitante}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{o.tipo_ropa}</TableCell>
                          <TableCell className="font-mono text-xs">
                            <span className="font-bold">{o.cantidad_piezas || 0} pzs</span> · {o.peso_kg ? `${o.peso_kg} kg` : "—"}
                          </TableCell>
                          <TableCell>
                            {o.prioridad === "urgente" ? (
                              <Badge variant="destructive" className="rounded-lg text-xs">Urgente</Badge>
                            ) : (
                              <Badge variant="outline" className="rounded-lg text-xs text-muted-foreground">Normal</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`rounded-lg capitalize text-xs ${estMeta?.color || ""}`}>
                              {estMeta?.label || o.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            {siguienteEstado ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl h-8 text-xs border-border/80"
                                onClick={() => avanzarEstado.mutate({ id: o.id, nuevoEstado: siguienteEstado.value })}
                                disabled={avanzarEstado.isPending}
                              >
                                Pasar a {siguienteEstado.label.split(" /")[0]}
                              </Button>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                                Completado
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Inventario */}
        <TabsContent value="inventario">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Censo de Lencería Hospitalaria</CardTitle>
              <CardDescription>Stock de prendas limpias, en circuito de lavado y reposición mínima</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Tipo de Prenda</TableHead>
                    <TableHead>Disponibles</TableHead>
                    <TableHead>Total en Circuito</TableHead>
                    <TableHead>Stock Mínimo</TableHead>
                    <TableHead>Disponibilidad</TableHead>
                    <TableHead className="pr-6">Estado de Abastecimiento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingInventario ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Cargando inventario de lencería...
                      </TableCell>
                    </TableRow>
                  ) : inventarioFiltrado.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No hay prendas en el inventario.
                      </TableCell>
                    </TableRow>
                  ) : (
                    inventarioFiltrado.map((i) => {
                      const disp = i.cantidad_disponible || 0;
                      const tot = i.cantidad_total || 1;
                      const min = i.stock_minimo || 10;
                      const pct = Math.min(100, Math.round((disp / tot) * 100));
                      const esBajo = disp < min;
                      return (
                        <TableRow key={i.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="pl-6 font-semibold flex items-center gap-2">
                            <Shirt className="h-4 w-4 text-blue-600" />
                            {i.tipo}
                          </TableCell>
                          <TableCell className="font-mono font-bold text-foreground">{disp} pzs</TableCell>
                          <TableCell className="font-mono text-muted-foreground">{tot} pzs</TableCell>
                          <TableCell className="font-mono text-xs">{min} pzs</TableCell>
                          <TableCell className="w-36">
                            <div className="space-y-1">
                              <Progress value={pct} className="h-2 rounded-full" />
                              <p className="text-[10px] text-muted-foreground text-right font-mono">{pct}%</p>
                            </div>
                          </TableCell>
                          <TableCell className="pr-6">
                            {esBajo ? (
                              <Badge variant="destructive" className="rounded-lg text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" /> Stock Crítico
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="rounded-lg text-xs bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                                Abastecido
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Analítica */}
        <TabsContent value="analitica">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Distribución de Lotes por Etapa</CardTitle>
                <CardDescription>Estado de la ropa en el circuito de lavandería</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {datosPorEstado.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sin datos suficientes para graficar.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={datosPorEstado}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={50}
                        paddingAngle={4}
                      >
                        {datosPorEstado.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PALETA_GRAFICOS[index % PALETA_GRAFICOS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Carga Textil Procesada por Servicio (kg)</CardTitle>
                <CardDescription>Demanda de lencería por quirófanos, UCI y hospitalización</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {datosPorServicio.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sin datos de servicios para graficar.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosPorServicio} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
                      />
                      <Bar dataKey="kg" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Bioseguridad Textil */}
        <TabsContent value="bioseguridad">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl border-border/80 shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2 text-blue-600 font-bold">
                <Waves className="h-5 w-5" />
                Desinfección Térmica (&gt; 71°C)
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ciclo de lavado térmico con agua caliente superior a 71°C durante un mínimo de 25 minutos para garantizar la destrucción de patógenos bacterianos y esporas.
              </p>
            </Card>

            <Card className="rounded-2xl border-border/80 shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2 text-purple-600 font-bold">
                <ShieldCheck className="h-5 w-5" />
                Separación Zona Sucia vs Zona Limpia
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Barrera física sanitaria estricta sin cruce de flujos de aire ni de personal entre el área de recepción de ropa contaminada y el área de planchado/empaque.
              </p>
            </Card>

            <Card className="rounded-2xl border-border/80 shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                <Sparkles className="h-5 w-5" />
                Empaque Quirúrgico hacia CEYE
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Los campos y batas quirúrgicas dobladas deben ser inspeccionados a trasluz (libres de pelusas o roturas) y remitidos en bolsas impermeables a esterilización.
              </p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo Nuevo Lote */}
      <Dialog open={showNewOrden} onOpenChange={setShowNewOrden}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Waves className="h-5 w-5 text-blue-600" />
              Nuevo Lote de Lavado Hospitalario
            </DialogTitle>
            <DialogDescription>
              Registre el ingreso de ropa sucia o contaminada al circuito de lavandería.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Servicio Solicitante *</Label>
              <Input
                placeholder="Ej. Quirófano 01, UCI, Maternidad..."
                className="rounded-xl border-border/80"
                value={formDataOrden.servicio_solicitante}
                onChange={(e) => setFormDataOrden(p => ({ ...p, servicio_solicitante: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Lencería / Ropa</Label>
              <Input
                placeholder="Ej. Ropa quirúrgica esterilizable, sábanas..."
                className="rounded-xl border-border/80"
                value={formDataOrden.tipo_ropa}
                onChange={(e) => setFormDataOrden(p => ({ ...p, tipo_ropa: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Piezas Estimadas</Label>
                <Input
                  type="number"
                  placeholder="Ej. 25"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataOrden.cantidad_piezas}
                  onChange={(e) => setFormDataOrden(p => ({ ...p, cantidad_piezas: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Peso en Báscula (kg)</Label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="Ej. 12.5"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataOrden.peso_kg}
                  onChange={(e) => setFormDataOrden(p => ({ ...p, peso_kg: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select 
                value={formDataOrden.prioridad} 
                onValueChange={(val) => setFormDataOrden(p => ({ ...p, prioridad: val }))}
              >
                <SelectTrigger className="rounded-xl border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal / Rutina</SelectItem>
                  <SelectItem value="urgente">Urgente (Quirófano / CEYE)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewOrden(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={() => crearOrden.mutate()}
              disabled={crearOrden.isPending || !formDataOrden.servicio_solicitante}
            >
              {crearOrden.isPending ? "Registrando..." : "Registrar Lote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Nueva Prenda */}
      <Dialog open={showNewPrenda} onOpenChange={setShowNewPrenda}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Incorporar Prenda al Inventario
            </DialogTitle>
            <DialogDescription>
              Registre un nuevo tipo de lencería o insumo textil hospitalario.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Descripción de la Prenda *</Label>
              <Input
                placeholder="Ej. Sábana clínica ajustable, bata de paciente..."
                className="rounded-xl border-border/80"
                value={formDataPrenda.tipo}
                onChange={(e) => setFormDataPrenda(p => ({ ...p, tipo: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Total en Circuito</Label>
                <Input
                  type="number"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataPrenda.cantidad_total}
                  onChange={(e) => setFormDataPrenda(p => ({ ...p, cantidad_total: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Disponibles</Label>
                <Input
                  type="number"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataPrenda.cantidad_disponible}
                  onChange={(e) => setFormDataPrenda(p => ({ ...p, cantidad_disponible: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Stock Mínimo</Label>
                <Input
                  type="number"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataPrenda.stock_minimo}
                  onChange={(e) => setFormDataPrenda(p => ({ ...p, stock_minimo: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewPrenda(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={() => crearPrenda.mutate()}
              disabled={crearPrenda.isPending || !formDataPrenda.tipo}
            >
              {crearPrenda.isPending ? "Guardando..." : "Guardar en Inventario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
