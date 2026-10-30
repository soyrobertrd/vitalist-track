import { useEffect, useState } from "react";
import { db } from "@/integrations/db/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useVerticalFilter } from "@/hooks/useVerticalFilter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  CalendarRange,
  Plus,
  Settings,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  Sparkles,
  CalendarCheck,
  Stethoscope,
} from "lucide-react";
import { format } from "date-fns";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";
import { StatusBadge } from "@/components/common/StatusBadge";

const TIPOS_AREA = [
  "consulta",
  "laboratorio",
  "imagenologia",
  "quirofano",
  "rehabilitacion",
  "odontologia",
  "vision",
  "estetica",
  "vacunacion",
  "procedimiento",
  "telemedicina",
  "recovery",
  "enfermeria",
];

export default function AgendaUniversal() {
  const { currentWorkspace } = useWorkspace();
  const { verticalActiva, verticalParaInsert } = useVerticalFilter();
  const [tab, setTab] = useState("citas");

  // Estados globales de citas y áreas
  const [items, setItems] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [openCita, setOpenCita] = useState(false);
  const [filterArea, setFilterArea] = useState<string>("all");
  const [formCita, setFormCita] = useState<any>({ prioridad: "normal" });

  useEffect(() => {
    if (currentWorkspace) {
      loadCitas();
      loadCombos();
    }
  }, [currentWorkspace, filterArea, verticalActiva]);

  async function loadCitas() {
    let q: any = (db.from("citas_universales" as any) as any)
      .select("*, pacientes(nombre,apellido), personal_salud(nombre,apellido), areas_servicio(nombre,tipo,color)")
      .eq("workspace_id", currentWorkspace!.id)
      .order("fecha_inicio", { ascending: true })
      .limit(100);
    if (filterArea !== "all") q = q.eq("area_id", filterArea);
    if (verticalActiva && verticalActiva !== "todas") q = q.eq("vertical", verticalActiva);
    const { data } = await q;
    setItems(data ?? []);
  }

  async function loadCombos() {
    let pq: any = (db.from("pacientes") as any)
      .select("id,nombre,apellido")
      .eq("workspace_id", currentWorkspace!.id)
      .eq("status_px", "activo");
    let prq: any = (db.from("personal_salud") as any)
      .select("id,nombre,apellido")
      .eq("workspace_id", currentWorkspace!.id);

    if (verticalActiva && verticalActiva !== "todas") {
      pq = pq.eq("vertical", verticalActiva);
      prq = prq.eq("vertical", verticalActiva);
    }

    const [a, p, pr] = await Promise.all([
      (db.from("areas_servicio" as any) as any)
        .select("id,nombre,tipo,duracion_default_min,color,codigo,activo,capacidad_simultanea")
        .eq("workspace_id", currentWorkspace!.id)
        .order("nombre"),
      pq.limit(500),
      prq,
    ]);
    setAreas(a.data ?? []);
    setPacientes(p.data ?? []);
    setProfesionales(pr.data ?? []);
  }

  async function saveCita() {
    if (!formCita.area_id || !formCita.paciente_id || !formCita.fecha_inicio) {
      toast.error("Por favor completa el área, paciente y fecha/hora");
      return;
    }
    const area = areas.find(a => a.id === formCita.area_id);
    const inicio = new Date(formCita.fecha_inicio);
    const fin = new Date(inicio.getTime() + (area?.duracion_default_min ?? 30) * 60000);
    const { error } = await (db.from("citas_universales" as any) as any).insert({
      workspace_id: currentWorkspace!.id,
      vertical: verticalParaInsert,
      area_id: formCita.area_id,
      paciente_id: formCita.paciente_id,
      profesional_id: formCita.profesional_id || null,
      fecha_inicio: inicio.toISOString(),
      fecha_fin: fin.toISOString(),
      motivo: formCita.motivo,
      notas: formCita.notas,
      prioridad: formCita.prioridad,
      origen: "manual",
    });
    if (error) return toast.error(error.message);
    toast.success("Cita agendada correctamente");
    setOpenCita(false);
    setFormCita({ prioridad: "normal" });
    loadCitas();
  }

  async function cambiarEstado(id: string, estado: string) {
    await (db.from("citas_universales" as any) as any).update({ estado }).eq("id", id);
    toast.success(`Cita actualizada a ${estado}`);
    loadCitas();
  }

  // KPIs
  const totalCitas = items.length;
  const citasPendientes = items.filter(i => i.estado === "pendiente" || i.estado === "agendada").length;
  const citasConfirmadas = items.filter(i => ["confirmada", "en_curso", "en_sala"].includes(i.estado)).length;
  const totalAreasActivas = areas.filter(a => a.activo !== false).length;

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="Agendamiento Universal Clínico"
        subtitle="Control unificado de turnos, salas de procedimientos, consultas especializadas y telemedicina"
        icon={CalendarRange}
        badge="Multi-Recurso Activo"
        action={
          <div className="flex items-center gap-2">
            <Dialog open={openCita} onOpenChange={setOpenCita}>
              <DialogTrigger asChild>
                <Button className="rounded-xl shadow-none">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Cita
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg rounded-2xl border-border/80">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-primary" />
                    <span>Agendar Nueva Cita</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <div>
                    <Label className="text-xs font-semibold">Área de Servicio *</Label>
                    <Select
                      value={formCita.area_id ?? ""}
                      onValueChange={v => setFormCita({ ...formCita, area_id: v })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Seleccionar área clínica..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {areas
                          .filter(a => a.activo !== false)
                          .map((a: any) => (
                            <SelectItem key={a.id} value={a.id}>
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color || "#3b82f6" }} />
                                <span>{a.nombre}</span>
                                <span className="text-xs text-muted-foreground">({a.tipo})</span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Paciente *</Label>
                    <Select
                      value={formCita.paciente_id ?? ""}
                      onValueChange={v => setFormCita({ ...formCita, paciente_id: v })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Seleccionar paciente..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-56">
                        {pacientes.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nombre} {p.apellido}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Especialista / Médico</Label>
                    <Select
                      value={formCita.profesional_id ?? ""}
                      onValueChange={v => setFormCita({ ...formCita, profesional_id: v })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="(Opcional - Cualquier médico disponible)" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-56">
                        {profesionales.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            Dr(a). {p.nombre} {p.apellido}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold">Fecha y Hora *</Label>
                      <Input
                        type="datetime-local"
                        className="rounded-xl"
                        value={formCita.fecha_inicio ?? ""}
                        onChange={e => setFormCita({ ...formCita, fecha_inicio: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Prioridad</Label>
                      <Select
                        value={formCita.prioridad}
                        onValueChange={v => setFormCita({ ...formCita, prioridad: v })}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="baja">Baja</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Motivo de Consulta</Label>
                    <Input
                      className="rounded-xl"
                      placeholder="Ej: Evaluación posoperatoria, rutina, dolor"
                      value={formCita.motivo ?? ""}
                      onChange={e => setFormCita({ ...formCita, motivo: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Instrucciones o Notas</Label>
                    <Textarea
                      className="rounded-xl resize-none"
                      rows={2}
                      placeholder="Requisitos de preparación, antecedentes..."
                      value={formCita.notas ?? ""}
                      onChange={e => setFormCita({ ...formCita, notas: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter className="pt-2">
                  <Button onClick={saveCita} className="w-full rounded-xl shadow-none">
                    Confirmar y Agendar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Citas Programadas"
          value={totalCitas}
          subtitle="Total en agenda universal"
          icon={CalendarRange}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Por Atender"
          value={citasPendientes}
          subtitle={citasPendientes > 0 ? "Pendientes de admisión/check-in" : "Al día"}
          icon={Clock}
          variant="amber"
          alert={citasPendientes > 0}
        />
        <ClinicalKpiCard
          title="Confirmadas / En Sala"
          value={citasConfirmadas}
          subtitle="Pacientes listos para atención"
          icon={Activity}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Áreas de Servicio"
          value={totalAreasActivas}
          subtitle="Consultorios, salas y boxes activos"
          icon={Layers}
          variant="emerald"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="w-full sm:w-auto flex justify-start gap-1 p-1.5 bg-muted/40 rounded-2xl border border-border/70 h-auto">
            <TabsTrigger value="citas" className="rounded-xl text-xs font-semibold px-4 py-2 gap-2">
              <CalendarCheck className="h-4 w-4" />
              Citas y Turnos
            </TabsTrigger>
            <TabsTrigger value="areas" className="rounded-xl text-xs font-semibold px-4 py-2 gap-2">
              <Settings className="h-4 w-4" />
              Configuración de Áreas ({areas.length})
            </TabsTrigger>
          </TabsList>

          {tab === "citas" && (
            <div className="w-full sm:w-auto flex items-center gap-2">
              <Select value={filterArea} onValueChange={setFilterArea}>
                <SelectTrigger className="w-full sm:w-64 rounded-xl border-border/80">
                  <SelectValue placeholder="Filtrar por área..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Todas las áreas clínicas</SelectItem>
                  {areas.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color || "#3b82f6" }} />
                        <span>{a.nombre}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* TAB CITAS */}
        <TabsContent value="citas" className="space-y-3 mt-2">
          {items.length === 0 ? (
            <Card className="rounded-2xl border-border/80 shadow-none">
              <CardContent className="py-12 text-center text-muted-foreground space-y-2">
                <CalendarRange className="h-8 w-8 mx-auto text-muted-foreground/60" />
                <p className="font-semibold text-foreground">No hay citas registradas en este período</p>
                <p className="text-xs">Usa el botón "+ Nueva Cita" para programar la primera cita médica o de procedimiento.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {items.map(i => (
                <Card
                  key={i.id}
                  className="rounded-2xl border-border/80 shadow-none hover:border-primary/40 transition-all overflow-hidden bg-card"
                >
                  <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3.5 min-w-[240px]">
                      {/* Barra de color de área */}
                      <div
                        className="w-1.5 h-12 rounded-full shrink-0"
                        style={{ backgroundColor: i.areas_servicio?.color || "#3b82f6" }}
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-foreground">
                            {i.pacientes?.nombre} {i.pacientes?.apellido}
                          </p>
                          {i.prioridad === "urgente" && (
                            <Badge variant="destructive" className="rounded-full text-[10px] px-2 py-0 uppercase">
                              Urgente
                            </Badge>
                          )}
                          {i.prioridad === "alta" && (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-full text-[10px] px-2 py-0 border-0">
                              Alta
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                          <span
                            className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md text-[11px]"
                            style={{
                              backgroundColor: `${i.areas_servicio?.color || "#3b82f6"}15`,
                              color: i.areas_servicio?.color || "#3b82f6",
                            }}
                          >
                            {i.areas_servicio?.nombre || "Consulta"}
                          </span>
                          <span className="font-mono text-foreground font-medium flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(i.fecha_inicio), "dd/MM/yyyy — HH:mm")}
                          </span>
                          {i.personal_salud && (
                            <span className="flex items-center gap-1">
                              <Stethoscope className="h-3 w-3 text-muted-foreground" />
                              Dr(a). {i.personal_salud.nombre} {i.personal_salud.apellido}
                            </span>
                          )}
                        </div>
                        {i.motivo && (
                          <p className="text-xs text-muted-foreground pt-0.5 italic">
                            Motivo: {i.motivo}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={i.estado} />
                      {i.estado === "pendiente" && (
                        <Button
                          size="sm"
                          className="rounded-xl h-8 text-xs font-semibold shadow-none bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => cambiarEstado(i.id, "confirmada")}
                        >
                          Confirmar
                        </Button>
                      )}
                      {i.estado === "confirmada" && (
                        <Button
                          size="sm"
                          className="rounded-xl h-8 text-xs font-semibold shadow-none bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => cambiarEstado(i.id, "completada")}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Completar
                        </Button>
                      )}
                      {!["completada", "cancelada"].includes(i.estado) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-xl h-8 text-xs font-semibold text-muted-foreground hover:text-destructive"
                          onClick={() => cambiarEstado(i.id, "cancelada")}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB AREAS */}
        <TabsContent value="areas" className="mt-2">
          <AreasTab areas={areas} onRefresh={loadCombos} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AreasTab({ areas, onRefresh }: { areas: any[]; onRefresh: () => void }) {
  const { currentWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    tipo: "consulta",
    duracion: 30,
    color: "#3b82f6",
    capacidad: 1,
  });

  async function save() {
    if (!form.nombre || !form.codigo) {
      toast.error("El nombre y código de área son obligatorios");
      return;
    }
    const { error } = await (db.from("areas_servicio" as any) as any).insert({
      workspace_id: currentWorkspace!.id,
      nombre: form.nombre,
      codigo: form.codigo.toUpperCase(),
      tipo: form.tipo,
      duracion_default_min: parseInt(form.duracion || 30),
      color: form.color,
      requiere_ayuno: !!form.ayuno,
      requiere_preparacion: form.preparacion,
      capacidad_simultanea: parseInt(form.capacidad || 1),
    });
    if (error) return toast.error(error.message);
    toast.success("Área de servicio creada");
    setOpen(false);
    setForm({ tipo: "consulta", duracion: 30, color: "#3b82f6", capacidad: 1 });
    onRefresh();
  }

  async function toggle(id: string, activo: boolean) {
    await (db.from("areas_servicio" as any) as any).update({ activo: !activo }).eq("id", id);
    toast.success(`Área ${!activo ? "activada" : "desactivada"}`);
    onRefresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-none">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Área Clínica
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl border-border/80">
            <DialogHeader>
              <DialogTitle>Nueva Área o Sala de Servicio</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Nombre *</Label>
                  <Input
                    className="rounded-xl"
                    placeholder="Ej: Quirófano 1"
                    value={form.nombre ?? ""}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Código *</Label>
                  <Input
                    className="rounded-xl font-mono"
                    placeholder="Q1"
                    value={form.codigo ?? ""}
                    onChange={e => setForm({ ...form, codigo: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold">Tipo de Recurso</Label>
                <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-56">
                    {TIPOS_AREA.map(t => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Duración (min)</Label>
                  <Input
                    type="number"
                    className="rounded-xl font-mono"
                    value={form.duracion}
                    onChange={e => setForm({ ...form, duracion: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Capacidad</Label>
                  <Input
                    type="number"
                    className="rounded-xl font-mono"
                    value={form.capacidad ?? "1"}
                    onChange={e => setForm({ ...form, capacidad: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Color</Label>
                  <Input
                    type="color"
                    className="rounded-xl h-10 p-1 cursor-pointer"
                    value={form.color}
                    onChange={e => setForm({ ...form, color: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ayuno"
                  className="rounded border-border text-primary focus:ring-0"
                  checked={!!form.ayuno}
                  onChange={e => setForm({ ...form, ayuno: e.target.checked })}
                />
                <label htmlFor="ayuno" className="text-xs text-foreground cursor-pointer font-medium">
                  Requiere ayuno previo
                </label>
              </div>
              <div>
                <Label className="text-xs font-semibold">Instrucciones de Preparación</Label>
                <Textarea
                  className="rounded-xl resize-none"
                  rows={2}
                  placeholder="Ej: Presentar estudios radiológicos previos..."
                  value={form.preparacion ?? ""}
                  onChange={e => setForm({ ...form, preparacion: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button onClick={save} className="w-full rounded-xl shadow-none">
                Guardar Área de Servicio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {areas.map(i => (
          <Card
            key={i.id}
            className="rounded-2xl border-border/80 shadow-none hover:border-primary/40 transition-all bg-card"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-12 rounded-xl shrink-0"
                  style={{ backgroundColor: i.color || "#3b82f6" }}
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-foreground">{i.nombre}</p>
                    <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                      {i.codigo}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {i.tipo} • {i.duracion_default_min} min • Capacidad: {i.capacidad_simultanea || 1}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant={i.activo !== false ? "outline" : "secondary"}
                className="rounded-xl text-xs font-semibold h-8"
                onClick={() => toggle(i.id, i.activo !== false)}
              >
                {i.activo !== false ? "Activa" : "Inactiva"}
              </Button>
            </CardContent>
          </Card>
        ))}
        {areas.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8 col-span-2">
            No hay áreas de servicio configuradas. Crea la primera área para comenzar a agendar.
          </p>
        )}
      </div>
    </div>
  );
}
