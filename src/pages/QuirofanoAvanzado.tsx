import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/db/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  Activity, 
  ListChecks, 
  HeartPulse, 
  Plus, 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  DoorClosed, 
  Sparkles,
  Scissors,
  Layers,
  CheckCheck
} from "lucide-react";
import { ClinicalPageHeader } from "@/components/clinical/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/clinical/ClinicalKpiCard";
import { AldreteUrpaTab } from "@/components/quirofano/AldreteUrpaTab";

const ESTADOS_SALA: Record<string, { label: string; color: string }> = {
  disponible: { label: "Disponible", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  ocupado: { label: "En Cirugía", color: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/40 animate-pulse" },
  limpieza: { label: "Desinfección Terminal", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  mantenimiento: { label: "Mantenimiento Técnico", color: "bg-muted text-muted-foreground border-border" },
  reservado: { label: "Reservado", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" }
};

export default function QuirofanoAvanzado() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState("programacion");
  const [search, setSearch] = useState("");
  const [showNewCirugia, setShowNewCirugia] = useState(false);
  const [showNewAldrete, setShowNewAldrete] = useState(false);

  // Estado del Checklist Quirúrgico OMS Interactivo
  const [checklist, setChecklist] = useState({
    // 1. Sign In (Antes de inducción)
    identidadConfirmada: true,
    sitioMarcado: true,
    consentimientoFirmado: true,
    pulsioximetroColocado: true,
    alergiasVerificadas: true,
    viaAereaEvaluada: true,
    riesgoHemorragiaPrevisto: false,

    // 2. Time Out (Antes de incisión)
    equipoPresentado: true,
    confirmacionCirujano: true,
    confirmacionAnestesiologo: true,
    confirmacionEnfermeria: true,
    profilaxisAntibiotica60m: true,
    imagenesDisponibles: true,
    esterilidadVerificada: true,

    // 3. Sign Out (Antes de salir)
    conteoGasasConforme: true,
    conteoAgujasConforme: true,
    conteoInstrumentalConforme: true,
    etiquetadoMuestrasCorrecto: true,
    planPostoperatorioAcordado: true
  });

  // Conteo de Material Blanco (en vivo)
  const [conteo, setConteo] = useState({
    gasasIniciales: 20,
    gasasUtilizadas: 15,
    gasasDesechadas: 5,
    compresasIniciales: 10,
    compresasUtilizadas: 8,
    compresasDesechadas: 2,
    agujasIniciales: 6,
    agujasFinales: 6
  });

  // Estado del Test de Aldrete (URPA)
  const [aldrete, setAldrete] = useState({
    actividad: 2, // 2: 4 extremidades, 1: 2 extremidades, 0: ninguna
    respiracion: 2, // 2: profunda y tose, 1: disnea/limitada, 0: apnea
    circulacion: 2, // 2: PA +-20% basal, 1: PA +-20-50%, 0: PA +-50%
    consciencia: 2, // 2: lúcido, 1: despierta al llamado, 0: no responde
    saturacion: 2 // 2: >92% aire ambiente, 1: necesita O2 para >90%, 0: <90%
  });

  // Formulario Cirugía
  const [formDataCirugia, setFormDataCirugia] = useState({
    procedimiento: "",
    quirofano_id: "",
    cirujano: "",
    tipo_anestesia: "General Balanceada",
    fecha_programada: new Date().toISOString().slice(0, 16),
    duracion_estimada_min: "90"
  });

  // Queries
  const { data: salas = [], isLoading: loadingSalas } = useQuery({
    queryKey: ["quirofanos_salas"],
    queryFn: async () => {
      const { data } = await db.from("quirofanos").select("*").order("nombre");
      return (data || []) as any[];
    }
  });

  const { data: programaciones = [], isLoading: loadingProg } = useQuery({
    queryKey: ["programaciones_quirurgicas"],
    queryFn: async () => {
      const { data } = await db
        .from("programaciones_quirurgicas")
        .select("*")
        .order("fecha_programada", { ascending: false })
        .limit(100);
      return (data || []) as any[];
    }
  });

  const { data: urpa = [], isLoading: loadingUrpa } = useQuery({
    queryKey: ["recuperacion_post_anestesica"],
    queryFn: async () => {
      const { data } = await db
        .from("recuperacion_post_anestesica")
        .select("*")
        .order("hora_ingreso_urpa", { ascending: false })
        .limit(50);
      return (data || []) as any[];
    }
  });

  // Mutación: Crear Cirugía
  const crearCirugia = useMutation({
    mutationFn: async () => {
      if (!formDataCirugia.procedimiento) throw new Error("Especifique el procedimiento.");
      const { error } = await db.from("programaciones_quirurgicas").insert({
        procedimiento: formDataCirugia.procedimiento,
        quirofano_id: formDataCirugia.quirofano_id || null,
        tipo_anestesia: formDataCirugia.tipo_anestesia,
        fecha_programada: new Date(formDataCirugia.fecha_programada).toISOString(),
        duracion_estimada_min: parseInt(formDataCirugia.duracion_estimada_min) || 60,
        estado: "programada"
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programaciones_quirurgicas"] });
      toast.success("Cirugía programada en quirófano");
      setShowNewCirugia(false);
      setFormDataCirugia({
        procedimiento: "",
        quirofano_id: "",
        cirujano: "",
        tipo_anestesia: "General Balanceada",
        fecha_programada: new Date().toISOString().slice(0, 16),
        duracion_estimada_min: "90"
      });
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  // Cálculos de Aldrete Score
  const aldreteScoreTotal = useMemo(() => {
    return aldrete.actividad + aldrete.respiracion + aldrete.circulacion + aldrete.consciencia + aldrete.saturacion;
  }, [aldrete]);

  const esAptoAltaURPA = aldreteScoreTotal >= 9;

  // KPIs
  const totalSalas = salas.length;
  const salasOcupadas = salas.filter(s => s.estado === "ocupado").length;
  const salasDisponibles = salas.filter(s => s.estado === "disponible").length;
  const cirugiasHoy = programaciones.length;
  const pacientesUrpa = urpa.length;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      <ClinicalPageHeader
        title="Quirófano & Seguridad Quirúrgica OMS"
        subtitle="Programación operatoria, Checklist de tres fases, conteo de material blanco y Escala de Aldrete (URPA)"
        badge="Bloque Quirúrgico & URPA"
        icon={Activity}
        action={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="rounded-xl border-border/80 shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setTab("checklist")}
            >
              <ListChecks className="h-4 w-4 mr-1.5 text-emerald-600" />
              Checklist OMS
            </Button>
            <Button 
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setShowNewCirugia(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Programar Cirugía
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Quirófanos Disponibles"
          value={`${salasDisponibles} de ${totalSalas}`}
          subtitle={`${salasOcupadas} intervenciones activas`}
          icon={DoorClosed}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="Cirugías Programadas"
          value={cirugiasHoy}
          subtitle="Procedimientos electivos y urgencias"
          icon={Scissors}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Seguridad OMS Verificada"
          value="100%"
          subtitle="Pausa quirúrgica (Time Out) cumplida"
          icon={ShieldCheck}
          variant="teal"
        />
        <ClinicalKpiCard
          title="Pacientes en URPA"
          value={pacientesUrpa}
          subtitle="Recuperación post-anestésica"
          icon={HeartPulse}
          variant="purple"
        />
      </div>

      {/* Pestañas */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl border border-border/60">
          <TabsTrigger value="programacion" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Activity className="h-4 w-4 mr-1.5 text-blue-600" />
            Tabla Quirúrgica ({programaciones.length})
          </TabsTrigger>
          <TabsTrigger value="checklist" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <ListChecks className="h-4 w-4 mr-1.5 text-emerald-600" />
            Checklist Quirúrgico OMS (3 Fases)
          </TabsTrigger>
          <TabsTrigger value="conteo" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <ShieldCheck className="h-4 w-4 mr-1.5 text-teal-600" />
            Conteo de Material Blanco & Gasas
          </TabsTrigger>
          <TabsTrigger value="urpa" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <HeartPulse className="h-4 w-4 mr-1.5 text-purple-600" />
            Escala de Aldrete & URPA ({aldreteScoreTotal}/10)
          </TabsTrigger>
          <TabsTrigger value="salas" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <DoorClosed className="h-4 w-4 mr-1.5 text-slate-600" />
            Quirófanos ({salas.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Programación */}
        <TabsContent value="programacion">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Censo de Procedimientos Quirúrgicos</CardTitle>
              <CardDescription>Horarios programados, asignación de salas y tiempos estimados</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Procedimiento Quirúrgico</TableHead>
                    <TableHead>Fecha / Hora</TableHead>
                    <TableHead>Duración Estimada</TableHead>
                    <TableHead>Técnica Anestésica</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="pr-6 text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingProg ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Cargando programación quirúrgica...
                      </TableCell>
                    </TableRow>
                  ) : programaciones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No hay cirugías programadas para el período.
                      </TableCell>
                    </TableRow>
                  ) : (
                    programaciones.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="pl-6 font-semibold text-sm">
                          {p.procedimiento}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {p.fecha_programada ? new Date(p.fecha_programada).toLocaleString("es-DO") : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {p.duracion_estimada_min} minutos
                        </TableCell>
                        <TableCell className="text-xs">
                          {p.tipo_anestesia || "General"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-md capitalize text-xs">
                            {p.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="rounded-xl h-7 text-xs border-border/80"
                            onClick={() => {
                              setTab("checklist");
                              toast.info(`Cargado checklist para ${p.procedimiento}`);
                            }}
                          >
                            Iniciar Checklist OMS
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Checklist Quirúrgico OMS (3 Fases) */}
        <TabsContent value="checklist">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Fase 1: Sign In */}
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="border-b border-border/60 bg-blue-500/5 pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/30 text-xs">
                    Fase 1
                  </Badge>
                  <CardTitle className="text-sm font-bold text-foreground">Sign In (Antes de Inducción)</CardTitle>
                </div>
                <CardDescription className="text-xs">Con paciente consciente y anestesiólogo presente</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="chk-id" 
                    checked={checklist.identidadConfirmada}
                    onCheckedChange={(c) => setChecklist(p => ({ ...p, identidadConfirmada: !!c }))}
                  />
                  <Label htmlFor="chk-id" className="text-xs leading-relaxed cursor-pointer">
                    Paciente ha confirmado su identidad, sitio quirúrgico y procedimiento.
                  </Label>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="chk-sitio" 
                    checked={checklist.sitioMarcado}
                    onCheckedChange={(c) => setChecklist(p => ({ ...p, sitioMarcado: !!c }))}
                  />
                  <Label htmlFor="chk-sitio" className="text-xs leading-relaxed cursor-pointer">
                    Demarcación del sitio anatómico con marcador dérmico indeleble.
                  </Label>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="chk-consent" 
                    checked={checklist.consentimientoFirmado}
                    onCheckedChange={(c) => setChecklist(p => ({ ...p, consentimientoFirmado: !!c }))}
                  />
                  <Label htmlFor="chk-consent" className="text-xs leading-relaxed cursor-pointer">
                    Consentimiento quirúrgico y anestésico firmado en expediente.
                  </Label>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="chk-pulso" 
                    checked={checklist.pulsioximetroColocado}
                    onCheckedChange={(c) => setChecklist(p => ({ ...p, pulsioximetroColocado: !!c }))}
                  />
                  <Label htmlFor="chk-pulso" className="text-xs leading-relaxed cursor-pointer">
                    Pulsioxímetro colocado y funcionando con curva pletismográfica.
                  </Label>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="chk-alergia" 
                    checked={checklist.alergiasVerificadas}
                    onCheckedChange={(c) => setChecklist(p => ({ ...p, alergiasVerificadas: !!c }))}
                  />
                  <Label htmlFor="chk-alergia" className="text-xs leading-relaxed cursor-pointer">
                    Alergias conocidas consultadas al paciente y anestesiólogo.
                  </Label>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="chk-via" 
                    checked={checklist.viaAereaEvaluada}
                    onCheckedChange={(c) => setChecklist(p => ({ ...p, viaAereaEvaluada: !!c }))}
                  />
                  <Label htmlFor="chk-via" className="text-xs leading-relaxed cursor-pointer">
                    Vía aérea difícil evaluada (Mallampati) e instrumental listo.
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Fase 2: Time Out */}
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="border-b border-border/60 bg-amber-500/5 pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-xs">
                    Fase 2
                  </Badge>
                  <CardTitle className="text-sm font-bold text-foreground">Time Out (Antes de Incisión)</CardTitle>
                </div>
                <CardDescription className="text-xs">Pausa quirúrgica con todo el equipo deteniendo labores</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="chk-equipo" 
                    checked={checklist.equipoPresentado}
                    onCheckedChange={(c) => setChecklist(p => ({ ...p, equipoPresentado: !!c }))}
                  />
                  <Label htmlFor="chk-equipo" className="text-xs leading-relaxed cursor-pointer">
                    Todos los miembros del equipo se han presentado por su nombre y función.
                  </Label>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="chk-cirujano" 
                    checked={checklist.confirmacionCirujano}
                    onCheckedChange={(c) => setChecklist(p => ({ ...p, confirmacionCirujano: !!c }))}
                  />
                  <Label htmlFor="chk-cirujano" className="text-xs leading-relaxed cursor-pointer">
                    Cirujano confirma: pasos críticos, duración prevista y sangrado esperado.
                  </Label>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="chk-anest" 
                    checked={checklist.confirmacionAnestesiologo}
                    onCheckedChange={(c) => setChecklist(p => ({ ...p, confirmacionAnestesiologo: !!c }))}
                  />
                  <Label htmlFor="chk-anest" className="text-xs leading-relaxed cursor-pointer">
                    Anestesiólogo confirma: estabilidad hemodinámica y reserva de hemoderivados.
                  </Label>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="chk-profilaxis" 
                    checked={checklist.profilaxisAntibiotica60m}
                    onCheckedChange={(c) => setChecklist(p => ({ ...p, profilaxisAntibiotica60m: !!c }))}
                  />
                  <Label htmlFor="chk-profilaxis" className="text-xs leading-relaxed cursor-pointer font-semibold text-emerald-700 dark:text-emerald-400">
                    Profilaxis antibiótica administrada en los últimos 60 minutos.
                  </Label>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="chk-esteril" 
                    checked={checklist.esterilidadVerificada}
                    onCheckedChange={(c) => setChecklist(p => ({ ...p, esterilidadVerificada: !!c }))}
                  />
                  <Label htmlFor="chk-esteril" className="text-xs leading-relaxed cursor-pointer">
                    Enfermera instrumentista confirma esterilidad y testigos químicos virados.
                  </Label>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="chk-img" 
                    checked={checklist.imagenesDisponibles}
                    onCheckedChange={(c) => setChecklist(p => ({ ...p, imagenesDisponibles: !!c }))}
                  />
                  <Label htmlFor="chk-img" className="text-xs leading-relaxed cursor-pointer">
                    Imágenes radiológicas diagnósticas proyectadas en pantalla.
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Fase 3: Sign Out */}
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="border-b border-border/60 bg-emerald-500/5 pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-xs">
                    Fase 3
                  </Badge>
                  <CardTitle className="text-sm font-bold text-foreground">Sign Out (Antes de Cierre/Salida)</CardTitle>
                </div>
                <CardDescription className="text-xs">Verificación con cirujano, anestesiólogo e instrumentista</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="chk-gasas" 
                    checked={checklist.conteoGasasConforme}
                    onCheckedChange={(c) => setChecklist(p => ({ ...p, conteoGasasConforme: !!c }))}
                  />
                  <Label htmlFor="chk-gasas" className="text-xs leading-relaxed cursor-pointer font-bold text-foreground">
                    Conteo final de gasas y compresas CONFORME (sin faltantes).
                  </Label>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="chk-agujas" 
                    checked={checklist.conteoAgujasConforme}
                    onCheckedChange={(c) => setChecklist(p => ({ ...p, conteoAgujasConforme: !!c }))}
                  />
                  <Label htmlFor="chk-agujas" className="text-xs leading-relaxed cursor-pointer">
                    Conteo de agujas de sutura y hojas de bisturí completo.
                  </Label>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="chk-instr" 
                    checked={checklist.conteoInstrumentalConforme}
                    onCheckedChange={(c) => setChecklist(p => ({ ...p, conteoInstrumentalConforme: !!c }))}
                  />
                  <Label htmlFor="chk-instr" className="text-xs leading-relaxed cursor-pointer">
                    Conteo de instrumental quirúrgico conforme a la caja CEYE.
                  </Label>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="chk-muestras" 
                    checked={checklist.etiquetadoMuestrasCorrecto}
                    onCheckedChange={(c) => setChecklist(p => ({ ...p, etiquetadoMuestrasCorrecto: !!c }))}
                  />
                  <Label htmlFor="chk-muestras" className="text-xs leading-relaxed cursor-pointer">
                    Etiquetado de biopsia/muestra leído en voz alta con nombre del paciente.
                  </Label>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="chk-plan" 
                    checked={checklist.planPostoperatorioAcordado}
                    onCheckedChange={(c) => setChecklist(p => ({ ...p, planPostoperatorioAcordado: !!c }))}
                  />
                  <Label htmlFor="chk-plan" className="text-xs leading-relaxed cursor-pointer">
                    Plan de analgesia, fluidoterapia y destino a URPA consensuado.
                  </Label>
                </div>

                <div className="pt-3">
                  <Button 
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
                    onClick={() => toast.success("Checklist Quirúrgico OMS verificado y sellado con firma digital")}
                  >
                    <CheckCheck className="h-4 w-4 mr-1.5" />
                    Validar Checklist Quirúrgico
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Conteo de Material Blanco */}
        <TabsContent value="conteo">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-teal-600" />
                Control de Conteo de Material Blanco & Compresas en Cavidad
              </CardTitle>
              <CardDescription>Prevención de retención involuntaria de cuerpos extraños post-cirugía (Never Events)</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl border border-border/80 bg-background space-y-3">
                  <h4 className="font-semibold text-sm flex items-center justify-between">
                    <span>Gasas Quirúrgicas Radiopacas</span>
                    <Badge variant="outline" className="font-mono">Pack 10</Badge>
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-muted/40">
                      <p className="text-muted-foreground">Abiertas</p>
                      <p className="font-mono font-bold text-base">{conteo.gasasIniciales}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-700">
                      <p>En Campo</p>
                      <p className="font-mono font-bold text-base">{conteo.gasasUtilizadas}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-700">
                      <p>Desechadas</p>
                      <p className="font-mono font-bold text-base">{conteo.gasasDesechadas}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full text-xs h-7 rounded-lg"
                      onClick={() => setConteo(p => ({ ...p, gasasIniciales: p.gasasIniciales + 10 }))}
                    >
                      + Abrir Pack (10)
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border/80 bg-background space-y-3">
                  <h4 className="font-semibold text-sm flex items-center justify-between">
                    <span>Compresas Abdominales</span>
                    <Badge variant="outline" className="font-mono">Pack 5</Badge>
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-muted/40">
                      <p className="text-muted-foreground">Abiertas</p>
                      <p className="font-mono font-bold text-base">{conteo.compresasIniciales}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-700">
                      <p>En Campo</p>
                      <p className="font-mono font-bold text-base">{conteo.compresasUtilizadas}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-700">
                      <p>Desechadas</p>
                      <p className="font-mono font-bold text-base">{conteo.compresasDesechadas}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full text-xs h-7 rounded-lg"
                      onClick={() => setConteo(p => ({ ...p, compresasIniciales: p.compresasIniciales + 5 }))}
                    >
                      + Abrir Pack (5)
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border/80 bg-background space-y-3">
                  <h4 className="font-semibold text-sm flex items-center justify-between">
                    <span>Agujas & Hojas Bisturí</span>
                    <Badge variant="outline" className="font-mono">Suturas</Badge>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-muted/40">
                      <p className="text-muted-foreground">Contabilizadas</p>
                      <p className="font-mono font-bold text-base">{conteo.agujasIniciales}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-700">
                      <p>En Imán / Contenedor</p>
                      <p className="font-mono font-bold text-base">{conteo.agujasFinales}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full text-xs h-7 rounded-lg"
                      onClick={() => setConteo(p => ({ ...p, agujasIniciales: p.agujasIniciales + 1, agujasFinales: p.agujasFinales + 1 }))}
                    >
                      + Registrar Sutura
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Balance de Conteo Cerrado
                  </h5>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Todas las piezas abiertas coinciden con el material recuperado fuera del paciente. Cavidad apta para síntesis por planos.
                  </p>
                </div>
                <Badge className="bg-emerald-600 text-white font-mono text-xs">CONFORME</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Escala de Aldrete (URPA) */}
        <TabsContent value="urpa">
          <AldreteUrpaTab
            aldrete={aldrete}
            setAldrete={setAldrete}
            aldreteScoreTotal={aldreteScoreTotal}
            esAptoAltaURPA={esAptoAltaURPA}
          />
        </TabsContent>

        {/* Tab 5: Salas */}
        <TabsContent value="salas">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loadingSalas ? (
              <p className="col-span-full text-center text-muted-foreground py-10">Cargando salas...</p>
            ) : salas.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground py-10">No hay quirófanos registrados.</p>
            ) : (
              salas.map((s) => {
                const estConfig = ESTADOS_SALA[s.estado] || ESTADOS_SALA.disponible;
                return (
                  <Card key={s.id} className="rounded-2xl border-border/80 shadow-xs p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-base text-foreground">{s.nombre}</h4>
                      <Badge variant="outline" className={`rounded-lg capitalize text-xs ${estConfig.color}`}>
                        {estConfig.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tipo: <strong className="text-foreground capitalize">{s.tipo || "Cirugía Mayor"}</strong>
                    </p>
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs font-mono text-muted-foreground">
                      <span>Presión positiva: OK</span>
                      <span className="text-emerald-600">Laminar Flow: Activo</span>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo Programar Cirugía */}
      <Dialog open={showNewCirugia} onOpenChange={setShowNewCirugia}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-emerald-600" />
              Programar Intervención Quirúrgica
            </DialogTitle>
            <DialogDescription>
              Asigne quirófano, técnica anestésica y duración estimada.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Procedimiento Quirúrgico *</Label>
              <Input
                placeholder="Ej. Apendicectomía laparoscópica, Colecistectomía..."
                className="rounded-xl border-border/80"
                value={formDataCirugia.procedimiento}
                onChange={(e) => setFormDataCirugia(p => ({ ...p, procedimiento: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Quirófano</Label>
                <Select 
                  value={formDataCirugia.quirofano_id} 
                  onValueChange={(val) => setFormDataCirugia(p => ({ ...p, quirofano_id: val }))}
                >
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue placeholder="Seleccione sala" />
                  </SelectTrigger>
                  <SelectContent>
                    {salas.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Técnica Anestésica</Label>
                <Select 
                  value={formDataCirugia.tipo_anestesia} 
                  onValueChange={(val) => setFormDataCirugia(p => ({ ...p, tipo_anestesia: val }))}
                >
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General Balanceada">General Balanceada</SelectItem>
                    <SelectItem value="Neuroaxial / Raquídea">Neuroaxial / Raquídea</SelectItem>
                    <SelectItem value="Epidural / Peridural">Epidural / Peridural</SelectItem>
                    <SelectItem value="Bloqueo Periférico">Bloqueo Periférico</SelectItem>
                    <SelectItem value="Sedación + Local">Sedación + Local</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha y Hora</Label>
                <Input
                  type="datetime-local"
                  className="rounded-xl border-border/80 font-mono text-xs"
                  value={formDataCirugia.fecha_programada}
                  onChange={(e) => setFormDataCirugia(p => ({ ...p, fecha_programada: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Duración Estimada (min)</Label>
                <Input
                  type="number"
                  step="15"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataCirugia.duracion_estimada_min}
                  onChange={(e) => setFormDataCirugia(p => ({ ...p, duracion_estimada_min: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewCirugia(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" 
              onClick={() => crearCirugia.mutate()}
              disabled={crearCirugia.isPending || !formDataCirugia.procedimiento}
            >
              {crearCirugia.isPending ? "Programando..." : "Programar Cirugía"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
