import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Navigation,
  MessageCircle,
  Phone,
  CheckCircle2,
  Clock,
  PenTool,
  MapPin,
  Activity,
  HeartPulse,
  Droplet,
  ShieldAlert,
  Briefcase,
  AlertTriangle,
  ChevronRight,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { FirmaDigitalCanvasModal } from "./FirmaDigitalCanvasModal";
import { News2Badge } from "@/components/clinical/News2Badge";
import { OfflineOutbox } from "@/lib/offline/offline-outbox";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

interface VisitaCampo {
  id: string;
  paciente_id?: string;
  paciente_nombre: string;
  paciente_telefono?: string;
  direccion: string;
  zona_barrio: string;
  hora_programada: string;
  motivo: string;
  profesional_nombre: string;
  estado_ruta: "pendiente" | "en_camino" | "en_atencion" | "completada" | "no_accesible";
  checkin_hora?: string;
  checkout_hora?: string;
  signos_vitales?: {
    pa?: string;
    fc?: string;
    spo2?: string;
    glucosa?: string;
  };
  firma_digital?: {
    url: string;
    firmante: string;
    parentesco: string;
  };
}

interface ModoBrigadaCampoProps {
  profesionales: any[];
  profesionalActivoId: string;
  onCambiarProfesional: (id: string) => void;
}

export function ModoBrigadaCampo({
  profesionales,
  profesionalActivoId,
  onCambiarProfesional,
}: ModoBrigadaCampoProps) {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [pendientesOffline, setPendientesOffline] = useState<number>(OfflineOutbox.obtenerConteoPendientes());
  const [sincronizando, setSincronizando] = useState(false);

  // Escuchar cambios de conectividad
  useState(() => {
    if (typeof window !== "undefined") {
      const handleOnline = () => {
        setIsOnline(true);
        toast.success("Conexión restablecida. Listo para sincronizar.");
      };
      const handleOffline = () => {
        setIsOnline(false);
        toast.warning("Modo sin conexión. Los registros se guardarán en la cola local.");
      };
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  });

  const handleSincronizarOutbox = async () => {
    setSincronizando(true);
    const res = await OfflineOutbox.despacharCola();
    setSincronizando(false);
    setPendientesOffline(OfflineOutbox.obtenerConteoPendientes());
    toast.success(`Sincronización completada: ${res.exitosas} registros enviados al servidor.`);
  };
  const [visitasBrigada, setVisitasBrigada] = useState<VisitaCampo[]>([
    {
      id: "v-campo-1",
      paciente_nombre: "Doña Carmen Rodríguez",
      paciente_telefono: "8095551234",
      direccion: "Calle Las Damas #14, Zona Colonial",
      zona_barrio: "Zona Colonial, Santo Domingo",
      hora_programada: "09:00 AM",
      motivo: "Curación de úlcera venosa y control de HTA",
      profesional_nombre: "Lic. Andrea Morales (Enfermería Domiciliaria)",
      estado_ruta: "en_atencion",
      checkin_hora: "09:05 AM",
      signos_vitales: { pa: "135/85", fc: "76", spo2: "97", glucosa: "118" },
    },
    {
      id: "v-campo-2",
      paciente_nombre: "Don Ramón Antonio Batista",
      paciente_telefono: "8295555678",
      direccion: "Av. Independencia #402, Apto 3B, Gazcue",
      zona_barrio: "Gazcue, D.N.",
      hora_programada: "10:30 AM",
      motivo: "Evaluación geriátrica post-alta y cambio de sonda vesical",
      profesional_nombre: "Lic. Andrea Morales (Enfermería Domiciliaria)",
      estado_ruta: "pendiente",
    },
    {
      id: "v-campo-3",
      paciente_nombre: "Mercedes Altagracia Peña",
      paciente_telefono: "8495559012",
      direccion: "Calle Respaldo 17 #8, Ensanche Luperón",
      zona_barrio: "Ens. Luperón, D.N.",
      hora_programada: "12:00 PM",
      motivo: "Administración de antibiótico endovenoso día 3/5",
      profesional_nombre: "Lic. Andrea Morales (Enfermería Domiciliaria)",
      estado_ruta: "pendiente",
    },
  ]);

  const [visitaParaFirmar, setVisitaParaFirmar] = useState<VisitaCampo | null>(null);
  const [visitaExpandidaId, setVisitaExpandidaId] = useState<string | null>("v-campo-1");

  // Iniciar traslado / voy en camino
  const handleVoyEnCamino = (visita: VisitaCampo) => {
    setVisitasBrigada(prev =>
      prev.map(v => (v.id === visita.id ? { ...v, estado_ruta: "en_camino" } : v))
    );
    // Disparar WhatsApp
    const tel = visita.paciente_telefono?.replace(/\D/g, "");
    if (tel) {
      const msg = encodeURIComponent(
        `Hola ${visita.paciente_nombre}, le saluda el equipo de salud domiciliaria de Vitalist Track. Ya vamos en camino a su domicilio (${visita.direccion}) para su atención.`
      );
      window.open(`https://wa.me/${tel}?text=${msg}`, "_blank");
    }
    toast.success(`Estado actualizado: En camino a ${visita.paciente_nombre}`);
  };

  // Check-in llegada
  const handleCheckIn = (visita: VisitaCampo) => {
    const horaActual = format(new Date(), "hh:mm a");
    setVisitasBrigada(prev =>
      prev.map(v => (v.id === visita.id ? { ...v, estado_ruta: "en_atencion", checkin_hora: horaActual } : v))
    );
    if (!isOnline) {
      OfflineOutbox.encolarAccion("check_in", visita.id, visita.paciente_nombre, { hora: horaActual });
      setPendientesOffline(OfflineOutbox.obtenerConteoPendientes());
      toast.info(`Check-in guardado localmente (Offline) a las ${horaActual}.`);
    } else {
      toast.success(`Check-in registrado a las ${horaActual} en el domicilio.`);
    }
  };

  // Actualizar signos vitales
  const handleUpdateSignos = (visitaId: string, campo: string, valor: string) => {
    setVisitasBrigada(prev =>
      prev.map(v => {
        if (v.id !== visitaId) return v;
        return {
          ...v,
          signos_vitales: {
            ...v.signos_vitales,
            [campo]: valor,
          },
        };
      })
    );
  };

  // Guardar firma digital
  const handleGuardarFirma = (datos: { firmaUrl: string; firmanteNombre: string; parentesco: string }) => {
    if (!visitaParaFirmar) return;
    setVisitasBrigada(prev =>
      prev.map(v =>
        v.id === visitaParaFirmar.id
          ? {
              ...v,
              firma_digital: {
                url: datos.firmaUrl,
                firmante: datos.firmanteNombre,
                parentesco: datos.parentesco,
              },
            }
          : v
      )
    );
    setVisitaParaFirmar(null);
  };

  // Check-out / finalizar visita
  const handleCheckOut = (visita: VisitaCampo) => {
    if (!visita.firma_digital) {
      toast.error("Antes de finalizar, el paciente o familiar debe firmar en pantalla la conformidad.");
      setVisitaParaFirmar(visita);
      return;
    }
    const horaActual = format(new Date(), "hh:mm a");
    setVisitasBrigada(prev =>
      prev.map(v => (v.id === visita.id ? { ...v, estado_ruta: "completada", checkout_hora: horaActual } : v))
    );
    toast.success(`Visita completada y firmada para ${visita.paciente_nombre}.`);
  };

  // Abrir GPS en Google Maps o Waze
  const handleAbrirGps = (direccion: string) => {
    const query = encodeURIComponent(direccion);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  const completadas = visitasBrigada.filter(v => v.estado_ruta === "completada").length;

  return (
    <div className="space-y-4">
      {/* Barra de Personal de Campo */}
      <Card className="rounded-2xl border-border/80 shadow-none bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">Modo Brigada / Personal en Campo</span>
                <Badge className="bg-emerald-600 text-white text-[10px] rounded-full">Activo</Badge>
                {isOnline ? (
                  <Badge variant="outline" className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-[10px] gap-1">
                    <Wifi className="h-3 w-3" /> Online
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-[10px] gap-1 animate-pulse">
                    <WifiOff className="h-3 w-3" /> Offline (Outbox)
                  </Badge>
                )}
                {pendientesOffline > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSincronizarOutbox}
                    disabled={sincronizando}
                    className="h-6 px-2 rounded-lg text-[10px] gap-1 bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                  >
                    <RefreshCw className={`h-2.5 w-2.5 ${sincronizando ? "animate-spin" : ""}`} />
                    Sincronizar ({pendientesOffline})
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Optimizado para tabletas y móviles con GPS, Check-in en domicilio y firma táctil
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Profesional de campo:</span>
            <Select value={profesionalActivoId} onValueChange={onCambiarProfesional}>
              <SelectTrigger className="w-52 h-9 rounded-xl text-xs bg-card">
                <SelectValue placeholder="Seleccionar profesional..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {profesionales.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre} {p.apellido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPI de Ruta del Día */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-card border border-border/80 rounded-2xl text-center">
          <span className="text-[11px] text-muted-foreground uppercase font-semibold block">Total Ruta</span>
          <strong className="text-2xl font-black text-foreground tabular-nums">{visitasBrigada.length}</strong>
        </div>
        <div className="p-3 bg-card border border-border/80 rounded-2xl text-center">
          <span className="text-[11px] text-emerald-600 uppercase font-semibold block">Completadas</span>
          <strong className="text-2xl font-black text-emerald-600 tabular-nums">{completadas}</strong>
        </div>
        <div className="p-3 bg-card border border-border/80 rounded-2xl text-center">
          <span className="text-[11px] text-blue-600 uppercase font-semibold block">En Atención</span>
          <strong className="text-2xl font-black text-blue-600 tabular-nums">
            {visitasBrigada.filter(v => v.estado_ruta === "en_atencion").length}
          </strong>
        </div>
        <div className="p-3 bg-card border border-border/80 rounded-2xl text-center">
          <span className="text-[11px] text-amber-600 uppercase font-semibold block">Pendientes</span>
          <strong className="text-2xl font-black text-amber-600 tabular-nums">
            {visitasBrigada.filter(v => v.estado_ruta === "pendiente" || v.estado_ruta === "en_camino").length}
          </strong>
        </div>
      </div>

      {/* Lista de Visitas con Pasos de Campo */}
      <div className="space-y-3">
        {visitasBrigada.map((visita, idx) => {
          const isAtencion = visita.estado_ruta === "en_atencion";
          const isDone = visita.estado_ruta === "completada";
          const isCamino = visita.estado_ruta === "en_camino";

          return (
            <Card
              key={visita.id}
              className={`rounded-2xl border transition-all ${
                isAtencion
                  ? "border-blue-500/60 bg-blue-500/[0.02] shadow-sm"
                  : isDone
                  ? "border-emerald-500/40 bg-emerald-500/[0.01]"
                  : "border-border/80"
              }`}
            >
              <CardContent className="p-4 space-y-3">
                {/* Cabecera de Visita */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-base text-foreground">{visita.paciente_nombre}</h4>
                      <Badge
                        className={`text-[10px] rounded-full capitalize font-medium ${
                          isDone
                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                            : isAtencion
                            ? "bg-blue-500/20 text-blue-700 dark:text-blue-300 animate-pulse"
                            : isCamino
                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {visita.estado_ruta.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                      {visita.direccion} • <span className="font-medium text-foreground">{visita.zona_barrio}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 self-start">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-muted/60 text-foreground">
                      {visita.hora_programada}
                    </span>
                  </div>
                </div>

                {/* Motivo Clínico */}
                <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60 text-xs">
                  <span className="text-muted-foreground font-semibold">Motivo: </span>
                  <span className="text-foreground">{visita.motivo}</span>
                </div>

                {/* Botones de Navegación y Contacto en Campo */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs h-8 gap-1.5 border-border/80"
                    onClick={() => handleAbrirGps(visita.direccion)}
                  >
                    <Navigation className="h-3.5 w-3.5 text-blue-600" />
                    GPS / Waze
                  </Button>

                  {visita.paciente_telefono && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs h-8 gap-1.5 border-border/80 text-emerald-700 dark:text-emerald-400"
                      onClick={() => handleVoyEnCamino(visita)}
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                      Avisar "Voy en camino"
                    </Button>
                  )}

                  {/* Acciones de Flujo de Estado */}
                  {!isAtencion && !isDone && (
                    <Button
                      size="sm"
                      className="rounded-xl text-xs h-8 gap-1.5 shadow-none ml-auto"
                      onClick={() => handleCheckIn(visita)}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Check-in: Llegué al Domicilio
                    </Button>
                  )}

                  {isAtencion && (
                    <div className="flex items-center gap-2 ml-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-xs h-8 gap-1.5 text-purple-600 border-purple-500/30 bg-purple-500/10"
                        onClick={() => setVisitaParaFirmar(visita)}
                      >
                        <PenTool className="h-3.5 w-3.5" />
                        {visita.firma_digital ? "✓ Firma Registrada" : "Solicitar Firma Paciente"}
                      </Button>

                      <Button
                        size="sm"
                        className="rounded-xl text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-none"
                        onClick={() => handleCheckOut(visita)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Finalizar Visita (Check-out)
                      </Button>
                    </div>
                  )}

                  {isDone && (
                    <span className="text-xs text-emerald-600 font-semibold ml-auto flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Visita Completada ({visita.checkout_hora || "10:15 AM"})
                    </span>
                  )}
                </div>

                {/* Panel de Signos Vitales Tomados en el Domicilio */}
                {isAtencion && (
                  <div className="p-3 rounded-2xl bg-card border border-border/70 space-y-2 mt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-primary" /> Signos Vitales en Domicilio
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">P. Arterial (mmHg)</Label>
                        <Input
                          placeholder="120/80"
                          value={visita.signos_vitales?.pa || ""}
                          onChange={e => handleUpdateSignos(visita.id, "pa", e.target.value)}
                          className="h-8 text-xs rounded-xl font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">F. Cardíaca (lpm)</Label>
                        <Input
                          placeholder="75"
                          value={visita.signos_vitales?.fc || ""}
                          onChange={e => handleUpdateSignos(visita.id, "fc", e.target.value)}
                          className="h-8 text-xs rounded-xl font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">SpO2 (%)</Label>
                        <Input
                          placeholder="98"
                          value={visita.signos_vitales?.spo2 || ""}
                          onChange={e => handleUpdateSignos(visita.id, "spo2", e.target.value)}
                          className="h-8 text-xs rounded-xl font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Glucemia (mg/dL)</Label>
                        <Input
                          placeholder="110"
                          value={visita.signos_vitales?.glucosa || ""}
                          onChange={e => handleUpdateSignos(visita.id, "glucosa", e.target.value)}
                          className="h-8 text-xs rounded-xl font-mono"
                        />
                      </div>
                    </div>
                    {/* Cálculo Automático de NEWS2 si hay signos disponibles */}
                    {visita.signos_vitales?.pa && visita.signos_vitales?.spo2 && (
                      <div className="pt-2">
                        <News2Badge
                          params={{
                            presionSistolica: parseInt(visita.signos_vitales.pa.split("/")[0]) || 120,
                            saturacionO2: parseInt(visita.signos_vitales.spo2) || 98,
                            frecuenciaCardiaca: parseInt(visita.signos_vitales.fc || "75") || 75,
                            frecuenciaRespiratoria: 16,
                            nivelConsciencia: "A",
                            temperatura: 36.6,
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal de Firma Digital en Pantalla Táctil */}
      {visitaParaFirmar && (
        <FirmaDigitalCanvasModal
          open={!!visitaParaFirmar}
          onOpenChange={open => !open && setVisitaParaFirmar(null)}
          pacienteNombre={visitaParaFirmar.paciente_nombre}
          onGuardarFirma={handleGuardarFirma}
        />
      )}
    </div>
  );
}
