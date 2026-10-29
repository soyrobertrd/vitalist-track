import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pill, QrCode, Download, Printer, Clock, AlertCircle } from "lucide-react";

export interface RecetaItem {
  id: string;
  codigo: string;
  medico: string;
  especialidad: string;
  exequatur: string;
  fechaEmision: string;
  fechaVencimiento: string;
  estado: "activa" | "dispensada" | "vencida";
  medicamentos: Array<{
    nombre: string;
    dosis: string;
    frecuencia: string;
    duracion: string;
    instrucciones: string;
  }>;
}

interface RecetasQrTabProps {
  recetas?: RecetaItem[];
}

const DEFAULT_RECETAS: RecetaItem[] = [
  {
    id: "rec-1",
    codigo: "RX-2026-99120",
    medico: "Dra. Sofía Mendoza Peña",
    especialidad: "Medicina Interna & Cardiología",
    exequatur: "EX-39182-RD",
    fechaEmision: "2026-10-25",
    fechaVencimiento: "2026-11-25",
    estado: "activa",
    medicamentos: [
      {
        nombre: "Losartán Potásico 50 mg",
        dosis: "1 comprimido",
        frecuencia: "Cada 24 horas (Mañanas)",
        duracion: "30 días",
        instrucciones: "Tomar preferentemente con el desayuno y abundante agua.",
      },
      {
        nombre: "Atorvastatina Cálcica 20 mg",
        dosis: "1 comprimido",
        frecuencia: "Cada 24 horas (Noches)",
        duracion: "30 días",
        instrucciones: "Tomar antes de acostarse.",
      },
    ],
  },
  {
    id: "rec-2",
    codigo: "RX-2026-84190",
    medico: "Dr. Carlos Estrella",
    especialidad: "Neumología",
    exequatur: "EX-28109-RD",
    fechaEmision: "2026-09-10",
    fechaVencimiento: "2026-10-10",
    estado: "dispensada",
    medicamentos: [
      {
        nombre: "Amoxicilina / Ácido Clavulánico 875/125 mg",
        dosis: "1 comprimido",
        frecuencia: "Cada 12 horas",
        duracion: "7 días",
        instrucciones: "Completar los 7 días de antibiótico sin suspender.",
      },
    ],
  },
];

export const RecetasQrTab: React.FC<RecetasQrTabProps> = ({ recetas = DEFAULT_RECETAS }) => {
  const [qrModalItem, setQrModalItem] = useState<RecetaItem | null>(null);

  const estadoBadge = (estado: RecetaItem["estado"]) => {
    switch (estado) {
      case "activa":
        return <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">Activa para Despacho</Badge>;
      case "dispensada":
        return <Badge variant="secondary" className="bg-muted text-muted-foreground">Dispensada</Badge>;
      case "vencida":
        return <Badge variant="outline" className="border-destructive/40 text-destructive">Vencida</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-border/80 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent">
        <CardContent className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/20 text-blue-600 flex items-center justify-center">
              <Pill className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Recetas Médicas Electrónicas con QR
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Válidas en farmacias con sistema de lectura QR. No requiere receta en papel físico.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {recetas.map((r) => (
          <Card key={r.id} className="rounded-2xl border-border/80 shadow-none">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold font-mono text-primary">
                      {r.codigo}
                    </CardTitle>
                    {estadoBadge(r.estado)}
                  </div>
                  <CardDescription className="text-xs mt-1">
                    Prescrito por: <strong className="text-foreground">{r.medico}</strong> ({r.especialidad}) · Exeq: {r.exequatur}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs rounded-xl"
                    onClick={() => setQrModalItem(r)}
                  >
                    <QrCode className="h-3.5 w-3.5 mr-1 text-primary" />
                    Mostrar QR
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-2 pt-0">
              <div className="rounded-xl bg-muted/40 p-3 space-y-2.5">
                {r.medicamentos.map((m, i) => (
                  <div key={i} className="text-xs border-b border-border/60 last:border-none pb-2 last:pb-0">
                    <div className="flex items-center justify-between font-semibold text-foreground">
                      <span>{m.nombre}</span>
                      <Badge variant="outline" className="font-mono text-[10px]">{m.dosis}</Badge>
                    </div>
                    <div className="text-muted-foreground mt-0.5">
                      Frecuencia: <span className="text-foreground">{m.frecuencia}</span> · Duración: <span className="text-foreground">{m.duracion}</span>
                    </div>
                    {m.instrucciones && (
                      <p className="text-[11px] text-muted-foreground/90 italic mt-0.5">
                        Indicación: {m.instrucciones}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 px-1">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Emitida: {r.fechaEmision}
                </span>
                <span>Válida hasta: <strong className="text-foreground">{r.fechaVencimiento}</strong></span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal QR Detallado */}
      <Dialog open={!!qrModalItem} onOpenChange={(o) => !o && setQrModalItem(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Código QR de Dispensación
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 flex flex-col items-center space-y-3">
            <div className="p-3 bg-white rounded-2xl border shadow-sm">
              <svg className="h-44 w-44 text-slate-950" viewBox="0 0 100 100" fill="currentColor">
                <rect x="5" y="5" width="26" height="26" rx="2" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="13" y="13" width="10" height="10" />
                <rect x="69" y="5" width="26" height="26" rx="2" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="77" y="13" width="10" height="10" />
                <rect x="5" y="69" width="26" height="26" rx="2" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="13" y="77" width="10" height="10" />
                <rect x="38" y="10" width="6" height="6" />
                <rect x="48" y="10" width="6" height="6" />
                <rect x="58" y="10" width="6" height="6" />
                <rect x="38" y="24" width="6" height="6" />
                <rect x="50" y="24" width="12" height="6" />
                <rect x="10" y="42" width="8" height="8" />
                <rect x="26" y="42" width="6" height="12" />
                <rect x="38" y="42" width="24" height="6" />
                <rect x="70" y="42" width="8" height="8" />
                <rect x="84" y="42" width="6" height="18" />
                <rect x="42" y="56" width="14" height="8" />
                <rect x="60" y="60" width="6" height="12" />
                <rect x="38" y="72" width="10" height="16" />
                <rect x="56" y="76" width="16" height="8" />
                <rect x="76" y="72" width="14" height="6" />
                <rect x="76" y="84" width="8" height="6" />
              </svg>
            </div>
            <div>
              <p className="font-mono text-sm font-bold text-foreground">{qrModalItem?.codigo}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vence el {qrModalItem?.fechaVencimiento}
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Muestra este código al farmacéutico para desbloquear el despacho seguro del medicamento.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
