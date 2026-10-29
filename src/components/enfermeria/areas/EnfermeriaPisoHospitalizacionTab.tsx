import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Pill, CheckCircle2, AlertTriangle, ShieldCheck, Clock, User, Bed, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function EnfermeriaPisoHospitalizacionTab() {
  const [pacienteHabitacion, setPacienteHabitacion] = useState("Habitación 308-A — Doña Beatriz Almonte");

  // Medicamentos del Kardex con validación de 5 correctos
  const [kardex, setKardex] = useState([
    {
      id: "k-1",
      medicamento: "Ceftriaxona 1g",
      dosis: "1 g",
      via: "IV lenta en 100ml SSN",
      horario: "08:00 - 20:00",
      proxima_hora: "20:00",
      cinco_correctos: { paciente: true, medicamento: true, dosis: true, via: true, hora: true },
      administrado: false,
    },
    {
      id: "k-2",
      medicamento: "Omeprazol 40mg",
      dosis: "40 mg",
      via: "IV directa",
      horario: "08:00 (Cada 24h)",
      proxima_hora: "08:00 (Mañana)",
      cinco_correctos: { paciente: true, medicamento: true, dosis: true, via: true, hora: true },
      administrado: true,
      hora_admin: "08:05",
      enfermera: "Lic. Andrea Morales",
    },
    {
      id: "k-3",
      medicamento: "Enoxaparina 40mg",
      dosis: "40 mg (0.4 ml)",
      via: "Subcutánea periumbilical",
      horario: "22:00 (Cada 24h)",
      proxima_hora: "22:00",
      cinco_correctos: { paciente: true, medicamento: true, dosis: true, via: true, hora: true },
      administrado: false,
    },
  ]);

  // Vías venosas periféricas
  const [viaPeriferica, setViaPeriferica] = useState({
    calibre: "20G (Rosa)",
    sitio: "Miembro superior izquierdo (antebrazo anterior)",
    fecha_canalizacion: "2024-10-27 10:00",
    horas_colocada: 36,
    escala_flebitis_grado: 0, // 0: Sin signos, 1: Eritema leve, 2: Dolor con eritema, 3: Cordón venoso palpable, 4: Purulenta
  });

  // Cambios posturales
  const [cambiosPosturales, setCambiosPosturales] = useState([
    { hora: "08:00", posicion: "Decúbito Lateral Derecho", realizada: true, enfermera: "Lic. Andrea Morales" },
    { hora: "10:00", posicion: "Decúbito Supino (Fowler 30°)", realizada: true, enfermera: "Lic. Andrea Morales" },
    { hora: "12:00", posicion: "Decúbito Lateral Izquierdo", realizada: true, enfermera: "Lic. Miguel Cruz" },
    { hora: "14:00", posicion: "Decúbito Lateral Derecho", realizada: false, enfermera: "Pendiente" },
    { hora: "16:00", posicion: "Decúbito Supino", realizada: false, enfermera: "Pendiente" },
  ]);

  const handleAdministrar = (id: string) => {
    const horaActual = format(new Date(), "HH:mm");
    setKardex(prev =>
      prev.map(k => (k.id === id ? { ...k, administrado: true, hora_admin: horaActual, enfermera: "Enfermera de Turno" } : k))
    );
    toast.success("Medicamento verificado con los 5 Correctos y administrado.");
  };

  const handleRegistrarPostural = (index: number) => {
    setCambiosPosturales(prev =>
      prev.map((c, i) => (i === index ? { ...c, realizada: true, enfermera: "Enfermera de Turno" } : c))
    );
    toast.success("Cambio postural registrado en la hoja de enfermería.");
  };

  return (
    <div className="space-y-6">
      {/* Cabecera de Habitación Normal */}
      <div className="p-4 rounded-2xl bg-muted/20 border border-border/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Hospitalización en Piso (Habitaciones Normales)
          </span>
          <h3 className="text-lg font-bold text-foreground">{pacienteHabitacion}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full text-xs font-mono">
            Dieta: Hiposódica blanda
          </Badge>
          <Badge className="bg-emerald-600 text-white rounded-full text-xs font-semibold">
            Riesgo Caídas: Moderado (Brazalete Amarillo)
          </Badge>
        </div>
      </div>

      {/* Kardex Digital de Enfermería (Regla de los 5 Correctos) */}
      <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
        <CardHeader className="bg-muted/15 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Pill className="h-5 w-5 text-purple-600" />
                Kardex Digital de Enfermería (Validación 5 Correctos)
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                1. Paciente · 2. Medicamento · 3. Dosis · 4. Vía · 5. Hora exacta
              </p>
            </div>
            <Badge variant="outline" className="text-xs rounded-full border-purple-500/30 text-purple-700 dark:text-purple-300">
              Seguridad del Paciente OMS
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {kardex.map(k => (
              <div key={k.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{k.medicamento}</span>
                    <Badge variant="outline" className="text-[10px] rounded-full uppercase">
                      Vía: {k.via}
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">Horario: {k.horario}</span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Dosis pautada: <strong className="text-foreground">{k.dosis}</strong> • Próxima administración: <span className="font-bold font-mono text-foreground">{k.proxima_hora}</span>
                  </p>

                  <div className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" /> 5 Correctos verificados electrónicamente
                  </div>
                </div>

                <div>
                  {k.administrado ? (
                    <div className="text-right">
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs rounded-full">
                        ✓ Administrado a las {k.hora_admin}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{k.enfermera}</p>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="rounded-xl text-xs shadow-none gap-1.5"
                      onClick={() => handleAdministrar(k.id)}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Administrar & Firmar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Control de Accesos Venosos Periféricos */}
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardHeader className="pb-3 bg-muted/15">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-600" />
              Acceso Venoso Periférico & Escala Flebitis
            </CardTitle>
            <p className="text-xs text-muted-foreground">Protocolo de cambio cada 72-96h o ante signos de alarma</p>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-card rounded-xl border border-border/70">
              <div>
                <span className="text-muted-foreground block text-[11px]">Calibre del Catéter:</span>
                <strong className="text-foreground font-mono text-sm">{viaPeriferica.calibre}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Tiempo Colocada:</span>
                <strong className="text-foreground font-mono text-sm">{viaPeriferica.horas_colocada} horas</strong>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground block text-[11px]">Sitio Anatómico:</span>
                <strong className="text-foreground">{viaPeriferica.sitio}</strong>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-2">
              <span className="font-semibold text-foreground block">
                Escala Visual de Flebitis de Maddox (Grado Actual: {viaPeriferica.escala_flebitis_grado})
              </span>
              <p className="text-muted-foreground text-[11px]">
                Grado 0: Sin dolor, sin eritema, sin induración. Vía permeable y apósito limpio transparente.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="rounded-xl text-xs h-8" onClick={() => toast.success("Curación y cambio de apósito registrado.")}>
                  Curación de Vía
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl text-xs h-8 text-rose-600" onClick={() => toast.info("Retiro de catéter indicado.")}>
                  Retirar Catéter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hoja de Cambios Posturales (Anti-escaras) */}
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardHeader className="pb-3 bg-muted/15">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <RotateCw className="h-5 w-5 text-amber-600" />
              Rotación Postural (Prevención de UPP)
            </CardTitle>
            <p className="text-xs text-muted-foreground">Ciclos cada 2 horas para alivio de puntos de presión ósea</p>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            <div className="space-y-2">
              {cambiosPosturales.map((c, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-border/60 flex items-center justify-between bg-card"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">
                      {c.hora}
                    </span>
                    <span className="font-medium text-foreground">{c.posicion}</span>
                  </div>

                  {c.realizada ? (
                    <Badge variant="outline" className="text-[10px] rounded-full border-emerald-500/30 text-emerald-600">
                      ✓ Realizado ({c.enfermera.split(" ")[1]})
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs h-7 px-2.5"
                      onClick={() => handleRegistrarPostural(idx)}
                    >
                      Registrar Cambio
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
