import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stethoscope } from "lucide-react";
import { toast } from "sonner";

interface Curb65TabProps {
  curbC: boolean;
  setCurbC: (val: boolean) => void;
  curbU: boolean;
  setCurbU: (val: boolean) => void;
  curbR: boolean;
  setCurbR: (val: boolean) => void;
  curbB: boolean;
  setCurbB: (val: boolean) => void;
  curb65Age: boolean;
  setCurb65Age: (val: boolean) => void;
  calcCurbTotal: number;
  curbInterpretacion: {
    riesgo: string;
    mortalidad: string;
    conducta: string;
    badgeColor: string;
  };
  onUsarPuntaje: (score: number) => void;
}

export function Curb65Tab({
  curbC,
  setCurbC,
  curbU,
  setCurbU,
  curbR,
  setCurbR,
  curbB,
  setCurbB,
  curb65Age,
  setCurb65Age,
  calcCurbTotal,
  curbInterpretacion,
  onUsarPuntaje,
}: Curb65TabProps) {
  return (
    <Card className="rounded-2xl border-border/80 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-cyan-600" />
          Score CURB-65 para Neumonía Adquirida en la Comunidad (NAC)
        </CardTitle>
        <CardDescription>
          Estratificación de mortalidad a 30 días y determinación objetiva de manejo: ambulatorio, sala general o admisión en UCI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 hover:bg-muted/30">
              <div>
                <span className="font-semibold text-xs block text-foreground">C - Confusión Mental:</span>
                <span className="text-[11px] text-muted-foreground">Desorientación temporo-espacial o GCS &lt; 15</span>
              </div>
              <input
                type="checkbox"
                checked={curbC}
                onChange={(e) => setCurbC(e.target.checked)}
                className="rounded h-4 w-4 text-cyan-600 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 hover:bg-muted/30">
              <div>
                <span className="font-semibold text-xs block text-foreground">U - Urea Sérica / BUN Elevado:</span>
                <span className="text-[11px] text-muted-foreground">Urea &gt; 19 mg/dL (o BUN &gt; 7 mmol/L)</span>
              </div>
              <input
                type="checkbox"
                checked={curbU}
                onChange={(e) => setCurbU(e.target.checked)}
                className="rounded h-4 w-4 text-cyan-600 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 hover:bg-muted/30">
              <div>
                <span className="font-semibold text-xs block text-foreground">R - Frecuencia Respiratoria:</span>
                <span className="text-[11px] text-muted-foreground">Frecuencia respiratoria ≥ 30 respiraciones por minuto</span>
              </div>
              <input
                type="checkbox"
                checked={curbR}
                onChange={(e) => setCurbR(e.target.checked)}
                className="rounded h-4 w-4 text-cyan-600 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 hover:bg-muted/30">
              <div>
                <span className="font-semibold text-xs block text-foreground">B - Presión Arterial Baja:</span>
                <span className="text-[11px] text-muted-foreground">PAS &lt; 90 mmHg o PAD ≤ 60 mmHg</span>
              </div>
              <input
                type="checkbox"
                checked={curbB}
                onChange={(e) => setCurbB(e.target.checked)}
                className="rounded h-4 w-4 text-cyan-600 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 hover:bg-muted/30">
              <div>
                <span className="font-semibold text-xs block text-foreground">65 - Edad del Paciente:</span>
                <span className="text-[11px] text-muted-foreground">Edad mayor o igual a 65 años cumplidos</span>
              </div>
              <input
                type="checkbox"
                checked={curb65Age}
                onChange={(e) => setCurb65Age(e.target.checked)}
                className="rounded h-4 w-4 text-cyan-600 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Score Final */}
          <div className="p-6 rounded-2xl bg-muted/20 border border-border/80 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Puntaje CURB-65:</span>
                <span className="text-3xl font-extrabold text-foreground">{calcCurbTotal} / 5</span>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">Estratificación de Riesgo:</span>
                <Badge className={`w-full justify-center py-1 text-xs ${curbInterpretacion.badgeColor}`}>
                  {curbInterpretacion.riesgo}
                </Badge>
              </div>

              <div className="p-3.5 bg-background rounded-xl border border-border/80 text-xs space-y-1">
                <strong className="text-foreground block">Conducta y Nivel Asistencial:</strong>
                <p className="text-muted-foreground leading-relaxed">{curbInterpretacion.conducta}</p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full rounded-xl text-xs"
              onClick={() => {
                onUsarPuntaje(calcCurbTotal);
                toast.info(`Puntuación CURB-65 (${calcCurbTotal} pts) transferida al formulario.`);
              }}
            >
              Usar puntaje en Nueva Consulta
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
