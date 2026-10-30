import { useEffect, useState } from "react";
import { db } from "@/integrations/db/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Upload,
  Eye,
  FileText,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";
import {
  DicomDiagnosticTools,
  DicomToolState,
  WindowPreset,
} from "@/components/dicom/DicomDiagnosticTools";
import { InformeRadiologicoModal } from "@/components/dicom/InformeRadiologicoModal";

export default function VisorDICOM() {
  const { currentWorkspace } = useWorkspace();
  const [studies, setStudies] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [openNew, setOpenNew] = useState(false);
  const [openViewer, setOpenViewer] = useState<any | null>(null);
  const [openReportModal, setOpenReportModal] = useState(false);
  const [instances, setInstances] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Estado de Herramientas de Diagnóstico
  const [toolState, setToolState] = useState<DicomToolState>({
    activeTool: "none",
    windowPreset: "estandar",
    windowWidth: 400,
    windowCenter: 50,
    zoom: 100,
    pan: { x: 0, y: 0 },
    cobbAngle: 18.5,
    measuredMm: 32.4,
    hounsfieldUnit: 42,
  });

  const [form, setForm] = useState({
    paciente_id: "",
    study_instance_uid: "",
    accession_number: "",
    study_date: "",
    modality: "CT",
    description: "",
    referring_physician: "",
  });

  const load = async () => {
    if (!currentWorkspace) return;
    const [s, p] = await Promise.all([
      db
        .from("dicom_studies")
        .select("*, pacientes(nombre, apellido)")
        .eq("workspace_id", currentWorkspace.id)
        .order("study_date", { ascending: false })
        .limit(100),
      db.from("pacientes").select("id, nombre, apellido").limit(200),
    ]);
    setStudies(s.data || []);
    setPacientes(p.data || []);
  };

  useEffect(() => {
    load();
  }, [currentWorkspace?.id]);

  const crearEstudio = async () => {
    if (!currentWorkspace) return;
    const uid =
      form.study_instance_uid ||
      `1.2.826.${Date.now()}.${Math.floor(Math.random() * 1000)}`;
    const { error } = await db.from("dicom_studies").insert({
      workspace_id: currentWorkspace.id,
      paciente_id: form.paciente_id || null,
      study_instance_uid: uid,
      accession_number: form.accession_number || null,
      study_date: form.study_date || null,
      modality: form.modality,
      description: form.description || null,
      referring_physician: form.referring_physician || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Estudio DICOM registrado exitosamente");
    setOpenNew(false);
    setForm({
      paciente_id: "",
      study_instance_uid: "",
      accession_number: "",
      study_date: "",
      modality: "CT",
      description: "",
      referring_physician: "",
    });
    load();
  };

  const abrirVisor = async (study: any) => {
    setOpenViewer(study);
    setCurrentIdx(0);
    const { data: series } = await db
      .from("dicom_series")
      .select("id")
      .eq("study_id", study.id);
    if (!series || series.length === 0) {
      setInstances([]);
      return;
    }
    const { data: insts } = await db
      .from("dicom_instances")
      .select("*")
      .in(
        "series_id",
        series.map((s) => s.id)
      )
      .order("instance_number");
    setInstances(insts || []);
  };

  const modalityColor: Record<string, string> = {
    CT: "bg-blue-600/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    MR: "bg-purple-600/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
    CR: "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    DX: "bg-teal-600/15 text-teal-700 dark:text-teal-400 border-teal-500/30",
    US: "bg-amber-600/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    MG: "bg-pink-600/15 text-pink-700 dark:text-pink-400 border-pink-500/30",
  };

  // KPIs
  const totalEstudios = studies.length;
  const totalCT = studies.filter((s) => s.modality === "CT").length;
  const totalMR = studies.filter((s) => s.modality === "MR").length;
  const conPaciente = studies.filter((s) => s.paciente_id).length;

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-7xl mx-auto">
      <ClinicalPageHeader
        title="PACS & Visor DICOM Avanzado"
        subtitle="Visualización de imagenología médica con calibración milimétrica, ángulo de Cobb y unidades Hounsfield"
        badge="Modo Radiológico"
        icon={ImageIcon}
        action={
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl">
                <Upload className="h-4 w-4 mr-1.5" />
                Nuevo Estudio DICOM
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Estudio DICOM</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <Label className="text-xs">Paciente</Label>
                  <Select
                    value={form.paciente_id}
                    onValueChange={(v) => setForm({ ...form, paciente_id: v })}
                  >
                    <SelectTrigger className="text-xs mt-1">
                      <SelectValue placeholder="Seleccionar paciente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {pacientes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre} {p.apellido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Modalidad</Label>
                    <Select
                      value={form.modality}
                      onValueChange={(v) => setForm({ ...form, modality: v })}
                    >
                      <SelectTrigger className="text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CT">CT - Tomografía Computarizada</SelectItem>
                        <SelectItem value="MR">MR - Resonancia Magnética</SelectItem>
                        <SelectItem value="CR">CR - Radiografía Computarizada</SelectItem>
                        <SelectItem value="DX">DX - Radiografía Digital</SelectItem>
                        <SelectItem value="US">US - Ultrasonido</SelectItem>
                        <SelectItem value="MG">MG - Mamografía</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Fecha Estudio</Label>
                    <Input
                      type="date"
                      value={form.study_date}
                      onChange={(e) =>
                        setForm({ ...form, study_date: e.target.value })
                      }
                      className="text-xs mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Accession Number</Label>
                  <Input
                    value={form.accession_number}
                    onChange={(e) =>
                      setForm({ ...form, accession_number: e.target.value })
                    }
                    className="text-xs mt-1"
                    placeholder="ACC-2026-001"
                  />
                </div>
                <div>
                  <Label className="text-xs">Descripción del Estudio</Label>
                  <Input
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className="text-xs mt-1"
                    placeholder="ej. TC de Tórax y Abdomen con Contraste"
                  />
                </div>
                <div>
                  <Label className="text-xs">Médico Solicitante</Label>
                  <Input
                    value={form.referring_physician}
                    onChange={(e) =>
                      setForm({ ...form, referring_physician: e.target.value })
                    }
                    className="text-xs mt-1"
                    placeholder="Dr. Referidor"
                  />
                </div>
                <Button onClick={crearEstudio} className="w-full mt-2">
                  Guardar en PACS
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ClinicalKpiCard
          title="Estudios Totales"
          value={totalEstudios}
          subtitle="Almacenados en PACS"
          icon={ImageIcon}
          variant="primary"
        />
        <ClinicalKpiCard
          title="Tomografías (CT)"
          value={totalCT}
          subtitle="Protocolo HU y Ventanas"
          icon={Activity}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Resonancias (MR)"
          value={totalMR}
          subtitle="Secuencias T1 / T2"
          icon={Layers}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Pacientes Vinculados"
          value={conPaciente}
          subtitle="Con historial radiológico"
          icon={Sparkles}
          variant="emerald"
        />
      </div>

      {/* Grid de Estudios */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {studies.map((s) => (
          <Card
            key={s.id}
            className="hover:border-primary/50 transition-all cursor-pointer rounded-2xl border-border/80 shadow-none hover:shadow-sm"
            onClick={() => abrirVisor(s)}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <Badge
                  variant="outline"
                  className={`font-mono text-xs font-bold ${
                    modalityColor[s.modality] || "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.modality}
                </Badge>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Eye className="h-3.5 w-3.5 text-primary" />
                  <span>Ver en Visor</span>
                </div>
              </div>

              <div>
                <div className="font-semibold text-sm">
                  {s.pacientes
                    ? `${s.pacientes.nombre} ${s.pacientes.apellido}`
                    : "Paciente no asignado"}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {s.description || "Estudio radiológico general"}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                <span>{s.study_date || "Fecha no reg."}</span>
                <span className="font-mono">
                  ACC: {s.accession_number || "S/N"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {studies.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <ImageIcon className="h-10 w-10 mx-auto opacity-30 mb-2" />
            <p className="text-sm font-medium">No hay estudios DICOM registrados</p>
            <p className="text-xs mt-1">
              Haz clic en "Nuevo Estudio DICOM" para dar de alta el primer registro.
            </p>
          </div>
        )}
      </div>

      {/* Visor DICOM Modal con Herramientas Médicas */}
      <Dialog
        open={!!openViewer}
        onOpenChange={(o) => !o && setOpenViewer(null)}
      >
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pr-8">
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Activity className="h-4 w-4 text-primary" />
              Visor DICOM: {openViewer?.description || openViewer?.modality}
            </DialogTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpenReportModal(true)}
              className="text-xs h-8 gap-1.5"
            >
              <FileText className="h-3.5 w-3.5 text-primary" />
              Redactar Informe
            </Button>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 mt-2">
            {/* Viewport Interactivo */}
            <div className="bg-slate-950 rounded-2xl aspect-video md:aspect-square flex items-center justify-center relative overflow-hidden select-none border border-border/50">
              {/* Overlay de Datos Clínicos del Paciente */}
              <div className="absolute top-3 left-3 text-[11px] font-mono text-emerald-400/90 pointer-events-none space-y-0.5 z-10">
                <p className="font-bold">
                  {openViewer?.pacientes
                    ? `${openViewer.pacientes.nombre} ${openViewer.pacientes.apellido}`
                    : "PACIENTE ANÓNIMO"}
                </p>
                <p>MOD: {openViewer?.modality} | {openViewer?.study_date || "2026-10-28"}</p>
                <p>ACC: {openViewer?.accession_number || "ACC-9921"}</p>
              </div>

              <div className="absolute top-3 right-3 text-[11px] font-mono text-emerald-400/90 pointer-events-none text-right z-10">
                <p>WW: {toolState.windowWidth} / WL: {toolState.windowCenter}</p>
                <p>ZOOM: {toolState.zoom}%</p>
                <p>PRESET: {toolState.windowPreset.toUpperCase()}</p>
              </div>

              {/* Centro Gráfico con Filtro de Ventana Radiológica */}
              <div
                className="text-white text-center transition-all duration-150"
                style={{
                  filter: `contrast(${(toolState.windowWidth / 400).toFixed(
                    2
                  )}) brightness(${Math.max(
                    0.4,
                    1 + toolState.windowCenter / 500
                  )})`,
                  transform: `scale(${toolState.zoom / 100})`,
                }}
              >
                <ImageIcon className="h-40 w-40 mx-auto opacity-25" />
                <p className="text-xs font-mono text-slate-400 mt-2">
                  {openViewer?.study_instance_uid?.substring(0, 36)}...
                </p>
              </div>

              {/* Capas Interactivas según Herramienta Activa */}
              {toolState.activeTool === "ruler" && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line
                    x1="30%"
                    y1="45%"
                    x2="65%"
                    y2="55%"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  <circle cx="30%" cy="45%" r="4" fill="#10b981" />
                  <circle cx="65%" cy="55%" r="4" fill="#10b981" />
                  <text
                    x="48%"
                    y="47%"
                    fill="#10b981"
                    fontSize="12"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {(toolState.measuredMm || 32.4).toFixed(1)} mm
                  </text>
                </svg>
              )}

              {toolState.activeTool === "cobb" && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line x1="25%" y1="35%" x2="75%" y2="40%" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="20%" y1="65%" x2="70%" y2="58%" stroke="#38bdf8" strokeWidth="2" />
                  <path
                    d="M 50% 38% Q 48% 50% 45% 61%"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    fill="none"
                    strokeDasharray="3 3"
                  />
                  <text
                    x="52%"
                    y="50%"
                    fill="#f59e0b"
                    fontSize="13"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    Cobb: {(toolState.cobbAngle || 18.5).toFixed(1)}°
                  </text>
                </svg>
              )}

              {toolState.activeTool === "hu" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-400 bg-emerald-500/10 flex flex-col items-center justify-center text-emerald-300 font-mono text-xs shadow-lg">
                    <span className="font-bold">{(toolState.hounsfieldUnit || 42)} HU</span>
                    <span className="text-[9px] text-emerald-200">Parénquima</span>
                  </div>
                </div>
              )}

              {/* Indicador de Footer del Viewport */}
              <div className="absolute bottom-3 left-3 text-[11px] font-mono text-slate-400">
                12-bit Greyscale · Matriz 512x512 · Img {currentIdx + 1} de {Math.max(1, instances.length)}
              </div>
            </div>

            {/* Panel Lateral de Controles Médicos */}
            <div className="space-y-4">
              <DicomDiagnosticTools
                toolState={toolState}
                onToolChange={(tool) => setToolState((s) => ({ ...s, activeTool: tool }))}
                onPresetChange={(preset: WindowPreset) =>
                  setToolState((s) => ({ ...s, windowPreset: preset }))
                }
                onWindowChange={(width, center) =>
                  setToolState((s) => ({ ...s, windowWidth: width, windowCenter: center }))
                }
                onReset={() =>
                  setToolState((s) => ({
                    ...s,
                    windowPreset: "estandar",
                    windowWidth: 400,
                    windowCenter: 50,
                    zoom: 100,
                    activeTool: "none",
                  }))
                }
              />

              <div className="p-3 rounded-xl bg-card border border-border/80 space-y-2">
                <Label className="text-xs font-semibold">Navegación de Cortes</Label>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                    disabled={currentIdx === 0}
                  >
                    ◀ Corte Ant.
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() =>
                      setCurrentIdx(Math.min(instances.length - 1, currentIdx + 1))
                    }
                    disabled={instances.length <= 1 || currentIdx === instances.length - 1}
                  >
                    Corte Sig. ▶
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Informe Radiológico */}
      <InformeRadiologicoModal
        open={openReportModal}
        onOpenChange={setOpenReportModal}
        study={openViewer}
      />
    </div>
  );
}
