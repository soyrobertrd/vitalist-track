import { useEffect, useState } from "react";
import { db } from "@/integrations/db/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Clock, User, Filter, TrendingUp, Activity, CheckSquare, Phone, Wand2 } from "lucide-react";
import { differenceInDays, getDay } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { VisitaDetailDialog } from "@/components/VisitaDetailDialog";
import { ImportVisitasDialog } from "@/components/ImportVisitasDialog";
import { useUserRole } from "@/hooks/useUserRole";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NearbyPatientsRecommendation } from "@/components/NearbyPatientsRecommendation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CalendarOff } from "lucide-react";
import { MobileFilters } from "@/components/MobileFilters";
import { useDiasLaborables } from "@/hooks/useDiasLaborables";
import { PacienteCombobox } from "@/components/PacienteCombobox";
import { PacientesSinCitasDialog } from "@/components/PacientesSinCitasDialog";
import { VisitaCardAgendada } from "@/components/VisitaCardAgendada";
import { useMedicamentosPaciente } from "@/hooks/useMedicamentosPaciente";
import { MuestraMedicaDialog } from "@/components/MuestraMedicaDialog";
import { AlertaSobrecargaProfesional } from "@/components/AlertaSobrecargaProfesional";
import { ExportButton } from "@/components/ExportButton";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { BulkActionsToolbar, VISITA_BULK_ACTIONS, BulkActionType } from "@/components/BulkActionsToolbar";
import { AutoAssignDialog } from "@/components/AutoAssignDialog";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useActiveSucursal } from "@/contexts/ActiveSucursalContext";
import { useSucursales } from "@/hooks/useSucursales";
import { SucursalSelect } from "@/components/SucursalSelect";
import { VideoConsultaFields } from "@/components/VideoConsultaFields";
import { ProgramarVisitaDialog } from "@/components/visitas/ProgramarVisitaDialog";
import { RegistrarVisitaNoAgendadaDialog } from "@/components/visitas/RegistrarVisitaNoAgendadaDialog";
import { AgendaMobileLista } from "@/components/visitas/AgendaMobileLista";
import { ModoBrigadaCampo } from "@/components/visitas/ModoBrigadaCampo";
import { Briefcase } from "lucide-react";
import type { VideoProveedor } from "@/lib/videoLinks";

import type { Paciente, Personal } from "@/types/db";
import { DEMO_MODE, DEMO_CITAS, DEMO_PACIENTES, DEMO_DOCTORES } from "@/lib/mock-live-seed";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";

interface Visita {
  id: string;
  fecha_hora_visita: string;
  tipo_visita: string;
  motivo_visita: string | null;
  estado: string;
  notas_visita: string | null;
  pacientes: { nombre: string; apellido: string } | null;
  personal_salud: { nombre: string; apellido: string } | null;
}

const Visitas = () => {
  const { currentWorkspace } = useWorkspace();
  const { activeSucursalId } = useActiveSucursal();
  const { sucursales } = useSucursales();
  const [sucursalId, setSucursalId] = useState<string | null>(null);
  const [sucursalIdUnscheduled, setSucursalIdUnscheduled] = useState<string | null>(null);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [open, setOpen] = useState(false);
  const [unscheduledOpen, setUnscheduledOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedVisita, setSelectedVisita] = useState<Visita | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { isAdmin } = useUserRole();
  const [filters, setFilters] = useState({
    estado: "all",
    profesional: "all",
    tipo: "all",
  });
  const [stats, setStats] = useState({
    totalVisitas: 0,
    pendientes: 0,
    realizadas: 0,
    canceladas: 0,
  });
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientData, setSelectedPatientData] = useState<any>(null);
  const { esDiaLaborable, siguienteDiaLaborable } = useDiasLaborables();
  const [restriccionesPaciente, setRestriccionesPaciente] = useState<any[]>([]);
  const [pacientesSinVisita, setPacientesSinVisita] = useState<number>(0);
  const [listaPacientesSinVisita, setListaPacientesSinVisita] = useState<any[]>([]);
  const [diasNoVisitaPaciente, setDiasNoVisitaPaciente] = useState<number[]>([]);
  const [muestraMedicaOpen, setMuestraMedicaOpen] = useState(false);
  const [visitaCreada, setVisitaCreada] = useState<any>(null);
  const { medicamentos } = useMedicamentosPaciente(selectedPatientId);
  const [selectionMode, setSelectionMode] = useState(false);
  const [autoAssignOpen, setAutoAssignOpen] = useState(false);
  const [selectedProfesionalId, setSelectedProfesionalId] = useState<string>("");
  const [selectedFechaHora, setSelectedFechaHora] = useState<string>("");
  const [modalidad, setModalidad] = useState<"presencial" | "virtual">("presencial");
  const [videoCfg, setVideoCfg] = useState<{ proveedor: VideoProveedor | null; enlace: string; notas: string }>({
    proveedor: null,
    enlace: "",
    notas: "",
  });

  const fetchData = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const wsId = currentWorkspace?.id;
    let visitasQuery = db
      .from("control_visitas")
      .select(`
        *,
        pacientes!control_visitas_paciente_id_fkey(
          nombre, 
          apellido, 
          contacto_px, 
          contacto_cuidador, 
          whatsapp_px, 
          whatsapp_cuidador, 
          numero_principal
        ),
        personal_salud!control_visitas_profesional_id_fkey(nombre, apellido)
      `)
      .order("fecha_hora_visita", { ascending: false });
    let pacientesQuery = db.from("pacientes").select("*").eq("status_px", "activo");
    let personalQuery = db.from("personal_salud").select("*").eq("activo", true);
    if (wsId) {
      visitasQuery = visitasQuery.eq("workspace_id", wsId);
      pacientesQuery = pacientesQuery.eq("workspace_id", wsId);
      personalQuery = personalQuery.eq("workspace_id", wsId);
    }
    if (activeSucursalId) {
      visitasQuery = visitasQuery.eq("sucursal_id", activeSucursalId);
      pacientesQuery = pacientesQuery.eq("sucursal_id", activeSucursalId);
      personalQuery = personalQuery.eq("sucursal_id", activeSucursalId);
    }
    const [visitasRes, pacientesRes, personalRes] = await Promise.all([
      visitasQuery,
      pacientesQuery,
      personalQuery,
    ]);

    let citasFinales: any[] = [];

    if (visitasRes.data && visitasRes.data.length > 0) {
      // Fetch additional professionals for each visit
      citasFinales = await Promise.all(
        visitasRes.data.map(async (visita: any) => {
          const { data: profesionales } = await db
            .from("visitas_profesionales")
            .select("profesional_id, personal_salud!visitas_profesionales_profesional_id_fkey(nombre, apellido)")
            .eq("visita_id", visita.id);
          
          return {
            ...visita,
            profesionales_adicionales: profesionales || []
          };
        })
      );
    } else if (DEMO_MODE) {
      // Fallback para pruebas en vivo multi-vertical
      const demoCitasFiltradas = DEMO_CITAS.filter((c) => {
        if (wsId && c.workspace_id === wsId) return true;
        return !wsId || wsId.startsWith("ws-");
      });
      citasFinales = demoCitasFiltradas.length > 0 ? demoCitasFiltradas : DEMO_CITAS;
    }

    setVisitas(citasFinales as any);

    // Calculate stats
    const total = citasFinales.length;
    const pendientes = citasFinales.filter((v: any) => v.estado === "pendiente").length;
    const realizadas = citasFinales.filter((v: any) => v.estado === "realizada" || v.estado === "confirmada").length;
    const canceladas = citasFinales.filter((v: any) => v.estado === "cancelada").length;

    setStats({
      totalVisitas: total,
      pendientes,
      realizadas,
      canceladas,
    });

    if (pacientesRes.data && pacientesRes.data.length > 0) {
      setPacientes(pacientesRes.data);
    } else if (DEMO_MODE) {
      const demoPxFiltrados = DEMO_PACIENTES.filter((p) => !wsId || p.workspace_id === wsId);
      setPacientes((demoPxFiltrados.length > 0 ? demoPxFiltrados : DEMO_PACIENTES) as any);
    }

    if (personalRes.data && personalRes.data.length > 0) {
      const filteredPersonal = (personalRes.data || []).filter(
        (p: any) => p.especialidad && !p.especialidad.toLowerCase().includes('admin')
      );
      setPersonal(filteredPersonal);
    } else if (DEMO_MODE) {
      const demoDocFiltrados = DEMO_DOCTORES.filter((d) => !wsId || d.workspace_id === wsId);
      setPersonal((demoDocFiltrados.length > 0 ? demoDocFiltrados : DEMO_DOCTORES) as any);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?.id, activeSucursalId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const pacienteId = formData.get("paciente_id") as string;
    const fechaHoraVisita = formData.get("fecha_hora_visita") as string;
    
    // Validar días de restricción del paciente
    if (fechaHoraVisita && diasNoVisitaPaciente.length > 0) {
      const fechaVisita = new Date(fechaHoraVisita);
      const diaSemana = getDay(fechaVisita); // 0=Dom, 1=Lun, 2=Mar, etc
      // Convertir a nuestro formato (1=Lun, 2=Mar, etc)
      const diaConvertido = diaSemana === 0 ? 7 : diaSemana;
      
      if (diasNoVisitaPaciente.includes(diaConvertido)) {
        const diasNombres = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
        toast.error(
          `Este paciente no tiene disponibilidad los ${diasNombres[diaConvertido]}. Por favor seleccione otro día.`,
          { duration: 5000 }
        );
        setLoading(false);
        return;
      }
    }
    
    // Validar si ya existe una visita pendiente para este paciente
    const { data: existingVisitas } = await db
      .from("control_visitas")
      .select("id, fecha_hora_visita, personal_salud!control_visitas_profesional_id_fkey(nombre, apellido)")
      .eq("paciente_id", pacienteId)
      .eq("estado", "pendiente");

    if (existingVisitas && existingVisitas.length > 0) {
      const visita = existingVisitas[0];
      const profesional = visita.personal_salud;
      const fecha = new Date(visita.fecha_hora_visita).toLocaleString('es-DO', {
        dateStyle: 'long',
        timeStyle: 'short'
      });
      toast.error(
        `Este paciente ya tiene una visita agendada para el ${fecha} con ${profesional?.nombre} ${profesional?.apellido}`,
        { duration: 5000 }
      );
      setLoading(false);
      return;
    }
    
    // Convertir datetime-local (string sin TZ) a ISO con TZ local
    // Esto evita que Postgres lo interprete como UTC y desplace la hora
    const fechaHoraISO = fechaHoraVisita ? new Date(fechaHoraVisita).toISOString() : fechaHoraVisita;

    const data = {
      paciente_id: pacienteId,
      profesional_id: formData.get("profesional_id") as string,
      fecha_hora_visita: fechaHoraISO,
      tipo_visita: formData.get("tipo_visita") as any,
      motivo_visita: formData.get("motivo_visita") as string,
      estado: "pendiente" as any,
      workspace_id: currentWorkspace?.id ?? null,
      sucursal_id: sucursalId ?? sucursales.find(s => s.es_principal)?.id ?? null,
      modalidad,
      video_proveedor: modalidad === "virtual" ? videoCfg.proveedor : null,
      video_enlace: modalidad === "virtual" ? videoCfg.enlace || null : null,
      video_notas: modalidad === "virtual" ? videoCfg.notas || null : null,
    };

    if (modalidad === "virtual" && (!videoCfg.proveedor || !videoCfg.enlace)) {
      toast.error("Para visita virtual debes configurar el enlace de la sala");
      setLoading(false);
      return;
    }

    const { data: visitaData, error } = await db
      .from("control_visitas")
      .insert([data])
      .select()
      .single();

    if (error) {
      toast.error(error.message);
    } else {
      // Insert additional professionals if any
      if (selectedProfessionals.length > 0 && visitaData) {
        const profesionalesData = selectedProfessionals.map(profId => ({
          visita_id: visitaData.id,
          profesional_id: profId
        }));
        
        await db.from("visitas_profesionales").insert(profesionalesData);
      }
      
      toast.success("Visita programada exitosamente");
      setOpen(false);
      setSelectedProfessionals([]);
      setModalidad("presencial");
      setVideoCfg({ proveedor: null, enlace: "", notas: "" });
      
      // Check if patient has medications and show dialog
      if (medicamentos.length > 0 && visitaData) {
        setVisitaCreada(visitaData);
        setMuestraMedicaOpen(true);
      } else {
        setSelectedPatientId(null);
        setSelectedPatientData(null);
        setDiasNoVisitaPaciente([]);
      }
      
      fetchData();
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  };

  const handleMuestraMedicaComplete = () => {
    setSelectedPatientId(null);
    setSelectedPatientData(null);
    setDiasNoVisitaPaciente([]);
    setVisitaCreada(null);
  };

  const handlePatientChange = async (pacienteId: string) => {
    setSelectedPatientId(pacienteId);
    const { data } = await db
      .from("pacientes")
      .select("zona, barrio, dias_no_visita, nombre, apellido")
      .eq("id", pacienteId)
      .single();
    setSelectedPatientData(data);
    setDiasNoVisitaPaciente(data?.dias_no_visita || []);
  };

  const handleUnscheduledSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      paciente_id: formData.get("paciente_id") as string,
      profesional_id: formData.get("profesional_id") as string,
      fecha_hora_visita: new Date().toISOString(),
      tipo_visita: formData.get("tipo_visita") as any,
      motivo_visita: formData.get("motivo_visita") as string,
      estado: "realizada" as any,
      notas_visita: "Visita no agendada - " + (formData.get("razon") as string || ""),
      workspace_id: currentWorkspace?.id ?? null,
      sucursal_id: sucursalIdUnscheduled ?? sucursales.find(s => s.es_principal)?.id ?? null,
    };

    const { error } = await db.from("control_visitas").insert([data]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Visita no agendada registrada exitosamente");
      setUnscheduledOpen(false);
      fetchData();
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "realizada":
        return "bg-success text-success-foreground";
      case "pendiente":
        return "bg-primary text-primary-foreground";
      case "cancelada":
      case "no_realizada":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-warning text-warning-foreground";
    }
  };

  const getTipoIcon = (tipo: string) => {
    return tipo === "domicilio" ? "🏠" : "🏥";
  };

  const filteredVisitas = visitas.filter((v: any) => {
    if (filters.estado !== "all" && v.estado !== filters.estado) return false;
    if (filters.profesional !== "all" && v.profesional_id !== filters.profesional) return false;
    if (filters.tipo !== "all" && v.tipo_visita !== filters.tipo) return false;
    return true;
  });

  // Separate visits into pending (agendadas) and history (historial)
  const visitasAgendadas = filteredVisitas
    .filter((v: any) => v.estado === 'pendiente')
    .sort((a: any, b: any) => new Date(a.fecha_hora_visita).getTime() - new Date(b.fecha_hora_visita).getTime());

  const visitasHistorial = filteredVisitas
    .filter((v: any) => v.estado !== 'pendiente')
    .sort((a: any, b: any) => new Date(b.fecha_hora_visita).getTime() - new Date(a.fecha_hora_visita).getTime());

  // Bulk selection
  const bulkSelection = useBulkSelection(visitasAgendadas);

  const handleBulkAction = async (action: BulkActionType, value?: string) => {
    if (bulkSelection.selectedCount === 0) return;
    const selectedIds = Array.from(bulkSelection.selectedIds);
    try {
      if (action === "assign_professional" && value) {
        const { error } = await db
          .from("control_visitas")
          .update({ profesional_id: value })
          .in("id", selectedIds);
        if (error) throw error;
        toast.success(`${selectedIds.length} visita(s) reasignadas`);
      } else if (action === "change_status" && value) {
        const { error } = await db
          .from("control_visitas")
          .update({ estado: value as any })
          .in("id", selectedIds);
        if (error) throw error;
        toast.success(`${selectedIds.length} visita(s) actualizadas`);
      }
      bulkSelection.clearSelection();
      setSelectionMode(false);
      fetchData();
    } catch (error) {
      toast.error("Error al ejecutar acción masiva");
    }
  };

  const isVisitOverdue = (visita: Visita) => {
    if (visita.estado === 'pendiente' && visita.fecha_hora_visita) {
      const fechaVisita = new Date(visita.fecha_hora_visita);
      fechaVisita.setHours(0, 0, 0, 0);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      // Si la fecha de hoy es al menos +1 día después de la fecha agendada, está atrasada
      return hoy.getTime() > fechaVisita.getTime();
    }
    return false;
  };

  const isVisitToday = (visita: Visita) => {
    if (visita.estado === 'pendiente' && visita.fecha_hora_visita) {
      const fechaVisita = new Date(visita.fecha_hora_visita);
      fechaVisita.setHours(0, 0, 0, 0);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      return hoy.getTime() === fechaVisita.getTime();
    }
    return false;
  };

  const getCardColor = (fecha: string, estado: string) => {
    if (estado !== "pendiente") return "";
    
    const diff = differenceInDays(new Date(fecha), new Date());
    if (diff < 0) {
      const daysPast = Math.abs(diff);
      if (daysPast >= 4) return "border-red-500 bg-red-50 dark:bg-red-950/20";
      if (daysPast >= 1) return "border-orange-500 bg-orange-50 dark:bg-orange-950/20";
    }
    return "";
  };

  return (
    <div className="space-y-6">
      {/* Header - Citas y Consultas */}
      <ClinicalPageHeader title="Gestión de Citas y Consultas" subtitle="Optimización de agenda, control de asistencia y reducción de inasistencias/cancelaciones (Ambulatorias por defecto y Domiciliarias)." />

      {/* Botones de acción principales */}
      <div className="flex flex-wrap gap-2">
        <RegistrarVisitaNoAgendadaDialog
          open={unscheduledOpen}
          onOpenChange={setUnscheduledOpen}
          pacientes={pacientes}
          personal={personal}
          loading={loading}
          sucursalId={sucursalIdUnscheduled}
          onSucursalChange={setSucursalIdUnscheduled}
          onSubmit={handleUnscheduledSubmit}
        />

        <ProgramarVisitaDialog
          open={open}
          onOpenChange={setOpen}
          pacientes={pacientes}
          personal={personal}
          loading={loading}
          selectedPatientId={selectedPatientId}
          selectedPatientData={selectedPatientData}
          onPatientChange={handlePatientChange}
          diasNoVisitaPaciente={diasNoVisitaPaciente}
          selectedProfesionalId={selectedProfesionalId}
          setSelectedProfesionalId={setSelectedProfesionalId}
          onAutoAssignClick={() => setAutoAssignOpen(true)}
          selectedFechaHora={selectedFechaHora}
          setSelectedFechaHora={setSelectedFechaHora}
          modalidad={modalidad}
          setModalidad={setModalidad}
          videoCfg={videoCfg}
          setVideoCfg={setVideoCfg}
          workspaceSlug={currentWorkspace?.slug ?? null}
          selectedProfessionals={selectedProfessionals}
          setSelectedProfessionals={setSelectedProfessionals}
          sucursalId={sucursalId}
          setSucursalId={setSucursalId}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Alerta de pacientes sin visitas */}
      {/* Alerta de sobrecarga de profesionales */}
      <AlertaSobrecargaProfesional />

      {/* Alerta de pacientes sin visitas */}
      {pacientesSinVisita > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-2">
            Hay {pacientesSinVisita} paciente{pacientesSinVisita > 1 ? 's' : ''} activo{pacientesSinVisita > 1 ? 's' : ''} sin visitas agendadas.
            <PacientesSinCitasDialog 
              pacientes={listaPacientesSinVisita}
              tipo="visitas"
              onAgendar={(pacienteId) => {
                setOpen(true);
              }}
            />
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards - Modo B Plano sin sombras */}
      {/* Stats Cards - Diseño Clínico Moderno */}
      <div className="hidden md:grid gap-4 grid-cols-1 md:grid-cols-4">
        <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Citas</p>
            <p className="text-2xl font-bold tabular-nums text-foreground mt-0.5">{stats.totalVisitas}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Registros en el sistema</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pendientes</p>
            <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">{stats.pendientes}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Por confirmar y atender</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Completadas</p>
            <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.realizadas}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Atenciones exitosas</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">No-Show / Canceladas</p>
            <p className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400 mt-0.5">{stats.canceladas}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Inasistencias registradas</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            <CalendarOff className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Botones secundarios - Debajo de stats, solo desktop */}
      <div className="hidden md:flex gap-2">
        {isAdmin && <ImportVisitasDialog onSuccess={fetchData} />}
        <ExportButton
          data={visitas.map(v => ({
            paciente: `${v.pacientes?.nombre || ''} ${v.pacientes?.apellido || ''}`,
            profesional: `${v.personal_salud?.nombre || ''} ${v.personal_salud?.apellido || ''}`,
            fecha_visita: v.fecha_hora_visita,
            tipo: v.tipo_visita,
            estado: v.estado,
            motivo: v.motivo_visita || '',
            notas: v.notas_visita || ''
          }))}
          filename="visitas"
          title="Reporte de Visitas"
        />
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="mr-2 h-4 w-4" />
          {showFilters ? "Ocultar Filtros" : "Filtros"}
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <GlassCard className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={filters.estado} onValueChange={(value) => setFilters({...filters, estado: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="realizada">Realizada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Profesional</Label>
              <Select value={filters.profesional} onValueChange={(value) => setFilters({...filters, profesional: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {personal.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} {p.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={filters.tipo} onValueChange={(value) => setFilters({...filters, tipo: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ambulatorio">Ambulatorio</SelectItem>
                  <SelectItem value="domicilio">Domicilio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </GlassCard>
      )}


      {/* Vista Mobile-First (<640px) */}
      <AgendaMobileLista
        visitas={visitas}
        onSelectVisita={(v) => {
          setSelectedVisita(v);
          setDetailOpen(true);
        }}
        onOpenNuevaCita={() => setOpen(true)}
        className="block sm:hidden"
      />

      {/* Vista Desktop (>=640px) con Tabs completos */}
      <div className="hidden sm:block">
        <Tabs defaultValue="brigada" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-muted/40 p-1.5 h-auto border border-border/70">
            <TabsTrigger value="brigada" className="rounded-xl font-semibold text-xs py-2 gap-1.5">
              <Briefcase className="h-4 w-4 text-emerald-600" />
              Modo Brigada / En Campo
            </TabsTrigger>
            <TabsTrigger value="agendadas" className="rounded-xl font-semibold text-xs py-2 gap-1.5">
              <Calendar className="h-4 w-4 text-blue-600" />
              Monitor & Agendadas ({visitasAgendadas.length})
            </TabsTrigger>
            <TabsTrigger value="historial" className="rounded-xl font-semibold text-xs py-2 gap-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Historial ({visitasHistorial.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="brigada" className="mt-6">
            <ModoBrigadaCampo
              profesionales={personal}
              profesionalActivoId={selectedProfesionalId || personal[0]?.id || "prof-1"}
              onCambiarProfesional={setSelectedProfesionalId}
            />
          </TabsContent>
        
        <TabsContent value="agendadas" className="mt-6">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visitasAgendadas.map((visita: any) => (
              <VisitaCardAgendada
                key={visita.id}
                visita={visita}
                onVisitaClick={(v) => {
                  setSelectedVisita(v);
                  setDetailOpen(true);
                }}
                isVisitOverdue={isVisitOverdue}
                isVisitToday={isVisitToday}
              />
            ))}
          </div>
          {visitasAgendadas.length === 0 && (
            <div className="text-center py-12 px-4 border rounded-xl border-dashed bg-card/40 space-y-3">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground/60" />
              <div className="space-y-1">
                <p className="font-semibold text-sm">No hay citas programadas en este momento</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Comienza agendando consultas ambulatorias o visitas domiciliarias para optimizar la agenda médica.
                </p>
              </div>
              <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Programar Cita
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="historial" className="mt-6">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visitasHistorial.map((visita: any) => {
              const formatearTexto = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase().replace("_", " ");
              
              return (
                <GlassCard 
                  key={visita.id} 
                  className="p-4 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform"
                  onClick={() => {
                    setSelectedVisita(visita);
                    setDetailOpen(true);
                  }}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg">
                        {visita.pacientes?.nombre} {visita.pacientes?.apellido}
                      </h3>
                      {visita.pacientes && (
                        <a
                          href={`tel:${
                            visita.pacientes.numero_principal === 'cuidador' && visita.pacientes.contacto_cuidador
                              ? visita.pacientes.contacto_cuidador.replace(/\D/g, '')
                              : (visita.pacientes.contacto_px || '').replace(/\D/g, '')
                          }`}
                          onClick={(e) => e.stopPropagation()}
                          className="md:hidden inline-flex items-center justify-center p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                          aria-label="Llamar al paciente"
                          title="Llamar"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        {new Date(visita.fecha_hora_visita).toLocaleDateString('es-DO', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        {new Date(visita.fecha_hora_visita).toLocaleTimeString('es-DO', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                      {visita.personal_salud && (
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          {visita.personal_salud.nombre} {visita.personal_salud.apellido}
                        </div>
                      )}
                      {visita.profesionales_adicionales && visita.profesionales_adicionales.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          +{visita.profesionales_adicionales.length} profesional(es) más
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <Badge className={getEstadoColor(visita.estado)}>
                      {formatearTexto(visita.estado)}
                    </Badge>
                    <span className="text-2xl">{getTipoIcon(visita.tipo_visita)}</span>
                  </div>
                </GlassCard>
              );
            })}
          </div>
          {visitasHistorial.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No hay visitas en el historial
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>

      <VisitaDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        visita={selectedVisita}
        onSuccess={fetchData}
        pacientes={pacientes}
        personal={personal}
      />

      {/* Dialog para muestra médica después de agendar visita */}
      {selectedPatientId && visitaCreada && (
        <MuestraMedicaDialog
          open={muestraMedicaOpen}
          onOpenChange={setMuestraMedicaOpen}
          medicamentos={medicamentos}
          pacienteId={selectedPatientId}
          pacienteNombre={pacientes.find(p => p.id === selectedPatientId)?.nombre + " " + pacientes.find(p => p.id === selectedPatientId)?.apellido || "Paciente"}
          visitaId={visitaCreada?.id ?? null}
          onComplete={handleMuestraMedicaComplete}
        />
      )}

      {/* Dialog de asignación automática */}
      <AutoAssignDialog
        open={autoAssignOpen}
        onOpenChange={setAutoAssignOpen}
        pacienteId={selectedPatientId || ""}
        pacienteNombre={selectedPatientData ? `${selectedPatientData.nombre || ''} ${selectedPatientData.apellido || ''}` : ""}
        pacienteZona={selectedPatientData?.zona || null}
        pacienteBarrio={selectedPatientData?.barrio || null}
        fecha={selectedFechaHora ? new Date(selectedFechaHora) : new Date()}
        onSelect={(profId) => setSelectedProfesionalId(profId)}
      />
    </div>
  );
};

export default Visitas;
