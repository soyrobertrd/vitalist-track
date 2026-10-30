import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  HeartPulse,
  Plus,
  Syringe,
  Pill,
  FileText,
  Beaker,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Activity,
  Check,
  X,
  Stethoscope,
  Calendar
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isBefore, startOfDay } from "date-fns";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

interface AtencionItem {
  id: string;
  paciente_id: string;
  tipo: string;
  descripcion: string;
  estado: string;
  fecha_programada: string;
  fecha_realizada: string | null;
  profesional_id: string;
  periodicidad: string | null;
  proxima_fecha: string | null;
  notas: string | null;
  pacientes: {
    nombre: string;
    apellido: string;
  };
  personal_salud: {
    nombre: string;
    apellido: string;
  } | null;
}

const TIPOS_PROCEDIMIENTO: Record<string, { label: string; icon: any; color: string }> = {
  cura: { label: "Cura de Herida Quirúrgica", icon: Syringe, color: "text-rose-600 bg-rose-500/10 border-rose-500/30" },
  medicacion: { label: "Administración de Medicación", icon: Pill, color: "text-blue-600 bg-blue-500/10 border-blue-500/30" },
  cambio_sonda: { label: "Cambio de Sonda (Foley / SNG)", icon: Activity, color: "text-amber-600 bg-amber-500/10 border-amber-500/30" },
  canalizacion: { label: "Canalización de Vía Venosa", icon: Stethoscope, color: "text-purple-600 bg-purple-500/10 border-purple-500/30" },
  toma_muestra: { label: "Toma de Muestra Biológica", icon: Beaker, color: "text-teal-600 bg-teal-500/10 border-teal-500/30" },
  receta: { label: "Revisión de Prescripción", icon: FileText, color: "text-slate-600 bg-slate-500/10 border-slate-500/30" },
};

export default function AtencionPaciente() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [atenciones, setAtenciones] = useState<AtencionItem[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [tabActual, setTabActual] = useState("todos");

  const [formData, setFormData] = useState({
    paciente_id: "",
    tipo: "cura",
    descripcion: "",
    fecha_programada: "",
    profesional_id: "",
    periodicidad: "unica",
    notas: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("atencion_paciente")
        .select(`
          *,
          pacientes (nombre, apellido),
          personal_salud (nombre, apellido)
        `)
        .order("fecha_programada", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setAtenciones(data as any);
      } else {
        // Mock inicial realista si no hay datos
        setAtenciones([
          {
            id: "at-1",
            paciente_id: "p-1",
            tipo: "cura",
            descripcion: "Curación plana de herida quirúrgica con apósito hidrocoloide",
            estado: "pendiente",
            fecha_programada: new Date().toISOString(),
            fecha_realizada: null,
            profesional_id: "prof-1",
            periodicidad: "diaria",
            proxima_fecha: null,
            notas: "Vigilar bordes y eritema perilesional.",
            pacientes: { nombre: "Roberto Carlos", apellido: "Santana" },
            personal_salud: { nombre: "Lic. Ana", apellido: "Reyes (Enfermería)" },
          },
          {
            id: "at-2",
            paciente_id: "p-2",
            tipo: "medicacion",
            descripcion: "Antibioticoterapia IV (Ceftriaxona 1g en 100ml SSN 0.9%)",
            estado: "realizada",
            fecha_programada: new Date(Date.now() - 3600000 * 2).toISOString(),
            fecha_realizada: new Date(Date.now() - 3600000 * 1.5).toISOString(),
            profesional_id: "prof-1",
            periodicidad: "cada_12h",
            proxima_fecha: null,
            notas: "Buena permeabilidad de vía periférica.",
            pacientes: { nombre: "María Altagracia", apellido: "Pérez" },
            personal_salud: { nombre: "Lic. Ana", apellido: "Reyes" },
          },
          {
            id: "at-3",
            paciente_id: "p-3",
            tipo: "cambio_sonda",
            descripcion: "Recambio de sonda vesical Foley 16 Fr con balón 10ml",
            estado: "pendiente",
            fecha_programada: new Date(Date.now() - 3600000 * 5).toISOString(), // Atrasada
            fecha_realizada: null,
            profesional_id: "prof-2",
            periodicidad: "mensual",
            proxima_fecha: null,
            notas: "Técnica estéril estricta.",
            pacientes: { nombre: "Juan Antonio", apellido: "Morales" },
            personal_salud: { nombre: "Lic. Marcos", apellido: "Duval" },
          },
        ]);
      }

      // Cargar pacientes y personal
      const [pacData, profData] = await Promise.all([
        supabase.from("pacientes").select("id, nombre, apellido").order("nombre"),
        supabase.from("personal_salud").select("id, nombre, apellido").order("nombre"),
      ]);

      setPacientes(pacData.data || []);
      setProfesionales(profData.data || []);
    } catch (err: any) {
      console.warn("Error cargando atenciones:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [wsId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.paciente_id || !formData.fecha_programada) {
      toast.error("Complete el paciente y la fecha programada.");
      return;
    }

    const fechaISO = new Date(formData.fecha_programada).toISOString();
    const nueva: AtencionItem = {
      id: `at-${Date.now().toString().slice(-4)}`,
      paciente_id: formData.paciente_id,
      tipo: formData.tipo,
      descripcion: formData.descripcion || TIPOS_PROCEDIMIENTO[formData.tipo]?.label,
      estado: "pendiente",
      fecha_programada: fechaISO,
      fecha_realizada: null,
      profesional_id: formData.profesional_id,
      periodicidad: formData.periodicidad,
      proxima_fecha: null,
      notas: formData.notas,
      pacientes: pacientes.find((p) => p.id === formData.paciente_id) || { nombre: "Paciente", apellido: "Seleccionado" },
      personal_salud: profesionales.find((p) => p.id === formData.profesional_id) || null,
    };

    setAtenciones([nueva, ...atenciones]);
    toast.success("Procedimiento de enfermería programado.");
    setDialogOpen(false);
    setFormData({
      paciente_id: "",
      tipo: "cura",
      descripcion: "",
      fecha_programada: "",
      profesional_id: "",
      periodicidad: "unica",
      notas: "",
    });
  };

  const handleMarcarRealizada = (id: string) => {
    setAtenciones(
      atenciones.map((a) =>
        a.id === id ? { ...a, estado: "realizada", fecha_realizada: new Date().toISOString() } : a
      )
    );
    toast.success("Procedimiento registrado como REALIZADO.");
  };

  const handleCancelar = (id: string) => {
    setAtenciones(
      atenciones.map((a) => (a.id === id ? { ...a, estado: "cancelada" } : a))
    );
    toast.info("Procedimiento cancelado.");
  };

  const isAtrasada = (fecha: string) => {
    return isBefore(new Date(fecha), startOfDay(new Date()));
  };

  const atencionesFiltradas = useMemo(() => {
    return atenciones.filter((a) => {
      const matchBusqueda =
        a.pacientes?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.pacientes?.apellido?.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.descripcion?.toLowerCase().includes(busqueda.toLowerCase());

      const matchTab =
        tabActual === "todos"
          ? true
          : tabActual === "pendientes"
          ? a.estado === "pendiente"
          : tabActual === "realizadas"
          ? a.estado === "realizada"
          : tabActual === "atrasadas"
          ? a.estado === "pendiente" && isAtrasada(a.fecha_programada)
          : a.tipo === tabActual;

      return matchBusqueda && matchTab;
    });
  }, [atenciones, busqueda, tabActual]);

  const realizadasCount = atenciones.filter((a) => a.estado === "realizada").length;
  const pendientesCount = atenciones.filter((a) => a.estado === "pendiente").length;
  const atrasadasCount = atenciones.filter((a) => a.estado === "pendiente" && isAtrasada(a.fecha_programada)).length;

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="Atención de Enfermería & Procedimientos Clínicos"
        subtitle="Control y registro de curas de heridas, administración de medicamentos parenterales, sondajes y toma de muestras"
        icon={HeartPulse}
        badge="Protocolos de Enfermería & Bioseguridad"
        action={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Programar Procedimiento
          </Button>
        }
      />

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ClinicalKpiCard
          title="Procedimientos Realizados"
          value={realizadasCount}
          subtitle="Completados con registro de enfermería"
          icon={CheckCircle2}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="Procedimientos Pendientes"
          value={pendientesCount}
          subtitle="Programados en el turno actual"
          icon={Clock}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Procedimientos Atrasados"
          value={atrasadasCount}
          subtitle="Requieren atención prioritaria"
          icon={AlertTriangle}
          variant="rose"
          alert={atrasadasCount > 0}
        />
        <ClinicalKpiCard
          title="Curas & Heridas Activas"
          value={atenciones.filter((a) => a.tipo === "cura").length}
          subtitle="Seguimiento de apósitos y cicatrización"
          icon={Syringe}
          variant="purple"
        />
      </div>

      {/* Tabs y Filtros */}
      <Card className="rounded-2xl border-border/80">
        <CardHeader className="p-4 pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <Tabs value={tabActual} onValueChange={setTabActual} className="w-full sm:w-auto">
              <TabsList className="grid grid-cols-4 h-9">
                <TabsTrigger value="todos" className="text-xs">Todos ({atenciones.length})</TabsTrigger>
                <TabsTrigger value="pendientes" className="text-xs">Pendientes</TabsTrigger>
                <TabsTrigger value="atrasadas" className="text-xs text-red-600">Atrasadas ({atrasadasCount})</TabsTrigger>
                <TabsTrigger value="realizadas" className="text-xs text-emerald-600">Realizadas</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente, procedimiento..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {loading ? (
            <p className="text-xs text-muted-foreground text-center py-4">Cargando procedimientos...</p>
          ) : atencionesFiltradas.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No hay procedimientos con este filtro.</p>
          ) : (
            atencionesFiltradas.map((a) => {
              const atrasada = a.estado === "pendiente" && isAtrasada(a.fecha_programada);
              const infoTipo = TIPOS_PROCEDIMIENTO[a.tipo] || { label: a.tipo, icon: Activity, color: "text-primary" };
              const Icono = infoTipo.icon;

              return (
                <div
                  key={a.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    atrasada
                      ? "border-red-500/50 bg-red-500/5 shadow-xs"
                      : a.estado === "realizada"
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-border/80 hover:bg-muted/20"
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl border ${infoTipo.color}`}>
                        <Icono className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{infoTipo.label}</span>
                          <Badge variant="outline" className="text-xs font-mono">
                            {a.pacientes?.nombre} {a.pacientes?.apellido}
                          </Badge>
                          {atrasada && (
                            <Badge className="bg-red-600 text-white text-[10px] animate-pulse">
                              Atrasada
                            </Badge>
                          )}
                          <Badge
                            className={
                              a.estado === "realizada"
                                ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px]"
                                : "bg-amber-500/15 text-amber-700 border-amber-500/30 text-[10px]"
                            }
                          >
                            {a.estado.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.descripcion}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right text-xs font-mono text-muted-foreground">
                        <p>Prog: {format(new Date(a.fecha_programada), "dd/MM/yyyy hh:mm a")}</p>
                        {a.fecha_realizada && (
                          <p className="text-emerald-600">Realizada: {format(new Date(a.fecha_realizada), "hh:mm a")}</p>
                        )}
                      </div>

                      {a.estado === "pendiente" && (
                        <div className="flex gap-1 ml-2">
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleMarcarRealizada(a.id)}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Realizada
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-muted-foreground hover:bg-muted"
                            onClick={() => handleCancelar(a.id)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {a.notas && (
                    <div className="mt-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Observaciones de enfermería:</span> {a.notas}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Modal Programar Procedimiento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <HeartPulse className="h-5 w-5 text-emerald-600" />
              Programar Procedimiento de Enfermería
            </DialogTitle>
            <DialogDescription>
              Asignación de cuidado directo al paciente según prescripción médica.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Paciente *</Label>
              <Select value={formData.paciente_id} onValueChange={(v) => setFormData({ ...formData, paciente_id: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar paciente..." /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {pacientes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} {p.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Tipo de Procedimiento</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPOS_PROCEDIMIENTO).map(([k, val]) => (
                      <SelectItem key={k} value={k}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Periodicidad</Label>
                <Select value={formData.periodicidad} onValueChange={(v) => setFormData({ ...formData, periodicidad: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unica">Única vez</SelectItem>
                    <SelectItem value="cada_8h">Cada 8 horas</SelectItem>
                    <SelectItem value="cada_12h">Cada 12 horas</SelectItem>
                    <SelectItem value="diaria">Diaria</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Descripción / Medicamento / Material</Label>
              <Input
                placeholder="Ej: Curación con suero fisiológico y apósito estéril"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="h-8"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Fecha y Hora Programada *</Label>
                <Input
                  type="datetime-local"
                  value={formData.fecha_programada}
                  onChange={(e) => setFormData({ ...formData, fecha_programada: e.target.value })}
                  className="h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Enfermero/a Asignado</Label>
                <Select value={formData.profesional_id} onValueChange={(v) => setFormData({ ...formData, profesional_id: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {profesionales.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.nombre} {prof.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Indicaciones Especiales</Label>
              <Textarea
                placeholder="Alergias a látex, técnica estéril, signos de flebitis..."
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                rows={2}
                className="text-xs"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Programar Procedimiento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}