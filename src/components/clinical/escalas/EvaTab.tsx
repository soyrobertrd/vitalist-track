import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, CheckCircle2 } from "lucide-react";

interface EvaTabProps {
  onGuardar: (
    nombre: string,
    categoria: string,
    puntuacion: string,
    interpretacion: string,
    riesgo: "bajo" | "moderado" | "alto" | "critico",
    detalles?: string
  ) => void;
}

export function EvaTab({ onGuardar }: EvaTabProps) {
  const [evaDolor, setEvaDolor] = useState(2);

  const getEvaInterpretacion = () => {
    if (evaDolor === 0) return { texto: "Sin dolor", riesgo: "bajo" as const };
    if (evaDolor <= 3) return { texto: "Dolor leve (Analgesia simple)", riesgo: "bajo" as const };
    if (evaDolor <= 6) return { texto: "Dolor moderado (AINEs / Opioides menores)", riesgo: "moderado" as const };
    if (evaDolor <= 8) return { texto: "Dolor severo (Opioides mayores)", riesgo: "alto" as const };
    return { texto: "Dolor insoportable / Crisis álgica", riesgo: "critico" as const };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Escala Visual Analógica del Dolor (EVA / Wong-Baker)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Cuantificación de la intensidad álgica del paciente de 0 (sin dolor) a 10 (dolor máximo).
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground">Intensidad del dolor:</span>
                <span className="text-2xl font-bold text-primary tabular-nums">{evaDolor} / 10</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={evaDolor}
                onChange={e => setEvaDolor(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>0 (Sin dolor)</span>
                <span>3 (Leve)</span>
                <span>5 (Moderado)</span>
                <span>8 (Severo)</span>
                <span>10 (Insoportable)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              {[
                { val: 0, label: "0: Sin dolor" },
                { val: 3, label: "1-3: Leve" },
                { val: 6, label: "4-6: Moderado" },
                { val: 9, label: "7-10: Severo" },
              ].map(b => (
                <Button
                  key={b.val}
                  variant={evaDolor === b.val ? "default" : "outline"}
                  className="rounded-xl text-xs h-9"
                  onClick={() => setEvaDolor(b.val)}
                >
                  {b.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resultado EVA */}
      <div className="space-y-4">
        <Card className="rounded-2xl border-border/80 shadow-none bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
              Clasificación Álgica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4 bg-card rounded-2xl border border-border/70">
              <span className="text-5xl font-black text-foreground tabular-nums">{evaDolor}</span>
              <span className="text-xl font-bold text-muted-foreground"> / 10</span>
              <div className="mt-2">
                <Badge className="rounded-full text-xs font-semibold px-3 py-1">
                  {getEvaInterpretacion().texto}
                </Badge>
              </div>
            </div>

            <Button
              className="w-full rounded-xl shadow-none"
              onClick={() =>
                onGuardar(
                  "Escala EVA",
                  "Dolor / Triage",
                  `${evaDolor}/10`,
                  getEvaInterpretacion().texto,
                  getEvaInterpretacion().riesgo,
                  `Nivel de dolor declarado: ${evaDolor}/10`
                )
              }
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Registrar Dolor
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
