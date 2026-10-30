import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/db/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  ClipboardList, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  AlertTriangle, 
  ArrowRight, 
  Activity,
  FileCheck2,
  PieChart as PieChartIcon,
  FlaskConical,
  Pill,
  ImageIcon,
  HeartPulse
} from "lucide-react";
import { toast } from "sonner";
import { useProfessionalVertical } from "@/hooks/useProfessionalVertical";
import { verificarFarmacovigilancia } from "@/lib/clinical/drug-interaction-checker";
import { AlertaInteraccionesBadge } from "@/components/clinical/AlertaInteraccionesBadge";
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

const PRIORIDAD_CONFIG: Record<string, { label: string; color: string }> = {
  stat: { label: "STAT / Inmediata", color: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/40 animate-pulse" },
  urgente: { label: "Urgente", color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40" },
  rutina: { label: "Rutina", color: "bg-muted text-muted-foreground border-border" },
};

const MODULOS_DESTINO = [
  { value: "laboratorio", label: "Laboratorio Clínico", icon: FlaskConical },
  { value: "imagenologia", label: "Imagenología / Radiología", icon: ImageIcon },
  { value: "farmacia", label: "Farmacia / Medicamentos", icon: Pill },
  { value: "enfermeria", label: "Enfermería / Procedimientos", icon: Activity },
  { value: "banco_sangre", label: "Banco de Sangre / Hemoterapia", icon: HeartPulse },
  { value: "nutricion", label: "Nutrición & Dietética", icon: ClipboardList }
];

const PALETA_GRAFICOS = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

export default function OrdenesMedicas() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const { canActHere, verticalProfesional } = useProfessionalVertical();

  const [tab, setTab] = useState<string>("ordenes");
  const [filtroEstado, setFiltroEstado] = useState<string>("todas");
  const [search, setSearch] = useState<string>("");
  const [showNewOrden, setShowNewOrden] = useState(false);

  // Formulario nueva orden CPOE
  const [formData, setFormData] = useState({
    paciente_id: "",
    tipo: "medicamento",
    prioridad: "rutina",
    modulo_destino: "farmacia",
    descripcion: "",
    justificacion_diagnostica: ""
  });

  // Queries
  const { data: pacientes = [] } = useQuery({
    queryKey: ["pacientes-lista-cpoe", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      const { data } = await db
        .from("pacientes")
        .select("id, nombre, apellido, cedula")
        .eq("workspace_id", currentWorkspace.id)
        .order("nombre");
      return data || [];
    },
    enabled: !!currentWorkspace?.id
  });

  const { data: ordenes = [], isLoading: loadingOrdenes } = useQuery({
    queryKey: ["ordenes_medicas_cpoe", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
    queryFn: async () => {
      const { data } = await db
        .from("ordenes_medicas")
        .select("*, pacientes(nombre, apellido, cedula)")
        .order("prioridad", { ascending: false })
        .order("fecha_solicitud", { ascending: false })
        .limit(150);
      return (data || []) as any[];
    }
  });

  // Mutación: Crear Orden
  const crearOrden = useMutation({
    mutationFn: async () => {
      if (!formData.paciente_id) throw new Error("Seleccione un paciente.");
      if (!formData.descripcion) throw new Error("Especifique la prescripción o indicación.");

      const { error } = await db.from("ordenes_medicas").insert({
        paciente_id: formData.paciente_id,
        tipo: formData.tipo,
        prioridad: formData.prioridad,
        modulo_destino: formData.modulo_destino,
        descripcion: formData.descripcion,
        estado: "pendiente",
        fecha_solicitud: new Date().toISOString()
      } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordenes_medicas_cpoe"] });
      toast.success("Orden médica (CPOE) emitida con éxito");
      setShowNewOrden(false);
      setFormData({
        paciente_id: "",
        tipo: "medicamento",
        prioridad: "rutina",
        modulo_destino: "farmacia",
        descripcion: "",
        justificacion_diagnostica: ""
      });
    },
    onError: (err: any) => toast.error(`Error al emitir orden: ${err.message}`)
  });

  // Mutación: Cambiar Estado
  const cambiarEstado = useMutation({
    mutationFn: async ({ id, nuevoEstado }: { id: string; nuevoEstado: string }) => {
      const updates: any = { estado: nuevoEstado };
      if (nuevoEstado === "completada") updates.fecha_completada = new Date().toISOString();
      const { error } = await db.from("ordenes_medicas").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordenes_medicas_cpoe"] });
      toast.success("Estado de la orden actualizado");
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  // KPIs
  const totalOrdenes = ordenes.length;
  const pendientes = ordenes.filter(o => o.estado === "pendiente").length;
  const statsCriticas = ordenes.filter(o => o.prioridad === "stat" && o.estado !== "completada").length;
  const enProceso = ordenes.filter(o => ["aceptada", "en_proceso"].includes(o.estado)).length;
  const completadas = ordenes.filter(o => o.estado === "completada").length;

  // Filtros
  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter(o => {
      if (filtroEstado !== "todas" && o.estado !== filtroEstado) return false;
      if (!search) return true;
      const full = `${o.pacientes?.nombre || ""} ${o.pacientes?.apellido || ""} ${o.descripcion || ""} ${o.modulo_destino || ""}`.toLowerCase();
      return full.includes(search.toLowerCase());
    });
  }, [ordenes, search, filtroEstado]);

  // Gráficos
  const datosPorDestino = useMemo(() => {
    const counts: Record<string, number> = {};
    ordenes.forEach(o => {
      const dest = o.modulo_destino || "Otros";
      counts[dest] = (counts[dest] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ 
      name: name.replace(/_/g, " "), 
      value 
    }));
  }, [ordenes]);

  const datosPorPrioridad = useMemo(() => {
    const counts: Record<string, number> = {};
    ordenes.forEach(o => {
      const prio = (o.prioridad || "rutina").toUpperCase();
      counts[prio] = (counts[prio] || 0) + 1;
    });
    return Object.entries(counts).map(([name, cantidad]) => ({ name, cantidad }));
  }, [ordenes]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      <ClinicalPageHeader
        title="Órdenes Médicas & Prescripción Clínica (CPOE)"
        subtitle="Motor centralizado de prescripción que fluye a Laboratorio, Imagenología, Farmacia, Nutrición y Hemoterapia"
        badge="CPOE / Prescripción Electrónica"
        icon={ClipboardList}
        action={
          <Button 
            className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-none text-xs md:text-sm font-medium" 
            onClick={() => setShowNewOrden(true)}
            disabled={!canActHere && !!verticalProfesional}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva Prescripción CPOE
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Órdenes Pendientes"
          value={pendientes}
          subtitle="En espera de recepción en servicio"
          icon={Clock}
          variant="amber"
          alert={pendientes > 10}
        />
        <ClinicalKpiCard
          title="Prescripciones STAT"
          value={statsCriticas}
          subtitle="Atención de emergencia inmediata"
          icon={Zap}
          variant={statsCriticas > 0 ? "rose" : "blue"}
          alert={statsCriticas > 0}
        />
        <ClinicalKpiCard
          title="En Procesamiento Activo"
          value={enProceso}
          subtitle="Muestras en lab o fármacos en preparación"
          icon={Activity}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Órdenes Completadas"
          value={completadas}
          subtitle="Resultados listos y validados"
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* Alerta de Farmacovigilancia Clínica Activa */}
      <Card className="rounded-2xl border-border/80 shadow-xs bg-muted/20">
        <CardContent className="p-4">
          <AlertaInteraccionesBadge
            resultado={verificarFarmacovigilancia(
              ["Warfarina 5mg", "Ketorolaco 30mg IV", "Enalapril 20mg"],
              ["Penicilina", "AINEs"]
            )}
          />
        </CardContent>
      </Card>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente, prescripción o módulo..."
            className="pl-9 rounded-xl border-border/80 bg-background/50 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-56">
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="rounded-xl border-border/80 h-10">
              <SelectValue placeholder="Estado de la orden" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos los estados</SelectItem>
              <SelectItem value="pendiente">Pendientes</SelectItem>
              <SelectItem value="aceptada">Aceptadas</SelectItem>
              <SelectItem value="en_proceso">En Proceso</SelectItem>
              <SelectItem value="completada">Completadas</SelectItem>
              <SelectItem value="cancelada">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pestañas */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl border border-border/60">
          <TabsTrigger value="ordenes" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <ClipboardList className="h-4 w-4 mr-1.5" />
            Censo de Prescripciones ({ordenesFiltradas.length})
          </TabsTrigger>
          <TabsTrigger value="analitica" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <PieChartIcon className="h-4 w-4 mr-1.5 text-blue-500" />
            Flujo CPOE & Tiempos
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Órdenes */}
        <TabsContent value="ordenes">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Trazabilidad de Órdenes Médicas Hospitalarias</CardTitle>
              <CardDescription>Monitoreo del ciclo de vida de indicaciones diagnósticas y terapéuticas</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Prioridad</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Prescripción / Indicación</TableHead>
                    <TableHead>Fecha Solicitud</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="pr-6 text-right">Gestión Rápida</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingOrdenes ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        Cargando órdenes médicas...
                      </TableCell>
                    </TableRow>
                  ) : ordenesFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No hay órdenes en este estado o criterio de búsqueda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ordenesFiltradas.map((o) => {
                      const prioMeta = PRIORIDAD_CONFIG[o.prioridad] || PRIORIDAD_CONFIG.rutina;
                      return (
                        <TableRow key={o.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="pl-6">
                            <Badge variant="outline" className={`rounded-lg font-bold text-xs ${prioMeta.color}`}>
                              {o.prioridad === "stat" && <Zap className="h-3 w-3 mr-1 inline" />}
                              {prioMeta.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-sm">
                            <div>
                              <span>{o.pacientes?.nombre} {o.pacientes?.apellido}</span>
                              {o.pacientes?.cedula && (
                                <p className="text-xs text-muted-foreground font-mono">{o.pacientes.cedula}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="rounded-lg capitalize text-xs">
                              {o.modulo_destino || o.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm max-w-sm truncate font-medium">
                            {o.descripcion}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {o.fecha_solicitud ? new Date(o.fecha_solicitud).toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={o.estado === "completada" ? "default" : o.estado === "pendiente" ? "secondary" : "outline"}
                              className="rounded-md capitalize text-xs"
                            >
                              {o.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {o.estado === "pendiente" && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="rounded-lg h-7 text-xs border-border/80"
                                  onClick={() => cambiarEstado.mutate({ id: o.id, nuevoEstado: "aceptada" })}
                                  disabled={cambiarEstado.isPending || (!canActHere && !!verticalProfesional)}
                                >
                                  Aceptar
                                </Button>
                              )}
                              {o.estado === "aceptada" && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="rounded-lg h-7 text-xs bg-purple-500/10 text-purple-700 border-purple-500/30"
                                  onClick={() => cambiarEstado.mutate({ id: o.id, nuevoEstado: "en_proceso" })}
                                  disabled={cambiarEstado.isPending || (!canActHere && !!verticalProfesional)}
                                >
                                  Iniciar
                                </Button>
                              )}
                              {o.estado === "en_proceso" && (
                                <Button 
                                  size="sm" 
                                  className="rounded-lg h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                  onClick={() => cambiarEstado.mutate({ id: o.id, nuevoEstado: "completada" })}
                                  disabled={cambiarEstado.isPending || (!canActHere && !!verticalProfesional)}
                                >
                                  Completar
                                </Button>
                              )}
                              {["pendiente", "aceptada"].includes(o.estado) && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="rounded-lg h-7 text-xs text-destructive hover:bg-destructive/10"
                                  onClick={() => cambiarEstado.mutate({ id: o.id, nuevoEstado: "cancelada" })}
                                  disabled={cambiarEstado.isPending || (!canActHere && !!verticalProfesional)}
                                >
                                  Cancelar
                                </Button>
                              )}
                            </div>
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

        {/* Tab 2: Analítica */}
        <TabsContent value="analitica">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Prescripciones por Módulo de Destino</CardTitle>
                <CardDescription>Carga de órdenes derivadas a servicios de apoyo clínico</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {datosPorDestino.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sin órdenes registradas para graficar.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={datosPorDestino}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={50}
                        paddingAngle={4}
                      >
                        {datosPorDestino.map((_, index) => (
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
                <CardTitle className="text-base font-semibold">Distribución por Nivel de Prioridad</CardTitle>
                <CardDescription>Volumen de órdenes STAT vs urgentes y de rutina</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {datosPorPrioridad.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sin datos de prioridad para graficar.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosPorPrioridad} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
                      />
                      <Bar dataKey="cantidad" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo Nueva Orden CPOE */}
      <Dialog open={showNewOrden} onOpenChange={setShowNewOrden}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Nueva Prescripción Médica (CPOE)
            </DialogTitle>
            <DialogDescription>
              Emita una orden clínica que fluirá automáticamente al servicio de apoyo correspondiente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select 
                value={formData.paciente_id} 
                onValueChange={(val) => setFormData(p => ({ ...p, paciente_id: val }))}
              >
                <SelectTrigger className="rounded-xl border-border/80">
                  <SelectValue placeholder="Seleccione un paciente" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {pacientes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} {p.apellido} {p.cedula ? `(${p.cedula})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Servicio de Destino *</Label>
                <Select 
                  value={formData.modulo_destino} 
                  onValueChange={(val) => setFormData(p => ({ ...p, modulo_destino: val }))}
                >
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULOS_DESTINO.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select 
                  value={formData.prioridad} 
                  onValueChange={(val) => setFormData(p => ({ ...p, prioridad: val }))}
                >
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rutina">Rutina (Turno)</SelectItem>
                    <SelectItem value="urgente">Urgente (&lt; 2h)</SelectItem>
                    <SelectItem value="stat">STAT (Inmediato)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Prescripción / Indicación Detallada *</Label>
              <Textarea
                placeholder="Ej. Hemograma completo, Electrolitos séricos, o Ceftriaxona 1g IV c/12h..."
                className="rounded-xl border-border/80 resize-none h-24"
                value={formData.descripcion}
                onChange={(e) => setFormData(p => ({ ...p, descripcion: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Justificación Diagnóstica / Sospecha Clínica</Label>
              <Input
                placeholder="Ej. Sospecha de sepsis, control postquirúrgico..."
                className="rounded-xl border-border/80"
                value={formData.justificacion_diagnostica}
                onChange={(e) => setFormData(p => ({ ...p, justificacion_diagnostica: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewOrden(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground" 
              onClick={() => crearOrden.mutate()}
              disabled={crearOrden.isPending || !formData.paciente_id || !formData.descripcion}
            >
              {crearOrden.isPending ? "Emitiendo..." : "Emitir Orden CPOE"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
