import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  ShieldCheck, 
  Camera, 
  CreditCard, 
  Clock, 
  Plus, 
  Search, 
  Lock, 
  DoorClosed, 
  UserCheck, 
  AlertCircle, 
  PieChart as PieChartIcon,
  ArrowDownLeft,
  ArrowUpRight
} from "lucide-react";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from "recharts";

const NIVELES_ACCESO = [
  { value: "publico", label: "Público / Abierto", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  { value: "restringido", label: "Restringido (Personal Autorizado)", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  { value: "critico", label: "Zona Crítica / Alto Riesgo", color: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40" }
];

const ESTADOS_CREDENCIAL = [
  { value: "activa", label: "Activa", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  { value: "suspendida", label: "Suspendida", color: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  { value: "revocada", label: "Revocada", color: "bg-rose-500/15 text-rose-700 border-rose-500/40" },
  { value: "vencida", label: "Vencida", color: "bg-muted text-muted-foreground" }
];

const PALETA_GRAFICOS = ["#0d9488", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function SeguridadFisica() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("bitacora");
  const [search, setSearch] = useState("");

  const [showNewAcceso, setShowNewAcceso] = useState(false);
  const [showNewCred, setShowNewCred] = useState(false);

  // Formularios
  const [formDataAcceso, setFormDataAcceso] = useState({
    persona_nombre: "",
    tipo_persona: "Visitante Familiar",
    metodo_verificacion: "Cédula / Documento",
    tipo: "entrada",
    motivo_visita: "Visita a paciente hospitalizado",
    area_destino: "Hospitalización Piso 2"
  });

  const [formDataCred, setFormDataCred] = useState({
    persona_nombre: "",
    codigo_credencial: `CR-${Date.now().toString().slice(-4)}`,
    tipo: "Personal de Salud",
    fecha_vencimiento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  });

  // Queries
  const { data: areas = [], isLoading: loadingAreas } = useQuery({
    queryKey: ["areas_seguridad", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("areas_seguridad" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("nombre");
      return (data || []) as any[];
    }
  });

  const { data: bitacora = [], isLoading: loadingBitacora } = useQuery({
    queryKey: ["bitacora_accesos", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("bitacora_accesos" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("fecha_hora", { ascending: false })
        .limit(150);
      return (data || []) as any[];
    }
  });

  const { data: credenciales = [], isLoading: loadingCred } = useQuery({
    queryKey: ["credenciales_acceso", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("credenciales_acceso" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    }
  });

  // Mutación: Registrar Acceso
  const crearAcceso = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error("Workspace no activo");
      const num = `ACC-${Date.now().toString().slice(-6)}`;
      const { error } = await supabase.from("bitacora_accesos" as any).insert({
        workspace_id: currentWorkspace.id,
        numero: num,
        persona_nombre: formDataAcceso.persona_nombre,
        tipo_persona: formDataAcceso.tipo_persona,
        metodo_verificacion: formDataAcceso.metodo_verificacion,
        tipo: formDataAcceso.tipo,
        motivo_visita: formDataAcceso.motivo_visita,
        fecha_hora: new Date().toISOString()
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bitacora_accesos"] });
      toast.success("Registro de acceso completado");
      setShowNewAcceso(false);
      setFormDataAcceso({
        persona_nombre: "",
        tipo_persona: "Visitante Familiar",
        metodo_verificacion: "Cédula / Documento",
        tipo: "entrada",
        motivo_visita: "Visita a paciente hospitalizado",
        area_destino: "Hospitalización Piso 2"
      });
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  // Mutación: Emitir Credencial
  const crearCredencial = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error("Workspace no activo");
      const { error } = await supabase.from("credenciales_acceso" as any).insert({
        workspace_id: currentWorkspace.id,
        persona_nombre: formDataCred.persona_nombre,
        codigo_credencial: formDataCred.codigo_credencial,
        tipo: formDataCred.tipo,
        fecha_vencimiento: formDataCred.fecha_vencimiento,
        estado: "activa"
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credenciales_acceso"] });
      toast.success("Credencial hospitalaria emitida");
      setShowNewCred(false);
      setFormDataCred({
        persona_nombre: "",
        codigo_credencial: `CR-${Date.now().toString().slice(-4)}`,
        tipo: "Personal de Salud",
        fecha_vencimiento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      });
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  // KPIs
  const areasCriticas = areas.filter(a => a.nivel_acceso === "critico").length;
  const totalCamaras = areas.reduce((acc, a) => acc + (a.cantidad_camaras || 0), 0);
  const accesosHoy = bitacora.length;
  const credencialesActivas = credenciales.filter(c => c.estado === "activa").length;

  // Filtros
  const bitacoraFiltrada = useMemo(() => {
    return bitacora.filter(b => {
      if (!search) return true;
      const full = `${b.numero || ""} ${b.persona_nombre || ""} ${b.tipo_persona || ""} ${b.motivo_visita || ""}`.toLowerCase();
      return full.includes(search.toLowerCase());
    });
  }, [bitacora, search]);

  const credencialesFiltradas = useMemo(() => {
    return credenciales.filter(c => {
      if (!search) return true;
      const full = `${c.persona_nombre || ""} ${c.codigo_credencial || ""} ${c.tipo || ""}`.toLowerCase();
      return full.includes(search.toLowerCase());
    });
  }, [credenciales, search]);

  // Gráficos
  const datosPorTipoPersona = useMemo(() => {
    const counts: Record<string, number> = {};
    bitacora.forEach(b => {
      const tipo = b.tipo_persona || "Visitante";
      counts[tipo] = (counts[tipo] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [bitacora]);

  const datosCamarasPorArea = useMemo(() => {
    return areas
      .filter(a => (a.cantidad_camaras || 0) > 0)
      .slice(0, 6)
      .map(a => ({
        name: a.nombre,
        camaras: a.cantidad_camaras || 0
      }));
  }, [areas]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      <ClinicalPageHeader
        title="Seguridad Física & Control de Accesos"
        subtitle="Monitoreo de perímetros asistenciales, bitácora de visitantes, credencialización y CCTV"
        badge="Seguridad & Vigilancia"
        icon={ShieldCheck}
        action={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="rounded-xl border-border/80 shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setShowNewCred(true)}
            >
              <CreditCard className="h-4 w-4 mr-1.5 text-teal-600" />
              Nueva Credencial
            </Button>
            <Button 
              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setShowNewAcceso(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Registrar Acceso
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Zonas de Acceso Controlado"
          value={areas.length}
          subtitle={`${areasCriticas} clasificadas como críticas / alto riesgo`}
          icon={DoorClosed}
          variant="teal"
        />
        <ClinicalKpiCard
          title="Dispositivos CCTV / Cámaras"
          value={totalCamaras}
          subtitle="Circuito cerrado de vigilancia activo"
          icon={Camera}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Accesos Registrados en Turno"
          value={accesosHoy}
          subtitle="Entradas y salidas verificadas"
          icon={Clock}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Credenciales Activas"
          value={credencialesActivas}
          subtitle="Pases autorizados vigentes"
          icon={CreditCard}
          variant="emerald"
        />
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, código de pase o credencial..."
            className="pl-9 rounded-xl border-border/80 bg-background/50 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Pestañas */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl border border-border/60">
          <TabsTrigger value="bitacora" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Clock className="h-4 w-4 mr-1.5 text-teal-600" />
            Bitácora de Accesos ({bitacoraFiltrada.length})
          </TabsTrigger>
          <TabsTrigger value="areas" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <DoorClosed className="h-4 w-4 mr-1.5 text-blue-600" />
            Zonas & Niveles de Acceso ({areas.length})
          </TabsTrigger>
          <TabsTrigger value="credenciales" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <CreditCard className="h-4 w-4 mr-1.5 text-purple-600" />
            Credenciales & Carnets ({credencialesFiltradas.length})
          </TabsTrigger>
          <TabsTrigger value="analitica" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <PieChartIcon className="h-4 w-4 mr-1.5 text-emerald-600" />
            Analítica de Afluencia
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Bitácora */}
        <TabsContent value="bitacora">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Registro en Tiempo Real de Entradas y Salidas</CardTitle>
              <CardDescription>Control de identidad para visitantes, proveedores, contratistas y personal</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Pase #</TableHead>
                    <TableHead>Persona / Identificación</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Método Verificación</TableHead>
                    <TableHead>Movimiento</TableHead>
                    <TableHead>Fecha / Hora</TableHead>
                    <TableHead className="pr-6">Motivo de Visita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingBitacora ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        Cargando bitácora de accesos...
                      </TableCell>
                    </TableRow>
                  ) : bitacoraFiltrada.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No hay registros de accesos en este turno.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bitacoraFiltrada.map((b) => (
                      <TableRow key={b.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="pl-6 font-mono font-bold text-xs text-teal-700 dark:text-teal-400">
                          {b.numero}
                        </TableCell>
                        <TableCell className="font-semibold text-sm">{b.persona_nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-lg text-xs font-normal">
                            {b.tipo_persona}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{b.metodo_verificacion}</TableCell>
                        <TableCell>
                          {b.tipo === "entrada" ? (
                            <Badge variant="outline" className="rounded-lg text-xs bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                              <ArrowDownLeft className="h-3.5 w-3.5 mr-1" /> Entrada
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="rounded-lg text-xs bg-blue-500/10 text-blue-700 border-blue-500/30">
                              <ArrowUpRight className="h-3.5 w-3.5 mr-1" /> Salida
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {b.fecha_hora ? new Date(b.fecha_hora).toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </TableCell>
                        <TableCell className="pr-6 text-xs text-muted-foreground max-w-xs truncate">
                          {b.motivo_visita || "Trámite general"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Áreas */}
        <TabsContent value="areas">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingAreas ? (
              <p className="col-span-3 text-center text-muted-foreground py-10">Cargando zonas...</p>
            ) : areas.length === 0 ? (
              <p className="col-span-3 text-center text-muted-foreground py-10">No hay áreas configuradas.</p>
            ) : (
              areas.map((a) => {
                const nivMeta = NIVELES_ACCESO.find(n => n.value === a.nivel_acceso);
                return (
                  <Card key={a.id} className="rounded-2xl border-border/80 shadow-xs p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-teal-600" />
                        <h4 className="font-semibold text-foreground text-sm">{a.nombre}</h4>
                      </div>
                      <Badge variant="outline" className={`rounded-lg capitalize text-xs ${nivMeta?.color || ""}`}>
                        {nivMeta?.label.split(" (")[0] || a.nivel_acceso}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ubicación: <span className="font-medium text-foreground">{a.ubicacion || "Edificio Principal"}</span>
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground font-mono">
                      <span>Capacidad: {a.capacidad || "N/A"}</span>
                      <span className="flex items-center gap-1 text-teal-700 dark:text-teal-400">
                        <Camera className="h-3.5 w-3.5" /> {a.cantidad_camaras || 0} CCTV
                      </span>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Credenciales */}
        <TabsContent value="credenciales">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Credenciales Emitidas & Pases de Seguridad</CardTitle>
              <CardDescription>Carnets biométricos y chips RFID para control de puertas magnetizadas</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Código Carnet</TableHead>
                    <TableHead>Titular</TableHead>
                    <TableHead>Rol / Tipo</TableHead>
                    <TableHead>Fecha Vencimiento</TableHead>
                    <TableHead className="pr-6">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingCred ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        Cargando credenciales...
                      </TableCell>
                    </TableRow>
                  ) : credencialesFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        No hay credenciales registradas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    credencialesFiltradas.map((c) => {
                      const estMeta = ESTADOS_CREDENCIAL.find(e => e.value === c.estado);
                      return (
                        <TableRow key={c.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="pl-6 font-mono font-bold text-xs text-purple-700 dark:text-purple-400">
                            {c.codigo_credencial || "S/C"}
                          </TableCell>
                          <TableCell className="font-semibold text-sm flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-purple-600" />
                            {c.persona_nombre}
                          </TableCell>
                          <TableCell className="text-xs">{c.tipo}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {c.fecha_vencimiento ? new Date(c.fecha_vencimiento + "T12:00:00").toLocaleDateString("es-DO") : "Permanente"}
                          </TableCell>
                          <TableCell className="pr-6">
                            <Badge variant="outline" className={`rounded-lg capitalize text-xs ${estMeta?.color || ""}`}>
                              {estMeta?.label || c.estado}
                            </Badge>
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

        {/* Tab 4: Analítica */}
        <TabsContent value="analitica">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Distribución de Accesos por Tipo de Usuario</CardTitle>
                <CardDescription>Flujo de visitantes vs personal y contratistas</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {datosPorTipoPersona.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sin accesos suficientes para graficar.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={datosPorTipoPersona}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={50}
                        paddingAngle={4}
                      >
                        {datosPorTipoPersona.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PALETA_GRAFICOS[index % PALETA_GRAFICOS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Densidad de Cámaras CCTV por Zona Hospitalaria</CardTitle>
                <CardDescription>Cobertura de video-vigilancia en áreas críticas</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {datosCamarasPorArea.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sin cámaras registradas en las zonas.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosCamarasPorArea} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
                      />
                      <Bar dataKey="camaras" fill="#0d9488" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo Nuevo Acceso */}
      <Dialog open={showNewAcceso} onOpenChange={setShowNewAcceso}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-teal-600" />
              Registrar Entrada / Salida en Bitácora
            </DialogTitle>
            <DialogDescription>
              Verifique la identidad de la persona antes de otorgar acceso.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre Completo de la Persona *</Label>
              <Input
                placeholder="Ej. Juan Pérez Rodríguez"
                className="rounded-xl border-border/80"
                value={formDataAcceso.persona_nombre}
                onChange={(e) => setFormDataAcceso(p => ({ ...p, persona_nombre: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Perfil de Usuario</Label>
                <Select 
                  value={formDataAcceso.tipo_persona} 
                  onValueChange={(val) => setFormDataAcceso(p => ({ ...p, tipo_persona: val }))}
                >
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Visitante Familiar">Visitante Familiar</SelectItem>
                    <SelectItem value="Personal de Salud">Personal de Salud</SelectItem>
                    <SelectItem value="Proveedor / Mensajería">Proveedor / Mensajería</SelectItem>
                    <SelectItem value="Contratista Técnico">Contratista Técnico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Movimiento</Label>
                <Select 
                  value={formDataAcceso.tipo} 
                  onValueChange={(val) => setFormDataAcceso(p => ({ ...p, tipo: val }))}
                >
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="salida">Salida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Método de Verificación</Label>
              <Select 
                value={formDataAcceso.metodo_verificacion} 
                onValueChange={(val) => setFormDataAcceso(p => ({ ...p, metodo_verificacion: val }))}
              >
                <SelectTrigger className="rounded-xl border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cédula / Documento">Cédula / Documento de Identidad</SelectItem>
                  <SelectItem value="Tarjeta RFID">Tarjeta de Proximidad RFID</SelectItem>
                  <SelectItem value="Biometría Huella">Biometría Huella</SelectItem>
                  <SelectItem value="Código QR">Código QR Móvil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Motivo de Visita / Área de Destino</Label>
              <Input
                placeholder="Ej. Quirófano, Habitación 302, Mantenimiento..."
                className="rounded-xl border-border/80"
                value={formDataAcceso.motivo_visita}
                onChange={(e) => setFormDataAcceso(p => ({ ...p, motivo_visita: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewAcceso(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white" 
              onClick={() => crearAcceso.mutate()}
              disabled={crearAcceso.isPending || !formDataAcceso.persona_nombre}
            >
              {crearAcceso.isPending ? "Registrando..." : "Registrar Acceso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Nueva Credencial */}
      <Dialog open={showNewCred} onOpenChange={setShowNewCred}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-teal-600" />
              Emitir Credencial de Acceso
            </DialogTitle>
            <DialogDescription>
              Asigne un código de credencial y nivel de vigencia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre del Titular *</Label>
              <Input
                placeholder="Nombre del médico, enfermero o empleado..."
                className="rounded-xl border-border/80"
                value={formDataCred.persona_nombre}
                onChange={(e) => setFormDataCred(p => ({ ...p, persona_nombre: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Código / Chip RFID</Label>
                <Input
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataCred.codigo_credencial}
                  onChange={(e) => setFormDataCred(p => ({ ...p, codigo_credencial: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Perfil de Acceso</Label>
                <Select 
                  value={formDataCred.tipo} 
                  onValueChange={(val) => setFormDataCred(p => ({ ...p, tipo: val }))}
                >
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Personal de Salud">Personal de Salud</SelectItem>
                    <SelectItem value="Médico Residente">Médico Residente</SelectItem>
                    <SelectItem value="Administrativo">Personal Administrativo</SelectItem>
                    <SelectItem value="Seguridad / Vigilancia">Seguridad / Vigilancia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fecha de Expiración</Label>
              <Input
                type="date"
                className="rounded-xl border-border/80 font-mono"
                value={formDataCred.fecha_vencimiento}
                onChange={(e) => setFormDataCred(p => ({ ...p, fecha_vencimiento: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewCred(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white" 
              onClick={() => crearCredencial.mutate()}
              disabled={crearCredencial.isPending || !formDataCred.persona_nombre}
            >
              {crearCredencial.isPending ? "Emitiendo..." : "Emitir Credencial"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
