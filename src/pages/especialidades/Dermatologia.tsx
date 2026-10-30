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
  Sparkles,
  Stethoscope,
  Eye,
  Sun,
  Flame,
} from "lucide-react";
import { toast } from "sonner";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

export type TipoConsultaDerma =
  | "melanoma_abcde"
  | "dermatitis_scorad"
  | "psoriasis_pasi"
  | "fototipo_fitzpatrick"
  | "acne_severidad";

interface ConsultaDermatologica {
  id: string;
  paciente_nombre: string;
  edad_sexo: string;
  tipo_consulta: TipoConsultaDerma;
  fecha: string;
  fototipo?: "I" | "II" | "III" | "IV" | "V" | "VI";
  abcde_sospecha?: boolean;
  scorad_score?: number;
  localizacion_lesion?: string;
  diagnostico: string;
  plan_conducta: string;
}

const MOCK_CONSULTAS_DERMA: ConsultaDermatologica[] = [
  {
    id: "der-01",
    paciente_nombre: "Doña Gladys Mercedes Valdez",
    edad_sexo: "49a / F",
    tipo_consulta: "melanoma_abcde",
    fecha: "2026-10-29",
    fototipo: "II",
    abcde_sospecha: true,
    localizacion_lesion: "Región interescapular izquierda",
    diagnostico: "Lesión melanocítica atípica pigmentada asimétrica con policromía (Regla ABCDE POSITIVA). Sospecha de Melanoma de Extensión Superficial",
    plan_conducta: "Dermatoscopía de epiluminiscencia (red pigmentaria atípica y velo azul-blanquecino). Biopsia excisional con margen de 2 mm para estudio histopatológico urgente (Profundidad Breslow / Nivel Clark).",
  },
  {
    id: "der-02",
    paciente_nombre: "Joaquín Emilio Tavárez",
    edad_sexo: "7a / M",
    tipo_consulta: "dermatitis_scorad",
    fecha: "2026-10-28",
    fototipo: "III",
    scorad_score: 46,
    localizacion_lesion: "Pliegues antecubitales, poplíteos y cuello",
    diagnostico: "Dermatitis atópica severa en brote agudo (SCORAD: 46/103 pts) con eccema liquenificado y sobreinfección superficial",
    plan_conducta: "Mupirocina tópica 2% c/12h por 7 días. Furoato de Mometasona crema 0.1% c/24h x 5 días con descenso. Emolientes con ceramidas y antihistamínico sedante nocturno para prurito.",
  },
  {
    id: "der-03",
    paciente_nombre: "Carlos Manuel Báez",
    edad_sexo: "38a / M",
    tipo_consulta: "psoriasis_pasi",
    fecha: "2026-10-27",
    fototipo: "IV",
    localizacion_lesion: "Codos, rodillas y región lumbosacra",
    diagnostico: "Psoriasis vulgar en placas moderada-severa (Placas eritemato-descamativas con signo de Auspitz positivo)",
    plan_conducta: "Combinación fija Calcipotriol / Betametasona gel tópico diario. Analítica previa a terapia sistémica (Hemograma, enzimas hepáticas, serología VHB/VHC y Quantiferon-TB) para eventual biológico anti-IL-17.",
  },
  {
    id: "der-04",
    paciente_nombre: "Ana Rocío Ventura",
    edad_sexo: "19a / F",
    tipo_consulta: "acne_severidad",
    fecha: "2026-10-26",
    fototipo: "III",
    localizacion_lesion: "Mejillas, frente y mentón",
    diagnostico: "Acné nódulo-quístico moderado con cicatrices atróficas en picahielo incipientes",
    plan_conducta: "Doxiciclina 100mg diaria oral por 6 semanas + Adapaleno 0.1% / Peróxido de Benzoilo 2.5% gel nocturno. Fotoprotección mineral SPF 50+. Si resistencia, considerar Isotretinoína oral.",
  },
];

export default function Dermatologia() {
  const [consultas, setConsultas] = useState<ConsultaDermatologica[]>(MOCK_CONSULTAS_DERMA);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [modalNueva, setModalNueva] = useState(false);
  const [consultaDetalle, setConsultaDetalle] = useState<ConsultaDermatologica | null>(null);

  // Form State
  const [formNombre, setFormNombre] = useState("");
  const [formEdadSexo, setFormEdadSexo] = useState("35a / F");
  const [formTipo, setFormTipo] = useState<TipoConsultaDerma>("melanoma_abcde");
  const [formFototipo, setFormFototipo] = useState<string>("III");
  const [formAbcde, setFormAbcde] = useState<boolean>(true);
  const [formScorad, setFormScorad] = useState("32");
  const [formLocalizacion, setFormLocalizacion] = useState("");
  const [formDiag, setFormDiag] = useState("");
  const [formPlan, setFormPlan] = useState("");

  // Calculadora Regla ABCDE Melanoma
  const [abcdeA, setAbcdeA] = useState(true); // Asimetría
  const [abcdeB, setAbcdeB] = useState(true); // Bordes irregulares
  const [abcdeC, setAbcdeC] = useState(true); // Color no homogéneo
  const [abcdeD, setAbcdeD] = useState(false); // Diámetro > 6mm
  const [abcdeE, setAbcdeE] = useState(true); // Evolución o cambio reciente

  const abcdeTotalPuntos = useMemo(() => {
    let pts = 0;
    if (abcdeA) pts++;
    if (abcdeB) pts++;
    if (abcdeC) pts++;
    if (abcdeD) pts++;
    if (abcdeE) pts++;
    return pts;
  }, [abcdeA, abcdeB, abcdeC, abcdeD, abcdeE]);

  const abcdeDictamen = useMemo(() => {
    if (abcdeTotalPuntos >= 3 || abcdeE) {
      return {
        riesgo: "Alto Riesgo de Malignidad (Sospecha Melanoma)",
        conducta: "Dermatoscopía de urgencia y Biopsia Excisional diagnóstica completa con margen libre.",
        badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
      };
    }
    if (abcdeTotalPuntos >= 1) {
      return {
        riesgo: "Riesgo Intermedio / Lesión Atípica",
        conducta: "Dermatoscopía digital y seguimiento fotográfico comparativo a 3 meses.",
        badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
      };
    }
    return {
      riesgo: "Bajo Riesgo / Nevus Típico",
      conducta: "Aspecto benigno regular. Autoexploración mensual y protección solar estricta.",
      badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    };
  }, [abcdeTotalPuntos, abcdeE]);

  // Calculadora Fitzpatrick
  const [selFitzpatrick, setSelFitzpatrick] = useState<"I" | "II" | "III" | "IV" | "V" | "VI">("III");

  const infoFitzpatrick = useMemo(() => {
    switch (selFitzpatrick) {
      case "I":
        return {
          tono: "Muy claro / Piel albina / Pelirrojos",
          reaccion: "Siempre se quema con facilidad, nunca se broncea.",
          fps: "FPS 50+ de amplio espectro diario, reaplicación cada 2 horas.",
          riesgoCancer: "Riesgo extremadamente alto de carcinoma y melanoma.",
        };
      case "II":
        return {
          tono: "Clara / Ojos claros / Pelo rubio o castaño claro",
          reaccion: "Se quema fácilmente, se broncea mínimamente y con dificultad.",
          fps: "FPS 50+ mineral o químico fotoestable.",
          riesgoCancer: "Riesgo muy alto de daño actínico y fotoenvejecimiento.",
        };
      case "III":
        return {
          tono: "Blanca caucásica / Castaño medio (Típico caribeño claro)",
          reaccion: "Quemadura moderada inicial, se broncea gradualmente a tono canela.",
          fps: "FPS 30 a 50 de uso diario en exteriores.",
          riesgoCancer: "Riesgo moderado de queratosis actínica y fotoenvejecimiento.",
        };
      case "IV":
        return {
          tono: "Morena clara / Mediterránea / Mestiza",
          reaccion: "Rara vez se quema, se broncea con mucha rapidez y facilidad.",
          fps: "FPS 30+ con protección anti-manchas / hiperpigmentación.",
          riesgoCancer: "Mayor riesgo de melasma e hiperpigmentación postinflamatoria.",
        };
      case "V":
        return {
          tono: "Morena oscura / Piel mulata o afrodescendiente intermedia",
          reaccion: "Casi nunca se quema, bronceado intenso y profundo inmediato.",
          fps: "FPS 30+ para prevenir manchas y daño elastósico.",
          riesgoCancer: "Riesgo de melanoma lentiginoso acral (palmas, plantas y uñas).",
        };
      case "VI":
        return {
          tono: "Negra / Muy oscura",
          reaccion: "Nunca se quema ante la radiación solar directa habitual.",
          fps: "FPS 30+ para prevención de discromías y xerosis.",
          riesgoCancer: "Vigilancia obligatoria de lechos ungueales y plantas de pies.",
        };
    }
  }, [selFitzpatrick]);

  // Filtrado
  const consultasFiltradas = useMemo(() => {
    return consultas.filter((c) => {
      const matchBusqueda =
        c.paciente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.diagnostico.toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.localizacion_lesion && c.localizacion_lesion.toLowerCase().includes(busqueda.toLowerCase()));
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

    const nueva: ConsultaDermatologica = {
      id: `der-${Date.now().toString().slice(-4)}`,
      paciente_nombre: formNombre,
      edad_sexo: formEdadSexo,
      tipo_consulta: formTipo,
      fecha: new Date().toISOString().split("T")[0],
      fototipo: formFototipo as any,
      abcde_sospecha: formTipo === "melanoma_abcde" ? formAbcde : undefined,
      scorad_score: formTipo === "dermatitis_scorad" ? parseInt(formScorad) || undefined : undefined,
      localizacion_lesion: formLocalizacion.trim() || undefined,
      diagnostico: formDiag,
      plan_conducta: formPlan,
    };

    setConsultas([nueva, ...consultas]);
    setModalNueva(false);
    toast.success("Consulta dermatológica guardada con éxito.");

    setFormNombre("");
    setFormLocalizacion("");
    setFormDiag("");
    setFormPlan("");
  };

  return (
    <div className="space-y-6 pb-12">
      <ClinicalPageHeader
        title="Dermatología & Cirugía Dermatológica"
        description="Tamizaje de melanoma regla ABCDE, fototipos de Fitzpatrick, escala SCORAD de dermatitis atópica y protocolos de lesiones cutáneas."
        badgeText="Servicio Clínico Dermatológico"
        actions={
          <Button
            onClick={() => setModalNueva(true)}
            className="rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-medium shadow-sm flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Consulta Dermatológica
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Casos Dermatología"
          value={consultas.length.toString()}
          subtitle="Pacientes evaluados en consulta"
          icon={<Eye className="h-5 w-5 text-pink-600" />}
        />
        <ClinicalKpiCard
          title="Sospecha de Melanoma"
          value={consultas.filter((c) => c.abcde_sospecha).length.toString()}
          subtitle="Regla ABCDE / Biopsia prioritaria"
          icon={<ShieldAlert className="h-5 w-5 text-rose-600" />}
        />
        <ClinicalKpiCard
          title="Dermatitis / Eccema"
          value={consultas.filter((c) => c.tipo_consulta === "dermatitis_scorad").length.toString()}
          subtitle="Seguimiento índice SCORAD"
          icon={<Activity className="h-5 w-5 text-amber-600" />}
        />
        <ClinicalKpiCard
          title="Fototipos I y II"
          value={consultas.filter((c) => c.fototipo === "I" || c.fototipo === "II").length.toString()}
          subtitle="Alto riesgo de daño actínico"
          icon={<Sun className="h-5 w-5 text-orange-600" />}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="consultas" className="w-full">
        <TabsList className="bg-muted/70 p-1 rounded-xl">
          <TabsTrigger value="consultas" className="rounded-lg text-xs font-semibold gap-2">
            <FileText className="h-4 w-4" />
            Consultas & Pacientes
          </TabsTrigger>
          <TabsTrigger value="abcde" className="rounded-lg text-xs font-semibold gap-2">
            <Eye className="h-4 w-4" />
            Regla ABCDE Melanoma
          </TabsTrigger>
          <TabsTrigger value="fitzpatrick" className="rounded-lg text-xs font-semibold gap-2">
            <Sun className="h-4 w-4" />
            Fototipos Fitzpatrick (I-VI)
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CONSULTAS */}
        <TabsContent value="consultas" className="space-y-4 pt-2">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente, diagnóstico o localización..."
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
                <SelectItem value="melanoma_abcde">Nevus / Melanoma (ABCDE)</SelectItem>
                <SelectItem value="dermatitis_scorad">Dermatitis Atópica (SCORAD)</SelectItem>
                <SelectItem value="psoriasis_pasi">Psoriasis en Placas (PASI)</SelectItem>
                <SelectItem value="fototipo_fitzpatrick">Evaluación Fototipo Solar</SelectItem>
                <SelectItem value="acne_severidad">Acné Vulgar / Rosácea</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grid de Consultas */}
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
                          <User className="h-4 w-4 text-pink-600" />
                          {c.paciente_nombre}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {c.edad_sexo} • Atendido el {c.fecha}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          c.abcde_sospecha
                            ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
                            : c.tipo_consulta === "dermatitis_scorad"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                            : "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/30"
                        }
                      >
                        {c.tipo_consulta.replace(/_/g, " ").toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {c.fototipo && (
                        <Badge variant="secondary" className="font-bold">
                          Fototipo {c.fototipo}
                        </Badge>
                      )}
                      {c.abcde_sospecha && (
                        <Badge className="bg-rose-600 text-white font-bold animate-pulse">
                          ABCDE Positivo
                        </Badge>
                      )}
                      {c.scorad_score !== undefined && (
                        <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">
                          SCORAD: {c.scorad_score} pts
                        </Badge>
                      )}
                    </div>

                    {c.localizacion_lesion && (
                      <div className="text-xs text-muted-foreground">
                        <strong className="text-foreground">Localización:</strong> {c.localizacion_lesion}
                      </div>
                    )}

                    <div className="space-y-1 text-xs">
                      <p className="line-clamp-2 text-muted-foreground">
                        <strong className="text-foreground">Diagnóstico:</strong> {c.diagnostico}
                      </p>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-xs text-muted-foreground border-t border-border/60">
                      <span>Click para ver prescripción y plan</span>
                      <CheckCircle2 className="h-4 w-4 text-pink-600" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* TAB 2: REGLA ABCDE MELANOMA */}
        <TabsContent value="abcde" className="space-y-4 pt-2">
          <Card className="rounded-2xl border-border/80 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5 text-pink-600" />
                Regla ABCDE para Detección Precoz de Melanoma Cutáneo
              </CardTitle>
              <CardDescription>
                Criterios clínicos y dermatoscópicos para evaluar riesgo de malignidad en lesiones melanocíticas pigmentadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 hover:bg-muted/30">
                    <div>
                      <span className="font-semibold text-xs block text-foreground">A - Asimetría:</span>
                      <span className="text-[11px] text-muted-foreground">Una mitad de la lesión no coincide con la otra al trazar un eje medio</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={abcdeA}
                      onChange={(e) => setAbcdeA(e.target.checked)}
                      className="rounded h-4 w-4 text-pink-600 focus:ring-pink-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 hover:bg-muted/30">
                    <div>
                      <span className="font-semibold text-xs block text-foreground">B - Bordes Irregulares:</span>
                      <span className="text-[11px] text-muted-foreground">Bordes festoneados, borrosos, escotados o mal delimitados</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={abcdeB}
                      onChange={(e) => setAbcdeB(e.target.checked)}
                      className="rounded h-4 w-4 text-pink-600 focus:ring-pink-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 hover:bg-muted/30">
                    <div>
                      <span className="font-semibold text-xs block text-foreground">C - Color Policromático:</span>
                      <span className="text-[11px] text-muted-foreground">Múltiples tonalidades (marrón, negro, rojo, blanco o azul)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={abcdeC}
                      onChange={(e) => setAbcdeC(e.target.checked)}
                      className="rounded h-4 w-4 text-pink-600 focus:ring-pink-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 hover:bg-muted/30">
                    <div>
                      <span className="font-semibold text-xs block text-foreground">D - Diámetro Mayor a 6 mm:</span>
                      <span className="text-[11px] text-muted-foreground">Tamaño superior al borrador de un lápiz convencional (&gt; 6 mm)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={abcdeD}
                      onChange={(e) => setAbcdeD(e.target.checked)}
                      className="rounded h-4 w-4 text-pink-600 focus:ring-pink-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 hover:bg-muted/30">
                    <div>
                      <span className="font-semibold text-xs block text-foreground">E - Evolución o Cambio Reciente:</span>
                      <span className="text-[11px] text-muted-foreground">Modificación en tamaño, forma, color, sangrado o picor en semanas</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={abcdeE}
                      onChange={(e) => setAbcdeE(e.target.checked)}
                      className="rounded h-4 w-4 text-pink-600 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-pink-500/5 border border-pink-500/20 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Criterios Positivos:</span>
                      <span className="text-3xl font-extrabold text-foreground">{abcdeTotalPuntos} / 5</span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">Estratificación Oncológica:</span>
                      <Badge className={`w-full justify-center py-1.5 text-xs font-bold ${abcdeDictamen.badge}`}>
                        {abcdeDictamen.riesgo}
                      </Badge>
                    </div>

                    <div className="p-3.5 bg-background rounded-xl border border-border/80 text-xs space-y-1">
                      <strong className="text-foreground block">Conducta Dermatológica Recomendada:</strong>
                      <p className="text-muted-foreground leading-relaxed">{abcdeDictamen.conducta}</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full rounded-xl text-xs"
                    onClick={() => {
                      setFormAbcde(abcdeTotalPuntos >= 3 || abcdeE);
                      toast.info(`Criterio ABCDE (${abcdeTotalPuntos} pts) transferido a nueva consulta.`);
                    }}
                  >
                    Usar sospecha en formulario
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: FITZPATRICK */}
        <TabsContent value="fitzpatrick" className="space-y-4 pt-2">
          <Card className="rounded-2xl border-border/80 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sun className="h-5 w-5 text-pink-600" />
                Escala de Fototipos Cutáneos de Fitzpatrick (I a VI)
              </CardTitle>
              <CardDescription>
                Clasificación de la respuesta biológica de la piel a la radiación ultravioleta para prescripción de fotoprotección y riesgo carcinogénico.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {(["I", "II", "III", "IV", "V", "VI"] as const).map((f) => (
                  <Button
                    key={f}
                    variant={selFitzpatrick === f ? "default" : "outline"}
                    className={`rounded-xl text-xs font-bold py-5 ${
                      selFitzpatrick === f ? "bg-pink-600 hover:bg-pink-700 text-white" : ""
                    }`}
                    onClick={() => setSelFitzpatrick(f)}
                  >
                    Fototipo {f}
                  </Button>
                ))}
              </div>

              <div className="p-6 rounded-2xl border border-border/80 bg-muted/20 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-foreground">Fototipo {selFitzpatrick}</span>
                  <Badge variant="secondary" className="font-semibold text-xs">{infoFitzpatrick.tono}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-background rounded-xl border border-border/80">
                    <strong className="text-foreground block">Respuesta Solar:</strong>
                    <p className="text-muted-foreground mt-0.5">{infoFitzpatrick.reaccion}</p>
                  </div>
                  <div className="p-3 bg-background rounded-xl border border-border/80">
                    <strong className="text-foreground block">Fotoprotección Recomendada:</strong>
                    <p className="text-muted-foreground mt-0.5">{infoFitzpatrick.fps}</p>
                  </div>
                  <div className="p-3 bg-background rounded-xl border border-border/80">
                    <strong className="text-foreground block">Riesgo Oncológico y Lesional:</strong>
                    <p className="text-muted-foreground mt-0.5">{infoFitzpatrick.riesgoCancer}</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => {
                    setFormFototipo(selFitzpatrick);
                    toast.info(`Fototipo ${selFitzpatrick} seleccionado para nueva consulta.`);
                  }}
                >
                  Asignar a Formulario
                </Button>
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
              <Eye className="h-5 w-5 text-pink-600" />
              Nueva Consulta Dermatológica
            </DialogTitle>
            <DialogDescription>
              Complete los datos clínicos, localización anatómica de la lesión y plan de tratamiento.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCrearConsulta} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nombre del Paciente:</Label>
                <Input
                  placeholder="Ej: Rosa Morales"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="rounded-xl border-border/80"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Edad / Sexo:</Label>
                <Input
                  placeholder="Ej: 42a / F"
                  value={formEdadSexo}
                  onChange={(e) => setFormEdadSexo(e.target.value)}
                  className="rounded-xl border-border/80"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tipo de Patología:</Label>
                <Select value={formTipo} onValueChange={(v) => setFormTipo(v as TipoConsultaDerma)}>
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="melanoma_abcde">Nevus / Melanoma (ABCDE)</SelectItem>
                    <SelectItem value="dermatitis_scorad">Dermatitis Atópica (SCORAD)</SelectItem>
                    <SelectItem value="psoriasis_pasi">Psoriasis en Placas (PASI)</SelectItem>
                    <SelectItem value="fototipo_fitzpatrick">Evaluación Fototipo Solar</SelectItem>
                    <SelectItem value="acne_severidad">Acné Vulgar / Rosácea</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Fototipo de Fitzpatrick:</Label>
                <Select value={formFototipo} onValueChange={setFormFototipo}>
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="I">Fototipo I (Muy claro / Albino)</SelectItem>
                    <SelectItem value="II">Fototipo II (Clara / Rubio)</SelectItem>
                    <SelectItem value="III">Fototipo III (Blanca caucásica / Caribeño)</SelectItem>
                    <SelectItem value="IV">Fototipo IV (Morena clara / Mediterránea)</SelectItem>
                    <SelectItem value="V">Fototipo V (Morena oscura / Mulata)</SelectItem>
                    <SelectItem value="VI">Fototipo VI (Negra)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Localización Anatómica de la Lesión:</Label>
              <Input
                placeholder="Ej: Dorso nasal, tercio superior espalda, pliegues flexurales..."
                value={formLocalizacion}
                onChange={(e) => setFormLocalizacion(e.target.value)}
                className="rounded-xl border-border/80"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Diagnóstico Clínico / CIE-10:</Label>
              <Textarea
                placeholder="Ej: Nevus melanocítico atípico en tronco superior con criterios de sospecha (D22.5)"
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
                placeholder="Dermatoscopía, biopsia por afeitado/punch/escisión, corticoides tópicos, fotoprotección..."
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
              <Button type="submit" className="rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-medium">
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
                <Eye className="h-5 w-5 text-pink-600" />
                Informe Dermatológico - {consultaDetalle.paciente_nombre}
              </DialogTitle>
              <DialogDescription>
                Fecha de evaluación: {consultaDetalle.fecha} • {consultaDetalle.edad_sexo}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              <div className="flex flex-wrap gap-2">
                {consultaDetalle.fototipo && (
                  <Badge variant="secondary">
                    Fototipo {consultaDetalle.fototipo}
                  </Badge>
                )}
                {consultaDetalle.abcde_sospecha && (
                  <Badge className="bg-rose-600 text-white">
                    Sospecha ABCDE Positiva
                  </Badge>
                )}
                {consultaDetalle.scorad_score !== undefined && (
                  <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">
                    SCORAD: {consultaDetalle.scorad_score} pts
                  </Badge>
                )}
              </div>

              {consultaDetalle.localizacion_lesion && (
                <div className="p-3 bg-muted/40 border border-border/80 rounded-xl space-y-1">
                  <strong className="text-foreground block">Localización Anatómica:</strong>
                  <p className="text-muted-foreground">{consultaDetalle.localizacion_lesion}</p>
                </div>
              )}

              <div className="space-y-1">
                <span className="font-bold text-foreground block">Diagnóstico:</span>
                <p className="p-3 bg-muted/20 border border-border/80 rounded-xl leading-relaxed">
                  {consultaDetalle.diagnostico}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-foreground block">Plan de Manejo & Terapéutica Dermatológica:</span>
                <p className="p-3 bg-muted/20 border border-border/80 rounded-xl leading-relaxed whitespace-pre-wrap">
                  {consultaDetalle.plan_conducta}
                </p>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => window.print()} className="rounded-xl">
                Imprimir Informe
              </Button>
              <Button onClick={() => setConsultaDetalle(null)} className="rounded-xl bg-pink-600 hover:bg-pink-700 text-white">
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
