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
  GraduationCap, 
  FlaskConical, 
  Users, 
  Plus, 
  Search, 
  BookOpen, 
  Award, 
  Building2, 
  ShieldCheck, 
  FileCheck2, 
  PieChart as PieChartIcon,
  Calendar
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

const ESTADOS_ROTACION = [
  { value: "activa", label: "Rotación Activa", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  { value: "completada", label: "Completada / Aprobada", color: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  { value: "cancelada", label: "Cancelada", color: "bg-muted text-muted-foreground" },
  { value: "suspendida", label: "Suspendida", color: "bg-rose-500/15 text-rose-700 border-rose-500/40" }
];

const COMITE_ETICA = [
  { value: "aprobado", label: "Aprobado por Comité", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  { value: "pendiente", label: "En Revisión Ética", color: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  { value: "rechazado", label: "No Aprobado", color: "bg-rose-500/15 text-rose-700 border-rose-500/40" },
  { value: "exento", label: "Exento (Observacional)", color: "bg-muted text-muted-foreground" }
];

const PALETA_GRAFICOS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"];

export default function Docencia() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("programas");
  const [search, setSearch] = useState("");

  const [showNewRotacion, setShowNewRotacion] = useState(false);
  const [showNewProtocolo, setShowNewProtocolo] = useState(false);

  // Formularios
  const [formDataRot, setFormDataRot] = useState({
    nombre_residente: "",
    universidad: "UASD",
    area_rotacion: "Medicina Interna",
    periodo_inicio: new Date().toISOString().split("T")[0],
    periodo_fin: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    tutor_responsable: ""
  });

  const [formDataProt, setFormDataProt] = useState({
    titulo: "",
    investigador_principal: "",
    comite_etica: "pendiente",
    fase_ensayo: "Fase III",
    estado: "activo",
    descripcion: ""
  });

  // Queries
  const { data: programas = [], isLoading: loadingProgramas } = useQuery({
    queryKey: ["programas_docencia", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
    queryFn: async () => {
      const { data } = await db
        .from("programas_docencia" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("nombre");
      return (data || []) as any[];
    }
  });

  const { data: rotaciones = [], isLoading: loadingRotaciones } = useQuery({
    queryKey: ["residentes_rotaciones", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
    queryFn: async () => {
      const { data } = await db
        .from("residentes_rotaciones" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("created_at", { ascending: false })
        .limit(150);
      return (data || []) as any[];
    }
  });

  const { data: protocolos = [], isLoading: loadingProtocolos } = useQuery({
    queryKey: ["protocolos_investigacion", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
    queryFn: async () => {
      const { data } = await db
        .from("protocolos_investigacion" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return (data || []) as any[];
    }
  });

  // Mutación: Registrar Rotación
  const crearRotacion = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error("Workspace no activo");
      const { error } = await db.from("residentes_rotaciones" as any).insert({
        workspace_id: currentWorkspace.id,
        nombre_residente: formDataRot.nombre_residente,
        universidad: formDataRot.universidad,
        area_rotacion: formDataRot.area_rotacion,
        periodo_inicio: formDataRot.periodo_inicio,
        periodo_fin: formDataRot.periodo_fin,
        tutor_responsable: formDataRot.tutor_responsable || null,
        estado: "activa"
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["residentes_rotaciones"] });
      toast.success("Rotación académica registrada exitosamente");
      setShowNewRotacion(false);
      setFormDataRot({
        nombre_residente: "",
        universidad: "UASD",
        area_rotacion: "Medicina Interna",
        periodo_inicio: new Date().toISOString().split("T")[0],
        periodo_fin: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        tutor_responsable: ""
      });
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  // Mutación: Crear Protocolo de Investigación
  const crearProtocolo = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error("Workspace no activo");
      const num = `INV-${Date.now().toString().slice(-5)}`;
      const { error } = await db.from("protocolos_investigacion" as any).insert({
        workspace_id: currentWorkspace.id,
        numero: num,
        titulo: formDataProt.titulo,
        investigador_principal: formDataProt.investigador_principal,
        comite_etica: formDataProt.comite_etica,
        estado: formDataProt.estado,
        descripcion: formDataProt.descripcion || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["protocolos_investigacion"] });
      toast.success("Protocolo de investigación registrado");
      setShowNewProtocolo(false);
      setFormDataProt({
        titulo: "",
        investigador_principal: "",
        comite_etica: "pendiente",
        fase_ensayo: "Fase III",
        estado: "activo",
        descripcion: ""
      });
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  // KPIs
  const programasActivos = programas.filter(p => p.activo).length;
  const residentesActivos = rotaciones.filter(r => r.estado === "activa").length;
  const investigacionesActivas = protocolos.filter(p => p.estado === "activo").length;
  const aprobadasEtica = protocolos.filter(p => p.comite_etica === "aprobado").length;
  const pctEtica = protocolos.length > 0 ? Math.round((aprobadasEtica / protocolos.length) * 100) : 100;

  // Filtros
  const rotacionesFiltradas = useMemo(() => {
    return rotaciones.filter(r => {
      if (!search) return true;
      const full = `${r.nombre_residente || ""} ${r.universidad || ""} ${r.area_rotacion || ""}`.toLowerCase();
      return full.includes(search.toLowerCase());
    });
  }, [rotaciones, search]);

  const protocolosFiltrados = useMemo(() => {
    return protocolos.filter(p => {
      if (!search) return true;
      const full = `${p.numero || ""} ${p.titulo || ""} ${p.investigador_principal || ""}`.toLowerCase();
      return full.includes(search.toLowerCase());
    });
  }, [protocolos, search]);

  // Gráficos
  const datosPorAreaRotacion = useMemo(() => {
    const counts: Record<string, number> = {};
    rotaciones.forEach(r => {
      const area = r.area_rotacion || "General";
      counts[area] = (counts[area] || 0) + 1;
    });
    return Object.entries(counts).slice(0, 6).map(([name, cantidad]) => ({ name, cantidad }));
  }, [rotaciones]);

  const datosPorUniversidad = useMemo(() => {
    const counts: Record<string, number> = {};
    rotaciones.forEach(r => {
      const uni = r.universidad || "Otras";
      counts[uni] = (counts[uni] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [rotaciones]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      <ClinicalPageHeader
        title="Docencia Médica, Residencias & Investigación"
        subtitle="Gestión de residencias hospitalarias, rotaciones clínicas y comités de ética en investigación"
        badge="Academia & Investigación"
        icon={GraduationCap}
        action={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="rounded-xl border-border/80 shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setShowNewProtocolo(true)}
            >
              <FlaskConical className="h-4 w-4 mr-1.5 text-purple-600" />
              Nuevo Protocolo
            </Button>
            <Button 
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setShowNewRotacion(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Registrar Rotación
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Programas Docentes Activos"
          value={programasActivos}
          subtitle={`De ${programas.length} programas acreditados`}
          icon={Award}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Residentes & Internos Activos"
          value={residentesActivos}
          subtitle="En rotaciones clínicas asistenciales"
          icon={Users}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Protocolos de Investigación"
          value={investigacionesActivas}
          subtitle="Estudios clínicos y ensayos en curso"
          icon={FlaskConical}
          variant="teal"
        />
        <ClinicalKpiCard
          title="Aprobación Ética"
          value={`${pctEtica}%`}
          subtitle={`${aprobadasEtica} estudios aprobados por comité`}
          icon={ShieldCheck}
          variant="emerald"
        />
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre de residente, universidad o protocolo..."
            className="pl-9 rounded-xl border-border/80 bg-background/50 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Pestañas */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl border border-border/60">
          <TabsTrigger value="programas" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Award className="h-4 w-4 mr-1.5 text-purple-600" />
            Programas Académicos ({programas.length})
          </TabsTrigger>
          <TabsTrigger value="residentes" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Users className="h-4 w-4 mr-1.5 text-blue-600" />
            Residentes & Rotaciones ({rotacionesFiltradas.length})
          </TabsTrigger>
          <TabsTrigger value="investigacion" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <FlaskConical className="h-4 w-4 mr-1.5 text-teal-600" />
            Protocolos de Investigación ({protocolosFiltrados.length})
          </TabsTrigger>
          <TabsTrigger value="analitica" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <PieChartIcon className="h-4 w-4 mr-1.5 text-emerald-600" />
            Distribución Académica
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Programas */}
        <TabsContent value="programas">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingProgramas ? (
              <p className="col-span-3 text-center text-muted-foreground py-10">Cargando programas...</p>
            ) : programas.length === 0 ? (
              <p className="col-span-3 text-center text-muted-foreground py-10">No hay programas registrados.</p>
            ) : (
              programas.map((p) => (
                <Card key={p.id} className="rounded-2xl border-border/80 shadow-xs p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-purple-600" />
                      <h4 className="font-semibold text-foreground text-sm">{p.nombre}</h4>
                    </div>
                    <Badge variant={p.activo ? "default" : "secondary"} className="rounded-lg text-xs capitalize">
                      {p.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Especialidad: <span className="font-medium text-foreground">{p.especialidad || p.tipo}</span>
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground font-mono">
                    <span>Duración: {p.duracion_meses || 36} meses</span>
                    <span className="font-bold text-purple-700 dark:text-purple-300">Cupo: {p.cupo_maximo || 10} plazas</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Residentes & Rotaciones */}
        <TabsContent value="residentes">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Censo de Médicos Residentes e Internos</CardTitle>
              <CardDescription>Seguimiento de guardias, servicios hospitalarios y tutoría asistencial</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Médico / Residente</TableHead>
                    <TableHead>Universidad de Origen</TableHead>
                    <TableHead>Servicio de Rotación</TableHead>
                    <TableHead>Período de Rotación</TableHead>
                    <TableHead>Tutor Responsable</TableHead>
                    <TableHead className="pr-6">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingRotaciones ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Cargando residentes y rotaciones...
                      </TableCell>
                    </TableRow>
                  ) : rotacionesFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No hay rotaciones activas registradas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rotacionesFiltradas.map((r) => {
                      const estMeta = ESTADOS_ROTACION.find(e => e.value === r.estado);
                      return (
                        <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="pl-6 font-semibold text-sm">
                            {r.nombre_residente || "Residente"}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-foreground">
                            {r.universidad || "UASD"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="rounded-lg text-xs bg-purple-500/10 text-purple-700 border-purple-500/30">
                              {r.area_rotacion}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {r.periodo_inicio ? new Date(r.periodo_inicio + "T12:00:00").toLocaleDateString("es-DO") : "—"} al{" "}
                            {r.periodo_fin ? new Date(r.periodo_fin + "T12:00:00").toLocaleDateString("es-DO") : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {r.tutor_responsable || "Jefe de Servicio"}
                          </TableCell>
                          <TableCell className="pr-6">
                            <Badge variant="outline" className={`rounded-lg capitalize text-xs ${estMeta?.color || ""}`}>
                              {estMeta?.label || r.estado}
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

        {/* Tab 3: Investigación */}
        <TabsContent value="investigacion">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Protocolos de Investigación & Ensayos Clínicos</CardTitle>
              <CardDescription>Estudios aprobados según directrices de Buenas Prácticas Clínicas (BPC / GCP)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Código</TableHead>
                    <TableHead>Título del Estudio</TableHead>
                    <TableHead>Investigador Principal</TableHead>
                    <TableHead>Comité de Ética</TableHead>
                    <TableHead className="pr-6">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingProtocolos ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        Cargando protocolos de investigación...
                      </TableCell>
                    </TableRow>
                  ) : protocolosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        No hay protocolos de investigación registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    protocolosFiltrados.map((p) => {
                      const eticaMeta = COMITE_ETICA.find(e => e.value === p.comite_etica);
                      return (
                        <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="pl-6 font-mono font-bold text-xs text-purple-700 dark:text-purple-400">
                            {p.numero || "S/C"}
                          </TableCell>
                          <TableCell className="font-semibold text-sm max-w-md truncate">
                            {p.titulo}
                          </TableCell>
                          <TableCell className="text-xs">{p.investigador_principal || "Investigador Clínico"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`rounded-lg capitalize text-xs ${eticaMeta?.color || ""}`}>
                              {eticaMeta?.label || p.comite_etica}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-6">
                            <Badge variant={p.estado === "activo" ? "default" : "secondary"} className="rounded-md capitalize text-xs">
                              {p.estado || "activo"}
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

        {/* Tab 4: Analítica */}
        <TabsContent value="analitica">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Residentes por Servicio Clínico</CardTitle>
                <CardDescription>Distribución de médicos en formación por área de rotación</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {datosPorAreaRotacion.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sin rotaciones registradas para graficar.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosPorAreaRotacion} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
                      />
                      <Bar dataKey="cantidad" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Procedencia Universitaria</CardTitle>
                <CardDescription>Convenios académicos con facultades de medicina</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {datosPorUniversidad.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sin datos de universidades para graficar.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={datosPorUniversidad}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={50}
                        paddingAngle={4}
                      >
                        {datosPorUniversidad.map((_, index) => (
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
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo Nueva Rotación */}
      <Dialog open={showNewRotacion} onOpenChange={setShowNewRotacion}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Registrar Rotación Académica
            </DialogTitle>
            <DialogDescription>
              Incorpore un residente o interno a un servicio clínico docente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre del Médico Residente / Interno *</Label>
              <Input
                placeholder="Ej. Dra. Carmen Lora"
                className="rounded-xl border-border/80"
                value={formDataRot.nombre_residente}
                onChange={(e) => setFormDataRot(p => ({ ...p, nombre_residente: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Universidad de Origen</Label>
                <Input
                  placeholder="Ej. UASD, UNIBE, INTEC, PUCMM"
                  className="rounded-xl border-border/80"
                  value={formDataRot.universidad}
                  onChange={(e) => setFormDataRot(p => ({ ...p, universidad: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Área de Rotación</Label>
                <Input
                  placeholder="Ej. Medicina Interna, UCI..."
                  className="rounded-xl border-border/80"
                  value={formDataRot.area_rotacion}
                  onChange={(e) => setFormDataRot(p => ({ ...p, area_rotacion: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Fecha Inicio</Label>
                <Input
                  type="date"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataRot.periodo_inicio}
                  onChange={(e) => setFormDataRot(p => ({ ...p, periodo_inicio: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Conclusión</Label>
                <Input
                  type="date"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataRot.periodo_fin}
                  onChange={(e) => setFormDataRot(p => ({ ...p, periodo_fin: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tutor / Especialista Responsable</Label>
              <Input
                placeholder="Nombre del médico tratante tutor..."
                className="rounded-xl border-border/80"
                value={formDataRot.tutor_responsable}
                onChange={(e) => setFormDataRot(p => ({ ...p, tutor_responsable: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewRotacion(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white" 
              onClick={() => crearRotacion.mutate()}
              disabled={crearRotacion.isPending || !formDataRot.nombre_residente}
            >
              {crearRotacion.isPending ? "Registrando..." : "Registrar Rotación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Nuevo Protocolo */}
      <Dialog open={showNewProtocolo} onOpenChange={setShowNewProtocolo}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-purple-600" />
              Nuevo Protocolo de Investigación
            </DialogTitle>
            <DialogDescription>
              Presente un estudio clínico para revisión y aprobación por el Comité de Ética.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Título de la Investigación *</Label>
              <Input
                placeholder="Título completo del ensayo o estudio observacional..."
                className="rounded-xl border-border/80"
                value={formDataProt.titulo}
                onChange={(e) => setFormDataProt(p => ({ ...p, titulo: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Investigador Principal</Label>
                <Input
                  placeholder="Dr. Nombre Apellido"
                  className="rounded-xl border-border/80"
                  value={formDataProt.investigador_principal}
                  onChange={(e) => setFormDataProt(p => ({ ...p, investigador_principal: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Dictamen Comité Ética</Label>
                <Select 
                  value={formDataProt.comite_etica} 
                  onValueChange={(val) => setFormDataProt(p => ({ ...p, comite_etica: val }))}
                >
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMITE_ETICA.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Resumen Metodológico / Objetivos</Label>
              <Textarea
                placeholder="Describa el diseño del estudio, criterios de inclusión y variables..."
                className="rounded-xl border-border/80 resize-none h-24"
                value={formDataProt.descripcion}
                onChange={(e) => setFormDataProt(p => ({ ...p, descripcion: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewProtocolo(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white" 
              onClick={() => crearProtocolo.mutate()}
              disabled={crearProtocolo.isPending || !formDataProt.titulo}
            >
              {crearProtocolo.isPending ? "Guardando..." : "Guardar Protocolo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
