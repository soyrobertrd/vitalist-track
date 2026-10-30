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
  Apple, 
  Scale, 
  UtensilsCrossed, 
  Calculator, 
  Search, 
  Plus, 
  HeartPulse, 
  AlertTriangle, 
  Flame, 
  PieChart as PieChartIcon,
  Activity,
  CheckCircle2
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

  // Estado de la calculadora interactiva
  const [calcPeso, setCalcPeso] = useState<number>(70);
  const [calcTalla, setCalcTalla] = useState<number>(170);
  const [calcEdad, setCalcEdad] = useState<number>(35);
  const [calcSexo, setCalcSexo] = useState<"M" | "F">("M");
  const [calcActividad, setCalcActividad] = useState<number>(1.375); // ligera

  // Formulario nueva evaluación
  const [formDataEval, setFormDataEval] = useState({
    paciente_id: "",
    peso_kg: "",
    talla_cm: "",
    diagnostico_nutricional: "normal",
    observaciones: ""
  });

  // Formulario nueva dieta
  const [formDataDieta, setFormDataDieta] = useState({
    paciente_id: "",
    tipo_dieta: "normal",
    calorias_objetivo: "2000",
    indicaciones_especiales: "",
    alergias_alimentarias: ""
  });

  // Queries
  const { data: pacientes = [] } = useQuery({
    queryKey: ["pacientes-lista-nutri", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      const { data } = await supabase
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
      const { data } = await supabase
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
      const { data } = await supabase
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
    mutationFn: async () => {
      if (!currentWorkspace?.id || !formDataEval.paciente_id) {
        throw new Error("Seleccione un paciente válido.");
      }
      const p = parseFloat(formDataEval.peso_kg) || 0;
      const t = parseFloat(formDataEval.talla_cm) || 0;
      const imc = t > 0 ? +(p / ((t / 100) * (t / 100))).toFixed(1) : null;

      const { error } = await supabase.from("evaluaciones_nutricionales").insert({
        workspace_id: currentWorkspace.id,
        paciente_id: formDataEval.paciente_id,
        fecha: new Date().toISOString().split("T")[0],
        peso_kg: p || null,
        talla_cm: t || null,
        imc: imc,
        diagnostico_nutricional: formDataEval.diagnostico_nutricional,
        notas: formDataEval.observaciones || null
      } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eval-nutri"] });
      toast.success("Evaluación nutricional guardada exitosamente");
      setShowNewEval(false);
      setFormDataEval({ paciente_id: "", peso_kg: "", talla_cm: "", diagnostico_nutricional: "normal", observaciones: "" });
    },
    onError: (err: any) => toast.error(`Error al registrar: ${err.message}`)
  });

  const crearDieta = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id || !formDataDieta.paciente_id) {
        throw new Error("Seleccione un paciente.");
      }
      const { error } = await supabase.from("dietas_hospitalarias").insert({
        workspace_id: currentWorkspace.id,
        paciente_id: formDataDieta.paciente_id,
        tipo_dieta: formDataDieta.tipo_dieta,
        calorias_objetivo: parseInt(formDataDieta.calorias_objetivo) || 2000,
        estado: "activa",
        fecha_inicio: new Date().toISOString().split("T")[0],
        notas: formDataDieta.indicaciones_especiales || null,
        restricciones_alergenos: formDataDieta.alergias_alimentarias || null
      } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dietas-hosp"] });
      toast.success("Prescripción dietética registrada con éxito");
      setShowNewDieta(false);
      setFormDataDieta({ paciente_id: "", tipo_dieta: "normal", calorias_objetivo: "2000", indicaciones_especiales: "", alergias_alimentarias: "" });
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

  // Cálculos dinámicos de calculadora
  const calcResultados = useMemo(() => {
    const alturaM = calcTalla / 100;
    const imc = alturaM > 0 ? +(calcPeso / (alturaM * alturaM)).toFixed(1) : 0;
    
    // Clasificación IMC
    let catImc = "Normal";
    let catColor = "text-emerald-600";
    if (imc < 18.5) { catImc = "Bajo peso"; catColor = "text-amber-500"; }
    else if (imc >= 25 && imc < 30) { catImc = "Sobrepeso"; catColor = "text-blue-600"; }
    else if (imc >= 30 && imc < 35) { catImc = "Obesidad Grado I"; catColor = "text-orange-600"; }
    else if (imc >= 35) { catImc = "Obesidad Severa"; catColor = "text-rose-600"; }

    // Peso Ideal Lorentz
    const pesoIdeal = calcSexo === "M" 
      ? +(calcTalla - 100 - ((calcTalla - 150) / 4)).toFixed(1)
      : +(calcTalla - 100 - ((calcTalla - 150) / 2.5)).toFixed(1);

    // Tasa Metabólica Basal (Mifflin-St Jeor)
    const tmb = calcSexo === "M"
      ? +(10 * calcPeso + 6.25 * calcTalla - 5 * calcEdad + 5).toFixed(0)
      : +(10 * calcPeso + 6.25 * calcTalla - 5 * calcEdad - 161).toFixed(0);

    const get = Math.round(tmb * calcActividad);

    // Distribución macronutrientes estándar (55% CHO, 20% PROT, 25% GRASAS)
    const choG = Math.round((get * 0.55) / 4);
    const protG = Math.round((get * 0.20) / 4);
    const grasaG = Math.round((get * 0.25) / 9);

    return { imc, catImc, catColor, pesoIdeal, tmb, get, choG, protG, grasaG };
  }, [calcPeso, calcTalla, calcEdad, calcSexo, calcActividad]);

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
              className="rounded-xl border-border/80 shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setShowNewEval(true)}
            >
              <Scale className="h-4 w-4 mr-1.5 text-emerald-600" />
              Nueva Evaluación
            </Button>
            <Button 
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-none text-xs md:text-sm font-medium" 
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
            className="pl-9 rounded-xl border-border/80 bg-background/50 h-10"
            value={searchPac}
            onChange={(e) => setSearchPac(e.target.value)}
          />
        </div>
      </div>

      {/* Pestañas principales */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl border border-border/60">
          <TabsTrigger value="evaluaciones" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Scale className="h-4 w-4 mr-1.5" />
            Evaluaciones Antropométricas ({evalFiltradas.length})
          </TabsTrigger>
          <TabsTrigger value="dietas" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <UtensilsCrossed className="h-4 w-4 mr-1.5" />
            Dietas Hospitalarias ({dietasFiltradas.length})
          </TabsTrigger>
          <TabsTrigger value="calculadora" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Calculator className="h-4 w-4 mr-1.5 text-emerald-600" />
            Calculadora Energética & Antropometría
          </TabsTrigger>
          <TabsTrigger value="graficos" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <PieChartIcon className="h-4 w-4 mr-1.5 text-blue-500" />
            Distribución & Epidemiología
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Evaluaciones */}
        <TabsContent value="evaluaciones">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Censo de Evaluaciones Nutricionales</CardTitle>
              <CardDescription>Monitoreo antropométrico periódico, peso, talla e índice de masa corporal</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
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
                            <Badge variant="outline" className={`rounded-lg px-2.5 py-0.5 font-medium ${diagMeta?.color || ""}`}>
                              {diagMeta?.label || (e.diagnostico_nutricional || "Sin diagnóstico").replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-6 max-w-xs truncate text-xs text-muted-foreground">
                            {e.notas || "—"}
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

        {/* Tab 2: Dietas Hospitalarias */}
        <TabsContent value="dietas">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Prescripciones Dietéticas Activas</CardTitle>
              <CardDescription>Planes de alimentación hospitalaria, restricciones calóricas y alérgenos</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Paciente</TableHead>
                    <TableHead>Tipo de Dieta</TableHead>
                    <TableHead>Meta Calórica</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead>Alergias / Restricciones</TableHead>
                    <TableHead className="pr-6">Indicaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingDietas ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        Cargando dietas hospitalarias...
                      </TableCell>
                    </TableRow>
                  ) : dietasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No hay dietas registradas.
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
                          <TableCell>
                            <Badge variant="outline" className="rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                              {tipoLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono font-semibold">
                            {d.calorias_objetivo ? `${d.calorias_objetivo} kcal` : "2000 kcal"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={d.estado === "activa" ? "default" : "secondary"} className="rounded-md capitalize text-xs">
                              {d.estado || "activa"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {d.fecha_inicio ? new Date(d.fecha_inicio + "T12:00:00").toLocaleDateString("es-DO") : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-amber-700 dark:text-amber-400 font-medium max-w-[150px] truncate">
                            {d.restricciones_alergenos || "Ninguna"}
                          </TableCell>
                          <TableCell className="pr-6 text-xs text-muted-foreground max-w-xs truncate">
                            {d.indicaciones_especiales || "Sin observaciones adicionales"}
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

        {/* Tab 3: Calculadora Antropométrica */}
        <TabsContent value="calculadora">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-5 rounded-2xl border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-emerald-600" />
                  Parámetros del Paciente
                </CardTitle>
                <CardDescription>Ajuste los valores antropométricos para calcular los requerimientos en tiempo real</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calc-peso">Peso Actual (kg)</Label>
                    <Input
                      id="calc-peso"
                      type="number"
                      step="0.5"
                      value={calcPeso}
                      onChange={(e) => setCalcPeso(parseFloat(e.target.value) || 0)}
                      className="rounded-xl border-border/80 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="calc-talla">Talla (cm)</Label>
                    <Input
                      id="calc-talla"
                      type="number"
                      value={calcTalla}
                      onChange={(e) => setCalcTalla(parseFloat(e.target.value) || 0)}
                      className="rounded-xl border-border/80 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calc-edad">Edad (Años)</Label>
                    <Input
                      id="calc-edad"
                      type="number"
                      value={calcEdad}
                      onChange={(e) => setCalcEdad(parseInt(e.target.value) || 0)}
                      className="rounded-xl border-border/80 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="calc-sexo">Sexo Biológico</Label>
                    <Select value={calcSexo} onValueChange={(val: any) => setCalcSexo(val)}>
                      <SelectTrigger id="calc-sexo" className="rounded-xl border-border/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Femenino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="calc-actividad">Nivel de Actividad / Estrés Clínico</Label>
                  <Select 
                    value={calcActividad.toString()} 
                    onValueChange={(val) => setCalcActividad(parseFloat(val))}
                  >
                    <SelectTrigger id="calc-actividad" className="rounded-xl border-border/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.2">Sedentario / Encamado (x1.20)</SelectItem>
                      <SelectItem value="1.375">Actividad Ligera / Deambula (x1.375)</SelectItem>
                      <SelectItem value="1.55">Moderada / Fisioterapia activa (x1.55)</SelectItem>
                      <SelectItem value="1.725">Estrés Quirúrgico / Sepsis moderada (x1.725)</SelectItem>
                      <SelectItem value="1.9">Gran Quemado / Politrauma grave (x1.90)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-7 rounded-2xl border-border/80 shadow-xs bg-muted/20">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-primary" />
                  Prescripción y Resultados Calculados
                </CardTitle>
                <CardDescription>Cálculo basado en fórmulas clínicas estándar (Mifflin-St Jeor & Lorentz)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-xl bg-background border border-border/70 space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Índice Masa Corp.</span>
                    <p className="text-2xl font-bold font-mono text-foreground">{calcResultados.imc} kg/m²</p>
                    <span className={`text-xs font-medium ${calcResultados.catColor}`}>{calcResultados.catImc}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-background border border-border/70 space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Peso Ideal (Lorentz)</span>
                    <p className="text-2xl font-bold font-mono text-emerald-600">{calcResultados.pesoIdeal} kg</p>
                    <span className="text-xs text-muted-foreground">Referencia fisiológica</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-background border border-border/70 space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Gasto Basal (TMB)</span>
                    <p className="text-2xl font-bold font-mono text-foreground">{calcResultados.tmb} kcal</p>
                    <span className="text-xs text-muted-foreground">Reposo absoluto</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                      Gasto Energético Total Diario (GET)
                    </span>
                    <p className="text-3xl font-extrabold font-mono text-emerald-700 dark:text-emerald-300">
                      {calcResultados.get} <span className="text-lg font-normal">kcal/día</span>
                    </p>
                  </div>
                  <Flame className="h-10 w-10 text-emerald-600/70" />
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Distribución de Macronutrientes Recomendada
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-background border border-border/70 text-center">
                      <p className="text-xs text-muted-foreground">Carbohidratos (55%)</p>
                      <p className="text-lg font-bold font-mono text-blue-600">{calcResultados.choG} g</p>
                      <p className="text-[10px] text-muted-foreground">~{Math.round(calcResultados.choG * 4)} kcal</p>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border/70 text-center">
                      <p className="text-xs text-muted-foreground">Proteínas (20%)</p>
                      <p className="text-lg font-bold font-mono text-emerald-600">{calcResultados.protG} g</p>
                      <p className="text-[10px] text-muted-foreground">~{Math.round(calcResultados.protG * 4)} kcal</p>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border/70 text-center">
                      <p className="text-xs text-muted-foreground">Lípidos (25%)</p>
                      <p className="text-lg font-bold font-mono text-amber-600">{calcResultados.grasaG} g</p>
                      <p className="text-[10px] text-muted-foreground">~{Math.round(calcResultados.grasaG * 9)} kcal</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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

      {/* Diálogo Nueva Evaluación */}
      <Dialog open={showNewEval} onOpenChange={setShowNewEval}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-emerald-600" />
              Nueva Evaluación Nutricional
            </DialogTitle>
            <DialogDescription>
              Registre el peso, talla y diagnóstico nutricional del paciente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select 
                value={formDataEval.paciente_id} 
                onValueChange={(val) => setFormDataEval(p => ({ ...p, paciente_id: val }))}
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
                <Label>Peso (kg) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ej. 68.5"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataEval.peso_kg}
                  onChange={(e) => setFormDataEval(p => ({ ...p, peso_kg: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Talla (cm) *</Label>
                <Input
                  type="number"
                  placeholder="Ej. 172"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataEval.talla_cm}
                  onChange={(e) => setFormDataEval(p => ({ ...p, talla_cm: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Diagnóstico Nutricional</Label>
              <Select 
                value={formDataEval.diagnostico_nutricional} 
                onValueChange={(val) => setFormDataEval(p => ({ ...p, diagnostico_nutricional: val }))}
              >
                <SelectTrigger className="rounded-xl border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIAGNOSTICOS_NUT.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Observaciones Clínicas</Label>
              <Textarea
                placeholder="Apetito, pérdida de peso involuntaria, disfagia, etc."
                className="rounded-xl border-border/80 resize-none h-20"
                value={formDataEval.observaciones}
                onChange={(e) => setFormDataEval(p => ({ ...p, observaciones: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewEval(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" 
              onClick={() => crearEvaluacion.mutate()}
              disabled={crearEvaluacion.isPending || !formDataEval.paciente_id || !formDataEval.peso_kg}
            >
              {crearEvaluacion.isPending ? "Guardando..." : "Guardar Evaluación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Nueva Dieta */}
      <Dialog open={showNewDieta} onOpenChange={setShowNewDieta}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-emerald-600" />
              Prescribir Dieta Hospitalaria
            </DialogTitle>
            <DialogDescription>
              Asigne un régimen alimenticio clínico estructurado y meta calórica.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select 
                value={formDataDieta.paciente_id} 
                onValueChange={(val) => setFormDataDieta(p => ({ ...p, paciente_id: val }))}
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
                <Label>Tipo de Dieta *</Label>
                <Select 
                  value={formDataDieta.tipo_dieta} 
                  onValueChange={(val) => setFormDataDieta(p => ({ ...p, tipo_dieta: val }))}
                >
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {TIPOS_DIETA.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Objetivo Calórico (kcal)</Label>
                <Input
                  type="number"
                  placeholder="Ej. 2000"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataDieta.calorias_objetivo}
                  onChange={(e) => setFormDataDieta(p => ({ ...p, calorias_objetivo: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Alergias o Intolerancias Alimentarias</Label>
              <Input
                placeholder="Ej. Marisco, frutos secos, huevo, soya..."
                className="rounded-xl border-border/80"
                value={formDataDieta.alergias_alimentarias}
                onChange={(e) => setFormDataDieta(p => ({ ...p, alergias_alimentarias: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Indicaciones Especiales para Cocina / Enfermería</Label>
              <Textarea
                placeholder="Ej. Textura papilla, sin sal añadida, fraccionar en 5 tomas..."
                className="rounded-xl border-border/80 resize-none h-20"
                value={formDataDieta.indicaciones_especiales}
                onChange={(e) => setFormDataDieta(p => ({ ...p, indicaciones_especiales: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewDieta(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" 
              onClick={() => crearDieta.mutate()}
              disabled={crearDieta.isPending || !formDataDieta.paciente_id}
            >
              {crearDieta.isPending ? "Prescribiendo..." : "Prescribir Dieta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
