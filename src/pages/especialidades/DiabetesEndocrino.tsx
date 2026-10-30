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
  Footprints,
  Flame,
  Droplet,
  PieChart
} from "lucide-react";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

export type TipoConsultaDiabetes =
  | "debut_dm"
  | "control_hba1c"
  | "ajuste_insulina"
  | "pie_diabetico"
  | "diabetes_gestacional";

interface ConsultaDiabetes {
  id: string;
  paciente_nombre: string;
  edad_sexo: string;
  tipo_consulta: TipoConsultaDiabetes;
  fecha: string;
  hba1c: number;
  glicemia_ayunas: number;
  glicemia_postprandial?: number;
  esquema_tratamiento: string;
  grado_iwgdf_pie: 0 | 1 | 2 | 3;
  findrisc_score?: number;
  complicaciones: string[];
  plan_conducta: string;
}

const TIPOS_CONSULTA_DM: { id: TipoConsultaDiabetes; nombre: string; desc: string }[] = [
  { id: "control_hba1c", nombre: "Control Metabólico & HbA1c", desc: "Monitoreo trimestral de hemoglobina glucosilada y ajuste de antidiabéticos orales" },
  { id: "ajuste_insulina", nombre: "Ajuste de Insulinoterapia", desc: "Titulación de dosis basal (Degludec/Glargina) y bolos prandiales (Aspart/Lispro)" },
  { id: "pie_diabetico", nombre: "Despistaje de Pie Diabético", desc: "Evaluación con Monofilamento 10g Semmes-Weinstein, pulsos y clasificación IWGDF" },
  { id: "debut_dm", nombre: "Debut Diabético Reciente", desc: "Educación diabetológica inicial, tamizaje de cetoacidosis y metas glucémicas ADA" },
  { id: "diabetes_gestacional", nombre: "Diabetes Gestacional", desc: "Control con curva de tolerancia a la glucosa oral 75g (SOG) y monitoreo fetal" },
];

const PACIENTES_DM_MOCK: ConsultaDiabetes[] = [
  {
    id: "DM-101",
    paciente_nombre: "Belkis Altagracia Taveras",
    edad_sexo: "58a / F",
    tipo_consulta: "control_hba1c",
    fecha: new Date(Date.now() - 3600000 * 4).toISOString(),
    hba1c: 7.4,
    glicemia_ayunas: 138,
    glicemia_postprandial: 175,
    esquema_tratamiento: "Metformina 850mg c/12h + Dapagliflozina 10mg/d",
    grado_iwgdf_pie: 1,
    findrisc_score: 16,
    complicaciones: ["Neuropatía periférica leve"],
    plan_conducta: "Meta HbA1c < 7.0%. Añadir Semaglutida oral o subcutánea semanal para protección renal y peso.",
  },
  {
    id: "DM-102",
    paciente_nombre: "Ramón Arturo Henríquez",
    edad_sexo: "64a / M",
    tipo_consulta: "ajuste_insulina",
    fecha: new Date(Date.now() - 3600000 * 26).toISOString(),
    hba1c: 9.8,
    glicemia_ayunas: 215,
    glicemia_postprandial: 280,
    esquema_tratamiento: "Insulina Glargina U100 28 UI noche + Metformina 1000mg",
    grado_iwgdf_pie: 2,
    findrisc_score: 21,
    complicaciones: ["Retinopatía no proliferativa", "Pérdida de sensibilidad vibratoria"],
    plan_conducta: "Titular Glargina a 34 UI/d e iniciar esquema bolo prandial con Insulina Aspart 4 UI antes del almuerzo.",
  },
  {
    id: "DM-103",
    paciente_nombre: "Altagracia Guzmán Paulino",
    edad_sexo: "42a / F",
    tipo_consulta: "pie_diabetico",
    fecha: new Date(Date.now() - 3600000 * 50).toISOString(),
    hba1c: 6.8,
    glicemia_ayunas: 112,
    glicemia_postprandial: 140,
    esquema_tratamiento: "Empagliflozina 25mg/d + Linagliptina 5mg/d",
    grado_iwgdf_pie: 0,
    findrisc_score: 12,
    complicaciones: [],
    plan_conducta: "Monofilamento 10/10 puntos sensitivos. Pulsos pedios palpables simétricos. Sin hiperqueratosis.",
  },
];

export default function DiabetesEndocrino() {
  const [consultas, setConsultas] = useState<ConsultaDiabetes[]>(PACIENTES_DM_MOCK);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [tabActual, setTabActual] = useState("consultas");

  // Modal nueva consulta
  const [modalOpen, setModalOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaEdadSexo, setNuevaEdadSexo] = useState("55a / M");
  const [tipoSel, setTipoSel] = useState<TipoConsultaDiabetes>("control_hba1c");
  const [hba1c, setHba1c] = useState("7.2");
  const [glicemiaAyunas, setGlicemiaAyunas] = useState("130");
  const [tratamiento, setTratamiento] = useState("");
  const [gradoPie, setGradoPie] = useState<ConsultaDiabetes["grado_iwgdf_pie"]>(0);
  const [conducta, setConducta] = useState("");

  // Calculadora FINDRISC interactiva
  const [fEdad, setFEdad] = useState(0); // 0: <45, 2: 45-54, 3: 55-64, 4: >64
  const [fImc, setFImc] = useState(0); // 0: <25, 1: 25-30, 3: >30
  const [fCintura, setFCintura] = useState(0); // 0: normal, 3: moderado, 4: aumentado
  const [fActividad, setFActividad] = useState(0); // 0: si, 2: no
  const [fVerduras, setFVerduras] = useState(0); // 0: diario, 1: no diario
  const [fHta, setFHta] = useState(0); // 0: no, 2: si
  const [fGlucosa, setFGlucosa] = useState(0); // 0: no, 5: si
  const [fFamilia, setFFamilia] = useState(0); // 0: no, 3: abuelos/tios, 5: padres/hermanos

  const scoreFindrisc = useMemo(() => {
    return fEdad + fImc + fCintura + fActividad + fVerduras + fHta + fGlucosa + fFamilia;
  }, [fEdad, fImc, fCintura, fActividad, fVerduras, fHta, fGlucosa, fFamilia]);

  const handleGuardarConsulta = () => {
    if (!nuevoNombre.trim()) {
      toast.error("Ingrese el nombre del paciente.");
      return;
    }

    const nueva: ConsultaDiabetes = {
      id: `DM-${Date.now().toString().slice(-3)}`,
      paciente_nombre: nuevoNombre,
      edad_sexo: nuevaEdadSexo,
      tipo_consulta: tipoSel,
      fecha: new Date().toISOString(),
      hba1c: parseFloat(hba1c) || 7.0,
      glicemia_ayunas: parseInt(glicemiaAyunas) || 120,
      esquema_tratamiento: tratamiento || "Metformina + Estilo de Vida",
      grado_iwgdf_pie: gradoPie,
      findrisc_score: scoreFindrisc,
      complicaciones: gradoPie > 0 ? ["Riesgo podológico IWGDF Grado " + gradoPie] : [],
      plan_conducta: conducta || "Continuar tratamiento y repetir analíticas en 3 meses.",
    };

    setConsultas([nueva, ...consultas]);
    toast.success(`Consulta de Diabetes registrada para ${nuevoNombre}`, {
      description: `HbA1c: ${nueva.hba1c}% | Pie Diabético IWGDF: Grado ${gradoPie}`,
    });

    setModalOpen(false);
    setNuevoNombre("");
  };

  const consultasFiltradas = consultas.filter((c) => {
    const matchBusqueda =
      c.paciente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.esquema_tratamiento.toLowerCase().includes(busqueda.toLowerCase());
    const matchTipo = filtroTipo === "todos" ? true : c.tipo_consulta === filtroTipo;
    return matchBusqueda && matchTipo;
  });

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="Endocrinología & Diabetes Mellitus"
        subtitle="Manejo metabólico integral, control glucémico HbA1c, test de FINDRISC y despistaje IWGDF de pie diabético"
        icon={Droplet}
        badge="ADA Standards of Care 2026"
        action={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva Consulta Diabetes
          </Button>
        }
      />

      {/* KPIs Especialidad Diabetes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ClinicalKpiCard
          title="Pacientes en Meta (HbA1c < 7%)"
          value={consultas.filter((c) => c.hba1c < 7.0).length}
          subtitle={`${Math.round((consultas.filter((c) => c.hba1c < 7.0).length / (consultas.length || 1)) * 100)}% de adherencia clínica`}
          icon={CheckCircle2}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="HbA1c Descompensada (≥ 8.5%)"
          value={consultas.filter((c) => c.hba1c >= 8.5).length}
          subtitle="Candidatos a optimización de insulina"
          icon={AlertTriangle}
          variant="rose"
          alert={consultas.filter((c) => c.hba1c >= 8.5).length > 0}
        />
        <ClinicalKpiCard
          title="Pie en Riesgo (IWGDF ≥ 2)"
          value={consultas.filter((c) => c.grado_iwgdf_pie >= 2).length}
          subtitle="Deformidad o neuropatía + EVP"
          icon={Footprints}
          variant="amber"
        />
        <ClinicalKpiCard
          title="Total Consultas Registradas"
          value={consultas.length}
          subtitle="Censo metabólico activo"
          icon={Activity}
          variant="teal"
        />
      </div>

      <Tabs value={tabActual} onValueChange={setTabActual} className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="consultas" className="text-xs sm:text-sm">
              <FileText className="h-4 w-4 mr-1.5" />
              Consultas ({consultasFiltradas.length})
            </TabsTrigger>
            <TabsTrigger value="findrisc" className="text-xs sm:text-sm">
              <Calculator className="h-4 w-4 mr-1.5" />
              Test FINDRISC
            </TabsTrigger>
            <TabsTrigger value="pie" className="text-xs sm:text-sm">
              <Footprints className="h-4 w-4 mr-1.5" />
              Guía Pie Diabético IWGDF
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente, fármaco..."
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
                {TIPOS_CONSULTA_DM.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tab 1: Censo de Consultas de Diabetes */}
        <TabsContent value="consultas" className="space-y-3">
          {consultasFiltradas.map((c) => {
            const info = TIPOS_CONSULTA_DM.find((t) => t.id === c.tipo_consulta);
            const enMeta = c.hba1c < 7.0;
            return (
              <Card key={c.id} className="border-border/80 hover:shadow-sm transition-all">
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base">{c.paciente_nombre}</span>
                        <span className="text-xs text-muted-foreground font-mono">({c.edad_sexo})</span>
                        <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-700 bg-amber-500/5">
                          {info?.nombre}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Fecha: {format(new Date(c.fecha), "dd/MM/yyyy hh:mm a")} · Ref: <span className="font-mono">{c.id}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          enMeta
                            ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 font-mono"
                            : c.hba1c >= 8.5
                            ? "bg-red-500/15 text-red-700 border-red-500/30 font-mono animate-pulse"
                            : "bg-amber-500/15 text-amber-700 border-amber-500/30 font-mono"
                        }
                      >
                        HbA1c: {c.hba1c}% ({enMeta ? "En Meta ADA" : "Fuera de Meta"})
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        IWGDF Grado {c.grado_iwgdf_pie}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-muted/40 p-2.5 rounded-xl text-xs font-mono">
                    <div>
                      <span className="text-muted-foreground">Glucosa Ayunas:</span>{" "}
                      <strong className="text-foreground">{c.glicemia_ayunas} mg/dL</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Postprandial:</span>{" "}
                      <strong className="text-foreground">{c.glicemia_postprandial ? `${c.glicemia_postprandial} mg/dL` : "No medida"}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pie Diabético:</span>{" "}
                      <strong className="text-foreground">Grado {c.grado_iwgdf_pie}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">FINDRISC:</span>{" "}
                      <strong className="text-foreground">{c.findrisc_score ? `${c.findrisc_score} pts` : "N/E"}</strong>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p>
                      <strong className="text-muted-foreground">Tratamiento actual:</strong>{" "}
                      <span className="text-foreground font-medium">{c.esquema_tratamiento}</span>
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

        {/* Tab 2: Test FINDRISC (Riesgo DM2 a 10 años) */}
        <TabsContent value="findrisc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-5 w-5 text-amber-500" />
                Cuestionario FINDRISC (Evaluación de Riesgo de Diabetes Mellitus Tipo 2)
              </CardTitle>
              <CardDescription>
                Herramienta recomendada por la OMS y la ADA para cribado poblacional y prevención temprana.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Pregunta 1: Edad */}
                <div className="p-3 rounded-xl border space-y-1.5">
                  <Label className="text-xs font-semibold">1. Edad del paciente</Label>
                  <Select value={fEdad.toString()} onValueChange={(val) => setFEdad(parseInt(val))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Menos de 45 años (0 pts)</SelectItem>
                      <SelectItem value="2">45 a 54 años (2 pts)</SelectItem>
                      <SelectItem value="3">55 a 64 años (3 pts)</SelectItem>
                      <SelectItem value="4">Más de 64 años (4 pts)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pregunta 2: IMC */}
                <div className="p-3 rounded-xl border space-y-1.5">
                  <Label className="text-xs font-semibold">2. Índice de Masa Corporal (IMC)</Label>
                  <Select value={fImc.toString()} onValueChange={(val) => setFImc(parseInt(val))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Menor de 25 kg/m² (0 pts)</SelectItem>
                      <SelectItem value="1">25 a 30 kg/m² (Sobrepeso) (1 pto)</SelectItem>
                      <SelectItem value="3">Mayor de 30 kg/m² (Obesidad) (3 pts)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pregunta 3: Perímetro de cintura */}
                <div className="p-3 rounded-xl border space-y-1.5">
                  <Label className="text-xs font-semibold">3. Perímetro de cintura (Hombres / Mujeres)</Label>
                  <Select value={fCintura.toString()} onValueChange={(val) => setFCintura(parseInt(val))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">&lt;94 cm (H) / &lt;80 cm (M) (0 pts)</SelectItem>
                      <SelectItem value="3">94-102 cm (H) / 80-88 cm (M) (3 pts)</SelectItem>
                      <SelectItem value="4">&gt;102 cm (H) / &gt;88 cm (M) (4 pts)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pregunta 4: Actividad física */}
                <div className="p-3 rounded-xl border space-y-1.5">
                  <Label className="text-xs font-semibold">4. ¿Realiza al menos 30 min de actividad física diaria?</Label>
                  <Select value={fActividad.toString()} onValueChange={(val) => setFActividad(parseInt(val))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sí (0 pts)</SelectItem>
                      <SelectItem value="2">No (2 pts)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pregunta 5: Medicación HTA */}
                <div className="p-3 rounded-xl border space-y-1.5">
                  <Label className="text-xs font-semibold">5. ¿Toma medicamentos para la hipertensión arterial?</Label>
                  <Select value={fHta.toString()} onValueChange={(val) => setFHta(parseInt(val))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No (0 pts)</SelectItem>
                      <SelectItem value="2">Sí (2 pts)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pregunta 6: Glucosa alta previa */}
                <div className="p-3 rounded-xl border space-y-1.5">
                  <Label className="text-xs font-semibold">6. ¿Ha tenido alguna vez glucosa alta en sangre?</Label>
                  <Select value={fGlucosa.toString()} onValueChange={(val) => setFGlucosa(parseInt(val))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No (0 pts)</SelectItem>
                      <SelectItem value="5">Sí (en chequeo previo, embarazo o estrés) (5 pts)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dictamen del Score FINDRISC */}
              <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Puntaje Total FINDRISC: <span className="font-mono text-xl text-amber-600">{scoreFindrisc} / 26 pts</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {scoreFindrisc < 7
                      ? "Nivel de riesgo: BAJO (1% desarrollará DM2 en 10 años). Mantener estilo de vida saludable."
                      : scoreFindrisc <= 11
                      ? "Nivel de riesgo: LIGERAMENTE ELEVADO (4% en 10 años). Recomendar dieta mediterránea y ejercicio."
                      : scoreFindrisc <= 14
                      ? "Nivel de riesgo: MODERADO (17% en 10 años). Indicar curva de tolerancia a la glucosa y HbA1c."
                      : scoreFindrisc <= 20
                      ? "Nivel de riesgo: ALTO (33% en 10 años). Intervención nutricional intensiva y metformina profiláctica."
                      : "Nivel de riesgo: MUY ALTO (50% en 10 años). Alta sospecha de DM2 no diagnosticada actualmente."}
                  </p>
                </div>
                <Badge className={scoreFindrisc >= 15 ? "bg-red-600 text-white" : "bg-amber-600 text-white"}>
                  {scoreFindrisc >= 15 ? "Alto Riesgo DM2" : "Riesgo Controlado"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Guía IWGDF Pie Diabético */}
        <TabsContent value="pie" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Footprints className="h-5 w-5 text-amber-600" />
                Estratificación de Riesgo de Pie Diabético (IWGDF)
              </CardTitle>
              <CardDescription>
                Clasificación internacional para definir periodicidad de revisión y prevención de úlceras y amputaciones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-border/80 space-y-1">
                  <Badge className="bg-emerald-500/10 text-emerald-700">Grado 0 - Muy Bajo</Badge>
                  <p className="font-semibold text-foreground">Sin neuropatía sensitiva ni EVP</p>
                  <p className="text-muted-foreground">Monofilamento 10g normal y pulsos conservados. Revisión recomendada: Anual.</p>
                </div>
                <div className="p-3 rounded-xl border border-border/80 space-y-1">
                  <Badge className="bg-blue-500/10 text-blue-700">Grado 1 - Bajo</Badge>
                  <p className="font-semibold text-foreground">Neuropatía sensitiva aislada</p>
                  <p className="text-muted-foreground">Pérdida de sensibilidad protectora sin deformidad ni EVP. Revisión recomendada: Cada 6 meses.</p>
                </div>
                <div className="p-3 rounded-xl border border-border/80 space-y-1">
                  <Badge className="bg-amber-500/10 text-amber-700">Grado 2 - Moderado</Badge>
                  <p className="font-semibold text-foreground">Neuropatía + Deformidad o EVP</p>
                  <p className="text-muted-foreground">Presencia de juanetes, dedos en garra o pulsos ausentes. Calzado terapéutico. Revisión: Cada 3 meses.</p>
                </div>
                <div className="p-3 rounded-xl border border-border/80 space-y-1">
                  <Badge className="bg-red-500/10 text-red-700">Grado 3 - Alto</Badge>
                  <p className="font-semibold text-foreground">Úlcera previa o amputación</p>
                  <p className="text-muted-foreground">Riesgo extremo de recidiva o infección ósea (osteomielitis). Revisión multidisciplinaria: Cada 1 a 2 meses.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Nueva Consulta de Diabetes */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Droplet className="h-5 w-5 text-amber-500" />
              Nueva Consulta de Endocrinología & Diabetes
            </DialogTitle>
            <DialogDescription>
              Registro clínico estructurado de control glucémico y prevención podológica.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nombre Completo del Paciente *</Label>
                <Input
                  placeholder="Ej: Teófilo Almonte"
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
              <Label className="text-xs">Tipo de Consulta</Label>
              <Select value={tipoSel} onValueChange={(val: any) => setTipoSel(val)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_CONSULTA_DM.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 rounded-xl border bg-muted/20 space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-amber-500" /> Parámetros Metabólicos
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <Label className="text-[11px] text-muted-foreground">HbA1c (%) *</Label>
                  <Input type="number" step="0.1" value={hba1c} onChange={(e) => setHba1c(e.target.value)} className="h-8" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Glucosa Ayunas (mg/dL)</Label>
                  <Input type="number" value={glicemiaAyunas} onChange={(e) => setGlicemiaAyunas(e.target.value)} className="h-8" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Pie Diabético (IWGDF)</Label>
                  <Select value={gradoPie.toString()} onValueChange={(val) => setGradoPie(parseInt(val) as any)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Grado 0: Normal / Sin Neuropatía</SelectItem>
                      <SelectItem value="1">Grado 1: Neuropatía aislada</SelectItem>
                      <SelectItem value="2">Grado 2: Neuropatía + Deformidad/EVP</SelectItem>
                      <SelectItem value="3">Grado 3: Úlcera previa / Amputación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Esquema Farmacológico Actual</Label>
              <Input
                placeholder="Ej: Metformina 850mg c/12h + Empagliflozina 25mg/d..."
                value={tratamiento}
                onChange={(e) => setTratamiento(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Plan de Conducta & Metas</Label>
              <Textarea
                placeholder="Meta de HbA1c, fondo de ojo anual, microalbuminuria en orina, calzado..."
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
