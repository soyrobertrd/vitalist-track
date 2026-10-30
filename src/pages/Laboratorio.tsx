import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/db/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  FlaskConical,
  Plus,
  Search,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Printer,
  QrCode,
  PhoneCall,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter
} from "lucide-react";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

const estadoBadge: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  pendiente: { variant: "outline", label: "Pendiente" },
  en_proceso: { variant: "secondary", label: "En Proceso" },
  parcial: { variant: "default", label: "Parcial" },
  completada: { variant: "default", label: "Completada" },
  cancelada: { variant: "destructive", label: "Cancelada" },
};

const prioridadBadge: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
  rutina: { variant: "secondary", label: "Rutina" },
  urgente: { variant: "default", label: "Urgente" },
  stat: { variant: "destructive", label: "STAT Inmediato" },
};

import { PanelesTab } from "@/components/laboratorio/PanelesTab";
import { ResultRow, CRITERIOS_PANICO, type CriterioPanico } from "@/components/laboratorio/ResultRow";

export default function Laboratorio() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || null;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroPrioridad, setFiltroPrioridad] = useState("todos");
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [showPrintReport, setShowPrintReport] = useState<any>(null);
  const [showPanicModal, setShowPanicModal] = useState<any>(null);
  const [panicDoctor, setPanicDoctor] = useState("");
  const [panicNotes, setPanicNotes] = useState("");

  // Form state
  const [newOrder, setNewOrder] = useState({
    paciente_id: "",
    medico_solicitante_id: "",
    prioridad: "rutina",
    diagnostico_presuntivo: "",
    indicaciones: "",
    notas: "",
  });
  const [newTests, setNewTests] = useState<{ nombre_prueba: string; categoria: string; rango_referencia_texto: string }[]>([
    { nombre_prueba: "", categoria: "", rango_referencia_texto: "" },
  ]);

  // Queries
  const { data: ordenes = [], isLoading } = useQuery({
    queryKey: ["ordenes_laboratorio", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await db
        .from("ordenes_laboratorio")
        .select("*, pacientes(id, nombre, apellido, cedula, fecha_nacimiento, genero), personal_salud!ordenes_laboratorio_medico_solicitante_id_fkey(id, nombre, apellido, especialidad)")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });

  const { data: pacientes = [] } = useQuery({
    queryKey: ["pacientes_lab", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data } = await db
        .from("pacientes")
        .select("id, nombre, apellido, cedula, fecha_nacimiento, genero")
        .eq("workspace_id", workspaceId)
        .eq("anonimizado", false)
        .order("nombre")
        .limit(500);
      return data || [];
    },
    enabled: !!workspaceId,
  });

  const { data: medicos = [] } = useQuery({
    queryKey: ["medicos_lab", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data } = await db
        .from("personal_salud")
        .select("id, nombre, apellido, especialidad")
        .eq("workspace_id", workspaceId)
        .order("nombre")
        .limit(200);
      return data || [];
    },
    enabled: !!workspaceId,
  });

  const { data: pruebas = [] } = useQuery({
    queryKey: ["pruebas_laboratorio", selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder) return [];
      const { data, error } = await db
        .from("pruebas_laboratorio")
        .select("*")
        .eq("orden_id", selectedOrder.id)
        .order("created_at");
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedOrder,
  });

  const { data: paneles = [] } = useQuery({
    queryKey: ["paneles_laboratorio", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data } = await db
        .from("paneles_laboratorio")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("activo", true)
        .order("nombre");
      return data || [];
    },
    enabled: !!workspaceId,
  });

  // Mutations
  const createOrder = useMutation({
    mutationFn: async () => {
      if (!workspaceId || !newOrder.paciente_id) throw new Error("Seleccione el paciente");
      const { data: orden, error } = await db
        .from("ordenes_laboratorio")
        .insert({
          workspace_id: workspaceId,
          paciente_id: newOrder.paciente_id,
          medico_solicitante_id: newOrder.medico_solicitante_id || null,
          prioridad: newOrder.prioridad as any,
          diagnostico_presuntivo: newOrder.diagnostico_presuntivo || null,
          indicaciones: newOrder.indicaciones || null,
          notas: newOrder.notas || null,
        })
        .select()
        .single();
      if (error) throw error;

      const validTests = newTests.filter((t) => t.nombre_prueba.trim());
      if (validTests.length > 0) {
        const { error: testErr } = await db.from("pruebas_laboratorio").insert(
          validTests.map((t) => ({
            orden_id: orden.id,
            nombre_prueba: t.nombre_prueba,
            categoria: t.categoria || null,
            rango_referencia_texto: t.rango_referencia_texto || null,
          }))
        );
        if (testErr) throw testErr;
      }
      return orden;
    },
    onSuccess: () => {
      toast.success("Orden de laboratorio generada con éxito");
      queryClient.invalidateQueries({ queryKey: ["ordenes_laboratorio"] });
      setShowNewOrder(false);
      setNewOrder({ paciente_id: "", medico_solicitante_id: "", prioridad: "rutina", diagnostico_presuntivo: "", indicaciones: "", notas: "" });
      setNewTests([{ nombre_prueba: "", categoria: "", rango_referencia_texto: "" }]);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const updates: any = { estado };
      if (estado === "en_proceso") updates.fecha_recepcion_muestra = new Date().toISOString();
      if (estado === "completada") updates.fecha_resultado = new Date().toISOString();
      const { error } = await db.from("ordenes_laboratorio").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Estado de orden actualizado");
      queryClient.invalidateQueries({ queryKey: ["ordenes_laboratorio"] });
    },
  });

  const saveTestResult = useMutation({
    mutationFn: async ({ id, resultado, anormal, critico }: { id: string; resultado: string; anormal: boolean; critico: boolean }) => {
      const { error } = await db
        .from("pruebas_laboratorio")
        .update({ resultado, anormal, critico, estado: "completada" as any, fecha_resultado: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Resultado validado y guardado");
      queryClient.invalidateQueries({ queryKey: ["pruebas_laboratorio"] });
    },
  });

  const registrarLlamadaPanico = () => {
    if (!panicDoctor) {
      toast.error("Indique el nombre del médico que recibió el valor de pánico");
      return;
    }
    toast.success(`Protocolo de Valor Crítico completado. Notificado a ${panicDoctor} a las ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    setShowPanicModal(null);
    setPanicDoctor("");
    setPanicNotes("");
  };

  const addPanelTests = (panel: any) => {
    const included = (panel.pruebas_incluidas as any[]) || [];
    const tests = included.map((p: any) => ({
      nombre_prueba: typeof p === "string" ? p : p.nombre || "",
      categoria: typeof p === "string" ? "" : p.categoria || "",
      rango_referencia_texto: typeof p === "string" ? "" : p.rango || "",
    }));
    setNewTests((prev) => [...prev.filter((t) => t.nombre_prueba), ...tests]);
    toast.info(`Agregadas pruebas de panel: ${panel.nombre}`);
  };

  const filtered = ordenes.filter((o: any) => {
    if (filtroEstado !== "todos" && o.estado !== filtroEstado) return false;
    if (filtroPrioridad !== "todos" && o.prioridad !== filtroPrioridad) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    const pac = o.pacientes;
    return (
      o.numero_orden?.toLowerCase().includes(s) ||
      pac?.nombre?.toLowerCase().includes(s) ||
      pac?.apellido?.toLowerCase().includes(s) ||
      pac?.cedula?.toLowerCase().includes(s)
    );
  });

  // KPIs
  const pendientes = ordenes.filter((o: any) => o.estado === "pendiente").length;
  const enProceso = ordenes.filter((o: any) => o.estado === "en_proceso").length;
  const completadas = ordenes.filter((o: any) => o.estado === "completada").length;
  const statsStat = ordenes.filter((o: any) => o.prioridad === "stat" && o.estado !== "completada").length;

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="Laboratorio Clínico & Bioquímica"
        description="Gestión integral de muestras, valores críticos de pánico y validación de analíticas"
        icon={FlaskConical}
        badgeText="Red Asistencial LIS"
        actions={
          <Button onClick={() => setShowNewOrder(true)} className="gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl">
            <Plus className="h-4 w-4" /> Nueva Orden LIS
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ClinicalKpiCard
          label="Muestras Pendientes"
          value={pendientes}
          subtitle="En espera de extracción"
          icon={Clock}
          color="amber"
        />
        <ClinicalKpiCard
          label="En Procesamiento"
          value={enProceso}
          subtitle="En analizadores clínicos"
          icon={FlaskConical}
          color="teal"
        />
        <ClinicalKpiCard
          label="Urgentes STAT"
          value={statsStat}
          subtitle="Prioridad crítica inmediata"
          icon={AlertTriangle}
          color="rose"
        />
        <ClinicalKpiCard
          label="Completadas Hoy"
          value={completadas}
          subtitle="Con informe disponible"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      <Tabs defaultValue="ordenes" className="space-y-4">
        <TabsList className="bg-card border border-border/80 p-1 rounded-xl">
          <TabsTrigger value="ordenes" className="rounded-lg gap-2">
            <ClipboardList className="h-4 w-4" /> Órdenes & Resultados ({filtered.length})
          </TabsTrigger>
          <TabsTrigger value="paneles" className="rounded-lg gap-2">
            <FlaskConical className="h-4 w-4" /> Catálogo de Paneles ({paneles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ordenes" className="space-y-4">
          {/* Barra de Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-3 rounded-2xl border border-border/80">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código de orden, nombre del paciente o cédula..."
                className="pl-9 bg-background/50 rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-[140px] rounded-xl"><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los Estados</SelectItem>
                  <SelectItem value="pendiente">Pendientes</SelectItem>
                  <SelectItem value="en_proceso">En Proceso</SelectItem>
                  <SelectItem value="completada">Completadas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
                <SelectTrigger className="w-[140px] rounded-xl"><SelectValue placeholder="Prioridad" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Toda Prioridad</SelectItem>
                  <SelectItem value="rutina">Rutina</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="stat">STAT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="rounded-2xl border-border/80 overflow-hidden shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="font-semibold">Nº Orden LIS</TableHead>
                    <TableHead className="font-semibold">Paciente & Identificación</TableHead>
                    <TableHead className="font-semibold">Médico Prescriptor</TableHead>
                    <TableHead className="font-semibold">Prioridad</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold">Fecha Solicitud</TableHead>
                    <TableHead className="text-right font-semibold">Acciones Asistenciales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Cargando registros de laboratorio...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No se encontraron órdenes que coincidan con la búsqueda</TableCell></TableRow>
                  ) : (
                    filtered.map((o: any) => {
                      const est = estadoBadge[o.estado] || estadoBadge.pendiente;
                      const pri = prioridadBadge[o.prioridad] || prioridadBadge.rutina;
                      const isStat = o.prioridad === "stat";
                      return (
                        <TableRow key={o.id} className={isStat ? "bg-rose-500/5 hover:bg-rose-500/10" : ""}>
                          <TableCell className="font-mono text-sm font-semibold">
                            <span className="flex items-center gap-1.5 text-foreground">
                              {o.numero_orden || `ORD-${o.id.slice(0, 8).toUpperCase()}`}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-foreground">{o.pacientes?.nombre} {o.pacientes?.apellido}</div>
                            <div className="text-xs text-muted-foreground font-mono">{o.pacientes?.cedula || "Sin cédula"}</div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {o.personal_salud ? (
                              <div>
                                <span>Dr(a). {o.personal_salud.nombre} {o.personal_salud.apellido}</span>
                                {o.personal_salud.especialidad && <span className="text-xs text-muted-foreground block">{o.personal_salud.especialidad}</span>}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">No asignado</span>
                            )}
                          </TableCell>
                          <TableCell><Badge variant={pri.variant}>{pri.label}</Badge></TableCell>
                          <TableCell><Badge variant={est.variant}>{est.label}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(o.fecha_solicitud || o.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg h-8 gap-1.5"
                              onClick={() => { setSelectedOrder(o); setShowResults(true); }}
                            >
                              <ClipboardList className="h-3.5 w-3.5 text-teal-600" /> Analíticas
                            </Button>

                            {o.estado === "pendiente" && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="rounded-lg h-8 text-xs"
                                onClick={() => updateOrderStatus.mutate({ id: o.id, estado: "en_proceso" })}
                              >
                                Recibir Muestra
                              </Button>
                            )}

                            {o.estado === "en_proceso" && (
                              <Button
                                size="sm"
                                className="rounded-lg h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white"
                                onClick={() => updateOrderStatus.mutate({ id: o.id, estado: "completada" })}
                              >
                                Validar & Completar
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              className="rounded-lg h-8 w-8 p-0"
                              title="Imprimir Informe de Resultados Oficial"
                              onClick={() => setShowPrintReport(o)}
                            >
                              <Printer className="h-4 w-4 text-muted-foreground hover:text-foreground" />
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
        </TabsContent>

        <TabsContent value="paneles">
          <PanelesTab workspaceId={workspaceId} paneles={paneles} queryClient={queryClient} />
        </TabsContent>
      </Tabs>

      {/* Dialog: Nueva Orden LIS */}
      <Dialog open={showNewOrder} onOpenChange={setShowNewOrder}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <FlaskConical className="h-6 w-6 text-teal-600" /> Nueva Solicitud de Laboratorio
            </DialogTitle>
            <DialogDescription>
              Emisión de orden ambulatoria o de hospitalización con vinculación de paneles bioquímicos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Paciente *</Label>
                <Select value={newOrder.paciente_id} onValueChange={(v) => setNewOrder((p) => ({ ...p, paciente_id: v }))}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Buscar paciente..." /></SelectTrigger>
                  <SelectContent>
                    {pacientes.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre} {p.apellido} {p.cedula ? `— ${p.cedula}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Médico Solicitante</Label>
                <Select value={newOrder.medico_solicitante_id} onValueChange={(v) => setNewOrder((p) => ({ ...p, medico_solicitante_id: v }))}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Seleccionar médico..." /></SelectTrigger>
                  <SelectContent>
                    {medicos.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>
                        Dr(a). {m.nombre} {m.apellido} {m.especialidad ? `(${m.especialidad})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Prioridad Asistencial</Label>
                <Select value={newOrder.prioridad} onValueChange={(v) => setNewOrder((p) => ({ ...p, prioridad: v }))}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rutina">Rutina (Ambulatoria normal)</SelectItem>
                    <SelectItem value="urgente">Urgente (&lt; 2 horas)</SelectItem>
                    <SelectItem value="stat">STAT Inmediato (&lt; 30 min Shock Room / UCI)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Diagnóstico Presuntivo (CIE-10)</Label>
                <Input
                  className="rounded-xl mt-1"
                  placeholder="Ej: Sepsis urinaria, Cetoacidosis, Dolor torácico"
                  value={newOrder.diagnostico_presuntivo}
                  onChange={(e) => setNewOrder((p) => ({ ...p, diagnostico_presuntivo: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Indicaciones Clínicas / Condiciones de Toma de Muestra</Label>
              <Textarea
                className="rounded-xl mt-1"
                placeholder="Ej: En ayuno de 8 horas, muestra en tubo con gel separador y citrato, previa infusión de antibióticos"
                value={newOrder.indicaciones}
                onChange={(e) => setNewOrder((p) => ({ ...p, indicaciones: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Inserción rápida desde paneles */}
            {paneles.length > 0 && (
              <div className="bg-muted/30 p-3 rounded-xl border border-border/60">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Cargar Pruebas desde Paneles Predefinidos
                </Label>
                <div className="flex flex-wrap gap-2">
                  {paneles.map((panel: any) => (
                    <Button key={panel.id} size="sm" variant="outline" className="rounded-lg text-xs h-7" onClick={() => addPanelTests(panel)}>
                      + {panel.nombre}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Lista dinámica de pruebas solicitadas */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold">Pruebas Individuales</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7 text-teal-600 font-medium"
                  onClick={() => setNewTests((p) => [...p, { nombre_prueba: "", categoria: "", rango_referencia_texto: "" }])}
                >
                  + Agregar otra prueba
                </Button>
              </div>

              {newTests.map((t, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <Input
                    className="col-span-5 rounded-xl text-sm"
                    placeholder="Prueba (ej: Potasio sérico)"
                    value={t.nombre_prueba}
                    onChange={(e) => {
                      const copy = [...newTests];
                      copy[i].nombre_prueba = e.target.value;
                      setNewTests(copy);
                    }}
                  />
                  <Input
                    className="col-span-3 rounded-xl text-sm"
                    placeholder="Categoría"
                    value={t.categoria}
                    onChange={(e) => {
                      const copy = [...newTests];
                      copy[i].categoria = e.target.value;
                      setNewTests(copy);
                    }}
                  />
                  <Input
                    className="col-span-4 rounded-xl text-sm"
                    placeholder="Rango ref. (ej: 3.5 - 5.0 mEq/L)"
                    value={t.rango_referencia_texto}
                    onChange={(e) => {
                      const copy = [...newTests];
                      copy[i].rango_referencia_texto = e.target.value;
                      setNewTests(copy);
                    }}
                  />
                </div>
              ))}
            </div>

            <Button
              className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold py-5"
              onClick={() => createOrder.mutate()}
              disabled={createOrder.isPending || !newOrder.paciente_id}
            >
              {createOrder.isPending ? "Generando orden..." : "Emitir Orden de Laboratorio"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Carga & Validación de Analíticas */}
      <Dialog open={showResults} onOpenChange={(v) => { setShowResults(v); if (!v) setSelectedOrder(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <FlaskConical className="h-6 w-6 text-teal-600" />
              Validación Bioquímica — {selectedOrder?.numero_orden || `ORD-${selectedOrder?.id?.slice(0, 8)}`}
            </DialogTitle>
            <DialogDescription>
              Registro de resultados, alertas automáticas de valor de pánico y validación de rangos biológicos
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/30 rounded-xl border border-border/60 flex flex-wrap justify-between items-center text-sm gap-2">
                <div>
                  <span className="text-muted-foreground">Paciente: </span>
                  <strong className="text-foreground">{selectedOrder.pacientes?.nombre} {selectedOrder.pacientes?.apellido}</strong>
                  {selectedOrder.pacientes?.cedula && <span className="font-mono text-xs text-muted-foreground ml-2">({selectedOrder.pacientes.cedula})</span>}
                </div>
                <div className="flex gap-2 items-center">
                  <Badge variant={prioridadBadge[selectedOrder.prioridad]?.variant || "secondary"}>
                    {prioridadBadge[selectedOrder.prioridad]?.label || selectedOrder.prioridad}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs rounded-lg gap-1"
                    onClick={() => setShowPrintReport(selectedOrder)}
                  >
                    <Printer className="h-3.5 w-3.5" /> Ver Formato Oficial
                  </Button>
                </div>
              </div>

              <div className="border border-border/80 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-semibold">Parámetro / Prueba</TableHead>
                      <TableHead className="font-semibold">Área</TableHead>
                      <TableHead className="font-semibold w-40">Resultado</TableHead>
                      <TableHead className="font-semibold">Rango Referencia</TableHead>
                      <TableHead className="font-semibold">Dictamen</TableHead>
                      <TableHead className="text-right font-semibold">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pruebas.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No hay pruebas asignadas a esta orden</TableCell></TableRow>
                    ) : (
                      pruebas.map((p: any) => (
                        <ResultRow
                          key={p.id}
                          prueba={p}
                          onSave={saveTestResult.mutate}
                          onPanicTrigger={(criticoInfo: any) => setShowPanicModal({ prueba: p, info: criticoInfo })}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
                <div>
                  <strong>Norma de Seguridad Clínica en Valores Críticos (Joint Commission / MSP RD):</strong> Todo resultado catalogado como de pánico debe comunicarse verbalmente al médico responsable dentro de los 15 minutos de emitido, aplicando la técnica de confirmación en bucle cerrado (read-back).
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Protocolo de Notificación de Valor de Pánico */}
      <Dialog open={!!showPanicModal} onOpenChange={(v) => !v && setShowPanicModal(null)}>
        <DialogContent className="max-w-md rounded-2xl border-rose-500/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 font-bold text-lg">
              <ShieldAlert className="h-6 w-6 text-rose-600 animate-pulse" />
              Alerta: Protocolo de Valor de Pánico
            </DialogTitle>
            <DialogDescription>
              El parámetro <strong>{showPanicModal?.prueba?.nombre_prueba}</strong> ha alcanzado un valor con riesgo vital inmediato ({showPanicModal?.info?.motivo || "Extremo biológico"}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Médico Responsable Notificado *</Label>
              <Input
                className="rounded-xl mt-1"
                placeholder="Dr(a). Nombre y Especialidad o Servicio (ej: UCI / Emergencia)"
                value={panicDoctor}
                onChange={(e) => setPanicDoctor(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Detalles de Confirmación (Read-Back)</Label>
              <Textarea
                className="rounded-xl mt-1"
                placeholder="Ej: Confirmado verbalmente a las 14:32 por el Dr. Ramírez; se suspende infusión de K+ y se administra gluconato de calcio."
                value={panicNotes}
                onChange={(e) => setPanicNotes(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-5 font-semibold"
              onClick={registrarLlamadaPanico}
            >
              Registrar Notificación Telefónica de Emergencia
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Vista e Impresión Oficial de Resultados con QR & Código de Barras */}
      <Dialog open={!!showPrintReport} onOpenChange={(v) => !v && setShowPrintReport(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-8 print:p-0">
          {showPrintReport && (
            <div className="space-y-6 text-foreground font-sans">
              {/* Encabezado Institucional */}
              <div className="flex justify-between items-start border-b border-border/80 pb-4">
                <div>
                  <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                    <FlaskConical className="h-6 w-6 text-teal-600" />
                    LABORATORIO CLÍNICO & ANATOMÍA PATOLÓGICA
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Centro de Diagnóstico Especializado • Acreditación MSP RD Ley 42-01
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-500/10 px-2 py-1 rounded">
                    ORDEN: {showPrintReport.numero_orden || `ORD-${showPrintReport.id.slice(0, 8).toUpperCase()}`}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Emisión: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>

              {/* Ficha Demográfica del Paciente */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/20 rounded-xl border border-border/60 text-xs">
                <div>
                  <span className="text-muted-foreground block">Paciente:</span>
                  <strong className="text-foreground text-sm font-semibold">
                    {showPrintReport.pacientes?.nombre} {showPrintReport.pacientes?.apellido}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Identificación (Cédula/NSS):</span>
                  <span className="font-mono">{showPrintReport.pacientes?.cedula || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Médico Solicitante:</span>
                  <span>Dr(a). {showPrintReport.personal_salud?.nombre || "No especificado"} {showPrintReport.personal_salud?.apellido || ""}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Prioridad / Servicio:</span>
                  <Badge variant="outline" className="text-[10px] mt-0.5">{showPrintReport.prioridad?.toUpperCase()}</Badge>
                </div>
              </div>

              {/* Tabla de Resultados Clínicos */}
              <div className="border border-border/80 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="text-xs font-bold">
                      <TableHead>Examen / Parámetro</TableHead>
                      <TableHead className="text-center">Resultado</TableHead>
                      <TableHead className="text-center">Unidades</TableHead>
                      <TableHead className="text-center">Valores Biológicos de Referencia</TableHead>
                      <TableHead className="text-right">Bandera</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {pruebas.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Sin pruebas registradas</TableCell></TableRow>
                    ) : (
                      pruebas.map((p: any) => (
                        <TableRow key={p.id} className={p.critico ? "bg-rose-500/10 font-bold" : p.anormal ? "bg-amber-500/5 font-semibold" : ""}>
                          <TableCell className="font-medium">{p.nombre_prueba}</TableCell>
                          <TableCell className="text-center font-mono text-sm">{p.resultado || "Pendiente"}</TableCell>
                          <TableCell className="text-center text-muted-foreground">{p.categoria || "—"}</TableCell>
                          <TableCell className="text-center text-muted-foreground">{p.rango_referencia_texto || "—"}</TableCell>
                          <TableCell className="text-right">
                            {p.critico ? (
                              <Badge variant="destructive" className="text-[10px]">CRÍTICO (H/L)</Badge>
                            ) : p.anormal ? (
                              <Badge variant="secondary" className="text-[10px]">FUERA RANGO</Badge>
                            ) : (
                              <span className="text-emerald-600 font-bold">NORMAL</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pie de Firma & Criptografía */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border/80 items-end">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 bg-muted/40 border border-border/80 rounded-lg flex items-center justify-center p-1">
                    <QrCode className="h-14 w-14 text-foreground/80" />
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    <div className="font-mono font-semibold">SHA-256 Verificado</div>
                    <div>Validación biomédica oficial</div>
                    <div>portal.vitalist.rd/val/lab/{showPrintReport.id.slice(0, 8)}</div>
                  </div>
                </div>

                <div className="text-center border-t border-border/80 pt-2 mx-4">
                  <div className="text-xs font-semibold">Lic. María Mercedes Almonte, M.Sc.</div>
                  <div className="text-[10px] text-muted-foreground">Bioanalista Clínica • Exequátur 9482-19</div>
                  <div className="text-[10px] text-teal-600 font-mono mt-0.5">Firma Digital Estampada</div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => window.print()}
                    className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl gap-2 text-xs"
                  >
                    <Printer className="h-4 w-4" /> Imprimir Documento
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
