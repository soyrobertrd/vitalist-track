import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { format, differenceInMinutes } from "date-fns";
import {
  Siren,
  Zap,
  Clock,
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  BedDouble,
  Search,
  Plus,
  Flame,
  Stethoscope,
  HeartPulse,
  Radio,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Volume2,
} from "lucide-react";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";
import {
  NivelManchester,
  PacienteUrgencias,
  CONFIG_MANCHESTER,
  BOXES_URGENCIAS,
  PACIENTES_INICIALES,
} from "@/data/urgencias-manchester";
import { NuevoTriajeModal } from "@/components/urgencias/NuevoTriajeModal";

export default function UrgenciasTriage() {
  const [pacientes, setPacientes] = useState<PacienteUrgencias[]>(PACIENTES_INICIALES);
  const [filtroNivel, setFiltroNivel] = useState<NivelManchester | "todos">("todos");
  const [busqueda, setBusqueda] = useState("");
  const [alertaActiva, setAlertaActiva] = useState<string | null>("Código Azul activo en Shock Room 1");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  // Cronómetro de actualización en vivo
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  const handleGuardarTriaje = (nuevo: PacienteUrgencias) => {
    setPacientes([nuevo, ...pacientes]);
  };

  const handleActualizarEstado = (id: string, nuevoEstado: PacienteUrgencias["estado"], box?: string) => {
    setPacientes((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            estado: nuevoEstado,
            box_asignado: box !== undefined ? box : p.box_asignado,
          };
        }
        return p;
      })
    );
    toast.success(`Estado de ${id} actualizado a ${nuevoEstado.replace("_", " ").toUpperCase()}`);
  };

  const handleActivarCodigo = (tipo: "azul" | "trauma") => {
    const texto =
      tipo === "azul"
        ? "CÓDIGO AZUL ACTIVADO: Paro cardiorrespiratorio en Urgencias/Shock Room."
        : "CÓDIGO TRAUMA ACTIVADO: Politraumatizado grave en camino hacia Reanimación.";
    setAlertaActiva(texto);
    toast.error(texto, {
      duration: 8000,
      description: "Equipo de respuesta rápida y reanimación notificado inmediatamente.",
    });
  };

  // Filtrado
  const pacientesFiltrados = useMemo(() => {
    return pacientes.filter((p) => {
      const matchNivel = filtroNivel === "todos" ? true : p.nivel === filtroNivel;
      const matchTexto =
        p.paciente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.id.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.motivo_consulta.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.flujograma.toLowerCase().includes(busqueda.toLowerCase());
      return matchNivel && matchTexto;
    });
  }, [pacientes, filtroNivel, busqueda]);

  // KPIs en vivo
  const totalActivos = pacientes.filter((p) => p.estado !== "egresado").length;
  const nivel1Stat = pacientes.filter((p) => p.nivel === 1 && p.estado !== "egresado").length;
  const nivel2MuyUrgente = pacientes.filter((p) => p.nivel === 2 && p.estado !== "egresado").length;
  const enEspera = pacientes.filter((p) => p.estado === "en_espera").length;

  return (
    <div className="space-y-6">
      {/* Alerta de Código Hospitalario */}
      {alertaActiva && (
        <div className="p-3.5 bg-red-600 text-white rounded-2xl flex items-center justify-between shadow-sm animate-pulse border border-red-700">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <Radio className="h-5 w-5 shrink-0" />
            <span>ALERTA DE EMERGENCIA: {alertaActiva}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl"
            onClick={() => setAlertaActiva(null)}
          >
            Reconocer y Desactivar
          </Button>
        </div>
      )}

      {/* Header Modo B */}
      <ClinicalPageHeader
        title="Urgencias & Triage Manchester (MTS)"
        description="Clasificación en 5 niveles, cronómetros decrecientes de tiempo máximo y gestión de boxes de reanimación"
        icon={Siren}
        badgeText="MTS Nivel I a V"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-rose-500/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
              onClick={() => handleActivarCodigo("azul")}
            >
              <Zap className="h-4 w-4" /> Código Azul STAT
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-4 w-4" /> Clasificar Paciente
            </Button>
          </div>
        }
      />

      {/* KPI Cards Modo B */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ClinicalKpiCard
          label="Nivel 1 - Reanimación (STAT)"
          value={nivel1Stat}
          subtitle="Atención inmediata requerida"
          icon={AlertOctagon}
          color="rose"
        />
        <ClinicalKpiCard
          label="Nivel 2 - Muy Urgente"
          value={nivel2MuyUrgente}
          subtitle="Tiempo meta ≤ 10 minutos"
          icon={Zap}
          color="amber"
        />
        <ClinicalKpiCard
          label="Pacientes en Espera"
          value={enEspera}
          subtitle="Aguardando médico de urgencias"
          icon={Clock}
          color="teal"
        />
        <ClinicalKpiCard
          label="Censo Urgencias Total"
          value={totalActivos}
          subtitle="Boxes + Sala de Espera"
          icon={Activity}
          color="indigo"
        />
      </div>

      {/* Selector de Nivel Manchester para Filtro Rápido */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-card rounded-2xl border border-border/80">
        <span className="text-xs font-semibold text-muted-foreground ml-2 mr-1">Filtrar MTS:</span>
        <Button
          size="sm"
          variant={filtroNivel === "todos" ? "default" : "outline"}
          className="h-8 text-xs rounded-xl"
          onClick={() => setFiltroNivel("todos")}
        >
          Todos ({pacientes.length})
        </Button>
        {([1, 2, 3, 4, 5] as NivelManchester[]).map((lvl) => {
          const cfg = CONFIG_MANCHESTER[lvl];
          const count = pacientes.filter((p) => p.nivel === lvl && p.estado !== "egresado").length;
          const isActivo = filtroNivel === lvl;
          return (
            <Button
              key={lvl}
              size="sm"
              variant="outline"
              onClick={() => setFiltroNivel(lvl)}
              className={`h-8 text-xs rounded-xl gap-1.5 transition-all ${
                isActivo
                  ? `${cfg.badgeClass} ring-2 ring-primary font-semibold`
                  : "border-border/60 hover:bg-muted"
              }`}
            >
              <span>Nivel {lvl} ({cfg.codigoColor})</span>
              <span className="font-mono font-bold">[{count}]</span>
            </Button>
          );
        })}
      </div>

      <Tabs defaultValue="espera" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <TabsList className="bg-card border border-border/80 p-1 rounded-xl">
            <TabsTrigger value="espera" className="rounded-lg gap-2 text-xs sm:text-sm">
              <Clock className="h-4 w-4" />
              Lista de Triaje y Tiempos ({pacientesFiltrados.length})
            </TabsTrigger>
            <TabsTrigger value="boxes" className="rounded-lg gap-2 text-xs sm:text-sm">
              <BedDouble className="h-4 w-4" />
              Boxes & Shock Room ({BOXES_URGENCIAS.length})
            </TabsTrigger>
            <TabsTrigger value="guia" className="rounded-lg gap-2 text-xs sm:text-sm">
              <ShieldAlert className="h-4 w-4" />
              Guía de Discriminadores MTS
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por paciente, motivo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-background/50"
            />
          </div>
        </div>

        {/* Tab 1: Pacientes y Cronómetros */}
        <TabsContent value="espera" className="space-y-3">
          {pacientesFiltrados.length === 0 ? (
            <Card className="rounded-2xl border-border/80">
              <CardContent className="p-8 text-center text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="font-medium">No hay pacientes en espera con este criterio de triaje.</p>
              </CardContent>
            </Card>
          ) : (
            pacientesFiltrados.map((p) => {
              const cfg = CONFIG_MANCHESTER[p.nivel];
              const minsEspera = differenceInMinutes(now, new Date(p.hora_llegada));
              const tiempoExcedido = cfg.tiempoMaxMin > 0 && minsEspera > cfg.tiempoMaxMin;
              const porcentajeTiempo =
                cfg.tiempoMaxMin > 0 ? Math.min(100, Math.round((minsEspera / cfg.tiempoMaxMin) * 100)) : 100;

              return (
                <Card
                  key={p.id}
                  className={`rounded-2xl transition-all shadow-sm ${
                    p.nivel === 1
                      ? "border-red-600 bg-red-600/5"
                      : p.nivel === 2
                      ? "border-orange-500/50 bg-orange-500/5"
                      : "border-border/80"
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                      <div className="flex items-center gap-3">
                        <Badge className={`${cfg.badgeClass} text-xs px-2.5 py-1 font-mono uppercase shadow-none`}>
                          Nivel {p.nivel} · {cfg.codigoColor}
                        </Badge>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base text-foreground">{p.paciente_nombre}</span>
                            <span className="text-xs text-muted-foreground font-mono">({p.edad_sexo})</span>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {p.id}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Flujograma: <strong className="text-foreground">{p.flujograma}</strong> · Ingreso:{" "}
                            {format(new Date(p.hora_llegada), "hh:mm a")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {p.box_asignado ? (
                          <Badge variant="secondary" className="text-xs font-medium">
                            <BedDouble className="h-3.5 w-3.5 mr-1 text-primary" />
                            {p.box_asignado}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/40">
                            En Sala de Espera
                          </Badge>
                        )}
                        <Badge
                          variant={
                            p.estado === "en_atencion"
                              ? "default"
                              : p.estado === "observacion"
                              ? "secondary"
                              : "outline"
                          }
                          className="capitalize text-xs"
                        >
                          {p.estado.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>

                    {/* Motivo y Discriminador Clave */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-muted/30 p-3 rounded-xl text-xs border border-border/50">
                      <div className="md:col-span-2 space-y-1">
                        <p className="font-medium text-foreground">
                          <span className="text-muted-foreground font-normal">Motivo:</span> {p.motivo_consulta}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Discriminador MTS:</span> {p.discriminador}
                        </p>
                        {p.observaciones && <p className="italic text-muted-foreground font-sans">Nota: {p.observaciones}</p>}
                      </div>

                      {/* Signos Vitales condensados */}
                      <div className="space-y-1 font-mono border-l pl-3 border-border/60">
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                          <span>TA: <strong className="text-foreground">{p.signos_vitales.ta}</strong></span>
                          <span>FC: <strong className="text-foreground">{p.signos_vitales.fc} lpm</strong></span>
                          <span>FR: <strong className="text-foreground">{p.signos_vitales.fr} rpm</strong></span>
                          <span>SpO2: <strong className={p.signos_vitales.spo2 < 92 ? "text-red-500 font-bold" : "text-foreground"}>{p.signos_vitales.spo2}%</strong></span>
                          <span>Temp: <strong className="text-foreground">{p.signos_vitales.temp}°C</strong></span>
                          <span>EVA: <strong className="text-foreground">{p.signos_vitales.eva}/10</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Cronómetro de Espera y Barra de Tiempo */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          Tiempo transcurrido: <span className="font-mono font-bold">{minsEspera} minutos</span>
                          {tiempoExcedido && (
                            <span className="text-red-600 font-bold animate-pulse ml-2 flex items-center gap-0.5">
                              <AlertTriangle className="h-3 w-3" /> ¡TIEMPO MÁXIMO EXCEDIDO! (Límite: {cfg.prioridadTexto})
                            </span>
                          )}
                        </span>
                        <span className="text-muted-foreground font-mono">
                          Meta MTS: {cfg.prioridadTexto}
                        </span>
                      </div>
                      {cfg.tiempoMaxMin > 0 && (
                        <Progress
                          value={porcentajeTiempo}
                          className={`h-1.5 rounded-full ${tiempoExcedido ? "[&>div]:bg-red-600" : "[&>div]:bg-primary"}`}
                        />
                      )}
                    </div>

                    {/* Acciones Rápidas */}
                    <div className="flex flex-wrap justify-end gap-2 pt-1 border-t border-border/40">
                      {p.estado === "en_espera" && (
                        <Button
                          size="sm"
                          variant="default"
                          className="h-8 text-xs rounded-xl bg-primary text-white"
                          onClick={() => handleActualizarEstado(p.id, "en_atencion", "Box de Urgencias")}
                        >
                          <Stethoscope className="h-3.5 w-3.5 mr-1" />
                          Ingresar a Consulta / Box
                        </Button>
                      )}
                      {p.estado === "en_atencion" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs rounded-xl text-amber-600 border-amber-500/30"
                            onClick={() => handleActualizarEstado(p.id, "observacion", "Box Observación")}
                          >
                            <BedDouble className="h-3.5 w-3.5 mr-1" />
                            Pasar a Observación
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs rounded-xl text-emerald-600 border-emerald-500/30"
                            onClick={() => handleActualizarEstado(p.id, "egresado")}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Egresar / Alta
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Tab 2: Boxes de Urgencias y Ocupación */}
        <TabsContent value="boxes" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {BOXES_URGENCIAS.map((b) => {
              const estaOcupado = !!b.ocupadoPor;
              return (
                <Card
                  key={b.id}
                  className={`rounded-2xl border-border/80 shadow-sm ${
                    estaOcupado ? "border-amber-500/40 bg-amber-500/5" : ""
                  }`}
                >
                  <CardHeader className="p-3 pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xs font-mono font-semibold">{b.id}</CardTitle>
                      <Badge
                        variant={estaOcupado ? "default" : "outline"}
                        className={`text-[10px] ${estaOcupado ? "bg-amber-600" : "text-emerald-600 border-emerald-500/40"}`}
                      >
                        {estaOcupado ? "Ocupado" : "Disponible"}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs font-sans font-medium text-foreground">
                      {b.nombre}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 text-xs">
                    {estaOcupado ? (
                      <p className="text-muted-foreground">
                        Paciente: <strong className="text-foreground">{b.ocupadoPor}</strong>
                      </p>
                    ) : (
                      <p className="text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Listo para ingreso
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab 3: Guía y Algoritmo Manchester (MTS) */}
        <TabsContent value="guia" className="space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 font-bold">
                <ShieldAlert className="h-5 w-5 text-rose-500" />
                Protocolo Manchester de Clasificación de Urgencias (MTS)
              </CardTitle>
              <CardDescription className="text-xs">
                Sistema estandarizado internacionalmente para priorización de pacientes según gravedad clínica objetiva y no por orden de llegada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {([1, 2, 3, 4, 5] as NivelManchester[]).map((lvl) => {
                  const cfg = CONFIG_MANCHESTER[lvl];
                  return (
                    <div key={lvl} className={`p-3.5 rounded-2xl border ${cfg.cardBorder} ${cfg.bgLight} space-y-2`}>
                      <Badge className={`${cfg.badgeClass} w-full justify-center shadow-none`}>
                        Nivel {lvl} - {cfg.codigoColor}
                      </Badge>
                      <p className="text-xs font-semibold text-foreground text-center">{cfg.nombre}</p>
                      <p className="text-xs text-center font-mono font-bold text-foreground">Tiempo: {cfg.prioridadTexto}</p>
                      <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pl-3">
                        {lvl === 1 && (
                          <>
                            <li>Paro cardiorrespiratorio</li>
                            <li>Obstrucción de vía aérea</li>
                            <li>Shock o hemorragia exanguinante</li>
                            <li>Coma profundo (Glasgow ≤ 8)</li>
                          </>
                        )}
                        {lvl === 2 && (
                          <>
                            <li>Dolor torácico típico coronario</li>
                            <li>Déficit motor agudo (sospecha ACV)</li>
                            <li>Dolor severo extremo (EVA 9-10)</li>
                            <li>SatO2 &lt; 90% con dificultad</li>
                          </>
                        )}
                        {lvl === 3 && (
                          <>
                            <li>Dolor moderado a severo (EVA 6-8)</li>
                            <li>Fiebre alta &gt; 39°C en adulto</li>
                            <li>Disnea moderada (SatO2 91-94%)</li>
                            <li>Vómitos incoercibles</li>
                          </>
                        )}
                        {lvl === 4 && (
                          <>
                            <li>Dolor leve a moderado (EVA 3-5)</li>
                            <li>Trauma menor sin deformidad</li>
                            <li>Cefalea habitual de días</li>
                            <li>Heridas superficiales</li>
                          </>
                        )}
                        {lvl === 5 && (
                          <>
                            <li>Problemas crónicos estables</li>
                            <li>Trámites médicos o recetas</li>
                            <li>Curaciones o retiro de puntos</li>
                            <li>Dolor banal (EVA 0-2)</li>
                          </>
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Asistido */}
      <NuevoTriajeModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onGuardar={handleGuardarTriaje}
      />
    </div>
  );
}
