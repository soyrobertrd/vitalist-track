import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileCheck2,
  Printer,
  QrCode,
  Share2,
  AlertTriangle,
  Calendar,
  Pill,
  HeartPulse,
  User,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export interface DatosEpicrisisAlta {
  id: string;
  pacienteNombre: string;
  cedula: string;
  edad: string;
  servicioEgreso: string;
  fechaIngreso: string;
  fechaAlta: string;
  tipoAlta: string;
  diagnosticoPrincipal: string;
  resumenEstancia: string;
  medicamentosDomicilio: Array<{
    nombre: string;
    dosis: string;
    frecuencia: string;
    duracion: string;
  }>;
  signosAlarma: string[];
  proximaCita: {
    fecha: string;
    especialidad: string;
    medico: string;
  };
  medicoTratante: string;
}

interface EpicrisisDigitalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datos: DatosEpicrisisAlta;
}

export function EpicrisisDigitalModal({ open, onOpenChange, datos }: EpicrisisDigitalModalProps) {
  const qrValidationUrl = `https://vitalisttrack.com/portal/alta/${datos.id}?token=${btoa(datos.cedula)}`;

  const handleImprimir = () => {
    window.print();
  };

  const handleCompartir = () => {
    if (navigator.share) {
      navigator.share({
        title: `Epicrisis de Alta - ${datos.pacienteNombre}`,
        text: `Resumen de alta hospitalaria para ${datos.pacienteNombre}. Próxima cita: ${datos.proximaCita.fecha} en ${datos.proximaCita.especialidad}.`,
        url: qrValidationUrl,
      });
    } else {
      navigator.clipboard.writeText(qrValidationUrl);
      toast.success("Enlace de alta digital copiado al portapapeles.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-6">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-teal-700 bg-teal-50 dark:bg-teal-950/40 border-teal-300 gap-1 text-[11px]">
                  <FileCheck2 className="h-3.5 w-3.5" /> Hoja de Alta & Epicrisis Clínica
                </Badge>
                <Badge className="bg-emerald-600 text-white text-[10px]">
                  {datos.tipoAlta.toUpperCase()}
                </Badge>
              </div>
              <DialogTitle className="text-base font-bold text-foreground mt-1">
                Informe de Alta Hospitalaria: {datos.pacienteNombre}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Documento de egreso y continuidad de cuidados domiciliarios
              </p>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <Button size="sm" variant="outline" onClick={handleCompartir} className="h-8 rounded-xl text-xs gap-1">
                <Share2 className="h-3.5 w-3.5" /> Compartir
              </Button>
              <Button size="sm" variant="outline" onClick={handleImprimir} className="h-8 rounded-xl text-xs gap-1">
                <Printer className="h-3.5 w-3.5" /> Imprimir
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Tarjeta de Filiación y QR */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-left w-full sm:w-auto">
              <p className="font-bold text-sm text-foreground">{datos.pacienteNombre}</p>
              <p className="text-muted-foreground">Cédula/ID: <span className="font-mono">{datos.cedula}</span> | Edad: {datos.edad}</p>
              <p className="text-muted-foreground">Servicio: <span className="font-semibold">{datos.servicioEgreso}</span></p>
              <div className="flex gap-4 pt-1 text-[11px]">
                <span>Ingreso: <strong className="font-mono">{datos.fechaIngreso}</strong></span>
                <span>Egreso: <strong className="font-mono">{datos.fechaAlta}</strong></span>
              </div>
            </div>

            {/* Código QR Dinámico */}
            <div className="flex flex-col items-center justify-center p-2.5 bg-white dark:bg-slate-900 border rounded-xl shadow-xs">
              {/* Código QR generado mediante SVG renderizado */}
              <div className="h-24 w-24 flex items-center justify-center p-1 bg-white rounded-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrValidationUrl)}`}
                  alt="QR Validación Alta"
                  className="h-20 w-20"
                />
              </div>
              <span className="text-[9px] text-muted-foreground font-mono mt-1 text-center">
                Escanear con el móvil
              </span>
            </div>
          </div>

          {/* Diagnóstico y Resumen */}
          <div className="p-3.5 rounded-xl bg-card border border-border/80 space-y-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Diagnóstico Principal de Egreso:
              </span>
              <p className="text-sm font-bold text-foreground mt-0.5">{datos.diagnosticoPrincipal}</p>
            </div>

            <div className="pt-2 border-t border-border/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Resumen de Evolución y Procedimientos:
              </span>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{datos.resumenEstancia}</p>
            </div>
          </div>

          {/* Plan Farmacológico Domiciliario */}
          <div className="p-3.5 rounded-xl bg-card border border-border/80 space-y-2">
            <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
              <Pill className="h-4 w-4 text-purple-600" /> Plan de Medicamentos en el Hogar
            </span>
            <div className="divide-y divide-border/60">
              {datos.medicamentosDomicilio.map((med, i) => (
                <div key={i} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-foreground">{med.nombre}</strong>
                    <span className="text-muted-foreground block text-[11px]">
                      {med.dosis} · cada {med.frecuencia}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] bg-muted/60 px-2 py-0.5 rounded-md font-semibold">
                    Durante {med.duracion}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Signos de Alarma para Regreso Inmediato */}
          <div className="p-3.5 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 space-y-1.5">
            <span className="font-bold text-xs text-red-900 dark:text-red-300 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Signos de Alarma (Acudir de Inmediato a Urgencias si presenta):
            </span>
            <ul className="list-disc pl-5 text-[11px] text-red-800/90 dark:text-red-300/90 space-y-0.5">
              {datos.signosAlarma.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>

          {/* Próxima Cita de Control y Firma Médica */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 space-y-1">
              <span className="text-[10px] uppercase font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Próximo Control
              </span>
              <p className="font-bold text-xs">{datos.proximaCita.fecha}</p>
              <p className="text-[11px] text-muted-foreground">
                {datos.proximaCita.especialidad} · {datos.proximaCita.medico}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-muted/30 border border-border/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Médico Tratante
              </span>
              <p className="font-bold text-xs">{datos.medicoTratante}</p>
              <p className="text-[10px] text-muted-foreground">Firma y Exequátur validado electrónicamente</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button size="sm" onClick={() => onOpenChange(false)} className="rounded-xl text-xs w-full sm:w-auto">
            Cerrar Informe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
