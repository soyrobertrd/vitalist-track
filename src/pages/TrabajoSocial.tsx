import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/db/client";
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
  Heart, 
  ArrowRightLeft, 
  Plus, 
  Search, 
  AlertCircle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Building2, 
  UserCheck, 
  PieChart as PieChartIcon,
  LifeBuoy
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

const ESTADOS_CASO = [
  { value: "abierto", label: "Abierto", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  { value: "en_seguimiento", label: "En Seguimiento", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  { value: "referido", label: "Referido Extermino", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30" },
  { value: "cerrado", label: "Cerrado / Resuelto", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  { value: "archivado", label: "Archivado", color: "bg-muted text-muted-foreground border-border" }
];

const PRIORIDADES = [
  { value: "baja", label: "Baja", color: "bg-muted text-muted-foreground" },
  { value: "media", label: "Media", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  { value: "alta", label: "Alta", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  { value: "urgente", label: "Urgente / Crítica", color: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40" }
];

const TIPOS_PROBLEMA = [
  "apoyo_economico",
  "medicacion_alto_costo",
  "violencia_intrafamiliar",
  "abandono_adulto_mayor",
  "menor_en_riesgo",
  "vivienda_insalubre",
  "discapacidad_sin_red",
  "subsidio_estatal"
];

const PALETA_GRAFICOS = ["#f43f5e", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#06b6d4"];

export default function TrabajoSocial() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("casos");
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");

  const [showNewCaso, setShowNewCaso] = useState(false);
  const [showNewRef, setShowNewRef] = useState(false);

  // Formularios
  const [formDataCaso, setFormDataCaso] = useState({
    tipo_caso: "apoyo_economico",
    prioridad: "media",
    nivel_socioeconomico: "Vulnerable",
    descripcion: "",
    plan_intervencion: ""
  });

  const [formDataRef, setFormDataRef] = useState({
    institucion_destino: "",
    motivo: "",
    caso_id: ""
  });

  // Queries
  const { data: casos = [], isLoading: loadingCasos } = useQuery({
    queryKey: ["casos_trabajo_social", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
    queryFn: async () => {
      const { data } = await db
        .from("casos_trabajo_social" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("created_at", { ascending: false })
        .limit(150);
      return (data || []) as any[];
    }
  });

  const { data: referimientos = [], isLoading: loadingRefs } = useQuery({
    queryKey: ["referimientos_sociales", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
    queryFn: async () => {
      const { data } = await db
        .from("referimientos_sociales" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("created_at", { ascending: false })
        .limit(150);
      return (data || []) as any[];
    }
  });

  // Mutación: Crear Caso
  const crearCaso = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error("Workspace no activo");
      const numCaso = `TS-${Date.now().toString().slice(-6)}`;
      const { error } = await db.from("casos_trabajo_social" as any).insert({
        workspace_id: currentWorkspace.id,
        numero: numCaso,
        tipo_caso: formDataCaso.tipo_caso,
        prioridad: formDataCaso.prioridad,
        estado: "abierto",
        nivel_socioeconomico: formDataCaso.nivel_socioeconomico,
        descripcion: formDataCaso.descripcion,
        plan_intervencion: formDataCaso.plan_intervencion || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["casos_trabajo_social"] });
      toast.success("Caso social registrado exitosamente");
      setShowNewCaso(false);
      setFormDataCaso({
        tipo_caso: "apoyo_economico",
        prioridad: "media",
        nivel_socioeconomico: "Vulnerable",
        descripcion: "",
        plan_intervencion: ""
      });
    },
    onError: (err: any) => toast.error(`Error al crear caso: ${err.message}`)
  });

  // Mutación: Crear Referimiento
  const crearReferimiento = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error("Workspace no activo");
      const { error } = await db.from("referimientos_sociales" as any).insert({
        workspace_id: currentWorkspace.id,
        caso_id: formDataRef.caso_id || null,
        institucion_destino: formDataRef.institucion_destino,
        motivo: formDataRef.motivo,
        estado: "pendiente"
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referimientos_sociales"] });
      toast.success("Referimiento institucional registrado");
      setShowNewRef(false);
      setFormDataRef({ institucion_destino: "", motivo: "", caso_id: "" });
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  // KPIs
  const totalCasos = casos.length;
  const activos = casos.filter(c => !["cerrado", "archivado"].includes(c.estado)).length;
  const urgentes = casos.filter(c => c.prioridad === "urgente" && c.estado !== "cerrado").length;
  const pendientesRef = referimientos.filter(r => r.estado === "pendiente").length;
  const cerrados = casos.filter(c => c.estado === "cerrado").length;
  const tasaResolucion = totalCasos > 0 ? Math.round((cerrados / totalCasos) * 100) : 0;

  // Filtros
  const casosFiltrados = useMemo(() => {
    return casos.filter(c => {
      if (filterEstado !== "todos" && c.estado !== filterEstado) return false;
      if (!search) return true;
      const full = `${c.numero || ""} ${c.tipo_caso || ""} ${c.descripcion || ""} ${c.nivel_socioeconomico || ""}`.toLowerCase();
      return full.includes(search.toLowerCase());
    });
  }, [casos, search, filterEstado]);

  // Datos para Gráficos
  const datosPorTipo = useMemo(() => {
    const counts: Record<string, number> = {};
    casos.forEach(c => {
      const tipo = (c.tipo_caso || "otro").replace(/_/g, " ");
      counts[tipo] = (counts[tipo] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [casos]);

  const datosSocioeconomicos = useMemo(() => {
    const counts: Record<string, number> = {};
    casos.forEach(c => {
      const estrato = c.nivel_socioeconomico || "No definido";
      counts[estrato] = (counts[estrato] || 0) + 1;
    });
    return Object.entries(counts).map(([name, cantidad]) => ({ name, cantidad }));
  }, [casos]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      <ClinicalPageHeader
        title="Trabajo Social & Asistencia Comunitaria"
        subtitle="Evaluación sociosanitaria, estratificación de vulnerabilidad y gestión de referimientos institucionales"
        badge="Soporte Sociosanitario"
        icon={Heart}
        action={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="rounded-xl border-border/80 shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setShowNewRef(true)}
            >
              <ArrowRightLeft className="h-4 w-4 mr-1.5 text-rose-600" />
              Nuevo Referimiento
            </Button>
            <Button 
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setShowNewCaso(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Nuevo Caso Social
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Casos Sociales Activos"
          value={activos}
          subtitle={`De ${totalCasos} expedientes registrados`}
          icon={LifeBuoy}
          variant="rose"
        />
        <ClinicalKpiCard
          title="Vulnerabilidad Crítica"
          value={urgentes}
          subtitle="Casos calificados de prioridad urgente"
          icon={ShieldAlert}
          variant={urgentes > 0 ? "rose" : "emerald"}
          alert={urgentes > 0}
        />
        <ClinicalKpiCard
          title="Referimientos Pendientes"
          value={pendientesRef}
          subtitle="Derivaciones comunitarias en trámite"
          icon={ArrowRightLeft}
          variant="amber"
        />
        <ClinicalKpiCard
          title="Tasa de Resolución"
          value={`${tasaResolucion}%`}
          subtitle={`${cerrados} casos concluidos con éxito`}
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, tipo de caso o descripción..."
            className="pl-9 rounded-xl border-border/80 bg-background/50 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-56">
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="rounded-xl border-border/80 h-10">
              <SelectValue placeholder="Estado del caso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="abierto">Abiertos</SelectItem>
              <SelectItem value="en_seguimiento">En Seguimiento</SelectItem>
              <SelectItem value="referido">Referidos</SelectItem>
              <SelectItem value="cerrado">Cerrados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pestañas */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl border border-border/60">
          <TabsTrigger value="casos" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Heart className="h-4 w-4 mr-1.5 text-rose-500" />
            Casos Sociales ({casosFiltrados.length})
          </TabsTrigger>
          <TabsTrigger value="referimientos" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <ArrowRightLeft className="h-4 w-4 mr-1.5 text-purple-500" />
            Red de Referimientos ({referimientos.length})
          </TabsTrigger>
          <TabsTrigger value="analitica" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <PieChartIcon className="h-4 w-4 mr-1.5 text-blue-500" />
            Analítica Sociodemográfica
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Casos */}
        <TabsContent value="casos">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Censo de Casos de Trabajo Social</CardTitle>
              <CardDescription>Seguimiento individualizado a usuarios y familias en situación de vulnerabilidad</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Código</TableHead>
                    <TableHead>Problemática / Tipo</TableHead>
                    <TableHead>Nivel Socioeconómico</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="pr-6">Descripción & Plan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingCasos ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Cargando casos sociales...
                      </TableCell>
                    </TableRow>
                  ) : casosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No se encontraron casos que coincidan con la búsqueda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    casosFiltrados.map((c) => {
                      const estMeta = ESTADOS_CASO.find(e => e.value === c.estado);
                      const prioMeta = PRIORIDADES.find(p => p.value === c.prioridad);
                      return (
                        <TableRow key={c.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="pl-6 font-mono font-bold text-xs text-rose-700 dark:text-rose-400">
                            {c.numero}
                          </TableCell>
                          <TableCell className="font-medium capitalize">
                            {(c.tipo_caso || "General").replace(/_/g, " ")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="rounded-lg text-xs font-medium">
                              {c.nivel_socioeconomico || "No asignado"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`rounded-lg capitalize text-xs ${prioMeta?.color || ""}`}>
                              {c.prioridad}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`rounded-lg capitalize text-xs ${estMeta?.color || ""}`}>
                              {estMeta?.label || c.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-6 max-w-sm truncate text-xs text-muted-foreground">
                            {c.descripcion || "Sin notas"}
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

        {/* Tab 2: Referimientos */}
        <TabsContent value="referimientos">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Red de Referimientos Comunitarios e Institucionales</CardTitle>
              <CardDescription>Articulación con programas de subsidios, albergues y centros de tercer nivel</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Institución Destino</TableHead>
                    <TableHead>Motivo del Referimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="pr-6">Resultado / Seguimiento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingRefs ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        Cargando referimientos...
                      </TableCell>
                    </TableRow>
                  ) : referimientos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        No hay referimientos registrados actualmente.
                      </TableCell>
                    </TableRow>
                  ) : (
                    referimientos.map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="pl-6 font-semibold flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-purple-600" />
                          {r.institucion_destino}
                        </TableCell>
                        <TableCell className="text-sm max-w-md truncate">{r.motivo}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`rounded-lg capitalize text-xs ${
                              r.estado === "aceptado" 
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                                : r.estado === "pendiente"
                                ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {r.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-6 text-xs text-muted-foreground">
                          {r.resultado || "Respuesta pendiente de la institución"}
                        </TableCell>
                      </TableRow>
                    ))
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
                <CardTitle className="text-base font-semibold">Tipología de Problemáticas Sociales</CardTitle>
                <CardDescription>Causas de intervención sociosanitaria más frecuentes</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {datosPorTipo.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sin datos suficientes para graficar.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={datosPorTipo}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={50}
                        paddingAngle={4}
                      >
                        {datosPorTipo.map((_, index) => (
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
                <CardTitle className="text-base font-semibold">Estratificación Socioeconómica</CardTitle>
                <CardDescription>Distribución de casos por estrato de vulnerabilidad económica</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {datosSocioeconomicos.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sin datos socioeconómicos registrados para graficar.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosSocioeconomicos} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
                      />
                      <Bar dataKey="cantidad" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo Nuevo Caso */}
      <Dialog open={showNewCaso} onOpenChange={setShowNewCaso}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-600" />
              Nuevo Caso de Trabajo Social
            </DialogTitle>
            <DialogDescription>
              Aperture un expediente social para seguimiento y evaluación integral.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tipo de Problemática / Motivo de Intervención *</Label>
              <Select 
                value={formDataCaso.tipo_caso} 
                onValueChange={(val) => setFormDataCaso(p => ({ ...p, tipo_caso: val }))}
              >
                <SelectTrigger className="rounded-xl border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PROBLEMA.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Prioridad *</Label>
                <Select 
                  value={formDataCaso.prioridad} 
                  onValueChange={(val) => setFormDataCaso(p => ({ ...p, prioridad: val }))}
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
              <div className="space-y-2">
                <Label>Nivel Socioeconómico</Label>
                <Select 
                  value={formDataCaso.nivel_socioeconomico} 
                  onValueChange={(val) => setFormDataCaso(p => ({ ...p, nivel_socioeconomico: val }))}
                >
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pobreza Extrema">Pobreza Extrema</SelectItem>
                    <SelectItem value="Vulnerable">Vulnerable</SelectItem>
                    <SelectItem value="Medio-Bajo">Medio-Bajo</SelectItem>
                    <SelectItem value="Medio">Medio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción del Caso y Hallazgos Sociofamiliares *</Label>
              <Textarea
                placeholder="Detalle de la situación económica, red de apoyo familiar, vivienda..."
                className="rounded-xl border-border/80 resize-none h-24"
                value={formDataCaso.descripcion}
                onChange={(e) => setFormDataCaso(p => ({ ...p, descripcion: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Plan de Intervención / Acciones Inmediatas</Label>
              <Input
                placeholder="Ej. Gestionar medicamentos ante Promese/Cal, visita domiciliaria..."
                className="rounded-xl border-border/80"
                value={formDataCaso.plan_intervencion}
                onChange={(e) => setFormDataCaso(p => ({ ...p, plan_intervencion: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewCaso(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white" 
              onClick={() => crearCaso.mutate()}
              disabled={crearCaso.isPending || !formDataCaso.descripcion}
            >
              {crearCaso.isPending ? "Guardando..." : "Guardar Caso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Nuevo Referimiento */}
      <Dialog open={showNewRef} onOpenChange={setShowNewRef}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-purple-600" />
              Nuevo Referimiento Institucional
            </DialogTitle>
            <DialogDescription>
              Derive el caso hacia instituciones gubernamentales o centros aliados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Institución de Destino *</Label>
              <Input
                placeholder="Ej. CONANI, CAID, Promese/Cal, Hospital Robert Reid Cabral..."
                className="rounded-xl border-border/80"
                value={formDataRef.institucion_destino}
                onChange={(e) => setFormDataRef(p => ({ ...p, institucion_destino: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Motivo de la Derivación *</Label>
              <Textarea
                placeholder="Explique el motivo, requisitos solicitados y objetivos del referimiento..."
                className="rounded-xl border-border/80 resize-none h-24"
                value={formDataRef.motivo}
                onChange={(e) => setFormDataRef(p => ({ ...p, motivo: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewRef(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white" 
              onClick={() => crearReferimiento.mutate()}
              disabled={crearReferimiento.isPending || !formDataRef.institucion_destino || !formDataRef.motivo}
            >
              {crearReferimiento.isPending ? "Derivando..." : "Registrar Derivación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
