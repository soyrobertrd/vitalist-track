import { useEffect, useState, useMemo } from "react";
import { db } from "@/integrations/db/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format, getWeek } from "date-fns";
import {
  FileBarChart,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Download,
  Plus,
  Search,
  Filter,
  Biohazard,
  Activity,
  Layers,
  Send,
  Building2,
  FileCheck
} from "lucide-react";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

export interface EnfermedadNotificable {
  codigoCie10: string;
  nombre: string;
  grupoNotificacion: "inmediata_24h" | "semanal" | "especial";
  casosActivos: number;
  casosSemana: number;
  umbralCanalEndemico: "exito" | "seguridad" | "alarma" | "epidemia";
  laboratorioRequerido: string;
}

export interface ReporteSinave {
  id: string;
  semanaEpidemiologica: number;
  ano: number;
  fechaCierre: string;
  estado: "borrador" | "auditado" | "transmitido_digepi";
  totalCasos: number;
  inmediatos24h: number;
  notificador: string;
  observaciones: string;
}

const CATALOGO_DIGEPI_MSP: EnfermedadNotificable[] = [
  {
    codigoCie10: "A97.1",
    nombre: "Dengue con Signos de Alarma",
    grupoNotificacion: "inmediata_24h",
    casosActivos: 14,
    casosSemana: 8,
    umbralCanalEndemico: "alarma",
    laboratorioRequerido: "NS1 / IgM Dengue / PCR arbovirus",
  },
  {
    codigoCie10: "A97.2",
    nombre: "Dengue Grave / Shock por Dengue",
    grupoNotificacion: "inmediata_24h",
    casosActivos: 3,
    casosSemana: 2,
    umbralCanalEndemico: "alarma",
    laboratorioRequerido: "Hemograma seriado / Plaquetas / Pruebas hepáticas",
  },
  {
    codigoCie10: "A00.9",
    nombre: "Cólera (Sospecha clínica)",
    grupoNotificacion: "inmediata_24h",
    casosActivos: 1,
    casosSemana: 1,
    umbralCanalEndemico: "seguridad",
    laboratorioRequerido: "Hisopado rectal Cary-Blair / Cultivo Vibrio cholerae",
  },
  {
    codigoCie10: "A27.9",
    nombre: "Leptospirosis",
    grupoNotificacion: "inmediata_24h",
    casosActivos: 4,
    casosSemana: 3,
    umbralCanalEndemico: "seguridad",
    laboratorioRequerido: "Microaglutinación (MAT) / IgM Leptospira",
  },
  {
    codigoCie10: "B54",
    nombre: "Malaria (Plasmodium falciparum)",
    grupoNotificacion: "semanal",
    casosActivos: 2,
    casosSemana: 1,
    umbralCanalEndemico: "exito",
    laboratorioRequerido: "Gota gruesa / Extendido periférico / PDR",
  },
  {
    codigoCie10: "O95",
    nombre: "Mortalidad Materna Hospitalaria",
    grupoNotificacion: "inmediata_24h",
    casosActivos: 0,
    casosSemana: 0,
    umbralCanalEndemico: "exito",
    laboratorioRequerido: "Autopsia verbal / Auditoría clínica en 24h",
  },
  {
    codigoCie10: "U07.1",
    nombre: "COVID-19 / Infección Respiratoria Aguda Grave (IRAG)",
    grupoNotificacion: "semanal",
    casosActivos: 11,
    casosSemana: 6,
    umbralCanalEndemico: "seguridad",
    laboratorioRequerido: "RT-PCR / Panel respiratorio multiplex",
  },
  {
    codigoCie10: "A15.0",
    nombre: "Tuberculosis Pulmonar Bacilífera",
    grupoNotificacion: "semanal",
    casosActivos: 7,
    casosSemana: 4,
    umbralCanalEndemico: "seguridad",
    laboratorioRequerido: "Baciloscopía ZN / GeneXpert MTB/RIF",
  },
];

const REPORTES_HISTORICOS_MOCK: ReporteSinave[] = [
  {
    id: "EPI-2026-SE43",
    semanaEpidemiologica: 43,
    ano: 2026,
    fechaCierre: "2026-10-25",
    estado: "transmitido_digepi",
    totalCasos: 27,
    inmediatos24h: 9,
    notificador: "Dr. Carlos Valerio (Epidemiología Hospitalaria)",
    observaciones: "Transmisión oficial a la Dirección Provincial de Salud (DPS) sin incidencias.",
  },
  {
    id: "EPI-2026-SE44",
    semanaEpidemiologica: 44,
    ano: 2026,
    fechaCierre: "2026-10-29",
    estado: "auditado",
    totalCasos: 32,
    inmediatos24h: 11,
    notificador: "Dra. Miriam Altagracia Peña",
    observaciones: "Incremento de casos febriles sospechosos de dengue en Área IV. Pendiente consolidación final.",
  },
];

export default function ReportesRegulatorios() {
  const { currentWorkspace } = useWorkspace();
  const [catalogo, setCatalogo] = useState<EnfermedadNotificable[]>(CATALOGO_DIGEPI_MSP);
  const [reportes, setReportes] = useState<ReporteSinave[]>(REPORTES_HISTORICOS_MOCK);
  const [busqueda, setBusqueda] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState<string>("todos");
  const [tabActual, setTabActual] = useState("sinave");
  const [modalOpen, setModalOpen] = useState(false);

  // Formulario nuevo boletín SINAVE
  const semanaActual = useMemo(() => getWeek(new Date()), []);
  const [semanaSel, setSemanaSel] = useState<number>(semanaActual);
  const [notas, setNotas] = useState("");
  const [notificador, setNotificador] = useState("Epidemiología Hospitalaria");

  const totalActivos = useMemo(() => catalogo.reduce((acc, c) => acc + c.casosActivos, 0), [catalogo]);
  const casosInmediatos = useMemo(
    () => catalogo.filter((c) => c.grupoNotificacion === "inmediata_24h").reduce((acc, c) => acc + c.casosActivos, 0),
    [catalogo]
  );
  const alertasEpidemicas = useMemo(
    () => catalogo.filter((c) => c.umbralCanalEndemico === "alarma" || c.umbralCanalEndemico === "epidemia").length,
    [catalogo]
  );

  const handleCrearReporte = () => {
    const nuevo: ReporteSinave = {
      id: `EPI-2026-SE${semanaSel}`,
      semanaEpidemiologica: semanaSel,
      ano: 2026,
      fechaCierre: format(new Date(), "yyyy-MM-dd"),
      estado: "auditado",
      totalCasos: totalActivos,
      inmediatos24h: casosInmediatos,
      notificador,
      observaciones: notas || "Boletín epidemiológico consolidado para DIGEPI / SINAVE.",
    };

    setReportes([nuevo, ...reportes]);
    toast.success(`Boletín SINAVE SE-${semanaSel} generado exitosamente`, {
      description: `Total de ${totalActivos} eventos de notificación obligatoria incluidos.`,
    });
    setModalOpen(false);
  };

  const handleTransmitir = (id: string) => {
    setReportes(
      reportes.map((r) => (r.id === id ? { ...r, estado: "transmitido_digepi" } : r))
    );
    toast.success(`Reporte ${id} transmitido al servidor SINAVE / DIGEPI`, {
      description: "Acuse de recibo electrónico emitido conforme al protocolo MSP-EPI-01.",
    });
  };

  const catalogoFiltrado = catalogo.filter((item) => {
    const matchBusqueda =
      item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.codigoCie10.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.laboratorioRequerido.toLowerCase().includes(busqueda.toLowerCase());
    const matchGrupo = filtroGrupo === "todos" ? true : item.grupoNotificacion === filtroGrupo;
    return matchBusqueda && matchGrupo;
  });

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="Vigilancia Epidemiológica & SINAVE (DIGEPI / MSP)"
        subtitle="Notificación obligatoria de las 47 patologías priorizadas, cálculo de semanas epidemiológicas (SE) y canal endémico institucional"
        icon={FileBarChart}
        badge="Ley General de Salud 42-01 / DIGEPI RD"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-blue-500/30 text-blue-700 dark:text-blue-400"
              onClick={() => {
                toast.info("Descargando Plantilla Oficial EPI-1 (DIGEPI)...", {
                  description: "Formato CSV / XML homologado con el Sistema Nacional de Vigilancia.",
                });
              }}
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar EPI-1 (XML/CSV)
            </Button>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo Boletín Semanal (SE-{semanaActual})
            </Button>
          </div>
        }
      />

      {/* KPIs Epidemiológicos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ClinicalKpiCard
          title="Casos Notificación Inmediata (<24h)"
          value={casosInmediatos}
          subtitle="Dengue con alarma, Cólera, Leptospirosis"
          icon={Biohazard}
          variant="rose"
          alert={casosInmediatos > 0}
        />
        <ClinicalKpiCard
          title="Semana Epidemiológica Activa"
          value={`SE-${semanaActual}`}
          subtitle={`Año calendario 2026 / Período epidemiológico`}
          icon={Calendar}
          variant="teal"
        />
        <ClinicalKpiCard
          title="Eventos en Zona de Alarma / Epidemia"
          value={alertasEpidemicas}
          subtitle="Superan el percentil 75 del canal endémico"
          icon={AlertTriangle}
          variant="amber"
          alert={alertasEpidemicas > 0}
        />
        <ClinicalKpiCard
          title="Boletines Transmitidos a DIGEPI"
          value={reportes.filter((r) => r.estado === "transmitido_digepi").length}
          subtitle="100% de cumplimiento normativo hospitalario"
          icon={ShieldAlert}
          variant="emerald"
        />
      </div>

      <Tabs value={tabActual} onValueChange={setTabActual} className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="sinave" className="text-xs sm:text-sm">
              <FileBarChart className="h-4 w-4 mr-1.5" />
              Boletines SINAVE ({reportes.length})
            </TabsTrigger>
            <TabsTrigger value="catalogo" className="text-xs sm:text-sm">
              <Biohazard className="h-4 w-4 mr-1.5" />
              Catálogo 47 Enfermedades
            </TabsTrigger>
            <TabsTrigger value="canal" className="text-xs sm:text-sm">
              <Activity className="h-4 w-4 mr-1.5" />
              Canal Endémico
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por patología, CIE-10, prueba..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
            <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
              <SelectTrigger className="w-44 h-9 text-xs">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los Grupos</SelectItem>
                <SelectItem value="inmediata_24h">Inmediata (&lt; 24h)</SelectItem>
                <SelectItem value="semanal">Semanal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tab 1: Boletines Semanales SINAVE */}
        <TabsContent value="sinave" className="space-y-3">
          {reportes.map((r) => (
            <Card key={r.id} className="border-border/80 hover:shadow-sm transition-all">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-primary">{r.id}</span>
                      <Badge variant="outline" className="text-xs">
                        Semana Epidemiológica {r.semanaEpidemiologica} ({r.ano})
                      </Badge>
                      <Badge
                        className={
                          r.estado === "transmitido_digepi"
                            ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                            : "bg-blue-500/15 text-blue-700 border-blue-500/30"
                        }
                      >
                        {r.estado === "transmitido_digepi" ? "✓ Transmitido a DIGEPI" : "En Auditoría Interna"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Responsable: <strong className="text-foreground">{r.notificador}</strong> · Fecha de consolidación: {r.fechaCierre}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono">
                      Total eventos: <strong>{r.totalCasos}</strong> (<strong>{r.inmediatos24h}</strong> STAT)
                    </span>
                    {r.estado !== "transmitido_digepi" && (
                      <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => handleTransmitir(r.id)}>
                        <Send className="h-3.5 w-3.5 mr-1" />
                        Transmitir a SINAVE
                      </Button>
                    )}
                  </div>
                </div>

                <div className="bg-muted/40 p-2.5 rounded-xl text-xs">
                  <span className="text-muted-foreground">Observaciones epidemiológicas:</span>{" "}
                  <span className="text-foreground">{r.observaciones}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Tab 2: Catálogo Oficial de Enfermedades Notificables */}
        <TabsContent value="catalogo" className="space-y-3">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Biohazard className="h-5 w-5 text-rose-500" />
                Matriz de Notificación Obligatoria (DIGEPI / MSP República Dominicana)
              </CardTitle>
              <CardDescription>
                Listado oficial de patologías con umbral de transmisión, CIE-10 y exigencia de confirmación por laboratorio de referencia.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">CIE-10</TableHead>
                    <TableHead>Enfermedad / Evento</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Casos Activos</TableHead>
                    <TableHead>Canal Endémico</TableHead>
                    <TableHead>Prueba Requerida</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalogoFiltrado.map((c) => (
                    <TableRow key={c.codigoCie10}>
                      <TableCell className="font-mono font-bold text-xs">{c.codigoCie10}</TableCell>
                      <TableCell className="font-semibold text-xs">{c.nombre}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            c.grupoNotificacion === "inmediata_24h"
                              ? "bg-red-500/10 text-red-700 border-red-500/30 text-[10px]"
                              : "bg-blue-500/10 text-blue-700 border-blue-500/30 text-[10px]"
                          }
                        >
                          {c.grupoNotificacion === "inmediata_24h" ? "Inmediata (<24h)" : "Semanal"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{c.casosActivos} casos</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            c.umbralCanalEndemico === "alarma" || c.umbralCanalEndemico === "epidemia"
                              ? "bg-red-600 text-white text-[10px]"
                              : c.umbralCanalEndemico === "seguridad"
                              ? "bg-amber-500 text-white text-[10px]"
                              : "bg-emerald-600 text-white text-[10px]"
                          }
                        >
                          Zona de {c.umbralCanalEndemico.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.laboratorioRequerido}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Explicación del Canal Endémico */}
        <TabsContent value="canal" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Metodología del Canal Endémico (Cuartiles de Bortman)
              </CardTitle>
              <CardDescription>
                Construcción de zonas epidemiológicas basada en la mediana histórica de los últimos 5 años sin brotes epidémicos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
                  <Badge className="bg-emerald-600 text-white">Zona de Éxito (&lt; Q1)</Badge>
                  <p className="font-semibold text-foreground">Incidencia por debajo del percentil 25</p>
                  <p className="text-muted-foreground">Comportamiento excepcionalmente bajo. Medidas preventivas comunitarias eficaces.</p>
                </div>
                <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-1">
                  <Badge className="bg-blue-600 text-white">Zona de Seguridad (Q1 - Q2)</Badge>
                  <p className="font-semibold text-foreground">Incidencia entre percentil 25 y mediana</p>
                  <p className="text-muted-foreground">Cifras esperadas para la época del año en la demarcación de salud.</p>
                </div>
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1">
                  <Badge className="bg-amber-600 text-white">Zona de Alarma (Q2 - Q3)</Badge>
                  <p className="font-semibold text-foreground">Incidencia entre mediana y percentil 75</p>
                  <p className="text-muted-foreground">Riesgo inminente de brote. Alerta a comités de bioseguridad e insumos diagnósticos.</p>
                </div>
                <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/5 space-y-1">
                  <Badge className="bg-red-600 text-white animate-pulse">Zona de Epidemia (&gt; Q3)</Badge>
                  <p className="font-semibold text-foreground">Supera el percentil 75 histórico</p>
                  <p className="text-muted-foreground">Brote epidémico confirmado. Convocatoria del Comité Hospitalario de Emergencias.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Nuevo Boletín */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileCheck className="h-5 w-5 text-blue-600" />
              Consolidar Boletín Epidemiológico Semanal
            </DialogTitle>
            <DialogDescription>
              Generación de informe EPI-1 para notificación oficial a la DPS y DIGEPI.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Semana Epidemiológica (SE 1-52) *</Label>
              <Input
                type="number"
                min="1"
                max="52"
                value={semanaSel}
                onChange={(e) => setSemanaSel(parseInt(e.target.value) || 1)}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Responsable Notificador *</Label>
              <Input
                value={notificador}
                onChange={(e) => setNotificador(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Observaciones del Período</Label>
              <Input
                placeholder="Hallazgos relevantes, brotes identificados..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="h-8"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCrearReporte}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Generar Boletín
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
