import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/db/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Apple, 
  Scale, 
  UtensilsCrossed, 
  Calculator, 
  Search, 
  AlertTriangle, 
  Flame, 
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
import { CalculadoraNutricionalDietetica } from "@/components/nutricion/CalculadoraNutricionalDietetica";
import { NuevaEvaluacionNutricionalModal } from "@/components/nutricion/NuevaEvaluacionNutricionalModal";
import { NuevaDietaModal } from "@/components/nutricion/NuevaDietaModal";

const TIPOS_DIETA = [
  { value: "normal", label: "Normal / Basal" },
  { value: "blanda", label: "Blanda / Gastroprotectora" },
  { value: "liquida", label: "Líquida Clara / Completa" },
  { value: "hipocalorica", label: "Hipocalórica" },
  { value: "hipercalorica", label: "Hipercalórica / Hiperproteica" },
  { value: "hiposodica", label: "Hiposódica (Cardiopatía / HTA)" },
  { value: "diabetica", label: "Diabética / Control Glucémico" },
  { value: "renal", label: "Renal (Baja en Fósforo/Potasio)" },
  { value: "hepatica", label: "Hepática" },
  { value: "sin_gluten", label: "Sin Gluten (Celíaca)" },
  { value: "sin_lactosa", label: "Sin Lactosa" },
  { value: "enteral", label: "Nutrición Enteral por Sonda" },
  { value: "parenteral", label: "Nutrición Parenteral Total (NPT)" }
];

const DIAGNOSTICOS_NUT = [
  { value: "desnutricion_severa", label: "Desnutrición Severa", color: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30" },
  { value: "desnutricion_moderada", label: "Desnutrición Moderada", color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  { value: "desnutricion_leve", label: "Desnutrición Leve", color: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" },
  { value: "normal", label: "Eutrófico (Normal)", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  { value: "sobrepeso", label: "Sobrepeso", color: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  { value: "obesidad_i", label: "Obesidad Grado I", color: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30" },
  { value: "obesidad_ii", label: "Obesidad Grado II", color: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30" },
  { value: "obesidad_iii", label: "Obesidad Grado III (Mórbida)", color: "bg-red-600/15 text-red-700 dark:text-red-400 border-red-600/30" }
];

const PALETA_GRAFICOS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

export default function Nutricion() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("evaluaciones");
  const [searchPac, setSearchPac] = useState("");
  const [showNewEval, setShowNewEval] = useState(false);
  const [showNewDieta, setShowNewDieta] = useState(false);

  // Queries
  const { data: pacientes = [] } = useQuery({
    queryKey: ["pacientes-lista-nutri", currentWorkspace?.id],
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

  const { data: evaluaciones = [], isLoading: loadingEval } = useQuery({
    queryKey: ["eval-nutri", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      const { data } = await db
        .from("evaluaciones_nutricionales")
        .select("*, pacientes(nombre, apellido, cedula)")
        .eq("workspace_id", currentWorkspace.id)
        .order("fecha", { ascending: false })
        .limit(150);
      return (data || []) as any[];
    },
    enabled: !!currentWorkspace?.id
  });

  const { data: dietas = [], isLoading: loadingDietas } = useQuery({
    queryKey: ["dietas-hosp", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      const { data } = await db
        .from("dietas_hospitalarias")
        .select("*, pacientes(nombre, apellido, cedula)")
        .eq("workspace_id", currentWorkspace.id)
        .order("created_at", { ascending: false })
        .limit(150);
      return (data || []) as any[];
    },
    enabled: !!currentWorkspace?.id
  });

  // Mutaciones
  const crearEvaluacion = useMutation({
    mutationFn: async (formData: {
      paciente_id: string;
      peso_kg: string;
      talla_cm: string;
      diagnostico_nutricional: string;
      observaciones: string;
    }) => {
      if (!currentWorkspace?.id || !formData.paciente_id) {
        throw new Error("Seleccione un paciente válido.");
      }
      const p = parseFloat(formData.peso_kg) || 0;
      const t = parseFloat(formData.talla_cm) || 0;
      const imc = t > 0 ? +(p / ((t / 100) * (t / 100))).toFixed(1) : null;

      const { error } = await db.from("evaluaciones_nutricionales").insert({
        workspace_id: currentWorkspace.id,
        paciente_id: formData.paciente_id,
        fecha: new Date().toISOString().split("T")[0],
        peso_kg: p || null,
        talla_cm: t || null,
        imc: imc,
        diagnostico_nutricional: formData.diagnostico_nutricional,
        notas: formData.observaciones || null
      } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eval-nutri"] });
      toast.success("Evaluación nutricional guardada exitosamente");
      setShowNewEval(false);
    },
    onError: (err: any) => toast.error(`Error al registrar: ${err.message}`)
  });

  const crearDieta = useMutation({
    mutationFn: async (formData: {
      paciente_id: string;
      tipo_dieta: string;
      calorias_objetivo: string;
      alergias_alimentarias: string;
      indicaciones_especiales: string;
    }) => {
      if (!currentWorkspace?.id || !formData.paciente_id) {
        throw new Error("Seleccione un paciente.");
      }
      const { error } = await db.from("dietas_hospitalarias").insert({
        workspace_id: currentWorkspace.id,
        paciente_id: formData.paciente_id,
        tipo_dieta: formData.tipo_dieta,
        calorias_objetivo: parseInt(formData.calorias_objetivo) || 2000,
        estado: "activa",
        fecha_inicio: new Date().toISOString().split("T")[0],
        notas: formData.indicaciones_especiales || null,
        restricciones_alergenos: formData.alergias_alimentarias || null
      } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dietas-hosp"] });
      toast.success("Prescripción dietética registrada con éxito");
      setShowNewDieta(false);
    },
    onError: (err: any) => toast.error(`Error al prescribir dieta: ${err.message}`)
  });

  // KPIs
  const totalEvals = evaluaciones.length;
  const dietasActivas = dietas.filter(d => d.estado === "activa").length;
  const malnutridos = evaluaciones.filter(e => 
    e.diagnostico_nutricional && (
      e.diagnostico_nutricional.includes("desnutricion") || 
      e.diagnostico_nutricional.includes("obesidad")
    )
  ).length;
  const caloriasPromedio = dietas.length > 0 
    ? Math.round(dietas.reduce((acc, d) => acc + (d.calorias_objetivo || 2000), 0) / dietas.length) 
    : 2000;

  // Filtro
  const evalFiltradas = useMemo(() => {
    return evaluaciones.filter(e => {
      if (!searchPac) return true;
      const full = `${e.pacientes?.nombre || ""} ${e.pacientes?.apellido || ""} ${e.pacientes?.cedula || ""}`.toLowerCase();
      return full.includes(searchPac.toLowerCase());
    });
  }, [evaluaciones, searchPac]);

  const dietasFiltradas = useMemo(() => {
    return dietas.filter(d => {
      if (!searchPac) return true;
      const full = `${d.pacientes?.nombre || ""} ${d.pacientes?.apellido || ""} ${d.pacientes?.cedula || ""}`.toLowerCase();
      return full.includes(searchPac.toLowerCase());
    });
  }, [dietas, searchPac]);

  // Gráficos de distribución
  const datosDiagnostico = useMemo(() => {
    const counts: Record<string, number> = {};
    evaluaciones.forEach(e => {
      const diag = e.diagnostico_nutricional || "Sin diagnóstico";
      counts[diag] = (counts[diag] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace(/_/g, " "),
      value
    }));
  }, [evaluaciones]);

  const datosDietasTipo = useMemo(() => {
    const counts: Record<string, number> = {};
    dietas.forEach(d => {
      const tipo = d.tipo_dieta || "normal";
      counts[tipo] = (counts[tipo] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name: name.replace(/_/g, " "),
      cantidad: count
    }));
  }, [dietas]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      <ClinicalPageHeader
        title="Nutrición Clínica & Dietética"
        subtitle="Evaluación antropométrica, soporte nutricional hospitalario y prescripción dietoterápica"
        badge="Soporte Asistencial"
        icon={Apple}
        action={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="border-border/80 shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setShowNewEval(true)}
            >
              <Scale className="h-4 w-4 mr-1.5 text-emerald-600" />
              Nueva Evaluación
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setShowNewDieta(true)}
            >
              <UtensilsCrossed className="h-4 w-4 mr-1.5" />
              Prescribir Dieta
            </Button>
          </div>
        }
      />

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Evaluaciones Realizadas"
          value={totalEvals}
          subtitle="Historial de tamizaje nutricional"
          icon={Scale}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="Dietas Hospitalarias Activas"
          value={dietasActivas}
          subtitle="Régimen alimentario en curso"
          icon={UtensilsCrossed}
          variant="teal"
        />
        <ClinicalKpiCard
          title="Riesgo Malnutrición / Obesidad"
          value={malnutridos}
          subtitle="Casos con requerimiento especial"
          icon={AlertTriangle}
          variant={malnutridos > 0 ? "amber" : "blue"}
          alert={malnutridos > 5}
        />
        <ClinicalKpiCard
          title="Meta Calórica Promedio"
          value={`${caloriasPromedio} kcal`}
          subtitle="Ingesta programada diaria"
          icon={Flame}
          variant="purple"
        />
      </div>

      {/* Buscador general */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre de paciente o cédula..."
            className="pl-9 border-border/80 bg-background/50 h-10"
            value={searchPac}
            onChange={(e) => setSearchPac(e.target.value)}
          />
        </div>
      </div>

      {/* Pestañas principales */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 border border-border/60">
          <TabsTrigger value="evaluaciones" className="data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Scale className="h-4 w-4 mr-1.5" />
            Evaluaciones Antropométricas ({evalFiltradas.length})
          </TabsTrigger>
          <TabsTrigger value="dietas" className="data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <UtensilsCrossed className="h-4 w-4 mr-1.5" />
            Dietas Hospitalarias ({dietasFiltradas.length})
          </TabsTrigger>
          <TabsTrigger value="calculadora" className="data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Calculator className="h-4 w-4 mr-1.5 text-emerald-600" />
            Calculadora Energética & Antropometría
          </TabsTrigger>
          <TabsTrigger value="graficos" className="data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <PieChartIcon className="h-4 w-4 mr-1.5 text-blue-500" />
            Distribución & Epidemiología
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Evaluaciones */}
        <TabsContent value="evaluaciones">
          <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Censo de Evaluaciones Nutricionales</CardTitle>
              <CardDescription>Monitoreo antropométrico periódico, peso, talla e índice de masa corporal</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Paciente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Talla</TableHead>
                    <TableHead>IMC</TableHead>
                    <TableHead>Diagnóstico Nutricional</TableHead>
                    <TableHead className="pr-6">Observaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingEval ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        Cargando evaluaciones nutricionales...
                      </TableCell>
                    </TableRow>
                  ) : evalFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No se encontraron registros de evaluación nutricional.
                      </TableCell>
                    </TableRow>
                  ) : (
                    evalFiltradas.map((e) => {
                      const diagMeta = DIAGNOSTICOS_NUT.find(d => d.value === e.diagnostico_nutricional);
                      return (
                        <TableRow key={e.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="pl-6 font-medium">
                            <div>
                              <span>{e.pacientes?.nombre} {e.pacientes?.apellido}</span>
                              {e.pacientes?.cedula && (
                                <p className="text-xs text-muted-foreground font-mono">{e.pacientes.cedula}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs font-mono">
                            {e.fecha ? new Date(e.fecha + "T12:00:00").toLocaleDateString("es-DO") : "—"}
                          </TableCell>
                          <TableCell className="font-mono">{e.peso_kg ? `${e.peso_kg} kg` : "—"}</TableCell>
                          <TableCell className="font-mono">{e.talla_cm ? `${e.talla_cm} cm` : "—"}</TableCell>
                          <TableCell>
                            <span className="font-mono font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                              {e.imc ? e.imc : "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`border ${diagMeta?.color || "bg-muted text-muted-foreground"}`}>
                              {diagMeta?.label || e.diagnostico_nutricional || "Eutrófico"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs truncate pr-6">
                            {e.notas || "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between border-t border-border/50 px-6 py-3 bg-muted/10 text-xs text-muted-foreground rounded-b-2xl">
              <span>Registros evaluados: {evalFiltradas.length}</span>
              <span className="font-mono text-[11px]">Nutrición & Tamizaje Antropométrico</span>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

        {/* Tab 2: Dietas */}
        <TabsContent value="dietas">
          <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Dietas Hospitalarias y Regímenes Prescritos</CardTitle>
              <CardDescription>Control de dietoterapia, consistencia alimenticia y requerimientos de soporte</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Paciente</TableHead>
                    <TableHead>Régimen Dietoterápico</TableHead>
                    <TableHead>Meta Energética</TableHead>
                    <TableHead>Restricciones / Alérgenos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="pr-6">Indicaciones a Cocina</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingDietas ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Cargando dietas hospitalarias...
                      </TableCell>
                    </TableRow>
                  ) : dietasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No se encontraron prescripciones dietéticas registradas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dietasFiltradas.map((d) => {
                      const tipoLabel = TIPOS_DIETA.find(t => t.value === d.tipo_dieta)?.label || d.tipo_dieta;
                      return (
                        <TableRow key={d.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="pl-6 font-medium">
                            <div>
                              <span>{d.pacientes?.nombre} {d.pacientes?.apellido}</span>
                              {d.pacientes?.cedula && (
                                <p className="text-xs text-muted-foreground font-mono">{d.pacientes.cedula}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {tipoLabel}
                          </TableCell>
                          <TableCell className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            {d.calorias_objetivo ? `${d.calorias_objetivo} kcal/día` : "Estándar"}
                          </TableCell>
                          <TableCell>
                            {d.restricciones_alergenos ? (
                              <Badge variant="outline" className="border-red-500/30 text-red-700 dark:text-red-400 bg-red-500/10">
                                {d.restricciones_alergenos}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sin alérgenos reportados</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={d.estado === "activa" ? "default" : "secondary"} className="capitalize">
                              {d.estado || "activa"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs truncate pr-6">
                            {d.notas || "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between border-t border-border/50 px-6 py-3 bg-muted/10 text-xs text-muted-foreground rounded-b-2xl">
              <span>Dietas activas: {dietasFiltradas.length}</span>
              <span className="font-mono text-[11px]">Soporte Hospitalario & Cocina</span>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

        {/* Tab 3: Calculadora Antropométrica Reutilizable */}
        <TabsContent value="calculadora">
          <CalculadoraNutricionalDietetica 
            onAplicarCalorias={(cal) => {
              setShowNewDieta(true);
              toast.info(`Abriendo formulario con objetivo calórico de ${cal} kcal`);
            }}
          />
        </TabsContent>

        {/* Tab 4: Gráficos y Epidemiología */}
        <TabsContent value="graficos">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Distribución por Diagnóstico Nutricional</CardTitle>
                <CardDescription>Censo de estados nutricionales diagnosticados en la consulta</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {datosDiagnostico.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sin datos diagnósticos registrados para graficar.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={datosDiagnostico}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={50}
                        paddingAngle={4}
                      >
                        {datosDiagnostico.map((_, index) => (
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
                <CardTitle className="text-base font-semibold">Prescripciones por Tipo de Dieta</CardTitle>
                <CardDescription>Volumen de dietas activas e históricas hospitalarias</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {datosDietasTipo.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sin prescripciones de dietas registradas para graficar.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosDietasTipo} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
                      />
                      <Bar dataKey="cantidad" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modales Modulares */}
      <NuevaEvaluacionNutricionalModal
        open={showNewEval}
        onOpenChange={setShowNewEval}
        pacientes={pacientes}
        diagnosticos={DIAGNOSTICOS_NUT}
        isPending={crearEvaluacion.isPending}
        onSubmit={(data) => crearEvaluacion.mutate(data)}
      />

      <NuevaDietaModal
        open={showNewDieta}
        onOpenChange={setShowNewDieta}
        pacientes={pacientes}
        tiposDieta={TIPOS_DIETA}
        isPending={crearDieta.isPending}
        onSubmit={(data) => crearDieta.mutate(data)}
      />
    </div>
  );
}
