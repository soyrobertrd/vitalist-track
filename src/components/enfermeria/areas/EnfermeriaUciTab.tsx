import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Activity,
  Droplets,
  HeartPulse,
  Brain,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { DobleChequeoFarmacosModal, DatosDobleChequeo } from "@/components/clinical/DobleChequeoFarmacosModal";

interface EntradaBalanceHorario {
  hora: string;
  soluciones_iv: number;
  bombas_infusion: number;
  nutricion_oral: number;
  diuresis: number;
  drenajes: number;
  perdidas_digestivas: number;
}

export function EnfermeriaUciTab() {
  const [pacienteUci, setPacienteUci] = useState("Cama 04 - Don Mario Santos (Post-Qx Cardiovascular)");
  const [rassSeleccionado, setRassSeleccionado] = useState<number>(-2);

  // Registro horario de balance
  const [balanceHoras, setBalanceHoras] = useState<EntradaBalanceHorario[]>([
    { hora: "08:00", soluciones_iv: 100, bombas_infusion: 45, nutricion_oral: 0, diuresis: 65, drenajes: 15, perdidas_digestivas: 0 },
    { hora: "09:00", soluciones_iv: 100, bombas_infusion: 45, nutricion_oral: 0, diuresis: 70, drenajes: 10, perdidas_digestivas: 0 },
    { hora: "10:00", soluciones_iv: 80, bombas_infusion: 40, nutricion_oral: 20, diuresis: 80, drenajes: 20, perdidas_digestivas: 0 },
    { hora: "11:00", soluciones_iv: 80, bombas_infusion: 40, nutricion_oral: 20, diuresis: 60, drenajes: 15, perdidas_digestivas: 0 },
    { hora: "12:00", soluciones_iv: 100, bombas_infusion: 45, nutricion_oral: 0, diuresis: 75, drenajes: 10, perdidas_digestivas: 0 },
  ]);

  // Bombas de infusión continua activas
  const [bombas, setBombas] = useState([
    { id: "bic-1", farmaco: "Noradrenalina (Norepinefrina)", concentracion: "8mg en 100ml D5%", velocidad_ml_h: 12.5, dosis_mcg: "0.15 mcg/kg/min", estado: "activa" },
    { id: "bic-2", farmaco: "Fentanilo Citrato", concentracion: "1000mcg en 100ml SSN", velocidad_ml_h: 8.0, dosis_mcg: "1.2 mcg/kg/h", estado: "activa" },
    { id: "bic-3", farmaco: "Midazolam", concentracion: "100mg en 100ml SSN", velocidad_ml_h: 6.0, dosis_mcg: "0.08 mg/kg/h", estado: "activa" },
  ]);

  const [bombaSeleccionada, setBombaSeleccionada] = useState<any | null>(null);
  const [modalDobleChequeoOpen, setModalDobleChequeoOpen] = useState(false);

  const handleConfirmarAjusteBomba = (datos: DatosDobleChequeo) => {
    if (!bombaSeleccionada) return;
    setBombas(prev =>
      prev.map(b =>
        b.id === bombaSeleccionada.id
          ? {
              ...b,
              velocidad_ml_h: datos.velocidadMlHora,
              dosis_mcg: datos.dosisCalculada,
            }
          : b
      )
    );
    setBombaSeleccionada(null);
  };

  // Cálculos de balance acumulado
  const totalIngresos = balanceHoras.reduce((acc, h) => acc + h.soluciones_iv + h.bombas_infusion + h.nutricion_oral, 0);
  const totalEgresos = balanceHoras.reduce((acc, h) => acc + h.diuresis + h.drenajes + h.perdidas_digestivas, 0);
  const balanceNeto = totalIngresos - totalEgresos;

  const ESCALA_RASS = [
    { score: 4, desc: "Combativo (Violento, peligro para el personal)" },
    { score: 3, desc: "Muy agitado (Se retira tubos y catéteres)" },
    { score: 2, desc: "Agitado (Movimientos frecuentes no intencionales)" },
    { score: 1, desc: "Inquieto (Ansioso, pero sin movimientos agresivos)" },
    { score: 0, desc: "Alerta y en calma (Nivel óptimo)" },
    { score: -1, desc: "Somnoliento (Despierta a la voz > 10 seg)" },
    { score: -2, desc: "Sedación ligera (Despierta brevemente a la voz < 10 seg)" },
    { score: -3, desc: "Sedación moderada (Movimiento al estímulo verbal, sin contacto visual)" },
    { score: -4, desc: "Sedación profunda (Sin respuesta a la voz, respuesta al dolor)" },
    { score: -5, desc: "Sin respuesta / Coma (Sin respuesta al estímulo doloroso)" },
  ];

  return (
    <div className="space-y-6">
      {/* Selector de Paciente UCI */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-muted/20 border border-border/80">
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Unidad de Cuidados Intensivos (UCI)
          </span>
          <h3 className="text-lg font-bold text-foreground">{pacienteUci}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="rounded-full text-xs bg-purple-600 text-white font-semibold">
            Monitoreo Invasivo Activo
          </Badge>
          <Badge variant="outline" className="rounded-full text-xs font-mono">
            Ventilación Mecánica: PEEP 8 | FiO2 40%
          </Badge>
        </div>
      </div>

      {/* KPI Balance Hídrico */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-border/80 bg-card text-center space-y-1">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Total Ingresos Parenterales/Orales</span>
          <p className="text-3xl font-black text-blue-600 font-mono tabular-nums">{totalIngresos} ml</p>
        </div>
        <div className="p-4 rounded-2xl border border-border/80 bg-card text-center space-y-1">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Total Egresos (Diuresis + Drenajes)</span>
          <p className="text-3xl font-black text-amber-600 font-mono tabular-nums">{totalEgresos} ml</p>
        </div>
        <div className="p-4 rounded-2xl border border-border/80 bg-card text-center space-y-1">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Balance Hídrico Acumulado 24h</span>
          <p className={`text-3xl font-black font-mono tabular-nums ${balanceNeto >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {balanceNeto >= 0 ? `+${balanceNeto}` : balanceNeto} ml
          </p>
        </div>
      </div>

      {/* Tabla de Balance Horario Estricto */}
      <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
        <CardHeader className="bg-muted/15 pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-600" />
            Hoja de Balance Hídrico Horario (UCI)
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Control horario de infusión endovenosa, diuresis por sonda vesical horaria y débitos de drenajes
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-bold">Hora</TableHead>
                  <TableHead className="text-blue-600 font-bold">Soluciones IV</TableHead>
                  <TableHead className="text-blue-600 font-bold">Bombas (BIC)</TableHead>
                  <TableHead className="text-blue-600 font-bold">VO / Sonda</TableHead>
                  <TableHead className="text-amber-600 font-bold">Diuresis (ml/h)</TableHead>
                  <TableHead className="text-amber-600 font-bold">Drenajes</TableHead>
                  <TableHead className="text-right font-bold">Balance Horario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balanceHoras.map((h, i) => {
                  const ing = h.soluciones_iv + h.bombas_infusion + h.nutricion_oral;
                  const egr = h.diuresis + h.drenajes + h.perdidas_digestivas;
                  const net = ing - egr;
                  return (
                    <TableRow key={i} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-bold">{h.hora}</TableCell>
                      <TableCell className="font-mono">{h.soluciones_iv} ml</TableCell>
                      <TableCell className="font-mono">{h.bombas_infusion} ml</TableCell>
                      <TableCell className="font-mono">{h.nutricion_oral} ml</TableCell>
                      <TableCell className="font-mono font-semibold text-foreground">{h.diuresis} ml</TableCell>
                      <TableCell className="font-mono">{h.drenajes} ml</TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        <span className={net >= 0 ? "text-emerald-600" : "text-rose-600"}>
                          {net >= 0 ? `+${net}` : net} ml
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monitoreo de Bombas de Infusión (BIC) */}
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardHeader className="pb-3 bg-muted/15">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Bombas de Infusión Continua (Drogas Vasoactivas & Sedación)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {bombas.map(b => (
              <div key={b.id} className="p-3.5 rounded-2xl bg-card border border-border/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{b.farmaco}</span>
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] rounded-full">
                    INFUSIÓN ACTIVA
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>Dilución: {b.concentracion}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-600 text-sm">{b.velocidad_ml_h} ml/h</span>
                    <span className="font-mono text-[11px] bg-muted px-2 py-0.5 rounded-md font-semibold text-foreground">
                      {b.dosis_mcg}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setBombaSeleccionada(b);
                        setModalDobleChequeoOpen(true);
                      }}
                      className="h-7 px-2 rounded-xl text-[10px] gap-1 text-red-600 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <ShieldAlert className="h-3 w-3" /> Doble Chequeo
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Escala de Sedación RASS de Richmond */}
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardHeader className="pb-3 bg-muted/15">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Brain className="h-5 w-5 text-teal-600" />
              Escala de Sedación y Agitación de Richmond (RASS)
            </CardTitle>
            <p className="text-xs text-muted-foreground">Objetivo en ventilación mecánica protectora: RASS -2 a -1</p>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {ESCALA_RASS.map(r => (
                <button
                  key={r.score}
                  type="button"
                  className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    rassSeleccionado === r.score
                      ? "bg-teal-500/15 border-teal-500 text-teal-900 dark:text-teal-200 font-bold"
                      : "bg-card border-border/60 hover:bg-muted/40"
                  }`}
                  onClick={() => {
                    setRassSeleccionado(r.score);
                    toast.success(`Nivel RASS ${r.score > 0 ? `+${r.score}` : r.score} registrado en evolución UCI.`);
                  }}
                >
                  <span className="truncate pr-2">{r.desc}</span>
                  <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-muted text-foreground">
                    {r.score > 0 ? `+${r.score}` : r.score}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {bombaSeleccionada && (
        <DobleChequeoFarmacosModal
          open={modalDobleChequeoOpen}
          onOpenChange={setModalDobleChequeoOpen}
          farmaco={bombaSeleccionada.farmaco}
          concentracion={bombaSeleccionada.concentracion}
          velocidadActual={bombaSeleccionada.velocidad_ml_h}
          pacienteNombre={pacienteUci}
          onConfirmarChequeo={handleConfirmarAjusteBomba}
        />
      )}
    </div>
  );
}
