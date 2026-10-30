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
  Baby,
  Heart,
  Stethoscope,
  Activity,
  Calculator,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Sparkles,
  ShieldCheck,
  User,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { addDays, addMonths, addYears, format, differenceInWeeks, differenceInDays } from "date-fns";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

export type TipoConsultaGineco =
  | "prenatal"
  | "ginecologia_anual"
  | "amenaza_preeclampsia"
  | "menopausia_climaterio"
  | "ecografia_fetal";

interface ConsultaGinecoObstetrica {
  id: string;
  paciente_nombre: string;
  edad_gestacional_semanas?: number;
  tipo_consulta: TipoConsultaGineco;
  fecha: string;
  ta: string;
  peso_kg: number;
  altura_uterina_cm?: number;
  fcf_lpm?: number;
  fum?: string;
  fpp?: string;
  bishop_score?: number;
  tamizaje_pap?: "Negativo / Normal" | "ASC-US" | "LIE de bajo grado" | "Pendiente";
  diagnostico: string;
  plan_conducta: string;
}

const MOCK_CONSULTAS_GINECO: ConsultaGinecoObstetrica[] = [
  {
    id: "gin-01",
    paciente_nombre: "María Elena Santos",
    edad_gestacional_semanas: 34,
    tipo_consulta: "prenatal",
    fecha: "2026-10-28",
    ta: "110/70",
    peso_kg: 68.5,
    altura_uterina_cm: 32,
    fcf_lpm: 142,
    fum: "2026-03-05",
    fpp: "2026-12-12",
    diagnostico: "Gestación de 34 semanas normoevolutiva / Crecimiento fetal armónico",
    plan_conducta: "Control en 2 semanas, perfil biofísico y tamizaje estreptococo grupo B a las 36 sem.",
  },
  {
    id: "gin-02",
    paciente_nombre: "Patricia Gómez Peralta",
    edad_gestacional_semanas: 38,
    tipo_consulta: "amenaza_preeclampsia",
    fecha: "2026-10-29",
    ta: "145/95",
    peso_kg: 74.0,
    altura_uterina_cm: 36,
    fcf_lpm: 138,
    fum: "2026-02-04",
    fpp: "2026-11-11",
    bishop_score: 7,
    diagnostico: "Trastorno hipertensivo gestacional / Sospecha de preeclampsia sin criterios de severidad",
    plan_conducta: "Perfil toxémico de urgencia (plaquetas, TGO, LDH, proteinuria 24h), reposo y maduración cervical.",
  },
  {
    id: "gin-03",
    paciente_nombre: "Carla Mercedes Rosario",
    tipo_consulta: "ginecologia_anual",
    fecha: "2026-10-27",
    ta: "120/80",
    peso_kg: 62.0,
    tamizaje_pap: "Negativo / Normal",
    diagnostico: "Chequeo ginecológico anual / Citología cervical negativa para malignidad",
    plan_conducta: "Autoexamen mamario mensual, control de rutina en 12 meses y ecografía pélvica de control.",
  },
];

export default function GinecologiaObstetricia() {
  const [consultas, setConsultas] = useState<ConsultaGinecoObstetrica[]>(MOCK_CONSULTAS_GINECO);
  const [tab, setTab] = useState<"consultas" | "calculadora_gestacional" | "score_bishop">("consultas");
  const [search, setSearch] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todas");
  const [modalOpen, setModalOpen] = useState(false);

  // Calculadora de Naegele
  const [calcFum, setCalcFum] = useState("2026-04-10");

  const { fppCalculada, semanasGestacion, diasGestacion } = useMemo(() => {
    if (!calcFum) return { fppCalculada: "—", semanasGestacion: 0, diasGestacion: 0 };
    try {
      const fumDate = new Date(calcFum + "T12:00:00");
      // Regla de Naegele: FUM + 7 días - 3 meses + 1 año
      const fpp = addDays(addMonths(addYears(fumDate, 1), -3), 7);
      const hoy = new Date();
      const totalDias = differenceInDays(hoy, fumDate);
      const semanas = Math.floor(totalDias / 7);
      const diasRestantes = totalDias % 7;

      return {
        fppCalculada: format(fpp, "dd 'de' MMMM, yyyy"),
        semanasGestacion: semanas > 0 ? semanas : 0,
        diasGestacion: diasRestantes > 0 ? diasRestantes : 0,
      };
    } catch {
      return { fppCalculada: "—", semanasGestacion: 0, diasGestacion: 0 };
    }
  }, [calcFum]);

  // Escala de Bishop
  const [bishopDilatacion, setBishopDilatacion] = useState(2); // 0 a 3
  const [bishopBorramiento, setBishopBorramiento] = useState(1); // 0 a 3
  const [bishopEstacion, setBishopEstacion] = useState(1); // 0 a 3
  const [bishopConsistencia, setBishopConsistencia] = useState(1); // 0 a 2
  const [bishopPosicion, setBishopPosicion] = useState(1); // 0 a 2

  const totalBishop = useMemo(() => {
    return (
      Number(bishopDilatacion) +
      Number(bishopBorramiento) +
      Number(bishopEstacion) +
      Number(bishopConsistencia) +
      Number(bishopPosicion)
    );
  }, [bishopDilatacion, bishopBorramiento, bishopEstacion, bishopConsistencia, bishopPosicion]);

  // Formulario de nueva consulta
  const [form, setForm] = useState({
    paciente_nombre: "",
    tipo_consulta: "prenatal" as TipoConsultaGineco,
    ta: "120/80",
    peso_kg: 65,
    altura_uterina_cm: 30,
    fcf_lpm: 140,
    fum: "2026-04-01",
    diagnostico: "",
    plan_conducta: "",
  });

  const handleCrearConsulta = () => {
    if (!form.paciente_nombre || !form.diagnostico) {
      toast.error("Debe completar los campos obligatorios");
      return;
    }

    const nueva: ConsultaGinecoObstetrica = {
      id: `gin-${Date.now()}`,
      paciente_nombre: form.paciente_nombre,
      tipo_consulta: form.tipo_consulta,
      fecha: new Date().toISOString().slice(0, 10),
      ta: form.ta,
      peso_kg: Number(form.peso_kg),
      altura_uterina_cm: form.tipo_consulta === "prenatal" ? Number(form.altura_uterina_cm) : undefined,
      fcf_lpm: form.tipo_consulta === "prenatal" ? Number(form.fcf_lpm) : undefined,
      diagnostico: form.diagnostico,
      plan_conducta: form.plan_conducta,
    };

    setConsultas([nueva, ...consultas]);
    toast.success("Consulta gineco-obstétrica registrada");
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
        title="Ginecología & Obstetricia"
        subtitle="Control prenatal gestacional, cálculo de FPP (Naegele), maduración cervical (Bishop) y cribado ginecológico"
        icon={Baby}
        badge="Especialidad Quirúrgica & Materna"
        action={
          <Button
            onClick={() => setModalOpen(true)}
            size="sm"
            className="rounded-xl gap-1.5 bg-rose-600 hover:bg-rose-700 text-white"
          >
            <Plus className="w-4 h-4" /> Nueva Consulta Gineco-Obstétrica
          </Button>
        }
      />

      {/* KPIs Clínicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Consultas Prenatales"
          value={consultas.filter((c) => c.tipo_consulta === "prenatal").length}
          subtitle="Seguimiento activo de embarazo"
          icon={Baby}
          variant="rose"
        />
        <ClinicalKpiCard
          title="Riesgo de Preeclampsia"
          value={consultas.filter((c) => c.tipo_consulta === "amenaza_preeclampsia").length}
          subtitle="Monitoreo tensional y laboratorial"
          icon={AlertTriangle}
          variant="amber"
        />
        <ClinicalKpiCard
          title="Evaluaciones Ginecológicas"
          value={consultas.filter((c) => c.tipo_consulta === "ginecologia_anual").length}
          subtitle="Papanicolaou y salud mamaria"
          icon={Activity}
          variant="purple"
        />
        <ClinicalKpiCard
          title="FCF Promedio"
          value="140 lpm"
          subtitle="Bienestar fetal intrauterino"
          icon={Heart}
          variant="emerald"
        />
      </div>

      {/* Pestañas de la Especialidad */}
      <Tabs value={tab} onValueChange={(v: any) => setTab(v)} className="space-y-4">
        <TabsList className="bg-muted/40 p-1.5 rounded-2xl border border-border/70 flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="consultas" className="rounded-xl px-4 py-2 text-xs font-semibold gap-1.5">
            <FileText className="h-4 w-4 text-rose-600" />
            Consultas Registradas
          </TabsTrigger>
          <TabsTrigger
            value="calculadora_gestacional"
            className="rounded-xl px-4 py-2 text-xs font-semibold gap-1.5"
          >
            <Calendar className="h-4 w-4 text-primary" />
            Calculadora Gestacional & Naegele
          </TabsTrigger>
          <TabsTrigger value="score_bishop" className="rounded-xl px-4 py-2 text-xs font-semibold gap-1.5">
            <Calculator className="h-4 w-4 text-amber-600" />
            Escala de Bishop (Maduración Cervical)
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: LISTADO DE CONSULTAS */}
        <TabsContent value="consultas" className="space-y-4 mt-0">
          <Card className="rounded-2xl border-border/80 shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente, diagnóstico obstétrico..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 rounded-xl border-border/80 text-xs"
                />
              </div>

              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-[200px] rounded-xl border-border/80 text-xs">
                  <SelectValue placeholder="Tipo de Consulta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las consultas</SelectItem>
                  <SelectItem value="prenatal">Control Prenatal</SelectItem>
                  <SelectItem value="amenaza_preeclampsia">Riesgo Preeclampsia</SelectItem>
                  <SelectItem value="ginecologia_anual">Ginecología Anual</SelectItem>
                  <SelectItem value="menopausia_climaterio">Climaterio & Menopausia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/20 px-6 py-3.5 border-b border-border/80 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Baby className="h-4 w-4 text-rose-600" /> Historial de Atenciones Gineco-Obstétricas
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {filteredConsultas.length} Pacientes
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                      <TableHead className="text-xs font-semibold">Paciente / Fecha</TableHead>
                      <TableHead className="text-xs font-semibold">Tipo Consulta</TableHead>
                      <TableHead className="text-xs font-semibold">Tensión Art. / Peso</TableHead>
                      <TableHead className="text-xs font-semibold">Datos Gestacionales</TableHead>
                      <TableHead className="text-xs font-semibold">Diagnóstico Clínico</TableHead>
                      <TableHead className="text-xs font-semibold">Conducta / Plan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConsultas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                          No hay consultas gineco-obstétricas registradas.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredConsultas.map((c) => (
                        <TableRow key={c.id} className="hover:bg-muted/20 text-xs">
                          <TableCell>
                            <div className="font-semibold text-foreground">{c.paciente_nombre}</div>
                            <div className="text-[10px] text-muted-foreground">{c.fecha}</div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] capitalize font-medium ${
                                c.tipo_consulta === "amenaza_preeclampsia"
                                  ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
                                  : "bg-rose-500/10 text-rose-700 border-rose-500/30"
                              }`}
                            >
                              {c.tipo_consulta.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-foreground">{c.ta}</span>
                            <span className="text-[10px] text-muted-foreground block">{c.peso_kg} kg</span>
                          </TableCell>
                          <TableCell>
                            {c.edad_gestacional_semanas ? (
                              <div className="text-[11px]">
                                <span className="font-bold text-rose-600">{c.edad_gestacional_semanas} sem</span>
                                {c.altura_uterina_cm && (
                                  <span className="text-muted-foreground block">
                                    AU: {c.altura_uterina_cm} cm · FCF: {c.fcf_lpm} lpm
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No gestante</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-foreground max-w-[220px]">
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

        {/* TAB 2: CALCULADORA GESTACIONAL (NAEGELE) */}
        <TabsContent value="calculadora_gestacional" className="space-y-4 mt-0">
          <Card className="rounded-2xl border-border/80 shadow-sm p-6">
            <div className="max-w-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-rose-600" /> Regla de Naegele & Edad Gestacional
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Cálculo estandarizado según la Organización Mundial de la Salud (OMS) a partir de la Fecha de Última
                  Menstruación (FUM).
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Fecha de Última Menstruación (FUM) *</Label>
                <Input
                  type="date"
                  value={calcFum}
                  onChange={(e) => setCalcFum(e.target.value)}
                  className="rounded-xl border-border/80 text-xs w-full sm:w-64"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">Fecha Probable de Parto (FPP)</div>
                  <div className="text-lg font-bold text-rose-700 dark:text-rose-400">{fppCalculada}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">FUM + 7 días - 3 meses + 1 año</div>
                </div>

                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">Edad Gestacional Actual</div>
                  <div className="text-lg font-bold text-purple-700 dark:text-purple-400">
                    {semanasGestacion} semanas + {diasGestacion} días
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {semanasGestacion < 13
                      ? "Primer Trimestre"
                      : semanasGestacion < 28
                      ? "Segundo Trimestre"
                      : "Tercer Trimestre"}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 3: ESCALA DE BISHOP */}
        <TabsContent value="score_bishop" className="space-y-4 mt-0">
          <Card className="rounded-2xl border-border/80 shadow-sm p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-amber-600" /> Escala de Bishop (Maduración Cervical)
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Evaluación de favorabilidad del cuello uterino para la inducción del trabajo de parto.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <Label className="text-xs">Dilatación Cervical</Label>
                  <Select
                    value={String(bishopDilatacion)}
                    onValueChange={(v) => setBishopDilatacion(Number(v))}
                  >
                    <SelectTrigger className="rounded-xl border-border/80 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 cm (0 pts)</SelectItem>
                      <SelectItem value="1">1 - 2 cm (1 pto)</SelectItem>
                      <SelectItem value="2">3 - 4 cm (2 pts)</SelectItem>
                      <SelectItem value="3">≥ 5 cm (3 pts)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Borramiento Cervical</Label>
                  <Select
                    value={String(bishopBorramiento)}
                    onValueChange={(v) => setBishopBorramiento(Number(v))}
                  >
                    <SelectTrigger className="rounded-xl border-border/80 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 - 30% (0 pts)</SelectItem>
                      <SelectItem value="1">40 - 50% (1 pto)</SelectItem>
                      <SelectItem value="2">60 - 70% (2 pts)</SelectItem>
                      <SelectItem value="3">≥ 80% (3 pts)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Estación / Altura Fetal</Label>
                  <Select
                    value={String(bishopEstacion)}
                    onValueChange={(v) => setBishopEstacion(Number(v))}
                  >
                    <SelectTrigger className="rounded-xl border-border/80 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">-3 (0 pts)</SelectItem>
                      <SelectItem value="1">-2 (1 pto)</SelectItem>
                      <SelectItem value="2">-1 o 0 (2 pts)</SelectItem>
                      <SelectItem value="3">+1 o +2 (3 pts)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Consistencia del Cuello</Label>
                  <Select
                    value={String(bishopConsistencia)}
                    onValueChange={(v) => setBishopConsistencia(Number(v))}
                  >
                    <SelectTrigger className="rounded-xl border-border/80 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Firme (0 pts)</SelectItem>
                      <SelectItem value="1">Media (1 pto)</SelectItem>
                      <SelectItem value="2">Blanda (2 pts)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Posición Cervical</Label>
                  <Select
                    value={String(bishopPosicion)}
                    onValueChange={(v) => setBishopPosicion(Number(v))}
                  >
                    <SelectTrigger className="rounded-xl border-border/80 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Posterior (0 pts)</SelectItem>
                      <SelectItem value="1">Media (1 pto)</SelectItem>
                      <SelectItem value="2">Anterior (2 pts)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Resultado del Score de Bishop */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                  totalBishop >= 8
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                    : totalBishop >= 6
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300"
                }`}
              >
                <div>
                  <div className="font-bold text-sm">Puntuación Total de Bishop: {totalBishop} / 13 puntos</div>
                  <p className="mt-0.5">
                    {totalBishop >= 8
                      ? "Cuello maduro / Favorable: Alta probabilidad de éxito con oxitocina intravenosa."
                      : totalBishop >= 6
                      ? "Cuello intermedio: Se recomienda monitorización continua y considerar maduración previa."
                      : "Cuello inmaduro / Desfavorable: Requiere maduración cervical previa con prostaglandinas (Dinoprostona / Misoprostol)."}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: Nueva Consulta Gineco-Obstétrica */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Baby className="w-5 h-5 text-rose-600" /> Registrar Consulta Gineco-Obstétrica
            </DialogTitle>
            <DialogDescription>
              Complete los parámetros vitales, edad gestacional y diagnóstico clínico.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2 text-xs">
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Nombre de la Paciente *</Label>
              <Input
                placeholder="Ej. Ana Lucía Tavárez"
                value={form.paciente_nombre}
                onChange={(e) => setForm({ ...form, paciente_nombre: e.target.value })}
                className="rounded-xl border-border/80 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tipo de Consulta *</Label>
              <Select
                value={form.tipo_consulta}
                onValueChange={(v: any) => setForm({ ...form, tipo_consulta: v })}
              >
                <SelectTrigger className="rounded-xl border-border/80 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prenatal">Control Prenatal</SelectItem>
                  <SelectItem value="amenaza_preeclampsia">Riesgo Preeclampsia</SelectItem>
                  <SelectItem value="ginecologia_anual">Ginecología Anual</SelectItem>
                  <SelectItem value="menopausia_climaterio">Menopausia & Climaterio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tensión Arterial (mmHg)</Label>
              <Input
                placeholder="110/70"
                value={form.ta}
                onChange={(e) => setForm({ ...form, ta: e.target.value })}
                className="rounded-xl border-border/80 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Peso Actual (kg)</Label>
              <Input
                type="number"
                value={form.peso_kg}
                onChange={(e) => setForm({ ...form, peso_kg: Number(e.target.value) })}
                className="rounded-xl border-border/80 text-xs"
              />
            </div>

            {form.tipo_consulta === "prenatal" && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Altura Uterina (cm)</Label>
                  <Input
                    type="number"
                    value={form.altura_uterina_cm}
                    onChange={(e) => setForm({ ...form, altura_uterina_cm: Number(e.target.value) })}
                    className="rounded-xl border-border/80 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Frecuencia Cardíaca Fetal (lpm)</Label>
                  <Input
                    type="number"
                    value={form.fcf_lpm}
                    onChange={(e) => setForm({ ...form, fcf_lpm: Number(e.target.value) })}
                    className="rounded-xl border-border/80 text-xs"
                  />
                </div>
              </>
            )}

            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Diagnóstico Obstétrico / Ginecológico *</Label>
              <Input
                placeholder="Ej. Embarazo 32 sem / Infección vaginal por cándida"
                value={form.diagnostico}
                onChange={(e) => setForm({ ...form, diagnostico: e.target.value })}
                className="rounded-xl border-border/80 text-xs"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Plan de Conducta & Tratamiento</Label>
              <Textarea
                placeholder="Indicaciones, suplementación con hierro/ácido fólico, fecha de próxima ecografía..."
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
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            >
              Guardar Consulta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
