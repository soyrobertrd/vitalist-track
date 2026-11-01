import { useState, useMemo } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Baby,
  Heart,
  Plus,
  AlertTriangle,
  Calendar,
  Share2,
  Table as TableIcon,
  Calculator,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { useModoOperativo } from "@/hooks/useModoOperativo";
import {
  FichaConsultaObstetricaDetalle,
  ConsultaGinecoData,
} from "@/components/especialidades/ginecologia/FichaConsultaObstetricaDetalle";
import { CensoObstetricoList } from "@/components/especialidades/ginecologia/CensoObstetricoList";
import { CalculadoraObstetricaNaegele } from "@/components/especialidades/ginecologia/CalculadoraObstetricaNaegele";

export type TipoConsultaGineco =
  | "prenatal"
  | "ginecologia_anual"
  | "amenaza_preeclampsia"
  | "menopausia_climaterio"
  | "ecografia_fetal";

const TIPOS_CONSULTA: { id: TipoConsultaGineco; nombre: string }[] = [
  { id: "prenatal", nombre: "Control Prenatal Periódico" },
  { id: "ginecologia_anual", nombre: "Ginecología General / Papanicolaou" },
  { id: "amenaza_preeclampsia", nombre: "Alto Riesgo / Monitoreo Preeclampsia" },
  { id: "menopausia_climaterio", nombre: "Climaterio / Terapia Hormonal" },
  { id: "ecografia_fetal", nombre: "Ecografía Obstétrica / Morfológica" },
];

const MOCK_CONSULTAS_GINECO: ConsultaGinecoData[] = [
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
    plan_conducta: "Perfil toxémico de urgencia (plaquetas, TGO, LDH, proteinuria 24h), reposo absoluto y maduración cervical.",
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
    plan_conducta: "Autoexamen mamario mensual, control de rutina en 12 meses y ecografía mamaria de cribado.",
  },
];

export default function GinecologiaObstetricia() {
  const { isCentro: esModoClinica } = useModoOperativo();
  const [consultas, setConsultas] = useState<ConsultaGinecoData[]>(MOCK_CONSULTAS_GINECO);
  const [consultaSeleccionadaId, setConsultaSeleccionadaId] = useState<string>(
    MOCK_CONSULTAS_GINECO[0]?.id || ""
  );
  const [tabActiva, setTabActiva] = useState<"censo_ficha" | "calculadoras" | "tabla_historica">("censo_ficha");
  const [modalOpen, setModalOpen] = useState(false);

  // Consulta actualmente activa para el visor detallado
  const consultaActiva = useMemo(() => {
    return consultas.find((c) => c.id === consultaSeleccionadaId) || consultas[0] || null;
  }, [consultas, consultaSeleccionadaId]);

  // Status Strip Métricas
  const resumenMetricas = useMemo(() => {
    const total = consultas.length;
    const prenatales = consultas.filter((c) => c.tipo_consulta === "prenatal" || c.edad_gestacional_semanas !== undefined).length;
    const alertasHipertension = consultas.filter((c) => {
      const [sis, dia] = (c.ta || "120/80").split("/").map((v) => parseInt(v.trim()) || 0);
      return sis >= 140 || dia >= 90 || c.tipo_consulta === "amenaza_preeclampsia";
    }).length;
    return { total, prenatales, alertasHipertension };
  }, [consultas]);

  // Formulario de Nueva Consulta
  const [form, setForm] = useState({
    paciente_nombre: "",
    tipo_consulta: "prenatal" as TipoConsultaGineco,
    ta: "120/80",
    peso_kg: 65,
    altura_uterina_cm: 30,
    fcf_lpm: 140,
    fum: "2026-04-01",
    edad_gestacional_semanas: 28,
    diagnostico: "",
    plan_conducta: "",
  });

  const handleCrearConsulta = () => {
    if (!form.paciente_nombre.trim() || !form.diagnostico.trim()) {
      toast.error("Debe completar los campos obligatorios (Paciente y Diagnóstico)");
      return;
    }

    const nueva: ConsultaGinecoData = {
      id: `gin-${Date.now()}`,
      paciente_nombre: form.paciente_nombre.trim(),
      tipo_consulta: form.tipo_consulta,
      fecha: new Date().toISOString().slice(0, 10),
      ta: form.ta,
      peso_kg: Number(form.peso_kg),
      edad_gestacional_semanas:
        form.tipo_consulta === "prenatal" ? Number(form.edad_gestacional_semanas) : undefined,
      altura_uterina_cm:
        form.tipo_consulta === "prenatal" ? Number(form.altura_uterina_cm) : undefined,
      fcf_lpm: form.tipo_consulta === "prenatal" ? Number(form.fcf_lpm) : undefined,
      fum: form.fum,
      diagnostico: form.diagnostico,
      plan_conducta: form.plan_conducta,
    };

    setConsultas([nueva, ...consultas]);
    setConsultaSeleccionadaId(nueva.id);
    toast.success("Consulta gineco-obstétrica registrada con éxito");
    setModalOpen(false);
  };

  const handleCopiarInformeGineco = (c: ConsultaGinecoData) => {
    const texto = `🌸 *CONTROL GINECO-OBSTÉTRICO*
👤 *Paciente:* ${c.paciente_nombre}
📅 *Fecha:* ${c.fecha}
🩺 *Tipo:* ${c.tipo_consulta.replace("_", " ").toUpperCase()}
⚖️ *Signos Vitales:* TA: ${c.ta} mmHg | Peso: ${c.peso_kg} kg
${c.edad_gestacional_semanas ? `🤰 *Edad Gestacional:* ${c.edad_gestacional_semanas} semanas
📏 *Altura Uterina:* ${c.altura_uterina_cm || "—"} cm
💓 *Frecuencia Cardíaca Fetal (FCF):* ${c.fcf_lpm || "—"} lpm
🗓️ *FUM:* ${c.fum || "—"} | *FPP Estimada:* ${c.fpp || "—"}` : ""}
🔬 *Diagnóstico:* ${c.diagnostico}
📋 *Plan & Conducta:* ${c.plan_conducta}

🏥 *Atendido en:* ${esModoClinica ? "Clínica de la Mujer & Maternidad" : "Consultorio Ginecológico"}`;

    navigator.clipboard.writeText(texto);
    toast.success("Informe copiado al portapapeles para WhatsApp");
  };

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Modo B Clínico */}
      <ClinicalPageHeader
        title="Ginecología & Obstetricia"
        subtitle="Control prenatal gestacional, cálculo de FPP (Naegele), maduración cervical (Bishop) y cribado ginecológico"
        icon={Baby}
        badge="Especialidad Quirúrgica & Materna"
        action={
          <Button
            onClick={() => setModalOpen(true)}
            size="sm"
            className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4" /> Nueva Consulta
          </Button>
        }
      />

      {/* Status Strip Clínico */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-border/80 bg-muted/20 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Baby className="h-3.5 w-3.5 text-rose-500" />
            <span>Gestantes en Control:</span>
            <strong className="text-foreground font-mono">{resumenMetricas.prenatales}</strong>
          </div>

          <div className="flex items-center gap-1.5 text-muted-foreground">
            <AlertTriangle className={`h-3.5 w-3.5 ${resumenMetricas.alertasHipertension > 0 ? "text-rose-600" : "text-emerald-500"}`} />
            <span>Alertas TA / Preeclampsia:</span>
            <strong className={`font-mono ${resumenMetricas.alertasHipertension > 0 ? "text-rose-600 font-bold" : "text-foreground"}`}>
              {resumenMetricas.alertasHipertension}
            </strong>
          </div>

          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Heart className="h-3.5 w-3.5 text-rose-500" />
            <span>FCF Segura (110-160 lpm):</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono">100%</strong>
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
          <UserCheck className="h-3 w-3" />
          <span>{resumenMetricas.total} pacientes registradas</span>
        </div>
      </div>

      {/* Tabs Principales de la Especialidad */}
      <Tabs
        value={tabActiva}
        onValueChange={(v) => setTabActiva(v as "censo_ficha" | "calculadoras" | "tabla_historica")}
        className="w-full space-y-4"
      >
        <TabsList className="bg-muted/30 p-1 rounded-xl border border-border/60">
          <TabsTrigger value="censo_ficha" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background">
            <Baby className="h-3.5 w-3.5 text-rose-500" />
            Censo & Ficha Obstétrica ({consultas.length})
          </TabsTrigger>
          <TabsTrigger value="calculadoras" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background">
            <Calculator className="h-3.5 w-3.5 text-primary" />
            Gestograma & Score de Bishop
          </TabsTrigger>
          <TabsTrigger value="tabla_historica" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background">
            <TableIcon className="h-3.5 w-3.5 text-muted-foreground" />
            Registro Histórico
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Master-Detail Censo & Ficha */}
        <TabsContent value="censo_ficha" className="m-0 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Columna Izquierda: Censo de Pacientes */}
            <div className="lg:col-span-5 bg-card border border-border/80 rounded-2xl p-3.5">
              <div className="mb-2 pb-2 border-b border-border/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Censo Gineco-Obstétrico</h4>
                  <p className="text-[10px] text-muted-foreground">Gestantes y controles preventivos</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {consultas.length} registros
                </Badge>
              </div>

              <CensoObstetricoList
                consultas={consultas}
                consultaSeleccionadaId={consultaSeleccionadaId}
                onSelectConsulta={(c) => setConsultaSeleccionadaId(c.id)}
                tiposConsulta={TIPOS_CONSULTA}
              />
            </div>

            {/* Columna Derecha: Ficha de la Consulta */}
            <div className="lg:col-span-7">
              <FichaConsultaObstetricaDetalle
                consulta={consultaActiva}
                onCopiarInforme={handleCopiarInformeGineco}
                tipoConsultaNombre={
                  TIPOS_CONSULTA.find((t) => t.id === consultaActiva?.tipo_consulta)?.nombre
                }
              />
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Gestograma y Calculadoras Obstétricas */}
        <TabsContent value="calculadoras" className="m-0 focus-visible:outline-none">
          <CalculadoraObstetricaNaegele
            onAplicarAConsulta={({ fpp, fum, edadGestacional }) => {
              setForm((prev) => ({
                ...prev,
                fum,
                edad_gestacional_semanas: edadGestacional,
                diagnostico: `Gestación de ${edadGestacional} semanas. FPP estimada: ${fpp}`,
              }));
              setModalOpen(true);
              toast.info("Valores transferidos a la nueva consulta");
            }}
          />
        </TabsContent>

        {/* Tab 3: Tabla Histórica Completa */}
        <TabsContent value="tabla_historica" className="m-0 focus-visible:outline-none">
          <div className="rounded-2xl border border-border/80 overflow-hidden bg-card">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-xs">Paciente</TableHead>
                  <TableHead className="text-xs">Tipo</TableHead>
                  <TableHead className="text-xs">Gestación</TableHead>
                  <TableHead className="text-xs">Signos</TableHead>
                  <TableHead className="text-xs">FPP / FUM</TableHead>
                  <TableHead className="text-xs">Diagnóstico</TableHead>
                  <TableHead className="text-xs text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consultas.map((c) => (
                  <TableRow key={c.id} className="text-xs">
                    <TableCell className="font-semibold text-foreground">
                      {c.paciente_nombre}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {c.tipo_consulta.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {c.edad_gestacional_semanas ? `${c.edad_gestacional_semanas} sem` : "—"}
                    </TableCell>
                    <TableCell className="font-mono">
                      TA: {c.ta} | {c.peso_kg} kg
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground text-[11px]">
                      {c.fpp || c.fum || "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={c.diagnostico}>
                      {c.diagnostico}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setConsultaSeleccionadaId(c.id);
                          setTabActiva("censo_ficha");
                        }}
                        className="h-7 text-xs"
                      >
                        Ver Ficha
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo Nueva Consulta */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Baby className="h-5 w-5 text-rose-600" />
              Nueva Consulta Gineco-Obstétrica
            </DialogTitle>
            <DialogDescription className="text-xs">
              Complete los parámetros biométricos y el diagnóstico del control prenatal o ginecológico.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Nombre de la Paciente *</Label>
              <Input
                placeholder="Ej: Carmen Gómez"
                value={form.paciente_nombre}
                onChange={(e) => setForm({ ...form, paciente_nombre: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs">Tipo de Consulta</Label>
                <Select
                  value={form.tipo_consulta}
                  onValueChange={(v) => setForm({ ...form, tipo_consulta: v as TipoConsultaGineco })}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_CONSULTA.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Tensión Arterial (TA)</Label>
                <Input
                  value={form.ta}
                  onChange={(e) => setForm({ ...form, ta: e.target.value })}
                  placeholder="Ej: 110/70"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            {form.tipo_consulta === "prenatal" && (
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5">
                <div className="space-y-1">
                  <Label className="text-[11px]">Semanas</Label>
                  <Input
                    type="number"
                    value={form.edad_gestacional_semanas}
                    onChange={(e) => setForm({ ...form, edad_gestacional_semanas: Number(e.target.value) })}
                    className="h-7 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">FCF (lpm)</Label>
                  <Input
                    type="number"
                    value={form.fcf_lpm}
                    onChange={(e) => setForm({ ...form, fcf_lpm: Number(e.target.value) })}
                    className="h-7 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Altura Uterina (cm)</Label>
                  <Input
                    type="number"
                    value={form.altura_uterina_cm}
                    onChange={(e) => setForm({ ...form, altura_uterina_cm: Number(e.target.value) })}
                    className="h-7 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Diagnóstico Obstétrico / Ginecológico *</Label>
              <Input
                placeholder="Ej: Gestación de 34 sem normoevolutiva"
                value={form.diagnostico}
                onChange={(e) => setForm({ ...form, diagnostico: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Plan de Conducta & Tratamiento</Label>
              <Textarea
                rows={2}
                placeholder="Ej: Suplementación con hierro + ácido fólico, control en 2 semanas..."
                value={form.plan_conducta}
                onChange={(e) => setForm({ ...form, plan_conducta: e.target.value })}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCrearConsulta} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl">
              Guardar Consulta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
