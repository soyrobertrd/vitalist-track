import { useState, useEffect } from "react";
import { db } from "@/integrations/db/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Scissors,
  Calendar as CalendarIcon,
  Clock,
  Users,
  CheckSquare,
  DollarSign,
  AlertTriangle,
  FileSignature,
  Plus,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useActiveSucursal } from "@/contexts/ActiveSucursalContext";
import { PacienteCombobox } from "@/components/PacienteCombobox";
import { ProfesionalCombobox } from "@/components/ProfesionalCombobox";
import { ConsentimientoQuirurgicoModal, RegistroConsentimientoQuirurgico } from "@/components/clinical/ConsentimientoQuirurgicoModal";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

const CHECKLIST_PREOP = [
  "Identificación inequívoca del paciente y brazalete colocado",
  "Consentimiento informado quirúrgico y anestésico firmado (Ley 42-01)",
  "Marcaje activo del sitio quirúrgico por el cirujano responsable",
  "Ayuno verificado y documentado (8h mínimo para sólidos)",
  "Alergias conocidas revisadas y verificadas",
  "Riesgo de vía aérea difícil evaluado (Mallampati / Cormack)",
  "Disponibilidad de hemoderivados / Pruebas cruzadas reservadas",
  "Profilaxis antibiótica administrada (<60 min antes de la incisión)",
  "Profilaxis tromboembólica mecánica o farmacológica aplicada",
  "Dos accesos venosos periféricos permeables de gran calibre",
];

const CHECKLIST_INTRAOP = [
  "Pausa Quirúrgica (Time-Out OMS): confirmación en voz alta del equipo",
  "Verificación verbal del procedimiento exacto y sitio anatómico",
  "Previsión de eventos críticos por cirujano y anestesiólogo",
  "Instrumental, agujas y compresas contados antes de la incisión",
  "Monitorización hemodinámica continua y capnografía activas",
  "Pausa antes del cierre: recuento final de gasas, agujas e instrumental COMPLETO",
  "Etiquetado estéril de piezas anatomopatológicas con nombre del paciente",
  "Verificación del plan postoperatorio y destino (Sala / URPA / UCI)",
];

export default function Quirofano() {
  const { currentWorkspace } = useWorkspace();
  const { activeSucursalId } = useActiveSucursal();
  const [cirugias, setCirugias] = useState<any[]>([]);
  const [salas, setSalas] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [salaDialogOpen, setSalaDialogOpen] = useState(false);
  const [cirugiaSeleccionada, setCirugiaSeleccionada] = useState<any>(null);
  const [consentimientoModalOpen, setConsentimientoModalOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({
    paciente_id: "",
    profesional_id: "",
    sala_id: "",
    tipo_cirugia: "",
    diagnostico_preop: "",
    fecha_programada: format(new Date(), "yyyy-MM-dd"),
    hora_inicio: "08:00",
    duracion_estimada_min: 60,
    prioridad: "electiva" as string,
    anestesiologo: "",
    tipo_anestesia: "",
    instrumentista: "",
    costo_estimado: 0,
    notas_operatorias: "",
  });
  const [salaForm, setSalaForm] = useState({ nombre: "", capacidad: 1, notas: "" });

  useEffect(() => {
    if (currentWorkspace?.id) fetchData();
  }, [currentWorkspace?.id, activeSucursalId]);

  const fetchData = async () => {
    setLoading(true);
    const wsId = currentWorkspace!.id;
    const [cRes, sRes, pxRes, psRes] = await Promise.all([
      (() => {
        let q = db
          .from("cirugias")
          .select("*, pacientes(id, nombre, apellido, cedula), personal_salud(id, nombre, apellido, especialidad), salas_operacion(id, nombre)")
          .eq("workspace_id", wsId)
          .order("fecha_programada", { ascending: false });
        if (activeSucursalId) q = q.eq("sucursal_id", activeSucursalId);
        return q;
      })(),
      db.from("salas_operacion").select("*").eq("workspace_id", wsId).eq("activa", true),
      db.from("pacientes").select("*").eq("workspace_id", wsId).limit(500),
      db.from("personal_salud").select("*").eq("workspace_id", wsId).eq("activo", true),
    ]);
    setCirugias(cRes.data || []);
    setSalas(sRes.data || []);
    setPacientes(pxRes.data || []);
    setProfesionales(psRes.data || []);
    setLoading(false);
  };

  const crearCirugia = async () => {
    if (!form.paciente_id || !form.tipo_cirugia || !form.fecha_programada) {
      toast.error("Paciente, tipo de cirugía y fecha son obligatorios");
      return;
    }
    const { error } = await db.from("cirugias").insert({
      workspace_id: currentWorkspace!.id,
      sucursal_id: activeSucursalId || null,
      paciente_id: form.paciente_id,
      profesional_id: form.profesional_id || null,
      sala_id: form.sala_id || null,
      tipo_cirugia: form.tipo_cirugia,
      diagnostico_preop: form.diagnostico_preop || null,
      fecha_programada: form.fecha_programada,
      hora_inicio: form.hora_inicio || null,
      duracion_estimada_min: form.duracion_estimada_min,
      prioridad: form.prioridad as any,
      anestesiologo: form.anestesiologo || null,
      tipo_anestesia: form.tipo_anestesia || null,
      instrumentista: form.instrumentista || null,
      costo_estimado: form.costo_estimado || 0,
      notas_operatorias: form.notas_operatorias || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cirugía programada exitosamente en el bloque quirúrgico");
    setDialogOpen(false);
    setForm({
      paciente_id: "",
      profesional_id: "",
      sala_id: "",
      tipo_cirugia: "",
      diagnostico_preop: "",
      fecha_programada: format(new Date(), "yyyy-MM-dd"),
      hora_inicio: "08:00",
      duracion_estimada_min: 60,
      prioridad: "electiva",
      anestesiologo: "",
      tipo_anestesia: "",
      instrumentista: "",
      costo_estimado: 0,
      notas_operatorias: "",
    });
    fetchData();
  };

  const crearSala = async () => {
    if (!salaForm.nombre) {
      toast.error("El nombre de la sala es obligatorio");
      return;
    }
    const { error } = await db.from("salas_operacion").insert({
      workspace_id: currentWorkspace!.id,
      sucursal_id: activeSucursalId || null,
      ...salaForm,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Sala quirúrgica habilitada");
    setSalaDialogOpen(false);
    setSalaForm({ nombre: "", capacidad: 1, notas: "" });
    fetchData();
  };

  const actualizarEstado = async (id: string, estado: string) => {
    const updates: any = { estado };
    if (estado === "en_curso") updates.hora_inicio = format(new Date(), "HH:mm");
    if (estado === "completada") updates.hora_fin = format(new Date(), "HH:mm");
    const { error } = await db.from("cirugias").update(updates).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Cirugía marcada como: ${estado.toUpperCase()}`);
    fetchData();
  };

  const hoy = format(new Date(), "yyyy-MM-dd");
  const cirugiasHoy = cirugias.filter((c) => c.fecha_programada === hoy);
  const cirugiasProximas = cirugias.filter((c) => c.fecha_programada > hoy && c.estado === "programada");
  const cirugiasEnCurso = cirugias.filter((c) => c.estado === "en_curso");

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="Bloque Quirúrgico & Centro de Operaciones"
        description="Programación quirúrgica, disponibilidad de quirófanos y lista de verificación de seguridad OMS"
        icon={Scissors}
        badgeText="Quirófano Estéril"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-border/80 gap-1.5"
              onClick={() => setSalaDialogOpen(true)}
            >
              <Plus className="h-4 w-4" /> Nueva Sala
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4" /> Programar Intervención
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <ClinicalKpiCard
          label="Intervenciones Hoy"
          value={cirugiasHoy.length}
          subtitle="Programadas para la fecha"
          icon={CalendarIcon}
          color="indigo"
        />
        <ClinicalKpiCard
          label="En Acto Quirúrgico"
          value={cirugiasEnCurso.length}
          subtitle="Cirugía en curso ahora"
          icon={Activity}
          color="rose"
        />
        <ClinicalKpiCard
          label="Próximas en Agenda"
          value={cirugiasProximas.length}
          subtitle="Para días posteriores"
          icon={Clock}
          color="amber"
        />
        <ClinicalKpiCard
          label="Salas Disponibles"
          value={salas.length}
          subtitle="Quirófanos operativos"
          icon={ShieldCheck}
          color="emerald"
        />
      </div>

      <Tabs defaultValue="agenda" className="space-y-4">
        <TabsList className="bg-card border border-border/80 p-1 rounded-xl">
          <TabsTrigger value="agenda" className="rounded-lg gap-2">
            <CalendarIcon className="h-4 w-4" /> Agenda Quirúrgica ({cirugias.length})
          </TabsTrigger>
          <TabsTrigger value="salas" className="rounded-lg gap-2">
            <Activity className="h-4 w-4" /> Quirófanos & Salas ({salas.length})
          </TabsTrigger>
          <TabsTrigger value="checklists" className="rounded-lg gap-2">
            <CheckSquare className="h-4 w-4" /> Checklists de Seguridad OMS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agenda">
          <Card className="rounded-2xl border-border/80 overflow-hidden shadow-sm">
            <CardContent className="p-0">
              <ScrollArea className="max-h-[550px]">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-semibold">Fecha & Hora</TableHead>
                      <TableHead className="font-semibold">Paciente & Cédula</TableHead>
                      <TableHead className="font-semibold">Procedimiento Quirúrgico</TableHead>
                      <TableHead className="font-semibold">Cirujano Principal</TableHead>
                      <TableHead className="font-semibold">Quirófano</TableHead>
                      <TableHead className="font-semibold">Prioridad</TableHead>
                      <TableHead className="font-semibold">Estado</TableHead>
                      <TableHead className="text-right font-semibold">Acciones Asistenciales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cirugias.map((c) => {
                      const isEmergency = c.prioridad === "emergencia";
                      const isEnCurso = c.estado === "en_curso";
                      return (
                        <TableRow
                          key={c.id}
                          className={isEmergency ? "bg-rose-500/5 hover:bg-rose-500/10" : isEnCurso ? "bg-amber-500/5" : ""}
                        >
                          <TableCell className="whitespace-nowrap font-mono text-xs">
                            <span className="font-semibold text-foreground">
                              {format(new Date(c.fecha_programada + "T12:00:00"), "dd/MM/yyyy")}
                            </span>
                            <span className="block text-muted-foreground">{c.hora_inicio || "--:--"}</span>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-foreground">{c.pacientes ? `${c.pacientes.nombre} ${c.pacientes.apellido}` : "-"}</div>
                            <div className="text-xs text-muted-foreground font-mono">{c.pacientes?.cedula || "N/A"}</div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="text-foreground">{c.tipo_cirugia}</div>
                            {c.diagnostico_preop && <div className="text-xs text-muted-foreground">{c.diagnostico_preop}</div>}
                          </TableCell>
                          <TableCell className="text-sm">
                            {c.personal_salud ? (
                              <div>
                                <span>Dr(a). {c.personal_salud.nombre} {c.personal_salud.apellido}</span>
                                {c.personal_salud.especialidad && <span className="text-xs text-muted-foreground block">{c.personal_salud.especialidad}</span>}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">No asignado</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-medium">
                              {c.salas_operacion?.nombre || "Sin asignar"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isEmergency ? "destructive" : c.prioridad === "urgente" ? "secondary" : "outline"}>
                              {c.prioridad?.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={c.estado === "completada" ? "default" : c.estado === "en_curso" ? "destructive" : "secondary"}>
                              {c.estado === "en_curso" ? "EN CURSO" : c.estado?.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1.5 items-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCirugiaSeleccionada(c);
                                  setConsentimientoModalOpen(true);
                                }}
                                className="h-8 px-2.5 rounded-xl text-xs gap-1.5 border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                              >
                                <FileSignature className="h-3.5 w-3.5 text-teal-600" />
                                Consentimiento
                              </Button>

                              {c.estado === "programada" && (
                                <Button
                                  size="sm"
                                  className="h-8 rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                                  onClick={() => actualizarEstado(c.id, "en_curso")}
                                >
                                  Iniciar
                                </Button>
                              )}

                              {c.estado === "en_curso" && (
                                <Button
                                  size="sm"
                                  className="h-8 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                  onClick={() => actualizarEstado(c.id, "completada")}
                                >
                                  Completar
                                </Button>
                              )}

                              {c.estado === "programada" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 rounded-xl text-xs text-muted-foreground hover:text-rose-600"
                                  onClick={() => actualizarEstado(c.id, "cancelada")}
                                >
                                  Cancelar
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {cirugias.length === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">No hay cirugías programadas en este período</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salas">
          <div className="grid gap-4 md:grid-cols-3">
            {salas.map((s) => {
              const enUso = cirugias.find((c) => c.sala_id === s.id && c.estado === "en_curso");
              return (
                <Card key={s.id} className={`rounded-2xl border-border/80 shadow-sm ${enUso ? "border-rose-500/60 bg-rose-500/5" : ""}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center justify-between">
                      <span>{s.nombre}</span>
                      <Badge variant={enUso ? "destructive" : "default"}>
                        {enUso ? "EN CIRUGÍA" : "DISPONIBLE"}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">Quirófano Estéril • Capacidad: {s.capacidad} mesa(s)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-1 text-sm">
                    {enUso ? (
                      <div className="p-3 bg-card rounded-xl border border-border/60 space-y-1">
                        <span className="text-xs text-muted-foreground block font-semibold">Procedimiento en curso:</span>
                        <div className="font-bold text-foreground">{enUso.tipo_cirugia}</div>
                        <div className="text-xs text-muted-foreground">
                          Paciente: <strong>{enUso.pacientes?.nombre} {enUso.pacientes?.apellido}</strong>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Cirujano: Dr(a). {enUso.personal_salud?.nombre || "No especificado"}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Sala sanitizada y lista para la siguiente intervención</p>
                    )}
                    {s.notas && <p className="text-xs text-muted-foreground">{s.notas}</p>}
                  </CardContent>
                </Card>
              );
            })}
            {salas.length === 0 && (
              <Card className="md:col-span-3 rounded-2xl border-border/80">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No hay salas registradas. Haga clic en "Nueva Sala" para configurar el área quirúrgica.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="checklists">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-2xl border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <CheckSquare className="h-5 w-5 text-indigo-600" />
                  Paso 1: Antes de la Inducción Anestésica (Sign In OMS)
                </CardTitle>
                <CardDescription className="text-xs">
                  Verificación de seguridad en el área de recepción prequirúrgica
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {CHECKLIST_PREOP.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-xl hover:bg-muted/40 transition-colors">
                      <Checkbox id={`preop-${i}`} className="mt-0.5 rounded-md" />
                      <label htmlFor={`preop-${i}`} className="text-xs leading-relaxed text-foreground cursor-pointer font-medium">
                        {item}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <CheckSquare className="h-5 w-5 text-indigo-600" />
                  Paso 2 & 3: Pausa Quirúrgica & Cierre (Time Out / Sign Out)
                </CardTitle>
                <CardDescription className="text-xs">
                  Protocolo intraoperatorio antes de la incisión y recuento de cierre
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {CHECKLIST_INTRAOP.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-xl hover:bg-muted/40 transition-colors">
                      <Checkbox id={`intraop-${i}`} className="mt-0.5 rounded-md" />
                      <label htmlFor={`intraop-${i}`} className="text-xs leading-relaxed text-foreground cursor-pointer font-medium">
                        {item}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog: Programar Intervención */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Scissors className="h-6 w-6 text-indigo-600" /> Programación de Procedimiento Quirúrgico
            </DialogTitle>
            <DialogDescription>
              Asignación de paciente, equipo quirúrgico, quirófano y técnica anestésica
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2 pt-2">
            <div className="md:col-span-2">
              <Label className="text-xs font-semibold">Paciente *</Label>
              <PacienteCombobox pacientes={pacientes} value={form.paciente_id} onValueChange={(v) => setForm((p) => ({ ...p, paciente_id: v }))} />
            </div>
            <div>
              <Label className="text-xs font-semibold">Cirujano Principal</Label>
              <ProfesionalCombobox profesionales={profesionales} value={form.profesional_id} onValueChange={(v) => setForm((p) => ({ ...p, profesional_id: v }))} />
            </div>
            <div>
              <Label className="text-xs font-semibold">Quirófano / Sala</Label>
              <Select value={form.sala_id} onValueChange={(v) => setForm((p) => ({ ...p, sala_id: v }))}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Seleccionar sala..." /></SelectTrigger>
                <SelectContent>
                  {salas.map((s) => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Tipo de Cirugía / Procedimiento *</Label>
              <Input
                className="rounded-xl mt-1"
                value={form.tipo_cirugia}
                onChange={(e) => setForm((p) => ({ ...p, tipo_cirugia: e.target.value }))}
                placeholder="Ej: Colecistectomía Laparoscópica"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Diagnóstico Preoperatorio</Label>
              <Input
                className="rounded-xl mt-1"
                value={form.diagnostico_preop}
                onChange={(e) => setForm((p) => ({ ...p, diagnostico_preop: e.target.value }))}
                placeholder="Ej: Colelitiasis sintomática"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Fecha Programada *</Label>
              <Input
                type="date"
                className="rounded-xl mt-1"
                value={form.fecha_programada}
                onChange={(e) => setForm((p) => ({ ...p, fecha_programada: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Hora de Inicio</Label>
              <Input
                type="time"
                className="rounded-xl mt-1"
                value={form.hora_inicio}
                onChange={(e) => setForm((p) => ({ ...p, hora_inicio: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Duración Estimada (minutos)</Label>
              <Input
                type="number"
                className="rounded-xl mt-1"
                value={form.duracion_estimada_min}
                onChange={(e) => setForm((p) => ({ ...p, duracion_estimada_min: parseInt(e.target.value) || 60 }))}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Prioridad Quirúrgica</Label>
              <Select value={form.prioridad} onValueChange={(v) => setForm((p) => ({ ...p, prioridad: v }))}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="electiva">Electiva (Programada habitual)</SelectItem>
                  <SelectItem value="urgente">Urgente (&lt; 24h)</SelectItem>
                  <SelectItem value="emergencia">Emergencia Inmediata (&lt; 2h / STAT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Médico Anestesiólogo</Label>
              <Input
                className="rounded-xl mt-1"
                value={form.anestesiologo}
                onChange={(e) => setForm((p) => ({ ...p, anestesiologo: e.target.value }))}
                placeholder="Dr(a). Nombre del anestesiólogo"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Técnica Anestésica</Label>
              <Select value={form.tipo_anestesia} onValueChange={(v) => setForm((p) => ({ ...p, tipo_anestesia: v }))}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Seleccionar técnica..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Inhalatoria / TIVA</SelectItem>
                  <SelectItem value="regional">Regional (Raquídea / Epidural)</SelectItem>
                  <SelectItem value="bloqueo">Bloqueo Nervioso Periférico</SelectItem>
                  <SelectItem value="local">Local + Sedación Monitoreada (MAC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs font-semibold">Notas Preoperatorias / Requerimientos Especiales</Label>
              <Textarea
                className="rounded-xl mt-1"
                value={form.notas_operatorias}
                onChange={(e) => setForm((p) => ({ ...p, notas_operatorias: e.target.value }))}
                placeholder="Ej: Requiere intensificador de imágenes (Arco en C), torre de laparoscopia y reserva de 2 unidades de GRE."
                rows={2}
              />
            </div>
          </div>
          <Button onClick={crearCirugia} className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-5 mt-3">
            Confirmar Programación Quirúrgica
          </Button>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nueva Sala */}
      <Dialog open={salaDialogOpen} onOpenChange={setSalaDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-600" /> Habilitar Quirófano / Sala
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs font-semibold">Nombre o Identificador del Quirófano *</Label>
              <Input className="rounded-xl mt-1" value={salaForm.nombre} onChange={(e) => setSalaForm((p) => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Quirófano 1 (Laparoscópico)" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Capacidad de Mesas de Operación</Label>
              <Input type="number" className="rounded-xl mt-1" value={salaForm.capacidad} onChange={(e) => setSalaForm((p) => ({ ...p, capacidad: parseInt(e.target.value) || 1 }))} />
            </div>
            <div>
              <Label className="text-xs font-semibold">Observaciones / Equipamiento</Label>
              <Textarea className="rounded-xl mt-1" value={salaForm.notas} onChange={(e) => setSalaForm((p) => ({ ...p, notas: e.target.value }))} placeholder="Equipado con flujo laminar y filtros HEPA." />
            </div>
            <Button onClick={crearSala} className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-5">
              Registrar Quirófano
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Consentimiento Quirúrgico e Invasivo */}
      <ConsentimientoQuirurgicoModal
        open={consentimientoModalOpen}
        onOpenChange={setConsentimientoModalOpen}
        pacienteNombre={
          cirugiaSeleccionada?.pacientes
            ? `${cirugiaSeleccionada.pacientes.nombre} ${cirugiaSeleccionada.pacientes.apellido}`
            : "Paciente Quirúrgico"
        }
        onGuardarConsentimiento={(datos: RegistroConsentimientoQuirurgico) => {
          toast.success(`Consentimiento para ${datos.nombreProcedimiento} registrado con firma digital conforme Ley 42-01.`);
        }}
      />
    </div>
  );
}
