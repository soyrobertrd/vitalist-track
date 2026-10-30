import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/db/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  BedDouble,
  Plus,
  LogOut,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  User,
  HeartPulse,
} from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

interface Admision {
  id: string;
  paciente_id: string;
  tipo: string;
  motivo_ingreso: string;
  diagnostico_ingreso?: string | null;
  estado: string;
  fecha_ingreso: string;
  fecha_alta: string | null;
  cama_id: string | null;
  tipo_alta?: string | null;
  pacientes?: { nombre: string; apellido: string; cedula?: string };
  camas?: { identificador: string; tipo: string };
}

const TIPOS_SERVICIO = [
  { value: "hospitalizacion", label: "Hospitalización General", badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  { value: "emergencia", label: "Emergencia / Triaje", badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  { value: "uci", label: "Cuidados Intensivos (UCI)", badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30" },
  { value: "observacion", label: "Observación Clínica", badgeClass: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30" },
];

export default function Hospitalizacion() {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const [tab, setTab] = useState("activas");
  const [admisiones, setAdmisiones] = useState<Admision[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroServicio, setFiltroServicio] = useState("todos");

  useEffect(() => {
    void load();
  }, [tab]);

  async function load() {
    setLoading(true);
    const q = (db as any)
      .from("admisiones")
      .select("*, pacientes(nombre,apellido,cedula), camas(identificador,tipo)")
      .order("fecha_ingreso", { ascending: false });

    if (tab === "activas") q.eq("estado", "activa");
    if (tab === "historico") q.in("estado", ["alta", "traslado"]);

    const { data, error } = await q;
    if (error) toast.error(error.message);
    setAdmisiones((data as any) ?? []);
    setLoading(false);
  }

  // Filtrado en memoria
  const admisionesFiltradas = useMemo(() => {
    return admisiones.filter((a) => {
      const matchServicio = filtroServicio === "todos" || a.tipo === filtroServicio;
      const term = busqueda.toLowerCase().trim();
      const pacienteNom = `${a.pacientes?.nombre || ""} ${a.pacientes?.apellido || ""}`.toLowerCase();
      const pacienteCed = (a.pacientes?.cedula || "").toLowerCase();
      const motivo = (a.motivo_ingreso || "").toLowerCase();
      const matchTexto = !term || pacienteNom.includes(term) || pacienteCed.includes(term) || motivo.includes(term);
      return matchServicio && matchTexto;
    });
  }, [admisiones, filtroServicio, busqueda]);

  // Métricas
  const kpis = useMemo(() => {
    const activas = admisiones.filter((a) => a.estado === "activa");
    const enUci = activas.filter((a) => a.tipo === "uci").length;
    const prolongadas = activas.filter((a) => {
      const dias = differenceInDays(new Date(), new Date(a.fecha_ingreso));
      return dias >= 7;
    }).length;
    const hoyStr = format(new Date(), "yyyy-MM-dd");
    const altasHoy = admisiones.filter(
      (a) => a.estado === "alta" && a.fecha_alta && a.fecha_alta.startsWith(hoyStr)
    ).length;

    return {
      totalActivas: activas.length,
      enUci,
      prolongadas,
      altasHoy,
    };
  }, [admisiones]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Modo B */}
      <ClinicalPageHeader
        title="Hospitalización & Estancias Clínicas"
        subtitle="Monitoreo de ingresos activos, camas asignadas, alerta de estancia prolongada y altas médicas"
        icon={BedDouble}
        badge="Censo Hospitalario"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/censo-camas")}
              className="rounded-xl border-border/80 text-xs font-semibold"
            >
              <BedDouble className="h-4 w-4 mr-1.5 text-teal-600" />
              Mapa de Camas
            </Button>
            <NuevaAdmisionDialog onCreated={load} />
          </div>
        }
      />

      {/* KPIs Clínicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Pacientes Internados"
          value={kpis.totalActivas}
          subtitle="Camas activamente ocupadas"
          icon={BedDouble}
          variant="teal"
        />
        <ClinicalKpiCard
          title="Pacientes en UCI"
          value={kpis.enUci}
          subtitle="Cuidados Intensivos / Críticos"
          icon={Activity}
          variant="rose"
          alert={kpis.enUci > 0}
        />
        <ClinicalKpiCard
          title="Estancia Prolongada (≥7d)"
          value={kpis.prolongadas}
          subtitle="Pacientes con protocolo extendido"
          icon={Clock}
          variant="amber"
          alert={kpis.prolongadas > 0}
        />
        <ClinicalKpiCard
          title="Altas Registradas Hoy"
          value={kpis.altasHoy}
          subtitle="Egresos y desocupación de camas"
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* Pestañas y Filtros */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="bg-card border border-border/80 rounded-xl p-1">
            <TabsTrigger value="activas" className="rounded-lg gap-2">
              <HeartPulse className="w-4 h-4 text-emerald-600" /> Pacientes Activos ({kpis.totalActivas})
            </TabsTrigger>
            <TabsTrigger value="historico" className="rounded-lg gap-2">
              <Clock className="w-4 h-4" /> Historial de Egresos
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente, cédula o motivo..."
                className="pl-9 rounded-xl h-9 text-xs"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <Select value={filtroServicio} onValueChange={setFiltroServicio}>
              <SelectTrigger className="w-44 rounded-xl h-9 text-xs">
                <SelectValue placeholder="Filtrar servicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los servicios</SelectItem>
                {TIPOS_SERVICIO.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value={tab} className="mt-0">
          {loading ? (
            <Card className="rounded-2xl border-border/80 py-16 text-center text-sm text-muted-foreground">
              Cargando censo hospitalario...
            </Card>
          ) : admisionesFiltradas.length === 0 ? (
            <Card className="rounded-2xl border-border/80 py-16 text-center text-muted-foreground">
              <BedDouble className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="font-medium text-foreground">No se encontraron admisiones</p>
              <p className="text-xs text-muted-foreground mt-1">
                {busqueda || filtroServicio !== "todos"
                  ? "Intenta modificar los filtros de búsqueda o servicio."
                  : tab === "activas"
                  ? "No hay pacientes actualmente ingresados en camas."
                  : "No hay historial previo de altas registrado."}
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {admisionesFiltradas.map((a) => (
                <AdmisionCard key={a.id} a={a} onUpdated={load} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdmisionCard({ a, onUpdated }: { a: Admision; onUpdated: () => void }) {
  const tipoObj = TIPOS_SERVICIO.find((t) => t.value === a.tipo) || TIPOS_SERVICIO[0];
  const diasEstancia = differenceInDays(new Date(), new Date(a.fecha_ingreso));
  const esProlongada = a.estado === "activa" && diasEstancia >= 7;

  return (
    <Card className="rounded-2xl border-border/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              {a.pacientes ? `${a.pacientes.nombre} ${a.pacientes.apellido}` : "Paciente no identificado"}
            </CardTitle>
            {a.pacientes?.cedula && (
              <p className="text-xs text-muted-foreground font-mono">Doc: {a.pacientes.cedula}</p>
            )}
          </div>
          <Badge variant="outline" className={`rounded-lg font-medium text-xs ${tipoObj.badgeClass}`}>
            {tipoObj.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Ingreso:{" "}
              {format(new Date(a.fecha_ingreso), "dd MMM yyyy, HH:mm", { locale: es })}
            </span>
            {a.estado === "activa" && (
              <span
                className={`font-mono px-2 py-0.5 rounded-full text-xs font-semibold ${
                  esProlongada
                    ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                    : diasEstancia >= 3
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                }`}
              >
                {diasEstancia === 0 ? "Hoy" : `${diasEstancia} d internado`}
              </span>
            )}
          </div>

          <div>
            <span className="text-xs font-medium text-muted-foreground">Motivo:</span>
            <p className="text-sm font-medium text-foreground line-clamp-2">{a.motivo_ingreso}</p>
          </div>

          {a.diagnostico_ingreso && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Diagnóstico:</span>
              <p className="text-xs text-muted-foreground line-clamp-2">{a.diagnostico_ingreso}</p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <BedDouble className="w-4 h-4 text-teal-600" />
              {a.camas ? `Cama ${a.camas.identificador} (${a.camas.tipo})` : "Sin cama asignada"}
            </span>

            {a.fecha_alta && (
              <Badge variant="secondary" className="rounded-md text-[11px]">
                Alta: {format(new Date(a.fecha_alta), "dd/MM/yyyy", { locale: es })}
              </Badge>
            )}
          </div>

          {esProlongada && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>Estancia prolongada (≥7 días). Requiere interconsulta o comité médico.</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-border/50">
          {a.tipo === "uci" && <UciNotaDialog admisionId={a.id} pacienteId={a.paciente_id} />}
          {a.estado === "activa" && <DarAltaDialog admisionId={a.id} onDone={onUpdated} />}
        </div>
      </CardContent>
    </Card>
  );
}

function NuevaAdmisionDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ tipo: "hospitalizacion" });
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [camas, setCamas] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      (db as any)
        .from("pacientes")
        .select("id,nombre,apellido,cedula")
        .order("nombre")
        .limit(200)
        .then(({ data }: any) => setPacientes(data ?? []));

      (db as any)
        .from("camas")
        .select("id,identificador,tipo,estado")
        .eq("estado", "disponible")
        .then(({ data }: any) => setCamas(data ?? []));
    }
  }, [open]);

  async function submit() {
    if (!form.paciente_id || !form.motivo_ingreso) {
      return toast.error("Debe seleccionar un paciente e indicar el motivo de ingreso");
    }

    const { error } = await (db as any).from("admisiones").insert({
      paciente_id: form.paciente_id,
      tipo: form.tipo,
      motivo_ingreso: form.motivo_ingreso,
      diagnostico_ingreso: form.diagnostico_ingreso || null,
      cama_id: form.cama_id || null,
    });

    if (error) return toast.error(error.message);

    // Si se asignó cama, actualizar estado a 'ocupada'
    if (form.cama_id) {
      await (db as any).from("camas").update({ estado: "ocupada" }).eq("id", form.cama_id);
    }

    toast.success("Admisión clínica registrada con éxito");
    setForm({ tipo: "hospitalizacion" });
    setOpen(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl shadow-sm gap-2">
          <Plus className="h-4 w-4" /> Nueva Admisión
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BedDouble className="h-5 w-5 text-primary" /> Registrar Admisión Clínica
          </DialogTitle>
          <CardDescription>
            Ingreso formal del paciente en una cama o unidad del centro
          </CardDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-2">
          <div className="space-y-1.5">
            <Label>Paciente *</Label>
            <Select
              value={form.paciente_id ?? ""}
              onValueChange={(v) => setForm({ ...form, paciente_id: v })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Seleccione un paciente" />
              </SelectTrigger>
              <SelectContent>
                {pacientes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre} {p.apellido} {p.cedula ? `(${p.cedula})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Servicio / Destino *</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm({ ...form, tipo: v })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_SERVICIO.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Cama Asignada</Label>
              <Select
                value={form.cama_id ?? "none"}
                onValueChange={(v) => setForm({ ...form, cama_id: v === "none" ? null : v })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Sin cama asignada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cama asignada</SelectItem>
                  {camas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      Cama {c.identificador} ({c.tipo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Motivo de Ingreso *</Label>
            <Input
              placeholder="Ej: Dolor torácico agudo, apendicectomía programada..."
              className="rounded-xl"
              value={form.motivo_ingreso ?? ""}
              onChange={(e) => setForm({ ...form, motivo_ingreso: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Diagnóstico Inicial / Impresión Médica</Label>
            <Textarea
              placeholder="Detalles clínicos o antecedentes relevantes al ingreso..."
              className="rounded-xl resize-none"
              rows={3}
              value={form.diagnostico_ingreso ?? ""}
              onChange={(e) => setForm({ ...form, diagnostico_ingreso: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
            Cancelar
          </Button>
          <Button onClick={submit} className="rounded-xl">
            Confirmar Ingreso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DarAltaDialog({ admisionId, onDone }: { admisionId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [tipoAlta, setTipoAlta] = useState("medica");
  const [notasAlta, setNotasAlta] = useState("");
  const [loading, setLoading] = useState(false);

  const procesarAlta = async () => {
    setLoading(true);
    const { error } = await (db as any)
      .from("admisiones")
      .update({
        estado: "alta",
        fecha_alta: new Date().toISOString(),
        tipo_alta: tipoAlta,
      })
      .eq("id", admisionId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Egreso clínico registrado correctamente");
      setOpen(false);
      onDone();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-xl gap-1 text-xs">
          <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
          Dar de Alta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-emerald-600" /> Confirmar Alta Médica
          </DialogTitle>
          <CardDescription>
            Registre el tipo de egreso y las indicaciones para el cierre de admisión
          </CardDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-2">
          <div className="space-y-1.5">
            <Label>Tipo de Egreso</Label>
            <Select value={tipoAlta} onValueChange={setTipoAlta}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medica">Alta Médica (Curación / Mejoría)</SelectItem>
                <SelectItem value="voluntaria">Alta Voluntaria (Firma de descargo)</SelectItem>
                <SelectItem value="traslado">Traslado a Otro Centro de Salud</SelectItem>
                <SelectItem value="defuncion">Egreso por Defunción</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Notas de Egreso o Epicrisis</Label>
            <Textarea
              placeholder="Tratamiento ambulatorio, recomendaciones o justificación del alta..."
              className="rounded-xl resize-none"
              rows={3}
              value={notasAlta}
              onChange={(e) => setNotasAlta(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
            Cancelar
          </Button>
          <Button onClick={procesarAlta} disabled={loading} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
            {loading ? "Procesando..." : "Confirmar Egreso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UciNotaDialog({ admisionId, pacienteId }: { admisionId: string; pacienteId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  async function save() {
    const { error } = await (db as any).from("uci_notas").insert({
      admision_id: admisionId,
      paciente_id: pacienteId,
      sofa_score: form.sofa ? parseInt(form.sofa) : null,
      apache_ii_score: form.apache ? parseInt(form.apache) : null,
      glasgow: form.glasgow ? parseInt(form.glasgow) : null,
      ventilacion: form.ventilacion ? { texto: form.ventilacion } : {},
      notas: form.notas || null,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Evolución UCI guardada correctamente");
      setOpen(false);
      setForm({});
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-xl gap-1 text-xs border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-500/10">
          <Activity className="h-3.5 w-3.5 text-rose-600" />
          Nota UCI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-rose-600" /> Evolución & Escalas Críticas UCI
          </DialogTitle>
          <CardDescription>Puntuaciones pronósticas SOFA, APACHE II y parámetros de ventilación</CardDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">SOFA</Label>
              <Input
                type="number"
                placeholder="0-24"
                className="rounded-xl font-mono text-xs"
                value={form.sofa ?? ""}
                onChange={(e) => setForm({ ...form, sofa: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">APACHE II</Label>
              <Input
                type="number"
                placeholder="0-71"
                className="rounded-xl font-mono text-xs"
                value={form.apache ?? ""}
                onChange={(e) => setForm({ ...form, apache: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Glasgow</Label>
              <Input
                type="number"
                max={15}
                min={3}
                placeholder="3-15"
                className="rounded-xl font-mono text-xs"
                value={form.glasgow ?? ""}
                onChange={(e) => setForm({ ...form, glasgow: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Parámetros de Ventilación Mecánica</Label>
            <Input
              placeholder="Modo VCV/PCV, FiO2 40%, PEEP 6, VT 420..."
              className="rounded-xl text-xs"
              value={form.ventilacion ?? ""}
              onChange={(e) => setForm({ ...form, ventilacion: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Comentarios Clínicos</Label>
            <Textarea
              placeholder="Estabilidad hemodinámica, soporte vasopresor, etc..."
              className="rounded-xl resize-none text-xs"
              rows={2}
              value={form.notas ?? ""}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
            Cancelar
          </Button>
          <Button onClick={save} className="rounded-xl">
            Guardar Nota UCI
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

