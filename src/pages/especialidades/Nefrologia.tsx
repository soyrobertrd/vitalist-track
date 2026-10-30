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
  Droplet,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

export type TipoConsultaNefro =
  | "erc_estadios"
  | "hemodialisis_cronica"
  | "sindrome_nefrotico"
  | "injuria_aguda_kdigo"
  | "litiasis_renal";

interface ConsultaNefrologica {
  id: string;
  paciente_nombre: string;
  edad_sexo: string;
  tipo_consulta: TipoConsultaNefro;
  fecha: string;
  creatinina_mg_dl: number;
  urea_mg_dl?: number;
  egfr_ckd_epi: number;
  estadio_kdigo: "G1" | "G2" | "G3a" | "G3b" | "G4" | "G5 (Terminal)";
  proteinuria_24h_g?: number;
  tipo_acceso_vascular?: "Fístula Arteriovenosa (FAV)" | "Catéter Permacath" | "Catéter Temporal Mahurkar" | "Ninguno";
  diagnostico: string;
  plan_conducta: string;
}

const MOCK_CONSULTAS_NEFRO: ConsultaNefrologica[] = [
  {
    id: "nef-01",
    paciente_nombre: "Don Ramón Arturo Henríquez",
    edad_sexo: "68a / M",
    tipo_consulta: "hemodialisis_cronica",
    fecha: "2026-10-29",
    creatinina_mg_dl: 8.4,
    urea_mg_dl: 142,
    egfr_ckd_epi: 6.2,
    estadio_kdigo: "G5 (Terminal)",
    tipo_acceso_vascular: "Fístula Arteriovenosa (FAV)",
    diagnostico: "ERC Estadio G5 secundaria a Nefropatía Diabética / En programa de hemodiálisis trisanal",
    plan_conducta: "Sesión 4h con dializador de alto flujo, ultrafiltración 2.2L, eritropoyetina 4,000 UI y Quelante de fósforo.",
  },
  {
    id: "nef-02",
    paciente_nombre: "Mercedes Almonte Cruz",
    edad_sexo: "54a / F",
    tipo_consulta: "erc_estadios",
    fecha: "2026-10-28",
    creatinina_mg_dl: 1.8,
    urea_mg_dl: 58,
    egfr_ckd_epi: 33.4,
    estadio_kdigo: "G3b",
    proteinuria_24h_g: 0.8,
    diagnostico: "Nefroangioesclerosis hipertensiva / ERC Estadio G3b con albuminuria A2",
    plan_conducta: "Optimización con iSGLT2 (Dapagliflozina 10mg), Losartán 50mg, restricción proteica a 0.8 g/kg/día.",
  },
  {
    id: "nef-03",
    paciente_nombre: "Jorge Luis Santana",
    edad_sexo: "41a / M",
    tipo_consulta: "sindrome_nefrotico",
    fecha: "2026-10-27",
    creatinina_mg_dl: 1.1,
    egfr_ckd_epi: 82.0,
    estadio_kdigo: "G2",
    proteinuria_24h_g: 4.6,
    diagnostico: "Síndrome Nefrótico del adulto / Sospecha de Glomerulopatía Membranosa primaria",
    plan_conducta: "Biopsia renal percutánea ecoguiada programada, estatinas por hipercolesterolemia y anticoagulación profiláctica.",
  },
];

export default function Nefrologia() {
  const [consultas, setConsultas] = useState<ConsultaNefrologica[]>(MOCK_CONSULTAS_NEFRO);
  const [tab, setTab] = useState<"consultas" | "calculadora_ckd_epi" | "hemodialisis">("consultas");
  const [search, setSearch] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todas");
  const [modalOpen, setModalOpen] = useState(false);

  // Estados de Calculadora CKD-EPI 2021
  const [calcScr, setCalcScr] = useState(1.4); // mg/dL
  const [calcEdad, setCalcEdad] = useState(60);
  const [calcSexo, setCalcSexo] = useState<"M" | "F">("M");
  const [calcPesoKg, setCalcPesoKg] = useState(72);

  // Cálculo CKD-EPI 2021 oficial (sin raza)
  const { egfrCalculado, estadioCalculado, cockcroftCalculado } = useMemo(() => {
    const scr = Number(calcScr) || 1.0;
    const edad = Number(calcEdad) || 50;
    const esMujer = calcSexo === "F";

    const kappa = esMujer ? 0.7 : 0.9;
    const alpha = esMujer ? -0.241 : -0.302;
    const factorMujer = esMujer ? 1.012 : 1.0;

    const minPart = Math.min(scr / kappa, 1) ** alpha;
    const maxPart = Math.max(scr / kappa, 1) ** -1.2;
    const edadPart = 0.9938 ** edad;

    const egfr = Math.round(142 * minPart * maxPart * edadPart * factorMujer);

    // Cockcroft-Gault: ((140 - edad) * peso) / (72 * Cr) * (0.85 si mujer)
    const peso = Number(calcPesoKg) || 70;
    const cg = Math.round((((140 - edad) * peso) / (72 * scr)) * (esMujer ? 0.85 : 1.0));

    let estadio: ConsultaNefrologica["estadio_kdigo"] = "G1";
    if (egfr >= 90) estadio = "G1";
    else if (egfr >= 60) estadio = "G2";
    else if (egfr >= 45) estadio = "G3a";
    else if (egfr >= 30) estadio = "G3b";
    else if (egfr >= 15) estadio = "G4";
    else estadio = "G5 (Terminal)";

    return {
      egfrCalculado: egfr,
      estadioCalculado: estadio,
      cockcroftCalculado: cg,
    };
  }, [calcScr, calcEdad, calcSexo, calcPesoKg]);

  // Formulario de nueva consulta
  const [form, setForm] = useState({
    paciente_nombre: "",
    edad_sexo: "",
    tipo_consulta: "erc_estadios" as TipoConsultaNefro,
    creatinina_mg_dl: 1.5,
    urea_mg_dl: 45,
    proteinuria_24h_g: 0.5,
    tipo_acceso_vascular: "Ninguno" as ConsultaNefrologica["tipo_acceso_vascular"],
    diagnostico: "",
    plan_conducta: "",
  });

  const handleCrearConsulta = () => {
    if (!form.paciente_nombre || !form.diagnostico) {
      toast.error("Debe ingresar el nombre del paciente y diagnóstico");
      return;
    }

    const scr = Number(form.creatinina_mg_dl);
    const egfrEstimado = Math.round(142 * (Math.min(scr / 0.9, 1) ** -0.302) * (Math.max(scr / 0.9, 1) ** -1.2) * (0.9938 ** 55));
    let est: ConsultaNefrologica["estadio_kdigo"] = "G2";
    if (egfrEstimado >= 90) est = "G1";
    else if (egfrEstimado >= 60) est = "G2";
    else if (egfrEstimado >= 45) est = "G3a";
    else if (egfrEstimado >= 30) est = "G3b";
    else if (egfrEstimado >= 15) est = "G4";
    else est = "G5 (Terminal)";

    const nueva: ConsultaNefrologica = {
      id: `nef-${Date.now()}`,
      paciente_nombre: form.paciente_nombre,
      edad_sexo: form.edad_sexo || "Adulto",
      tipo_consulta: form.tipo_consulta,
      fecha: new Date().toISOString().slice(0, 10),
      creatinina_mg_dl: scr,
      urea_mg_dl: form.urea_mg_dl ? Number(form.urea_mg_dl) : undefined,
      egfr_ckd_epi: egfrEstimado,
      estadio_kdigo: est,
      proteinuria_24h_g: form.proteinuria_24h_g ? Number(form.proteinuria_24h_g) : undefined,
      tipo_acceso_vascular: form.tipo_acceso_vascular,
      diagnostico: form.diagnostico,
      plan_conducta: form.plan_conducta,
    };

    setConsultas([nueva, ...consultas]);
    toast.success("Consulta nefrológica registrada");
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
        title="Nefrología Clínica & Diálisis"
        subtitle="Monitoreo de Enfermedad Renal Crónica (KDIGO), cálculo de TFG CKD-EPI 2021, hemodiálisis y accesos vasculares"
        icon={Droplet}
        badge="Especialidad Renal & Metabólica"
        action={
          <Button
            onClick={() => setModalOpen(true)}
            size="sm"
            className="rounded-xl gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Plus className="w-4 h-4" /> Registrar Consulta Nefrológica
          </Button>
        }
      />

      {/* KPIs Clínicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Pacientes en Hemodiálisis"
          value={consultas.filter((c) => c.tipo_consulta === "hemodialisis_cronica").length}
          subtitle="Terapia de reemplazo trisanal"
          icon={Droplet}
          variant="teal"
        />
        <ClinicalKpiCard
          title="Casos ERC G4 / G5"
          value={consultas.filter((c) => c.estadio_kdigo === "G4" || c.estadio_kdigo === "G5 (Terminal)").length}
          subtitle="Filtrado glomerular &lt; 30 ml/min"
          icon={AlertTriangle}
          variant="rose"
        />
        <ClinicalKpiCard
          title="TFG Mediana Censada"
          value="41 ml/min"
          subtitle="Tasa CKD-EPI en seguimiento"
          icon={Activity}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Accesos Vasculares Activos"
          value={consultas.filter((c) => c.tipo_acceso_vascular === "Fístula Arteriovenosa (FAV)").length}
          subtitle="Fístulas arteriovenosas maduras"
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* Pestañas de la Especialidad */}
      <Tabs value={tab} onValueChange={(v: any) => setTab(v)} className="space-y-4">
        <TabsList className="bg-muted/40 p-1.5 rounded-2xl border border-border/70 flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="consultas" className="rounded-xl px-4 py-2 text-xs font-semibold gap-1.5">
            <FileText className="h-4 w-4 text-teal-600" />
            Consultas & Pacientes Renales
          </TabsTrigger>
          <TabsTrigger value="calculadora_ckd_epi" className="rounded-xl px-4 py-2 text-xs font-semibold gap-1.5">
            <Calculator className="h-4 w-4 text-primary" />
            Calculadora TFG CKD-EPI 2021
          </TabsTrigger>
          <TabsTrigger value="hemodialisis" className="rounded-xl px-4 py-2 text-xs font-semibold gap-1.5">
            <Droplet className="h-4 w-4 text-blue-600" />
            Unidad de Hemodiálisis
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CONSULTAS */}
        <TabsContent value="consultas" className="space-y-4 mt-0">
          <Card className="rounded-2xl border-border/80 shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente, diagnóstico renal, estadio..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 rounded-xl border-border/80 text-xs"
                />
              </div>

              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-[200px] rounded-xl border-border/80 text-xs">
                  <SelectValue placeholder="Tipo de Atención" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las atenciones</SelectItem>
                  <SelectItem value="erc_estadios">ERC Estadios 1-5</SelectItem>
                  <SelectItem value="hemodialisis_cronica">Hemodiálisis Crónica</SelectItem>
                  <SelectItem value="sindrome_nefrotico">Síndrome Nefrótico</SelectItem>
                  <SelectItem value="injuria_aguda_kdigo">Injuria Renal Aguda</SelectItem>
                  <SelectItem value="litiasis_renal">Litiasis Renal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/20 px-6 py-3.5 border-b border-border/80 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Droplet className="h-4 w-4 text-teal-600" /> Registro de Atenciones Nefrológicas
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
                      <TableHead className="text-xs font-semibold">Tipo Atención</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Creatinina</TableHead>
                      <TableHead className="text-xs font-semibold text-center">TFG (CKD-EPI)</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Estadio KDIGO</TableHead>
                      <TableHead className="text-xs font-semibold">Acceso Vascular</TableHead>
                      <TableHead className="text-xs font-semibold">Diagnóstico & Plan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConsultas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                          No hay atenciones nefrológicas registradas.
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
                                c.tipo_consulta === "hemodialisis_cronica"
                                  ? "bg-blue-500/10 text-blue-700 border-blue-500/30"
                                  : "bg-teal-500/10 text-teal-700 border-teal-500/30"
                              }`}
                            >
                              {c.tipo_consulta.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {c.creatinina_mg_dl} mg/dL
                          </TableCell>
                          <TableCell className="text-center font-bold font-mono text-teal-700 dark:text-teal-400">
                            {c.egfr_ckd_epi} <span className="text-[10px] font-normal text-muted-foreground">ml/min</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${
                                c.estadio_kdigo === "G5 (Terminal)"
                                  ? "bg-rose-500/15 text-rose-700 border-rose-500/40"
                                  : c.estadio_kdigo === "G4"
                                  ? "bg-amber-500/15 text-amber-700 border-amber-500/40"
                                  : "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                              }`}
                            >
                              {c.estadio_kdigo}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">
                            {c.tipo_acceso_vascular || "Sin acceso"}
                          </TableCell>
                          <TableCell className="max-w-[220px]">
                            <div className="font-medium text-foreground truncate">{c.diagnostico}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{c.plan_conducta}</div>
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

        {/* TAB 2: CALCULADORA CKD-EPI 2021 */}
        <TabsContent value="calculadora_ckd_epi" className="space-y-4 mt-0">
          <Card className="rounded-2xl border-border/80 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-teal-600" /> Tasa de Filtración Glomerular CKD-EPI (2021)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fórmula oficial KDIGO/NKF recomendada sin coeficiente racial para estadificación de ERC.
                </p>
              </div>

              <div className="p-3 bg-teal-500/10 rounded-xl border border-teal-500/30 text-center">
                <div className="text-[10px] uppercase font-bold text-teal-800 dark:text-teal-300">TFG Estimada</div>
                <div className="text-2xl font-bold font-mono text-teal-700 dark:text-teal-400">
                  {egfrCalculado} <span className="text-xs font-normal">ml/min/1.73m²</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">Creatinina Sérica (mg/dL) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={calcScr}
                  onChange={(e) => setCalcScr(Number(e.target.value))}
                  className="rounded-xl border-border/80 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Edad del Paciente (Años) *</Label>
                <Input
                  type="number"
                  value={calcEdad}
                  onChange={(e) => setCalcEdad(Number(e.target.value))}
                  className="rounded-xl border-border/80 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Sexo Biológico *</Label>
                <Select value={calcSexo} onValueChange={(v: any) => setCalcSexo(v)}>
                  <SelectTrigger className="rounded-xl border-border/80 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Peso (kg) — Cockcroft-Gault</Label>
                <Input
                  type="number"
                  value={calcPesoKg}
                  onChange={(e) => setCalcPesoKg(Number(e.target.value))}
                  className="rounded-xl border-border/80 text-xs"
                />
              </div>
            </div>

            {/* Clasificación KDIGO y Recomendación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-1.5 text-xs">
                <div className="font-bold text-foreground flex items-center justify-between">
                  <span>Estadificación Renal KDIGO:</span>
                  <Badge variant="outline" className="font-bold text-sm">
                    Estadio {estadioCalculado}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  {estadioCalculado === "G1"
                    ? "Normal o elevado (≥90 ml/min). Daño renal evaluable con albuminuria o sedimento."
                    : estadioCalculado === "G2"
                    ? "Descenso leve de la filtración glomerular (60-89 ml/min)."
                    : estadioCalculado === "G3a"
                    ? "Descenso leve a moderado (45-59 ml/min). Control de factores cardiovasculares."
                    : estadioCalculado === "G3b"
                    ? "Descenso moderado a severo (30-44 ml/min). Ajustar dosificación de fármacos nefrotóxicos."
                    : estadioCalculado === "G4"
                    ? "Descenso severo (15-29 ml/min). Planificación urgente de acceso vascular (FAV)."
                    : "Falla renal terminal (<15 ml/min). Indicación de terapia dialítica o trasplante renal."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1.5 text-xs">
                <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center justify-between">
                  <span>Aclaramiento Cockcroft-Gault:</span>
                  <span className="font-mono text-sm font-bold text-blue-700 dark:text-blue-400">
                    {cockcroftCalculado} ml/min
                  </span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Utilizado para ajustes posológicos en ficha técnica farmacológica (Antibióticos, Anticoagulantes Orales Directos y Quimioterapia).
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 3: UNIDAD DE HEMODIÁLISIS */}
        <TabsContent value="hemodialisis" className="space-y-4 mt-0">
          <Card className="rounded-2xl border-border/80 shadow-sm p-6 space-y-3">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Droplet className="w-5 h-5 text-blue-600" /> Protocolo de Prescripción Dialítica
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Parámetros hemodinámicos y adecuación de dosis de diálisis (Kt/V mínimo de 1.2 por sesión).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-border/80 space-y-1">
                <span className="font-semibold text-foreground">Tiempo de Sesión Estándar:</span>
                <p className="text-muted-foreground">3.5 a 4.0 horas (3 veces por semana: L-M-V o M-J-S)</p>
              </div>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-border/80 space-y-1">
                <span className="font-semibold text-foreground">Flujo Sanguíneo (Qb):</span>
                <p className="text-muted-foreground">300 a 400 ml/min por FAV o Catéter alto flujo</p>
              </div>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-border/80 space-y-1">
                <span className="font-semibold text-foreground">Anticoagulación en Circuito:</span>
                <p className="text-muted-foreground">Heparina sódica no fraccionada o Enoxaparina en bolo inicial</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: Nueva Consulta Nefrológica */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Droplet className="w-5 h-5 text-teal-600" /> Registrar Consulta Nefrológica
            </DialogTitle>
            <DialogDescription>
              Ingrese los valores de laboratorio renal y parámetros clínicos del paciente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2 text-xs">
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Nombre Completo del Paciente *</Label>
              <Input
                placeholder="Ej. Manuel Antonio Tavárez"
                value={form.paciente_nombre}
                onChange={(e) => setForm({ ...form, paciente_nombre: e.target.value })}
                className="rounded-xl border-border/80 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Edad / Sexo</Label>
              <Input
                placeholder="Ej. 65a / M"
                value={form.edad_sexo}
                onChange={(e) => setForm({ ...form, edad_sexo: e.target.value })}
                className="rounded-xl border-border/80 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tipo de Atención *</Label>
              <Select
                value={form.tipo_consulta}
                onValueChange={(v: any) => setForm({ ...form, tipo_consulta: v })}
              >
                <SelectTrigger className="rounded-xl border-border/80 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="erc_estadios">ERC Estadios 1-5</SelectItem>
                  <SelectItem value="hemodialisis_cronica">Hemodiálisis Crónica</SelectItem>
                  <SelectItem value="sindrome_nefrotico">Síndrome Nefrótico</SelectItem>
                  <SelectItem value="injuria_aguda_kdigo">Injuria Renal Aguda</SelectItem>
                  <SelectItem value="litiasis_renal">Litiasis Renal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Creatinina Sérica (mg/dL) *</Label>
              <Input
                type="number"
                step="0.1"
                value={form.creatinina_mg_dl}
                onChange={(e) => setForm({ ...form, creatinina_mg_dl: Number(e.target.value) })}
                className="rounded-xl border-border/80 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Urea (mg/dL)</Label>
              <Input
                type="number"
                value={form.urea_mg_dl}
                onChange={(e) => setForm({ ...form, urea_mg_dl: Number(e.target.value) })}
                className="rounded-xl border-border/80 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Acceso Vascular</Label>
              <Select
                value={form.tipo_acceso_vascular}
                onValueChange={(v: any) => setForm({ ...form, tipo_acceso_vascular: v })}
              >
                <SelectTrigger className="rounded-xl border-border/80 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ninguno">Ninguno</SelectItem>
                  <SelectItem value="Fístula Arteriovenosa (FAV)">Fístula Arteriovenosa (FAV)</SelectItem>
                  <SelectItem value="Catéter Permacath">Catéter Permacath Tunelizado</SelectItem>
                  <SelectItem value="Catéter Temporal Mahurkar">Catéter Mahurkar Temporal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Proteinuria 24h (g/día)</Label>
              <Input
                type="number"
                step="0.1"
                value={form.proteinuria_24h_g}
                onChange={(e) => setForm({ ...form, proteinuria_24h_g: Number(e.target.value) })}
                className="rounded-xl border-border/80 text-xs"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Diagnóstico Nefrológico *</Label>
              <Input
                placeholder="Ej. ERC Estadio G4 por nefropatía hipertensiva"
                value={form.diagnostico}
                onChange={(e) => setForm({ ...form, diagnostico: e.target.value })}
                className="rounded-xl border-border/80 text-xs"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Plan de Conducta & Fármacos</Label>
              <Textarea
                placeholder="Ajuste de quelantes de fósforo, calcitriol, bicarbonato sódico, eritropoyetina..."
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
              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
            >
              Guardar Consulta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
