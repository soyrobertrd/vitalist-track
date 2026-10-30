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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Search, 
  Activity, 
  Cpu, 
  ShieldCheck, 
  Clock, 
  SlidersHorizontal,
  PieChart as PieChartIcon
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

const ESTADOS_EQUIPO = [
  { value: "operativo", label: "Operativo", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  { value: "en_mantenimiento", label: "En Mantenimiento", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  { value: "fuera_servicio", label: "Fuera de Servicio", color: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/40" },
  { value: "baja", label: "Dado de Baja", color: "bg-muted text-muted-foreground border-border" }
];

const ESTADOS_ORDEN = [
  { value: "solicitada", label: "Solicitada", color: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  { value: "asignada", label: "Asignada a Técnico", color: "bg-purple-500/10 text-purple-700 border-purple-500/30" },
  { value: "en_proceso", label: "En Proceso", color: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  { value: "completada", label: "Completada / Calibrada", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  { value: "cancelada", label: "Cancelada", color: "bg-muted text-muted-foreground" }
];

const PRIORIDADES = [
  { value: "baja", label: "Baja", color: "bg-muted text-muted-foreground" },
  { value: "normal", label: "Normal", color: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  { value: "alta", label: "Alta", color: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  { value: "urgente", label: "Urgente (Soporte de Vida)", color: "bg-red-500/15 text-red-700 border-red-500/40" }
];

const PALETA_GRAFICOS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6"];

export default function Mantenimiento() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("ordenes");
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");

  const [showNewOrden, setShowNewOrden] = useState(false);
  const [showNewEquipo, setShowNewEquipo] = useState(false);

  // Formularios
  const [formDataOrden, setFormDataOrden] = useState({
    equipo_id: "",
    tipo: "Preventivo Programado",
    prioridad: "normal",
    descripcion: "",
    tecnico_asignado: ""
  });

  const [formDataEquipo, setFormDataEquipo] = useState({
    nombre: "",
    marca: "",
    modelo: "",
    numero_serie: "",
    ubicacion: "Quirófano 01",
    departamento: "Cirugía",
    estado: "operativo"
  });

  // Queries
  const { data: equipos = [], isLoading: loadingEquipos } = useQuery({
    queryKey: ["equipos_hospitalarios", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("equipos_hospitalarios" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("nombre");
      return (data || []) as any[];
    }
  });

  const { data: ordenes = [], isLoading: loadingOrdenes } = useQuery({
    queryKey: ["ordenes_mantenimiento", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("ordenes_mantenimiento" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("created_at", { ascending: false })
        .limit(150);
      return (data || []) as any[];
    }
  });

  // Mutación: Crear Orden
  const crearOrden = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error("Workspace no activo");
      const num = `OT-${Date.now().toString().slice(-6)}`;
      const { error } = await supabase.from("ordenes_mantenimiento" as any).insert({
        workspace_id: currentWorkspace.id,
        numero: num,
        equipo_id: formDataOrden.equipo_id || null,
        tipo: formDataOrden.tipo,
        prioridad: formDataOrden.prioridad,
        estado: "solicitada",
        descripcion: formDataOrden.descripcion,
        tecnico_asignado: formDataOrden.tecnico_asignado || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordenes_mantenimiento"] });
      toast.success("Orden de mantenimiento generada");
      setShowNewOrden(false);
      setFormDataOrden({
        equipo_id: "",
        tipo: "Preventivo Programado",
        prioridad: "normal",
        descripcion: "",
        tecnico_asignado: ""
      });
    },
    onError: (err: any) => toast.error(`Error al crear orden: ${err.message}`)
  });

  // Mutación: Registrar Equipo
  const crearEquipo = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error("Workspace no activo");
      const { error } = await supabase.from("equipos_hospitalarios" as any).insert({
        workspace_id: currentWorkspace.id,
        nombre: formDataEquipo.nombre,
        marca: formDataEquipo.marca || null,
        modelo: formDataEquipo.modelo || null,
        numero_serie: formDataEquipo.numero_serie || null,
        ubicacion: formDataEquipo.ubicacion || null,
        departamento: formDataEquipo.departamento || null,
        estado: formDataEquipo.estado
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipos_hospitalarios"] });
      toast.success("Equipo biomédico incorporado al inventario");
      setShowNewEquipo(false);
      setFormDataEquipo({
        nombre: "",
        marca: "",
        modelo: "",
        numero_serie: "",
        ubicacion: "Quirófano 01",
        departamento: "Cirugía",
        estado: "operativo"
      });
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  // KPIs
  const totalEquipos = equipos.length;
  const fueraServicio = equipos.filter(e => e.estado === "fuera_servicio").length;
  const ordenesPendientes = ordenes.filter(o => !["completada", "cancelada"].includes(o.estado)).length;
  const completadas = ordenes.filter(o => o.estado === "completada").length;
  const disponibilidad = totalEquipos > 0 
    ? Math.round(((totalEquipos - fueraServicio) / totalEquipos) * 100) 
    : 100;

  // Filtros
  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter(o => {
      if (filterEstado !== "todos" && o.estado !== filterEstado) return false;
      if (!search) return true;
      const full = `${o.numero || ""} ${o.tipo || ""} ${o.descripcion || ""} ${o.tecnico_asignado || ""}`.toLowerCase();
      return full.includes(search.toLowerCase());
    });
  }, [ordenes, search, filterEstado]);

  const equiposFiltrados = useMemo(() => {
    return equipos.filter(e => {
      if (!search) return true;
      const full = `${e.nombre || ""} ${e.marca || ""} ${e.modelo || ""} ${e.numero_serie || ""} ${e.ubicacion || ""}`.toLowerCase();
      return full.includes(search.toLowerCase());
    });
  }, [equipos, search]);

  // Gráficos
  const datosPorTipoMantenimiento = useMemo(() => {
    const counts: Record<string, number> = {};
    ordenes.forEach(o => {
      const tipo = o.tipo || "General";
      counts[tipo] = (counts[tipo] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [ordenes]);

  const datosEquiposPorUbicacion = useMemo(() => {
    const counts: Record<string, number> = {};
    equipos.forEach(e => {
      const ubi = e.departamento || e.ubicacion || "General";
      counts[ubi] = (counts[ubi] || 0) + 1;
    });
    return Object.entries(counts).slice(0, 6).map(([name, cantidad]) => ({ name, cantidad }));
  }, [equipos]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      <ClinicalPageHeader
        title="Ingeniería Biomédica & Mantenimiento"
        subtitle="Gestión de activos clínicos, calibración metrológica y órdenes de trabajo hospitalarias"
        badge="Ingeniería Biomédica"
        icon={Wrench}
        action={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="rounded-xl border-border/80 shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setShowNewEquipo(true)}
            >
              <Cpu className="h-4 w-4 mr-1.5 text-amber-600" />
              Nuevo Equipo
            </Button>
            <Button 
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setShowNewOrden(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Crear Orden de Trabajo
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Parque de Equipos Biomédicos"
          value={totalEquipos}
          subtitle="Activos inventariados en servicio"
          icon={Cpu}
          variant="amber"
        />
        <ClinicalKpiCard
          title="Equipos Fuera de Servicio"
          value={fueraServicio}
          subtitle="Inoperativos o en avería crítica"
          icon={AlertTriangle}
          variant={fueraServicio > 0 ? "rose" : "emerald"}
          alert={fueraServicio > 0}
        />
        <ClinicalKpiCard
          title="Órdenes de Trabajo Activas"
          value={ordenesPendientes}
          subtitle="Mantenimientos preventivos / correctivos"
          icon={Clock}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Disponibilidad Operativa"
          value={`${disponibilidad}%`}
          subtitle="Ratio de tecnología activa apta"
          icon={CheckCircle2}
          variant={disponibilidad >= 95 ? "emerald" : "amber"}
        />
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código OT, equipo, serie o técnico..."
            className="pl-9 rounded-xl border-border/80 bg-background/50 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-56">
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="rounded-xl border-border/80 h-10">
              <SelectValue placeholder="Estado de la orden" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="solicitada">Solicitada</SelectItem>
              <SelectItem value="en_proceso">En Proceso</SelectItem>
              <SelectItem value="completada">Completada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pestañas */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl border border-border/60">
          <TabsTrigger value="ordenes" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Wrench className="h-4 w-4 mr-1.5 text-amber-600" />
            Órdenes de Trabajo ({ordenesFiltradas.length})
          </TabsTrigger>
          <TabsTrigger value="equipos" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Cpu className="h-4 w-4 mr-1.5 text-blue-600" />
            Inventario Biomédico ({equiposFiltrados.length})
          </TabsTrigger>
          <TabsTrigger value="metricas" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <PieChartIcon className="h-4 w-4 mr-1.5 text-purple-500" />
            Analítica de Mantenimiento
          </TabsTrigger>
          <TabsTrigger value="estandares" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <ShieldCheck className="h-4 w-4 mr-1.5 text-emerald-600" />
            Protocolos de Seguridad Eléctrica
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Órdenes de Trabajo */}
        <TabsContent value="ordenes">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Censo de Órdenes de Servicio Técnico</CardTitle>
              <CardDescription>Seguimiento de intervenciones electromédicas preventivas y correctivas</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Código OT</TableHead>
                    <TableHead>Modalidad / Tipo</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Técnico Asignado</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="pr-6">Descripción de la Avería</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingOrdenes ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Cargando órdenes de trabajo...
                      </TableCell>
                    </TableRow>
                  ) : ordenesFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No hay órdenes de servicio técnico registradas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ordenesFiltradas.map((o) => {
                      const estMeta = ESTADOS_ORDEN.find(e => e.value === o.estado);
                      const prioMeta = PRIORIDADES.find(p => p.value === o.prioridad);
                      return (
                        <TableRow key={o.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="pl-6 font-mono font-bold text-xs text-amber-700 dark:text-amber-400">
                            {o.numero}
                          </TableCell>
                          <TableCell className="font-semibold text-sm">{o.tipo}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`rounded-lg capitalize text-xs ${prioMeta?.color || ""}`}>
                              {o.prioridad}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {o.tecnico_asignado || "Pendiente de asignación"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`rounded-lg capitalize text-xs ${estMeta?.color || ""}`}>
                              {estMeta?.label || o.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-6 max-w-sm truncate text-xs text-muted-foreground">
                            {o.descripcion || "Sin observaciones"}
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

        {/* Tab 2: Equipos */}
        <TabsContent value="equipos">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Parque de Tecnología Hospitalaria</CardTitle>
              <CardDescription>Activos biomédicos, número de serie, marca y estado operativo</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Equipo Biomédico</TableHead>
                    <TableHead>Marca / Modelo</TableHead>
                    <TableHead>Número de Serie</TableHead>
                    <TableHead>Ubicación / Servicio</TableHead>
                    <TableHead className="pr-6">Estado Operativo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingEquipos ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        Cargando inventario de equipos...
                      </TableCell>
                    </TableRow>
                  ) : equiposFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        No hay equipos hospitalarios que coincidan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    equiposFiltrados.map((e) => {
                      const estMeta = ESTADOS_EQUIPO.find(est => est.value === e.estado);
                      return (
                        <TableRow key={e.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="pl-6 font-semibold flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-amber-600" />
                            {e.nombre}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {e.marca || "Genérica"} {e.modelo ? `· Mod: ${e.modelo}` : ""}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{e.numero_serie || "S/N no reg."}</TableCell>
                          <TableCell className="text-xs">
                            <span className="font-medium text-foreground">{e.ubicacion}</span>
                            {e.departamento && <span className="text-muted-foreground"> ({e.departamento})</span>}
                          </TableCell>
                          <TableCell className="pr-6">
                            <Badge variant="outline" className={`rounded-lg capitalize text-xs ${estMeta?.color || ""}`}>
                              {estMeta?.label || e.estado}
                            </Badge>
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

        {/* Tab 3: Métricas */}
        <TabsContent value="metricas">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Distribución de Mantenimientos por Tipo</CardTitle>
                <CardDescription>Preventivo programado vs averías correctivas</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {datosPorTipoMantenimiento.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sin órdenes suficientes para graficar.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={datosPorTipoMantenimiento}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={50}
                        paddingAngle={4}
                      >
                        {datosPorTipoMantenimiento.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PALETA_GRAFICOS[index % PALETA_GRAFICOS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Densidad de Equipos por Departamento</CardTitle>
                <CardDescription>Concentración de equipamiento crítico en áreas clínicas</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {datosEquiposPorUbicacion.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sin datos de departamentos para graficar.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosEquiposPorUbicacion} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
                      />
                      <Bar dataKey="cantidad" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Estándares */}
        <TabsContent value="estandares">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl border-border/80 shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
                <ShieldCheck className="h-5 w-5" />
                Seguridad Eléctrica (IEC 62353 / NFPA 99)
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Verificación periódica de resistencia de tierra (&lt; 0.2 Ω) y corriente de fuga a chasis (&lt; 100 µA en pacientes con conexión cardíaca directa).
              </p>
            </Card>

            <Card className="rounded-2xl border-border/80 shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2 text-blue-600 font-bold">
                <SlidersHorizontal className="h-5 w-5" />
                Calibración de Desfibriladores & Ventilación
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Prueba de descarga de energía real en Joules sobre simulador de carga (50 Ω) y verificación de volumen corriente / PEEP en respiradores.
              </p>
            </Card>

            <Card className="rounded-2xl border-border/80 shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                <Activity className="h-5 w-5" />
                Hoja de Vida de Equipos Biomédicos
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Registro inviolable de trazabilidad de intervenciones, cambio de repuestos originales, manuales de servicio técnico y certificaciones de calibración.
              </p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo Nueva Orden */}
      <Dialog open={showNewOrden} onOpenChange={setShowNewOrden}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-amber-600" />
              Nueva Orden de Mantenimiento
            </DialogTitle>
            <DialogDescription>
              Emita una orden de servicio preventivo, correctivo o calibración metrológica.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Equipo Biomédico *</Label>
              <Select 
                value={formDataOrden.equipo_id} 
                onValueChange={(val) => setFormDataOrden(p => ({ ...p, equipo_id: val }))}
              >
                <SelectTrigger className="rounded-xl border-border/80">
                  <SelectValue placeholder="Seleccione el equipo averiado o a calibrar" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {equipos.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nombre} ({e.ubicacion || "Sin ubicación"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo de Servicio</Label>
                <Select 
                  value={formDataOrden.tipo} 
                  onValueChange={(val) => setFormDataOrden(p => ({ ...p, tipo: val }))}
                >
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Preventivo Programado">Preventivo Programado</SelectItem>
                    <SelectItem value="Correctivo Urgente">Correctivo Urgente</SelectItem>
                    <SelectItem value="Calibración Metrológica">Calibración Metrológica</SelectItem>
                    <SelectItem value="Inspección de Seguridad Eléctrica">Inspección Eléctrica</SelectItem>
                  </SelectContent>
                </Select>
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
                    {PRIORIDADES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Técnico Biomédico Asignado</Label>
              <Input
                placeholder="Nombre del ingeniero o empresa externa..."
                className="rounded-xl border-border/80"
                value={formDataOrden.tecnico_asignado}
                onChange={(e) => setFormDataOrden(p => ({ ...p, tecnico_asignado: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción de la Falla / Protocolo Solicitado *</Label>
              <Textarea
                placeholder="Describa el comportamiento del equipo, códigos de error en pantalla..."
                className="rounded-xl border-border/80 resize-none h-24"
                value={formDataOrden.descripcion}
                onChange={(e) => setFormDataOrden(p => ({ ...p, descripcion: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewOrden(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white" 
              onClick={() => crearOrden.mutate()}
              disabled={crearOrden.isPending || !formDataOrden.descripcion}
            >
              {crearOrden.isPending ? "Generando..." : "Generar Orden"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Nuevo Equipo */}
      <Dialog open={showNewEquipo} onOpenChange={setShowNewEquipo}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-amber-600" />
              Nuevo Equipo Biomédico
            </DialogTitle>
            <DialogDescription>
              Incorpore un activo de tecnología médica al inventario hospitalario.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre del Equipo *</Label>
              <Input
                placeholder="Ej. Monitor Multiparámetro, Ventilador Mecánico..."
                className="rounded-xl border-border/80"
                value={formDataEquipo.nombre}
                onChange={(e) => setFormDataEquipo(p => ({ ...p, nombre: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input
                  placeholder="Ej. Philips, Mindray, Dräger"
                  className="rounded-xl border-border/80"
                  value={formDataEquipo.marca}
                  onChange={(e) => setFormDataEquipo(p => ({ ...p, marca: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input
                  placeholder="Ej. IntelliVue MX40"
                  className="rounded-xl border-border/80"
                  value={formDataEquipo.modelo}
                  onChange={(e) => setFormDataEquipo(p => ({ ...p, modelo: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Número de Serie (S/N)</Label>
                <Input
                  placeholder="Ej. SN-89472891"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataEquipo.numero_serie}
                  onChange={(e) => setFormDataEquipo(p => ({ ...p, numero_serie: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Ubicación / Sala</Label>
                <Input
                  placeholder="Ej. Quirófano 02, UCI Cama 4"
                  className="rounded-xl border-border/80"
                  value={formDataEquipo.ubicacion}
                  onChange={(e) => setFormDataEquipo(p => ({ ...p, ubicacion: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewEquipo(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white" 
              onClick={() => crearEquipo.mutate()}
              disabled={crearEquipo.isPending || !formDataEquipo.nombre}
            >
              {crearEquipo.isPending ? "Guardando..." : "Guardar Equipo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
