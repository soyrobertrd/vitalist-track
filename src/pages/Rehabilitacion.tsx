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
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Dumbbell, 
  TrendingUp, 
  Activity, 
  Plus, 
  Search, 
  HeartHandshake, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Smile,
  Frown,
  Meh
} from "lucide-react";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";

const TIPOS_REHAB = [
  { value: "fisioterapia", label: "Fisioterapia Motora / Osteomuscular" },
  { value: "ocupacional", label: "Terapia Ocupacional & Funcional" },
  { value: "respiratoria", label: "Rehabilitación Pulmonar / Respiratoria" },
  { value: "neurologica", label: "Rehabilitación Neurológica (ACV / Trauma)" },
  { value: "cardiaca", label: "Rehabilitación Cardíaca Post-Infarto" },
  { value: "deportiva", label: "Kinesiología & Lesiones Deportivas" }
];

export default function Rehabilitacion() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("planes");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [searchPac, setSearchPac] = useState("");

  const [showNewPlan, setShowNewPlan] = useState(false);
  const [showNewSesion, setShowNewSesion] = useState(false);

  // Formulario Plan
  const [formDataPlan, setFormDataPlan] = useState({
    paciente_id: "",
    tipo: "fisioterapia",
    duracion_semanas: "6",
    sesiones_por_semana: "3",
    objetivos: "",
    diagnostico_terapeutico: ""
  });

  // Formulario Sesión
  const [formDataSesion, setFormDataSesion] = useState({
    fecha: new Date().toISOString().split("T")[0],
    duracion_minutos: "45",
    dolor_antes: "6",
    dolor_despues: "3",
    progreso_pct: "10",
    asistio: true,
    notas_evolucion: ""
  });

  // Pacientes
  const { data: pacientes = [] } = useQuery({
    queryKey: ["pacientes-lista-rehab", currentWorkspace?.id],
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

  // Planes
  const { data: planes = [], isLoading: loadingPlanes } = useQuery({
    queryKey: ["planes-rehab", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      const { data } = await db
        .from("planes_rehabilitacion")
        .select("*, pacientes(nombre, apellido, cedula)")
        .eq("workspace_id", currentWorkspace.id)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!currentWorkspace?.id
  });

  // Sesiones del plan seleccionado
  const { data: sesiones = [], isLoading: loadingSesiones } = useQuery({
    queryKey: ["sesiones-rehab", selectedPlanId],
    queryFn: async () => {
      if (!selectedPlanId) return [];
      const { data } = await db
        .from("sesiones_rehabilitacion")
        .select("*")
        .eq("plan_id", selectedPlanId)
        .order("numero_sesion", { ascending: true });
      return (data || []) as any[];
    },
    enabled: !!selectedPlanId
  });

  // Plan activo seleccionado
  const planActual = useMemo(() => {
    return planes.find(p => p.id === selectedPlanId);
  }, [planes, selectedPlanId]);

  // Mutación: Crear Plan
  const crearPlan = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id || !formDataPlan.paciente_id) {
        throw new Error("Seleccione un paciente.");
      }
      const numPlan = `RH-${Date.now().toString().slice(-6)}`;
      const { error } = await db.from("planes_rehabilitacion").insert({
        workspace_id: currentWorkspace.id,
        numero: numPlan,
        paciente_id: formDataPlan.paciente_id,
        tipo: formDataPlan.tipo,
        duracion_semanas: parseInt(formDataPlan.duracion_semanas) || 4,
        sesiones_por_semana: parseInt(formDataPlan.sesiones_por_semana) || 3,
        estado: "activo",
        fecha_inicio: new Date().toISOString().split("T")[0],
        objetivos: formDataPlan.objetivos || null,
        diagnostico: formDataPlan.diagnostico_terapeutico || null
      } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planes-rehab"] });
      toast.success("Plan de rehabilitación creado con éxito");
      setShowNewPlan(false);
      setFormDataPlan({ paciente_id: "", tipo: "fisioterapia", duracion_semanas: "6", sesiones_por_semana: "3", objetivos: "", diagnostico_terapeutico: "" });
    },
    onError: (err: any) => toast.error(`Error al crear plan: ${err.message}`)
  });

  // Mutación: Registrar Sesión
  const crearSesion = useMutation({
    mutationFn: async () => {
      if (!selectedPlanId) throw new Error("Seleccione un plan de rehabilitación.");
      const nextNum = sesiones.length + 1;
      const { error } = await db.from("sesiones_rehabilitacion").insert({
        plan_id: selectedPlanId,
        numero_sesion: nextNum,
        fecha: formDataSesion.fecha,
        duracion_minutos: parseInt(formDataSesion.duracion_minutos) || 45,
        dolor_antes: parseInt(formDataSesion.dolor_antes),
        dolor_despues: parseInt(formDataSesion.dolor_despues),
        progreso_pct: parseInt(formDataSesion.progreso_pct) || 0,
        asistio: formDataSesion.asistio,
        notas: formDataSesion.notas_evolucion || null
      } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sesiones-rehab", selectedPlanId] });
      toast.success("Sesión clínica registrada correctamente");
      setShowNewSesion(false);
      setFormDataSesion({
        fecha: new Date().toISOString().split("T")[0],
        duracion_minutos: "45",
        dolor_antes: "5",
        dolor_despues: "2",
        progreso_pct: "20",
        asistio: true,
        notas_evolucion: ""
      });
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  // KPIs
  const totalPlanes = planes.length;
  const planesActivos = planes.filter(p => p.estado === "activo").length;
  const planesCompletados = planes.filter(p => p.estado === "completado").length;
  
  // Tasa de asistencia de las sesiones actuales
  const totalSes = sesiones.length;
  const asistidas = sesiones.filter(s => s.asistio).length;
  const tasaAsistencia = totalSes > 0 ? Math.round((asistidas / totalSes) * 100) : 100;

  // Alivio de dolor promedio en las sesiones actuales
  const alivioDolorMedio = useMemo(() => {
    const validas = sesiones.filter(s => s.dolor_antes != null && s.dolor_despues != null);
    if (validas.length === 0) return 0;
    const diff = validas.reduce((acc, s) => acc + (s.dolor_antes - s.dolor_despues), 0);
    return +(diff / validas.length).toFixed(1);
  }, [sesiones]);

  // Filtro planes
  const planesFiltrados = useMemo(() => {
    return planes.filter(p => {
      if (!searchPac) return true;
      const full = `${p.numero || ""} ${p.pacientes?.nombre || ""} ${p.pacientes?.apellido || ""}`.toLowerCase();
      return full.includes(searchPac.toLowerCase());
    });
  }, [planes, searchPac]);

  // Datos para gráfico evolución del dolor
  const datosGraficoDolor = useMemo(() => {
    return sesiones.map(s => ({
      sesion: `S-${s.numero_sesion}`,
      dolorAntes: s.dolor_antes ?? 0,
      dolorDespues: s.dolor_despues ?? 0,
      progreso: s.progreso_pct ?? 0
    }));
  }, [sesiones]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      <ClinicalPageHeader
        title="Medicina Física & Rehabilitación"
        subtitle="Prescripción de planes de fisioterapia, kinesiología y monitoreo evolutivo de escalas de dolor"
        badge="Rehabilitación & Fisiatría"
        icon={Dumbbell}
        action={
          <div className="flex gap-2">
            {selectedPlanId && (
              <Button 
                variant="outline" 
                className="rounded-xl border-border/80 shadow-none text-xs md:text-sm font-medium" 
                onClick={() => setShowNewSesion(true)}
              >
                <Plus className="h-4 w-4 mr-1.5 text-purple-600" />
                Registrar Sesión
              </Button>
            )}
            <Button 
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setShowNewPlan(true)}
            >
              <HeartHandshake className="h-4 w-4 mr-1.5" />
              Nuevo Plan Terapéutico
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Planes Terapéuticos Activos"
          value={planesActivos}
          subtitle={`De un total histórico de ${totalPlanes}`}
          icon={Dumbbell}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Tratamientos Completados"
          value={planesCompletados}
          subtitle="Pacientes con alta de rehabilitación"
          icon={TrendingUp}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="Adherencia / Asistencia"
          value={selectedPlanId ? `${tasaAsistencia}%` : "—"}
          subtitle={selectedPlanId ? `${asistidas} de ${totalSes} sesiones asistidas` : "Seleccione un plan activo"}
          icon={Activity}
          variant={tasaAsistencia < 80 ? "amber" : "teal"}
        />
        <ClinicalKpiCard
          title="Alivio Medio de Dolor (EVA)"
          value={selectedPlanId && alivioDolorMedio > 0 ? `-${alivioDolorMedio} pts` : "—"}
          subtitle="Reducción promedio pre vs post sesión"
          icon={Sparkles}
          variant="blue"
        />
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código de plan o nombre de paciente..."
            className="pl-9 rounded-xl border-border/80 bg-background/50 h-10"
            value={searchPac}
            onChange={(e) => setSearchPac(e.target.value)}
          />
        </div>
      </div>

      {/* Pestañas */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl border border-border/60">
          <TabsTrigger value="planes" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Dumbbell className="h-4 w-4 mr-1.5" />
            Planes de Tratamiento ({planesFiltrados.length})
          </TabsTrigger>
          <TabsTrigger value="sesiones" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Calendar className="h-4 w-4 mr-1.5" />
            Sesiones de Evolución {planActual ? `(${planActual.numero})` : ""}
          </TabsTrigger>
          <TabsTrigger value="graficos" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <TrendingUp className="h-4 w-4 mr-1.5 text-purple-600" />
            Curva de Dolor EVA & Progreso
          </TabsTrigger>
          <TabsTrigger value="escala_eva" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Activity className="h-4 w-4 mr-1.5 text-blue-500" />
            Escala EVA & Protocolos
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Planes */}
        <TabsContent value="planes">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Censo de Planes de Rehabilitación</CardTitle>
              <CardDescription>Haga clic en una fila para inspeccionar las sesiones y el registro del paciente</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Código</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Especialidad</TableHead>
                    <TableHead>Frecuencia / Duración</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead className="pr-6 text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPlanes ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        Cargando planes terapéuticos...
                      </TableCell>
                    </TableRow>
                  ) : planesFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No se encontraron planes de rehabilitación.
                      </TableCell>
                    </TableRow>
                  ) : (
                    planesFiltrados.map((p) => {
                      const isSelected = p.id === selectedPlanId;
                      const tipoLabel = TIPOS_REHAB.find(t => t.value === p.tipo)?.label || p.tipo;
                      return (
                        <TableRow 
                          key={p.id} 
                          className={`hover:bg-muted/40 transition-colors cursor-pointer ${isSelected ? "bg-purple-500/10 dark:bg-purple-950/20" : ""}`}
                          onClick={() => {
                            setSelectedPlanId(p.id);
                            setTab("sesiones");
                          }}
                        >
                          <TableCell className="pl-6 font-mono font-bold text-xs text-purple-700 dark:text-purple-400">
                            {p.numero}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>
                              <span>{p.pacientes?.nombre} {p.pacientes?.apellido}</span>
                              {p.pacientes?.cedula && (
                                <p className="text-xs text-muted-foreground font-mono">{p.pacientes.cedula}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30">
                              {tipoLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {p.duracion_semanas} semanas · {p.sesiones_por_semana}x/sem
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={p.estado === "activo" ? "default" : p.estado === "completado" ? "secondary" : "destructive"}
                              className="rounded-md capitalize text-xs"
                            >
                              {p.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {p.fecha_inicio ? new Date(p.fecha_inicio + "T12:00:00").toLocaleDateString("es-DO") : "—"}
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <Button size="sm" variant="ghost" className="rounded-xl h-8 px-2 text-xs text-purple-600">
                              Ver Sesiones <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
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

        {/* Tab 2: Sesiones */}
        <TabsContent value="sesiones">
          {!selectedPlanId ? (
            <Card className="rounded-2xl border-border/80 shadow-xs p-10 text-center space-y-3">
              <Dumbbell className="h-10 w-10 mx-auto text-muted-foreground/60" />
              <h3 className="text-base font-semibold">Seleccione un Plan de Tratamiento</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Para consultar o registrar las sesiones individuales de fisioterapia, seleccione primero un paciente en la pestaña Planes.
              </p>
              <Button variant="outline" className="rounded-xl" onClick={() => setTab("planes")}>
                Ir a Lista de Planes
              </Button>
            </Card>
          ) : (
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    Sesiones de {planActual?.pacientes?.nombre} {planActual?.pacientes?.apellido} ({planActual?.numero})
                  </CardTitle>
                  <CardDescription>
                    Tipo: {planActual?.tipo} · Plan de {planActual?.duracion_semanas} semanas ({planActual?.sesiones_por_semana} sesiones por semana)
                  </CardDescription>
                </div>
                <Button 
                  size="sm" 
                  className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => setShowNewSesion(true)}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Nueva Sesión #{sesiones.length + 1}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-6"># Sesión</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Dolor Inicial (EVA)</TableHead>
                      <TableHead>Dolor Final (EVA)</TableHead>
                      <TableHead>Progreso Estimado</TableHead>
                      <TableHead>Asistió</TableHead>
                      <TableHead className="pr-6">Notas Clínicas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingSesiones ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                          Cargando sesiones del plan...
                        </TableCell>
                      </TableRow>
                    ) : sesiones.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                          No hay sesiones registradas para este plan aún. Haga clic en "Nueva Sesión".
                        </TableCell>
                      </TableRow>
                    ) : (
                      sesiones.map((s) => (
                        <TableRow key={s.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="pl-6 font-mono font-bold text-foreground">
                            Sesión #{s.numero_sesion}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {s.fecha ? new Date(s.fecha + "T12:00:00").toLocaleDateString("es-DO") : "—"}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{s.duracion_minutos || 45} min</TableCell>
                          <TableCell>
                            <span className="font-mono font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md">
                              {s.dolor_antes ?? "—"}/10
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                              {s.dolor_despues ?? "—"}/10
                            </span>
                          </TableCell>
                          <TableCell className="w-32">
                            <div className="space-y-1">
                              <Progress value={s.progreso_pct || 0} className="h-2 rounded-full" />
                              <p className="text-[10px] text-muted-foreground text-right font-mono">{s.progreso_pct || 0}%</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {s.asistio ? (
                              <Badge variant="outline" className="rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Asistió
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="rounded-lg bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30 text-xs">
                                <XCircle className="h-3 w-3 mr-1" /> No asistió
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="pr-6 text-xs text-muted-foreground max-w-xs truncate">
                            {s.notas || "Sin notas"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 3: Gráficos de Evolución */}
        <TabsContent value="graficos">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-8 rounded-2xl border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Curva de Dolor EVA Pre vs Post Sesión {planActual ? `(${planActual.numero})` : ""}
                </CardTitle>
                <CardDescription>Evolución longitudinal de la intensidad del dolor comunicada por el paciente</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {datosGraficoDolor.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    No hay suficientes sesiones en este plan para graficar la evolución.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={datosGraficoDolor} margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="sesion" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Line 
                        type="monotone" 
                        dataKey="dolorAntes" 
                        name="Dolor Pre-Sesión" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        dot={{ r: 4 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="dolorDespues" 
                        name="Dolor Post-Sesión" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ r: 4 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-4 rounded-2xl border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Resumen de Cumplimiento</CardTitle>
                <CardDescription>Adherencia a la pauta terapéutica</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                  <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                    Tasa Global de Adherencia
                  </p>
                  <p className="text-3xl font-extrabold font-mono text-purple-700 dark:text-purple-300 mt-1">
                    {tasaAsistencia}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {asistidas} presencias / {totalSes - asistidas} inasistencias
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-muted/40 border border-border/70 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Alivio Terapéutico</h4>
                  <p className="text-sm text-foreground">
                    El paciente experimenta un descenso promedio de{" "}
                    <strong className="text-emerald-600 font-mono">{alivioDolorMedio} puntos</strong> en la escala analógica visual al concluir cada sesión.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Escala EVA */}
        <TabsContent value="escala_eva">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Escala Visual Analógica del Dolor (EVA)</CardTitle>
              <CardDescription>Estandarización clínica para valoración y ajuste de carga terapéutica</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <Smile className="h-5 w-5 text-emerald-600" />
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">0 - 2 · Leve / Ausente</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Molestia tolerable sin interferencia con las actividades de la vida diaria. Apto para ejercicio contra resistencia y carga completa.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <Meh className="h-5 w-5 text-blue-600" />
                    <span className="font-bold text-blue-700 dark:text-blue-400">3 - 5 · Moderado</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Dolor que interfiere parcialmente en movimientos articulares. Mantener movilizaciones pasivas y termoterapia / crioterapia previa.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <Frown className="h-5 w-5 text-amber-600" />
                    <span className="font-bold text-amber-700 dark:text-amber-400">6 - 8 · Severo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Interferencia marcada. Reducir arcos de movilidad. Priorizar analgesia fisioterapéutica (TENS, ultrasonido) antes de ejercicios activos.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-rose-600" />
                    <span className="font-bold text-rose-700 dark:text-rose-400">9 - 10 · Intolerable</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Suspender ejercicio terapéutico directo. Reevaluación médica inmediata por traumatología o fisiatría para descartar lesión aguda o refractaria.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo Nuevo Plan */}
      <Dialog open={showNewPlan} onOpenChange={setShowNewPlan}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-purple-600" />
              Nuevo Plan de Rehabilitación
            </DialogTitle>
            <DialogDescription>
              Prescriba un protocolo terapéutico estructurado para el paciente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select 
                value={formDataPlan.paciente_id} 
                onValueChange={(val) => setFormDataPlan(p => ({ ...p, paciente_id: val }))}
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

            <div className="space-y-2">
              <Label>Modalidad / Tipo de Rehabilitación *</Label>
              <Select 
                value={formDataPlan.tipo} 
                onValueChange={(val) => setFormDataPlan(p => ({ ...p, tipo: val }))}
              >
                <SelectTrigger className="rounded-xl border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_REHAB.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Duración (Semanas)</Label>
                <Input
                  type="number"
                  placeholder="Ej. 6"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataPlan.duracion_semanas}
                  onChange={(e) => setFormDataPlan(p => ({ ...p, duracion_semanas: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Sesiones / Semana</Label>
                <Input
                  type="number"
                  placeholder="Ej. 3"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataPlan.sesiones_por_semana}
                  onChange={(e) => setFormDataPlan(p => ({ ...p, sesiones_por_semana: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Diagnóstico Terapéutico / Funcional</Label>
              <Input
                placeholder="Ej. Post-operatorio LCA rodilla derecha"
                className="rounded-xl border-border/80"
                value={formDataPlan.diagnostico_terapeutico}
                onChange={(e) => setFormDataPlan(p => ({ ...p, diagnostico_terapeutico: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Objetivos Terapéuticos</Label>
              <Textarea
                placeholder="Ej. Recuperar rango articular 120°, fortalecer cuádriceps, deambulación sin muletas..."
                className="rounded-xl border-border/80 resize-none h-20"
                value={formDataPlan.objetivos}
                onChange={(e) => setFormDataPlan(p => ({ ...p, objetivos: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewPlan(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white" 
              onClick={() => crearPlan.mutate()}
              disabled={crearPlan.isPending || !formDataPlan.paciente_id}
            >
              {crearPlan.isPending ? "Creando..." : "Crear Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Nueva Sesión */}
      <Dialog open={showNewSesion} onOpenChange={setShowNewSesion}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Registrar Sesión #{sesiones.length + 1}
            </DialogTitle>
            <DialogDescription>
              {planActual?.pacientes?.nombre} {planActual?.pacientes?.apellido} ({planActual?.numero})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Fecha de Sesión</Label>
                <Input
                  type="date"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataSesion.fecha}
                  onChange={(e) => setFormDataSesion(p => ({ ...p, fecha: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Duración (Minutos)</Label>
                <Input
                  type="number"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataSesion.duracion_minutos}
                  onChange={(e) => setFormDataSesion(p => ({ ...p, duracion_minutos: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Dolor Pre-Sesión (0-10)</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataSesion.dolor_antes}
                  onChange={(e) => setFormDataSesion(p => ({ ...p, dolor_antes: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Dolor Post-Sesión (0-10)</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataSesion.dolor_despues}
                  onChange={(e) => setFormDataSesion(p => ({ ...p, dolor_despues: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Progreso Global (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataSesion.progreso_pct}
                  onChange={(e) => setFormDataSesion(p => ({ ...p, progreso_pct: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Asistencia</Label>
                <Select 
                  value={formDataSesion.asistio ? "si" : "no"} 
                  onValueChange={(val) => setFormDataSesion(p => ({ ...p, asistio: val === "si" }))}
                >
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="si">Asistió a Terapia</SelectItem>
                    <SelectItem value="no">Inasistencia / Faltó</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas de Evolución y Técnicas Aplicadas</Label>
              <Textarea
                placeholder="Ej. Electroterapia 15 min, fortalecimiento isométrico, buena tolerancia..."
                className="rounded-xl border-border/80 resize-none h-20"
                value={formDataSesion.notas_evolucion}
                onChange={(e) => setFormDataSesion(p => ({ ...p, notas_evolucion: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewSesion(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white" 
              onClick={() => crearSesion.mutate()}
              disabled={crearSesion.isPending}
            >
              {crearSesion.isPending ? "Registrando..." : "Registrar Sesión"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
