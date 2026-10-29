import { useState } from "react";
import { RegistroPaseGuardiaSBAR, PacienteNovedadSBAR } from "./sbar-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ClipboardCheck,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  FileCheck2,
  Clock,
  Printer,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

const MOCK_PASE_ACTUAL: RegistroPaseGuardiaSBAR = {
  id: "sbar-20241028-tarde",
  fecha: "2024-10-28",
  servicio: "Piso 3 - Medicina Interna & Cuidados Especiales",
  turnoEntregado: "tarde",
  profesionalEntrega: {
    nombre: "Lic. Laura Peña, Enf. Jefe",
    rol: "Enfermera de Turno Tarde",
    firmaRegistrada: true,
    horaFirma: "22:45",
  },
  profesionalRecibe: {
    nombre: "Lic. Carmen Gómez",
    rol: "Enfermera de Guardia Nocturna",
    firmaRegistrada: false,
  },
  censoCamas: {
    ocupadas: 18,
    libres: 4,
    aisladas: 2,
    pendientesIngreso: 1,
  },
  novedadesServicio:
    "Carro de paro verificado a las 15:00 con precinto intacto #4489. Se recibieron 5 ampollas de Noradrenalina de farmacia central. Bomba de infusión #12 en mantenimiento preventivo por biomédica.",
  estado: "entregado",
  pacientes: [
    {
      id: "p-sbar-1",
      cama: "302-A",
      paciente: "Ramón Antonio Valdés (64a)",
      diagnostico: "Neumonía bacteriana grave + EPOC reagudizado",
      condicion: "critico",
      situacion: "Disnea progresiva en las últimas 3 horas, tiraje intercostal leve.",
      antecedentes: "EPOC Gold D, exfumador, HTA controlada. Alérgico a Penicilinas.",
      evaluacion: "SatO2 91% con cánula nasal a 3 L/min. TA 135/85 mmHg, FC 98 lpm. NEWS2 = 5 (Riesgo Medio).",
      recomendacion: "Gases arteriales de control a las 01:00. Si SatO2 < 90%, avisar a médico de guardia para valorar VMNI.",
      pendienteInmediato: "Gases arteriales a la 01:00 y antibiótico IV Meropenem a las 23:00.",
      alertasActivas: ["Aislamiento Respiratorio", "Riesgo de Caída Alto"],
    },
    {
      id: "p-sbar-2",
      cama: "305-B",
      paciente: "Carmen Rodríguez Morales (42a)",
      diagnostico: "Post-op Colecistectomía Laparoscópica Día 1",
      condicion: "estable",
      situacion: "Evolución favorable, afebril, tolerando líquidos orales.",
      antecedentes: "Sin antecedentes patológicos relevantes.",
      evaluacion: "Heridas quirúrgicas limpias, abdomen blando no doloroso. TA 120/75, FC 72, NEWS2 = 0.",
      recomendacion: "Retirar vía periférica a las 06:00 si continúa buena tolerancia. Alta probable mañana.",
      pendienteInmediato: "Analgesia reglada con Ketorolaco IV si refiere dolor EVA > 4.",
    },
  ],
};

export function PaseGuardiaSbarTab() {
  const [pase, setPase] = useState<RegistroPaseGuardiaSBAR>(MOCK_PASE_ACTUAL);
  const [recibidoConforme, setRecibidoConforme] = useState(false);
  const [nuevoPendiente, setNuevoPendiente] = useState("");

  const handleFirmarRecepcion = () => {
    setPase(prev => ({
      ...prev,
      estado: "recibido_conforme",
      profesionalRecibe: {
        ...prev.profesionalRecibe,
        firmaRegistrada: true,
        horaFirma: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    }));
    setRecibidoConforme(true);
    toast.success("Pase de guardia recibido y firmado digitalmente de forma conforme.");
  };

  const handleImprimirReporte = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Pase de Guardia */}
      <Card className="rounded-2xl border-border/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-teal-700 bg-teal-50 dark:bg-teal-950/40 border-teal-300">
                  Protocolo SBAR Hospitalario
                </Badge>
                <Badge
                  className={
                    pase.estado === "recibido_conforme"
                      ? "bg-emerald-600 text-white"
                      : "bg-amber-600 text-white"
                  }
                >
                  {pase.estado === "recibido_conforme" ? "Recibido Conforme" : "Pendiente Recepción"}
                </Badge>
              </div>
              <CardTitle className="text-lg font-bold mt-1">{pase.servicio}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Fecha: {pase.fecha} | Cambio de Turno: <span className="font-semibold capitalize">{pase.turnoEntregado}</span> a Noche
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleImprimirReporte} className="rounded-xl text-xs gap-1.5">
                <Printer className="h-3.5 w-3.5" />
                Imprimir Acta
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Censo Resumido del Servicio */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/70 text-center">
              <span className="text-[11px] text-muted-foreground block font-medium">Camas Ocupadas</span>
              <span className="text-xl font-bold font-mono text-foreground">{pase.censoCamas.ocupadas}</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300 block font-medium">Camas Libres</span>
              <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">{pase.censoCamas.libres}</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
              <span className="text-[11px] text-amber-800 dark:text-amber-300 block font-medium">Aislamientos</span>
              <span className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400">{pase.censoCamas.aisladas}</span>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-center">
              <span className="text-[11px] text-purple-800 dark:text-purple-300 block font-medium">Pendientes Ingreso</span>
              <span className="text-xl font-bold font-mono text-purple-700 dark:text-purple-400">{pase.censoCamas.pendientesIngreso}</span>
            </div>
          </div>

          {/* Novedades Generales del Servicio */}
          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/70 space-y-1">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <ClipboardCheck className="h-4 w-4 text-teal-600" />
              Novedades Generales del Servicio e Insumos Críticos
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">{pase.novedadesServicio}</p>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pacientes con Estructura SBAR */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-teal-600" />
            Pacientes y Novedades Clínicas (SBAR Individual)
          </h3>
          <span className="text-xs text-muted-foreground">
            {pase.pacientes.length} pacientes reportados
          </span>
        </div>

        {pase.pacientes.map(p => (
          <Card key={p.id} className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
            <div className="p-4 bg-muted/20 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold text-xs">
                  {p.cama}
                </span>
                <div>
                  <h4 className="font-bold text-sm leading-none">{p.paciente}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.diagnostico}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {p.condicion === "critico" && (
                  <Badge variant="destructive" className="text-[10px] gap-1 animate-pulse">
                    <AlertTriangle className="h-3 w-3" /> Paciente Crítico
                  </Badge>
                )}
                {p.alertasActivas?.map(a => (
                  <Badge key={a} variant="outline" className="text-[10px] bg-background">
                    {a}
                  </Badge>
                ))}
              </div>
            </div>

            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                <strong className="text-blue-800 dark:text-blue-300 block mb-1">
                  S - Situación Actual:
                </strong>
                <p className="text-muted-foreground leading-relaxed">{p.situacion}</p>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
                <strong className="text-purple-800 dark:text-purple-300 block mb-1">
                  B - Antecedentes Relevantes:
                </strong>
                <p className="text-muted-foreground leading-relaxed">{p.antecedentes}</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                <strong className="text-amber-800 dark:text-amber-300 block mb-1">
                  A - Evaluación Clínica & Signos:
                </strong>
                <p className="text-muted-foreground leading-relaxed">{p.evaluacion}</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                <strong className="text-emerald-800 dark:text-emerald-300 block mb-1">
                  R - Recomendaciones & Pendientes:
                </strong>
                <p className="text-muted-foreground leading-relaxed">{p.recomendacion}</p>
                {p.pendienteInmediato && (
                  <div className="mt-2 pt-1.5 border-t border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 text-emerald-900 dark:text-emerald-200 font-semibold">
                    <Clock className="h-3.5 w-3.5 text-emerald-600" />
                    Pendiente Inmediato: {p.pendienteInmediato}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Doble Firma de Entrega y Recepción de Turno */}
      <Card className="rounded-2xl border-border/80 shadow-xs bg-muted/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-teal-600" />
            Certificación Legal de Traspaso de Guardia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Entrega */}
            <div className="p-3.5 rounded-xl border border-border/70 bg-background space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                Entregado Por:
              </span>
              <p className="font-bold text-sm">{pase.profesionalEntrega.nombre}</p>
              <p className="text-xs text-muted-foreground">{pase.profesionalEntrega.rol}</p>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium pt-2">
                <ShieldCheck className="h-4 w-4" />
                Firmado digitalmente a las {pase.profesionalEntrega.horaFirma} hrs
              </div>
            </div>

            {/* Recibe */}
            <div className="p-3.5 rounded-xl border border-border/70 bg-background space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                Recibido Por:
              </span>
              <p className="font-bold text-sm">{pase.profesionalRecibe.nombre}</p>
              <p className="text-xs text-muted-foreground">{pase.profesionalRecibe.rol}</p>
              {pase.profesionalRecibe.firmaRegistrada ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium pt-1">
                  <ShieldCheck className="h-4 w-4" />
                  Recibido conforme a las {pase.profesionalRecibe.horaFirma} hrs
                </div>
              ) : (
                <Button
                  onClick={handleFirmarRecepcion}
                  size="sm"
                  className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs w-full gap-2 mt-2"
                >
                  <FileCheck2 className="h-4 w-4" />
                  Firmar Recepción Conforme de Guardia
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
