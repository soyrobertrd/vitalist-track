import { DEMO_MODE } from "@/lib/mock-live-seed";
import { useEffect, useState, useMemo } from "react";
import { db } from "@/integrations/db/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  FileCheck,
  Plus,
  FileSignature,
  Pill,
  Calendar,
  AlertTriangle,
  Stethoscope,
  QrCode,
  CheckCircle2,
  Clock,
  Printer,
  Search,
  User,
  ArrowRight
} from "lucide-react";
import { differenceInYears, format } from "date-fns";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";
import { EpicrisisDigitalModal, type DatosEpicrisisAlta } from "@/components/hospital/EpicrisisDigitalModal";

/** Convierte una fila de altas_hospitalarias (con pacientes y personal_salud embebidos) al formato de la epicrisis. */
function aDatosEpicrisis(a: any): DatosEpicrisisAlta {
  const medico = a.personal_salud ? `${a.personal_salud.nombre} ${a.personal_salud.apellido}` : "—";
  const nac = a.pacientes?.fecha_nacimiento;
  return {
    id: a.id,
    pacienteNombre: a.pacientes ? `${a.pacientes.nombre} ${a.pacientes.apellido}` : "—",
    cedula: a.pacientes?.cedula ?? "",
    edad: nac ? `${differenceInYears(new Date(), new Date(nac))} años` : "—",
    servicioEgreso: a.proxima_cita_especialidad ?? "—",
    fechaIngreso: "—",
    fechaAlta: a.fecha_alta,
    tipoAlta: a.tipo_alta,
    diagnosticoPrincipal: a.diagnostico_principal ?? "—",
    resumenEstancia: a.resumen_clinico ?? "",
    medicamentosDomicilio: (Array.isArray(a.medicamentos_alta) ? a.medicamentos_alta : []).map((m: any) => ({
      nombre: m.nombre ?? m.descripcion ?? "",
      dosis: m.dosis ?? "",
      frecuencia: m.frecuencia ?? "",
      duracion: m.duracion ?? "",
    })),
    signosAlarma: (a.signos_alarma ?? "").split(/[,\n]/).map((x: string) => x.trim()).filter(Boolean),
    proximaCita: { fecha: a.proxima_cita_fecha ?? "", especialidad: a.proxima_cita_especialidad ?? "", medico },
    medicoTratante: medico,
  };
}

const ESTADO_COLOR: Record<string, string> = {
  pendiente: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  firmada: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  entregada: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  anulada: "bg-muted text-muted-foreground",
};

const TIPOS = [
  { value: "medica", label: "Alta Médica Conforme" },
  { value: "voluntaria", label: "Alta Voluntaria / A Petición" },
  { value: "traslado", label: "Traslado a Otro Centro" },
  { value: "defuncion", label: "Defunción Hospitalaria" },
  { value: "fuga", label: "Fuga / Abandono" },
];

export default function AltaHospitalaria() {
  const { currentWorkspace } = useWorkspace();
  const { isAdmin } = useUserRole();
  const wsId = currentWorkspace?.id;
  const [altas, setAltas] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [medicos, setMedicos] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [epicrisisSeleccionada, setEpicrisisSeleccionada] = useState<any>(null);
  const [epicrisisModalOpen, setEpicrisisModalOpen] = useState(false);

  const [form, setForm] = useState<any>({
    paciente_id: "",
    tipo_alta: "medica",
    diagnostico_principal: "",
    resumen_clinico: "",
    indicaciones_paciente: "",
    cuidados_domicilio: "",
    dieta_recomendada: "",
    actividad_fisica: "",
    signos_alarma: "",
    proxima_cita_fecha: "",
    proxima_cita_especialidad: "",
    medicamentos_alta_texto: "",
    medico_alta_id: "",
    notas_adicionales: "",
  });

  const cargar = async () => {
    if (!wsId) return;
    setLoading(true);
    const [a, p, m] = await Promise.all([
      (db.from("altas_hospitalarias") as any)
        .select("*, pacientes(nombre, apellido, cedula, fecha_nacimiento), personal_salud!medico_alta_id(nombre, apellido)")
        .eq("workspace_id", wsId)
        .order("fecha_alta", { ascending: false })
        .limit(100),
      db.from("pacientes").select("id, nombre, apellido, cedula").eq("workspace_id", wsId).order("nombre"),
      db.from("personal_salud").select("id, nombre, apellido").eq("workspace_id", wsId).eq("activo", true),
    ]);

    if (a.data && a.data.length > 0) {
      setAltas(a.data);
    } else {
      // Mock inicial si no hay registros en la base de datos
      setAltas([
        {
          id: "alta-01",
          fecha_alta: new Date(Date.now() - 3600000 * 4).toISOString(),
          tipo_alta: "medica",
          estado: "entregada",
          diagnostico_principal: "K35.80 Apendicitis aguda resuelta post-laparoscopía",
          resumen_clinico: "Paciente intervenido de apendicectomía laparoscópica. Adecuada tolerancia oral y deambulación.",
          signos_alarma: "Fiebre > 38.5°C, dolor abdominal intenso, eritema o supuración de heridas.",
          proxima_cita_fecha: "2026-11-05",
          proxima_cita_especialidad: "Cirugía General",
          medicamentos_alta: [
            { descripcion: "Paracetamol 1g cada 8h por 3 días" },
            { descripcion: "Ibuprofeno 400mg cada 8h en caso de dolor" },
          ],
          pacientes: { nombre: "Roberto Carlos", apellido: "Santana", cedula: "001-1827364-5" },
          personal_salud: { nombre: "Dr. Roberto", apellido: "Santos" },
        },
        {
          id: "alta-02",
          fecha_alta: new Date(Date.now() - 3600000 * 18).toISOString(),
          tipo_alta: "medica",
          estado: "pendiente",
          diagnostico_principal: "J18.9 Neumonía adquirida en la comunidad tratada",
          resumen_clinico: "Resolución de cuadro infeccioso respiratorio, afebril por más de 48 horas.",
          signos_alarma: "Disnea súbita o dolor pleurítico.",
          proxima_cita_fecha: "2026-11-08",
          proxima_cita_especialidad: "Medicina Interna",
          medicamentos_alta: [{ descripcion: "Levofloxacino 500mg vía oral cada 24h por 5 días" }],
          pacientes: { nombre: "María Altagracia", apellido: "Pérez", cedula: "402-2345678-1" },
          personal_salud: { nombre: "Dr. Carlos", apellido: "Mendoza" },
        },
      ]);
    }
    setPacientes(p.data || []);
    setMedicos(m.data || []);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, [wsId]);

  const crear = async () => {
    if (!form.paciente_id) {
      toast.error("Seleccione el paciente para el alta.");
      return;
    }
    const { data: { user } } = await db.auth.getUser();
    const meds = form.medicamentos_alta_texto
      ? form.medicamentos_alta_texto.split("\n").filter(Boolean).map((l: string) => ({ descripcion: l.trim() }))
      : [];

    const nuevoObj: any = {
      workspace_id: wsId,
      paciente_id: form.paciente_id,
      tipo_alta: form.tipo_alta,
      diagnostico_principal: form.diagnostico_principal || null,
      resumen_clinico: form.resumen_clinico || null,
      indicaciones_paciente: form.indicaciones_paciente || null,
      cuidados_domicilio: form.cuidados_domicilio || null,
      dieta_recomendada: form.dieta_recomendada || null,
      actividad_fisica: form.actividad_fisica || null,
      signos_alarma: form.signos_alarma || null,
      proxima_cita_fecha: form.proxima_cita_fecha || null,
      proxima_cita_especialidad: form.proxima_cita_especialidad || null,
      medicamentos_alta: meds,
      medico_alta_id: form.medico_alta_id || null,
      notas_adicionales: form.notas_adicionales || null,
      created_by: user?.id,
      estado: "pendiente",
      fecha_alta: new Date().toISOString(),
    };

    const { error } = await (db.from("altas_hospitalarias") as any).insert(nuevoObj);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Alta hospitalaria registrada exitosamente.");
    setOpen(false);
    setForm({
      paciente_id: "",
      tipo_alta: "medica",
      diagnostico_principal: "",
      resumen_clinico: "",
      indicaciones_paciente: "",
      cuidados_domicilio: "",
      medicamentos_alta_texto: "",
      notas_adicionales: "",
    });
    cargar();
  };

  const cambiarEstado = async (id: string, estado: string) => {
    const { error } = await (db.from("altas_hospitalarias") as any).update({ estado }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Alta marcada como ${estado}`);
    cargar();
  };

  const altasFiltradas = useMemo(() => {
    return altas.filter((a) => {
      const matchBusqueda =
        a.pacientes?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.pacientes?.apellido?.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.diagnostico_principal?.toLowerCase().includes(busqueda.toLowerCase());
      const matchTipo = filtroTipo === "todos" ? true : a.tipo_alta === filtroTipo;
      return matchBusqueda && matchTipo;
    });
  }, [altas, busqueda, filtroTipo]);

  const entregadas = altas.filter((a) => a.estado === "entregada").length;
  const pendientes = altas.filter((a) => a.estado === "pendiente").length;
  const conReceta = altas.filter((a) => Array.isArray(a.medicamentos_alta) && a.medicamentos_alta.length > 0).length;

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="Egresos & Alta Hospitalaria"
        subtitle="Emisión de epicrisis digital oficial, conciliación de fármacos al egreso y programación de citas de seguimiento"
        icon={FileCheck}
        badge="Epicrisis Digital & Ley 42-01"
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva Alta Hospitalaria
          </Button>
        }
      />

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ClinicalKpiCard
          title="Altas Entregadas & Conformes"
          value={entregadas}
          subtitle="Egresos completados exitosamente"
          icon={CheckCircle2}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="Pendientes de Firma Médica"
          value={pendientes}
          subtitle="En espera de validación de epicrisis"
          icon={Clock}
          variant="amber"
          alert={pendientes > 0}
        />
        <ClinicalKpiCard
          title="Conciliación Farmacológica"
          value={conReceta}
          subtitle="Con receta de medicamentos al alta"
          icon={Pill}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Citas de Control Ambulatorio"
          value={altas.filter((a) => !!a.proxima_cita_fecha).length}
          subtitle="Continuidad asistencial garantizada"
          icon={Calendar}
          variant="teal"
        />
      </div>

      {/* Censo y Filtros */}
      <Card className="rounded-2xl border-border/80">
        <CardHeader className="p-4 pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-teal-600" />
                Censo de Egresos Hospitalarios
              </CardTitle>
              <CardDescription>
                Resumen clínico oficial, indicaciones al paciente y generación de QR de epicrisis para el móvil.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente, diagnóstico..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-40 h-9 text-xs">
                  <SelectValue placeholder="Tipo de alta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los Tipos</SelectItem>
                  {TIPOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {loading ? (
            <p className="text-xs text-muted-foreground">Cargando altas hospitalarias...</p>
          ) : altasFiltradas.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No hay altas registradas con este criterio.</p>
          ) : (
            altasFiltradas.map((a: any) => (
              <Card key={a.id} className="border-border/80 hover:shadow-sm transition-all rounded-xl">
                <CardHeader className="p-3.5 pb-2">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">
                        {a.pacientes?.nombre} {a.pacientes?.apellido}
                      </span>
                      <Badge variant="outline" className="text-[11px] font-mono">
                        Céd: {a.pacientes?.cedula || "s/c"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {TIPOS.find((t) => t.value === a.tipo_alta)?.label || a.tipo_alta}
                      </Badge>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge className={`text-[10px] ${ESTADO_COLOR[a.estado] || ""}`}>
                        {a.estado?.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {a.fecha_alta ? format(new Date(a.fecha_alta), "dd/MM/yyyy hh:mm a") : ""}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3.5 pt-0 space-y-2 text-xs">
                  {a.diagnostico_principal && (
                    <p>
                      <strong className="text-muted-foreground">Diagnóstico de Egreso:</strong>{" "}
                      <span className="text-foreground font-medium">{a.diagnostico_principal}</span>
                    </p>
                  )}
                  {a.resumen_clinico && (
                    <p className="text-muted-foreground line-clamp-2">
                      <strong className="text-foreground">Resumen:</strong> {a.resumen_clinico}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 pt-1 text-muted-foreground">
                    {Array.isArray(a.medicamentos_alta) && a.medicamentos_alta.length > 0 && (
                      <span className="flex items-center gap-1 text-foreground font-medium">
                        <Pill className="h-3.5 w-3.5 text-primary" /> {a.medicamentos_alta.length} medicamento(s) recetados
                      </span>
                    )}
                    {a.signos_alarma && (
                      <span className="flex items-center gap-1 text-red-600 font-medium">
                        <AlertTriangle className="h-3.5 w-3.5" /> Signos de alarma comunicados
                      </span>
                    )}
                    {a.proxima_cita_fecha && (
                      <span className="flex items-center gap-1 text-teal-600 font-medium">
                        <Calendar className="h-3.5 w-3.5" /> Control: {a.proxima_cita_fecha} ({a.proxima_cita_especialidad})
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-border/40">
                    <p className="text-[11px] text-muted-foreground">
                      Médico: {a.personal_salud ? `${a.personal_salud.nombre} ${a.personal_salud.apellido}` : "Especialista de guardia"}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEpicrisisSeleccionada(a);
                          setEpicrisisModalOpen(true);
                        }}
                        className="h-7 text-xs border-teal-500/30 text-teal-700 dark:text-teal-400 hover:bg-teal-500/10"
                      >
                        <QrCode className="h-3.5 w-3.5 mr-1 text-teal-600" />
                        Epicrisis & QR Móvil
                      </Button>
                      {a.estado === "pendiente" && (
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => cambiarEstado(a.id, "firmada")}
                        >
                          <FileSignature className="h-3.5 w-3.5 mr-1" />
                          Firmar Alta
                        </Button>
                      )}
                      {a.estado === "firmada" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs"
                          onClick={() => cambiarEstado(a.id, "entregada")}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                          Marcar Entregada
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Modal Registrar Alta */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileCheck className="h-5 w-5 text-teal-600" />
              Registrar Egreso & Alta Hospitalaria
            </DialogTitle>
            <DialogDescription>
              Confección de epicrisis clínica, indicaciones de recuperación y receta médica de egreso.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Paciente *</Label>
                <Select value={form.paciente_id} onValueChange={(v) => setForm({ ...form, paciente_id: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar paciente..." /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {pacientes.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre} {p.apellido} · {p.cedula || "s/c"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Tipo de Alta</Label>
                <Select value={form.tipo_alta} onValueChange={(v) => setForm({ ...form, tipo_alta: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Diagnóstico Principal de Egreso (CIE-10)</Label>
              <Input
                placeholder="Ej: K35.80 Apendicitis aguda resuelta"
                value={form.diagnostico_principal}
                onChange={(e) => setForm({ ...form, diagnostico_principal: e.target.value })}
                className="h-8"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Resumen Clínico de Hospitalización</Label>
              <Textarea
                placeholder="Evolución durante el ingreso, procedimientos realizados, hallazgos..."
                value={form.resumen_clinico}
                onChange={(e) => setForm({ ...form, resumen_clinico: e.target.value })}
                rows={2}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Medicamentos al Alta (un fármaco con dosis por línea)</Label>
              <Textarea
                placeholder="Ej: Paracetamol 1g VO cada 8h por 3 días&#10;Amoxicilina/Clavulánico 875/125mg cada 12h por 7 días"
                value={form.medicamentos_alta_texto}
                onChange={(e) => setForm({ ...form, medicamentos_alta_texto: e.target.value })}
                rows={2}
                className="text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Signos de Alarma para Reconsulta Urgente</Label>
                <Input
                  placeholder="Fiebre > 38.5°C, sangrado, dolor agudo..."
                  value={form.signos_alarma}
                  onChange={(e) => setForm({ ...form, signos_alarma: e.target.value })}
                  className="h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Fecha Próxima Cita de Control</Label>
                <Input
                  type="date"
                  value={form.proxima_cita_fecha}
                  onChange={(e) => setForm({ ...form, proxima_cita_fecha: e.target.value })}
                  className="h-8"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={crear}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Guardar Alta Hospitalaria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Epicrisis & QR */}
      {epicrisisSeleccionada && (
        <EpicrisisDigitalModal
          open={epicrisisModalOpen}
          onOpenChange={setEpicrisisModalOpen}
          datos={aDatosEpicrisis(epicrisisSeleccionada)}
        />
      )}
    </div>
  );
}
