import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Flame,
  AlertOctagon,
  Clock,
  Zap,
  Activity,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Pill,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export interface PacienteTriage {
  id: string;
  paciente_nombre: string;
  edad: string;
  motivo_llegada: string;
  nivel_triage: 1 | 2 | 3 | 4 | 5; // 1: Rojo, 2: Naranja, 3: Amarillo, 4: Verde, 5: Azul
  tiempo_espera_max_min: number;
  ta: string;
  fc: number;
  fr: number;
  spo2: number;
  temperatura: number;
  glasgow: number;
  hora_ingreso: string;
  estado: "en_espera" | "en_box_trauma" | "en_observacion" | "atendido";
}

const NIVELES_MANCHESTER = {
  1: { nivel: 1, nombre: "Nivel 1 - Reanimación / Resucitación", color: "bg-red-600 text-white border-red-700 animate-pulse", tiempo: "Inmediato (0 min)", icono: AlertOctagon },
  2: { nivel: 2, nombre: "Nivel 2 - Emergencia / Muy Urgente", color: "bg-orange-500 text-white border-orange-600", tiempo: "≤ 10 minutos", icono: Zap },
  3: { nivel: 3, nombre: "Nivel 3 - Urgente", color: "bg-amber-400 text-slate-950 border-amber-500", tiempo: "≤ 60 minutos", icono: Clock },
  4: { nivel: 4, nombre: "Nivel 4 - Menor / Estándar", color: "bg-emerald-600 text-white border-emerald-700", tiempo: "≤ 120 minutos", icono: Activity },
  5: { nivel: 5, nombre: "Nivel 5 - No Urgente", color: "bg-blue-600 text-white border-blue-700", tiempo: "≤ 240 minutos", icono: Clock },
};

export function EnfermeriaEmergenciasTab() {
  const [pacientesTriage, setPacientesTriage] = useState<PacienteTriage[]>([
    {
      id: "tr-1",
      paciente_nombre: "José Manuel Tavárez",
      edad: "45 años",
      motivo_llegada: "Dolor precordial opresivo irradiado a mandíbula, diaforesis profusa",
      nivel_triage: 1,
      tiempo_espera_max_min: 0,
      ta: "85/50",
      fc: 135,
      fr: 28,
      spo2: 91,
      temperatura: 36.4,
      glasgow: 14,
      hora_ingreso: format(new Date(Date.now() - 300000), "HH:mm"),
      estado: "en_box_trauma",
    },
    {
      id: "tr-2",
      paciente_nombre: "Ana Luisa Castillo",
      edad: "29 años",
      motivo_llegada: "Crisis asmática severa con sibilancias audibles y tiraje intercostal",
      nivel_triage: 2,
      tiempo_espera_max_min: 10,
      ta: "140/90",
      fc: 118,
      fr: 30,
      spo2: 90,
      temperatura: 37.1,
      glasgow: 15,
      hora_ingreso: format(new Date(Date.now() - 600000), "HH:mm"),
      estado: "en_espera",
    },
    {
      id: "tr-3",
      paciente_nombre: "Marcos Antonio Peña",
      edad: "62 años",
      motivo_llegada: "Dolor abdominal agudo fosa ilíaca derecha de 12h de evolución",
      nivel_triage: 3,
      tiempo_espera_max_min: 60,
      ta: "130/80",
      fc: 88,
      fr: 18,
      spo2: 98,
      temperatura: 38.3,
      glasgow: 15,
      hora_ingreso: format(new Date(Date.now() - 1800000), "HH:mm"),
      estado: "en_observacion",
    },
  ]);

  const [codigoAzulActivo, setCodigoAzulActivo] = useState(false);
  const [medicacionesStat, setMedicacionesStat] = useState<any[]>([
    { id: "stat-1", hora: "21:30", paciente: "José Manuel Tavárez", farmaco: "Adrenalina 1mg IV bolo", enfermera: "Lic. Raquel Soto", estado: "administrada" },
    { id: "stat-2", hora: "21:32", paciente: "Ana Luisa Castillo", farmaco: "Hidrocortisona 200mg IV STAT + Salbutamol nebulizado", enfermera: "Lic. Miguel Cruz", estado: "administrada" },
  ]);

  const [nuevoFarmacoStat, setNuevoFarmacoStat] = useState("");
  const [pacienteStat, setPacienteStat] = useState(pacientesTriage[0]?.paciente_nombre || "");

  const handleActivarCodigoAzul = () => {
    setCodigoAzulActivo(true);
    toast.error("¡CÓDIGO AZUL ACTIVADO EN EMERGENCIA! Alerta enviada a todo el equipo de reanimación.");
  };

  const handleDesactivarCodigoAzul = () => {
    setCodigoAzulActivo(false);
    toast.success("Código Azul desactivado. Paciente estabilizado.");
  };

  const handleRegistrarStat = () => {
    if (!nuevoFarmacoStat.trim()) {
      toast.error("Ingrese el fármaco y dosis STAT");
      return;
    }
    const nuevo = {
      id: `stat-${Date.now()}`,
      hora: format(new Date(), "HH:mm:ss"),
      paciente: pacienteStat,
      farmaco: nuevoFarmacoStat.trim(),
      enfermera: "Enfermera de Turno",
      estado: "administrada",
    };
    setMedicacionesStat([nuevo, ...medicacionesStat]);
    setNuevoFarmacoStat("");
    toast.success(`Fármaco STAT administrado a ${pacienteStat}`);
  };

  return (
    <div className="space-y-6">
      {/* Banner de Código Azul */}
      <div className={`p-4 rounded-2xl border transition-all ${
        codigoAzulActivo
          ? "bg-red-600 text-white border-red-700 animate-pulse"
          : "bg-card border-border/80 flex items-center justify-between"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${
            codigoAzulActivo ? "bg-white text-red-600" : "bg-red-500/10 text-red-600 dark:text-red-400"
          }`}>
            <AlertOctagon className="h-6 w-6" />
          </div>
          <div>
            <h3 className={`text-base font-bold ${codigoAzulActivo ? "text-white" : "text-foreground"}`}>
              {codigoAzulActivo ? "¡ALERTA CÓDIGO AZUL EN CURSO - BOX DE SHOCK TRAUMA!" : "Protocolo de Emergencia & Código Azul"}
            </h3>
            <p className={`text-xs ${codigoAzulActivo ? "text-red-100" : "text-muted-foreground"}`}>
              {codigoAzulActivo
                ? "Prioridad máxima. Carro de paro listo, desfibrilador conectado y vía aérea asegurada."
                : "Sistema de activación inmediata de equipo de reanimación cardiopulmonar"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          {codigoAzulActivo ? (
            <Button
              variant="secondary"
              className="rounded-xl font-bold text-xs bg-white text-red-700 hover:bg-slate-100 shadow-none"
              onClick={handleDesactivarCodigoAzul}
            >
              Desactivar / Paciente Estable
            </Button>
          ) : (
            <Button
              className="rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-none gap-1.5"
              onClick={handleActivarCodigoAzul}
            >
              <Radio className="h-4 w-4 animate-ping" /> Activar Código Azul STAT
            </Button>
          )}
        </div>
      </div>

      {/* Triage Manchester Clasificación en Vivo */}
      <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
        <CardHeader className="bg-muted/15 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold">Triage Manchester de Urgencias</CardTitle>
              <p className="text-xs text-muted-foreground">
                Estratificación de prioridad clínica de 5 niveles con tiempo máximo de espera
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {Object.values(NIVELES_MANCHESTER).map(niv => (
                <span
                  key={niv.nivel}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${niv.color}`}
                >
                  N{niv.nivel}: {niv.tiempo}
                </span>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {pacientesTriage.map(p => {
              const manchester = NIVELES_MANCHESTER[p.nivel_triage];
              return (
                <div key={p.id} className="p-4 hover:bg-muted/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{p.paciente_nombre}</span>
                      <span className="text-xs text-muted-foreground font-mono">({p.edad})</span>
                      <Badge className={`text-[10px] rounded-full border ${manchester.color}`}>
                        {manchester.nombre}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground">Ingreso: {p.hora_ingreso}</span>
                    </div>

                    <p className="text-xs text-foreground font-medium">
                      Motivo: <span className="font-normal text-muted-foreground">{p.motivo_llegada}</span>
                    </p>

                    {/* Signos Vitales Rápidos de Triage */}
                    <div className="flex flex-wrap gap-2 text-[11px] pt-1">
                      <span className="px-2 py-0.5 rounded-lg bg-muted border border-border/60">
                        PA: <strong className="font-mono">{p.ta}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-muted border border-border/60">
                        FC: <strong className="font-mono">{p.fc} lpm</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-muted border border-border/60">
                        FR: <strong className="font-mono">{p.fr} rpm</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-muted border border-border/60">
                        SpO2: <strong className={`font-mono ${p.spo2 < 92 ? "text-red-600 font-bold" : ""}`}>{p.spo2}%</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-muted border border-border/60">
                        Glasgow: <strong className="font-mono">{p.glasgow}/15</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs h-8 border-border/80"
                      onClick={() => toast.success(`Paciente ${p.paciente_nombre} asignado a Box de Reanimación`)}
                    >
                      Asignar Box
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-xl text-xs h-8 shadow-none"
                      onClick={() => {
                        setPacienteStat(p.paciente_nombre);
                        toast.info(`Seleccionado ${p.paciente_nombre} para administración STAT`);
                      }}
                    >
                      Medicación STAT
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Registro de Medicación STAT de Emergencia */}
      <Card className="rounded-2xl border-border/80 shadow-none">
        <CardHeader className="bg-muted/15 pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Pill className="h-5 w-5 text-purple-600" />
            Administración Inmediata de Medicación STAT
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Registro inmediato con sello horario de fármacos de resucitación y urgencia (Adrenalina, Atropina, Amiodarona, etc.)
          </p>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <Label className="text-xs font-semibold">Paciente</Label>
              <Select value={pacienteStat} onValueChange={setPacienteStat}>
                <SelectTrigger className="rounded-xl mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {pacientesTriage.map(p => (
                    <SelectItem key={p.id} value={p.paciente_nombre}>
                      {p.paciente_nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs font-semibold">Fármaco, Dosis & Vía STAT</Label>
                <Input
                  placeholder="Ej: Fentanilo 100mcg IV bolo lento, Amiodarona 300mg en 20ml D5%..."
                  value={nuevoFarmacoStat}
                  onChange={e => setNuevoFarmacoStat(e.target.value)}
                  className="rounded-xl mt-1 text-xs font-mono"
                />
              </div>
              <Button className="rounded-xl text-xs shadow-none shrink-0" onClick={handleRegistrarStat}>
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Registrar STAT
              </Button>
            </div>
          </div>

          {/* Historial STAT Reciente */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Registro del Turno Actual (Sello Horario)
            </span>
            <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-muted/20">
              {medicacionesStat.map(m => (
                <div key={m.id} className="p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground bg-card px-2 py-0.5 rounded-md border border-border/60">
                      {m.hora}
                    </span>
                    <strong className="text-foreground">{m.paciente}:</strong>
                    <span className="font-mono text-purple-700 dark:text-purple-300 font-semibold">{m.farmaco}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] rounded-full">
                    {m.enfermera} • ADMINISTRADO
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
