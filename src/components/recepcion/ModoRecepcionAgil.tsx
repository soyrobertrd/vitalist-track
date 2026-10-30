import { useState, useEffect, useCallback } from "react";
import { db } from "@/integrations/db/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, startOfDay, endOfDay, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  Users, UserCheck, CheckCircle2, DollarSign, Plus, Search,
  Clock, CreditCard, Receipt, Phone, AlertCircle, RefreshCw, Printer
} from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useActiveSucursal } from "@/contexts/ActiveSucursalContext";

interface CitaHoy {
  id: string;
  fecha_hora_visita: string;
  estado: string;
  tipo_visita?: string;
  motivo_visita?: string;
  paciente_id: string;
  profesional_id?: string;
  pacientes: {
    id: string;
    nombre: string;
    apellido: string;
    cedula?: string | null;
    numero_principal?: string | null;
    contacto_px?: string | null;
  } | null;
  personal_salud: {
    id: string;
    nombre: string;
    apellido: string;
  } | null;
}

export function ModoRecepcionAgil() {
  const { currentWorkspace } = useWorkspace();
  const { activeSucursalId } = useActiveSucursal();

  const [citas, setCitas] = useState<CitaHoy[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");

  // Cobro Express State
  const [cobroDialogOpen, setCobroDialogOpen] = useState(false);
  const [citaCobro, setCitaCobro] = useState<CitaHoy | null>(null);
  const [montoCobro, setMontoCobro] = useState("1500");
  const [metodoPago, setMetodoPago] = useState<string>("efectivo");
  const [conceptoCobro, setConceptoCobro] = useState("Consulta Médica / Copago");
  const [numAutorizacion, setNumAutorizacion] = useState("");
  const [aseguradora, setAseguradora] = useState("");
  const [procesandoCobro, setProcesandoCobro] = useState(false);
  const [ultimoRecibo, setUltimoRecibo] = useState<{ id: string; paciente: string; monto: number; fecha: string } | null>(null);

  // Registro Express State
  const [registroDialogOpen, setRegistroDialogOpen] = useState(false);
  const [profesionales, setProfesionales] = useState<{ id: string; nombre: string; apellido: string }[]>([]);
  const [regNombre, setRegNombre] = useState("");
  const [regApellido, setRegApellido] = useState("");
  const [regCedula, setRegCedula] = useState("");
  const [regTelefono, setRegTelefono] = useState("");
  const [regProfesionalId, setRegProfesionalId] = useState("");
  const [regMotivo, setRegMotivo] = useState("Consulta sin cita previa");
  const [guardandoRegistro, setGuardandoRegistro] = useState(false);

  // Cargar citas de hoy
  const cargarCitasHoy = useCallback(async () => {
    setLoading(true);
    const hoy = new Date();
    const desde = startOfDay(hoy).toISOString();
    const hasta = endOfDay(hoy).toISOString();

    let query = db
      .from("control_visitas")
      .select(`
        id,
        fecha_hora_visita,
        estado,
        tipo_visita,
        motivo_visita,
        paciente_id,
        profesional_id,
        pacientes (id, nombre, apellido, cedula, numero_principal, contacto_px),
        personal_salud (id, nombre, apellido)
      `)
      .gte("fecha_hora_visita", desde)
      .lte("fecha_hora_visita", hasta)
      .order("fecha_hora_visita", { ascending: true });

    if (currentWorkspace) query = query.eq("workspace_id", currentWorkspace.id);
    if (activeSucursalId) query = query.eq("sucursal_id", activeSucursalId);

    const { data, error } = await query;
    if (error) {
      toast.error("Error al cargar citas del día");
    } else {
      setCitas((data as unknown as CitaHoy[]) || []);
    }
    setLoading(false);
  }, [currentWorkspace, activeSucursalId]);

  useEffect(() => {
    cargarCitasHoy();
    // Cargar profesionales para asignación rápida
    const fetchProfesionales = async () => {
      const { data } = await db
        .from("personal_salud")
        .select("id, nombre, apellido")
        .order("nombre", { ascending: true });
      if (data) setProfesionales(data);
    };
    fetchProfesionales();
  }, [cargarCitasHoy]);

  // Marcar Llegada en 1 toque
  // Marcar Llegada Optimista (< 150 ms) con opción de deshacer
  const handleMarcarLlegada = async (citaId: string) => {
    const citaPrevia = citas.find((c) => c.id === citaId);
    const estadoPrevio = citaPrevia?.estado || "pendiente";
    const horaActual = format(new Date(), "HH:mm");

    // 1. Actualización optimista inmediata en UI
    setCitas((prev) =>
      prev.map((c) => (c.id === citaId ? { ...c, estado: "en_sala" } : c))
    );

    // 2. Toast con acción de Deshacer
    toast.success("✓ Llegada registrada. Paciente en sala de espera.", {
      action: {
        label: "Deshacer",
        onClick: async () => {
          setCitas((prev) =>
            prev.map((c) => (c.id === citaId ? { ...c, estado: estadoPrevio } : c))
          );
          await db
            .from("control_visitas")
            .update({ estado: estadoPrevio, notas_visita: null } as any)
            .eq("id", citaId);
          toast.info("Llegada revertida.");
        },
      },
    });

    // 3. Sincronización en segundo plano con la base de datos
    const { error } = await db
      .from("control_visitas")
      .update({
        estado: "en_sala",
        notas_visita: `Paciente llegó a recepción a las ${horaActual}`,
      } as any)
      .eq("id", citaId);

    if (error) {
      // Revertir en caso de falla de red
      setCitas((prev) =>
        prev.map((c) => (c.id === citaId ? { ...c, estado: estadoPrevio } : c))
      );
      toast.error("Error al registrar llegada. Se revirtió el cambio.");
    }
  };

  // Marcar Atendido Optimista (< 150 ms) con opción de deshacer
  const handleMarcarAtendido = async (citaId: string) => {
    const citaPrevia = citas.find((c) => c.id === citaId);
    const estadoPrevio = citaPrevia?.estado || "en_sala";

    // 1. Actualización optimista inmediata
    setCitas((prev) =>
      prev.map((c) => (c.id === citaId ? { ...c, estado: "realizada" } : c))
    );

    // 2. Toast con Deshacer
    toast.success("✓ Cita marcada como atendida.", {
      action: {
        label: "Deshacer",
        onClick: async () => {
          setCitas((prev) =>
            prev.map((c) => (c.id === citaId ? { ...c, estado: estadoPrevio } : c))
          );
          await db
            .from("control_visitas")
            .update({ estado: estadoPrevio } as any)
            .eq("id", citaId);
          toast.info("Atención revertida a estado anterior.");
        },
      },
    });

    // 3. Sincronización en segundo plano
    const { error } = await db
      .from("control_visitas")
      .update({
        estado: "realizada",
        notas_visita: `Atención completada a las ${format(new Date(), "HH:mm")}`,
      } as any)
      .eq("id", citaId);

    if (error) {
      setCitas((prev) =>
        prev.map((c) => (c.id === citaId ? { ...c, estado: estadoPrevio } : c))
      );
      toast.error("Error al marcar atendido. Se revirtió el cambio.");
    }
  };

  // Abrir modal de cobro express
  const abrirCobro = (cita: CitaHoy) => {
    setCitaCobro(cita);
    setMontoCobro("1500");
    setMetodoPago("efectivo");
    setConceptoCobro("Consulta Médica / Copago");
    setNumAutorizacion("");
    setAseguradora("");
    setCobroDialogOpen(true);
  };

  // Confirmar cobro express
  const handleConfirmarCobro = async () => {
    if (!citaCobro || !citaCobro.paciente_id) return;
    const monto = parseFloat(montoCobro);
    if (isNaN(monto) || monto <= 0) {
      toast.error("Ingrese un monto válido");
      return;
    }

    setProcesandoCobro(true);
    try {
      const numeroFactura = `REC-${Date.now().toString().slice(-6)}`;
      // 1. Insertar factura pagada
      const { data: factura, error: errFac } = await db
        .from("facturas")
        .insert({
          paciente_id: citaCobro.paciente_id,
          monto_total: monto,
          monto_pagado: monto,
          descripcion: conceptoCobro,
          estado: "pagada",
          numero_factura: numeroFactura,
          aseguradora: aseguradora || null,
          numero_autorizacion: numAutorizacion || null,
          workspace_id: currentWorkspace?.id || null,
          sucursal_id: activeSucursalId || null,
          notas: `Cobro en recepción vía ${metodoPago.toUpperCase()}`,
        } as any)
        .select("id")
        .single();

      if (errFac) throw errFac;

      // 2. Registrar en tabla de pagos
      if (factura) {
        await db.from("pagos").insert({
          factura_id: factura.id,
          monto,
          metodo: metodoPago,
          referencia: numAutorizacion || `REC-${Date.now().toString().slice(-4)}`,
        } as any);
      }

      setUltimoRecibo({
        id: numeroFactura,
        paciente: `${citaCobro.pacientes?.nombre} ${citaCobro.pacientes?.apellido}`,
        monto,
        fecha: format(new Date(), "dd/MM/yyyy HH:mm"),
      });

      toast.success(`Cobro registrado con éxito (Recibo: ${numeroFactura})`);
      setCobroDialogOpen(false);
      cargarCitasHoy();
    } catch (err: any) {
      toast.error(err.message || "Error al procesar el cobro");
    } finally {
      setProcesandoCobro(false);
    }
  };

  // Registro Express de Paciente sin Cita
  const handleRegistroExpress = async () => {
    if (!regNombre.trim() || !regApellido.trim()) {
      toast.error("Nombre y apellido son obligatorios");
      return;
    }

    setGuardandoRegistro(true);
    try {
      // 1. Crear paciente rápido
      const { data: px, error: pxErr } = await db
        .from("pacientes")
        .insert({
          nombre: regNombre.trim(),
          apellido: regApellido.trim(),
          cedula: regCedula.trim() || null,
          numero_principal: regTelefono.trim() || null,
          contacto_px: regTelefono.trim() || null,
          workspace_id: currentWorkspace?.id || null,
          sucursal_id: activeSucursalId || null,
        } as any)
        .select("id")
        .single();

      if (pxErr) throw pxErr;

      // 2. Crear cita inmediata de hoy con estado "en_sala"
      const { error: visErr } = await db
        .from("control_visitas")
        .insert({
          paciente_id: px.id,
          profesional_id: regProfesionalId || null,
          fecha_hora_visita: new Date().toISOString(),
          estado: "en_sala",
          tipo_visita: "ambulatoria",
          motivo_visita: regMotivo.trim() || "Consulta Express",
          workspace_id: currentWorkspace?.id || null,
          sucursal_id: activeSucursalId || null,
          notas_visita: "Registro express en recepción sin cita previa",
        } as any);

      if (visErr) throw visErr;

      toast.success("Paciente registrado y añadido a Sala de Espera");
      setRegistroDialogOpen(false);
      setRegNombre("");
      setRegApellido("");
      setRegCedula("");
      setRegTelefono("");
      setRegProfesionalId("");
      cargarCitasHoy();
    } catch (err: any) {
      toast.error(err.message || "Error al registrar paciente");
    } finally {
      setGuardandoRegistro(false);
    }
  };

  // Métricas rápidas
  const totalHoy = citas.length;
  const enSala = citas.filter((c) => c.estado === "en_sala" || c.estado === "llegado").length;
  const atendidos = citas.filter((c) => c.estado === "realizada" || c.estado === "atendido").length;
  const pendientes = citas.filter((c) => c.estado === "pendiente" || c.estado === "confirmada").length;

  // Filtrado de citas
  const citasFiltradas = citas.filter((c) => {
    // Filtro estado
    if (filtroEstado === "sala" && c.estado !== "en_sala" && c.estado !== "llegado") return false;
    if (filtroEstado === "pendientes" && c.estado !== "pendiente" && c.estado !== "confirmada") return false;
    if (filtroEstado === "atendidos" && c.estado !== "realizada" && c.estado !== "atendido") return false;

    // Filtro búsqueda
    if (!busqueda.trim()) return true;
    const term = busqueda.toLowerCase();
    const nombreCompleto = `${c.pacientes?.nombre || ""} ${c.pacientes?.apellido || ""}`.toLowerCase();
    const cedula = (c.pacientes?.cedula || "").toLowerCase();
    const medico = `${c.personal_salud?.nombre || ""} ${c.personal_salud?.apellido || ""}`.toLowerCase();
    return nombreCompleto.includes(term) || cedula.includes(term) || medico.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards Modo B */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-none border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Citas Hoy</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{totalHoy}</div>
            <p className="text-xs text-muted-foreground mt-1">Programadas para el día</p>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-amber-500/30 bg-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">En Sala</span>
            <UserCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-300">{enSala}</div>
            <p className="text-xs text-muted-foreground mt-1">Esperando llamada médica</p>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Atendidos</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{atendidos}</div>
            <p className="text-xs text-muted-foreground mt-1">Consultas finalizadas</p>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-primary/30 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-primary uppercase tracking-wider">Pendientes</span>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-primary">{pendientes}</div>
            <p className="text-xs text-muted-foreground mt-1">Por presentarse</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Búsqueda, Filtros y Acciones */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por paciente, cédula o médico…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline" size="icon" onClick={cargarCitasHoy} title="Recargar">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-md border border-border p-1 bg-muted/30">
            <Button
              variant={filtroEstado === "todos" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFiltroEstado("todos")}
            >
              Todos ({totalHoy})
            </Button>
            <Button
              variant={filtroEstado === "sala" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFiltroEstado("sala")}
            >
              En Sala ({enSala})
            </Button>
            <Button
              variant={filtroEstado === "pendientes" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFiltroEstado("pendientes")}
            >
              Pendientes ({pendientes})
            </Button>
            <Button
              variant={filtroEstado === "atendidos" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFiltroEstado("atendidos")}
            >
              Atendidos ({atendidos})
            </Button>
          </div>

          <Button onClick={() => setRegistroDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Registro Express
          </Button>
        </div>
      </div>

      {/* Recibo Rápido Alert */}
      {ultimoRecibo && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-600" />
            <span>
              Último cobro: <strong>{ultimoRecibo.id}</strong> — {ultimoRecibo.paciente} (RD$ {ultimoRecibo.monto.toLocaleString()})
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={() => window.print()} className="h-7 gap-1">
            <Printer className="h-3 w-3" /> Imprimir Recibo
          </Button>
        </div>
      )}

      {/* Tabla de Llegadas del Día */}
      <Card className="shadow-none border border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Hora</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Profesional</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones de Recepción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Cargando llegadas del día…
                  </TableCell>
                </TableRow>
              ) : citasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No se encontraron citas para los criterios seleccionados.
                  </TableCell>
                </TableRow>
              ) : (
                citasFiltradas.map((cita) => {
                  const fecha = new Date(cita.fecha_hora_visita);
                  const retrasada = (cita.estado === "pendiente" || cita.estado === "confirmada") && isPast(fecha);

                  return (
                    <TableRow key={cita.id} className="hover:bg-muted/40 transition-colors">
                      {/* Hora */}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1.5 tabular-nums">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{format(fecha, "hh:mm a")}</span>
                        </div>
                        {retrasada && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5">
                            <AlertCircle className="h-2.5 w-2.5" /> Retraso
                          </span>
                        )}
                      </TableCell>

                      {/* Paciente */}
                      <TableCell>
                        <div className="font-semibold text-sm">
                          {cita.pacientes?.nombre} {cita.pacientes?.apellido}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          {cita.pacientes?.cedula && <span>Céd: {cita.pacientes.cedula}</span>}
                          {(cita.pacientes?.numero_principal || cita.pacientes?.contacto_px) && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-2.5 w-2.5" />
                              {cita.pacientes?.numero_principal || cita.pacientes?.contacto_px}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Profesional */}
                      <TableCell>
                        <div className="text-sm">
                          {cita.personal_salud
                            ? `Dr(a). ${cita.personal_salud.nombre} ${cita.personal_salud.apellido}`
                            : "Por asignar"}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {cita.tipo_visita || "Ambulatoria"}
                        </div>
                      </TableCell>

                      {/* Estado */}
                      <TableCell>
                        {cita.estado === "en_sala" || cita.estado === "llegado" ? (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                            En Sala de Espera
                          </Badge>
                        ) : cita.estado === "realizada" || cita.estado === "atendido" ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                            ✓ Atendido
                          </Badge>
                        ) : cita.estado === "cancelada" ? (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            Cancelada
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right space-x-1">
                        {/* Botón Marcar Llegada */}
                        {cita.estado !== "en_sala" && cita.estado !== "llegado" && cita.estado !== "realizada" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleMarcarLlegada(cita.id)}
                            className="bg-amber-600 hover:bg-amber-700 text-white h-8 text-xs"
                          >
                            <UserCheck className="h-3.5 w-3.5 mr-1" />
                            Marcar Llegada
                          </Button>
                        )}

                        {/* Botón Marcar Atendido */}
                        {(cita.estado === "en_sala" || cita.estado === "llegado") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarcarAtendido(cita.id)}
                            className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 h-8 text-xs"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Atendido
                          </Button>
                        )}

                        {/* Botón Cobro Express */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => abrirCobro(cita)}
                          className="h-8 text-xs gap-1"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          Cobro Express
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL COBRO EXPRESS */}
      <Dialog open={cobroDialogOpen} onOpenChange={setCobroDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Cobro Express en Recepción
            </DialogTitle>
            <DialogDescription>
              Asiente el cobro de consulta o copago y emita comprobante de pago de inmediato.
            </DialogDescription>
          </DialogHeader>

          {citaCobro && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted/40 rounded-lg text-sm">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Paciente</span>
                <p className="font-semibold text-base">
                  {citaCobro.pacientes?.nombre} {citaCobro.pacientes?.apellido}
                </p>
                {citaCobro.personal_salud && (
                  <p className="text-xs text-muted-foreground">
                    Médico: Dr(a). {citaCobro.personal_salud.nombre} {citaCobro.personal_salud.apellido}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Monto (RD$)</Label>
                  <Input
                    type="number"
                    value={montoCobro}
                    onChange={(e) => setMontoCobro(e.target.value)}
                    className="font-mono text-base font-semibold"
                    placeholder="1500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Método de Pago</Label>
                  <Select value={metodoPago} onValueChange={setMetodoPago}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta (POS)</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="seguro">Seguro / ARS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Concepto</Label>
                <Input
                  value={conceptoCobro}
                  onChange={(e) => setConceptoCobro(e.target.value)}
                  placeholder="Ej: Copago Consulta Especialidad"
                />
              </div>

              {metodoPago === "seguro" && (
                <div className="grid grid-cols-2 gap-3 border-t pt-3">
                  <div className="space-y-1.5">
                    <Label>Aseguradora / ARS</Label>
                    <Input
                      value={aseguradora}
                      onChange={(e) => setAseguradora(e.target.value)}
                      placeholder="Ej: ARS Universal"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>No. Autorización</Label>
                    <Input
                      value={numAutorizacion}
                      onChange={(e) => setNumAutorizacion(e.target.value)}
                      placeholder="Ej: AUT-89421"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCobroDialogOpen(false)} disabled={procesandoCobro}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarCobro}
              disabled={procesandoCobro}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              {procesandoCobro ? "Procesando…" : "Confirmar Cobro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL REGISTRO EXPRESS (WALK-IN) */}
      <Dialog open={registroDialogOpen} onOpenChange={setRegistroDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Registro Express (Sin Cita Previa)
            </DialogTitle>
            <DialogDescription>
              Registre al paciente y colóquelo inmediatamente en la Sala de Espera de hoy.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nombre *</Label>
                <Input
                  value={regNombre}
                  onChange={(e) => setRegNombre(e.target.value)}
                  placeholder="Nombre"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Apellido *</Label>
                <Input
                  value={regApellido}
                  onChange={(e) => setRegApellido(e.target.value)}
                  placeholder="Apellido"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cédula</Label>
                <Input
                  value={regCedula}
                  onChange={(e) => setRegCedula(e.target.value)}
                  placeholder="001-0000000-0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input
                  value={regTelefono}
                  onChange={(e) => setRegTelefono(e.target.value)}
                  placeholder="809-000-0000"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Médico Disponible</Label>
              <Select value={regProfesionalId} onValueChange={setRegProfesionalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione médico de turno" />
                </SelectTrigger>
                <SelectContent>
                  {profesionales.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      Dr(a). {p.nombre} {p.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Motivo de Consulta</Label>
              <Input
                value={regMotivo}
                onChange={(e) => setRegMotivo(e.target.value)}
                placeholder="Ej: Dolor agudo, Consulta sin cita"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRegistroDialogOpen(false)} disabled={guardandoRegistro}>
              Cancelar
            </Button>
            <Button
              onClick={handleRegistroExpress}
              disabled={guardandoRegistro}
              className="gap-2"
            >
              <UserCheck className="h-4 w-4" />
              {guardandoRegistro ? "Guardando…" : "Registrar y Enviar a Sala"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
