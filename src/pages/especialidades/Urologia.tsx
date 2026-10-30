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
  Layers,
  Sparkles,
  Stethoscope,
  Droplet,
} from "lucide-react";
import { toast } from "sonner";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

export type TipoConsultaUro =
  | "hpb_ipss"
  | "colico_nefritico_litiasis"
  | "cancer_prostata_psa"
  | "disfuncion_erectil_iief5"
  | "infeccion_urinaria_complicada";

interface ConsultaUrologica {
  id: string;
  paciente_nombre: string;
  edad_sexo: string;
  tipo_consulta: TipoConsultaUro;
  fecha: string;
  ipss_total?: number;
  psa_total_ng_ml?: number;
  psa_libre_pct?: number;
  iief5_total?: number;
  volumen_prostatico_cc?: number;
  diagnostico: string;
  plan_conducta: string;
}

const MOCK_CONSULTAS_URO: ConsultaUrologica[] = [
  {
    id: "uro-01",
    paciente_nombre: "Don Teófilo Rosario Cruz",
    edad_sexo: "67a / M",
    tipo_consulta: "hpb_ipss",
    fecha: "2026-10-29",
    ipss_total: 22,
    volumen_prostatico_cc: 65,
    psa_total_ng_ml: 3.2,
    diagnostico: "Hiperplasia prostática benigna (HPB) con prostatismo severo (IPSS 22/35) y residuo post-miccional de 110 mL",
    plan_conducta: "Terapia médica combinada: Tamsulosina 0.4mg nocturna + Dutasterida 0.5mg diarios. Flujometría miccional de control en 6 semanas. Si persistencia de residuo > 100 mL, programar RTUP bipolar.",
  },
  {
    id: "uro-02",
    paciente_nombre: "Ing. Bernardo Medina Santos",
    edad_sexo: "59a / M",
    tipo_consulta: "cancer_prostata_psa",
    fecha: "2026-10-28",
    psa_total_ng_ml: 6.8,
    psa_libre_pct: 9.4,
    diagnostico: "Sospecha de neoplasia prostática / PSA en zona gris (6.8 ng/mL) con ratio libre/total bajo (9.4%) y tacto rectal con induración en lóbulo derecho",
    plan_conducta: "Resonancia magnética multiparamétrica (mpMRI) 3 Tesla de próstata (protocolo PI-RADS v2.1). Biopsia prostática transperineal guiada por fusión de imágenes con profilaxis antibiótica dirigida.",
  },
  {
    id: "uro-03",
    paciente_nombre: "Manuel Antonio Peralta",
    edad_sexo: "41a / M",
    tipo_consulta: "colico_nefritico_litiasis",
    fecha: "2026-10-27",
    diagnostico: "Cólico renoureteral izquierdo agudo por lito de 6 mm en unión ureterovesical con ectasia pielocalicial grado II",
    plan_conducta: "Urotomografía simple (Uro-TC). Manejo expulsivo médico con Tamsulosina 0.4mg diaria + Ketorolaco 30mg IV STAT + Dexketoprofeno oral. Filtrado de orina. Si fiebre o anuria, cateterismo JJ urgente.",
  },
  {
    id: "uro-04",
    paciente_nombre: "César Augusto Fernández",
    edad_sexo: "54a / M",
    tipo_consulta: "disfuncion_erectil_iief5",
    fecha: "2026-10-26",
    iief5_total: 10,
    diagnostico: "Disfunción eréctil moderada de origen mixto (vasculogénica diabética y psicógena) / IIEF-5: 10/25 pts",
    plan_conducta: "Perfil hormonal (Testosterona total, libre, prolactina, SHBG, HbA1c y perfil lipídico). Tadalafilo 5mg diario en toma continua. Modificación de factores de riesgo endoteliales.",
  },
];

export default function Urologia() {
  const [consultas, setConsultas] = useState<ConsultaUrologica[]>(MOCK_CONSULTAS_URO);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [modalNueva, setModalNueva] = useState(false);
  const [consultaDetalle, setConsultaDetalle] = useState<ConsultaUrologica | null>(null);

  // Form State
  const [formNombre, setFormNombre] = useState("");
  const [formEdadSexo, setFormEdadSexo] = useState("62a / M");
  const [formTipo, setFormTipo] = useState<TipoConsultaUro>("hpb_ipss");
  const [formIpss, setFormIpss] = useState("18");
  const [formPsaTotal, setFormPsaTotal] = useState("4.5");
  const [formPsaLibrePct, setFormPsaLibrePct] = useState("12");
  const [formIief5, setFormIief5] = useState("14");
  const [formVolumen, setFormVolumen] = useState("50");
  const [formDiag, setFormDiag] = useState("");
  const [formPlan, setFormPlan] = useState("");

  // Calculadora IPSS
  const [ipssVaciado, setIpssVaciado] = useState<number>(3); // 0-5
  const [ipssFrecuencia, setIpssFrecuencia] = useState<number>(3); // 0-5
  const [ipssIntermitencia, setIpssIntermitencia] = useState<number>(2); // 0-5
  const [ipssUrgencia, setIpssUrgencia] = useState<number>(3); // 0-5
  const [ipssChorro, setIpssChorro] = useState<number>(4); // 0-5
  const [ipssPujo, setIpssPujo] = useState<number>(2); // 0-5
  const [ipssNicturia, setIpssNicturia] = useState<number>(3); // 0-5
  const [ipssQol, setIpssQol] = useState<number>(4); // 0-6

  const ipssTotal = useMemo(() => {
    return (
      ipssVaciado +
      ipssFrecuencia +
      ipssIntermitencia +
      ipssUrgencia +
      ipssChorro +
      ipssPujo +
      ipssNicturia
    );
  }, [ipssVaciado, ipssFrecuencia, ipssIntermitencia, ipssUrgencia, ipssChorro, ipssPujo, ipssNicturia]);

  const ipssInterpretacion = useMemo(() => {
    if (ipssTotal <= 7) {
      return {
        severidad: "Leve (0 - 7 puntos)",
        conducta: "Sintomatología leve. Vigilancia activa anual, reducción de ingesta líquida vespertina y cafeína.",
        badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      };
    }
    if (ipssTotal <= 19) {
      return {
        severidad: "Moderada (8 - 19 puntos)",
        conducta: "Tratamiento farmacológico con alfa-bloqueantes (Tamsulosina / Silodosina) o fitoterapia. Si próstata > 40cc, asociar inhibidor de 5-ARI.",
        badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
      };
    }
    return {
      severidad: "Severa (20 - 35 puntos)",
      conducta: "Tratamiento médico intensivo o desobstrucción quirúrgica (RTUP monopolar/bipolar, Enucleación HoLEP o Rezum).",
      badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
    };
  }, [ipssTotal]);

  // Calculadora PSA Libre / Total Ratio
  const [psaTot, setPsaTot] = useState<number>(6.5);
  const [psaLib, setPsaLib] = useState<number>(0.72);

  const calcRatioPsa = useMemo(() => {
    if (!psaTot || psaTot <= 0) return 0;
    return Number(((psaLib / psaTot) * 100).toFixed(1));
  }, [psaTot, psaLib]);

  const interpretacionPsa = useMemo(() => {
    if (psaTot < 4.0) {
      return {
        riesgo: "Normal (< 4.0 ng/mL)",
        probabilidad: "Probabilidad de cáncer < 10%",
        conducta: "Control urológico preventivo anual con tacto rectal y PSA.",
        badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      };
    }
    if (psaTot > 10.0) {
      return {
        riesgo: "Elevación Marcada (> 10.0 ng/mL)",
        probabilidad: "Probabilidad de cáncer > 50%",
        conducta: "Indicación formal de Biopsia de Próstata guiada por ecografía/resonancia independientemente del ratio libre.",
        badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
      };
    }
    // Zona gris 4.0 - 10.0 ng/mL
    if (calcRatioPsa < 10) {
      return {
        riesgo: "Alto Riesgo (Ratio < 10%)",
        probabilidad: "Probabilidad de cáncer prostático: 56%",
        conducta: "Biopsia de próstata obligatoria con estudio multiparamétrico.",
        badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
      };
    }
    if (calcRatioPsa <= 25) {
      return {
        riesgo: "Riesgo Intermedio (Ratio 10% - 25%)",
        probabilidad: "Probabilidad de cáncer prostático: 18% - 28%",
        conducta: "Valorar densidad de PSA, mpMRI (PI-RADS) y antecedentes familiares antes de biopsia.",
        badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
      };
    }
    return {
      riesgo: "Bajo Riesgo (Ratio > 25%)",
      probabilidad: "Probabilidad de cáncer prostático: < 8%",
      conducta: "Predominio benigno (sugestivo de HPB o prostatitis). Repetir en 6 meses sin necesidad de biopsia inmediata.",
      badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    };
  }, [psaTot, calcRatioPsa]);

  // Filtrado
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

    const nueva: ConsultaUrologica = {
      id: `uro-${Date.now().toString().slice(-4)}`,
      paciente_nombre: formNombre,
      edad_sexo: formEdadSexo,
      tipo_consulta: formTipo,
      fecha: new Date().toISOString().split("T")[0],
      ipss_total: formTipo === "hpb_ipss" ? parseInt(formIpss) || undefined : undefined,
      psa_total_ng_ml: formPsaTotal ? parseFloat(formPsaTotal) : undefined,
      psa_libre_pct: formPsaLibrePct ? parseFloat(formPsaLibrePct) : undefined,
      iief5_total: formTipo === "disfuncion_erectil_iief5" ? parseInt(formIief5) || undefined : undefined,
      volumen_prostatico_cc: formVolumen ? parseInt(formVolumen) : undefined,
      diagnostico: formDiag,
      plan_conducta: formPlan,
    };

    setConsultas([nueva, ...consultas]);
    setModalNueva(false);
    toast.success("Consulta urológica registrada exitosamente.");

    setFormNombre("");
    setFormDiag("");
    setFormPlan("");
  };

  return (
    <div className="space-y-6 pb-12">
      <ClinicalPageHeader
        title="Urología, Andrología & Litiasis"
        description="Estratificación de prostatismo IPSS, cinética de PSA libre/total, índice IIEF-5 de salud sexual y protocolos de cólico renal agudo."
        badgeText="Servicio Clínico & Quirúrgico Urológico"
        actions={
          <Button
            onClick={() => setModalNueva(true)}
            className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-sm flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Consulta Urológica
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Casos Urología"
          value={consultas.length.toString()}
          subtitle="Pacientes evaluados en el servicio"
          icon={<Droplet className="h-5 w-5 text-teal-600" />}
        />
        <ClinicalKpiCard
          title="HPB & Prostatismo"
          value={consultas.filter((c) => c.tipo_consulta === "hpb_ipss").length.toString()}
          subtitle="Seguimiento IPSS y flujometría"
          icon={<Layers className="h-5 w-5 text-blue-600" />}
        />
        <ClinicalKpiCard
          title="Screening PSA / Próstata"
          value={consultas.filter((c) => c.tipo_consulta === "cancer_prostata_psa").length.toString()}
          subtitle="Ratio PSA libre y biopsias guiadas"
          icon={<ShieldAlert className="h-5 w-5 text-rose-600" />}
        />
        <ClinicalKpiCard
          title="Cólico Nefrítico & Litiasis"
          value={consultas.filter((c) => c.tipo_consulta === "colico_nefritico_litiasis").length.toString()}
          subtitle="Urgencias obstructivas litiásicas"
          icon={<HeartPulse className="h-5 w-5 text-amber-600" />}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="consultas" className="w-full">
        <TabsList className="bg-muted/70 p-1 rounded-xl">
          <TabsTrigger value="consultas" className="rounded-lg text-xs font-semibold gap-2">
            <FileText className="h-4 w-4" />
            Historial de Consultas Urológicas
          </TabsTrigger>
          <TabsTrigger value="ipss" className="rounded-lg text-xs font-semibold gap-2">
            <Calculator className="h-4 w-4" />
            Score IPSS (Prostatismo / HPB)
          </TabsTrigger>
          <TabsTrigger value="psa" className="rounded-lg text-xs font-semibold gap-2">
            <Droplet className="h-4 w-4" />
            Ratio PSA Libre / Total
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CONSULTAS */}
        <TabsContent value="consultas" className="space-y-4 pt-2">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente o diagnóstico clínico..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9 rounded-xl border-border/80"
              />
            </div>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-full sm:w-[240px] rounded-xl border-border/80">
                <SelectValue placeholder="Tipo de Patología" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las patologías</SelectItem>
                <SelectItem value="hpb_ipss">HPB / Prostatismo (IPSS)</SelectItem>
                <SelectItem value="cancer_prostata_psa">Cáncer Próstata (PSA)</SelectItem>
                <SelectItem value="colico_nefritico_litiasis">Cólico Nefrítico / Litiasis</SelectItem>
                <SelectItem value="disfuncion_erectil_iief5">Disfunción Eréctil (IIEF-5)</SelectItem>
                <SelectItem value="infeccion_urinaria_complicada">ITU Complicada / Prostatitis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grid de Consultas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {consultasFiltradas.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 border border-dashed rounded-2xl">
                No se encontraron consultas registradas para este criterio.
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
                          <User className="h-4 w-4 text-teal-600" />
                          {c.paciente_nombre}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {c.edad_sexo} • Atendido el {c.fecha}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          c.tipo_consulta === "cancer_prostata_psa"
                            ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
                            : c.tipo_consulta === "colico_nefritico_litiasis"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                            : "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/30"
                        }
                      >
                        {c.tipo_consulta.replace(/_/g, " ").toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {c.ipss_total !== undefined && (
                        <Badge className="bg-teal-600 text-white font-bold">
                          IPSS: {c.ipss_total}/35 pts
                        </Badge>
                      )}
                      {c.psa_total_ng_ml !== undefined && (
                        <Badge variant="secondary" className="font-bold">
                          PSA Total: {c.psa_total_ng_ml} ng/mL
                        </Badge>
                      )}
                      {c.psa_libre_pct !== undefined && (
                        <Badge variant="outline" className="border-teal-500 text-teal-700 dark:text-teal-400 font-bold">
                          Ratio Libre: {c.psa_libre_pct}%
                        </Badge>
                      )}
                      {c.volumen_prostatico_cc !== undefined && (
                        <Badge variant="outline" className="text-muted-foreground">
                          Volumen: {c.volumen_prostatico_cc} cc
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="line-clamp-2 text-muted-foreground">
                        <strong className="text-foreground">Diagnóstico:</strong> {c.diagnostico}
                      </p>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-xs text-muted-foreground border-t border-border/60">
                      <span>Click para ver prescripción y conducta</span>
                      <CheckCircle2 className="h-4 w-4 text-teal-600" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* TAB 2: SCORE IPSS */}
        <TabsContent value="ipss" className="space-y-4 pt-2">
          <Card className="rounded-2xl border-border/80 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5 text-teal-600" />
                Score Internacional de Síntomas Prostáticos (IPSS)
              </CardTitle>
              <CardDescription>
                Cuestionario validado por la OMS para cuantificar síntomas obstructivos e irritativos de la HPB y determinar necesidad de cirugía (RTUP).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">1. Sensación de vaciado incompleto:</Label>
                    <Select value={ipssVaciado.toString()} onValueChange={(v) => setIpssVaciado(Number(v))}>
                      <SelectTrigger className="rounded-xl border-border/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0: Nunca</SelectItem>
                        <SelectItem value="1">1: Menos de 1 de cada 5 veces</SelectItem>
                        <SelectItem value="2">2: Menos de la mitad de las veces</SelectItem>
                        <SelectItem value="3">3: La mitad de las veces</SelectItem>
                        <SelectItem value="4">4: Más de la mitad de las veces</SelectItem>
                        <SelectItem value="5">5: Casi siempre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">2. Frecuencia miccional (&lt; 2 horas):</Label>
                    <Select value={ipssFrecuencia.toString()} onValueChange={(v) => setIpssFrecuencia(Number(v))}>
                      <SelectTrigger className="rounded-xl border-border/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0: Nunca</SelectItem>
                        <SelectItem value="1">1: Menos de 1 de cada 5 veces</SelectItem>
                        <SelectItem value="2">2: Menos de la mitad de las veces</SelectItem>
                        <SelectItem value="3">3: La mitad de las veces</SelectItem>
                        <SelectItem value="4">4: Más de la mitad de las veces</SelectItem>
                        <SelectItem value="5">5: Casi siempre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">3. Intermitencia (se detiene y reanuda):</Label>
                    <Select value={ipssIntermitencia.toString()} onValueChange={(v) => setIpssIntermitencia(Number(v))}>
                      <SelectTrigger className="rounded-xl border-border/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0: Nunca</SelectItem>
                        <SelectItem value="1">1: Menos de 1 de cada 5 veces</SelectItem>
                        <SelectItem value="2">2: Menos de la mitad</SelectItem>
                        <SelectItem value="3">3: La mitad de las veces</SelectItem>
                        <SelectItem value="4">4: Más de la mitad</SelectItem>
                        <SelectItem value="5">5: Casi siempre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">4. Dificultad para posponer la micción (Urgencia):</Label>
                    <Select value={ipssUrgencia.toString()} onValueChange={(v) => setIpssUrgencia(Number(v))}>
                      <SelectTrigger className="rounded-xl border-border/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0: Nunca</SelectItem>
                        <SelectItem value="1">1: Menos de 1 de cada 5 veces</SelectItem>
                        <SelectItem value="2">2: Menos de la mitad</SelectItem>
                        <SelectItem value="3">3: La mitad de las veces</SelectItem>
                        <SelectItem value="4">4: Más de la mitad</SelectItem>
                        <SelectItem value="5">5: Casi siempre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">5. Chorro débil o con poca fuerza:</Label>
                    <Select value={ipssChorro.toString()} onValueChange={(v) => setIpssChorro(Number(v))}>
                      <SelectTrigger className="rounded-xl border-border/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0: Nunca</SelectItem>
                        <SelectItem value="1">1: Menos de 1 de cada 5 veces</SelectItem>
                        <SelectItem value="2">2: Menos de la mitad</SelectItem>
                        <SelectItem value="3">3: La mitad de las veces</SelectItem>
                        <SelectItem value="4">4: Más de la mitad</SelectItem>
                        <SelectItem value="5">5: Casi siempre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-teal-500/5 border border-teal-500/20 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Puntuación IPSS Total:</span>
                      <span className="text-3xl font-extrabold text-foreground">{ipssTotal} / 35 pts</span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">Severidad de Prostatismo:</span>
                      <Badge className={`w-full justify-center py-1.5 text-xs font-bold ${ipssInterpretacion.badge}`}>
                        {ipssInterpretacion.severidad}
                      </Badge>
                    </div>

                    <div className="p-3.5 bg-background rounded-xl border border-border/80 text-xs space-y-1">
                      <strong className="text-foreground block">Guía Terapéutica Sugerida:</strong>
                      <p className="text-muted-foreground leading-relaxed">{ipssInterpretacion.conducta}</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full rounded-xl text-xs"
                    onClick={() => {
                      setFormIpss(ipssTotal.toString());
                      toast.info(`Puntuación IPSS (${ipssTotal} pts) transferida.`);
                    }}
                  >
                    Transferir IPSS a Nueva Consulta
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: PSA LIBRE / TOTAL */}
        <TabsContent value="psa" className="space-y-4 pt-2">
          <Card className="rounded-2xl border-border/80 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Droplet className="h-5 w-5 text-teal-600" />
                Evaluación del Ratio PSA Libre / PSA Total (%)
              </CardTitle>
              <CardDescription>
                Diferenciación de patología prostática benigna (HPB) vs sospecha de adenocarcinoma en la zona gris (PSA 4.0 - 10.0 ng/mL).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">PSA Total Sérico (ng/mL):</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={psaTot}
                      onChange={(e) => setPsaTot(Number(e.target.value))}
                      className="rounded-xl border-border/80"
                    />
                    <span className="text-[11px] text-muted-foreground block">
                      Valores de referencia normales: &lt; 4.0 ng/mL. Zona gris: 4.0 - 10.0 ng/mL.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">PSA Libre Sérico (ng/mL):</Label>
                    <Input
                      type="number"
                      step="0.05"
                      value={psaLib}
                      onChange={(e) => setPsaLib(Number(e.target.value))}
                      className="rounded-xl border-border/80"
                    />
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-muted/20 border border-border/80 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Ratio Libre/Total:</span>
                      <span className="text-3xl font-extrabold text-foreground">{calcRatioPsa}%</span>
                    </div>

                    <Badge className={`w-full justify-center py-1.5 text-xs font-bold ${interpretacionPsa.badge}`}>
                      {interpretacionPsa.riesgo}
                    </Badge>

                    <div className="p-3 bg-background rounded-xl border border-border/80 space-y-1 text-xs">
                      <span className="font-semibold text-foreground block">{interpretacionPsa.probabilidad}</span>
                      <p className="text-muted-foreground leading-relaxed mt-1">{interpretacionPsa.conducta}</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full rounded-xl text-xs"
                    onClick={() => {
                      setFormPsaTotal(psaTot.toString());
                      setFormPsaLibrePct(calcRatioPsa.toString());
                      toast.info(`Datos de PSA (${psaTot} ng/mL / Ratio ${calcRatioPsa}%) copiados.`);
                    }}
                  >
                    Usar valores en formulario
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL NUEVA CONSULTA */}
      <Dialog open={modalNueva} onOpenChange={setModalNueva}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Droplet className="h-5 w-5 text-teal-600" />
              Nueva Consulta Urológica & Andrológica
            </DialogTitle>
            <DialogDescription>
              Complete los datos clínicos, parámetros prostáticos o litiásicos y plan de manejo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCrearConsulta} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nombre del Paciente:</Label>
                <Input
                  placeholder="Ej: Danilo Ramos"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="rounded-xl border-border/80"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Edad / Sexo:</Label>
                <Input
                  placeholder="Ej: 64a / M"
                  value={formEdadSexo}
                  onChange={(e) => setFormEdadSexo(e.target.value)}
                  className="rounded-xl border-border/80"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tipo de Patología:</Label>
                <Select value={formTipo} onValueChange={(v) => setFormTipo(v as TipoConsultaUro)}>
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hpb_ipss">HPB / Prostatismo (IPSS)</SelectItem>
                    <SelectItem value="cancer_prostata_psa">Cáncer Próstata (PSA)</SelectItem>
                    <SelectItem value="colico_nefritico_litiasis">Cólico Nefrítico / Litiasis</SelectItem>
                    <SelectItem value="disfuncion_erectil_iief5">Disfunción Eréctil (IIEF-5)</SelectItem>
                    <SelectItem value="infeccion_urinaria_complicada">ITU Complicada / Prostatitis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Volumen Prostático Ecográfico (cc):</Label>
                <Input
                  type="number"
                  placeholder="Ej: 55"
                  value={formVolumen}
                  onChange={(e) => setFormVolumen(e.target.value)}
                  className="rounded-xl border-border/80"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">PSA Total (ng/mL):</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formPsaTotal}
                  onChange={(e) => setFormPsaTotal(e.target.value)}
                  className="rounded-xl border-border/80"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Ratio PSA Libre (%):</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formPsaLibrePct}
                  onChange={(e) => setFormPsaLibrePct(e.target.value)}
                  className="rounded-xl border-border/80"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Diagnóstico Clínico / CIE-10:</Label>
              <Textarea
                placeholder="Ej: Hiperplasia benigna de próstata con retención urinaria incompleta (N40.1)"
                value={formDiag}
                onChange={(e) => setFormDiag(e.target.value)}
                rows={2}
                className="rounded-xl border-border/80 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Plan Terapéutico & Conducta Quirúrgica:</Label>
              <Textarea
                placeholder="Terapia farmacológica, flujometría miccional, biopsia o programación de RTUP/láser..."
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
              <Button type="submit" className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium">
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
                <Droplet className="h-5 w-5 text-teal-600" />
                Informe Urológico - {consultaDetalle.paciente_nombre}
              </DialogTitle>
              <DialogDescription>
                Fecha de evaluación: {consultaDetalle.fecha} • {consultaDetalle.edad_sexo}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              <div className="flex flex-wrap gap-2">
                {consultaDetalle.ipss_total !== undefined && (
                  <Badge className="bg-teal-600 text-white">
                    IPSS: {consultaDetalle.ipss_total} / 35 pts
                  </Badge>
                )}
                {consultaDetalle.psa_total_ng_ml !== undefined && (
                  <Badge variant="secondary">
                    PSA: {consultaDetalle.psa_total_ng_ml} ng/mL
                  </Badge>
                )}
                {consultaDetalle.psa_libre_pct !== undefined && (
                  <Badge variant="outline" className="border-teal-500 text-teal-700 dark:text-teal-400">
                    Ratio Libre: {consultaDetalle.psa_libre_pct}%
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                <span className="font-bold text-foreground block">Diagnóstico:</span>
                <p className="p-3 bg-muted/20 border border-border/80 rounded-xl leading-relaxed">
                  {consultaDetalle.diagnostico}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-foreground block">Plan de Manejo & Prescripción Urológica:</span>
                <p className="p-3 bg-muted/20 border border-border/80 rounded-xl leading-relaxed whitespace-pre-wrap">
                  {consultaDetalle.plan_conducta}
                </p>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => window.print()} className="rounded-xl">
                Imprimir Informe
              </Button>
              <Button onClick={() => setConsultaDetalle(null)} className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white">
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
