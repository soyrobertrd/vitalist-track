import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Baby,
  Activity,
  Calculator,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  ShieldCheck,
  Stethoscope,
  Syringe,
  Wind,
  Smile,
  HeartPulse
} from "lucide-react";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

export type TipoConsultaPedia =
  | "nino_sano"
  | "respiratorio_asma"
  | "gastroenteritis"
  | "neurodesarrollo"
  | "urgencia_fiebre";

interface ConsultaPediatrica {
  id: string;
  paciente_nombre: string;
  edad_meses: number;
  sexo: "M" | "F";
  tutor_nombre: string;
  tipo_consulta: TipoConsultaPedia;
  fecha: string;
  peso_kg: number;
  talla_cm: number;
  pc_cm?: number;
  percentil_peso_edad: string;
  percentil_talla_edad: string;
  score_wood_downes?: number;
  vacunas_al_dia: boolean;
  diagnostico: string;
  plan_conducta: string;
}

const TIPOS_CONSULTA_PEDIA: { id: TipoConsultaPedia; nombre: string; desc: string }[] = [
  { id: "nino_sano", nombre: "Control de Niño Sano / Puericultura", desc: "Monitoreo de curva de crecimiento OMS, ganancia ponderal y vacunación PAI" },
  { id: "respiratorio_asma", nombre: "Infección Respiratoria / Asma / Bronquiolitis", desc: "Evaluación con Escala Wood-Downes modificada por Ferrés y oxigenoterapia" },
  { id: "gastroenteritis", nombre: "Gastroenteritis & Deshidratación", desc: "Escala clínica de deshidratación OMS (Pliegue, fontanela, lágrimas y SRO)" },
  { id: "neurodesarrollo", nombre: "Hitos del Neurodesarrollo (Denver)", desc: "Desarrollo motor grueso, motor fino adaptativo, lenguaje y social" },
  { id: "urgencia_fiebre", nombre: "Fiebre sin Foco / Síndrome Febril", desc: "Criterios de Rochester/Philadelphia y despistaje bacteriano urgente" },
];

const PACIENTES_PEDIA_MOCK: ConsultaPediatrica[] = [
  {
    id: "PED-201",
    paciente_nombre: "Liam Mateo García",
    edad_meses: 18,
    sexo: "M",
    tutor_nombre: "Yomaira García (Madre)",
    tipo_consulta: "nino_sano",
    fecha: new Date(Date.now() - 3600000 * 2).toISOString(),
    peso_kg: 11.5,
    talla_cm: 82.5,
    pc_cm: 47.8,
    percentil_peso_edad: "p50 (Eutrófico)",
    percentil_talla_edad: "p50 (Talla Normal)",
    vacunas_al_dia: true,
    diagnostico: "Crecimiento y desarrollo acorde a edad cronológica.",
    plan_conducta: "Continuar lactancia complementaria rica en hierro y estimulación de lenguaje. Próximo control a los 24 meses.",
  },
  {
    id: "PED-202",
    paciente_nombre: "Mia Isabella Rosario",
    edad_meses: 8,
    sexo: "F",
    tutor_nombre: "Carolina Rosario (Madre)",
    tipo_consulta: "respiratorio_asma",
    fecha: new Date(Date.now() - 3600000 * 18).toISOString(),
    peso_kg: 7.8,
    talla_cm: 68.0,
    pc_cm: 44.0,
    percentil_peso_edad: "p40",
    percentil_talla_edad: "p45",
    score_wood_downes: 5,
    vacunas_al_dia: true,
    diagnostico: "Bronquiolitis aguda por VRS con dificultad respiratoria moderada (Wood-Downes 5).",
    plan_conducta: "Aseo nasal con suero salino hipertónico al 3%, elevación de cabecera a 30° y vigilancia de tiraje intercostal.",
  },
  {
    id: "PED-203",
    paciente_nombre: "Sebastián Núñez Pérez",
    edad_meses: 36,
    sexo: "M",
    tutor_nombre: "Danilo Núñez (Padre)",
    tipo_consulta: "neurodesarrollo",
    fecha: new Date(Date.now() - 3600000 * 40).toISOString(),
    peso_kg: 14.8,
    talla_cm: 95.0,
    pc_cm: 50.0,
    percentil_peso_edad: "p60",
    percentil_talla_edad: "p55",
    vacunas_al_dia: true,
    diagnostico: "Retraso leve en adquisición de lenguaje expresivo. Motricidad gruesa normal.",
    plan_conducta: "Referimiento a estimulación temprana / fonoaudiología y reducción total de pantallas.",
  },
];

export default function Pediatria() {
  const [consultas, setConsultas] = useState<ConsultaPediatrica[]>(PACIENTES_PEDIA_MOCK);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [tabActual, setTabActual] = useState("consultas");

  // Modal nueva consulta
  const [modalOpen, setModalOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [edadMeses, setEdadMeses] = useState("12");
  const [sexo, setSexo] = useState<"M" | "F">("M");
  const [tutor, setTutor] = useState("");
  const [tipoSel, setTipoSel] = useState<TipoConsultaPedia>("nino_sano");
  const [peso, setPeso] = useState("10");
  const [talla, setTalla] = useState("75");
  const [pc, setPc] = useState("46");
  const [vacunas, setVacunas] = useState(true);
  const [diagnostico, setDiagnostico] = useState("");
  const [conducta, setConducta] = useState("");

  // Calculadora Wood-Downes
  const [wdSibilancias, setWdSibilancias] = useState(0);
  const [wdTiraje, setWdTiraje] = useState(0);
  const [wdFr, setWdFr] = useState(0);
  const [wdFc, setWdFc] = useState(0);
  const [wdVentilacion, setWdVentilacion] = useState(0);
  const [wdCianosis, setWdCianosis] = useState(0);

  const scoreWoodDownes = useMemo(() => {
    return wdSibilancias + wdTiraje + wdFr + wdFc + wdVentilacion + wdCianosis;
  }, [wdSibilancias, wdTiraje, wdFr, wdFc, wdVentilacion, wdCianosis]);

  // Estimación sencilla percentiles OMS
  const percentilEstimado = useMemo(() => {
    const p = parseFloat(peso) || 10;
    const m = parseInt(edadMeses) || 12;
    // Peso esperado aprox: edad en meses * 0.5 + 4
    const pesoMedioEsperado = m <= 12 ? 3.3 + m * 0.6 : 8.5 + (m - 12) * 0.2;
    const diff = p - pesoMedioEsperado;
    if (Math.abs(diff) <= 1.0) return "p50 (Eutrófico Normal)";
    if (diff > 1.0 && diff <= 2.5) return "p85 (Sobrepeso Leve)";
    if (diff > 2.5) return "p97 (Obesidad Pediátrica)";
    if (diff < -1.0 && diff >= -2.0) return "p15 (Riesgo Desnutrición)";
    return "p3 (Desnutrición Moderada/Severa)";
  }, [peso, edadMeses]);

  const handleGuardarConsulta = () => {
    if (!nuevoNombre.trim()) {
      toast.error("Ingrese el nombre del infante.");
      return;
    }

    const nueva: ConsultaPediatrica = {
      id: `PED-${Date.now().toString().slice(-3)}`,
      paciente_nombre: nuevoNombre,
      edad_meses: parseInt(edadMeses) || 12,
      sexo,
      tutor_nombre: tutor || "Familiar a cargo",
      tipo_consulta: tipoSel,
      fecha: new Date().toISOString(),
      peso_kg: parseFloat(peso) || 10,
      talla_cm: parseFloat(talla) || 75,
      pc_cm: parseFloat(pc) || 46,
      percentil_peso_edad: percentilEstimado,
      percentil_talla_edad: "p50 (Adecuada)",
      score_wood_downes: tipoSel === "respiratorio_asma" ? scoreWoodDownes : undefined,
      vacunas_al_dia: vacunas,
      diagnostico: diagnostico || "Evaluación pediátrica conforme.",
      plan_conducta: conducta || "Control habitual en fecha indicada.",
    };

    setConsultas([nueva, ...consultas]);
    toast.success(`Consulta pediátrica registrada para ${nuevoNombre}`, {
      description: `Percentil peso/edad: ${percentilEstimado} | Vacunación: ${vacunas ? "Al día" : "Incompleta"}`,
    });

    setModalOpen(false);
    setNuevoNombre("");
  };

  const consultasFiltradas = consultas.filter((c) => {
    const matchBusqueda =
      c.paciente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.tutor_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.diagnostico.toLowerCase().includes(busqueda.toLowerCase());
    const matchTipo = filtroTipo === "todos" ? true : c.tipo_consulta === filtroTipo;
    return matchBusqueda && matchTipo;
  });

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="Pediatría & Puericultura"
        subtitle="Control de crecimiento y desarrollo OMS, curvas percentilares, escala de Wood-Downes para crisis asmática y carnet PAI"
        icon={Baby}
        badge="AEP / OMS Pediatric Guidelines"
        action={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva Consulta Pediátrica
          </Button>
        }
      />

      {/* KPIs Especialidad Pediatría */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ClinicalKpiCard
          title="Esquema Vacunal Al Día (PAI)"
          value={`${Math.round((consultas.filter((c) => c.vacunas_al_dia).length / (consultas.length || 1)) * 100)}%`}
          subtitle={`${consultas.filter((c) => c.vacunas_al_dia).length} de ${consultas.length} pacientes`}
          icon={Syringe}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="Crisis Respiratorias (Wood-Downes)"
          value={consultas.filter((c) => c.score_wood_downes !== undefined && c.score_wood_downes >= 4).length}
          subtitle="Dificultad respiratoria moderada/severa"
          icon={Wind}
          variant="rose"
          alert={consultas.filter((c) => c.score_wood_downes !== undefined && c.score_wood_downes >= 4).length > 0}
        />
        <ClinicalKpiCard
          title="Controles de Niño Sano"
          value={consultas.filter((c) => c.tipo_consulta === "nino_sano").length}
          subtitle="Curvas antropométricas OMS registradas"
          icon={Smile}
          variant="teal"
        />
        <ClinicalKpiCard
          title="Total Consultas Registradas"
          value={consultas.length}
          subtitle="Censo de pacientes pediátricos"
          icon={Stethoscope}
          variant="purple"
        />
      </div>

      <Tabs value={tabActual} onValueChange={setTabActual} className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="consultas" className="text-xs sm:text-sm">
              <FileText className="h-4 w-4 mr-1.5" />
              Consultas ({consultasFiltradas.length})
            </TabsTrigger>
            <TabsTrigger value="wood_downes" className="text-xs sm:text-sm">
              <Calculator className="h-4 w-4 mr-1.5" />
              Escala Wood-Downes
            </TabsTrigger>
            <TabsTrigger value="vacunacion" className="text-xs sm:text-sm">
              <Syringe className="h-4 w-4 mr-1.5" />
              Calendario Vacunal RD (PAI)
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por infante, tutor o diagnóstico..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-44 h-9 text-xs">
                <SelectValue placeholder="Tipo de Consulta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los Tipos</SelectItem>
                {TIPOS_CONSULTA_PEDIA.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tab 1: Censo de Consultas Pediátricas */}
        <TabsContent value="consultas" className="space-y-3">
          {consultasFiltradas.map((c) => {
            const info = TIPOS_CONSULTA_PEDIA.find((t) => t.id === c.tipo_consulta);
            return (
              <Card key={c.id} className="border-border/80 hover:shadow-sm transition-all">
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base">{c.paciente_nombre}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          ({c.edad_meses} meses / {c.sexo === "M" ? "Masculino" : "Femenino"})
                        </span>
                        <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-700 bg-purple-500/5">
                          {info?.nombre}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Tutor: <strong className="text-foreground">{c.tutor_nombre}</strong> · Fecha:{" "}
                        {format(new Date(c.fecha), "dd/MM/yyyy hh:mm a")} · Ref: <span className="font-mono">{c.id}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          c.vacunas_al_dia
                            ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-xs"
                            : "bg-red-500/15 text-red-700 border-red-500/30 text-xs"
                        }
                      >
                        <Syringe className="h-3 w-3 mr-1" />
                        {c.vacunas_al_dia ? "Vacunas PAI Al Día" : "Vacunación Pendiente"}
                      </Badge>
                      {c.score_wood_downes !== undefined && (
                        <Badge
                          className={
                            c.score_wood_downes >= 8
                              ? "bg-red-600 text-white animate-pulse"
                              : c.score_wood_downes >= 4
                              ? "bg-amber-500 text-white"
                              : "bg-emerald-600 text-white"
                          }
                        >
                          Wood-Downes: {c.score_wood_downes} pts
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Datos antropométricos OMS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-muted/40 p-2.5 rounded-xl text-xs font-mono">
                    <div>
                      <span className="text-muted-foreground">Peso:</span> <strong className="text-foreground">{c.peso_kg} kg</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Talla:</span> <strong className="text-foreground">{c.talla_cm} cm</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Per. Cefálico:</span>{" "}
                      <strong className="text-foreground">{c.pc_cm ? `${c.pc_cm} cm` : "N/D"}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Percentil OMS:</span>{" "}
                      <strong className="text-foreground">{c.percentil_peso_edad}</strong>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p>
                      <strong className="text-muted-foreground">Diagnóstico clínico:</strong>{" "}
                      <span className="text-foreground font-medium">{c.diagnostico}</span>
                    </p>
                    <p>
                      <strong className="text-muted-foreground">Plan y pauta médica:</strong>{" "}
                      <span className="text-foreground">{c.plan_conducta}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Tab 2: Escala Wood-Downes Modificada por Ferrés */}
        <TabsContent value="wood_downes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wind className="h-5 w-5 text-purple-600" />
                Escala de Wood-Downes Modificada por Ferrés (Gravedad de Crisis Asmática / Bronquiolitis)
              </CardTitle>
              <CardDescription>
                Puntuación clínica objetiva (0 a 14 puntos) para determinar necesidad de oxigenoterapia o ingreso a UCI pediátrica.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border space-y-1.5">
                  <Label className="text-xs font-semibold">1. Sibilancias Auscultatorias</Label>
                  <Select value={wdSibilancias.toString()} onValueChange={(val) => setWdSibilancias(parseInt(val))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 pts: Ausentes</SelectItem>
                      <SelectItem value="1">1 pto: Final de la espiración</SelectItem>
                      <SelectItem value="2">2 pts: Toda la espiración</SelectItem>
                      <SelectItem value="3">3 pts: Inspiratorias y espiratorias (o silencio por broncoespasmo severo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 rounded-xl border space-y-1.5">
                  <Label className="text-xs font-semibold">2. Tiraje / Retracciones Costales</Label>
                  <Select value={wdTiraje.toString()} onValueChange={(val) => setWdTiraje(parseInt(val))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 pts: Ausente</SelectItem>
                      <SelectItem value="1">1 pto: Subcostal o intercostal leve</SelectItem>
                      <SelectItem value="2">2 pts: Tiraje universal moderado</SelectItem>
                      <SelectItem value="3">3 pts: Tiraje severo + aleteo nasal y balanceo toracoabdominal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 rounded-xl border space-y-1.5">
                  <Label className="text-xs font-semibold">3. Frecuencia Respiratoria (según edad)</Label>
                  <Select value={wdFr.toString()} onValueChange={(val) => setWdFr(parseInt(val))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 pts: Normal para edad (&lt;30 &gt;2a / &lt;40 &lt;2a)</SelectItem>
                      <SelectItem value="1">1 pto: 31-45 (&gt;2a) / 41-55 (&lt;2a)</SelectItem>
                      <SelectItem value="2">2 pts: 46-60 (&gt;2a) / 56-70 (&lt;2a)</SelectItem>
                      <SelectItem value="3">3 pts: &gt;60 (&gt;2a) / &gt;70 (&lt;2a)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 rounded-xl border space-y-1.5">
                  <Label className="text-xs font-semibold">4. Frecuencia Cardíaca</Label>
                  <Select value={wdFc.toString()} onValueChange={(val) => setWdFc(parseInt(val))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 pts: &lt; 120 lpm</SelectItem>
                      <SelectItem value="1">1 pto: 120 a 140 lpm</SelectItem>
                      <SelectItem value="2">2 pts: 141 a 160 lpm</SelectItem>
                      <SelectItem value="3">3 pts: &gt; 160 lpm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 rounded-xl border space-y-1.5">
                  <Label className="text-xs font-semibold">5. Entrada de Aire / Ventilación</Label>
                  <Select value={wdVentilacion.toString()} onValueChange={(val) => setWdVentilacion(parseInt(val))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 pts: Buena y simétrica</SelectItem>
                      <SelectItem value="1">1 pto: Regular o ligeramente disminuida</SelectItem>
                      <SelectItem value="2">2 pts: Muy disminuida bilateral</SelectItem>
                      <SelectItem value="3">3 pts: Tórax silente / Apenas audible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 rounded-xl border space-y-1.5">
                  <Label className="text-xs font-semibold">6. Cianosis</Label>
                  <Select value={wdCianosis.toString()} onValueChange={(val) => setWdCianosis(parseInt(val))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 pts: Ausente (Rosado)</SelectItem>
                      <SelectItem value="1">1 pto: Perioral con el llanto</SelectItem>
                      <SelectItem value="2">2 pts: Perioral en reposo</SelectItem>
                      <SelectItem value="3">3 pts: Generalizada / SatO2 &lt; 90%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dictamen del Score Wood-Downes */}
              <div className="p-4 rounded-xl border border-purple-500/40 bg-purple-500/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Puntuación Wood-Downes: <span className="font-mono text-xl text-purple-600">{scoreWoodDownes} / 18 pts</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {scoreWoodDownes <= 3
                      ? "Crisis Leve (1-3 pts): Manejo ambulatorio con broncodilatador inhalado (Salbutamol con cámara espaciadora)."
                      : scoreWoodDownes <= 7
                      ? "Crisis Moderada (4-7 pts): Observación en urgencias, corticoide oral/IV, oxígeno si SatO2 < 92% y reevaluación en 1 hora."
                      : "Crisis Severa (≥ 8 pts): ¡RIESGO DE PARO RESPIRATORIO! Oxigenoterapia de alto flujo / ventilación, sulfato de magnesio e ingreso a UCI pediátrica."}
                  </p>
                </div>
                <Badge className={scoreWoodDownes >= 8 ? "bg-red-600 text-white animate-pulse" : scoreWoodDownes >= 4 ? "bg-amber-600 text-white" : "bg-emerald-600 text-white"}>
                  {scoreWoodDownes >= 8 ? "Severa (UCI)" : scoreWoodDownes >= 4 ? "Moderada" : "Leve"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Carnet PAI República Dominicana */}
        <TabsContent value="vacunacion" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Syringe className="h-5 w-5 text-emerald-600" />
                Esquema Nacional de Vacunación PAI (Ministerio de Salud Pública RD)
              </CardTitle>
              <CardDescription>
                Cronograma oficial obligatorio para la prevención de enfermedades inmunoprevenibles en República Dominicana.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl border space-y-1">
                  <Badge className="bg-blue-500/10 text-blue-700">Recién Nacido</Badge>
                  <p className="font-semibold text-foreground">BCG & Hepatitis B pediátrica</p>
                  <p className="text-muted-foreground">Dosis única antes del alta de la maternidad hospitalaria.</p>
                </div>
                <div className="p-3 rounded-xl border space-y-1">
                  <Badge className="bg-emerald-500/10 text-emerald-700">2 y 4 Meses</Badge>
                  <p className="font-semibold text-foreground">Pentavalente + IPV + Rotavirus + Neumococo</p>
                  <p className="text-muted-foreground">Protección contra DTP, Hib, HepB, Polio inactivada, diarreas por rotavirus y neumonía.</p>
                </div>
                <div className="p-3 rounded-xl border space-y-1">
                  <Badge className="bg-purple-500/10 text-purple-700">6 Meses</Badge>
                  <p className="font-semibold text-foreground">Pentavalente 3 + OPV + Influenza Estacional</p>
                  <p className="text-muted-foreground">Cierre del esquema primario de pentavalente y polio oral.</p>
                </div>
                <div className="p-3 rounded-xl border space-y-1">
                  <Badge className="bg-amber-500/10 text-amber-700">12 a 18 Meses</Badge>
                  <p className="font-semibold text-foreground">SPR (Triple Viral) + Refuerzo DTP / Polio</p>
                  <p className="text-muted-foreground">Sarampión, Rubeola y Paperas al año, con refuerzo a los 18 meses.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Nueva Consulta Pediátrica */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Baby className="h-5 w-5 text-purple-600" />
              Nueva Consulta Pediátrica Especializada
            </DialogTitle>
            <DialogDescription>
              Evaluación antropométrica OMS, control del desarrollo y registro clínico.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs">Nombre Completo del Infante *</Label>
                <Input
                  placeholder="Ej: Mateo Samuel Vargas"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Sexo</Label>
                <Select value={sexo} onValueChange={(val: any) => setSexo(val)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Edad en Meses *</Label>
                <Input
                  type="number"
                  value={edadMeses}
                  onChange={(e) => setEdadMeses(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tutor / Familiar Acompañante</Label>
                <Input
                  placeholder="Ej: Laura Vargas (Madre)"
                  value={tutor}
                  onChange={(e) => setTutor(e.target.value)}
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tipo de Consulta Pediátrica</Label>
              <Select value={tipoSel} onValueChange={(val: any) => setTipoSel(val)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_CONSULTA_PEDIA.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Antropometría OMS */}
            <div className="p-3 rounded-xl border bg-muted/20 space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-purple-600" /> Antropometría OMS & Curva de Crecimiento
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Peso (kg) *</Label>
                  <Input type="number" step="0.1" value={peso} onChange={(e) => setPeso(e.target.value)} className="h-8" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Talla (cm) *</Label>
                  <Input type="number" step="0.5" value={talla} onChange={(e) => setTalla(e.target.value)} className="h-8" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Per. Cefálico (cm)</Label>
                  <Input type="number" step="0.5" value={pc} onChange={(e) => setPc(e.target.value)} className="h-8" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Percentil Peso</Label>
                  <Input value={percentilEstimado} disabled className="h-8 bg-muted text-[11px] font-mono" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl border">
              <input
                type="checkbox"
                id="vacunas_check"
                checked={vacunas}
                onChange={(e) => setVacunas(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="vacunas_check" className="text-xs cursor-pointer flex-1">
                <strong>Vacunación Al Día según Esquema PAI:</strong> El paciente cuenta con todas las dosis correspondientes a su edad.
              </label>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Diagnóstico Pediátrico</Label>
              <Input
                placeholder="Ej: Lactante eutrófico en percentil p50. Sin signos de alarma."
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Conducta Médica & Consejería Nutricional</Label>
              <Textarea
                placeholder="Pautas de alimentación complementaria, prevención de accidentes en el hogar..."
                value={conducta}
                onChange={(e) => setConducta(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleGuardarConsulta}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Guardar Consulta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
