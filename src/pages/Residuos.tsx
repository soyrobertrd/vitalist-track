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
  Trash2, 
  FileText, 
  AlertTriangle, 
  Plus, 
  Search, 
  Truck, 
  ShieldAlert, 
  CheckCircle2, 
  Scale, 
  PieChart as PieChartIcon,
  Flame,
  Biohazard
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

const TIPOS_RESIDUO = [
  { value: "biologico_infeccioso", label: "Biológico-Infeccioso (Bolsa Roja)", color: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30" },
  { value: "punzocortante", label: "Punzocortante (Contenedor Rígido)", color: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30" },
  { value: "anatomopatologico", label: "Anatomopatológico / Órganos (Bolsa Amarilla)", color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  { value: "quimico", label: "Químico / Citotóxico", color: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30" },
  { value: "farmaceutico", label: "Medicamentos Vencidos / Residuos Fármacos", color: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  { value: "radioactivo", label: "Radioactivo / Medicina Nuclear", color: "bg-yellow-500/20 text-yellow-800 dark:text-yellow-400 border-yellow-500/40" },
  { value: "comun", label: "Común / No Peligroso (Bolsa Negra)", color: "bg-muted text-muted-foreground border-border" }
];

const ESTADOS_RESIDUO = [
  { value: "generado", label: "Generado en Sala", color: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  { value: "recolectado", label: "En Ruta Interna", color: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  { value: "almacenado", label: "En Almacén Temporal", color: "bg-orange-500/10 text-orange-700 border-orange-500/30" },
  { value: "transportado", label: "En Tránsito Externo", color: "bg-purple-500/10 text-purple-700 border-purple-500/30" },
  { value: "tratado", label: "Autoclavado / Incinerado", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  { value: "dispuesto", label: "Relleno Sanitario Autorizado", color: "bg-muted text-muted-foreground" }
];

const PALETA_GRAFICOS = ["#ef4444", "#f97316", "#eab308", "#8b5cf6", "#3b82f6", "#10b981", "#64748b"];

export default function Residuos() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("residuos");
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");

  const [showNewResiduo, setShowNewResiduo] = useState(false);
  const [showNewManifiesto, setShowNewManifiesto] = useState(false);

  // Formularios
  const [formDataResiduo, setFormDataResiduo] = useState({
    tipo: "biologico_infeccioso",
    peso_kg: "5.5",
    area_generadora: "Quirófano 01",
    estado: "almacenado"
  });

  const [formDataManifiesto, setFormDataManifiesto] = useState({
    transportista: "Gestión Ambiental Dominicana S.R.L.",
    destino: "Planta de Incineración & Tratamiento Ecológico",
    peso_total_kg: "45.0",
    conductor: "Carlos Mendoza",
    placa_vehiculo: "L-482910"
  });

  // Queries
  const { data: residuos = [], isLoading: loadingResiduos } = useQuery({
    queryKey: ["residuos_hospitalarios", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("residuos_hospitalarios" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("created_at", { ascending: false })
        .limit(150);
      return (data || []) as any[];
    }
  });

  const { data: manifiestos = [], isLoading: loadingManifiestos } = useQuery({
    queryKey: ["manifiestos_residuos", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("manifiestos_residuos" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return (data || []) as any[];
    }
  });

  // Mutación: Registrar Lote de Residuo
  const crearResiduo = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error("Workspace no activo");
      const num = `RPBI-${Date.now().toString().slice(-6)}`;
      const { error } = await supabase.from("residuos_hospitalarios" as any).insert({
        workspace_id: currentWorkspace.id,
        numero: num,
        tipo: formDataResiduo.tipo,
        peso_kg: parseFloat(formDataResiduo.peso_kg) || 0,
        area_generadora: formDataResiduo.area_generadora,
        estado: formDataResiduo.estado
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["residuos_hospitalarios"] });
      toast.success("Registro de residuos hospitalarios guardado");
      setShowNewResiduo(false);
      setFormDataResiduo({
        tipo: "biologico_infeccioso",
        peso_kg: "5.5",
        area_generadora: "Quirófano 01",
        estado: "almacenado"
      });
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  // Mutación: Crear Manifiesto
  const crearManifiesto = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error("Workspace no activo");
      const num = `MAN-${Date.now().toString().slice(-6)}`;
      const { error } = await supabase.from("manifiestos_residuos" as any).insert({
        workspace_id: currentWorkspace.id,
        numero: num,
        transportista: formDataManifiesto.transportista,
        destino: formDataManifiesto.destino,
        peso_total_kg: parseFloat(formDataManifiesto.peso_total_kg) || 0,
        verificado: true
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manifiestos_residuos"] });
      toast.success("Manifiesto de transporte ambiental emitido");
      setShowNewManifiesto(false);
      setFormDataManifiesto({
        transportista: "Gestión Ambiental Dominicana S.R.L.",
        destino: "Planta de Incineración & Tratamiento Ecológico",
        peso_total_kg: "45.0",
        conductor: "Carlos Mendoza",
        placa_vehiculo: "L-482910"
      });
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  // KPIs
  const totalPesoGenerado = residuos.reduce((acc, r) => acc + (Number(r.peso_kg) || 0), 0);
  const peligrosos = residuos.filter(r => r.tipo !== "comun");
  const pesoPeligroso = peligrosos.reduce((acc, r) => acc + (Number(r.peso_kg) || 0), 0);
  const pendientesRetiro = residuos.filter(r => ["generado", "recolectado", "almacenado"].includes(r.estado)).length;
  const totalManifiestos = manifiestos.length;

  // Filtros
  const residuosFiltrados = useMemo(() => {
    return residuos.filter(r => {
      if (filterTipo !== "todos" && r.tipo !== filterTipo) return false;
      if (!search) return true;
      const full = `${r.numero || ""} ${r.area_generadora || ""} ${r.tipo || ""}`.toLowerCase();
      return full.includes(search.toLowerCase());
    });
  }, [residuos, search, filterTipo]);

  // Gráficos
  const datosPorTipoResiduo = useMemo(() => {
    const counts: Record<string, number> = {};
    residuos.forEach(r => {
      const label = TIPOS_RESIDUO.find(t => t.value === r.tipo)?.label.split(" (")[0] || r.tipo;
      counts[label] = (counts[label] || 0) + (Number(r.peso_kg) || 0);
    });
    return Object.entries(counts).map(([name, value]) => ({ 
      name, 
      value: +value.toFixed(1) 
    }));
  }, [residuos]);

  const datosPorArea = useMemo(() => {
    const counts: Record<string, number> = {};
    residuos.forEach(r => {
      const area = r.area_generadora || "General";
      counts[area] = (counts[area] || 0) + (Number(r.peso_kg) || 0);
    });
    return Object.entries(counts).slice(0, 6).map(([name, kg]) => ({ 
      name, 
      kg: +kg.toFixed(1) 
    }));
  }, [residuos]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      <ClinicalPageHeader
        title="Gestión de Residuos Hospitalarios & Bioseguridad (RPBI)"
        subtitle="Control de generación, clasificación cromática, manifiestos de transporte ambiental y pesaje"
        badge="Bioseguridad & RPBI"
        icon={Trash2}
        action={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="rounded-xl border-border/80 shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setShowNewManifiesto(true)}
            >
              <Truck className="h-4 w-4 mr-1.5 text-rose-600" />
              Emitir Manifiesto
            </Button>
            <Button 
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setShowNewResiduo(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Registrar Pesaje RPBI
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Peso Total Generado"
          value={`${totalPesoGenerado.toFixed(1)} kg`}
          subtitle="Historial de recolección intrahospitalaria"
          icon={Scale}
          variant="primary"
        />
        <ClinicalKpiCard
          title="Desechos Biopeligrosos (RPBI)"
          value={`${pesoPeligroso.toFixed(1)} kg`}
          subtitle="Infecciosos, punzocortantes y anatomía"
          icon={Biohazard}
          variant="rose"
          alert={pesoPeligroso > 50}
        />
        <ClinicalKpiCard
          title="Lotes en Almacén Temporal"
          value={pendientesRetiro}
          subtitle="Pendientes de retiro por gestor externo"
          icon={AlertTriangle}
          variant={pendientesRetiro > 5 ? "amber" : "teal"}
        />
        <ClinicalKpiCard
          title="Manifiestos Verificados"
          value={totalManifiestos}
          subtitle="Custodias de transporte ambiental"
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por lote, área generadora o tipo..."
            className="pl-9 rounded-xl border-border/80 bg-background/50 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-64">
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="rounded-xl border-border/80 h-10">
              <SelectValue placeholder="Clasificación de residuo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              {TIPOS_RESIDUO.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label.split(" (")[0]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pestañas */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl border border-border/60">
          <TabsTrigger value="residuos" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Trash2 className="h-4 w-4 mr-1.5 text-rose-600" />
            Lotes & Pesajes ({residuosFiltrados.length})
          </TabsTrigger>
          <TabsTrigger value="manifiestos" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Truck className="h-4 w-4 mr-1.5 text-purple-600" />
            Manifiestos de Custodia ({manifiestos.length})
          </TabsTrigger>
          <TabsTrigger value="analitica" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <PieChartIcon className="h-4 w-4 mr-1.5 text-blue-500" />
            Analítica de Volumen y Áreas
          </TabsTrigger>
          <TabsTrigger value="codigos" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Biohazard className="h-4 w-4 mr-1.5 text-red-500" />
            Código de Colores & Bioseguridad
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Residuos */}
        <TabsContent value="residuos">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Trazabilidad de Residuos Hospitalarios</CardTitle>
              <CardDescription>Registro por pesaje, área intrahospitalaria y etapa en el flujo de bioseguridad</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Lote #</TableHead>
                    <TableHead>Área Generadora</TableHead>
                    <TableHead>Tipo de Desecho</TableHead>
                    <TableHead>Peso (kg)</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="pr-6">Fecha Registro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingResiduos ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Cargando lotes de residuos...
                      </TableCell>
                    </TableRow>
                  ) : residuosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No se encontraron registros de pesaje.
                      </TableCell>
                    </TableRow>
                  ) : (
                    residuosFiltrados.map((r) => {
                      const tipoMeta = TIPOS_RESIDUO.find(t => t.value === r.tipo);
                      const estMeta = ESTADOS_RESIDUO.find(e => e.value === r.estado);
                      return (
                        <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="pl-6 font-mono font-bold text-xs text-rose-700 dark:text-rose-400">
                            {r.numero}
                          </TableCell>
                          <TableCell className="font-semibold text-sm">{r.area_generadora || "Área General"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`rounded-lg text-xs ${tipoMeta?.color || ""}`}>
                              {tipoMeta?.label || r.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono font-bold text-foreground">
                            {r.peso_kg ? `${r.peso_kg} kg` : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`rounded-lg capitalize text-xs ${estMeta?.color || ""}`}>
                              {estMeta?.label || r.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-6 text-xs font-mono text-muted-foreground">
                            {r.created_at ? new Date(r.created_at).toLocaleDateString("es-DO") : "—"}
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

        {/* Tab 2: Manifiestos */}
        <TabsContent value="manifiestos">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Manifiestos de Entrega y Transporte</CardTitle>
              <CardDescription>Cadena de custodia legal con gestores de residuos autorizados por Medio Ambiente</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Manifiesto #</TableHead>
                    <TableHead>Empresa Transportista</TableHead>
                    <TableHead>Destino de Disposición</TableHead>
                    <TableHead>Carga Total (kg)</TableHead>
                    <TableHead>Verificación</TableHead>
                    <TableHead className="pr-6">Fecha Emisión</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingManifiestos ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Cargando manifiestos...
                      </TableCell>
                    </TableRow>
                  ) : manifiestos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No hay manifiestos de transporte registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    manifiestos.map((m) => (
                      <TableRow key={m.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="pl-6 font-mono font-bold text-xs text-purple-700 dark:text-purple-400">
                          {m.numero}
                        </TableCell>
                        <TableCell className="font-semibold text-sm flex items-center gap-2">
                          <Truck className="h-4 w-4 text-purple-600" />
                          {m.transportista}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{m.destino}</TableCell>
                        <TableCell className="font-mono font-bold">
                          {m.peso_total_kg ? `${m.peso_total_kg} kg` : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`rounded-lg text-xs ${
                              m.verificado 
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-700 border-amber-500/30"
                            }`}
                          >
                            {m.verificado ? "Verificado & Sellado" : "Pendiente de Salida"}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-6 text-xs font-mono text-muted-foreground">
                          {m.created_at ? new Date(m.created_at).toLocaleDateString("es-DO") : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Analítica */}
        <TabsContent value="analitica">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Peso Acumulado por Clasificación (kg)</CardTitle>
                <CardDescription>Volumen generado según tipo de desecho hospitalario</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {datosPorTipoResiduo.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sin datos suficientes para graficar.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={datosPorTipoResiduo}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={50}
                        paddingAngle={4}
                      >
                        {datosPorTipoResiduo.map((_, index) => (
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
                <CardTitle className="text-base font-semibold">Generación por Servicio Hospitalario (kg)</CardTitle>
                <CardDescription>Carga de bioseguridad producida en quirófanos, salas y laboratorio</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {datosPorArea.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sin datos de áreas para graficar.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosPorArea} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
                      />
                      <Bar dataKey="kg" fill="#ef4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Normativa */}
        <TabsContent value="codigos">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl border-border/80 shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2 text-red-600 font-bold">
                <Biohazard className="h-5 w-5" />
                Bolsa Roja / Punzocortantes Rígidos
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Material empapado en sangre, guantes de cirugía, gasas contaminadas y agujas/bisturís (llenado máximo hasta 3/4 de capacidad en frascos impermeables de polipropileno).
              </p>
            </Card>

            <Card className="rounded-2xl border-border/80 shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2 text-amber-600 font-bold">
                <AlertTriangle className="h-5 w-5" />
                Bolsa Amarilla (Anatomopatológicos)
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tejidos de biopsias, órganos extirpados, restos de amputaciones y muestras de fluidos corporales con preservación en frío hasta transporte a incinerador autorizado.
              </p>
            </Card>

            <Card className="rounded-2xl border-border/80 shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground font-bold">
                <Trash2 className="h-5 w-5" />
                Bolsa Negra (Comunes Asimilables)
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Papelería administrativa, envoltorios de insumos limpios, restos de alimentos de pacientes no aislados. Disposición estándar mediante recolección municipal.
              </p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo Nuevo Residuo */}
      <Dialog open={showNewResiduo} onOpenChange={setShowNewResiduo}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Biohazard className="h-5 w-5 text-rose-600" />
              Registrar Pesaje RPBI
            </DialogTitle>
            <DialogDescription>
              Incorpore un lote de residuos clínicos para control y custodia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Clasificación / Tipo *</Label>
              <Select 
                value={formDataResiduo.tipo} 
                onValueChange={(val) => setFormDataResiduo(p => ({ ...p, tipo: val }))}
              >
                <SelectTrigger className="rounded-xl border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_RESIDUO.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Peso en Báscula (kg) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ej. 4.8"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataResiduo.peso_kg}
                  onChange={(e) => setFormDataResiduo(p => ({ ...p, peso_kg: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Área Hospitalaria</Label>
                <Input
                  placeholder="Ej. Quirófano 01, UCI"
                  className="rounded-xl border-border/80"
                  value={formDataResiduo.area_generadora}
                  onChange={(e) => setFormDataResiduo(p => ({ ...p, area_generadora: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Estado de la Ruta</Label>
              <Select 
                value={formDataResiduo.estado} 
                onValueChange={(val) => setFormDataResiduo(p => ({ ...p, estado: val }))}
              >
                <SelectTrigger className="rounded-xl border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_RESIDUO.map((e) => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewResiduo(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white" 
              onClick={() => crearResiduo.mutate()}
              disabled={crearResiduo.isPending || !formDataResiduo.peso_kg}
            >
              {crearResiduo.isPending ? "Guardando..." : "Guardar Pesaje"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Nuevo Manifiesto */}
      <Dialog open={showNewManifiesto} onOpenChange={setShowNewManifiesto}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-purple-600" />
              Emitir Manifiesto de Transporte
            </DialogTitle>
            <DialogDescription>
              Documento legal de entrega de residuos a gestor ambiental externo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Empresa Transportista Autorizada *</Label>
              <Input
                placeholder="Nombre de la empresa acreditada"
                className="rounded-xl border-border/80"
                value={formDataManifiesto.transportista}
                onChange={(e) => setFormDataManifiesto(p => ({ ...p, transportista: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Planta de Tratamiento / Destino</Label>
              <Input
                placeholder="Ej. Planta de Autoclave e Incineración"
                className="rounded-xl border-border/80"
                value={formDataManifiesto.destino}
                onChange={(e) => setFormDataManifiesto(p => ({ ...p, destino: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Peso Total Carga (kg)</Label>
                <Input
                  type="number"
                  step="0.5"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataManifiesto.peso_total_kg}
                  onChange={(e) => setFormDataManifiesto(p => ({ ...p, peso_total_kg: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Placa del Vehículo</Label>
                <Input
                  placeholder="Ej. L-482910"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataManifiesto.placa_vehiculo}
                  onChange={(e) => setFormDataManifiesto(p => ({ ...p, placa_vehiculo: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewManifiesto(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white" 
              onClick={() => crearManifiesto.mutate()}
              disabled={crearManifiesto.isPending || !formDataManifiesto.transportista}
            >
              {crearManifiesto.isPending ? "Emitiendo..." : "Emitir Manifiesto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
