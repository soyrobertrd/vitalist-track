import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/db/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertTriangle, 
  ShieldAlert, 
  BellRing, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Plus, 
  Search, 
  Activity, 
  Flame, 
  HeartCrack,
  PieChart as PieChartIcon,
  Radio
} from "lucide-react";
import { toast } from "sonner";
import { useProfessionalVertical } from "@/hooks/useProfessionalVertical";
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

const SEVERIDAD_CONFIG: Record<string, { label: string; badgeClass: string; icon: any }> = {
  critica: { 
    label: "Crítica / Soporte Vital", 
    badgeClass: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/40 animate-pulse", 
    icon: Zap 
  },
  alta: { 
    label: "Alta Prioridad", 
    badgeClass: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30", 
    icon: AlertTriangle 
  },
  media: { 
    label: "Moderada", 
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30", 
    icon: BellRing 
  },
  baja: { 
    label: "Informativa", 
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30", 
    icon: Activity 
  }
};

const PALETA_GRAFICOS = ["#ef4444", "#f97316", "#eab308", "#3b82f6", "#8b5cf6"];

export default function AlertasClinicas() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const { canActHere, verticalProfesional } = useProfessionalVertical();

  const [tab, setTab] = useState("alertas");
  const [filtroEstado, setFiltroEstado] = useState("activa");
  const [search, setSearch] = useState("");
  const [showNewAlerta, setShowNewAlerta] = useState(false);

  // Formulario manual
  const [formData, setFormData] = useState({
    paciente_id: "",
    titulo: "",
    descripcion: "",
    severidad: "alta",
    tipo: "sepsis_score",
    modulo_origen: "Urgencias / Triage"
  });

  // Queries
  const { data: pacientes = [] } = useQuery({
    queryKey: ["pacientes-lista-alertas", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      const { data } = await db
        .from("pacientes")
        .select("id, nombre, apellido, cedula")
        .eq("workspace_id", currentWorkspace.id)
        .order("nombre");
      return data || [];
    },
    enabled: !!currentWorkspace?.id
  });

  const { data: alertas = [], isLoading: loadingAlertas } = useQuery({
    queryKey: ["alertas_clinicas", filtroEstado, currentWorkspace?.id],
    queryFn: async () => {
      let query = db
        .from("alertas_clinicas")
        .select("*, pacientes(nombre, apellido, cedula)")
        .order("severidad", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(150);

      if (filtroEstado !== "todas") {
        query = query.eq("estado", filtroEstado);
      }

      const { data } = await query;
      return (data || []) as any[];
    }
  });

  // Mutación: Cambiar Estado
  const actualizarEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const updates: any = { estado };
      const now = new Date().toISOString();
      if (estado === "reconocida") updates.reconocida_at = now;
      if (estado === "atendida") updates.atendida_at = now;
      const { error } = await db.from("alertas_clinicas").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertas_clinicas"] });
      toast.success("Estado de la alerta actualizado");
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  // Mutación: Crear Alerta Manual
  const crearAlerta = useMutation({
    mutationFn: async () => {
      if (!formData.titulo) throw new Error("Ingrese el título de la alerta");
      const { error } = await db.from("alertas_clinicas").insert({
        paciente_id: formData.paciente_id || null,
        titulo: formData.titulo,
        descripcion: formData.descripcion || null,
        severidad: formData.severidad,
        tipo: formData.tipo,
        modulo_origen: formData.modulo_origen,
        estado: "activa"
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertas_clinicas"] });
      toast.success("Alerta clínica generada y notificada");
      setShowNewAlerta(false);
      setFormData({
        paciente_id: "",
        titulo: "",
        descripcion: "",
        severidad: "alta",
        tipo: "sepsis_score",
        modulo_origen: "Urgencias / Triage"
      });
    },
    onError: (err: any) => toast.error(`Error al emitir alerta: ${err.message}`)
  });

  // KPIs
  const criticasCount = alertas.filter(a => a.severidad === "critica" && a.estado === "activa").length;
  const activasCount = alertas.filter(a => a.estado === "activa").length;
  const reconocidasCount = alertas.filter(a => a.estado === "reconocida").length;
  const atendidasCount = alertas.filter(a => a.estado === "atendida").length;

  // Filtro
  const alertasFiltradas = useMemo(() => {
    return alertas.filter(a => {
      if (!search) return true;
      const full = `${a.titulo || ""} ${a.descripcion || ""} ${a.pacientes?.nombre || ""} ${a.pacientes?.apellido || ""}`.toLowerCase();
      return full.includes(search.toLowerCase());
    });
  }, [alertas, search]);

  // Gráficos
  const datosPorSeveridad = useMemo(() => {
    const counts: Record<string, number> = {};
    alertas.forEach(a => {
      const sev = a.severidad || "media";
      counts[sev] = (counts[sev] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ 
      name: name.toUpperCase(), 
      value 
    }));
  }, [alertas]);

  const datosPorModulo = useMemo(() => {
    const counts: Record<string, number> = {};
    alertas.forEach(a => {
      const mod = a.modulo_origen || "General";
      counts[mod] = (counts[mod] || 0) + 1;
    });
    return Object.entries(counts).slice(0, 6).map(([name, cantidad]) => ({ name, cantidad }));
  }, [alertas]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      <ClinicalPageHeader
        title="Centro de Alertas Clínicas Inter-Módulos"
        subtitle="Detección temprana de sepsis, score NEWS2 crítico, valores de pánico de laboratorio y alergias"
        badge="Seguridad del Paciente & Triage Alertas"
        icon={ShieldAlert}
        action={
          <Button 
            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-none text-xs md:text-sm font-medium" 
            onClick={() => setShowNewAlerta(true)}
            disabled={!canActHere && !!verticalProfesional}
          >
            <Radio className="h-4 w-4 mr-1.5" />
            Emitir Alerta Manual
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Alertas Críticas Activas"
          value={criticasCount}
          subtitle="Score NEWS2 ≥ 7 / Valores de pánico"
          icon={AlertTriangle}
          variant="rose"
          alert={criticasCount > 0}
        />
        <ClinicalKpiCard
          title="Tiempo de Respuesta Estimado"
          value="< 4 min"
          subtitle="Protocolo de respuesta rápida (RRT)"
          icon={Clock}
          variant="teal"
        />
        <ClinicalKpiCard
          title="En Evaluación / Reconocidas"
          value={reconocidasCount}
          subtitle="Personal médico acudiendo al paciente"
          icon={Zap}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Resueltas / Atendidas"
          value={atendidasCount}
          subtitle="Pacientes estabilizados"
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente, causa o tipo de alerta..."
            className="pl-9 rounded-xl border-border/80 bg-background/50 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-56">
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="rounded-xl border-border/80 h-10">
              <SelectValue placeholder="Estado de la alerta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activa">Solo Activas</SelectItem>
              <SelectItem value="reconocida">Reconocidas</SelectItem>
              <SelectItem value="atendida">Atendidas / Resueltas</SelectItem>
              <SelectItem value="descartada">Descartadas</SelectItem>
              <SelectItem value="todas">Todas las alertas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pestañas */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl border border-border/60">
          <TabsTrigger value="alertas" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <BellRing className="h-4 w-4 mr-1.5 text-rose-500" />
            Monitor de Alertas ({alertasFiltradas.length})
          </TabsTrigger>
          <TabsTrigger value="analitica" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <PieChartIcon className="h-4 w-4 mr-1.5 text-blue-500" />
            Analítica de Seguridad
          </TabsTrigger>
          <TabsTrigger value="protocolos" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <ShieldAlert className="h-4 w-4 mr-1.5 text-teal-600" />
            Protocolos de Código Rápido
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Alertas */}
        <TabsContent value="alertas" className="space-y-3">
          {loadingAlertas ? (
            <Card className="rounded-2xl border-border/80 shadow-xs p-10 text-center text-muted-foreground">
              Cargando monitor de alertas clínicas...
            </Card>
          ) : alertasFiltradas.length === 0 ? (
            <Card className="rounded-2xl border-border/80 shadow-xs p-10 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500/70" />
              <p className="font-semibold text-foreground">Sin alertas pendientes en este estado</p>
              <p className="text-xs text-muted-foreground">Todos los signos vitales y reportes de laboratorio se encuentran dentro de los rangos seguros.</p>
            </Card>
          ) : (
            alertasFiltradas.map((a) => {
              const sev = SEVERIDAD_CONFIG[a.severidad] || SEVERIDAD_CONFIG.media;
              const IconComp = sev.icon;
              return (
                <Card key={a.id} className="rounded-2xl border-border/80 shadow-xs hover:border-border transition-colors">
                  <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`rounded-lg font-bold text-xs ${sev.badgeClass}`}>
                          <IconComp className="h-3.5 w-3.5 mr-1" />
                          {sev.label}
                        </Badge>
                        <Badge variant="outline" className="rounded-lg text-xs capitalize">
                          {(a.tipo || "General").replace(/_/g, " ")}
                        </Badge>
                        {a.modulo_origen && (
                          <Badge variant="secondary" className="rounded-lg text-xs font-mono">
                            {a.modulo_origen}
                          </Badge>
                        )}
                      </div>
                      <p className="font-semibold text-base text-foreground mt-1">{a.titulo}</p>
                      {a.descripcion && <p className="text-sm text-muted-foreground">{a.descripcion}</p>}
                      <p className="text-xs text-muted-foreground flex items-center gap-1 font-mono pt-1">
                        <Clock className="h-3 w-3" />
                        {a.pacientes && <strong className="text-foreground">{a.pacientes.nombre} {a.pacientes.apellido} · </strong>}
                        {a.created_at ? new Date(a.created_at).toLocaleString("es-DO") : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      {a.estado === "activa" && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="rounded-xl border-border/80 h-8 text-xs font-medium"
                            disabled={!canActHere && !!verticalProfesional}
                            onClick={() => actualizarEstado.mutate({ id: a.id, estado: "reconocida" })}
                          >
                            <Zap className="h-3.5 w-3.5 mr-1 text-amber-500" /> Reconocer
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="rounded-xl h-8 text-xs text-muted-foreground hover:bg-muted"
                            disabled={!canActHere && !!verticalProfesional}
                            onClick={() => actualizarEstado.mutate({ id: a.id, estado: "descartada" })}
                          >
                            Descartar
                          </Button>
                        </>
                      )}
                      {a.estado === "reconocida" && (
                        <Button 
                          size="sm" 
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-medium"
                          disabled={!canActHere && !!verticalProfesional}
                          onClick={() => actualizarEstado.mutate({ id: a.id, estado: "atendida" })}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Marcar Atendida
                        </Button>
                      )}
                      {a.estado === "atendida" && (
                        <Badge variant="outline" className="rounded-lg text-xs bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                          Resuelta
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Tab 2: Analítica */}
        <TabsContent value="analitica">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Alertas por Nivel de Severidad</CardTitle>
                <CardDescription>Distribución de alertas críticas vs preventivas</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {datosPorSeveridad.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sin alertas registradas para graficar.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={datosPorSeveridad}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={50}
                        paddingAngle={4}
                      >
                        {datosPorSeveridad.map((_, index) => (
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
                <CardTitle className="text-base font-semibold">Origen de las Alertas por Servicio</CardTitle>
                <CardDescription>Áreas hospitalarias con mayor generación de eventos críticos</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {datosPorModulo.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sin datos de áreas para graficar.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosPorModulo} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
                      />
                      <Bar dataKey="cantidad" fill="#ef4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Protocolos */}
        <TabsContent value="protocolos">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl border-border/80 shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2 text-red-600 font-bold">
                <Flame className="h-5 w-5" />
                Código Sepsis (Hora Dorada)
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sospecha de infección con disfunción orgánica aguda (NEWS2 ≥ 5 o lactato sérico &gt; 2.0 mmol/L). Iniciar hemocultivos previos y cobertura antibiótica de amplio espectro antes de 60 minutos.
              </p>
            </Card>

            <Card className="rounded-2xl border-border/80 shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2 text-blue-600 font-bold">
                <HeartCrack className="h-5 w-5" />
                Código Azul (PCR Intrahospitalario)
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Paciente inconsciente sin pulso palpable o apnea. Activación inmediata del equipo de reanimación cardiopulmonar avanzada, carro de paros y desfibrilador en menos de 2 minutos.
              </p>
            </Card>

            <Card className="rounded-2xl border-border/80 shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2 text-purple-600 font-bold">
                <Zap className="h-5 w-5" />
                Valores de Pánico de Laboratorio
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Potasio &lt; 2.8 o &gt; 6.2 mEq/L, Glucosa &lt; 45 mg/dL, Plaquetas &lt; 20,000/µL o Troponina positiva. Notificación telefónica inmediata y obligatoria con lectura recíproca al médico a cargo.
              </p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo Nueva Alerta Manual */}
      <Dialog open={showNewAlerta} onOpenChange={setShowNewAlerta}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-rose-600" />
              Emitir Alerta Clínica Manual
            </DialogTitle>
            <DialogDescription>
              Active una alerta visual para movilizar al equipo de respuesta rápida.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Paciente Vinculado</Label>
              <Select 
                value={formData.paciente_id} 
                onValueChange={(val) => setFormData(p => ({ ...p, paciente_id: val }))}
              >
                <SelectTrigger className="rounded-xl border-border/80">
                  <SelectValue placeholder="Seleccione un paciente (opcional)" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {pacientes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} {p.apellido} {p.cedula ? `(${p.cedula})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nivel de Severidad *</Label>
                <Select 
                  value={formData.severidad} 
                  onValueChange={(val) => setFormData(p => ({ ...p, severidad: val }))}
                >
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critica">Crítica (Soporte Vital)</SelectItem>
                    <SelectItem value="alta">Alta Prioridad</SelectItem>
                    <SelectItem value="media">Moderada</SelectItem>
                    <SelectItem value="baja">Informativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Módulo de Origen</Label>
                <Input
                  className="rounded-xl border-border/80"
                  value={formData.modulo_origen}
                  onChange={(e) => setFormData(p => ({ ...p, modulo_origen: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Título del Hallazgo Crítico *</Label>
              <Input
                placeholder="Ej. Hipoxemia severa refractaria SatO2 82%..."
                className="rounded-xl border-border/80"
                value={formData.titulo}
                onChange={(e) => setFormData(p => ({ ...p, titulo: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción & Medidas de Emergencia</Label>
              <Textarea
                placeholder="Detalle de los signos vitales, requerimiento de intubación o soporte inotrópico..."
                className="rounded-xl border-border/80 resize-none h-20"
                value={formData.descripcion}
                onChange={(e) => setFormData(p => ({ ...p, descripcion: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewAlerta(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white" 
              onClick={() => crearAlerta.mutate()}
              disabled={crearAlerta.isPending || !formData.titulo}
            >
              {crearAlerta.isPending ? "Emitiendo..." : "Emitir Alerta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
