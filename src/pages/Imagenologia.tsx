import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePacientes } from "@/hooks/usePacientes";
import { usePersonal } from "@/hooks/usePersonal";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PacienteCombobox } from "@/components/PacienteCombobox";
import { ProfesionalCombobox } from "@/components/ProfesionalCombobox";
import {
  Image,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Activity,
  Plus,
  Search,
  ExternalLink,
  Printer,
  QrCode,
  Sparkles,
  Layers,
  Eye,
  AlertTriangle,
  Stethoscope
} from "lucide-react";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

const MODALIDADES = [
  { value: "rx", label: "Rayos X Digital (RX)" },
  { value: "ct", label: "Tomografía Computarizada (CT)" },
  { value: "mri", label: "Resonancia Magnética (MRI)" },
  { value: "us", label: "Ultrasonido / Doppler (US)" },
  { value: "mamografia", label: "Mamografía Digital 3D" },
  { value: "pet", label: "Tomografía por Emisión (PET/CT)" },
  { value: "fluoroscopia", label: "Fluoroscopia e Intervención" },
  { value: "densitometria", label: "Densitometría Ósea (DEXA)" },
  { value: "otro", label: "Otro Procedimiento" },
];

const ESTADOS_INFO: Record<string, { label: string; badge: "default" | "secondary" | "destructive" | "outline" }> = {
  solicitado: { label: "Solicitado", badge: "outline" },
  programado: { label: "Programado", badge: "secondary" },
  en_proceso: { label: "En Adquisición", badge: "default" },
  completado: { label: "Informado", badge: "default" },
  cancelado: { label: "Cancelado", badge: "destructive" },
};

const PLANTILLAS_CLASIFICACION: Record<string, { sistema: string; niveles: { valor: string; etiqueta: string; accion: string }[] }> = {
  mamografia: {
    sistema: "BI-RADS (Breast Imaging Reporting and Data System)",
    niveles: [
      { valor: "BI-RADS 0", etiqueta: "0: Incompleto", accion: "Requiere proyecciones adicionales o ecografía complementaria" },
      { valor: "BI-RADS 1", etiqueta: "1: Negativo", accion: "Mamografía de control anual habitual" },
      { valor: "BI-RADS 2", etiqueta: "2: Hallazgos benignos", accion: "Quistes simples o fibroadenomas calcificados. Control anual" },
      { valor: "BI-RADS 3", etiqueta: "3: Probablemente benigno (<2% riesgo)", accion: "Seguimiento estricto a corto plazo (6 meses)" },
      { valor: "BI-RADS 4A", etiqueta: "4A: Baja sospecha (2 - 10%)", accion: "Biopsia con aguja gruesa (BAG) recomendada" },
      { valor: "BI-RADS 4B", etiqueta: "4B: Sospecha moderada (10 - 50%)", accion: "Biopsia con aguja gruesa (BAG) recomendada" },
      { valor: "BI-RADS 4C", etiqueta: "4C: Alta sospecha (50 - 95%)", accion: "Biopsia histológica mandatoria y correlación anátomo-patológica" },
      { valor: "BI-RADS 5", etiqueta: "5: Altamente sugerente de malignidad (>95%)", accion: "Biopsia urgente y evaluación por oncología quirúrgica" },
      { valor: "BI-RADS 6", etiqueta: "6: Malignidad confirmada por biopsia previa", accion: "Planificación de cirugía o quimioterapia neoadyuvante" },
    ],
  },
  tiroides: {
    sistema: "TI-RADS (Thyroid Imaging Reporting and Data System - ACR)",
    niveles: [
      { valor: "TI-RADS 1", etiqueta: "TR1: Benigno (0 pts)", accion: "Sin sospecha ecográfica. No requiere PAAF" },
      { valor: "TI-RADS 2", etiqueta: "TR2: No sospechoso (2 pts)", accion: "No requiere punción de aguja fina (PAAF)" },
      { valor: "TI-RADS 3", etiqueta: "TR3: Levemente sospechoso (3 pts)", accion: "PAAF si nódulo ≥ 2.5 cm; seguimiento si ≥ 1.5 cm" },
      { valor: "TI-RADS 4", etiqueta: "TR4: Moderadamente sospechoso (4-6 pts)", accion: "PAAF si nódulo ≥ 1.5 cm; seguimiento si ≥ 1.0 cm" },
      { valor: "TI-RADS 5", etiqueta: "TR5: Altamente sospechoso (≥ 7 pts)", accion: "PAAF si nódulo ≥ 1.0 cm; seguimiento si ≥ 0.5 cm" },
    ],
  },
  prostata: {
    sistema: "PI-RADS v2.1 (Prostate Imaging - mpMRI)",
    niveles: [
      { valor: "PI-RADS 1", etiqueta: "1: Muy bajo riesgo", accion: "Malignidad clínica clínicamente significativa altamente improbable" },
      { valor: "PI-RADS 2", etiqueta: "2: Bajo riesgo", accion: "Malignidad clínicamente significativa improbable" },
      { valor: "PI-RADS 3", etiqueta: "3: Intermedio / Indeterminado", accion: "Valorar PSA libre, densidad de PSA y correlación clínica" },
      { valor: "PI-RADS 4", etiqueta: "4: Alto riesgo", accion: "Biopsia de próstata dirigida por fusión recomendada" },
      { valor: "PI-RADS 5", etiqueta: "5: Muy alto riesgo (>1.5 cm o extensión EPE)", accion: "Biopsia guiada mandatoria y estadiaje oncológico" },
    ],
  },
};

export default function Imagenologia() {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const { pacientes: listaPacientes } = usePacientes();
  const { personal: listaPersonal } = usePersonal();
  const [estudios, setEstudios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [filterModalidad, setFilterModalidad] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [informeDialog, setInformeDialog] = useState<any>(null);
  const [reportePrint, setReportePrint] = useState<any>(null);

  // Form state
  const [form, setForm] = useState({
    paciente_id: "",
    medico_solicitante_id: "",
    modalidad: "rx",
    tipo_estudio: "",
    region_anatomica: "",
    prioridad: "rutina",
    indicacion_clinica: "",
    diagnostico_presuntivo: "",
    contraste: false,
    sala: "",
    fecha_programada: "",
    notas: "",
  });

  // Informe estructurado
  const [clasificacionSeleccionada, setClasificacionSeleccionada] = useState("");
  const [clasificacionTipo, setClasificacionTipo] = useState<"ninguna" | "mamografia" | "tiroides" | "prostata">("ninguna");
  const [informe, setInforme] = useState({
    tecnica: "",
    hallazgos: "",
    conclusion: "",
    impresion_diagnostica: "",
    recomendacion: "",
  });

  const fetchEstudios = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("estudios_imagen")
      .select("*, pacientes(id, nombre, apellido, cedula, fecha_nacimiento, genero), medico:medico_solicitante_id(id, nombre, apellido, especialidad), radiologo:radiologo_id(id, nombre, apellido)")
      .eq("workspace_id", currentWorkspace.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    else setEstudios(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEstudios();
  }, [currentWorkspace]);

  const handleCreate = async () => {
    if (!currentWorkspace || !form.paciente_id || !form.tipo_estudio) {
      toast.error("Seleccione el paciente y el tipo de estudio");
      return;
    }
    const { error } = await supabase.from("estudios_imagen").insert({
      workspace_id: currentWorkspace.id,
      paciente_id: form.paciente_id,
      medico_solicitante_id: form.medico_solicitante_id || null,
      modalidad: form.modalidad,
      tipo_estudio: form.tipo_estudio,
      region_anatomica: form.region_anatomica || null,
      prioridad: form.prioridad as any,
      indicacion_clinica: form.indicacion_clinica || null,
      diagnostico_presuntivo: form.diagnostico_presuntivo || null,
      contraste: form.contraste,
      sala: form.sala || null,
      fecha_programada: form.fecha_programada || null,
      notas: form.notas || null,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Solicitud de imagen diagnóstica registrada");
      setDialogOpen(false);
      setForm({
        paciente_id: "",
        medico_solicitante_id: "",
        modalidad: "rx",
        tipo_estudio: "",
        region_anatomica: "",
        prioridad: "rutina",
        indicacion_clinica: "",
        diagnostico_presuntivo: "",
        contraste: false,
        sala: "",
        fecha_programada: "",
        notas: "",
      });
      fetchEstudios();
    }
  };

  const updateEstado = async (id: string, estado: string) => {
    const updates: any = { estado };
    if (estado === "en_proceso") updates.fecha_realizacion = new Date().toISOString();
    const { error } = await supabase.from("estudios_imagen").update(updates).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Estado de adquisición actualizado");
      fetchEstudios();
    }
  };

  const abrirInformeModal = (estudio: any) => {
    setInformeDialog(estudio);
    // Detectar si aplica clasificación estructurada
    const mod = estudio.modalidad?.toLowerCase();
    const tipo = (estudio.tipo_estudio || "").toLowerCase();
    let cTipo: "ninguna" | "mamografia" | "tiroides" | "prostata" = "ninguna";
    if (mod === "mamografia" || tipo.includes("mama") || tipo.includes("seno")) cTipo = "mamografia";
    else if (tipo.includes("tiroide") || tipo.includes("cuello")) cTipo = "tiroides";
    else if (tipo.includes("prostata") || tipo.includes("próstata")) cTipo = "prostata";
    setClasificacionTipo(cTipo);

    setInforme({
      tecnica: estudio.sala ? `Adquisición en ${estudio.sala} con protocolo estándar` : "",
      hallazgos: estudio.hallazgos || "",
      conclusion: estudio.conclusion || "",
      impresion_diagnostica: estudio.impresion_diagnostica || "",
      recomendacion: "",
    });
    setClasificacionSeleccionada("");
  };

  const saveInforme = async () => {
    if (!informeDialog) return;
    const conclusionFinal = clasificacionSeleccionada
      ? `${informe.conclusion}\n[CATEGORIZACIÓN: ${clasificacionSeleccionada}]`
      : informe.conclusion;

    const { error } = await supabase
      .from("estudios_imagen")
      .update({
        hallazgos: informe.hallazgos,
        conclusion: conclusionFinal,
        impresion_diagnostica: informe.impresion_diagnostica,
        estado: "completado",
        fecha_informe: new Date().toISOString(),
      })
      .eq("id", informeDialog.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Informe radiológico completado y validado");
      setInformeDialog(null);
      fetchEstudios();
    }
  };

  const filtered = estudios.filter((e) => {
    if (filterEstado !== "todos" && e.estado !== filterEstado) return false;
    if (filterModalidad !== "todos" && e.modalidad !== filterModalidad) return false;
    if (search) {
      const s = search.toLowerCase();
      const nombre = `${e.pacientes?.nombre || ""} ${e.pacientes?.apellido || ""}`.toLowerCase();
      return (
        nombre.includes(s) ||
        (e.numero_orden || "").toLowerCase().includes(s) ||
        (e.tipo_estudio || "").toLowerCase().includes(s) ||
        (e.pacientes?.cedula || "").toLowerCase().includes(s)
      );
    }
    return true;
  });

  const stats = {
    total: estudios.length,
    solicitados: estudios.filter((e) => e.estado === "solicitado").length,
    en_proceso: estudios.filter((e) => e.estado === "en_proceso").length,
    completados: estudios.filter((e) => e.estado === "completado").length,
    statCount: estudios.filter((e) => e.prioridad === "stat" && e.estado !== "completado").length,
  };

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="Imagenología & Diagnóstico por Imágenes"
        description="Gestión integral de modalidades radiológicas, informes estructurados (BI-RADS / TI-RADS) y enlace PACS"
        icon={Image}
        badgeText="Red PACS / RIS"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2 rounded-xl border-border/80"
              onClick={() => navigate("/visor-dicom")}
            >
              <Eye className="h-4 w-4 text-indigo-600" /> Abrir Visor PACS DICOM
            </Button>
            <Button
              onClick={() => setDialogOpen(true)}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
            >
              <Plus className="h-4 w-4" /> Solicitar Estudio
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ClinicalKpiCard
          label="Estudios Solicitados"
          value={stats.solicitados}
          subtitle="Pendientes de citación / sala"
          icon={Clock}
          color="amber"
        />
        <ClinicalKpiCard
          label="En Adquisición"
          value={stats.en_proceso}
          subtitle="En escáner o equipo"
          icon={Activity}
          color="indigo"
        />
        <ClinicalKpiCard
          label="Prioridad STAT"
          value={stats.statCount}
          subtitle="Urgencias y Terapia Intensiva"
          icon={AlertTriangle}
          color="rose"
        />
        <ClinicalKpiCard
          label="Informes Concluidos"
          value={stats.completados}
          subtitle="Validados con firma radiológica"
          icon={CheckCircle}
          color="emerald"
        />
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-3 rounded-2xl border border-border/80">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-background/50 rounded-xl"
            placeholder="Buscar por paciente, cédula, orden o tipo de estudio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-[150px] rounded-xl"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="solicitado">Solicitado</SelectItem>
              <SelectItem value="programado">Programado</SelectItem>
              <SelectItem value="en_proceso">En Adquisición</SelectItem>
              <SelectItem value="completado">Informado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterModalidad} onValueChange={setFilterModalidad}>
            <SelectTrigger className="w-[170px] rounded-xl"><SelectValue placeholder="Modalidad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las modalidades</SelectItem>
              {MODALIDADES.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla de Estudios */}
      <Card className="rounded-2xl border-border/80 overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-semibold">Nº Orden RIS</TableHead>
                <TableHead className="font-semibold">Paciente & Documento</TableHead>
                <TableHead className="font-semibold">Modalidad</TableHead>
                <TableHead className="font-semibold">Estudio & Región</TableHead>
                <TableHead className="font-semibold">Prioridad</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                <TableHead className="font-semibold">Fecha</TableHead>
                <TableHead className="text-right font-semibold">Acciones Radiológicas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Cargando estudios de imagen...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No se encontraron estudios en este criterio</TableCell></TableRow>
              ) : (
                filtered.map((e) => {
                  const estInfo = ESTADOS_INFO[e.estado] || ESTADOS_INFO.solicitado;
                  const isStat = e.prioridad === "stat";
                  return (
                    <TableRow key={e.id} className={isStat ? "bg-rose-500/5 hover:bg-rose-500/10" : ""}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {e.numero_orden || `IMG-${e.id.slice(0, 8).toUpperCase()}`}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{e.pacientes?.nombre} {e.pacientes?.apellido}</div>
                        <div className="text-xs text-muted-foreground font-mono">{e.pacientes?.cedula || "N/A"}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {MODALIDADES.find((m) => m.value === e.modalidad)?.label.split(" ")[0] || e.modalidad.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{e.tipo_estudio}</div>
                        {e.region_anatomica && <div className="text-xs text-muted-foreground">{e.region_anatomica} {e.contraste ? "• Con Contraste" : ""}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={e.prioridad === "stat" ? "destructive" : e.prioridad === "urgente" ? "secondary" : "outline"}>
                          {e.prioridad?.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={estInfo.badge}>{estInfo.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(e.fecha_programada || e.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5 items-center">
                          {/* Abrir en Visor DICOM */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-lg h-8 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                            title="Visualizar en visor DICOM / PACS"
                            onClick={() => navigate("/visor-dicom")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {e.estado === "solicitado" && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="rounded-lg h-8 text-xs"
                                onClick={() => updateEstado(e.id, "en_proceso")}
                              >
                                Adquirir
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="rounded-lg h-8 w-8 p-0 text-muted-foreground hover:text-rose-600"
                                onClick={() => updateEstado(e.id, "cancelado")}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          {e.estado === "en_proceso" && (
                            <Button
                              size="sm"
                              className="rounded-lg h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
                              onClick={() => abrirInformeModal(e)}
                            >
                              <FileText className="h-3.5 w-3.5" /> Informar
                            </Button>
                          )}

                          {e.estado === "completado" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-lg h-8 text-xs gap-1"
                                onClick={() => abrirInformeModal(e)}
                              >
                                <FileText className="h-3.5 w-3.5 text-indigo-600" /> Ver Informe
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="rounded-lg h-8 w-8 p-0"
                                title="Imprimir Formato Oficial con QR"
                                onClick={() => setReportePrint(e)}
                              >
                                <Printer className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog: Solicitar Estudio de Imagen */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Image className="h-6 w-6 text-indigo-600" /> Nueva Solicitud de Imagenología
            </DialogTitle>
            <DialogDescription>
              Generación de orden para radiodiagnóstico, resonancia, tomografía o ecografía
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Paciente *</Label>
              <PacienteCombobox
                pacientes={listaPacientes.map((p) => ({ id: p.id, nombre: p.nombre, apellido: p.apellido || "", cedula: p.cedula }))}
                value={form.paciente_id}
                onValueChange={(v) => setForm((f) => ({ ...f, paciente_id: v }))}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Médico Prescriptor</Label>
              <ProfesionalCombobox
                profesionales={listaPersonal.map((p) => ({ id: p.id, nombre: p.nombre, apellido: p.apellido || "" }))}
                value={form.medico_solicitante_id}
                onValueChange={(v) => setForm((f) => ({ ...f, medico_solicitante_id: v }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Modalidad Radiológica</Label>
                <Select value={form.modalidad} onValueChange={(v) => setForm((f) => ({ ...f, modalidad: v }))}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{MODALIDADES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Prioridad</Label>
                <Select value={form.prioridad} onValueChange={(v) => setForm((f) => ({ ...f, prioridad: v }))}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rutina">Rutina (Programada)</SelectItem>
                    <SelectItem value="urgente">Urgente (&lt; 4 horas)</SelectItem>
                    <SelectItem value="stat">STAT Inmediato (Trauma / Código ACV)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Tipo de Estudio *</Label>
                <Input
                  className="rounded-xl mt-1"
                  value={form.tipo_estudio}
                  onChange={(e) => setForm((f) => ({ ...f, tipo_estudio: e.target.value }))}
                  placeholder="Ej: TC Tórax con Contraste, Rx Tórax PA"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Región Anatómica</Label>
                <Input
                  className="rounded-xl mt-1"
                  value={form.region_anatomica}
                  onChange={(e) => setForm((f) => ({ ...f, region_anatomica: e.target.value }))}
                  placeholder="Ej: Tórax, Encéfalo, Rodilla Derecha"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Indicación Clínica / Motivo del Estudio</Label>
              <Textarea
                className="rounded-xl mt-1"
                value={form.indicacion_clinica}
                onChange={(e) => setForm((f) => ({ ...f, indicacion_clinica: e.target.value }))}
                placeholder="Ej: Sospecha de tromboembolismo pulmonar, disnea súbita y taquicardia sinusal"
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl border border-border/60">
              <input
                type="checkbox"
                id="contraste"
                className="rounded h-4 w-4"
                checked={form.contraste}
                onChange={(e) => setForm((f) => ({ ...f, contraste: e.target.checked }))}
              />
              <Label htmlFor="contraste" className="text-xs cursor-pointer font-medium">
                Requiere medio de contraste intravenoso (Verificar tasa de filtración glomerular / Creatinina)
              </Label>
            </div>
            <Button onClick={handleCreate} className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-5">
              Confirmar Solicitud de Imagen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Informe Estructurado Radiológico */}
      <Dialog open={!!informeDialog} onOpenChange={(v) => !v && setInformeDialog(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <FileText className="h-6 w-6 text-indigo-600" />
              Informe Radiológico — {informeDialog?.numero_orden || `IMG-${informeDialog?.id?.slice(0, 8)}`}
            </DialogTitle>
            <DialogDescription>
              Estudio: <strong>{informeDialog?.tipo_estudio}</strong> • Paciente: <strong>{informeDialog?.pacientes?.nombre} {informeDialog?.pacientes?.apellido}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Si aplica clasificación estructurada (BI-RADS, TI-RADS, PI-RADS) */}
            {clasificacionTipo !== "ninguna" && (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase">
                  <Sparkles className="h-4 w-4" /> Asistente de Clasificación Internacional ({PLANTILLAS_CLASIFICACION[clasificacionTipo]?.sistema})
                </div>
                <Select value={clasificacionSeleccionada} onValueChange={setClasificacionSeleccionada}>
                  <SelectTrigger className="rounded-xl bg-background"><SelectValue placeholder="Seleccionar categoría..." /></SelectTrigger>
                  <SelectContent>
                    {PLANTILLAS_CLASIFICACION[clasificacionTipo]?.niveles.map((n) => (
                      <SelectItem key={n.valor} value={n.valor}>
                        <strong>{n.etiqueta}</strong> — {n.accion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-xs font-semibold">Técnica Empleada & Proyecciones</Label>
              <Input
                className="rounded-xl mt-1"
                value={informe.tecnica}
                onChange={(e) => setInforme((f) => ({ ...f, tecnica: e.target.value }))}
                placeholder="Ej: Adquisición volumétrica helicoidal desde vértices hasta bases con cortes a 1.25 mm"
                disabled={informeDialog?.estado === "completado"}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Hallazgos Radiológicos Detallados *</Label>
              <Textarea
                className="rounded-xl mt-1 font-sans"
                rows={5}
                value={informe.hallazgos}
                onChange={(e) => setInforme((f) => ({ ...f, hallazgos: e.target.value }))}
                placeholder="Descripción sistemática: parénquima pulmonar, silueta cardiomediastínica, estructuras óseas y pleura..."
                disabled={informeDialog?.estado === "completado"}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Conclusión / Diagnóstico Radiológico *</Label>
              <Textarea
                className="rounded-xl mt-1 font-semibold"
                rows={3}
                value={informe.conclusion}
                onChange={(e) => setInforme((f) => ({ ...f, conclusion: e.target.value }))}
                placeholder="Ej: Infiltrado alveolar basal derecho compatible con neumonía adquirida en la comunidad"
                disabled={informeDialog?.estado === "completado"}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Impresión Diagnóstica / Recomendaciones</Label>
              <Textarea
                className="rounded-xl mt-1"
                rows={2}
                value={informe.impresion_diagnostica}
                onChange={(e) => setInforme((f) => ({ ...f, impresion_diagnostica: e.target.value }))}
                placeholder="Ej: Correlacionar con hemocultivos y clínica. Control radiológico post-tratamiento en 4 semanas."
                disabled={informeDialog?.estado === "completado"}
              />
            </div>

            {informeDialog?.estado !== "completado" ? (
              <Button onClick={saveInforme} className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-5">
                Validar y Estampar Firma Radiológica
              </Button>
            ) : (
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  className="rounded-xl gap-2"
                  onClick={() => { setReportePrint(informeDialog); setInformeDialog(null); }}
                >
                  <Printer className="h-4 w-4" /> Generar Documento para Impresión
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Impresión Oficial de Informe Radiológico */}
      <Dialog open={!!reportePrint} onOpenChange={(v) => !v && setReportePrint(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-8 print:p-0">
          {reportePrint && (
            <div className="space-y-6 text-foreground font-sans">
              <div className="flex justify-between items-start border-b border-border/80 pb-4">
                <div>
                  <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                    <Image className="h-6 w-6 text-indigo-600" />
                    DEPARTAMENTO DE IMAGENOLOGÍA & RADIOLOGÍA
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Servicio de Diagnóstico por Imágenes Avanzado • Acreditación MSP RD Ley 42-01
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
                    ESTUDIO: {reportePrint.numero_orden || `IMG-${reportePrint.id.slice(0, 8).toUpperCase()}`}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Fecha: {new Date(reportePrint.fecha_informe || reportePrint.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Ficha del Paciente */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/20 rounded-xl border border-border/60 text-xs">
                <div>
                  <span className="text-muted-foreground block">Paciente:</span>
                  <strong className="text-foreground text-sm font-semibold">
                    {reportePrint.pacientes?.nombre} {reportePrint.pacientes?.apellido}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Cédula / Documento:</span>
                  <span className="font-mono">{reportePrint.pacientes?.cedula || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Modalidad & Región:</span>
                  <span className="font-semibold">{reportePrint.tipo_estudio}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Médico Solicitante:</span>
                  <span>Dr(a). {reportePrint.medico?.nombre || "No especificado"} {reportePrint.medico?.apellido || ""}</span>
                </div>
              </div>

              {/* Cuerpo del Informe Radiológico */}
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Hallazgos Radiológicos</h4>
                  <div className="p-3 bg-muted/10 rounded-xl border border-border/40 whitespace-pre-line leading-relaxed text-foreground">
                    {reportePrint.hallazgos || "Sin descripción de hallazgos"}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Conclusión</h4>
                  <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/20 whitespace-pre-line font-medium leading-relaxed text-foreground">
                    {reportePrint.conclusion || "Sin conclusión especificada"}
                  </div>
                </div>

                {reportePrint.impresion_diagnostica && (
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Recomendación</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                      {reportePrint.impresion_diagnostica}
                    </p>
                  </div>
                )}
              </div>

              {/* Pie de Firma y QR */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border/80 items-end">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 bg-muted/40 border border-border/80 rounded-lg flex items-center justify-center p-1">
                    <QrCode className="h-14 w-14 text-foreground/80" />
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    <div className="font-mono font-semibold">PACS Archival Validated</div>
                    <div>DICOM UID Verificado</div>
                    <div>portal.vitalist.rd/pacs/{reportePrint.id.slice(0, 8)}</div>
                  </div>
                </div>

                <div className="text-center border-t border-border/80 pt-2 mx-4">
                  <div className="text-xs font-semibold">Dr. Eduardo Matos, MD</div>
                  <div className="text-[10px] text-muted-foreground">Especialista en Radiodiagnóstico e Imágenes</div>
                  <div className="text-[10px] text-indigo-600 font-mono mt-0.5">Exequátur 18239-21 • Firma Electrónica</div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => window.print()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 text-xs"
                  >
                    <Printer className="h-4 w-4" /> Imprimir Informe
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
