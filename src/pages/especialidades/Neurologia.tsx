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
  Brain,
  Activity,
  Zap,
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
} from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

export type TipoConsultaNeuro =
  | "codigo_acv"
  | "cefalea_migrana"
  | "epilepsia_convulsion"
  | "parkinson_movimiento"
  | "deterioro_cognitivo";

interface ConsultaNeurologica {
  id: string;
  paciente_nombre: string;
  edad_sexo: string;
  tipo_consulta: TipoConsultaNeuro;
  fecha: string;
  glasgow_score: number;
  nihss_score?: number;
  fuerza_daniels: "5/5 (Normal)" | "4/5 (Vence gravedad y resistencia leve)" | "3/5 (Vence gravedad)" | "2/5 (Sin vencer gravedad)" | "1/5 (Contracción mínima)" | "0/5 (Plejía)";
  ventana_tiempo_horas?: number;
  diagnostico: string;
  plan_conducta: string;
}

const MOCK_CONSULTAS_NEURO: ConsultaNeurologica[] = [
  {
    id: "neu-01",
    paciente_nombre: "Danilo Castillo Mora",
    edad_sexo: "64a / M",
    tipo_consulta: "codigo_acv",
    fecha: "2026-10-29",
    glasgow_score: 14,
    nihss_score: 9,
    fuerza_daniels: "3/5 (Vence gravedad)",
    ventana_tiempo_horas: 2.5,
    diagnostico: "Ictus Isquémico ACM Izquierda en ventana / Afasia motora leve y hemiparesia braquial",
    plan_conducta: "Angio-TAC cerebral urgente, candidato a trombolisis IV con rtPA (Alteplasa 0.9 mg/kg) e ingreso a UCI Neuro.",
  },
  {
    id: "neu-02",
    paciente_nombre: "Lucía Fernández Almonte",
    edad_sexo: "32a / F",
    tipo_consulta: "cefalea_migrana",
    fecha: "2026-10-28",
    glasgow_score: 15,
    fuerza_daniels: "5/5 (Normal)",
    diagnostico: "Migraña episódica de alta frecuencia con aura visual refractaria a AINEs",
    plan_conducta: "Inicio de profilaxis con Topiramato 25mg/noche, rescate con Zolmitriptán 2.5mg y diario de cefaleas.",
  },
  {
    id: "neu-03",
    paciente_nombre: "Don Ramón Antonio Henríquez",
    edad_sexo: "71a / M",
    tipo_consulta: "parkinson_movimiento",
    fecha: "2026-10-27",
    glasgow_score: 15,
    fuerza_daniels: "5/5 (Normal)",
    diagnostico: "Enfermedad de Parkinson estadio II de Hoehn & Yahr (predominio temblor derecho y rigidez)",
    plan_conducta: "Ajuste de Levodopa/Carbidopa 100/25mg cada 8h, inicio de terapia física de marcha y equilibrio.",
  },
];

export default function Neurologia() {
  const [consultas, setConsultas] = useState<ConsultaNeurologica[]>(MOCK_CONSULTAS_NEURO);
  const [tab, setTab] = useState<"consultas" | "calculadora_nihss" | "escala_glasgow">("consultas");
  const [search, setSearch] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todas");
  const [modalOpen, setModalOpen] = useState(false);

  // Estados de Calculadora NIHSS
  const [nihssConciencia, setNihssConciencia] = useState(0); // 0-3
  const [nihssPreguntas, setNihssPreguntas] = useState(0); // 0-2
  const [nihssOrdenes, setNihssOrdenes] = useState(0); // 0-2
  const [nihssMirada, setNihssMirada] = useState(0); // 0-2
  const [nihssVisual, setNihssVisual] = useState(0); // 0-3
  const [nihssFacial, setNihssFacial] = useState(0); // 0-3
  const [nihssMotorBrazoIzq, setNihssMotorBrazoIzq] = useState(0); // 0-4
  const [nihssMotorBrazoDer, setNihssMotorBrazoDer] = useState(0); // 0-4
  const [nihssMotorPiernaIzq, setNihssMotorPiernaIzq] = useState(0); // 0-4
  const [nihssMotorPiernaDer, setNihssMotorPiernaDer] = useState(0); // 0-4
  const [nihssAtaxia, setNihssAtaxia] = useState(0); // 0-2
  const [nihssSensibilidad, setNihssSensibilidad] = useState(0); // 0-2
  const [nihssLenguaje, setNihssLenguaje] = useState(0); // 0-3
  const [nihssDisartria, setNihssDisartria] = useState(0); // 0-2
  const [nihssNegligencia, setNihssNegligencia] = useState(0); // 0-2

  const totalNihss = useMemo(() => {
    return (
      nihssConciencia +
      nihssPreguntas +
      nihssOrdenes +
      nihssMirada +
      nihssVisual +
      nihssFacial +
      nihssMotorBrazoIzq +
      nihssMotorBrazoDer +
      nihssMotorPiernaIzq +
      nihssMotorPiernaDer +
      nihssAtaxia +
      nihssSensibilidad +
      nihssLenguaje +
      nihssDisartria +
      nihssNegligencia
    );
  }, [
    nihssConciencia,
    nihssPreguntas,
    nihssOrdenes,
    nihssMirada,
    nihssVisual,
    nihssFacial,
    nihssMotorBrazoIzq,
    nihssMotorBrazoDer,
    nihssMotorPiernaIzq,
    nihssMotorPiernaDer,
    nihssAtaxia,
    nihssSensibilidad,
    nihssLenguaje,
    nihssDisartria,
    nihssNegligencia,
  ]);

  // Estados de Glasgow
  const [glasgowOcular, setGlasgowOcular] = useState(4); // 1-4
  const [glasgowVerbal, setGlasgowVerbal] = useState(5); // 1-5
  const [glasgowMotor, setGlasgowMotor] = useState(6); // 1-6

  const totalGlasgow = useMemo(() => {
    return glasgowOcular + glasgowVerbal + glasgowMotor;
  }, [glasgowOcular, glasgowVerbal, glasgowMotor]);

  // Formulario de nueva consulta
  const [form, setForm] = useState({
    paciente_nombre: "",
    edad_sexo: "",
    tipo_consulta: "codigo_acv" as TipoConsultaNeuro,
    glasgow_score: 15,
    nihss_score: 0,
    fuerza_daniels: "5/5 (Normal)" as ConsultaNeurologica["fuerza_daniels"],
    ventana_tiempo_horas: 1.5,
    diagnostico: "",
    plan_conducta: "",
  });

  const handleCrearConsulta = () => {
    if (!form.paciente_nombre || !form.diagnostico) {
      toast.error("Debe ingresar el nombre del paciente y diagnóstico");
      return;
    }

    const nueva: ConsultaNeurologica = {
      id: `neu-${Date.now()}`,
      paciente_nombre: form.paciente_nombre,
      edad_sexo: form.edad_sexo || "Adulto",
      tipo_consulta: form.tipo_consulta,
      fecha: new Date().toISOString().slice(0, 10),
      glasgow_score: Number(form.glasgow_score),
      nihss_score: form.tipo_consulta === "codigo_acv" ? Number(form.nihss_score) : undefined,
      fuerza_daniels: form.fuerza_daniels,
      ventana_tiempo_horas: form.tipo_consulta === "codigo_acv" ? Number(form.ventana_tiempo_horas) : undefined,
      diagnostico: form.diagnostico,
      plan_conducta: form.plan_conducta,
    };

    setConsultas([nueva, ...consultas]);
    toast.success("Consulta neurológica registrada");
    setModalOpen(false);
  };

  const filteredConsultas = useMemo(() => {
    return consultas.filter((c) => {
      const matchSearch =
        !search ||
        c.paciente_nombre.toLowerCase().includes(search.toLowerCase()) ||
        c.diagnostico.toLowerCase().includes(search.toLowerCase());
      const matchTipo = filtroTipo === "todas" || c.tipo_consulta === filtroTipo;
      return matchSearch && matchTipo;
    });
  }, [consultas, search, filtroTipo]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Modo B */}
      <ClinicalPageHeader
        title="Neurología Clínica & Neurocirugía"
        subtitle="Protocolo Código ACV, calculadora de severidad del ictus (NIHSS 0-42), Escala de Glasgow y evaluación motora"
        icon={Brain}
        badge="Especialidad Neurovascular"
        action={
          <Button
            onClick={() => setModalOpen(true)}
            size="sm"
            className="rounded-xl gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4" /> Registrar Consulta Neurológica
          </Button>
        }
      />

      {/* KPIs Clínicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Casos Código ACV"
          value={consultas.filter((c) => c.tipo_consulta === "codigo_acv").length}
          subtitle="Ventana trombolisis < 4.5 horas"
          icon={Zap}
          variant="amber"
        />
        <ClinicalKpiCard
          title="Glasgow Promedio"
          value="14.6 / 15"
          subtitle="Nivel de alerta y reactividad"
          icon={Activity}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Seguimiento Epilepsias"
          value={consultas.filter((c) => c.tipo_consulta === "epilepsia_convulsion").length}
          subtitle="Ajuste de anticonvulsivantes"
          icon={Brain}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Trastornos Movimiento"
          value={consultas.filter((c) => c.tipo_consulta === "parkinson_movimiento").length}
          subtitle="Parkinson & Temblor esencial"
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* Pestañas */}
      <Tabs value={tab} onValueChange={(v: any) => setTab(v)} className="space-y-4">
        <TabsList className="bg-muted/40 p-1.5 rounded-2xl border border-border/70 flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="consultas" className="rounded-xl px-4 py-2 text-xs font-semibold gap-1.5">
            <FileText className="h-4 w-4 text-purple-600" />
            Consultas & Pacientes
          </TabsTrigger>
          <TabsTrigger value="calculadora_nihss" className="rounded-xl px-4 py-2 text-xs font-semibold gap-1.5">
            <Zap className="h-4 w-4 text-amber-600" />
            Calculadora NIHSS (Ictus / ACV)
          </TabsTrigger>
          <TabsTrigger value="escala_glasgow" className="rounded-xl px-4 py-2 text-xs font-semibold gap-1.5">
            <Calculator className="h-4 w-4 text-blue-600" />
            Escala de Coma de Glasgow
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CONSULTAS */}
        <TabsContent value="consultas" className="space-y-4 mt-0">
          <Card className="rounded-2xl border-border/80 shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente, sospecha ACV, diagnóstico..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 rounded-xl border-border/80 text-xs"
                />
              </div>

              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-[200px] rounded-xl border-border/80 text-xs">
                  <SelectValue placeholder="Tipo de Patología" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las patologías</SelectItem>
                  <SelectItem value="codigo_acv">Código ACV / Ictus</SelectItem>
                  <SelectItem value="cefalea_migrana">Cefaleas & Migrañas</SelectItem>
                  <SelectItem value="epilepsia_convulsion">Epilepsia & Convulsión</SelectItem>
                  <SelectItem value="parkinson_movimiento">Parkinson & Movimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/20 px-6 py-3.5 border-b border-border/80 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" /> Registro de Atenciones Neurológicas
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {filteredConsultas.length} Evaluaciones
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                      <TableHead className="text-xs font-semibold">Paciente / Fecha</TableHead>
                      <TableHead className="text-xs font-semibold">Tipo Patología</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Glasgow</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Score NIHSS</TableHead>
                      <TableHead className="text-xs font-semibold">Fuerza Daniels</TableHead>
                      <TableHead className="text-xs font-semibold">Diagnóstico Neurológico</TableHead>
                      <TableHead className="text-xs font-semibold">Conducta / Trombolisis</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConsultas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                          No hay atenciones neurológicas registradas con los filtros aplicados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredConsultas.map((c) => (
                        <TableRow key={c.id} className="hover:bg-muted/20 text-xs">
                          <TableCell>
                            <div className="font-semibold text-foreground">{c.paciente_nombre}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {c.edad_sexo} · {c.fecha}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] capitalize font-medium ${
                                c.tipo_consulta === "codigo_acv"
                                  ? "bg-rose-500/10 text-rose-700 border-rose-500/30"
                                  : "bg-purple-500/10 text-purple-700 border-purple-500/30"
                              }`}
                            >
                              {c.tipo_consulta.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-bold font-mono">
                            {c.glasgow_score} / 15
                          </TableCell>
                          <TableCell className="text-center">
                            {c.nihss_score !== undefined ? (
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold ${
                                  c.nihss_score > 15
                                    ? "bg-rose-500/15 text-rose-700 border-rose-500/40"
                                    : "bg-amber-500/15 text-amber-700 border-amber-500/40"
                                }`}
                              >
                                {c.nihss_score} pts
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-[11px] font-medium">{c.fuerza_daniels}</TableCell>
                          <TableCell className="font-medium text-foreground max-w-[200px]">
                            {c.diagnostico}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[220px]">
                            {c.plan_conducta}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: CALCULADORA NIHSS */}
        <TabsContent value="calculadora_nihss" className="space-y-4 mt-0">
          <Card className="rounded-2xl border-border/80 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-600" /> Escala NIHSS — Cuantificación del Ictus Isquémico
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Estándar internacional para definir severidad y elegibilidad de terapia trombolítica IV (&lt;4.5h).
                </p>
              </div>

              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 text-center">
                <div className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300">Total NIHSS</div>
                <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400">
                  {totalNihss} <span className="text-xs font-normal">/ 42 pts</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">1a. Nivel de Conciencia</Label>
                <Select value={String(nihssConciencia)} onValueChange={(v) => setNihssConciencia(Number(v))}>
                  <SelectTrigger className="rounded-xl border-border/80 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0: Alerta / Responde inmediatamente</SelectItem>
                    <SelectItem value="1">1: Somnoliento pero estimulable</SelectItem>
                    <SelectItem value="2">2: Estuporoso / Requiere estímulo doloroso</SelectItem>
                    <SelectItem value="3">3: Coma / Sin respuesta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">1b. Preguntas (Mes & Edad)</Label>
                <Select value={String(nihssPreguntas)} onValueChange={(v) => setNihssPreguntas(Number(v))}>
                  <SelectTrigger className="rounded-xl border-border/80 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0: Ambas respuestas correctas</SelectItem>
                    <SelectItem value="1">1: Una respuesta correcta</SelectItem>
                    <SelectItem value="2">2: Ninguna correcta / Afasia global</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">1c. Órdenes (Abrir ojos / Cerrar puño)</Label>
                <Select value={String(nihssOrdenes)} onValueChange={(v) => setNihssOrdenes(Number(v))}>
                  <SelectTrigger className="rounded-xl border-border/80 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0: Realiza ambas tareas bien</SelectItem>
                    <SelectItem value="1">1: Realiza una tarea bien</SelectItem>
                    <SelectItem value="2">2: No realiza ninguna tarea</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">2. Mirada Conjugada Horizontal</Label>
                <Select value={String(nihssMirada)} onValueChange={(v) => setNihssMirada(Number(v))}>
                  <SelectTrigger className="rounded-xl border-border/80 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0: Movimientos oculares normales</SelectItem>
                    <SelectItem value="1">1: Paresia parcial de la mirada</SelectItem>
                    <SelectItem value="2">2: Desviación forzada de la mirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">3. Campos Visuales (Campimetría)</Label>
                <Select value={String(nihssVisual)} onValueChange={(v) => setNihssVisual(Number(v))}>
                  <SelectTrigger className="rounded-xl border-border/80 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0: Sin pérdida visual</SelectItem>
                    <SelectItem value="1">1: Hemianopsia parcial</SelectItem>
                    <SelectItem value="2">2: Hemianopsia homónima completa</SelectItem>
                    <SelectItem value="3">3: Ceguera bilateral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">4. Parálisis Facial</Label>
                <Select value={String(nihssFacial)} onValueChange={(v) => setNihssFacial(Number(v))}>
                  <SelectTrigger className="rounded-xl border-border/80 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0: Movimiento simétrico normal</SelectItem>
                    <SelectItem value="1">1: Paresia menor (borramiento surco nasogeniano)</SelectItem>
                    <SelectItem value="2">2: Parálisis facial inferior</SelectItem>
                    <SelectItem value="3">3: Parálisis facial completa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">5a. Motor Brazo Izquierdo (10 seg)</Label>
                <Select value={String(nihssMotorBrazoIzq)} onValueChange={(v) => setNihssMotorBrazoIzq(Number(v))}>
                  <SelectTrigger className="rounded-xl border-border/80 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0: Mantiene 10 seg sin claudicar</SelectItem>
                    <SelectItem value="1">1: Claudica antes de 10 seg pero no cae</SelectItem>
                    <SelectItem value="2">2: Cae a la cama antes de 10 seg</SelectItem>
                    <SelectItem value="3">3: Sin esfuerzo contra gravedad</SelectItem>
                    <SelectItem value="4">4: Plejía / Ningún movimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">5b. Motor Brazo Derecho (10 seg)</Label>
                <Select value={String(nihssMotorBrazoDer)} onValueChange={(v) => setNihssMotorBrazoDer(Number(v))}>
                  <SelectTrigger className="rounded-xl border-border/80 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0: Mantiene 10 seg sin claudicar</SelectItem>
                    <SelectItem value="1">1: Claudica antes de 10 seg pero no cae</SelectItem>
                    <SelectItem value="2">2: Cae a la cama antes de 10 seg</SelectItem>
                    <SelectItem value="3">3: Sin esfuerzo contra gravedad</SelectItem>
                    <SelectItem value="4">4: Plejía / Ningún movimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">6a. Motor Pierna Izquierda (5 seg)</Label>
                <Select value={String(nihssMotorPiernaIzq)} onValueChange={(v) => setNihssMotorPiernaIzq(Number(v))}>
                  <SelectTrigger className="rounded-xl border-border/80 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0: Mantiene 5 seg a 30°</SelectItem>
                    <SelectItem value="1">1: Claudica antes de 5 seg</SelectItem>
                    <SelectItem value="2">2: Cae a la cama antes de 5 seg</SelectItem>
                    <SelectItem value="3">3: Movimiento lateral sin gravedad</SelectItem>
                    <SelectItem value="4">4: Plejía completa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">6b. Motor Pierna Derecha (5 seg)</Label>
                <Select value={String(nihssMotorPiernaDer)} onValueChange={(v) => setNihssMotorPiernaDer(Number(v))}>
                  <SelectTrigger className="rounded-xl border-border/80 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0: Mantiene 5 seg a 30°</SelectItem>
                    <SelectItem value="1">1: Claudica antes de 5 seg</SelectItem>
                    <SelectItem value="2">2: Cae a la cama antes de 5 seg</SelectItem>
                    <SelectItem value="3">3: Movimiento lateral sin gravedad</SelectItem>
                    <SelectItem value="4">4: Plejía completa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">9. Lenguaje / Afasia</Label>
                <Select value={String(nihssLenguaje)} onValueChange={(v) => setNihssLenguaje(Number(v))}>
                  <SelectTrigger className="rounded-xl border-border/80 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0: Sin afasia / Fluidez normal</SelectItem>
                    <SelectItem value="1">1: Afasia leve a moderada</SelectItem>
                    <SelectItem value="2">2: Afasia severa</SelectItem>
                    <SelectItem value="3">3: Mutismo o afasia global</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">11. Inatención / Extinción</Label>
                <Select value={String(nihssNegligencia)} onValueChange={(v) => setNihssNegligencia(Number(v))}>
                  <SelectTrigger className="rounded-xl border-border/80 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0: Normal / Sin negligencia</SelectItem>
                    <SelectItem value="1">1: Inatención a una modalidad sensorial</SelectItem>
                    <SelectItem value="2">2: Hemi-inatención profunda bilateral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clasificación de Severidad NIHSS */}
            <div
              className={`p-4 rounded-xl border text-xs ${
                totalNihss === 0
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                  : totalNihss <= 4
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-300"
                  : totalNihss <= 15
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300"
              }`}
            >
              <div className="font-bold text-sm">
                Interpretación:{" "}
                {totalNihss === 0
                  ? "Sin déficit neurológico cuantificable"
                  : totalNihss <= 4
                  ? "ACV Isquémico Leve (Déficit menor)"
                  : totalNihss <= 15
                  ? "ACV Isquémico Moderado — Ventana terapéutica crítica de trombolisis rtPA"
                  : totalNihss <= 20
                  ? "ACV Isquémico Moderado a Severo"
                  : "ACV Isquémico Severo / Masivo"}
              </div>
              <p className="mt-1">
                {totalNihss <= 15 && totalNihss >= 5
                  ? "Puntuación idónea para trombolisis endovenosa dentro de 4.5 horas y valorar trombectomía mecánica si hay oclusión de vaso grande (LVO)."
                  : totalNihss > 20
                  ? "Alto riesgo de transformación hemorrágica; evaluar rigurosamente con angio-TC / perfusión."
                  : "Monitorizar progresión del déficit y signos de alarma neurovasculares."}
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 3: ESCALA DE GLASGOW */}
        <TabsContent value="escala_glasgow" className="space-y-4 mt-0">
          <Card className="rounded-2xl border-border/80 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" /> Escala de Coma de Glasgow (GCS)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Valoración del estado de conciencia y gravedad en trauma o compromiso encefálico.
                </p>
              </div>

              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/30 text-center">
                <div className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-300">Puntaje GCS</div>
                <div className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-400">
                  {totalGlasgow} <span className="text-xs font-normal">/ 15</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Respuesta Ocular (E: 1-4)</Label>
                <Select value={String(glasgowOcular)} onValueChange={(v) => setGlasgowOcular(Number(v))}>
                  <SelectTrigger className="rounded-xl border-border/80 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4: Espontánea</SelectItem>
                    <SelectItem value="3">3: Al estímulo verbal</SelectItem>
                    <SelectItem value="2">2: Al estímulo de dolor / presión</SelectItem>
                    <SelectItem value="1">1: Ninguna respuesta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Respuesta Verbal (V: 1-5)</Label>
                <Select value={String(glasgowVerbal)} onValueChange={(v) => setGlasgowVerbal(Number(v))}>
                  <SelectTrigger className="rounded-xl border-border/80 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5: Orientado y conversando</SelectItem>
                    <SelectItem value="4">4: Confuso / Desorientado</SelectItem>
                    <SelectItem value="3">3: Palabras inapropiadas</SelectItem>
                    <SelectItem value="2">2: Sonidos incomprensibles / Gemidos</SelectItem>
                    <SelectItem value="1">1: Ninguna respuesta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Respuesta Motora (M: 1-6)</Label>
                <Select value={String(glasgowMotor)} onValueChange={(v) => setGlasgowMotor(Number(v))}>
                  <SelectTrigger className="rounded-xl border-border/80 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6: Obedece órdenes simples</SelectItem>
                    <SelectItem value="5">5: Localiza el dolor</SelectItem>
                    <SelectItem value="4">4: Retirada en flexión al dolor</SelectItem>
                    <SelectItem value="3">3: Flexión anormal (Decorticación)</SelectItem>
                    <SelectItem value="2">2: Extensión anormal (Descerebración)</SelectItem>
                    <SelectItem value="1">1: Ninguna respuesta / Flacidez</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl border text-xs font-medium ${
                totalGlasgow >= 13
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                  : totalGlasgow >= 9
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300"
              }`}
            >
              <div className="font-bold text-sm">
                {totalGlasgow >= 13
                  ? "Trauma Encefálico Leve (GCS 13-15)"
                  : totalGlasgow >= 9
                  ? "Trauma Encefálico Moderado (GCS 9-12) — Vigilancia estricta de vía aérea"
                  : "Trauma Encefálico Severo / Coma (GCS ≤ 8) — Indicación de intubación orotraqueal y UCI"}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: Nueva Consulta Neurológica */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Brain className="w-5 h-5 text-purple-600" /> Registrar Consulta Neurológica
            </DialogTitle>
            <DialogDescription>
              Complete la evaluación clínica del paciente con scores de Glasgow y fuerza motora.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2 text-xs">
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Nombre Completo del Paciente *</Label>
              <Input
                placeholder="Ej. Danilo Castillo Mora"
                value={form.paciente_nombre}
                onChange={(e) => setForm({ ...form, paciente_nombre: e.target.value })}
                className="rounded-xl border-border/80 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Edad / Sexo</Label>
              <Input
                placeholder="Ej. 64a / M"
                value={form.edad_sexo}
                onChange={(e) => setForm({ ...form, edad_sexo: e.target.value })}
                className="rounded-xl border-border/80 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tipo de Consulta *</Label>
              <Select
                value={form.tipo_consulta}
                onValueChange={(v: any) => setForm({ ...form, tipo_consulta: v })}
              >
                <SelectTrigger className="rounded-xl border-border/80 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="codigo_acv">Código ACV / Ictus Isquémico</SelectItem>
                  <SelectItem value="cefalea_migrana">Cefalea / Migraña</SelectItem>
                  <SelectItem value="epilepsia_convulsion">Epilepsia / Convulsiones</SelectItem>
                  <SelectItem value="parkinson_movimiento">Parkinson / Movimiento</SelectItem>
                  <SelectItem value="deterioro_cognitivo">Deterioro Cognitivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Puntaje Glasgow (GCS: 3-15)</Label>
              <Input
                type="number"
                min="3"
                max="15"
                value={form.glasgow_score}
                onChange={(e) => setForm({ ...form, glasgow_score: Number(e.target.value) })}
                className="rounded-xl border-border/80 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Fuerza Motora (Escala Daniels)</Label>
              <Select
                value={form.fuerza_daniels}
                onValueChange={(v: any) => setForm({ ...form, fuerza_daniels: v })}
              >
                <SelectTrigger className="rounded-xl border-border/80 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5/5 (Normal)">5/5 (Normal)</SelectItem>
                  <SelectItem value="4/5 (Vence gravedad y resistencia leve)">4/5 (Vence gravedad y resistencia)</SelectItem>
                  <SelectItem value="3/5 (Vence gravedad)">3/5 (Vence gravedad sin resistencia)</SelectItem>
                  <SelectItem value="2/5 (Sin vencer gravedad)">2/5 (Desplaza sin vencer gravedad)</SelectItem>
                  <SelectItem value="1/5 (Contracción mínima)">1/5 (Contracción mínima)</SelectItem>
                  <SelectItem value="0/5 (Plejía)">0/5 (Plejía completa)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.tipo_consulta === "codigo_acv" && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Score NIHSS Calculado (0-42)</Label>
                  <Input
                    type="number"
                    value={form.nihss_score}
                    onChange={(e) => setForm({ ...form, nihss_score: Number(e.target.value) })}
                    className="rounded-xl border-border/80 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Horas desde Inicio de Síntomas</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={form.ventana_tiempo_horas}
                    onChange={(e) => setForm({ ...form, ventana_tiempo_horas: Number(e.target.value) })}
                    className="rounded-xl border-border/80 text-xs"
                  />
                </div>
              </>
            )}

            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Diagnóstico Neurológico *</Label>
              <Input
                placeholder="Ej. ACV Isquémico agudo de territorio medio izquierdo"
                value={form.diagnostico}
                onChange={(e) => setForm({ ...form, diagnostico: e.target.value })}
                className="rounded-xl border-border/80 text-xs"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Plan de Conducta & Fármacos</Label>
              <Textarea
                placeholder="Estudios de neuroimagen (Angio-TAC, RMN), antiagregación, estatina, trombolisis..."
                value={form.plan_conducta}
                onChange={(e) => setForm({ ...form, plan_conducta: e.target.value })}
                className="rounded-xl border-border/80 text-xs"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={handleCrearConsulta}
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
            >
              Guardar Consulta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
