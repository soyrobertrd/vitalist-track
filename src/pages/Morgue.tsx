import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/db/client";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Microscope, 
  FileText, 
  Plus, 
  Search, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  FileCheck, 
  Scale, 
  CheckCircle2, 
  UserX
} from "lucide-react";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

const ESTADOS_MORGUE = [
  { value: "ingresado", label: "Ingresado en Custodia", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  { value: "en_estudio", label: "En Estudio / Enfriamiento", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  { value: "autopsia", label: "Necropsia en Curso", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30" },
  { value: "liberado", label: "Liberado / Entregado", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" }
];

const ESTADOS_PATOLOGIA = [
  { value: "recibido", label: "Recibido en Lab", color: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  { value: "en_proceso", label: "En Procesamiento", color: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  { value: "completado", label: "Diagnóstico Concluido", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  { value: "entregado", label: "Entregado a Clínico", color: "bg-muted text-muted-foreground" }
];

export default function Morgue() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("morgue");
  const [search, setSearch] = useState("");

  const [showNewRegistro, setShowNewRegistro] = useState(false);
  const [showNewEstudio, setShowNewEstudio] = useState(false);

  // Formularios
  const [formDataMorgue, setFormDataMorgue] = useState({
    nombre_fallecido: "",
    fecha_defuncion: new Date().toISOString().split("T")[0],
    causa_muerte: "",
    autopsia: false,
    ubicacion_camara: "Cámara 01",
    familiar_responsable: ""
  });

  const [formDataPat, setFormDataPat] = useState({
    tipo: "Biopsia Quirúrgica",
    muestra: "",
    sitio_anatomico: "",
    diagnostico_presuntivo: ""
  });

  // Queries
  const { data: registros = [], isLoading: loadingMorgue } = useQuery({
    queryKey: ["registros_morgue", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
    queryFn: async () => {
      const { data } = await db
        .from("registros_morgue" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return (data || []) as any[];
    }
  });

  const { data: estudios = [], isLoading: loadingPat } = useQuery({
    queryKey: ["estudios_patologia", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
    queryFn: async () => {
      const { data } = await db
        .from("estudios_patologia" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return (data || []) as any[];
    }
  });

  // Mutación: Registrar Óbito
  const crearRegistroMorgue = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error("Workspace no activo");
      const num = `OB-${Date.now().toString().slice(-6)}`;
      const { error } = await db.from("registros_morgue" as any).insert({
        workspace_id: currentWorkspace.id,
        numero: num,
        nombre_fallecido: formDataMorgue.nombre_fallecido,
        fecha_defuncion: formDataMorgue.fecha_defuncion,
        causa_muerte: formDataMorgue.causa_muerte,
        autopsia: formDataMorgue.autopsia,
        ubicacion_camara: formDataMorgue.ubicacion_camara,
        familiar_responsable: formDataMorgue.familiar_responsable || null,
        estado: "ingresado"
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registros_morgue"] });
      toast.success("Registro de defunción y custodia guardado exitosamente");
      setShowNewRegistro(false);
      setFormDataMorgue({
        nombre_fallecido: "",
        fecha_defuncion: new Date().toISOString().split("T")[0],
        causa_muerte: "",
        autopsia: false,
        ubicacion_camara: "Cámara 01",
        familiar_responsable: ""
      });
    },
    onError: (err: any) => toast.error(`Error al registrar óbito: ${err.message}`)
  });

  // Mutación: Estudio de Patología
  const crearEstudioPat = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error("Workspace no activo");
      const num = `PAT-${Date.now().toString().slice(-6)}`;
      const { error } = await db.from("estudios_patologia" as any).insert({
        workspace_id: currentWorkspace.id,
        numero: num,
        tipo: formDataPat.tipo,
        muestra: formDataPat.muestra,
        sitio_anatomico: formDataPat.sitio_anatomico || null,
        diagnostico_presuntivo: formDataPat.diagnostico_presuntivo || null,
        estado: "recibido"
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estudios_patologia"] });
      toast.success("Estudio anatomopatológico registrado");
      setShowNewEstudio(false);
      setFormDataPat({
        tipo: "Biopsia Quirúrgica",
        muestra: "",
        sitio_anatomico: "",
        diagnostico_presuntivo: ""
      });
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  // KPIs
  const activosMorgue = registros.filter(r => r.estado !== "liberado").length;
  const autopsias = registros.filter(r => r.autopsia).length;
  const patEnProceso = estudios.filter(e => e.estado === "en_proceso" || e.estado === "recibido").length;
  const patCompletados = estudios.filter(e => e.estado === "completado").length;

  // Filtro
  const registrosFiltrados = useMemo(() => {
    return registros.filter(r => {
      if (!search) return true;
      const full = `${r.numero || ""} ${r.nombre_fallecido || ""} ${r.causa_muerte || ""}`.toLowerCase();
      return full.includes(search.toLowerCase());
    });
  }, [registros, search]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      <ClinicalPageHeader
        title="Morgue, Patología & Custodia Forense"
        subtitle="Registro de defunciones, cadena de custodia cadavérica y análisis de biopsias patológicas"
        badge="Custodia & Anatomía Patológica"
        icon={Microscope}
        action={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="rounded-xl border-border/80 shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setShowNewEstudio(true)}
            >
              <FileText className="h-4 w-4 mr-1.5 text-teal-600" />
              Solicitud de Patología
            </Button>
            <Button 
              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setShowNewRegistro(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Registrar Óbito
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Cuerpos en Custodia Activa"
          value={activosMorgue}
          subtitle="En cámaras frigoríficas de preservación"
          icon={UserX}
          variant={activosMorgue > 3 ? "amber" : "teal"}
        />
        <ClinicalKpiCard
          title="Necropsias Clínicas / Legales"
          value={autopsias}
          subtitle="Procedimientos post-mortem requeridos"
          icon={Scale}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Biopsias en Procesamiento"
          value={patEnProceso}
          subtitle="Cortes histológicos en laboratorio"
          icon={Microscope}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Diagnósticos Concluidos"
          value={patCompletados}
          subtitle="Informes patológicos finalizados"
          icon={FileCheck}
          variant="emerald"
        />
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código de óbito, nombre o causa de muerte..."
            className="pl-9 rounded-xl border-border/80 bg-background/50 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Pestañas */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl border border-border/60">
          <TabsTrigger value="morgue" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <UserX className="h-4 w-4 mr-1.5 text-teal-600" />
            Censo de Morgue & Custodia ({registrosFiltrados.length})
          </TabsTrigger>
          <TabsTrigger value="patologia" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Microscope className="h-4 w-4 mr-1.5 text-purple-600" />
            Anatomía Patológica & Biopsias ({estudios.length})
          </TabsTrigger>
          <TabsTrigger value="protocolos" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <ShieldCheck className="h-4 w-4 mr-1.5 text-blue-500" />
            Cadena de Custodia & Legal
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Morgue */}
        <TabsContent value="morgue">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Registro de Custodia de Cadáveres</CardTitle>
              <CardDescription>Control de refrigeración, causa de defunción y entrega a familiares o autoridades</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Código</TableHead>
                    <TableHead>Nombre Fallecido</TableHead>
                    <TableHead>Fecha Defunción</TableHead>
                    <TableHead>Causa de Muerte</TableHead>
                    <TableHead>Cámara</TableHead>
                    <TableHead>Autopsia</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="pr-6">Familiar Responsable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingMorgue ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                        Cargando registros de morgue...
                      </TableCell>
                    </TableRow>
                  ) : registrosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                        No hay registros en la morgue actualmente.
                      </TableCell>
                    </TableRow>
                  ) : (
                    registrosFiltrados.map((r) => {
                      const estMeta = ESTADOS_MORGUE.find(e => e.value === r.estado);
                      return (
                        <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="pl-6 font-mono font-bold text-xs text-teal-700 dark:text-teal-400">
                            {r.numero}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {r.nombre_fallecido || "No identificado (NN)"}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {r.fecha_defuncion ? new Date(r.fecha_defuncion + "T12:00:00").toLocaleDateString("es-DO") : "—"}
                          </TableCell>
                          <TableCell className="text-sm max-w-xs truncate">{r.causa_muerte || "Causa pendiente de estudio"}</TableCell>
                          <TableCell className="font-mono text-xs font-medium">{r.ubicacion_camara || "General"}</TableCell>
                          <TableCell>
                            {r.autopsia ? (
                              <Badge variant="outline" className="rounded-lg bg-purple-500/10 text-purple-700 border-purple-500/30 text-xs">
                                Requerida
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">No aplica</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`rounded-lg capitalize text-xs ${estMeta?.color || ""}`}>
                              {estMeta?.label || r.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-6 text-xs text-muted-foreground">
                            {r.familiar_responsable || "Sin registrar"}
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

        {/* Tab 2: Patología */}
        <TabsContent value="patologia">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Registro Anatomopatológico & Biopsias</CardTitle>
              <CardDescription>Seguimiento de piezas quirúrgicas, citologías e informes histopatológicos</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Código</TableHead>
                    <TableHead>Tipo de Estudio</TableHead>
                    <TableHead>Muestra / Sitio Anatómico</TableHead>
                    <TableHead>Diagnóstico Presuntivo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="pr-6">Diagnóstico Definitivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPat ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Cargando estudios histológicos...
                      </TableCell>
                    </TableRow>
                  ) : estudios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No hay estudios patológicos registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    estudios.map((e) => {
                      const estMeta = ESTADOS_PATOLOGIA.find(p => p.value === e.estado);
                      return (
                        <TableRow key={e.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="pl-6 font-mono font-bold text-xs text-purple-700 dark:text-purple-400">
                            {e.numero}
                          </TableCell>
                          <TableCell className="font-semibold text-sm">{e.tipo}</TableCell>
                          <TableCell className="text-xs">
                            <span className="font-medium text-foreground">{e.muestra}</span>
                            {e.sitio_anatomico && <span className="text-muted-foreground"> ({e.sitio_anatomico})</span>}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{e.diagnostico_presuntivo || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`rounded-lg capitalize text-xs ${estMeta?.color || ""}`}>
                              {estMeta?.label || e.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-6 text-xs font-medium text-emerald-700 dark:text-emerald-400 max-w-sm truncate">
                            {e.diagnostico_final || "En análisis patológico"}
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

        {/* Tab 3: Protocolos Forenses */}
        <TabsContent value="protocolos">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl border-border/80 shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold">
                <ShieldCheck className="h-5 w-5" />
                Defunción Clínica Intrahospitalaria
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Muerte natural bajo asistencia médica con diagnóstico de base conocido. Emisión directa del Formulario de Defunción de Salud Pública por el médico tratante.
              </p>
            </Card>

            <Card className="rounded-2xl border-border/80 shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2 text-amber-600 font-bold">
                <AlertTriangle className="h-5 w-5" />
                Muerte Médico-Legal / Violenta
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Trauma, agresión, intoxicación o muerte antes de 24 horas de ingreso sin diagnóstico claro. Requiere intervención del médico legista y remisión obligatoria al INACIF.
              </p>
            </Card>

            <Card className="rounded-2xl border-border/80 shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2 text-purple-600 font-bold">
                <Microscope className="h-5 w-5" />
                Fijación y Envío de Muestras Patológicas
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Toda pieza quirúrgica debe ser sumergida inmediatamente en formaldehído tamponado al 10% en proporción 1:10 (volumen pieza:líquido fijador) con rotulado inviolable.
              </p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo Registrar Óbito */}
      <Dialog open={showNewRegistro} onOpenChange={setShowNewRegistro}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-teal-600" />
              Registrar Óbito / Ingreso a Morgue
            </DialogTitle>
            <DialogDescription>
              Inicie la cadena de custodia y custodia refrigerada post-mortem.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre Completo del Fallecido *</Label>
              <Input
                placeholder="Nombre del paciente o 'Desconocido / NN'"
                className="rounded-xl border-border/80"
                value={formDataMorgue.nombre_fallecido}
                onChange={(e) => setFormDataMorgue(p => ({ ...p, nombre_fallecido: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Fecha y Hora Defunción</Label>
                <Input
                  type="date"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataMorgue.fecha_defuncion}
                  onChange={(e) => setFormDataMorgue(p => ({ ...p, fecha_defuncion: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Cámara Frigorífica</Label>
                <Input
                  placeholder="Ej. Cámara 02"
                  className="rounded-xl border-border/80"
                  value={formDataMorgue.ubicacion_camara}
                  onChange={(e) => setFormDataMorgue(p => ({ ...p, ubicacion_camara: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Causa Médica de Muerte *</Label>
              <Input
                placeholder="Ej. Paro cardiorrespiratorio secundario a shock séptico..."
                className="rounded-xl border-border/80"
                value={formDataMorgue.causa_muerte}
                onChange={(e) => setFormDataMorgue(p => ({ ...p, causa_muerte: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Familiar o Persona Responsable que Retira</Label>
              <Input
                placeholder="Nombre y parentesco del familiar"
                className="rounded-xl border-border/80"
                value={formDataMorgue.familiar_responsable}
                onChange={(e) => setFormDataMorgue(p => ({ ...p, familiar_responsable: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewRegistro(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white" 
              onClick={() => crearRegistroMorgue.mutate()}
              disabled={crearRegistroMorgue.isPending || !formDataMorgue.nombre_fallecido}
            >
              {crearRegistroMorgue.isPending ? "Registrando..." : "Registrar Custodia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Nuevo Estudio de Patología */}
      <Dialog open={showNewEstudio} onOpenChange={setShowNewEstudio}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Microscope className="h-5 w-5 text-teal-600" />
              Solicitud de Anatomía Patológica
            </DialogTitle>
            <DialogDescription>
              Envío de muestra quirúrgica para biopsia o citología diagnóstica.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tipo de Estudio *</Label>
              <Select 
                value={formDataPat.tipo} 
                onValueChange={(val) => setFormDataPat(p => ({ ...p, tipo: val }))}
              >
                <SelectTrigger className="rounded-xl border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Biopsia Quirúrgica">Biopsia Quirúrgica</SelectItem>
                  <SelectItem value="Citología / Papanicolaou">Citología / Papanicolaou</SelectItem>
                  <SelectItem value="Pieza Quirúrgica Mayor">Pieza Quirúrgica Mayor (Resección)</SelectItem>
                  <SelectItem value="Biopsia por Aspiración con Aguja Fina (BAAF)">BAAF</SelectItem>
                  <SelectItem value="Inmunohistoquímica">Inmunohistoquímica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Muestra Remitida *</Label>
              <Input
                placeholder="Ej. Fragmento nodular tiroideo, pólipo colónico..."
                className="rounded-xl border-border/80"
                value={formDataPat.muestra}
                onChange={(e) => setFormDataPat(p => ({ ...p, muestra: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Sitio Anatómico</Label>
              <Input
                placeholder="Ej. Lóbulo derecho de tiroides, colon sigmoides..."
                className="rounded-xl border-border/80"
                value={formDataPat.sitio_anatomico}
                onChange={(e) => setFormDataPat(p => ({ ...p, sitio_anatomico: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Diagnóstico Presuntivo / Datos Clínicos</Label>
              <Textarea
                placeholder="Sospecha clínica de malignidad, antecedentes patológicos..."
                className="rounded-xl border-border/80 resize-none h-20"
                value={formDataPat.diagnostico_presuntivo}
                onChange={(e) => setFormDataPat(p => ({ ...p, diagnostico_presuntivo: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewEstudio(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white" 
              onClick={() => crearEstudioPat.mutate()}
              disabled={crearEstudioPat.isPending || !formDataPat.muestra}
            >
              {crearEstudioPat.isPending ? "Guardando..." : "Enviar a Patología"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
