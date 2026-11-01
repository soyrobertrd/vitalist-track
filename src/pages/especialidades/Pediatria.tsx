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
  Calculator,
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Syringe,
  Wind,
  Smile,
  Activity,
  Stethoscope,
} from "lucide-react";

import {
  FichaConsultaPediatricaDetalle,
  ConsultaPediatricaData,
} from "@/components/especialidades/pediatria/FichaConsultaPediatricaDetalle";
import { CensoPediatricoList } from "@/components/especialidades/pediatria/CensoPediatricoList";
import { CalculadoraPercentilesPedia } from "@/components/especialidades/pediatria/CalculadoraPercentilesPedia";

export type TipoConsultaPedia =
  | "nino_sano"
  | "respiratorio_asma"
  | "gastroenteritis"
  | "neurodesarrollo"
  | "urgencia_fiebre";

const TIPOS_CONSULTA_PEDIA: { id: TipoConsultaPedia; nombre: string; desc: string }[] = [
  { id: "nino_sano", nombre: "Control de Niño Sano / Puericultura", desc: "Monitoreo de curva de crecimiento OMS, ganancia ponderal y vacunación PAI" },
  { id: "respiratorio_asma", nombre: "Infección Respiratoria / Asma / Bronquiolitis", desc: "Evaluación con Escala Wood-Downes modificada por Ferrés y oxigenoterapia" },
  { id: "gastroenteritis", nombre: "Gastroenteritis & Deshidratación", desc: "Escala clínica de deshidratación OMS (Pliegue, fontanela, lágrimas y SRO)" },
  { id: "neurodesarrollo", nombre: "Hitos del Neurodesarrollo (Denver)", desc: "Desarrollo motor grueso, motor fino adaptativo, lenguaje y social" },
  { id: "urgencia_fiebre", nombre: "Fiebre sin Foco / Síndrome Febril", desc: "Criterios de Rochester/Philadelphia y despistaje bacteriano urgente" },
];

const PACIENTES_PEDIA_MOCK: ConsultaPediatricaData[] = [
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
  const [consultas, setConsultas] = useState<ConsultaPediatricaData[]>(PACIENTES_PEDIA_MOCK);
  const [consultaActivaId, setConsultaActivaId] = useState<string>(PACIENTES_PEDIA_MOCK[0].id);
  const [tabActual, setTabActual] = useState("consultas");

  // Modal Nueva Consulta
  const [modalOpen, setModalOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [edadMeses, setEdadMeses] = useState("12");
  const [sexo, setSexo] = useState<"M" | "F">("M");
  const [tutor, setTutor] = useState("");
  const [tipoSel, setTipoSel] = useState<TipoConsultaPedia>("nino_sano");
  const [peso, setPeso] = useState("10.0");
  const [talla, setTalla] = useState("75.0");
  const [pc, setPc] = useState("46.0");
  const [vacunas, setVacunas] = useState(true);
  const [diagnostico, setDiagnostico] = useState("");
  const [conducta, setConducta] = useState("");

  // Wood-Downes Evaluador
  const [wdSibilancias, setWdSibilancias] = useState(1);
  const [wdTiraje, setWdTiraje] = useState(1);
  const [wdFr, setWdFr] = useState(1);
  const [wdFc, setWdFc] = useState(1);
  const [wdVentilacion, setWdVentilacion] = useState(1);
  const [wdCianosis, setWdCianosis] = useState(0);

  const scoreWoodDownes = wdSibilancias + wdTiraje + wdFr + wdFc + wdVentilacion + wdCianosis;

  const percentilEstimado = useMemo(() => {
    const p = parseFloat(peso) || 10;
    const m = parseInt(edadMeses) || 12;
    const esperado = 3.3 + m * 0.55;
    if (p < esperado * 0.85) return "< p15 (Bajo Peso)";
    if (p > esperado * 1.15) return "> p85 (Sobrepeso)";
    return "p50 (Eutrófico)";
  }, [peso, edadMeses]);

  const consultaSeleccionada = useMemo(() => {
    return consultas.find((c) => c.id === consultaActivaId) || consultas[0] || null;
  }, [consultas, consultaActivaId]);

  const tipoConsultaNombre = useMemo(() => {
    if (!consultaSeleccionada) return "";
    return TIPOS_CONSULTA_PEDIA.find((t) => t.id === consultaSeleccionada.tipo_consulta)?.nombre;
  }, [consultaSeleccionada]);

  // Resumen Rápido (Quick Status Strip)
  const vacunasAlDiaCount = consultas.filter((c) => c.vacunas_al_dia).length;
  const pctVacunas = Math.round((vacunasAlDiaCount / (consultas.length || 1)) * 100);
  const crisisRespiratoriasCount = consultas.filter(
    (c) => c.score_wood_downes !== undefined && c.score_wood_downes >= 4
  ).length;

  const handleCopiarInforme = (c: ConsultaPediatricaData) => {
    const texto = `👶 *INFORME DE CONSULTA PEDIÁTRICA & PUERICULTURA*
👤 *Paciente:* ${c.paciente_nombre} (${c.edad_meses} meses)
👨‍👩‍👧 *Tutor Responsable:* ${c.tutor_nombre}
📅 *Fecha:* ${format(new Date(c.fecha), "dd/MM/yyyy hh:mm a")}

📊 *Antropometría & Percentiles OMS:*
- Peso: ${c.peso_kg} kg (Percentil: ${c.percentil_peso_edad})
- Talla: ${c.talla_cm} cm (Percentil: ${c.percentil_talla_edad})
- Perímetro Cefálico: ${c.pc_cm ? `${c.pc_cm} cm` : "N/D"}
- Vacunación PAI: ${c.vacunas_al_dia ? "✅ Al día" : "⚠️ Incompleta / Pendiente"}
${c.score_wood_downes !== undefined ? `- Escala Wood-Downes: ${c.score_wood_downes} puntos\n` : ""}
🩺 *Diagnóstico Clínico:*
${c.diagnostico}

📝 *Conducta & Pauta Médica:*
${c.plan_conducta}

🏥 *Vitalist Track — Salud Pediátrica Integral*`;

    navigator.clipboard.writeText(texto);
    toast.success("Informe copiado al portapapeles", {
      description: `Listo para enviar por WhatsApp al tutor de ${c.paciente_nombre}`,
    });
  };

  const handleGuardarConsulta = () => {
    if (!nuevoNombre.trim()) {
      toast.error("El nombre del infante es obligatorio");
      return;
    }

    const nueva: ConsultaPediatricaData = {
      id: `PED-${Math.floor(100 + Math.random() * 900)}`,
      paciente_nombre: nuevoNombre,
      edad_meses: parseInt(edadMeses) || 12,
      sexo,
      tutor_nombre: tutor || "Tutor No Registrado",
      tipo_consulta: tipoSel,
      fecha: new Date().toISOString(),
      peso_kg: parseFloat(peso) || 10,
      talla_cm: parseFloat(talla) || 75,
      pc_cm: parseFloat(pc) || undefined,
      percentil_peso_edad: percentilEstimado,
      percentil_talla_edad: "p50",
      score_wood_downes: tipoSel === "respiratorio_asma" ? 4 : undefined,
      vacunas_al_dia: vacunas,
      diagnostico: diagnostico || "Evaluación pediátrica de control. Sin hallazgos patológicos.",
      plan_conducta: conducta || "Continuar alimentación adecuada para la edad y esquema de vacunación.",
    };

    setConsultas([nueva, ...consultas]);
    setConsultaActivaId(nueva.id);
    toast.success(`Consulta pediátrica registrada para ${nuevoNombre}`, {
      description: `Percentil: ${percentilEstimado} | Vacunación: ${vacunas ? "Al día" : "Pendiente"}`,
    });

    setModalOpen(false);
    setNuevoNombre("");
    setTutor("");
    setDiagnostico("");
    setConducta("");
  };

  return (
    <div className="space-y-4">
      {/* Cabecera Clínica Intencional (Reglas de la casa: Antetítulo sin fondo) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Especialidad Clínica · AEP / OMS Pediatric Guidelines
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Baby className="h-6 w-6 text-primary" />
              Pediatría & Puericultura
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Control de crecimiento y desarrollo OMS, curvas percentilares, triaje respiratorio Wood-Downes y carnet PAI.
          </p>
        </div>

        {/* Acciones Superiores */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="rounded-xl h-9 text-xs bg-primary text-primary-foreground font-medium shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nueva Consulta Pediátrica
          </Button>
        </div>
      </div>

      {/* Quick Status Strip (Métricas Compactas en vez de 4 cards gigantescas que saturan) */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 px-3 rounded-xl bg-muted/20 border border-border/60 text-xs">
        <div className="flex items-center gap-1.5 shrink-0 pr-3 border-r border-border/60">
          <Syringe className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-muted-foreground">Esquema Vacunal:</span>
          <span className="font-bold text-foreground font-mono">{pctVacunas}%</span>
          <span className="text-[10px] text-muted-foreground">({vacunasAlDiaCount}/{consultas.length})</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 px-3 border-r border-border/60">
          <Wind className={`h-3.5 w-3.5 ${crisisRespiratoriasCount > 0 ? "text-rose-600" : "text-muted-foreground"}`} />
          <span className="text-muted-foreground">Alertas Respiratorias:</span>
          <span className={`font-bold font-mono ${crisisRespiratoriasCount > 0 ? "text-rose-600" : "text-foreground"}`}>
            {crisisRespiratoriasCount}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 px-3 border-r border-border/60">
          <Smile className="h-3.5 w-3.5 text-blue-600" />
          <span className="text-muted-foreground">Niño Sano:</span>
          <span className="font-bold text-foreground font-mono">
            {consultas.filter((c) => c.tipo_consulta === "nino_sano").length}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pl-3 ml-auto text-muted-foreground text-[11px]">
          <Stethoscope className="h-3 w-3 text-primary" />
          <span>{consultas.length} pacientes en censo activo</span>
        </div>
      </div>

      {/* Navegación por Tabs Operativas */}
      <Tabs value={tabActual} onValueChange={setTabActual} className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:w-auto h-9">
          <TabsTrigger value="consultas" className="text-xs">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Censo & Ficha ({consultas.length})
          </TabsTrigger>
          <TabsTrigger value="calculadora" className="text-xs">
            <Calculator className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
            Curvas OMS & Calculadora
          </TabsTrigger>
          <TabsTrigger value="wood_downes" className="text-xs">
            <Wind className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
            Escala Wood-Downes
          </TabsTrigger>
          <TabsTrigger value="vacunacion" className="text-xs">
            <Syringe className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
            Carnet Vacunal RD (PAI)
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Censo & Ficha de Consulta Pediátrica (Master-Detail Arquetipo 16) */}
        <TabsContent value="consultas" className="space-y-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Panel Izquierdo: Censo de Pacientes (4.5 cols) */}
            <div className="lg:col-span-5 xl:col-span-4">
              <Card className="rounded-2xl border-border/80 shadow-none h-full">
                <CardHeader className="p-3.5 pb-2 border-b border-border/60">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                      <Baby className="h-4 w-4 text-primary" />
                      Censo de Pacientes Pediátricos
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-mono rounded-full">
                      {consultas.length} infantes
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3.5">
                  <CensoPediatricoList
                    consultas={consultas}
                    consultaSeleccionadaId={consultaSeleccionada?.id || null}
                    onSelectConsulta={(c) => setConsultaActivaId(c.id)}
                    tiposConsulta={TIPOS_CONSULTA_PEDIA}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Panel Derecho: Ficha Detallada de la Consulta (7.5 cols) */}
            <div className="lg:col-span-7 xl:col-span-8">
              <FichaConsultaPediatricaDetalle
                consulta={consultaSeleccionada}
                onCopiarInforme={handleCopiarInforme}
                tipoConsultaNombre={tipoConsultaNombre}
              />
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: Calculadora Antropométrica en Vivo */}
        <TabsContent value="calculadora" className="space-y-3">
          <CalculadoraPercentilesPedia
            onAplicarAConsulta={(data) => {
              setPeso(data.peso.toString());
              setTalla(data.talla.toString());
              setModalOpen(true);
            }}
          />
        </TabsContent>

        {/* TAB 3: Escala Wood-Downes para Asma / Bronquiolitis */}
        <TabsContent value="wood_downes" className="space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-none">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Wind className="h-4 w-4 text-purple-600" />
                    Escala de Wood-Downes Modificada por Ferrés
                  </CardTitle>
                  <CardDescription>
                    Puntuación clínica objetiva (0 a 18 pts) para estratificar crisis obstructiva bronquial y necesidad de oxígeno o UCI.
                  </CardDescription>
                </div>
                <Badge
                  className={`text-xs px-2.5 py-1 ${
                    scoreWoodDownes >= 8
                      ? "bg-rose-600 text-white animate-pulse"
                      : scoreWoodDownes >= 4
                      ? "bg-amber-600 text-white"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  {scoreWoodDownes >= 8
                    ? "Crisis Severa (Ingreso UCI)"
                    : scoreWoodDownes >= 4
                    ? "Crisis Moderada (Observación)"
                    : "Crisis Leve (Ambulatorio)"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-border/70 space-y-1.5 bg-card">
                  <Label className="text-xs font-semibold">1. Sibilancias Auscultatorias</Label>
                  <Select value={wdSibilancias.toString()} onValueChange={(val) => setWdSibilancias(parseInt(val))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 pts: Ausentes</SelectItem>
                      <SelectItem value="1">1 pto: Final de la espiración</SelectItem>
                      <SelectItem value="2">2 pts: Toda la espiración</SelectItem>
                      <SelectItem value="3">3 pts: Inspiratorias y espiratorias (o tórax silente)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 rounded-xl border border-border/70 space-y-1.5 bg-card">
                  <Label className="text-xs font-semibold">2. Tiraje / Retracciones</Label>
                  <Select value={wdTiraje.toString()} onValueChange={(val) => setWdTiraje(parseInt(val))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 pts: Ausente</SelectItem>
                      <SelectItem value="1">1 pto: Subcostal o intercostal leve</SelectItem>
                      <SelectItem value="2">2 pts: Tiraje universal moderado</SelectItem>
                      <SelectItem value="3">3 pts: Severo + aleteo nasal y balanceo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 rounded-xl border border-border/70 space-y-1.5 bg-card">
                  <Label className="text-xs font-semibold">3. Frecuencia Respiratoria</Label>
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

                <div className="p-3 rounded-xl border border-border/70 space-y-1.5 bg-card">
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

                <div className="p-3 rounded-xl border border-border/70 space-y-1.5 bg-card">
                  <Label className="text-xs font-semibold">5. Entrada de Aire / Murmullo</Label>
                  <Select value={wdVentilacion.toString()} onValueChange={(val) => setWdVentilacion(parseInt(val))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 pts: Buena y simétrica</SelectItem>
                      <SelectItem value="1">1 pto: Ligeramente disminuida</SelectItem>
                      <SelectItem value="2">2 pts: Muy disminuida bilateral</SelectItem>
                      <SelectItem value="3">3 pts: Tórax silente / Apenas audible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 rounded-xl border border-border/70 space-y-1.5 bg-card">
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

              {/* Dictamen Terapéutico */}
              <div className="p-4 rounded-xl border border-primary/25 bg-primary/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">
                    Puntuación Obtenida: <span className="font-mono text-lg text-primary">{scoreWoodDownes} / 18 pts</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {scoreWoodDownes <= 3
                      ? "Crisis Leve: Manejo ambulatorio con Salbutamol (2-4 puffs con cámara espaciadora c/4-6h) y vigilancia de signos de alarma."
                      : scoreWoodDownes <= 7
                      ? "Crisis Moderada: Salbutamol nebulizado/inhalado cada 20 min x 3 dosis, Corticoide oral (Prednisolona 1-2 mg/kg), oxígeno para mantener SatO2 ≥ 94% y reevaluación clínica en 1h."
                      : "Crisis Severa / Emergencia: Oxigenoterapia de alto flujo o VNI, Bromuro de ipratropio + Salbutamol continuo, Sulfato de magnesio IV e interconsulta urgente a UCI pediátrica."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: Carnet PAI República Dominicana */}
        <TabsContent value="vacunacion" className="space-y-3">
          <Card className="rounded-2xl border-border/80 shadow-none">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Syringe className="h-4 w-4 text-emerald-600" />
                Esquema Nacional de Vacunación PAI (República Dominicana / OMS)
              </CardTitle>
              <CardDescription>
                Cronograma oficial obligatorio de inmunización infantil supervisado por el Ministerio de Salud Pública.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-border/70 space-y-1.5 bg-card">
                  <Badge variant="outline" className="border-blue-500/40 text-blue-600 bg-blue-500/5 text-[10px]">
                    Recién Nacido
                  </Badge>
                  <p className="font-bold text-foreground">BCG & Hepatitis B Pediátrica</p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Dosis única de BCG intradérmica y primera dosis de hepatitis B antes del alta de maternidad.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-border/70 space-y-1.5 bg-card">
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/5 text-[10px]">
                    2 y 4 Meses
                  </Badge>
                  <p className="font-bold text-foreground">Pentavalente + IPV + Rotavirus + Neumococo</p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    DTP, Haemophilus influenzae b, HepB, Polio inactivada, Rotavirus oral y Neumococo conjugado.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-border/70 space-y-1.5 bg-card">
                  <Badge variant="outline" className="border-purple-500/40 text-purple-600 bg-purple-500/5 text-[10px]">
                    6 Meses
                  </Badge>
                  <p className="font-bold text-foreground">Pentavalente 3 + OPV + Influenza</p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Tercera dosis del esquema primario pentavalente, polio oral y primera dosis de influenza estacional.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-border/70 space-y-1.5 bg-card">
                  <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-500/5 text-[10px]">
                    12 a 18 Meses
                  </Badge>
                  <p className="font-bold text-foreground">SPR (Triple Viral) + Refuerzo DTP / Polio</p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Sarampión, Rubeola y Paperas al cumplir 1 año. Primer refuerzo de DTP y Polio a los 18 meses.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Nueva Consulta Pediátrica */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Baby className="h-5 w-5 text-primary" />
              Nueva Consulta Pediátrica & Control
            </DialogTitle>
            <DialogDescription>
              Evaluación antropométrica OMS, control del desarrollo y registro de consulta.
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
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Sexo</Label>
                <Select value={sexo} onValueChange={(val: "M" | "F") => setSexo(val)}>
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
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tutor / Familiar Responsable</Label>
                <Input
                  placeholder="Ej: Laura Vargas (Madre)"
                  value={tutor}
                  onChange={(e) => setTutor(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tipo de Consulta Pediátrica</Label>
              <Select value={tipoSel} onValueChange={(val: TipoConsultaPedia) => setTipoSel(val)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_CONSULTA_PEDIA.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Antropometría OMS Rápida */}
            <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                <Activity className="h-4 w-4" /> Antropometría OMS & Percentil Estimado
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Peso (kg) *</Label>
                  <Input type="number" step="0.1" value={peso} onChange={(e) => setPeso(e.target.value)} className="h-8 text-xs font-mono" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Talla (cm) *</Label>
                  <Input type="number" step="0.5" value={talla} onChange={(e) => setTalla(e.target.value)} className="h-8 text-xs font-mono" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Per. Cefálico (cm)</Label>
                  <Input type="number" step="0.5" value={pc} onChange={(e) => setPc(e.target.value)} className="h-8 text-xs font-mono" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Percentil Calculado</Label>
                  <Input value={percentilEstimado} disabled className="h-8 bg-muted text-[11px] font-mono font-bold text-primary" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl border border-border/70">
              <input
                type="checkbox"
                id="vacunas_check"
                checked={vacunas}
                onChange={(e) => setVacunas(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="vacunas_check" className="text-xs cursor-pointer flex-1">
                <strong>Vacunación Al Día (Esquema PAI):</strong> El paciente cuenta con todas las dosis correspondientes a su edad.
              </label>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Diagnóstico Pediátrico</Label>
              <Input
                placeholder="Ej: Lactante eutrófico en percentil p50. Sin signos de alarma."
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Plan de Conducta & Recomendaciones</Label>
              <Textarea
                placeholder="Pautas de alimentación, estimulación y fecha de próximo control..."
                value={conducta}
                onChange={(e) => setConducta(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} className="rounded-xl h-8 text-xs">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleGuardarConsulta} className="rounded-xl h-8 text-xs bg-primary text-primary-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Guardar Consulta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
