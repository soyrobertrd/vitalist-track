import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Activity,
  Calculator,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  FileText,
  User,
  HeartPulse,
  Wind,
  Layers,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";
import { CalculadoraGoldTab } from "@/components/especialidades/neumologia/CalculadoraGoldTab";
import { EspirometriaTab } from "@/components/especialidades/neumologia/EspirometriaTab";
import { Curb65Tab } from "@/components/especialidades/neumologia/Curb65Tab";

export type TipoConsultaNeumo =
  | "epoc_gold"
  | "asma_gina"
  | "nac_curb65"
  | "sahos_apnea"
  | "fibrosis_intersticial";

interface ConsultaNeumologica {
  id: string;
  paciente_nombre: string;
  edad_sexo: string;
  tipo_consulta: TipoConsultaNeumo;
  fecha: string;
  spO2_ambiente: number;
  fev1_predicho_pct?: number;
  fev1_fvc_ratio?: number;
  mmrc_score?: number;
  curb65_score?: number;
  estadio_gold?: "GOLD 1 (Leve)" | "GOLD 2 (Moderado)" | "GOLD 3 (Grave)" | "GOLD 4 (Muy Grave)";
  grupo_gold?: "A" | "B" | "E";
  oxigenoterapia?: string;
  diagnostico: string;
  plan_conducta: string;
}

const MOCK_CONSULTAS_NEUMO: ConsultaNeumologica[] = [
  {
    id: "neu-01",
    paciente_nombre: "Don Ernesto Peña Valenzuela",
    edad_sexo: "72a / M",
    tipo_consulta: "epoc_gold",
    fecha: "2026-10-29",
    spO2_ambiente: 88,
    fev1_predicho_pct: 42,
    fev1_fvc_ratio: 0.58,
    mmrc_score: 3,
    estadio_gold: "GOLD 3 (Grave)",
    grupo_gold: "E",
    oxigenoterapia: "Cánula binasal continua 2 LPM (titular SpO2 88-92%)",
    diagnostico: "EPOC Estadio GOLD 3 Grupo E exacerbador frecuente / Enfisema centrolobulillar grave tabáquico (IPA: 45)",
    plan_conducta: "Terapia triple inhalada cerrada: Fluticasona/Umeclidinio/Vilanterol 1 inh c/24h. Vacunación antineumocócica y antigripal. Derivación a rehabilitación pulmonar.",
  },
  {
    id: "neu-02",
    paciente_nombre: "Lucía María Encarnación",
    edad_sexo: "34a / F",
    tipo_consulta: "asma_gina",
    fecha: "2026-10-28",
    spO2_ambiente: 97,
    fev1_predicho_pct: 78,
    fev1_fvc_ratio: 0.69,
    mmrc_score: 1,
    diagnostico: "Asma bronquial alérgica moderada persistente no controlada (GINA Paso 3)",
    plan_conducta: "Formoterol/Budesonida 160/4.5 mcg 1 inh BID + como rescate (Estrategia MART). Test de punción cutánea y dosificación de IgE total.",
  },
  {
    id: "neu-03",
    paciente_nombre: "Bartolomé De Oleo",
    edad_sexo: "79a / M",
    tipo_consulta: "nac_curb65",
    fecha: "2026-10-27",
    spO2_ambiente: 91,
    curb65_score: 3,
    oxigenoterapia: "Venturi al 28% con 4 LPM",
    diagnostico: "Neumonía adquirida en la comunidad (NAC) lóbulo inferior derecho / CURB-65: 3 pts (Riesgo Alto)",
    plan_conducta: "Ingreso hospitalario inmediato a Sala de Cuidados Intermedios. Hemocultivos x2, antígeno neumococo en orina. Ceftriaxona 2g IV q24h + Claritromicina 500mg IV q12h.",
  },
  {
    id: "neu-04",
    paciente_nombre: "Federico Tavárez Mota",
    edad_sexo: "56a / M",
    tipo_consulta: "sahos_apnea",
    fecha: "2026-10-26",
    spO2_ambiente: 95,
    mmrc_score: 1,
    diagnostico: "Sospecha de SAHOS moderado-severo / Escala Somnolencia Epworth: 16/24 (Hipersomnolencia patológica)",
    plan_conducta: "Polisomnografía nocturna diagnóstica ambulatoria con oximetría continua. Titulación preliminar de Auto-CPAP nasal.",
  },
];

export default function Neumologia() {
  const [consultas, setConsultas] = useState<ConsultaNeumologica[]>(MOCK_CONSULTAS_NEUMO);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [modalNueva, setModalNueva] = useState(false);
  const [consultaDetalle, setConsultaDetalle] = useState<ConsultaNeumologica | null>(null);

  // Form State
  const [formNombre, setFormNombre] = useState("");
  const [formEdadSexo, setFormEdadSexo] = useState("60a / M");
  const [formTipo, setFormTipo] = useState<TipoConsultaNeumo>("epoc_gold");
  const [formSpO2, setFormSpO2] = useState("94");
  const [formFEV1, setFormFEV1] = useState("55");
  const [formFVC, setFormFVC] = useState("3.2");
  const [formFEV1Litros, setFormFEV1Litros] = useState("1.8");
  const [formMMRC, setFormMMRC] = useState("2");
  const [formExacerbaciones, setFormExacerbaciones] = useState("1");
  const [formIngresoPrevio, setFormIngresoPrevio] = useState(false);
  const [formCurb65, setFormCurb65] = useState("1");
  const [formO2, setFormO2] = useState("");
  const [formDiag, setFormDiag] = useState("");
  const [formPlan, setFormPlan] = useState("");

  // Calculadora CURB-65 State
  const [curbC, setCurbC] = useState(false);
  const [curbU, setCurbU] = useState(false);
  const [curbR, setCurbR] = useState(false);
  const [curbB, setCurbB] = useState(false);
  const [curb65Age, setCurb65Age] = useState(true);

  const calcCurbTotal = useMemo(() => {
    let pts = 0;
    if (curbC) pts++;
    if (curbU) pts++;
    if (curbR) pts++;
    if (curbB) pts++;
    if (curb65Age) pts++;
    return pts;
  }, [curbC, curbU, curbR, curbB, curb65Age]);

  const curbInterpretacion = useMemo(() => {
    if (calcCurbTotal <= 1) {
      return {
        riesgo: "Bajo (Mortalidad < 1.5%)",
        mortalidad: "< 1.5%",
        conducta: "Tratamiento ambulatorio seguro con amoxicilina/clavulánico o macrólido.",
        badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      };
    }
    if (calcCurbTotal === 2) {
      return {
        riesgo: "Intermedio (Mortalidad ~9.2%)",
        mortalidad: "~9.2%",
        conducta: "Hospitalización en Sala de Medicina Interna / Neumología recomendada.",
        badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
      };
    }
    return {
      riesgo: "Alto (Mortalidad 22% - 30%)",
      mortalidad: "22% - 30%",
      conducta: "Ingreso hospitalario urgente; evaluar criterios de UCI si shock séptico o ventilación.",
      badgeColor: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
    };
  }, [calcCurbTotal]);

  // Calculadora Espirometría y Reversibilidad
  const [espFvcBasal, setEspFvcBasal] = useState<number>(3.5);
  const [espFev1Basal, setEspFev1Basal] = useState<number>(1.75);
  const [espFev1Post, setEspFev1Post] = useState<number>(2.05);

  const espRatioBasal = useMemo(() => {
    if (!espFvcBasal || espFvcBasal <= 0) return 0;
    return Number((espFev1Basal / espFvcBasal).toFixed(2));
  }, [espFvcBasal, espFev1Basal]);

  const espCambioAbsolutoMl = useMemo(() => {
    return Math.round((espFev1Post - espFev1Basal) * 1000);
  }, [espFev1Post, espFev1Basal]);

  const espCambioPorcentual = useMemo(() => {
    if (!espFev1Basal || espFev1Basal <= 0) return 0;
    return Number((((espFev1Post - espFev1Basal) / espFev1Basal) * 100).toFixed(1));
  }, [espFev1Basal, espFev1Post]);

  const espPruebaPositiva = useMemo(() => {
    return espCambioPorcentual >= 12 && espCambioAbsolutoMl >= 200;
  }, [espCambioPorcentual, espCambioAbsolutoMl]);

  // Calculadora EPOC GOLD
  const [goldFev1Pct, setGoldFev1Pct] = useState<number>(48);
  const [goldMmrc, setGoldMmrc] = useState<number>(2);
  const [goldExacAnuales, setGoldExacAnuales] = useState<number>(2);
  const [goldHospitalizacion, setGoldHospitalizacion] = useState<boolean>(true);

  const goldClasificacion = useMemo(() => {
    let grado = "GOLD 2 (Moderado)";
    if (goldFev1Pct >= 80) grado = "GOLD 1 (Leve)";
    else if (goldFev1Pct >= 50) grado = "GOLD 2 (Moderado)";
    else if (goldFev1Pct >= 30) grado = "GOLD 3 (Grave)";
    else grado = "GOLD 4 (Muy Grave)";

    let grupo = "A";
    if (goldHospitalizacion || goldExacAnuales >= 2) {
      grupo = "E (Exacerbador Frecuente)";
    } else if (goldMmrc >= 2) {
      grupo = "B (Muy Sintomático)";
    } else {
      grupo = "A (Poco Sintomático)";
    }

    let esquema = "";
    if (grupo.startsWith("E")) {
      esquema = "LAMA + LABA inicial; considerar LAMA + LABA + ICS si eosinófilos en sangre >= 300 cél/µL.";
    } else if (grupo.startsWith("B")) {
      esquema = "Combinación dual broncodilatadora: LAMA + LABA (ej. Tiotropio/Olodaterol o Umeclidinio/Vilanterol).";
    } else {
      esquema = "Broncodilatador de acción prolongada único (LAMA o LABA) según tolerancia.";
    }

    return { grado, grupo, esquema };
  }, [goldFev1Pct, goldMmrc, goldExacAnuales, goldHospitalizacion]);

  // Filtrado de consultas
  const consultasFiltradas = useMemo(() => {
    return consultas.filter((c) => {
      const matchBusqueda =
        c.paciente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.diagnostico.toLowerCase().includes(busqueda.toLowerCase());
      const matchTipo = filtroTipo === "todos" || c.tipo_consulta === filtroTipo;
      return matchBusqueda && matchTipo;
    });
  }, [consultas, busqueda, filtroTipo]);

  const handleCrearConsulta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre || !formDiag) {
      toast.error("Por favor complete el nombre del paciente y diagnóstico clínico.");
      return;
    }

    const fev1Val = parseFloat(formFEV1);
    let estGold: ConsultaNeumologica["estadio_gold"] = undefined;
    let grpGold: ConsultaNeumologica["grupo_gold"] = undefined;

    if (formTipo === "epoc_gold") {
      if (fev1Val >= 80) estGold = "GOLD 1 (Leve)";
      else if (fev1Val >= 50) estGold = "GOLD 2 (Moderado)";
      else if (fev1Val >= 30) estGold = "GOLD 3 (Grave)";
      else estGold = "GOLD 4 (Muy Grave)";

      const exacNum = parseInt(formExacerbaciones) || 0;
      if (formIngresoPrevio || exacNum >= 2) grpGold = "E";
      else if (parseInt(formMMRC) >= 2) grpGold = "B";
      else grpGold = "A";
    }

    const nueva: ConsultaNeumologica = {
      id: `neu-${Date.now().toString().slice(-4)}`,
      paciente_nombre: formNombre,
      edad_sexo: formEdadSexo,
      tipo_consulta: formTipo,
      fecha: new Date().toISOString().split("T")[0],
      spO2_ambiente: parseInt(formSpO2) || 95,
      fev1_predicho_pct: formFEV1 ? parseFloat(formFEV1) : undefined,
      fev1_fvc_ratio: formFEV1Litros && formFVC ? Number((parseFloat(formFEV1Litros) / parseFloat(formFVC)).toFixed(2)) : undefined,
      mmrc_score: parseInt(formMMRC) || 0,
      curb65_score: formTipo === "nac_curb65" ? parseInt(formCurb65) || 0 : undefined,
      estadio_gold: estGold,
      grupo_gold: grpGold,
      oxigenoterapia: formO2.trim() || undefined,
      diagnostico: formDiag,
      plan_conducta: formPlan,
    };

    setConsultas([nueva, ...consultas]);
    setModalNueva(false);
    toast.success("Consulta neumológica registrada exitosamente con validación funcional.");

    // Limpiar form
    setFormNombre("");
    setFormDiag("");
    setFormPlan("");
  };

  return (
    <div className="space-y-6 pb-12">
      <ClinicalPageHeader
        title="Neumología & Medicina Respiratoria"
        description="Fisiopatología pulmonar, espirometría computarizada, curvas flujo-volumen, estratificación EPOC GOLD 2024, disnea mMRC y CURB-65."
        badgeText="Servicio Clínico Especializado"
        actions={
          <Button
            onClick={() => setModalNueva(true)}
            className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-medium shadow-sm flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Consulta Respiratoria
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Consultas Activas"
          value={consultas.length.toString()}
          subtitle="Seguimiento neumológico especializado"
          icon={<Wind className="h-5 w-5 text-cyan-600" />}
        />
        <ClinicalKpiCard
          title="Casos EPOC / GINA"
          value={consultas.filter((c) => c.tipo_consulta === "epoc_gold" || c.tipo_consulta === "asma_gina").length.toString()}
          subtitle="Obstrucción crónica y asma grave"
          icon={<Layers className="h-5 w-5 text-blue-600" />}
        />
        <ClinicalKpiCard
          title="Oxigenoterapia Activa"
          value={consultas.filter((c) => !!c.oxigenoterapia).length.toString()}
          subtitle="Oxígeno domiciliario / hospitalario"
          icon={<HeartPulse className="h-5 w-5 text-indigo-600" />}
        />
        <ClinicalKpiCard
          title="Infección / NAC Severa"
          value={consultas.filter((c) => c.tipo_consulta === "nac_curb65" && (c.curb65_score ?? 0) >= 2).length.toString()}
          subtitle="CURB-65 ≥ 2 con indicación de ingreso"
          icon={<ShieldAlert className="h-5 w-5 text-rose-600" />}
        />
      </div>

      {/* Pestañas de Trabajo */}
      <Tabs defaultValue="consultas" className="w-full">
        <TabsList className="bg-muted/70 p-1 rounded-xl">
          <TabsTrigger value="consultas" className="rounded-lg text-xs font-semibold gap-2">
            <FileText className="h-4 w-4" />
            Historial de Consultas & Casos
          </TabsTrigger>
          <TabsTrigger value="gold_bode" className="rounded-lg text-xs font-semibold gap-2">
            <Calculator className="h-4 w-4" />
            Calculadora EPOC GOLD & ABE
          </TabsTrigger>
          <TabsTrigger value="espirometria" className="rounded-lg text-xs font-semibold gap-2">
            <Wind className="h-4 w-4" />
            Espirometría & Reversibilidad
          </TabsTrigger>
          <TabsTrigger value="curb65" className="rounded-lg text-xs font-semibold gap-2">
            <Stethoscope className="h-4 w-4" />
            Score CURB-65 Neumonía
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CONSULTAS */}
        <TabsContent value="consultas" className="space-y-4 pt-2">
          {/* Barra de Filtros */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente, diagnóstico CIE-10 o tratamiento..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9 rounded-xl border-border/80"
              />
            </div>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-full sm:w-[230px] rounded-xl border-border/80">
                <SelectValue placeholder="Tipo de Patología" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las patologías</SelectItem>
                <SelectItem value="epoc_gold">EPOC (GOLD 1-4)</SelectItem>
                <SelectItem value="asma_gina">Asma Bronquial (GINA)</SelectItem>
                <SelectItem value="nac_curb65">Neumonía Aguda (CURB-65)</SelectItem>
                <SelectItem value="sahos_apnea">SAHOS / Apnea del Sueño</SelectItem>
                <SelectItem value="fibrosis_intersticial">Fibrosis Pulmonar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Listado de Tarjetas Clínicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {consultasFiltradas.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 border border-dashed rounded-2xl">
                No se encontraron registros clínicos que coincidan con la búsqueda.
              </div>
            ) : (
              consultasFiltradas.map((c) => (
                <Card
                  key={c.id}
                  className="rounded-2xl border-border/80 hover:shadow-md transition-all cursor-pointer bg-card"
                  onClick={() => setConsultaDetalle(c)}
                >
                  <CardContent className="p-5 space-y-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                          <User className="h-4 w-4 text-cyan-600" />
                          {c.paciente_nombre}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {c.edad_sexo} • Atendido el {c.fecha}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          c.tipo_consulta === "epoc_gold"
                            ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30"
                            : c.tipo_consulta === "asma_gina"
                            ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
                            : c.tipo_consulta === "nac_curb65"
                            ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
                            : "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30"
                        }
                      >
                        {c.tipo_consulta.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>

                    {/* Parámetros Funcionales */}
                    <div className="grid grid-cols-3 gap-2 bg-muted/40 p-2.5 rounded-xl text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Saturación O2:</span>
                        <span className={`font-semibold ${c.spO2_ambiente < 90 ? "text-rose-600 font-bold" : "text-foreground"}`}>
                          {c.spO2_ambiente}%
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">FEV1 % pred:</span>
                        <span className="font-semibold text-foreground">
                          {c.fev1_predicho_pct ? `${c.fev1_predicho_pct}%` : "No aplicable"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Escala mMRC:</span>
                        <span className="font-semibold text-foreground">
                          {c.mmrc_score !== undefined ? `Grado ${c.mmrc_score}` : "N/D"}
                        </span>
                      </div>
                    </div>

                    {c.estadio_gold && (
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="secondary" className="bg-cyan-500/15 text-cyan-800 dark:text-cyan-300">
                          {c.estadio_gold}
                        </Badge>
                        {c.grupo_gold && (
                          <Badge variant="outline" className="border-cyan-500/40 text-cyan-700 dark:text-cyan-400">
                            Grupo {c.grupo_gold}
                          </Badge>
                        )}
                      </div>
                    )}

                    {c.oxigenoterapia && (
                      <div className="text-xs bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 p-2 rounded-lg border border-indigo-500/20">
                        <strong>Oxígeno prescrito:</strong> {c.oxigenoterapia}
                      </div>
                    )}

                    <div className="space-y-1 text-xs">
                      <p className="line-clamp-2 text-muted-foreground">
                        <strong className="text-foreground">Diagnóstico:</strong> {c.diagnostico}
                      </p>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-xs text-muted-foreground border-t border-border/60">
                      <span>Click para ver reporte médico completo</span>
                      <CheckCircle2 className="h-4 w-4 text-cyan-600" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* TAB 2: CALCULADORA EPOC GOLD */}
        <TabsContent value="gold_bode" className="space-y-4 pt-2">
          <CalculadoraGoldTab
            goldFev1Pct={goldFev1Pct}
            setGoldFev1Pct={setGoldFev1Pct}
            goldMmrc={goldMmrc}
            setGoldMmrc={setGoldMmrc}
            goldExacAnuales={goldExacAnuales}
            setGoldExacAnuales={setGoldExacAnuales}
            goldHospitalizacion={goldHospitalizacion}
            setGoldHospitalizacion={setGoldHospitalizacion}
            goldClasificacion={goldClasificacion}
          />
        </TabsContent>

        {/* TAB 3: ESPIROMETRÍA & REVERSIBILIDAD */}
        <TabsContent value="espirometria" className="space-y-4 pt-2">
          <EspirometriaTab
            espFvcBasal={espFvcBasal}
            setEspFvcBasal={setEspFvcBasal}
            espFev1Basal={espFev1Basal}
            setEspFev1Basal={setEspFev1Basal}
            espFev1Post={espFev1Post}
            setEspFev1Post={setEspFev1Post}
            espRatioBasal={espRatioBasal}
            espCambioAbsolutoMl={espCambioAbsolutoMl}
            espCambioPorcentual={espCambioPorcentual}
            espPruebaPositiva={espPruebaPositiva}
          />
        </TabsContent>

        {/* TAB 4: CURB-65 */}
        <TabsContent value="curb65" className="space-y-4 pt-2">
          <Curb65Tab
            curbC={curbC}
            setCurbC={setCurbC}
            curbU={curbU}
            setCurbU={setCurbU}
            curbR={curbR}
            setCurbR={setCurbR}
            curbB={curbB}
            setCurbB={setCurbB}
            curb65Age={curb65Age}
            setCurb65Age={setCurb65Age}
            calcCurbTotal={calcCurbTotal}
            curbInterpretacion={curbInterpretacion}
            onUsarPuntaje={(score) => setFormCurb65(score.toString())}
          />
        </TabsContent>
      </Tabs>

      {/* MODAL NUEVA CONSULTA */}
      <Dialog open={modalNueva} onOpenChange={setModalNueva}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Wind className="h-5 w-5 text-cyan-600" />
              Nueva Consulta en Neumología
            </DialogTitle>
            <DialogDescription>
              Complete los datos clínicos, parámetros espirométricos y plan de manejo terapéutico.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCrearConsulta} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nombre del Paciente:</Label>
                <Input
                  placeholder="Ej: Carmen Rosario"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="rounded-xl border-border/80"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Edad / Sexo:</Label>
                <Input
                  placeholder="Ej: 64a / F"
                  value={formEdadSexo}
                  onChange={(e) => setFormEdadSexo(e.target.value)}
                  className="rounded-xl border-border/80"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tipo de Patología / Consulta:</Label>
                <Select value={formTipo} onValueChange={(v) => setFormTipo(v as TipoConsultaNeumo)}>
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="epoc_gold">EPOC (GOLD 1-4)</SelectItem>
                    <SelectItem value="asma_gina">Asma Bronquial (GINA)</SelectItem>
                    <SelectItem value="nac_curb65">Neumonía Aguda (CURB-65)</SelectItem>
                    <SelectItem value="sahos_apnea">SAHOS / Apnea del Sueño</SelectItem>
                    <SelectItem value="fibrosis_intersticial">Fibrosis Pulmonar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Saturación SpO2 Ambiente (%):</Label>
                <Input
                  type="number"
                  min={50}
                  max={100}
                  value={formSpO2}
                  onChange={(e) => setFormSpO2(e.target.value)}
                  className="rounded-xl border-border/80"
                />
              </div>
            </div>

            {/* Campos Específicos para EPOC */}
            {formTipo === "epoc_gold" && (
              <div className="p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 space-y-3 text-xs">
                <span className="font-semibold text-cyan-800 dark:text-cyan-300 block">
                  Parámetros Espirométricos EPOC:
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[11px]">FEV1 % Predicho:</Label>
                    <Input
                      type="number"
                      value={formFEV1}
                      onChange={(e) => setFormFEV1(e.target.value)}
                      className="rounded-lg h-8 text-xs border-border/80"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">FEV1 (Litros):</Label>
                    <Input
                      type="number"
                      step="0.05"
                      value={formFEV1Litros}
                      onChange={(e) => setFormFEV1Litros(e.target.value)}
                      className="rounded-lg h-8 text-xs border-border/80"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">FVC (Litros):</Label>
                    <Input
                      type="number"
                      step="0.05"
                      value={formFVC}
                      onChange={(e) => setFormFVC(e.target.value)}
                      className="rounded-lg h-8 text-xs border-border/80"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label className="text-[11px]">Escala mMRC (0-4):</Label>
                    <Input
                      type="number"
                      min={0}
                      max={4}
                      value={formMMRC}
                      onChange={(e) => setFormMMRC(e.target.value)}
                      className="rounded-lg h-8 text-xs border-border/80"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      id="formIngreso"
                      checked={formIngresoPrevio}
                      onChange={(e) => setFormIngresoPrevio(e.target.checked)}
                      className="rounded h-4 w-4 text-cyan-600 focus:ring-cyan-500"
                    />
                    <label htmlFor="formIngreso" className="text-[11px] cursor-pointer">
                      ¿Ingreso por EPOC previo?
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Oxigenoterapia (Opcional):</Label>
              <Input
                placeholder="Ej: Cánula binasal continua 2 LPM / Venturi al 28%"
                value={formO2}
                onChange={(e) => setFormO2(e.target.value)}
                className="rounded-xl border-border/80"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Diagnóstico Clínico / CIE-10:</Label>
              <Textarea
                placeholder="Ej: EPOC Grado GOLD 3 Grupo E con bronquiectasias sobreagregadas (J44.1)"
                value={formDiag}
                onChange={(e) => setFormDiag(e.target.value)}
                rows={2}
                className="rounded-xl border-border/80 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Plan de Conducta & Prescripción:</Label>
              <Textarea
                placeholder="Plan farmacológico, inhaladores, oxígeno medicinal y seguimiento..."
                value={formPlan}
                onChange={(e) => setFormPlan(e.target.value)}
                rows={3}
                className="rounded-xl border-border/80 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalNueva(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-medium">
                Guardar Consulta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DETALLE DE CONSULTA */}
      <Dialog open={!!consultaDetalle} onOpenChange={() => setConsultaDetalle(null)}>
        {consultaDetalle && (
          <DialogContent className="max-w-xl rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wind className="h-5 w-5 text-cyan-600" />
                Informe Neumológico - {consultaDetalle.paciente_nombre}
              </DialogTitle>
              <DialogDescription>
                Fecha de evaluación: {consultaDetalle.fecha} • {consultaDetalle.edad_sexo}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-3 gap-2 bg-muted/40 p-3 rounded-xl">
                <div>
                  <span className="text-muted-foreground block text-[10px]">SpO2 Ambiente:</span>
                  <span className="font-bold text-foreground text-sm">{consultaDetalle.spO2_ambiente}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">FEV1 % Pred:</span>
                  <span className="font-bold text-foreground text-sm">
                    {consultaDetalle.fev1_predicho_pct ? `${consultaDetalle.fev1_predicho_pct}%` : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">mMRC Disnea:</span>
                  <span className="font-bold text-foreground text-sm">
                    {consultaDetalle.mmrc_score !== undefined ? `Grado ${consultaDetalle.mmrc_score}` : "N/A"}
                  </span>
                </div>
              </div>

              {consultaDetalle.estadio_gold && (
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl space-y-1">
                  <span className="font-bold text-cyan-800 dark:text-cyan-300">
                    Estratificación: {consultaDetalle.estadio_gold}
                  </span>
                  {consultaDetalle.grupo_gold && (
                    <p className="text-cyan-700 dark:text-cyan-400">
                      Grupo Clínico: <strong>Grupo {consultaDetalle.grupo_gold}</strong>
                    </p>
                  )}
                </div>
              )}

              {consultaDetalle.oxigenoterapia && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <strong className="text-indigo-800 dark:text-indigo-300">Oxigenoterapia Prescrita:</strong>
                  <p className="text-indigo-700 dark:text-indigo-400 mt-0.5">{consultaDetalle.oxigenoterapia}</p>
                </div>
              )}

              <div className="space-y-1">
                <span className="font-bold text-foreground block">Diagnóstico Principal:</span>
                <p className="p-3 bg-muted/20 border border-border/80 rounded-xl leading-relaxed">
                  {consultaDetalle.diagnostico}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-foreground block">Conducta & Prescripción Neumológica:</span>
                <p className="p-3 bg-muted/20 border border-border/80 rounded-xl leading-relaxed whitespace-pre-wrap">
                  {consultaDetalle.plan_conducta}
                </p>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => window.print()} className="rounded-xl">
                Imprimir Informe
              </Button>
              <Button onClick={() => setConsultaDetalle(null)} className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white">
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
