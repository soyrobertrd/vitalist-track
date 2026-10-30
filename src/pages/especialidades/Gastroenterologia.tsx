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
  Flame,
  Layers,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";
import { ForrestTab, type ForrestClass } from "@/components/especialidades/gastroenterologia/ForrestTab";
import { ChildPughTab } from "@/components/especialidades/gastroenterologia/ChildPughTab";
import { MeldTab } from "@/components/especialidades/gastroenterologia/MeldTab";

export type TipoConsultaGastro =
  | "hemorragia_digestiva"
  | "cirrosis_hepatica"
  | "ulcera_peptica_forrest"
  | "enfermedad_inflamatoria"
  | "dispepsia_hpylori"
  | "sindrome_intestino_irritable";

interface ConsultaGastroenterologia {
  id: string;
  paciente_nombre: string;
  edad_sexo: string;
  tipo_consulta: TipoConsultaGastro;
  fecha: string;
  forrest_class?: "Ia" | "Ib" | "IIa" | "IIb" | "IIc" | "III";
  child_pugh_clase?: "Clase A (5-6 pts)" | "Clase B (7-9 pts)" | "Clase C (10-15 pts)";
  meld_score?: number;
  blatchford_score?: number;
  hallazgos_endoscopia?: string;
  diagnostico: string;
  plan_conducta: string;
}

const MOCK_CONSULTAS_GASTRO: ConsultaGastroenterologia[] = [
  {
    id: "gas-01",
    paciente_nombre: "Don Danilo Alcántara Báez",
    edad_sexo: "63a / M",
    tipo_consulta: "ulcera_peptica_forrest",
    fecha: "2026-10-29",
    forrest_class: "IIa",
    blatchford_score: 11,
    hallazgos_endoscopia: "VEDA: Úlcera antral profunda de 18 mm en cara anterior con vaso visible no sangrante central (Forrest IIa). Hemostasia dual exitosa.",
    diagnostico: "Hemorragia digestiva alta no varicosa secundaria a úlcera gástrica péptica Forrest IIa",
    plan_conducta: "Inyección de adrenalina 1:10,000 + colocación de 2 hemoclips metálicos. Infusión continua de Omeprazol 80mg bolo IV + 8 mg/h por 72h. Biopsia rápida test de ureasa.",
  },
  {
    id: "gas-02",
    paciente_nombre: "Doña Teresa Villar Martínez",
    edad_sexo: "58a / F",
    tipo_consulta: "cirrosis_hepatica",
    fecha: "2026-10-28",
    child_pugh_clase: "Clase B (7-9 pts)",
    meld_score: 18,
    diagnostico: "Cirrosis hepática secundaria a esteatohepatitis no alcohólica (MASH) descompensada por ascitis moderada",
    plan_conducta: "Paracentesis diagnóstica (GASA > 1.1 g/dL, PMN < 250 cél/mm³ descarta PBE). Espironolactona 100mg + Furosemida 40mg diarios. Propanolol 20mg BID para profilaxis de várices.",
  },
  {
    id: "gas-03",
    paciente_nombre: "Marcos Aurelio Silvestre",
    edad_sexo: "32a / M",
    tipo_consulta: "enfermedad_inflamatoria",
    fecha: "2026-10-27",
    hallazgos_endoscopia: "Colonoscopia: Pancolitis difusa con eritema marcado, pérdida de patrón vascular, friabilidad espontánea y microerosiones confluentes (Mayo 2).",
    diagnostico: "Colitis Ulcerosa Crónica Idiopática (CUCI) moderada activa (Pancolitis E3 según Montreal)",
    plan_conducta: "Inducción con Mesalazina oral 4.8 g/día + enema de Mesalazina 1g nocturno. Prednisona oral 40 mg/día con esquema de descenso semanal. Calprotectina fecal de control en 4 semanas.",
  },
  {
    id: "gas-04",
    paciente_nombre: "Carmen Patricia Gil",
    edad_sexo: "45a / F",
    tipo_consulta: "dispepsia_hpylori",
    fecha: "2026-10-26",
    diagnostico: "Gastritis erosiva crónica antral con prueba rápida de ureasa (CLO-test) POSITIVA para Helicobacter pylori",
    plan_conducta: "Terapia cuádruple con bismuto x 14 días: Esomeprazol 40mg BID + Subcitrato de Bismuto 120mg QID + Metronidazol 500mg TID + Tetraciclina 500mg QID. Test de aliento post-tratamiento a los 30 días.",
  },
];

export default function Gastroenterologia() {
  const [consultas, setConsultas] = useState<ConsultaGastroenterologia[]>(MOCK_CONSULTAS_GASTRO);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [modalNueva, setModalNueva] = useState(false);
  const [consultaDetalle, setConsultaDetalle] = useState<ConsultaGastroenterologia | null>(null);

  // Form State
  const [formNombre, setFormNombre] = useState("");
  const [formEdadSexo, setFormEdadSexo] = useState("55a / M");
  const [formTipo, setFormTipo] = useState<TipoConsultaGastro>("ulcera_peptica_forrest");
  const [formForrest, setFormForrest] = useState<string>("IIa");
  const [formChildClase, setFormChildClase] = useState<string>("Clase B (7-9 pts)");
  const [formMeld, setFormMeld] = useState("16");
  const [formBlatchford, setFormBlatchford] = useState("8");
  const [formEndoscopia, setFormEndoscopia] = useState("");
  const [formDiag, setFormDiag] = useState("");
  const [formPlan, setFormPlan] = useState("");

  // Calculadora Forrest State
  const [selForrest, setSelForrest] = useState<"Ia" | "Ib" | "IIa" | "IIb" | "IIc" | "III">("IIa");

  const infoForrest = useMemo(() => {
    switch (selForrest) {
      case "Ia":
        return {
          descripcion: "Sangrado arterial activo a chorro o pulsátil.",
          recidiva: "Riesgo de recidiva hemorrágica: 85% - 90%",
          conducta: "Terapia endoscópica combinada obligatoria (Inyección adrenalina + Clips mecánicos o termocoagulación). Infusión IBP en bolo + bomba 72h.",
          badgeColor: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
        };
      case "Ib":
        return {
          descripcion: "Sangrado activo babeante o rezumante continuo sin pulso arterial.",
          recidiva: "Riesgo de recidiva hemorrágica: 20% - 30%",
          conducta: "Terapia endoscópica combinada obligatoria. Monitoreo hemodinámico estricto en UCI o Intermedios.",
          badgeColor: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
        };
      case "IIa":
        return {
          descripcion: "Vaso visible no sangrante en la base de la úlcera.",
          recidiva: "Riesgo de recidiva hemorrágica: 40% - 50%",
          conducta: "Tratamiento endoscópico hemostático obligatorio para prevenir rotura inminente. IBP IV dosis altas.",
          badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
        };
      case "IIb":
        return {
          descripcion: "Coágulo firmemente adherido a la lesión que resiste lavado suave con bomba de agua.",
          recidiva: "Riesgo de recidiva hemorrágica: 20% - 25%",
          conducta: "Considerar remoción mecánica con asa bajo inyección previa o lavado enérgico y hemostasia si se expone vaso subyacente.",
          badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
        };
      case "IIc":
        return {
          descripcion: "Manchas planas pigmentadas o hematina en el lecho ulceroso.",
          recidiva: "Riesgo de recidiva hemorrágica: 5% - 10%",
          conducta: "No requiere hemostasia endoscópica activa. Tratamiento médico con IBP oral o IV y realimentación precoz.",
          badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
        };
      case "III":
        return {
          descripcion: "Lecho ulceroso limpio cubierto de fibrina sin estigmas de sangrado reciente.",
          recidiva: "Riesgo de recidiva hemorrágica: < 2%",
          conducta: "Bajo riesgo. No requiere hemostasia endoscópica. Manejo ambulatorio seguro con IBP oral si no existen comorbilidades.",
          badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
        };
    }
  }, [selForrest]);

  // Calculadora Child-Pugh State
  const [cpBilirrubina, setCpBilirrubina] = useState<number>(2.4);
  const [cpAlbumina, setCpAlbumina] = useState<number>(2.9);
  const [cpInr, setCpInr] = useState<number>(1.85);
  const [cpAscitis, setCpAscitis] = useState<number>(2); // 1: ausente, 2: leve/moderada, 3: severa/refractaria
  const [cpEncefalopatia, setCpEncefalopatia] = useState<number>(1); // 1: ausente, 2: grado I-II, 3: grado III-IV

  const childPughPuntos = useMemo(() => {
    let pts = 0;
    // Bilirrubina (mg/dL)
    if (cpBilirrubina < 2) pts += 1;
    else if (cpBilirrubina <= 3) pts += 2;
    else pts += 3;

    // Albúmina (g/dL)
    if (cpAlbumina > 3.5) pts += 1;
    else if (cpAlbumina >= 2.8) pts += 2;
    else pts += 3;

    // INR
    if (cpInr < 1.7) pts += 1;
    else if (cpInr <= 2.3) pts += 2;
    else pts += 3;

    // Ascitis
    pts += cpAscitis;

    // Encefalopatía
    pts += cpEncefalopatia;

    return pts;
  }, [cpBilirrubina, cpAlbumina, cpInr, cpAscitis, cpEncefalopatia]);

  const childPughResultado = useMemo(() => {
    if (childPughPuntos <= 6) {
      return {
        clase: "Clase A (Compensada)",
        sobrevida1: "100%",
        sobrevida2: "85%",
        riesgoQuirurgico: "Mortalidad perioperatoria baja (10%)",
        badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      };
    }
    if (childPughPuntos <= 9) {
      return {
        clase: "Clase B (Compromiso Funcional)",
        sobrevida1: "80%",
        sobrevida2: "60%",
        riesgoQuirurgico: "Mortalidad perioperatoria moderada (30%)",
        badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
      };
    }
    return {
      clase: "Clase C (Descompensada Severa)",
      sobrevida1: "45%",
      sobrevida2: "35%",
      riesgoQuirurgico: "Mortalidad perioperatoria muy alta (80%) - Contraindicación relativa",
      badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
    };
  }, [childPughPuntos]);

  // Calculadora MELD-Na
  const [meldBili, setMeldBili] = useState<number>(2.5);
  const [meldInr, setMeldInr] = useState<number>(1.8);
  const [meldCr, setMeldCr] = useState<number>(1.4);
  const [meldNa, setMeldNa] = useState<number>(132);

  const calcMeldNa = useMemo(() => {
    const bili = Math.max(1, meldBili);
    const inr = Math.max(1, meldInr);
    const cr = Math.min(4, Math.max(1, meldCr));
    const na = Math.min(135, Math.max(125, meldNa));

    // Fórmula MELD estándar: 9.57 * ln(Cr) + 3.78 * ln(Bili) + 11.2 * ln(INR) + 6.43
    const meldBase =
      9.57 * Math.log(cr) +
      3.78 * Math.log(bili) +
      11.2 * Math.log(inr) +
      6.43;

    let meldFinal = Math.round(meldBase);
    if (meldFinal > 11) {
      // MELD-Na = MELD + 1.32 * (137 - Na) - [0.033 * MELD * (137 - Na)]
      const meldNaVal = meldFinal + 1.32 * (137 - na) - 0.033 * meldFinal * (137 - na);
      meldFinal = Math.round(meldNaVal);
    }
    return Math.min(40, Math.max(6, meldFinal));
  }, [meldBili, meldInr, meldCr, meldNa]);

  const meldMortalidad = useMemo(() => {
    if (calcMeldNa < 10) return "< 2% de mortalidad a 90 días";
    if (calcMeldNa <= 19) return "6% de mortalidad a 90 días";
    if (calcMeldNa <= 29) return "20% de mortalidad a 90 días";
    if (calcMeldNa <= 39) return "53% de mortalidad a 90 días";
    return "> 70% de mortalidad a 90 días (Prioridad urgente de trasplante)";
  }, [calcMeldNa]);

  // Filtrado de consultas
  const consultasFiltradas = useMemo(() => {
    return consultas.filter((c) => {
      const matchBusqueda =
        c.paciente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.diagnostico.toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.hallazgos_endoscopia && c.hallazgos_endoscopia.toLowerCase().includes(busqueda.toLowerCase()));
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

    const nueva: ConsultaGastroenterologia = {
      id: `gas-${Date.now().toString().slice(-4)}`,
      paciente_nombre: formNombre,
      edad_sexo: formEdadSexo,
      tipo_consulta: formTipo,
      fecha: new Date().toISOString().split("T")[0],
      forrest_class: formTipo === "ulcera_peptica_forrest" ? (formForrest as any) : undefined,
      child_pugh_clase: formTipo === "cirrosis_hepatica" ? (formChildClase as any) : undefined,
      meld_score: formTipo === "cirrosis_hepatica" ? parseInt(formMeld) || undefined : undefined,
      blatchford_score: formBlatchford ? parseInt(formBlatchford) || undefined : undefined,
      hallazgos_endoscopia: formEndoscopia.trim() || undefined,
      diagnostico: formDiag,
      plan_conducta: formPlan,
    };

    setConsultas([nueva, ...consultas]);
    setModalNueva(false);
    toast.success("Consulta gastroenterológica registrada con éxito.");

    setFormNombre("");
    setFormEndoscopia("");
    setFormDiag("");
    setFormPlan("");
  };

  return (
    <div className="space-y-6 pb-12">
      <ClinicalPageHeader
        title="Gastroenterología, Endoscopia & Hepatología"
        description="Hemostasia de úlcera péptica (Forrest), clasificación de falla hepática Child-Pugh, MELD-Na, Glasgow-Blatchford y patología inflamatoria."
        badgeText="Servicio Clínico & Endoscópico"
        actions={
          <Button
            onClick={() => setModalNueva(true)}
            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Consulta Digestiva
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Casos Gastroenterología"
          value={consultas.length.toString()}
          subtitle="Pacientes evaluados en el servicio"
          icon={<Flame className="h-5 w-5 text-amber-600" />}
        />
        <ClinicalKpiCard
          title="Hemorragia Digestiva"
          value={consultas.filter((c) => c.tipo_consulta === "hemorragia_digestiva" || c.tipo_consulta === "ulcera_peptica_forrest").length.toString()}
          subtitle="HDA / HDB con estratificación Forrest"
          icon={<ShieldAlert className="h-5 w-5 text-rose-600" />}
        />
        <ClinicalKpiCard
          title="Hepatología / Cirrosis"
          value={consultas.filter((c) => c.tipo_consulta === "cirrosis_hepatica").length.toString()}
          subtitle="Seguimiento Child-Pugh & MELD-Na"
          icon={<Layers className="h-5 w-5 text-emerald-600" />}
        />
        <ClinicalKpiCard
          title="Procedimientos Endoscópicos"
          value={consultas.filter((c) => !!c.hallazgos_endoscopia).length.toString()}
          subtitle="VEDA y Colonoscopias terapéuticas"
          icon={<Activity className="h-5 w-5 text-blue-600" />}
        />
      </div>

      {/* Pestañas Clínicas */}
      <Tabs defaultValue="consultas" className="w-full">
        <TabsList className="bg-muted/70 p-1 rounded-xl">
          <TabsTrigger value="consultas" className="rounded-lg text-xs font-semibold gap-2">
            <FileText className="h-4 w-4" />
            Consultas & Endoscopias
          </TabsTrigger>
          <TabsTrigger value="forrest" className="rounded-lg text-xs font-semibold gap-2">
            <Flame className="h-4 w-4" />
            Clasificación de Forrest (HDA)
          </TabsTrigger>
          <TabsTrigger value="child_pugh" className="rounded-lg text-xs font-semibold gap-2">
            <Calculator className="h-4 w-4" />
            Escala Child-Pugh Cirrosis
          </TabsTrigger>
          <TabsTrigger value="meld" className="rounded-lg text-xs font-semibold gap-2">
            <Stethoscope className="h-4 w-4" />
            Calculadora MELD-Na
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CONSULTAS */}
        <TabsContent value="consultas" className="space-y-4 pt-2">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente, diagnóstico o hallazgo endoscópico..."
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
                <SelectItem value="ulcera_peptica_forrest">Úlcera Péptica (Forrest)</SelectItem>
                <SelectItem value="cirrosis_hepatica">Cirrosis Hepática (Child/MELD)</SelectItem>
                <SelectItem value="hemorragia_digestiva">Hemorragia Digestiva Alta/Baja</SelectItem>
                <SelectItem value="enfermedad_inflamatoria">Enf. Inflamatoria (CUCI/Crohn)</SelectItem>
                <SelectItem value="dispepsia_hpylori">Dispepsia & H. pylori</SelectItem>
                <SelectItem value="sindrome_intestino_irritable">Intestino Irritable (Roma IV)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grid de Consultas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {consultasFiltradas.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 border border-dashed rounded-2xl">
                No se encontraron consultas registradas para este filtro.
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
                          <User className="h-4 w-4 text-amber-600" />
                          {c.paciente_nombre}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {c.edad_sexo} • Atendido el {c.fecha}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          c.tipo_consulta === "ulcera_peptica_forrest" || c.tipo_consulta === "hemorragia_digestiva"
                            ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
                            : c.tipo_consulta === "cirrosis_hepatica"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                            : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
                        }
                      >
                        {c.tipo_consulta.replace(/_/g, " ").toUpperCase()}
                      </Badge>
                    </div>

                    {/* Escalas Clínicas Rápidas */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {c.forrest_class && (
                        <Badge className="bg-rose-600 text-white font-bold">
                          Forrest {c.forrest_class}
                        </Badge>
                      )}
                      {c.child_pugh_clase && (
                        <Badge variant="secondary" className="bg-amber-500/15 text-amber-800 dark:text-amber-300">
                          {c.child_pugh_clase}
                        </Badge>
                      )}
                      {c.meld_score !== undefined && (
                        <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400 font-bold">
                          MELD-Na: {c.meld_score}
                        </Badge>
                      )}
                      {c.blatchford_score !== undefined && (
                        <Badge variant="outline" className="border-blue-500 text-blue-700 dark:text-blue-400">
                          GBS: {c.blatchford_score} pts
                        </Badge>
                      )}
                    </div>

                    {c.hallazgos_endoscopia && (
                      <div className="text-xs bg-muted/40 p-2.5 rounded-xl border border-border/80 text-muted-foreground">
                        <strong className="text-foreground block mb-0.5">Hallazgo Endoscópico:</strong>
                        <p className="line-clamp-2">{c.hallazgos_endoscopia}</p>
                      </div>
                    )}

                    <div className="space-y-1 text-xs">
                      <p className="line-clamp-2 text-muted-foreground">
                        <strong className="text-foreground">Diagnóstico:</strong> {c.diagnostico}
                      </p>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-xs text-muted-foreground border-t border-border/60">
                      <span>Click para ver informe y prescripción</span>
                      <CheckCircle2 className="h-4 w-4 text-amber-600" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* TAB 2: CLASIFICACIÓN DE FORREST */}
        <TabsContent value="forrest" className="space-y-4 pt-2">
          <ForrestTab
            selForrest={selForrest}
            setSelForrest={setSelForrest}
            infoForrest={infoForrest}
            onAsignarConsulta={(f) => setFormForrest(f)}
          />
        </TabsContent>

        {/* TAB 3: CHILD-PUGH */}
        <TabsContent value="child_pugh" className="space-y-4 pt-2">
          <ChildPughTab
            cpBilirrubina={cpBilirrubina}
            setCpBilirrubina={setCpBilirrubina}
            cpAlbumina={cpAlbumina}
            setCpAlbumina={setCpAlbumina}
            cpInr={cpInr}
            setCpInr={setCpInr}
            cpAscitis={cpAscitis}
            setCpAscitis={setCpAscitis}
            cpEncefalopatia={cpEncefalopatia}
            setCpEncefalopatia={setCpEncefalopatia}
            childPughPuntos={childPughPuntos}
            childPughResultado={childPughResultado}
            onUsarClase={(clase) => setFormChildClase(clase)}
          />
        </TabsContent>

        {/* TAB 4: MELD-Na */}
        <TabsContent value="meld" className="space-y-4 pt-2">
          <MeldTab
            meldCr={meldCr}
            setMeldCr={setMeldCr}
            meldBili={meldBili}
            setMeldBili={setMeldBili}
            meldInr={meldInr}
            setMeldInr={setMeldInr}
            meldNa={meldNa}
            setMeldNa={setMeldNa}
            calcMeldNa={calcMeldNa}
            meldMortalidad={meldMortalidad}
            onTransferir={(score) => setFormMeld(score.toString())}
          />
        </TabsContent>
      </Tabs>

      {/* MODAL NUEVA CONSULTA */}
      <Dialog open={modalNueva} onOpenChange={setModalNueva}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-5 w-5 text-amber-600" />
              Nueva Consulta Gastroenterológica & Endoscópica
            </DialogTitle>
            <DialogDescription>
              Complete los datos clínicos, graduación endoscópica o hepática y plan de tratamiento.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCrearConsulta} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nombre del Paciente:</Label>
                <Input
                  placeholder="Ej: Rafael Tejada"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="rounded-xl border-border/80"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Edad / Sexo:</Label>
                <Input
                  placeholder="Ej: 52a / M"
                  value={formEdadSexo}
                  onChange={(e) => setFormEdadSexo(e.target.value)}
                  className="rounded-xl border-border/80"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tipo de Consulta / Patología:</Label>
                <Select value={formTipo} onValueChange={(v) => setFormTipo(v as TipoConsultaGastro)}>
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ulcera_peptica_forrest">Úlcera Péptica (Forrest)</SelectItem>
                    <SelectItem value="cirrosis_hepatica">Cirrosis Hepática (Child/MELD)</SelectItem>
                    <SelectItem value="hemorragia_digestiva">Hemorragia Digestiva Alta/Baja</SelectItem>
                    <SelectItem value="enfermedad_inflamatoria">Enf. Inflamatoria (CUCI/Crohn)</SelectItem>
                    <SelectItem value="dispepsia_hpylori">Dispepsia & H. pylori</SelectItem>
                    <SelectItem value="sindrome_intestino_irritable">Intestino Irritable (Roma IV)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formTipo === "ulcera_peptica_forrest" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Clasificación de Forrest:</Label>
                  <Select value={formForrest} onValueChange={setFormForrest}>
                    <SelectTrigger className="rounded-xl border-border/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ia">Forrest Ia (Chorro arterial)</SelectItem>
                      <SelectItem value="Ib">Forrest Ib (Babeante)</SelectItem>
                      <SelectItem value="IIa">Forrest IIa (Vaso visible)</SelectItem>
                      <SelectItem value="IIb">Forrest IIb (Coágulo adherido)</SelectItem>
                      <SelectItem value="IIc">Forrest IIc (Hematina plana)</SelectItem>
                      <SelectItem value="III">Forrest III (Base limpia)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : formTipo === "cirrosis_hepatica" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Clase Child-Pugh:</Label>
                  <Select value={formChildClase} onValueChange={setFormChildClase}>
                    <SelectTrigger className="rounded-xl border-border/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Clase A (5-6 pts)">Clase A (Compensada)</SelectItem>
                      <SelectItem value="Clase B (7-9 pts)">Clase B (Compromiso funcional)</SelectItem>
                      <SelectItem value="Clase C (10-15 pts)">Clase C (Descompensada severa)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Glasgow-Blatchford Score (GBS):</Label>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={formBlatchford}
                    onChange={(e) => setFormBlatchford(e.target.value)}
                    className="rounded-xl border-border/80"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Hallazgos Endoscópicos (VEDA / Colonoscopia):</Label>
              <Textarea
                placeholder="Descripción del procedimiento endoscópico, localización de lesiones, mucosa..."
                value={formEndoscopia}
                onChange={(e) => setFormEndoscopia(e.target.value)}
                rows={2}
                className="rounded-xl border-border/80 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Diagnóstico Clínico / CIE-10:</Label>
              <Textarea
                placeholder="Ej: Hemorragia digestiva alta por úlcera gástrica péptica activa (K25.0)"
                value={formDiag}
                onChange={(e) => setFormDiag(e.target.value)}
                rows={2}
                className="rounded-xl border-border/80 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Plan de Conducta & Terapéutica:</Label>
              <Textarea
                placeholder="Terapia endoscópica, inhibidores de bomba de protones, procinéticos, profilaxis..."
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
              <Button type="submit" className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium">
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
                <Flame className="h-5 w-5 text-amber-600" />
                Informe Gastroenterológico - {consultaDetalle.paciente_nombre}
              </DialogTitle>
              <DialogDescription>
                Fecha de evaluación: {consultaDetalle.fecha} • {consultaDetalle.edad_sexo}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              <div className="flex flex-wrap gap-2">
                {consultaDetalle.forrest_class && (
                  <Badge className="bg-rose-600 text-white">
                    Úlcera Forrest {consultaDetalle.forrest_class}
                  </Badge>
                )}
                {consultaDetalle.child_pugh_clase && (
                  <Badge variant="secondary">
                    {consultaDetalle.child_pugh_clase}
                  </Badge>
                )}
                {consultaDetalle.meld_score !== undefined && (
                  <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">
                    MELD-Na: {consultaDetalle.meld_score}
                  </Badge>
                )}
              </div>

              {consultaDetalle.hallazgos_endoscopia && (
                <div className="p-3 bg-muted/40 border border-border/80 rounded-xl space-y-1">
                  <strong className="text-foreground block">Informe de Endoscopia Digestiva:</strong>
                  <p className="text-muted-foreground leading-relaxed">{consultaDetalle.hallazgos_endoscopia}</p>
                </div>
              )}

              <div className="space-y-1">
                <span className="font-bold text-foreground block">Diagnóstico:</span>
                <p className="p-3 bg-muted/20 border border-border/80 rounded-xl leading-relaxed">
                  {consultaDetalle.diagnostico}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-foreground block">Plan de Manejo & Prescripción:</span>
                <p className="p-3 bg-muted/20 border border-border/80 rounded-xl leading-relaxed whitespace-pre-wrap">
                  {consultaDetalle.plan_conducta}
                </p>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => window.print()} className="rounded-xl">
                Imprimir Informe
              </Button>
              <Button onClick={() => setConsultaDetalle(null)} className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white">
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
