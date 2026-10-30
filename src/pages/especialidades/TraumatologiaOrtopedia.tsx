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
  Bone,
} from "lucide-react";
import { toast } from "sonner";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

export type TipoConsultaTrauma =
  | "fracturas_expuestas"
  | "fractura_cadera_femur"
  | "artrosis_cadera_rodilla"
  | "lesion_ligamentaria"
  | "politraumatismo_atls";

interface ConsultaTraumatologia {
  id: string;
  paciente_nombre: string;
  edad_sexo: string;
  tipo_consulta: TipoConsultaTrauma;
  fecha: string;
  gustilo_grado?: "I" | "II" | "IIIA" | "IIIB" | "IIIC";
  garden_estadio?: "I" | "II" | "III" | "IV";
  womac_total?: number;
  lateralidad?: "Derecho" | "Izquierdo" | "Bilateral";
  diagnostico: string;
  plan_conducta: string;
}

const MOCK_CONSULTAS_TRAUMA: ConsultaTraumatologia[] = [
  {
    id: "tra-01",
    paciente_nombre: "Don Julio César Matos",
    edad_sexo: "78a / M",
    tipo_consulta: "fractura_cadera_femur",
    fecha: "2026-10-29",
    garden_estadio: "III",
    lateralidad: "Izquierdo",
    diagnostico: "Fractura intracapsular desplazada de cuello de fémur izquierdo (Garden III / Pauwels 50°)",
    plan_conducta: "Tracción transesquelética analgésica. Solicitud de hemoglobina, tipificación cruzada 2 paquetes globulares. Hemiartroplastia bipolar de cadera en quirófano dentro de las próximas 24 horas. Profilaxis con Enoxaparina 40mg SC q24h.",
  },
  {
    id: "tra-02",
    paciente_nombre: "Marcos Alejandro Vidal",
    edad_sexo: "28a / M",
    tipo_consulta: "fracturas_expuestas",
    fecha: "2026-10-28",
    gustilo_grado: "IIIA",
    lateralidad: "Derecho",
    diagnostico: "Fractura abierta diafisaria de tibia y peroné derecho Gustilo-Anderson IIIA por colisión en motocicleta",
    plan_conducta: "Lavado profuso en quirófano con 6 litros de solución fisiológica. Fijador externo monoaxial temporal. Cefazolina 2g IV q8h + Gentamicina 240mg IV q24h + Toxoide tetánico STAT.",
  },
  {
    id: "tra-03",
    paciente_nombre: "Doña Altagracia Núñez",
    edad_sexo: "66a / F",
    tipo_consulta: "artrosis_cadera_rodilla",
    fecha: "2026-10-27",
    womac_total: 58,
    lateralidad: "Bilateral",
    diagnostico: "Gonartrosis tricompartimental grado IV (Kellgren-Lawrence) con genu varo bilateral e impotencia funcional",
    plan_conducta: "Índice WOMAC severo (58/96 pts). Discusión de Artroplastia Total de Rodilla (ATR) primaria derecha. Infiltración analgésica con ácido hialurónico reticulado de alto peso molecular mientras programa cirugía.",
  },
  {
    id: "tra-04",
    paciente_nombre: "Kelvin José Pimentel",
    edad_sexo: "22a / M",
    tipo_consulta: "lesion_ligamentaria",
    fecha: "2026-10-26",
    lateralidad: "Izquierdo",
    diagnostico: "Ruptura completa del Ligamento Cruzado Anterior (LCA) + Desgarro en asa de cubo cuerno posterior menisco medial rodilla izquierda",
    plan_conducta: "Resonancia magnética 1.5T confirmatoria. Crioterapia, inmovilizador articulado en extensión. Reconstrucción artroscópica de LCA con autoinjerto hueso-tendón-hueso (HTH) programada.",
  },
];

export default function TraumatologiaOrtopedia() {
  const [consultas, setConsultas] = useState<ConsultaTraumatologia[]>(MOCK_CONSULTAS_TRAUMA);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [modalNueva, setModalNueva] = useState(false);
  const [consultaDetalle, setConsultaDetalle] = useState<ConsultaTraumatologia | null>(null);

  // Form State
  const [formNombre, setFormNombre] = useState("");
  const [formEdadSexo, setFormEdadSexo] = useState("45a / M");
  const [formTipo, setFormTipo] = useState<TipoConsultaTrauma>("fracturas_expuestas");
  const [formGustilo, setFormGustilo] = useState<string>("IIIA");
  const [formGarden, setFormGarden] = useState<string>("III");
  const [formLateralidad, setFormLateralidad] = useState<string>("Derecho");
  const [formWomac, setFormWomac] = useState("45");
  const [formDiag, setFormDiag] = useState("");
  const [formPlan, setFormPlan] = useState("");

  // Calculadora Gustilo-Anderson State
  const [selGustilo, setSelGustilo] = useState<"I" | "II" | "IIIA" | "IIIB" | "IIIC">("IIIA");

  const infoGustilo = useMemo(() => {
    switch (selGustilo) {
      case "I":
        return {
          descripcion: "Herida limpia < 1 cm, mecanismo de adentro hacia afuera, sin signos de aplastamiento o contaminación masiva.",
          infeccion: "Tasa de infección: 0% - 2%",
          antibiotico: "Cefazolina 1-2g IV c/8h por 24-48 horas tras el cierre cutáneo.",
          tiempo: "Quirófano dentro de las primeras 6 horas para lavado mecánico.",
          badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
        };
      case "II":
        return {
          descripcion: "Herida entre 1 y 10 cm con daño tisular moderado, mínima contusión perióstica y adecuada cobertura ósea.",
          infeccion: "Tasa de infección: 2% - 7%",
          antibiotico: "Cefazolina 2g IV c/8h + Gentamicina 5 mg/kg/día IV por 48 horas.",
          tiempo: "Desbridamiento minucioso en quirófano de urgencia &lt; 6 horas.",
          badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
        };
      case "IIIA":
        return {
          descripcion: "Herida > 10 cm con daño masivo de partes blandas pero con PERIOSTIO ÍNTEGRO y cobertura cutánea suficiente.",
          infeccion: "Tasa de infección: 10% - 25%",
          antibiotico: "Cefazolina 2g c/8h + Gentamicina 5 mg/kg/día + Penicilina G si contaminación con tierra (anaerobios).",
          tiempo: "Fijación externa inmediata y lavado a presión con solución salina estéril.",
          badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
        };
      case "IIIB":
        return {
          descripcion: "Pérdida extensa de periostio y tejidos blandos con HUESO EXPUESTO y desvascularizado que requiere colgajo microquirúrgico.",
          infeccion: "Tasa de infección: 25% - 50%",
          antibiotico: "Triple cobertura antibiótica IV + Vacunación e inmunoglobulina antitetánica.",
          tiempo: "Estabilización con tutor externo y cobertura plástica reconstructiva precoz (&lt; 7 días).",
          badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
        };
      case "IIIC":
        return {
          descripcion: "Cualquier fractura abierta asociada a LESIÓN VASCULAR ARTERIAL que requiere revascularización urgente para salvar la extremidad.",
          infeccion: "Tasa de amputación secundaria: > 50%",
          antibiotico: "Antibioticoterapia de máxima potencia + Intervención conjunta urgente con Cirugía Vascular.",
          tiempo: "Isquemia crítica: Ventana de revascularización arterial urgente &lt; 6 horas (Shunt carotídeo temporal).",
          badge: "bg-rose-600 text-white border-rose-700",
        };
    }
  }, [selGustilo]);

  // Calculadora Garden (Cuello Femoral)
  const [selGarden, setSelGarden] = useState<"I" | "II" | "III" | "IV">("III");

  const infoGarden = useMemo(() => {
    switch (selGarden) {
      case "I":
        return {
          tipo: "Fractura incompleta o impactada en valgo (No desplazada / Estable).",
          necrosis: "Riesgo de necrosis avascular de cabeza femoral: < 10%",
          conducta: "Osteosíntesis con 3 tornillos canulados paralelos en triángulo invertido o tornillo deslizante DHS.",
        };
      case "II":
        return {
          tipo: "Fractura completa no desplazada con continuidad de las trabéculas óseas.",
          necrosis: "Riesgo de necrosis avascular: 15% - 20%",
          conducta: "Fijación interna con tornillos canulados para permitir carga y deambulación precoz.",
        };
      case "III":
        return {
          tipo: "Fractura completa parcialmente desplazada con rotación del eje trabecular cefálico.",
          necrosis: "Riesgo de necrosis avascular y seudoartrosis: 40% - 50%",
          conducta: "Adultos jóvenes (<65a): Reducción anatómica cerrada/abierta urgente y osteosíntesis. Adultos mayores (>65a): Artroplastia de cadera (bipolar o total).",
        };
      case "IV":
        return {
          tipo: "Fractura completa con pérdida total del contacto y paralelismo trabecular (Desplazamiento total).",
          necrosis: "Riesgo de necrosis avascular: > 70%",
          conducta: "Artroplastia parcial (Thompson/Bipolar) o Artroplastia Total de Cadera (prótesis) según estado cognitivo y autonomía previa.",
        };
    }
  }, [selGarden]);

  // Calculadora WOMAC
  const [wDolor, setWDolor] = useState<number>(14); // 0-20
  const [wRigidez, setWRigidez] = useState<number>(5); // 0-8
  const [wFuncion, setWFuncion] = useState<number>(38); // 0-68

  const womacTotalCalc = useMemo(() => {
    return Math.min(96, Math.max(0, wDolor + wRigidez + wFuncion));
  }, [wDolor, wRigidez, wFuncion]);

  const womacInterpretacion = useMemo(() => {
    if (womacTotalCalc < 25) {
      return {
        severidad: "Leve",
        recomendacion: "Manejo conservador, fisioterapia activa, pérdida ponderal y AINEs tópicos.",
        badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      };
    }
    if (womacTotalCalc <= 50) {
      return {
        severidad: "Moderada",
        recomendacion: "Viscosuplementación intraarticular con ácido hialurónico, analgésicos orales y ortesis de descarga.",
        badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
      };
    }
    return {
      severidad: "Severa / Incapacitante",
      recomendacion: "Indicación quirúrgica formal de Artroplastia Total Articular (Prótesis de rodilla o cadera).",
      badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
    };
  }, [womacTotalCalc]);

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

    const nueva: ConsultaTraumatologia = {
      id: `tra-${Date.now().toString().slice(-4)}`,
      paciente_nombre: formNombre,
      edad_sexo: formEdadSexo,
      tipo_consulta: formTipo,
      fecha: new Date().toISOString().split("T")[0],
      gustilo_grado: formTipo === "fracturas_expuestas" ? (formGustilo as any) : undefined,
      garden_estadio: formTipo === "fractura_cadera_femur" ? (formGarden as any) : undefined,
      lateralidad: formLateralidad as any,
      womac_total: formTipo === "artrosis_cadera_rodilla" ? parseInt(formWomac) || undefined : undefined,
      diagnostico: formDiag,
      plan_conducta: formPlan,
    };

    setConsultas([nueva, ...consultas]);
    setModalNueva(false);
    toast.success("Consulta traumatológica guardada exitosamente.");

    setFormNombre("");
    setFormDiag("");
    setFormPlan("");
  };

  return (
    <div className="space-y-6 pb-12">
      <ClinicalPageHeader
        title="Traumatología & Cirugía Ortopédica"
        description="Clasificación de fracturas expuestas Gustilo-Anderson, fracturas de cadera Garden, escala funcional WOMAC y control de daños ortopédicos."
        badgeText="Servicio Quirúrgico Especializado"
        actions={
          <Button
            onClick={() => setModalNueva(true)}
            className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Consulta Ortopédica
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Casos Ortopedia"
          value={consultas.length.toString()}
          subtitle="Seguimiento clínico y postquirúrgico"
          icon={<Bone className="h-5 w-5 text-orange-600" />}
        />
        <ClinicalKpiCard
          title="Fracturas Abiertas"
          value={consultas.filter((c) => c.tipo_consulta === "fracturas_expuestas").length.toString()}
          subtitle="Urgencias Gustilo-Anderson"
          icon={<ShieldAlert className="h-5 w-5 text-rose-600" />}
        />
        <ClinicalKpiCard
          title="Fracturas de Cadera"
          value={consultas.filter((c) => c.tipo_consulta === "fractura_cadera_femur").length.toString()}
          subtitle="Estratificación Garden & Artroplastia"
          icon={<Activity className="h-5 w-5 text-amber-600" />}
        />
        <ClinicalKpiCard
          title="Evaluaciones WOMAC"
          value={consultas.filter((c) => c.womac_total !== undefined).length.toString()}
          subtitle="Monitoreo funcional articular"
          icon={<Calculator className="h-5 w-5 text-blue-600" />}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="consultas" className="w-full">
        <TabsList className="bg-muted/70 p-1 rounded-xl">
          <TabsTrigger value="consultas" className="rounded-lg text-xs font-semibold gap-2">
            <FileText className="h-4 w-4" />
            Historial de Pacientes & Casos
          </TabsTrigger>
          <TabsTrigger value="gustilo" className="rounded-lg text-xs font-semibold gap-2">
            <ShieldAlert className="h-4 w-4" />
            Gustilo-Anderson (Fracturas Abiertas)
          </TabsTrigger>
          <TabsTrigger value="garden" className="rounded-lg text-xs font-semibold gap-2">
            <Bone className="h-4 w-4" />
            Escala Garden (Cuello Femoral)
          </TabsTrigger>
          <TabsTrigger value="womac" className="rounded-lg text-xs font-semibold gap-2">
            <Calculator className="h-4 w-4" />
            Índice WOMAC (Artrosis)
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CONSULTAS */}
        <TabsContent value="consultas" className="space-y-4 pt-2">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente, diagnóstico o lateralidad..."
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
                <SelectItem value="fracturas_expuestas">Fracturas Expuestas (Gustilo)</SelectItem>
                <SelectItem value="fractura_cadera_femur">Fractura de Cadera (Garden)</SelectItem>
                <SelectItem value="artrosis_cadera_rodilla">Artrosis (WOMAC)</SelectItem>
                <SelectItem value="lesion_ligamentaria">Lesiones Ligamentos / LCA</SelectItem>
                <SelectItem value="politraumatismo_atls">Politraumatismo Ortopédico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tarjetas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {consultasFiltradas.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 border border-dashed rounded-2xl">
                No se encontraron registros de traumatología para el criterio seleccionado.
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
                          <User className="h-4 w-4 text-orange-600" />
                          {c.paciente_nombre}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {c.edad_sexo} • Lado: <strong>{c.lateralidad || "N/A"}</strong> • Atendido el {c.fecha}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          c.tipo_consulta === "fracturas_expuestas"
                            ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
                            : c.tipo_consulta === "fractura_cadera_femur"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                            : "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30"
                        }
                      >
                        {c.tipo_consulta.replace(/_/g, " ").toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {c.gustilo_grado && (
                        <Badge className="bg-rose-600 text-white font-bold">
                          Gustilo {c.gustilo_grado}
                        </Badge>
                      )}
                      {c.garden_estadio && (
                        <Badge variant="secondary" className="bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold">
                          Garden {c.garden_estadio}
                        </Badge>
                      )}
                      {c.womac_total !== undefined && (
                        <Badge variant="outline" className="border-orange-500 text-orange-700 dark:text-orange-400">
                          WOMAC: {c.womac_total}/96 pts
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="line-clamp-2 text-muted-foreground">
                        <strong className="text-foreground">Diagnóstico:</strong> {c.diagnostico}
                      </p>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-xs text-muted-foreground border-t border-border/60">
                      <span>Click para ver conducta quirúrgica</span>
                      <CheckCircle2 className="h-4 w-4 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* TAB 2: GUSTILO-ANDERSON */}
        <TabsContent value="gustilo" className="space-y-4 pt-2">
          <Card className="rounded-2xl border-border/80 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-orange-600" />
                Clasificación de Gustilo y Anderson para Fracturas Expuestas
              </CardTitle>
              <CardDescription>
                Protocolo estandarizado de riesgo infeccioso, antibioticoterapia empírica y tiempo límite de desbridamiento en quirófano (&lt; 6 horas).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(["I", "II", "IIIA", "IIIB", "IIIC"] as const).map((g) => (
                  <Button
                    key={g}
                    variant={selGustilo === g ? "default" : "outline"}
                    className={`rounded-xl text-xs font-bold py-5 ${
                      selGustilo === g ? "bg-orange-600 hover:bg-orange-700 text-white" : ""
                    }`}
                    onClick={() => setSelGustilo(g)}
                  >
                    Grado {g}
                  </Button>
                ))}
              </div>

              <div className="p-6 rounded-2xl border border-border/80 bg-muted/20 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <span className="text-2xl font-extrabold text-foreground">Gustilo-Anderson Grado {selGustilo}</span>
                  <Badge className={infoGustilo.badge}>{infoGustilo.infeccion}</Badge>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <strong className="text-foreground block text-sm">Criterios de Daño Tisular y Periostio:</strong>
                    <p className="text-muted-foreground mt-0.5">{infoGustilo.descripcion}</p>
                  </div>

                  <div className="p-3.5 bg-background rounded-xl border border-border/80 space-y-1">
                    <strong className="text-foreground block text-sm">Antibioticoterapia de Urgencia:</strong>
                    <p className="text-muted-foreground leading-relaxed">{infoGustilo.antibiotico}</p>
                  </div>

                  <div className="p-3.5 bg-background rounded-xl border border-border/80 space-y-1">
                    <strong className="text-foreground block text-sm">Ventana Quirúrgica Óptima:</strong>
                    <p className="text-muted-foreground leading-relaxed">{infoGustilo.tiempo}</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => {
                    setFormGustilo(selGustilo);
                    toast.info(`Grado Gustilo ${selGustilo} seleccionado para nueva consulta.`);
                  }}
                >
                  Transferir Grado a Formulario
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: GARDEN CUELLO FEMORAL */}
        <TabsContent value="garden" className="space-y-4 pt-2">
          <Card className="rounded-2xl border-border/80 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bone className="h-5 w-5 text-orange-600" />
                Clasificación de Garden (Fractura de Cuello de Fémur)
              </CardTitle>
              <CardDescription>
                Evaluación del desplazamiento de las trabéculas óseas femorales para decidir osteosíntesis con tornillos canulados vs artroplastia protésica.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["I", "II", "III", "IV"] as const).map((g) => (
                  <Button
                    key={g}
                    variant={selGarden === g ? "default" : "outline"}
                    className={`rounded-xl text-xs font-bold py-5 ${
                      selGarden === g ? "bg-orange-600 hover:bg-orange-700 text-white" : ""
                    }`}
                    onClick={() => setSelGarden(g)}
                  >
                    Garden {g}
                  </Button>
                ))}
              </div>

              <div className="p-6 rounded-2xl border border-border/80 bg-muted/20 space-y-4">
                <span className="text-2xl font-extrabold text-foreground">Garden {selGarden}</span>
                <div className="space-y-3 text-xs">
                  <div>
                    <strong className="text-foreground block text-sm">Patrón Radiológico:</strong>
                    <p className="text-muted-foreground mt-0.5">{infoGarden.tipo}</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <strong className="text-amber-800 dark:text-amber-300 block">Riesgo Isquémico:</strong>
                    <p className="text-amber-700 dark:text-amber-400">{infoGarden.necrosis}</p>
                  </div>
                  <div className="p-3.5 bg-background rounded-xl border border-border/80">
                    <strong className="text-foreground block text-sm">Conducta Quirúrgica Recomendada:</strong>
                    <p className="text-muted-foreground leading-relaxed mt-0.5">{infoGarden.conducta}</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => {
                    setFormGarden(selGarden);
                    toast.info(`Estadio Garden ${selGarden} asignado.`);
                  }}
                >
                  Asignar a Formulario
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: WOMAC */}
        <TabsContent value="womac" className="space-y-4 pt-2">
          <Card className="rounded-2xl border-border/80 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5 text-orange-600" />
                Índice WOMAC de Artrosis de Rodilla y Cadera
              </CardTitle>
              <CardDescription>
                Cuantificación multidimensional del dolor, rigidez matutina e incapacidad funcional física (0 a 96 puntos).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Subescala de Dolor (0 a 20 puntos):</Label>
                    <Input
                      type="number"
                      min={0}
                      max={20}
                      value={wDolor}
                      onChange={(e) => setWDolor(Number(e.target.value))}
                      className="rounded-xl border-border/80"
                    />
                    <span className="text-[11px] text-muted-foreground block">
                      Dolor al caminar en llano, subir escaleras, de noche en cama, sentado y de pie.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Subescala de Rigidez (0 a 8 puntos):</Label>
                    <Input
                      type="number"
                      min={0}
                      max={8}
                      value={wRigidez}
                      onChange={(e) => setWRigidez(Number(e.target.value))}
                      className="rounded-xl border-border/80"
                    />
                    <span className="text-[11px] text-muted-foreground block">
                      Rigidez tras levantarse de la cama y tras sentarse o descansar.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Subescala de Capacidad Funcional (0 a 68 puntos):</Label>
                    <Input
                      type="number"
                      min={0}
                      max={68}
                      value={wFuncion}
                      onChange={(e) => setWFuncion(Number(e.target.value))}
                      className="rounded-xl border-border/80"
                    />
                    <span className="text-[11px] text-muted-foreground block">
                      Dificultad para calzarse, bajar del coche, agacharse o labores domésticas.
                    </span>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Puntuación Total WOMAC:</span>
                      <span className="text-3xl font-extrabold text-foreground">{womacTotalCalc} / 96 pts</span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">Nivel de Incapacidad:</span>
                      <Badge className={`w-full justify-center py-1.5 text-xs font-bold ${womacInterpretacion.badge}`}>
                        Severidad {womacInterpretacion.severidad}
                      </Badge>
                    </div>

                    <div className="p-3.5 bg-background rounded-xl border border-border/80 text-xs space-y-1">
                      <strong className="text-foreground block">Conducta Terapéutica Sugerida:</strong>
                      <p className="text-muted-foreground leading-relaxed">{womacInterpretacion.recomendacion}</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full rounded-xl text-xs"
                    onClick={() => {
                      setFormWomac(womacTotalCalc.toString());
                      toast.info(`WOMAC (${womacTotalCalc} pts) transferido a nueva consulta.`);
                    }}
                  >
                    Usar puntaje en formulario
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
              <Bone className="h-5 w-5 text-orange-600" />
              Nueva Consulta Traumatológica & Ortopédica
            </DialogTitle>
            <DialogDescription>
              Complete los datos del paciente, lateralidad de la lesión, estadificación y plan quirúrgico.
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
                <Label className="text-xs font-semibold">Tipo de Patología / Lesión:</Label>
                <Select value={formTipo} onValueChange={(v) => setFormTipo(v as TipoConsultaTrauma)}>
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fracturas_expuestas">Fracturas Expuestas (Gustilo)</SelectItem>
                    <SelectItem value="fractura_cadera_femur">Fractura de Cadera (Garden)</SelectItem>
                    <SelectItem value="artrosis_cadera_rodilla">Artrosis (WOMAC)</SelectItem>
                    <SelectItem value="lesion_ligamentaria">Lesiones Ligamentos / LCA</SelectItem>
                    <SelectItem value="politraumatismo_atls">Politraumatismo Ortopédico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Lateralidad Anatómica:</Label>
                <Select value={formLateralidad} onValueChange={setFormLateralidad}>
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Derecho">Derecho</SelectItem>
                    <SelectItem value="Izquierdo">Izquierdo</SelectItem>
                    <SelectItem value="Bilateral">Bilateral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formTipo === "fracturas_expuestas" ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Grado Gustilo-Anderson:</Label>
                <Select value={formGustilo} onValueChange={setFormGustilo}>
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="I">Grado I (&lt;1 cm, herida limpia)</SelectItem>
                    <SelectItem value="II">Grado II (1-10 cm, daño tisular moderado)</SelectItem>
                    <SelectItem value="IIIA">Grado IIIA (&gt;10 cm, periostio íntegro)</SelectItem>
                    <SelectItem value="IIIB">Grado IIIB (Pérdida perióstica, hueso expuesto)</SelectItem>
                    <SelectItem value="IIIC">Grado IIIC (Lesión vascular arterial concomitante)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : formTipo === "fractura_cadera_femur" ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Estadio de Garden:</Label>
                <Select value={formGarden} onValueChange={setFormGarden}>
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="I">Garden I (Impactada en valgo / Estable)</SelectItem>
                    <SelectItem value="II">Garden II (Completa no desplazada)</SelectItem>
                    <SelectItem value="III">Garden III (Parcialmente desplazada)</SelectItem>
                    <SelectItem value="IV">Garden IV (Totalmente desplazada)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Puntuación Total WOMAC (0-96):</Label>
                <Input
                  type="number"
                  min={0}
                  max={96}
                  value={formWomac}
                  onChange={(e) => setFormWomac(e.target.value)}
                  className="rounded-xl border-border/80"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Diagnóstico Clínico / CIE-10:</Label>
              <Textarea
                placeholder="Ej: Fractura diafisaria cerrada de tibia derecha (S82.2)"
                value={formDiag}
                onChange={(e) => setFormDiag(e.target.value)}
                rows={2}
                className="rounded-xl border-border/80 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Plan Quirúrgico & Conducta:</Label>
              <Textarea
                placeholder="Osteosíntesis, tracción, inmovilización, antibioticoterapia y reserva de quirófano..."
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
              <Button type="submit" className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-medium">
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
                <Bone className="h-5 w-5 text-orange-600" />
                Informe Traumatológico - {consultaDetalle.paciente_nombre}
              </DialogTitle>
              <DialogDescription>
                Fecha de evaluación: {consultaDetalle.fecha} • {consultaDetalle.edad_sexo} • Lado: {consultaDetalle.lateralidad}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              <div className="flex flex-wrap gap-2">
                {consultaDetalle.gustilo_grado && (
                  <Badge className="bg-rose-600 text-white">
                    Gustilo-Anderson {consultaDetalle.gustilo_grado}
                  </Badge>
                )}
                {consultaDetalle.garden_estadio && (
                  <Badge variant="secondary">
                    Garden {consultaDetalle.garden_estadio}
                  </Badge>
                )}
                {consultaDetalle.womac_total !== undefined && (
                  <Badge variant="outline" className="border-orange-500 text-orange-700 dark:text-orange-400">
                    WOMAC: {consultaDetalle.womac_total} / 96 pts
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
                <span className="font-bold text-foreground block">Plan de Manejo & Terapéutica Ortopédica:</span>
                <p className="p-3 bg-muted/20 border border-border/80 rounded-xl leading-relaxed whitespace-pre-wrap">
                  {consultaDetalle.plan_conducta}
                </p>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => window.print()} className="rounded-xl">
                Imprimir Informe
              </Button>
              <Button onClick={() => setConsultaDetalle(null)} className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white">
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
