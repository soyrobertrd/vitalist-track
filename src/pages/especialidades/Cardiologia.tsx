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
  Heart,
  HeartPulse,
  Activity,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  Plus,
  Search,
  ShieldAlert,
  Flame,
  FileText,
  User,
  Clock,
  Pill,
  Zap
} from "lucide-react";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

export type TipoConsultaCardio =
  | "primera_vez"
  | "hipertension_refractaria"
  | "insuficiencia_cardiaca"
  | "fibrilacion_auricular"
  | "post_infarto_isquemico";

interface ConsultaCardiologica {
  id: string;
  paciente_nombre: string;
  edad_sexo: string;
  tipo_consulta: TipoConsultaCardio;
  fecha: string;
  ta: string;
  pam: number;
  fc: number;
  fevi?: number;
  nyha_clase: "I" | "II" | "III" | "IV";
  cha2ds2_score: number;
  hasbled_score: number;
  riesgo_framingham: "bajo" | "moderado" | "alto";
  tratamiento_actual: string;
  plan_conducta: string;
}

const TIPOS_CONSULTA_CARDIO: { id: TipoConsultaCardio; nombre: string; desc: string }[] = [
  { id: "primera_vez", nombre: "Primera Vez / Evaluación Inicial", desc: "Despistaje de riesgo coronario y examen cardiovascular integral" },
  { id: "hipertension_refractaria", nombre: "Hipertensión Arterial Refractaria", desc: "Monitoreo MAPA/AMPA y combinación de 3+ antihipertensivos" },
  { id: "insuficiencia_cardiaca", nombre: "Insuficiencia Cardíaca (IC)", desc: "Optimización de cuádruple terapia (iSGLT2, ARNI, BB, ARM) y FEVI" },
  { id: "fibrilacion_auricular", nombre: "Fibrilación Auricular / Arritmias", desc: "Estratificación tromboembólica CHA2DS2-VASc y control de ritmo/frecuencia" },
  { id: "post_infarto_isquemico", nombre: "Post-Síndrome Coronario Agudo", desc: "Doble antiagregación plaquetaria, estatinas de alta potencia y eco" },
];

const PACIENTES_CARDIO_MOCK: ConsultaCardiologica[] = [
  {
    id: "CARD-001",
    paciente_nombre: "Danilo Antonio Morillo",
    edad_sexo: "67a / M",
    tipo_consulta: "fibrilacion_auricular",
    fecha: new Date(Date.now() - 3600000 * 3).toISOString(),
    ta: "135/85",
    pam: 102,
    fc: 88,
    fevi: 45,
    nyha_clase: "II",
    cha2ds2_score: 4,
    hasbled_score: 2,
    riesgo_framingham: "alto",
    tratamiento_actual: "Apixabán 5mg c/12h, Bisoprolol 5mg/d, Enalapril 10mg/d",
    plan_conducta: "Anticoagulación oral mantenida (CHA2DS2=4). Control de FA con respuesta ventricular adecuada.",
  },
  {
    id: "CARD-002",
    paciente_nombre: "Carmen Milagros De La Cruz",
    edad_sexo: "72a / F",
    tipo_consulta: "insuficiencia_cardiaca",
    fecha: new Date(Date.now() - 3600000 * 24).toISOString(),
    ta: "115/70",
    pam: 85,
    fc: 64,
    fevi: 32,
    nyha_clase: "III",
    cha2ds2_score: 5,
    hasbled_score: 1,
    riesgo_framingham: "alto",
    tratamiento_actual: "Sacubitrilo/Valsartán 49/51mg, Empagliflozina 10mg, Carvedilol 12.5mg, Espironolactona 25mg",
    plan_conducta: "Cuádruple terapia optimizada. Mejoría de ortopnea; evaluar titulación de ARNI en 4 semanas.",
  },
  {
    id: "CARD-003",
    paciente_nombre: "Marcos Julio Batista",
    edad_sexo: "53a / M",
    tipo_consulta: "hipertension_refractaria",
    fecha: new Date(Date.now() - 3600000 * 48).toISOString(),
    ta: "155/95",
    pam: 115,
    fc: 76,
    fevi: 58,
    nyha_clase: "I",
    cha2ds2_score: 2,
    hasbled_score: 1,
    riesgo_framingham: "moderado",
    tratamiento_actual: "Amlodipino 10mg + Olmesartán 40mg + Hidroclorotiazida 12.5mg",
    plan_conducta: "HTA Grado 2 persistente. Añadir Espironolactona 25mg como 4to fármaco para HTA resistente.",
  },
];

export default function Cardiologia() {
  const [consultas, setConsultas] = useState<ConsultaCardiologica[]>(PACIENTES_CARDIO_MOCK);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [tabActual, setTabActual] = useState("consultas");

  // Modal Nueva Consulta
  const [modalOpen, setModalOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaEdadSexo, setNuevaEdadSexo] = useState("60a / M");
  const [tipoSel, setTipoSel] = useState<TipoConsultaCardio>("insuficiencia_cardiaca");
  const [pas, setPas] = useState("130");
  const [pad, setPad] = useState("80");
  const [fc, setFc] = useState("72");
  const [fevi, setFevi] = useState("50");
  const [nyha, setNyha] = useState<ConsultaCardiologica["nyha_clase"]>("II");
  const [tratamiento, setTratamiento] = useState("");
  const [conducta, setConducta] = useState("");

  // Calculadora CHA2DS2-VASc
  const [cIcc, setCIcc] = useState(false);
  const [cHta, setCHta] = useState(false);
  const [cEdad75, setCEdad75] = useState(false);
  const [cDm, setCDm] = useState(false);
  const [cAcv, setCAcv] = useState(false);
  const [cVasc, setCVasc] = useState(false);
  const [cEdad65, setCEdad65] = useState(false);
  const [cFem, setCFem] = useState(false);

  // Cálculo dinámico de CHA2DS2-VASc
  const scoreCha2ds2 = useMemo(() => {
    let s = 0;
    if (cIcc) s += 1;
    if (cHta) s += 1;
    if (cEdad75) s += 2;
    if (cDm) s += 1;
    if (cAcv) s += 2;
    if (cVasc) s += 1;
    if (cEdad65 && !cEdad75) s += 1;
    if (cFem) s += 1;
    return s;
  }, [cIcc, cHta, cEdad75, cDm, cAcv, cVasc, cEdad65, cFem]);

  // Cálculo PAM
  const pamCalculada = useMemo(() => {
    const s = parseFloat(pas) || 120;
    const d = parseFloat(pad) || 80;
    return Math.round(d + (s - d) / 3);
  }, [pas, pad]);

  const handleGuardarConsulta = () => {
    if (!nuevoNombre.trim()) {
      toast.error("Ingrese el nombre del paciente.");
      return;
    }

    const nueva: ConsultaCardiologica = {
      id: `CARD-${Date.now().toString().slice(-3)}`,
      paciente_nombre: nuevoNombre,
      edad_sexo: nuevaEdadSexo,
      tipo_consulta: tipoSel,
      fecha: new Date().toISOString(),
      ta: `${pas}/${pad}`,
      pam: pamCalculada,
      fc: parseInt(fc) || 72,
      fevi: parseInt(fevi) || 50,
      nyha_clase: nyha,
      cha2ds2_score: scoreCha2ds2,
      hasbled_score: 1,
      riesgo_framingham: scoreCha2ds2 >= 3 ? "alto" : scoreCha2ds2 >= 1 ? "moderado" : "bajo",
      tratamiento_actual: tratamiento || "En formulación",
      plan_conducta: conducta || "Control programado en 6 semanas",
    };

    setConsultas([nueva, ...consultas]);
    toast.success(`Consulta cardiológica registrada para ${nuevoNombre}`, {
      description: `CHA2DS2-VASc: ${scoreCha2ds2} pts | NYHA: Clase ${nyha}`,
    });

    setModalOpen(false);
    setNuevoNombre("");
  };

  const consultasFiltradas = consultas.filter((c) => {
    const matchBusqueda =
      c.paciente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.tratamiento_actual.toLowerCase().includes(busqueda.toLowerCase());
    const matchTipo = filtroTipo === "todos" ? true : c.tipo_consulta === filtroTipo;
    return matchBusqueda && matchTipo;
  });

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="Cardiología & Salud Cardiovascular"
        subtitle="Consultas especializadas por patología, estratificación de riesgo CHA2DS2-VASc, clases funcionales NYHA y monitoreo de falla cardíaca"
        icon={HeartPulse}
        badge="AHA / ESC Clinical Guidelines"
        action={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva Consulta Cardiológica
          </Button>
        }
      />

      {/* KPIs de la Especialidad */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ClinicalKpiCard
          title="Falla Cardíaca (NYHA III-IV)"
          value={consultas.filter((c) => c.nyha_clase === "III" || c.nyha_clase === "IV").length}
          subtitle="Pacientes con limitación funcional marcada"
          icon={Heart}
          variant="rose"
          alert={consultas.filter((c) => c.nyha_clase === "III" || c.nyha_clase === "IV").length > 0}
        />
        <ClinicalKpiCard
          title="Fibrilación Auricular (CHA2DS2 ≥ 2)"
          value={consultas.filter((c) => c.cha2ds2_score >= 2).length}
          subtitle="Candidatos a Anticoagulación Oral (ACOD)"
          icon={Zap}
          variant="amber"
        />
        <ClinicalKpiCard
          title="Presión Arterial Media Promedio"
          value="98 mmHg"
          subtitle="Meta clínica &lt; 100 mmHg en reposo"
          icon={Activity}
          variant="teal"
        />
        <ClinicalKpiCard
          title="Total Consultas Registradas"
          value={consultas.length}
          subtitle="Seguimiento activo en cardiología"
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
            <TabsTrigger value="escalas" className="text-xs sm:text-sm">
              <Calculator className="h-4 w-4 mr-1.5" />
              Calculadora CHA2DS2 / NYHA
            </TabsTrigger>
            <TabsTrigger value="protocolos" className="text-xs sm:text-sm">
              <ShieldAlert className="h-4 w-4 mr-1.5" />
              Guías Terapéuticas
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente o fármaco..."
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
                {TIPOS_CONSULTA_CARDIO.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tab 1: Listado de Consultas */}
        <TabsContent value="consultas" className="space-y-3">
          {consultasFiltradas.map((c) => {
            const tipoInfo = TIPOS_CONSULTA_CARDIO.find((t) => t.id === c.tipo_consulta);
            return (
              <Card key={c.id} className="border-border/80 hover:shadow-sm transition-all">
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base">{c.paciente_nombre}</span>
                        <span className="text-xs text-muted-foreground font-mono">({c.edad_sexo})</span>
                        <Badge variant="outline" className="text-xs border-rose-500/30 text-rose-600 bg-rose-500/5">
                          {tipoInfo?.nombre}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Fecha: {format(new Date(c.fecha), "dd/MM/yyyy hh:mm a")} · Ref: <span className="font-mono">{c.id}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                        NYHA Clase {c.nyha_clase}
                      </Badge>
                      <Badge
                        className={
                          c.cha2ds2_score >= 2
                            ? "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30"
                            : "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                        }
                      >
                        CHA2DS2-VASc: {c.cha2ds2_score} pts
                      </Badge>
                    </div>
                  </div>

                  {/* Parámetros hemodinámicos condensados */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-muted/40 p-2.5 rounded-xl text-xs font-mono">
                    <div>
                      <span className="text-muted-foreground">TA:</span> <strong className="text-foreground">{c.ta} mmHg</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">PAM:</span> <strong className="text-foreground">{c.pam} mmHg</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">FC:</span> <strong className="text-foreground">{c.fc} lpm</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">FEVI:</span> <strong className={c.fevi && c.fevi < 40 ? "text-red-500 font-bold" : "text-foreground"}>{c.fevi ? `${c.fevi}%` : "No disp."}</strong>
                    </div>
                  </div>

                  {/* Tratamiento y Plan */}
                  <div className="space-y-1 text-xs">
                    <p>
                      <strong className="text-muted-foreground">Tratamiento actual:</strong>{" "}
                      <span className="text-foreground font-medium">{c.tratamiento_actual}</span>
                    </p>
                    <p>
                      <strong className="text-muted-foreground">Conducta clínica:</strong>{" "}
                      <span className="text-foreground">{c.plan_conducta}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Tab 2: Calculadora CHA2DS2-VASc & NYHA */}
        <TabsContent value="escalas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-5 w-5 text-rose-500" />
                Calculadora CHA2DS2-VASc (Riesgo Tromboembólico en Fibrilación Auricular)
              </CardTitle>
              <CardDescription>
                Puntuación clínica estandarizada por la ESC/AHA para determinar necesidad de Anticoagulación Oral (ACOD).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/80 hover:bg-muted/40 cursor-pointer">
                  <input type="checkbox" checked={cIcc} onChange={(e) => setCIcc(e.target.checked)} className="rounded" />
                  <span><strong>C</strong> - Insuficiencia Cardíaca Congestiva / FEVI ≤ 40% (+1)</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/80 hover:bg-muted/40 cursor-pointer">
                  <input type="checkbox" checked={cHta} onChange={(e) => setCHta(e.target.checked)} className="rounded" />
                  <span><strong>H</strong> - Hipertensión Arterial (+1)</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/80 hover:bg-muted/40 cursor-pointer">
                  <input type="checkbox" checked={cEdad75} onChange={(e) => setCEdad75(e.target.checked)} className="rounded" />
                  <span><strong>A2</strong> - Edad ≥ 75 años (+2)</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/80 hover:bg-muted/40 cursor-pointer">
                  <input type="checkbox" checked={cDm} onChange={(e) => setCDm(e.target.checked)} className="rounded" />
                  <span><strong>D</strong> - Diabetes Mellitus (+1)</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/80 hover:bg-muted/40 cursor-pointer">
                  <input type="checkbox" checked={cAcv} onChange={(e) => setCAcv(e.target.checked)} className="rounded" />
                  <span><strong>S2</strong> - ACV previo, AIT o Tromboembolismo (+2)</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/80 hover:bg-muted/40 cursor-pointer">
                  <input type="checkbox" checked={cVasc} onChange={(e) => setCVasc(e.target.checked)} className="rounded" />
                  <span><strong>V</strong> - Enfermedad Vascular (IAM previo, EVP, placa aórtica) (+1)</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/80 hover:bg-muted/40 cursor-pointer">
                  <input type="checkbox" checked={cEdad65} onChange={(e) => setCEdad65(e.target.checked)} className="rounded" />
                  <span><strong>A</strong> - Edad entre 65 y 74 años (+1)</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/80 hover:bg-muted/40 cursor-pointer">
                  <input type="checkbox" checked={cFem} onChange={(e) => setCFem(e.target.checked)} className="rounded" />
                  <span><strong>Sc</strong> - Categoría de Sexo Femenino (+1)</span>
                </label>
              </div>

              {/* Dictamen del Score */}
              <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Puntuación CHA2DS2-VASc: <span className="font-mono text-xl text-rose-600">{scoreCha2ds2} pts</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {scoreCha2ds2 >= 2
                      ? "⚠️ ALTO RIESGO EMBÓLICO: Indicación formal de Anticoagulación Oral (ACOD: Apixabán, Rivaroxabán o Dabigatrán)."
                      : scoreCha2ds2 === 1
                      ? "⚡ RIESGO MODERADO: Considerar anticoagulación oral según perfil individual."
                      : "✅ BAJO RIESGO: No se recomienda terapia antitrombótica de rutina."}
                  </p>
                </div>
                <Badge className={scoreCha2ds2 >= 2 ? "bg-red-600 text-white" : "bg-emerald-600 text-white"}>
                  {scoreCha2ds2 >= 2 ? "Anticoagular (Clase I)" : "Bajo Riesgo"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Guías y Cuádruple Terapia en IC */}
        <TabsContent value="protocolos" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-600" />
                Los 4 Pilares Farmacológicos en Falla Cardíaca con FEVI Reducida (HFrEF)
              </CardTitle>
              <CardDescription>
                Tratamiento basado en evidencia que reduce mortalidad cardiovascular y hospitalizaciones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-border/80 space-y-1">
                  <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300">Pilar 1 - ARNI / IECA</Badge>
                  <p className="font-semibold text-foreground">Sacubitrilo / Valsartán</p>
                  <p className="text-muted-foreground">Inhibidor de neprilisina y receptor de angiotensina II. Dosis inicio: 24/26mg o 49/51mg c/12h.</p>
                </div>
                <div className="p-3 rounded-xl border border-border/80 space-y-1">
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">Pilar 2 - Betabloqueante</Badge>
                  <p className="font-semibold text-foreground">Bisoprolol / Carvedilol</p>
                  <p className="text-muted-foreground">Disminución de tono simpático y remodelado adverso. Titular progresivamente cada 2 semanas.</p>
                </div>
                <div className="p-3 rounded-xl border border-border/80 space-y-1">
                  <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300">Pilar 3 - Antagonista ARM</Badge>
                  <p className="font-semibold text-foreground">Espironolactona / Eplerenona</p>
                  <p className="text-muted-foreground">Monitoreo de potasio sérico (meta K &lt; 5.0 mEq/L) y función renal basal.</p>
                </div>
                <div className="p-3 rounded-xl border border-border/80 space-y-1">
                  <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300">Pilar 4 - iSGLT2</Badge>
                  <p className="font-semibold text-foreground">Empagliflozina / Dapagliflozina</p>
                  <p className="text-muted-foreground">10 mg al día. Beneficio hemodinámico independiente de la presencia de diabetes.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Nueva Consulta Cardiológica */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <HeartPulse className="h-5 w-5 text-rose-500" />
              Nueva Consulta Cardiológica Especializada
            </DialogTitle>
            <DialogDescription>
              Registro clínico estructurado con evaluación hemodinámica y estratificación de riesgo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nombre Completo del Paciente *</Label>
                <Input
                  placeholder="Ej: Julio César Domínguez"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Edad / Sexo</Label>
                <Input
                  value={nuevaEdadSexo}
                  onChange={(e) => setNuevaEdadSexo(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tipo de Consulta Cardiológica</Label>
              <Select value={tipoSel} onValueChange={(val: any) => setTipoSel(val)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_CONSULTA_CARDIO.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Parámetros Hemodinámicos */}
            <div className="p-3 rounded-xl border bg-muted/20 space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-rose-500" /> Parámetros Vitales y Ecocardiograma
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div>
                  <Label className="text-[11px] text-muted-foreground">PAS (mmHg)</Label>
                  <Input value={pas} onChange={(e) => setPas(e.target.value)} className="h-8" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">PAD (mmHg)</Label>
                  <Input value={pad} onChange={(e) => setPad(e.target.value)} className="h-8" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">PAM Calculada</Label>
                  <Input value={`${pamCalculada} mmHg`} disabled className="h-8 bg-muted font-mono" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">FC (lpm)</Label>
                  <Input value={fc} onChange={(e) => setFc(e.target.value)} className="h-8" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">FEVI (%)</Label>
                  <Input value={fevi} onChange={(e) => setFevi(e.target.value)} className="h-8" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Clase Funcional NYHA (Insuficiencia Cardíaca)</Label>
              <Select value={nyha} onValueChange={(val: any) => setNyha(val)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="I">Clase I: Sin limitación de actividad física ordinaria</SelectItem>
                  <SelectItem value="II">Clase II: Limitación ligera; cómodo en reposo</SelectItem>
                  <SelectItem value="III">Clase III: Limitación marcada; síntomas con mínima actividad</SelectItem>
                  <SelectItem value="IV">Clase IV: Incapacidad de realizar actividad física; síntomas en reposo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tratamiento Farmacológico Actual / Ajuste</Label>
              <Input
                placeholder="Ej: Sacubitrilo/Valsartán 49/51mg, Empagliflozina 10mg, Carvedilol 12.5mg..."
                value={tratamiento}
                onChange={(e) => setTratamiento(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Conducta Clínica & Estudios Solicitados</Label>
              <Textarea
                placeholder="Ecocardiograma transtorácico, Holter 24h, analíticas con NT-proBNP..."
                value={conducta}
                onChange={(e) => setConducta(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
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
