import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/db/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Pill, 
  Activity, 
  AlertTriangle, 
  Armchair, 
  Plus, 
  Search, 
  Calculator, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles,
  HeartPulse,
  Syringe,
  Layers,
  Flame
} from "lucide-react";
import { ClinicalPageHeader } from "@/components/clinical/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/clinical/ClinicalKpiCard";

const GRADOS_CTCAE: Record<number, { label: string; color: string; desc: string }> = {
  1: { label: "Grado 1 - Leve", color: "bg-blue-500/10 text-blue-700 border-blue-500/30", desc: "Asintomático o síntomas leves; solo observación clínica." },
  2: { label: "Grado 2 - Moderado", color: "bg-amber-500/10 text-amber-700 border-amber-500/30", desc: "Intervención no invasiva mínima; limitación ligera de actividades." },
  3: { label: "Grado 3 - Severo", color: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/40", desc: "Médicamente significativo pero no amenaza la vida de forma inmediata." },
  4: { label: "Grado 4 - Amenaza la vida", color: "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/50 animate-pulse", desc: "Consecuencias con riesgo vital; intervención urgente requerida." },
  5: { label: "Grado 5 - Defunción", color: "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-700", desc: "Muerte atribuible a la toxicidad del fármaco." }
};

const ESTADOS_SILLON: Record<string, { label: string; color: string }> = {
  libre: { label: "Disponible", color: "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400" },
  ocupado: { label: "En Infusión", color: "border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-400" },
  limpieza: { label: "En Desinfección", color: "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400" },
  mantenimiento: { label: "Mantenimiento", color: "border-muted bg-muted/40 text-muted-foreground" }
};

export default function Oncologia() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState("ciclos");
  const [search, setSearch] = useState("");
  const [showNewCiclo, setShowNewCiclo] = useState(false);
  const [showNewToxicidad, setShowNewToxicidad] = useState(false);

  // Estado de la Calculadora Oncológica
  const [calcPeso, setCalcPeso] = useState<number>(70);
  const [calcTalla, setCalcTalla] = useState<number>(170);
  const [calcCreatinina, setCalcCreatinina] = useState<number>(0.9);
  const [calcEdad, setCalcEdad] = useState<number>(55);
  const [calcSexo, setCalcSexo] = useState<"M" | "F">("M");
  const [calcAuc, setCalcAuc] = useState<number>(5);

  // Formularios
  const [formDataCiclo, setFormDataCiclo] = useState({
    paciente_id: "",
    protocolo_id: "",
    numero_ciclo: "1",
    fecha_programada: new Date().toISOString().split("T")[0],
    bsa_m2: "1.82",
    notas: ""
  });

  const [formDataToxicidad, setFormDataToxicidad] = useState({
    tipo_toxicidad: "Neutropenia Febril",
    grado_ctcae: 3,
    manejo: "Suspender ciclo temporalmente, factor estimulante G-CSF y antibióticos empíricos",
    ciclo_id: ""
  });

  // Queries
  const { data: pacientes = [] } = useQuery({
    queryKey: ["pacientes-lista-onco", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      const { data } = await db
        .from("pacientes")
        .select("id, nombre, apellido, documento_identidad")
        .eq("workspace_id", currentWorkspace.id)
        .order("nombre");
      return data || [];
    },
    enabled: !!currentWorkspace?.id
  });

  const { data: protocolos = [], isLoading: loadingProt } = useQuery({
    queryKey: ["protocolos_quimio"],
    queryFn: async () => {
      const { data } = await db
        .from("protocolos_quimio")
        .select("*")
        .eq("activo", true)
        .order("nombre");
      return (data || []) as any[];
    }
  });

  const { data: ciclos = [], isLoading: loadingCiclos } = useQuery({
    queryKey: ["ciclos_quimio"],
    queryFn: async () => {
      const { data } = await db
        .from("ciclos_quimio")
        .select("*")
        .order("fecha_programada", { ascending: false })
        .limit(100);
      return (data || []) as any[];
    }
  });

  const { data: sillones = [], isLoading: loadingSillones } = useQuery({
    queryKey: ["sillones_infusion"],
    queryFn: async () => {
      const { data } = await db
        .from("sillones_infusion")
        .select("*")
        .eq("activo", true)
        .order("numero");
      return (data || []) as any[];
    }
  });

  const { data: toxicidades = [], isLoading: loadingToxicidades } = useQuery({
    queryKey: ["toxicidades_oncologicas"],
    queryFn: async () => {
      const { data } = await db
        .from("toxicidades_oncologicas")
        .select("*")
        .order("fecha_evaluacion", { ascending: false })
        .limit(100);
      return (data || []) as any[];
    }
  });

  // Mutación: Crear Ciclo
  const crearCiclo = useMutation({
    mutationFn: async () => {
      const { error } = await db.from("ciclos_quimio").insert({
        numero_ciclo: parseInt(formDataCiclo.numero_ciclo) || 1,
        fecha_programada: formDataCiclo.fecha_programada,
        bsa_m2: parseFloat(formDataCiclo.bsa_m2) || null,
        estado: "en_curso"
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ciclos_quimio"] });
      toast.success("Ciclo de quimioterapia programado exitosamente");
      setShowNewCiclo(false);
      setFormDataCiclo({
        paciente_id: "",
        protocolo_id: "",
        numero_ciclo: "1",
        fecha_programada: new Date().toISOString().split("T")[0],
        bsa_m2: "1.82",
        notas: ""
      });
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  // Mutación: Registrar Toxicidad
  const crearToxicidad = useMutation({
    mutationFn: async () => {
      const { error } = await db.from("toxicidades_oncologicas").insert({
        tipo_toxicidad: formDataToxicidad.tipo_toxicidad,
        grado_ctcae: formDataToxicidad.grado_ctcae,
        manejo: formDataToxicidad.manejo,
        fecha_evaluacion: new Date().toISOString().split("T")[0]
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["toxicidades_oncologicas"] });
      toast.success("Evento de toxicidad CTCAE registrado");
      setShowNewToxicidad(false);
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  // Mutación: Cambiar Estado de Sillón
  const toggleSillon = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const nuevo = estado === "libre" ? "ocupado" : estado === "ocupado" ? "limpieza" : "libre";
      const { error } = await db.from("sillones_infusion").update({ estado: nuevo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sillones_infusion"] });
      toast.success("Estado del sillón de infusión actualizado");
    }
  });

  // Cálculos de Calculadora Oncológica
  const calculosOnco = useMemo(() => {
    // BSA Mosteller: sqrt((peso * talla) / 3600)
    const bsaMosteller = calcPeso > 0 && calcTalla > 0
      ? +Math.sqrt((calcPeso * calcTalla) / 3600).toFixed(2)
      : 0;

    // BSA DuBois: 0.007184 * peso^0.425 * talla^0.725
    const bsaDuBois = calcPeso > 0 && calcTalla > 0
      ? +(0.007184 * Math.pow(calcPeso, 0.425) * Math.pow(calcTalla, 0.725)).toFixed(2)
      : 0;

    // Cockcroft-Gault GFR: ((140 - edad) * peso) / (72 * creatinina) (* 0.85 si mujer)
    let gfr = 0;
    if (calcCreatinina > 0 && calcPeso > 0) {
      gfr = ((140 - calcEdad) * calcPeso) / (72 * calcCreatinina);
      if (calcSexo === "F") gfr *= 0.85;
      // Cap estándar en 125 ml/min para Calvert
      gfr = Math.min(125, +gfr.toFixed(1));
    }

    // Fórmula de Calvert para Carboplatino: Dosis (mg) = AUC * (GFR + 25)
    const dosisCarboplatino = Math.round(calcAuc * (gfr + 25));

    return { bsaMosteller, bsaDuBois, gfr, dosisCarboplatino };
  }, [calcPeso, calcTalla, calcCreatinina, calcEdad, calcSexo, calcAuc]);

  // KPIs
  const ciclosEnCurso = ciclos.filter(c => c.estado === "en_curso").length;
  const sillonesLibres = sillones.filter(s => s.estado === "libre").length;
  const toxicidadesCriticas = toxicidades.filter(t => t.grado_ctcae >= 3).length;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      <ClinicalPageHeader
        title="Oncología Médica & Terapia de Infusión"
        subtitle="Protocolos antineoplásicos, dosificación por BSA y Calvert, monitor de sillones y toxicidades CTCAE"
        badge="Oncología & Quimioterapia"
        icon={Pill}
        action={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="rounded-xl border-border/80 shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setShowNewToxicidad(true)}
            >
              <AlertTriangle className="h-4 w-4 mr-1.5 text-orange-500" />
              Registrar Toxicidad
            </Button>
            <Button 
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setShowNewCiclo(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Programar Ciclo
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Protocolos Antineoplásicos"
          value={protocolos.length}
          subtitle="Esquemas activos (FOLFOX, AC-T, etc.)"
          icon={Pill}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Ciclos de Quimio en Curso"
          value={ciclosEnCurso}
          subtitle="Pacientes en ventana terapéutica activa"
          icon={Activity}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Sillones Disponibles"
          value={`${sillonesLibres} / ${sillones.length}`}
          subtitle="Salas de infusión ambulatoria"
          icon={Armchair}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="Toxicidades CTCAE ≥ 3"
          value={toxicidadesCriticas}
          subtitle="Eventos adversos graves o con riesgo vital"
          icon={AlertTriangle}
          variant={toxicidadesCriticas > 0 ? "rose" : "teal"}
          alert={toxicidadesCriticas > 0}
        />
      </div>

      {/* Pestañas */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl border border-border/60">
          <TabsTrigger value="ciclos" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Activity className="h-4 w-4 mr-1.5 text-purple-600" />
            Ciclos de Quimioterapia ({ciclos.length})
          </TabsTrigger>
          <TabsTrigger value="calculadora" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Calculator className="h-4 w-4 mr-1.5 text-blue-500" />
            Calculadora BSA & Calvert
          </TabsTrigger>
          <TabsTrigger value="sillones" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Armchair className="h-4 w-4 mr-1.5 text-emerald-600" />
            Sala de Infusión ({sillones.length})
          </TabsTrigger>
          <TabsTrigger value="toxicidades" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <AlertTriangle className="h-4 w-4 mr-1.5 text-orange-500" />
            Toxicidades CTCAE ({toxicidades.length})
          </TabsTrigger>
          <TabsTrigger value="protocolos" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Layers className="h-4 w-4 mr-1.5 text-purple-500" />
            Esquemas Oncológicos ({protocolos.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Ciclos */}
        <TabsContent value="ciclos">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Censo de Ciclos Programados</CardTitle>
              <CardDescription>Monitoreo de administración de fármacos citotóxicos y biológicos</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6"># Ciclo</TableHead>
                    <TableHead>Fecha Programada</TableHead>
                    <TableHead>Superficie Corp. (BSA)</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="pr-6 text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingCiclos ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        Cargando ciclos oncológicos...
                      </TableCell>
                    </TableRow>
                  ) : ciclos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        No hay ciclos programados registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ciclos.map((c) => (
                      <TableRow key={c.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="pl-6 font-mono font-bold text-foreground">
                          Ciclo #{c.numero_ciclo}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {c.fecha_programada ? new Date(c.fecha_programada + "T12:00:00").toLocaleDateString("es-DO") : "—"}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono font-semibold bg-muted/60 px-2 py-0.5 rounded-md text-xs">
                            {c.bsa_m2 ? `${c.bsa_m2} m²` : "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={c.estado === "completado" ? "default" : c.estado === "en_curso" ? "secondary" : "outline"}
                            className="rounded-md capitalize text-xs"
                          >
                            {c.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-purple-600">
                            Detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Calculadora Oncológica */}
        <TabsContent value="calculadora">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-5 rounded-2xl border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  Parámetros Clínicos del Paciente
                </CardTitle>
                <CardDescription>Datos antropométricos y función renal para cálculo de quimioterápicos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Peso Actual (kg)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={calcPeso}
                      onChange={(e) => setCalcPeso(parseFloat(e.target.value) || 0)}
                      className="rounded-xl border-border/80 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Talla (cm)</Label>
                    <Input
                      type="number"
                      value={calcTalla}
                      onChange={(e) => setCalcTalla(parseFloat(e.target.value) || 0)}
                      className="rounded-xl border-border/80 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Edad (Años)</Label>
                    <Input
                      type="number"
                      value={calcEdad}
                      onChange={(e) => setCalcEdad(parseInt(e.target.value) || 0)}
                      className="rounded-xl border-border/80 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sexo</Label>
                    <Select value={calcSexo} onValueChange={(v: any) => setCalcSexo(v)}>
                      <SelectTrigger className="rounded-xl border-border/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Femenino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Creatinina (mg/dL)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={calcCreatinina}
                      onChange={(e) => setCalcCreatinina(parseFloat(e.target.value) || 0.1)}
                      className="rounded-xl border-border/80 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/60">
                  <Label>AUC Deseado (Carboplatino)</Label>
                  <Select value={calcAuc.toString()} onValueChange={(v) => setCalcAuc(parseInt(v))}>
                    <SelectTrigger className="rounded-xl border-border/80 font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">AUC 4 (Monoterapia / Ancianos)</SelectItem>
                      <SelectItem value="5">AUC 5 (Combinación estándar)</SelectItem>
                      <SelectItem value="6">AUC 6 (Dosis plena adyuvante)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-7 rounded-2xl border-border/80 shadow-xs bg-muted/20">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Syringe className="h-5 w-5 text-purple-600" />
                  Dosis Calculadas & Superficie Corporal
                </CardTitle>
                <CardDescription>Cálculos estandarizados según guías ASCO / NCCN</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-xl bg-background border border-border/70 space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-semibold">BSA (Mosteller)</span>
                    <p className="text-2xl font-bold font-mono text-purple-700 dark:text-purple-300">
                      {calculosOnco.bsaMosteller} m²
                    </p>
                    <span className="text-[10px] text-muted-foreground">Fórmula de referencia</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-background border border-border/70 space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-semibold">BSA (DuBois)</span>
                    <p className="text-2xl font-bold font-mono text-foreground">
                      {calculosOnco.bsaDuBois} m²
                    </p>
                    <span className="text-[10px] text-muted-foreground">Clásica ponderada</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-background border border-border/70 space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Aclaramiento GFR</span>
                    <p className="text-2xl font-bold font-mono text-emerald-600">
                      {calculosOnco.gfr} ml/min
                    </p>
                    <span className="text-[10px] text-muted-foreground">Cockcroft-Gault</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                      Dosis Carboplatino (Fórmula de Calvert)
                    </span>
                    <p className="text-3xl font-extrabold font-mono text-purple-700 dark:text-purple-300">
                      {calculosOnco.dosisCarboplatino} <span className="text-lg font-normal">mg IV</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                      AUC {calcAuc} × (GFR {calculosOnco.gfr} + 25)
                    </p>
                  </div>
                  <Pill className="h-10 w-10 text-purple-600/70" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Ejemplos de Dosis Basadas en BSA ({calculosOnco.bsaMosteller} m²)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-background border border-border/70">
                      <p className="text-muted-foreground">Oxaliplatino (85 mg/m²)</p>
                      <p className="text-base font-bold font-mono mt-0.5 text-foreground">
                        {Math.round(85 * calculosOnco.bsaMosteller)} mg
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-background border border-border/70">
                      <p className="text-muted-foreground">Docetaxel (75 mg/m²)</p>
                      <p className="text-base font-bold font-mono mt-0.5 text-foreground">
                        {Math.round(75 * calculosOnco.bsaMosteller)} mg
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-background border border-border/70">
                      <p className="text-muted-foreground">5-Fluorouracilo (400 mg/m²)</p>
                      <p className="text-base font-bold font-mono mt-0.5 text-foreground">
                        {Math.round(400 * calculosOnco.bsaMosteller)} mg
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Sillones */}
        <TabsContent value="sillones">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {loadingSillones ? (
              <p className="col-span-full text-center text-muted-foreground py-10">Cargando sillones...</p>
            ) : sillones.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground py-10">No hay sillones configurados.</p>
            ) : (
              sillones.map((s) => {
                const estConfig = ESTADOS_SILLON[s.estado] || ESTADOS_SILLON.libre;
                return (
                  <Card 
                    key={s.id} 
                    className={`rounded-2xl border ${estConfig.color} shadow-xs p-4 text-center cursor-pointer hover:shadow-sm transition-all`}
                    onClick={() => toggleSillon.mutate({ id: s.id, estado: s.estado })}
                  >
                    <Armchair className="h-7 w-7 mx-auto mb-2" />
                    <p className="font-mono font-bold text-base text-foreground">Sillón {s.numero}</p>
                    <Badge variant="outline" className="mt-2 text-[10px] uppercase font-bold tracking-wider">
                      {estConfig.label}
                    </Badge>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Tab 4: Toxicidades */}
        <TabsContent value="toxicidades">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Registro de Toxicidades CTCAE (v5.0)</CardTitle>
              <CardDescription>Eventos adversos atribuibles a la quimioterapia o inmunoterapia</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Gravedad</TableHead>
                    <TableHead>Tipo de Toxicidad</TableHead>
                    <TableHead>Manejo Clínico / Ajuste de Dosis</TableHead>
                    <TableHead className="pr-6 text-right">Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingToxicidades ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        Cargando toxicidades...
                      </TableCell>
                    </TableRow>
                  ) : toxicidades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        No hay eventos de toxicidad registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    toxicidades.map((t) => {
                      const ctcae = GRADOS_CTCAE[t.grado_ctcae] || GRADOS_CTCAE[1];
                      return (
                        <TableRow key={t.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="pl-6">
                            <Badge variant="outline" className={`rounded-lg font-bold text-xs ${ctcae.color}`}>
                              {t.grado_ctcae >= 3 && <AlertTriangle className="h-3 w-3 mr-1 inline" />}
                              {ctcae.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-sm">
                            {t.tipo_toxicidad}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-md truncate">
                            {t.manejo || "Conducta expectante"}
                          </TableCell>
                          <TableCell className="pr-6 text-right font-mono text-xs text-muted-foreground">
                            {t.fecha_evaluacion ? new Date(t.fecha_evaluacion + "T12:00:00").toLocaleDateString("es-DO") : "—"}
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

        {/* Tab 5: Protocolos */}
        <TabsContent value="protocolos">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingProt ? (
              <p className="col-span-full text-center text-muted-foreground py-10">Cargando protocolos...</p>
            ) : protocolos.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground py-10">Sin esquemas registrados.</p>
            ) : (
              protocolos.map((p) => (
                <Card key={p.id} className="rounded-2xl border-border/80 shadow-xs p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-base text-foreground">{p.nombre}</h4>
                    <Badge variant="outline" className="rounded-lg text-xs capitalize bg-purple-500/10 text-purple-700 border-purple-500/30">
                      {p.intencion || "Adyuvante"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cáncer Diana: <strong className="text-foreground">{p.tipo_cancer}</strong>
                  </p>
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span>{p.duracion_ciclos || 6} ciclos totales</span>
                    <span className="font-bold text-purple-700 dark:text-purple-300">Cada {p.intervalo_dias || 21} días</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo Nuevo Ciclo */}
      <Dialog open={showNewCiclo} onOpenChange={setShowNewCiclo}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-purple-600" />
              Programar Ciclo de Quimioterapia
            </DialogTitle>
            <DialogDescription>
              Asigne el número de ciclo y superficie corporal para dosificación.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Número de Ciclo *</Label>
                <Input
                  type="number"
                  min="1"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataCiclo.numero_ciclo}
                  onChange={(e) => setFormDataCiclo(p => ({ ...p, numero_ciclo: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha Programada</Label>
                <Input
                  type="date"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataCiclo.fecha_programada}
                  onChange={(e) => setFormDataCiclo(p => ({ ...p, fecha_programada: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Superficie Corporal (BSA m²)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ej. 1.82"
                className="rounded-xl border-border/80 font-mono"
                value={formDataCiclo.bsa_m2}
                onChange={(e) => setFormDataCiclo(p => ({ ...p, bsa_m2: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewCiclo(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white" 
              onClick={() => crearCiclo.mutate()}
              disabled={crearCiclo.isPending}
            >
              {crearCiclo.isPending ? "Programando..." : "Programar Ciclo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Nueva Toxicidad */}
      <Dialog open={showNewToxicidad} onOpenChange={setShowNewToxicidad}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Registrar Toxicidad CTCAE
            </DialogTitle>
            <DialogDescription>
              Documente el evento adverso según la escala de criterios comunes de toxicidad.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tipo de Toxicidad *</Label>
              <Input
                placeholder="Ej. Neutropenia Febril, Neuropatía, Emesis refractaria..."
                className="rounded-xl border-border/80"
                value={formDataToxicidad.tipo_toxicidad}
                onChange={(e) => setFormDataToxicidad(p => ({ ...p, tipo_toxicidad: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Grado CTCAE *</Label>
              <Select 
                value={formDataToxicidad.grado_ctcae.toString()} 
                onValueChange={(v) => setFormDataToxicidad(p => ({ ...p, grado_ctcae: parseInt(v) }))}
              >
                <SelectTrigger className="rounded-xl border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Grado 1 - Leve</SelectItem>
                  <SelectItem value="2">Grado 2 - Moderado</SelectItem>
                  <SelectItem value="3">Grado 3 - Severo (Alerta)</SelectItem>
                  <SelectItem value="4">Grado 4 - Amenaza la vida (Crítico)</SelectItem>
                  <SelectItem value="5">Grado 5 - Defunción</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Manejo Clínico / Ajuste de Dosis *</Label>
              <Textarea
                placeholder="Detalle si se reduce dosis al 75%, uso de filgrastim, suspensión temporal..."
                className="rounded-xl border-border/80 resize-none h-20"
                value={formDataToxicidad.manejo}
                onChange={(e) => setFormDataToxicidad(p => ({ ...p, manejo: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewToxicidad(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white" 
              onClick={() => crearToxicidad.mutate()}
              disabled={crearToxicidad.isPending || !formDataToxicidad.tipo_toxicidad}
            >
              {crearToxicidad.isPending ? "Guardando..." : "Guardar Toxicidad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
