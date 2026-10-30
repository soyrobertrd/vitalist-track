import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/integrations/db/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BedDouble,
  Move,
  Users,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Clock,
  Activity,
  UserPlus,
  ArrowRightLeft,
  Wrench,
  Search,
  Filter,
  User,
  HeartPulse,
  DoorOpen,
  Layers,
  Utensils,
  Wind,
} from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { toast } from "sonner";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

import {
  type EstadoCama,
  type TipoCama,
  type TipoAislamiento,
  type PacienteHospitalizado,
  type CamaDetalle,
  type HabitacionHospitalaria,
  type PisoHospitalario,
  MOCK_PISOS_DATA as INITIAL_PISOS_DATA,
} from "@/components/censo/types";
import { ModalAdmisionCama, type FormAdmisionData } from "@/components/censo/ModalAdmisionCama";
import { ModalTrasladoCama } from "@/components/censo/ModalTrasladoCama";

export type {
  EstadoCama,
  TipoCama,
  TipoAislamiento,
  PacienteHospitalizado,
  CamaDetalle,
  HabitacionHospitalaria,
  PisoHospitalario,
};

export default function CensoCamas() {
  const [pisos, setPisos] = useState<PisoHospitalario[]>(INITIAL_PISOS_DATA);
  const [pisoSeleccionadoId, setPisoSeleccionadoId] = useState<string>("todos");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState<string>("");

  // Modales
  const [camaSeleccionada, setCamaSeleccionada] = useState<CamaDetalle | null>(null);
  const [modalAdmisionOpen, setModalAdmisionOpen] = useState(false);
  const [modalTrasladoOpen, setModalTrasladoOpen] = useState(false);

  // Formulario de Admisión
  const [formAdmision, setFormAdmision] = useState({
    nombre_paciente: "",
    cedula_nss: "",
    edad_sexo: "",
    diagnostico_cie10: "",
    medico_tratante: "Dr. Félix Montalvo",
    especialidad: "Medicina Interna",
    dieta: "Común balanceada",
    aislamiento: "Ninguno" as TipoAislamiento,
    alergias: "",
  });

  // Formulario de Traslado
  const [trasladoDestinoCamaId, setTrasladoDestinoCamaId] = useState<string>("");
  const [trasladoMotivo, setTrasladoMotivo] = useState<string>("");

  // Obtener todas las camas planas
  const todasLasCamas = useMemo(() => {
    return pisos.flatMap((p) =>
      p.habitaciones.flatMap((h) =>
        h.camas.map((c) => ({
          ...c,
          piso_numero: p.numero_piso,
          piso_nombre: p.nombre,
          habitacion_codigo: h.codigo_habitacion,
          habitacion_nombre: h.nombre,
        }))
      )
    );
  }, [pisos]);

  // Camas disponibles para traslados
  const camasLibresParaTraslado = useMemo(() => {
    return todasLasCamas.filter((c) => c.estado === "disponible");
  }, [todasLasCamas]);

  // KPIs
  const totalCamas = todasLasCamas.length;
  const camasOcupadas = todasLasCamas.filter((c) => c.estado === "ocupada").length;
  const camasDisponibles = todasLasCamas.filter((c) => c.estado === "disponible").length;
  const camasLimpieza = todasLasCamas.filter((c) => c.estado === "limpieza").length;
  const camasMantenimiento = todasLasCamas.filter((c) => c.estado === "mantenimiento").length;
  const porcentajeOcupacion = totalCamas > 0 ? Math.round((camasOcupadas / totalCamas) * 100) : 0;

  // Filtrado de pisos y habitaciones
  const pisosFiltrados = useMemo(() => {
    return pisos
      .filter((p) => pisoSeleccionadoId === "todos" || p.id === pisoSeleccionadoId)
      .map((p) => {
        const habitacionesFiltradas = p.habitaciones
          .map((h) => {
            const camasFiltradas = h.camas.filter((c) => {
              const matchEstado = filtroEstado === "todos" || c.estado === filtroEstado;
              const matchText =
                !busqueda ||
                c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                c.codigo_cama.toLowerCase().includes(busqueda.toLowerCase()) ||
                h.codigo_habitacion.toLowerCase().includes(busqueda.toLowerCase()) ||
                c.paciente?.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                c.paciente?.diagnostico_cie10.toLowerCase().includes(busqueda.toLowerCase());
              return matchEstado && matchText;
            });
            return { ...h, camas: camasFiltradas };
          })
          .filter((h) => h.camas.length > 0);
        return { ...p, habitaciones: habitacionesFiltradas };
      })
      .filter((p) => p.habitaciones.length > 0);
  }, [pisos, pisoSeleccionadoId, filtroEstado, busqueda]);

  // Acciones de Cama
  const handleCambiarEstado = (camaId: string, nuevoEstado: EstadoCama) => {
    setPisos((prev) =>
      prev.map((p) => ({
        ...p,
        habitaciones: p.habitaciones.map((h) => ({
          ...h,
          camas: h.camas.map((c) => {
            if (c.id === camaId) {
              const pac = nuevoEstado === "disponible" || nuevoEstado === "limpieza" ? undefined : c.paciente;
              return { ...c, estado: nuevoEstado, paciente: pac };
            }
            return c;
          }),
        })),
      }))
    );
    toast.success(`Cama actualizada a: ${nuevoEstado.toUpperCase()}`);
  };

  const handleAbrirAdmision = (cama: CamaDetalle) => {
    setCamaSeleccionada(cama);
    setFormAdmision({
      nombre_paciente: "",
      cedula_nss: "",
      edad_sexo: "",
      diagnostico_cie10: "",
      medico_tratante: "Dr. Félix Montalvo",
      especialidad: "Medicina Interna",
      dieta: "Común balanceada",
      aislamiento: "Ninguno",
      alergias: "",
    });
    setModalAdmisionOpen(true);
  };

  const handleConfirmarAdmision = () => {
    if (!camaSeleccionada || !formAdmision.nombre_paciente) {
      toast.error("Debe ingresar el nombre del paciente");
      return;
    }

    const nuevoPaciente: PacienteHospitalizado = {
      id: `pac-${Date.now()}`,
      nombre: formAdmision.nombre_paciente,
      cedula_nss: formAdmision.cedula_nss || "Sin documento",
      edad_sexo: formAdmision.edad_sexo || "Adulto",
      diagnostico_cie10: formAdmision.diagnostico_cie10 || "Diagnóstico clínico general",
      medico_tratante: formAdmision.medico_tratante,
      especialidad: formAdmision.especialidad,
      fecha_ingreso: new Date().toISOString().slice(0, 10),
      dias_estancia: 1,
      dieta: formAdmision.dieta,
      alergias: formAdmision.alergias,
      aislamiento: formAdmision.aislamiento,
    };

    setPisos((prev) =>
      prev.map((p) => ({
        ...p,
        habitaciones: p.habitaciones.map((h) => ({
          ...h,
          camas: h.camas.map((c) => {
            if (c.id === camaSeleccionada.id) {
              return { ...c, estado: "ocupada" as EstadoCama, paciente: nuevoPaciente };
            }
            return c;
          }),
        })),
      }))
    );

    toast.success(`Paciente ${nuevoPaciente.nombre} ingresado en ${camaSeleccionada.nombre}`);
    setModalAdmisionOpen(false);
  };

  const handleAbrirTraslado = (cama: CamaDetalle) => {
    setCamaSeleccionada(cama);
    setTrasladoDestinoCamaId("");
    setTrasladoMotivo("");
    setModalTrasladoOpen(true);
  };

  const handleConfirmarTraslado = () => {
    if (!camaSeleccionada || !camaSeleccionada.paciente || !trasladoDestinoCamaId) {
      toast.error("Seleccione la cama de destino para el traslado");
      return;
    }

    const pac = { ...camaSeleccionada.paciente };
    const origenId = camaSeleccionada.id;
    const destinoId = trasladoDestinoCamaId;

    setPisos((prev) =>
      prev.map((p) => ({
        ...p,
        habitaciones: p.habitaciones.map((h) => ({
          ...h,
          camas: h.camas.map((c) => {
            if (c.id === origenId) {
              // Cama origen queda en limpieza terminal
              return { ...c, estado: "limpieza" as EstadoCama, paciente: undefined };
            }
            if (c.id === destinoId) {
              // Cama destino recibe al paciente
              return { ...c, estado: "ocupada" as EstadoCama, paciente: pac };
            }
            return c;
          }),
        })),
      }))
    );

    toast.success(`Paciente ${pac.nombre} trasladado con éxito. Cama origen pasa a limpieza terminal.`);
    setModalTrasladoOpen(false);
  };

  const estadoBadgeClass = (estado: EstadoCama) => {
    switch (estado) {
      case "disponible":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
      case "ocupada":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30";
      case "limpieza":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
      case "mantenimiento":
        return "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/30";
      case "reservada":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Modo B */}
      <ClinicalPageHeader
        title="Control de Camas por Piso & Habitación"
        subtitle="Censo hospitalario en tiempo real, trazabilidad de traslados, alertas de aislamiento y gestión de desinfección terminal"
        icon={BedDouble}
        badge="Censo Hospitalario RD"
        action={
          <div className="flex items-center gap-2">
            <Select value={pisoSeleccionadoId} onValueChange={setPisoSeleccionadoId}>
              <SelectTrigger className="w-[240px] rounded-xl border-border/80 text-xs">
                <SelectValue placeholder="Seleccionar Piso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los Pisos Hospitalarios</SelectItem>
                {pisos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    Piso {p.numero_piso} — {p.nombre.split("—")[1] || p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* KPIs Clínicos de Ocupación */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <ClinicalKpiCard
          title="Total Camas Censadas"
          value={totalCamas}
          subtitle="Capacidad instalada del centro"
          icon={Building2}
          variant="primary"
        />
        <ClinicalKpiCard
          title="Camas Ocupadas"
          value={camasOcupadas}
          subtitle="Pacientes en hospitalización"
          icon={Users}
          variant="rose"
        />
        <ClinicalKpiCard
          title="Camas Libres"
          value={camasDisponibles}
          subtitle="Listas para ingreso inmediato"
          icon={CheckCircle2}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="En Limpieza Terminal"
          value={camasLimpieza}
          subtitle="Desinfección de habitáculo"
          icon={Sparkles}
          variant="amber"
        />
        <ClinicalKpiCard
          title="Índice de Ocupación"
          value={`${porcentajeOcupacion}%`}
          subtitle={porcentajeOcupacion > 85 ? "Alerta: saturación alta" : "Operatividad óptima"}
          icon={Activity}
          variant={porcentajeOcupacion > 85 ? "amber" : "teal"}
        />
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <Card className="rounded-2xl border-border/80 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cama (ej. C-201), habitación, paciente o diagnóstico..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 rounded-xl border-border/80 text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-[180px] rounded-xl border-border/80 text-xs">
                <SelectValue placeholder="Estado de cama" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los Estados</SelectItem>
                <SelectItem value="disponible">Solo Libres / Disponibles</SelectItem>
                <SelectItem value="ocupada">Solo Ocupadas</SelectItem>
                <SelectItem value="limpieza">En Limpieza Terminal</SelectItem>
                <SelectItem value="mantenimiento">En Mantenimiento</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Renderizado de Pisos y Habitaciones */}
      <div className="space-y-8">
        {pisosFiltrados.length === 0 ? (
          <Card className="rounded-2xl border-border/80 p-8 text-center text-muted-foreground text-xs">
            No se encontraron camas o habitaciones con los filtros aplicados.
          </Card>
        ) : (
          pisosFiltrados.map((piso) => (
            <div key={piso.id} className="space-y-4">
              {/* Encabezado del Piso */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-border/80 gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-xs">
                    PISO {piso.numero_piso}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">{piso.nombre}</h3>
                    <p className="text-xs text-muted-foreground">
                      {piso.descripcion_servicio} · Jefe Enfermería:{" "}
                      <span className="font-medium text-foreground">{piso.jefe_enfermeria}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs rounded-full">
                    {piso.habitaciones.length} Habitaciones
                  </Badge>
                  <Badge variant="secondary" className="text-xs rounded-full">
                    {
                      piso.habitaciones.flatMap((h) => h.camas).filter((c) => c.estado === "disponible")
                        .length
                    }{" "}
                    libres de {piso.habitaciones.flatMap((h) => h.camas).length}
                  </Badge>
                </div>
              </div>

              {/* Grid de Habitaciones del Piso */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {piso.habitaciones.map((hab) => (
                  <Card
                    key={hab.id}
                    className="rounded-2xl border-border/80 shadow-sm overflow-hidden bg-card/60 hover:border-emerald-500/40 transition-colors"
                  >
                    <CardHeader className="bg-muted/30 px-4 py-3 border-b border-border/80 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DoorOpen className="w-4 h-4 text-emerald-600" />
                        <div>
                          <CardTitle className="text-xs font-bold text-foreground">
                            {hab.nombre}
                          </CardTitle>
                          <div className="text-[10px] text-muted-foreground">
                            {hab.tipo_habitacion} · {hab.ala_sector}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {hab.camas.filter((c) => c.estado === "ocupada").length} / {hab.camas.length} Camas
                      </Badge>
                    </CardHeader>

                    <CardContent className="p-3 space-y-3">
                      {hab.camas.map((cama) => (
                        <div
                          key={cama.id}
                          className="p-3 rounded-xl border border-border/80 bg-background/80 space-y-2 text-xs"
                        >
                          {/* Cabecera de la Cama */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-xs font-bold">
                                {cama.codigo_cama}
                              </Badge>
                              <span className="font-semibold text-foreground">{cama.nombre}</span>
                              <span className="text-[10px] text-muted-foreground">({cama.tipo})</span>
                            </div>

                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold uppercase ${estadoBadgeClass(cama.estado)}`}
                            >
                              {cama.estado}
                            </Badge>
                          </div>

                          {/* Equipamiento y Dotación */}
                          <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground pt-1">
                            {cama.oxigeno_central && (
                              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                                <Wind className="w-3 h-3" /> O₂ Central
                              </span>
                            )}
                            {cama.ventilador_mecanico && (
                              <span className="flex items-center gap-1 text-purple-700 dark:text-purple-400 font-medium">
                                <Activity className="w-3 h-3" /> Ventilación Mecánica
                              </span>
                            )}
                            {cama.monitor_multiparametrico && (
                              <span className="flex items-center gap-1 text-blue-700 dark:text-blue-400">
                                <HeartPulse className="w-3 h-3" /> Monitor Vitales
                              </span>
                            )}
                          </div>

                          {/* Detalle del Paciente si está Ocupada */}
                          {cama.estado === "ocupada" && cama.paciente && (
                            <div className="bg-muted/40 p-2.5 rounded-lg border border-border/80 space-y-1.5 mt-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-primary" /> {cama.paciente.nombre}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {cama.paciente.edad_sexo} · Cédula: {cama.paciente.cedula_nss}
                                </span>
                              </div>

                              <div className="text-[11px] text-muted-foreground">
                                <span className="font-medium text-foreground">Diagnóstico:</span>{" "}
                                {cama.paciente.diagnostico_cie10}
                              </div>

                              <div className="flex flex-wrap items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                                <span>
                                  Médico:{" "}
                                  <strong className="text-foreground">{cama.paciente.medico_tratante}</strong> (
                                  {cama.paciente.especialidad})
                                </span>
                                <span>
                                  Estancia: <strong className="text-foreground">{cama.paciente.dias_estancia} días</strong>
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                {cama.paciente.dieta && (
                                  <Badge variant="outline" className="text-[9px] py-0 gap-1 text-amber-700">
                                    <Utensils className="w-2.5 h-2.5" /> {cama.paciente.dieta}
                                  </Badge>
                                )}
                                {cama.paciente.aislamiento !== "Ninguno" && (
                                  <Badge className="text-[9px] py-0 gap-1 bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30">
                                    <ShieldAlert className="w-2.5 h-2.5" /> Aislamiento:{" "}
                                    {cama.paciente.aislamiento}
                                  </Badge>
                                )}
                                {cama.paciente.alergias && (
                                  <Badge className="text-[9px] py-0 bg-red-600 text-white font-bold">
                                    Alergia: {cama.paciente.alergias}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Notas de Limpieza / Mantenimiento */}
                          {cama.estado === "limpieza" && (
                            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" /> En proceso de desinfección terminal
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCambiarEstado(cama.id, "disponible")}
                                className="h-6 text-[10px] px-2 rounded-lg border-amber-500/40 hover:bg-amber-100"
                              >
                                Finalizar Limpieza
                              </Button>
                            </div>
                          )}

                          {cama.estado === "mantenimiento" && (
                            <div className="p-2 bg-neutral-500/10 rounded-lg border border-neutral-500/20 text-neutral-600 dark:text-neutral-400 text-[11px] flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Wrench className="w-3.5 h-3.5" /> Cama en mantenimiento técnico
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCambiarEstado(cama.id, "disponible")}
                                className="h-6 text-[10px] px-2 rounded-lg hover:bg-muted"
                              >
                                Habilitar
                              </Button>
                            </div>
                          )}

                          {/* Botonera de Acciones de Cama */}
                          <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/80">
                            {cama.estado === "disponible" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleAbrirAdmision(cama)}
                                  className="h-7 text-xs px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                >
                                  <UserPlus className="w-3.5 h-3.5" /> Ingresar Paciente
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCambiarEstado(cama.id, "mantenimiento")}
                                  className="h-7 text-xs px-2 rounded-lg text-muted-foreground hover:bg-muted"
                                  title="Bloquear por mantenimiento"
                                >
                                  <Wrench className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}

                            {cama.estado === "ocupada" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAbrirTraslado(cama)}
                                  className="h-7 text-xs px-2 rounded-lg gap-1 border-border/80 text-foreground hover:bg-muted"
                                >
                                  <ArrowRightLeft className="w-3 h-3 text-primary" /> Trasladar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCambiarEstado(cama.id, "limpieza")}
                                  className="h-7 text-xs px-2 rounded-lg border-rose-500/30 text-rose-600 hover:bg-rose-50"
                                >
                                  Alta / Liberar Cama
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Ingreso / Asignación Directa de Paciente a Cama */}
      <ModalAdmisionCama
        open={modalAdmisionOpen}
        onOpenChange={setModalAdmisionOpen}
        cama={camaSeleccionada}
        formData={formAdmision}
        setFormData={setFormAdmision}
        onConfirmar={handleConfirmarAdmision}
      />

      {/* Modal: Traslado de Paciente entre Camas / Pisos */}
      <ModalTrasladoCama
        open={modalTrasladoOpen}
        onOpenChange={setModalTrasladoOpen}
        cama={camaSeleccionada}
        camasLibres={camasLibresParaTraslado}
        destinoCamaId={trasladoDestinoCamaId}
        setDestinoCamaId={setTrasladoDestinoCamaId}
        motivo={trasladoMotivo}
        setMotivo={setTrasladoMotivo}
        onConfirmar={handleConfirmarTraslado}
      />
    </div>
  );
}
