import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle2, Copy } from "lucide-react";

interface GlasgowTabProps {
  onGuardar: (
    nombre: string,
    categoria: string,
    puntuacion: string,
    interpretacion: string,
    riesgo: "bajo" | "moderado" | "alto" | "critico",
    detalles: string
  ) => void;
  onCopiar: (texto: string) => void;
}

export function GlasgowTab({ onGuardar, onCopiar }: GlasgowTabProps) {
  const [gcsOcular, setGcsOcular] = useState(4);
  const [gcsVerbal, setGcsVerbal] = useState(5);
  const [gcsMotor, setGcsMotor] = useState(6);

  const gcsTotal = gcsOcular + gcsVerbal + gcsMotor;

  const getGcsInterpretacion = () => {
    if (gcsTotal >= 13) return { texto: "Traumatismo / Deterioro Leve", riesgo: "bajo" as const };
    if (gcsTotal >= 9) return { texto: "Traumatismo / Deterioro Moderado", riesgo: "moderado" as const };
    return { texto: "Traumatismo Grave / Coma (Requiere IOT)", riesgo: "critico" as const };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Escala de Coma de Glasgow (GCS)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Valoración del estado de conciencia y respuesta neurológica en traumatismos y emergencias.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Apertura Ocular */}
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1.5 block">
                Apertura Ocular (1 - 4 puntos)
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { pts: 4, label: "Espontánea" },
                  { pts: 3, label: "A la orden verbal" },
                  { pts: 2, label: "Al estímulo doloroso" },
                  { pts: 1, label: "Sin respuesta" },
                ].map(item => (
                  <Button
                    key={item.pts}
                    type="button"
                    variant={gcsOcular === item.pts ? "default" : "outline"}
                    className="h-auto py-2.5 px-3 flex-col items-start text-left rounded-xl"
                    onClick={() => setGcsOcular(item.pts)}
                  >
                    <span className="font-bold text-xs">{item.pts} pts</span>
                    <span className="text-[11px] font-normal leading-tight opacity-90">{item.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Respuesta Verbal */}
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1.5 block">
                Respuesta Verbal (1 - 5 puntos)
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { pts: 5, label: "Orientado y conversa" },
                  { pts: 4, label: "Desorientado / Confuso" },
                  { pts: 3, label: "Palabras inapropiadas" },
                  { pts: 2, label: "Sonidos incomprensibles" },
                  { pts: 1, label: "Sin respuesta" },
                ].map(item => (
                  <Button
                    key={item.pts}
                    type="button"
                    variant={gcsVerbal === item.pts ? "default" : "outline"}
                    className="h-auto py-2.5 px-3 flex-col items-start text-left rounded-xl"
                    onClick={() => setGcsVerbal(item.pts)}
                  >
                    <span className="font-bold text-xs">{item.pts} pts</span>
                    <span className="text-[11px] font-normal leading-tight opacity-90">{item.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Respuesta Motora */}
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1.5 block">
                Respuesta Motora (1 - 6 puntos)
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { pts: 6, label: "Obedece órdenes" },
                  { pts: 5, label: "Localiza el dolor" },
                  { pts: 4, label: "Retirada al dolor (Flexión normal)" },
                  { pts: 3, label: "Flexión anormal (Decorticación)" },
                  { pts: 2, label: "Extensión anormal (Descerebración)" },
                  { pts: 1, label: "Sin respuesta (Flacidez)" },
                ].map(item => (
                  <Button
                    key={item.pts}
                    type="button"
                    variant={gcsMotor === item.pts ? "default" : "outline"}
                    className="h-auto py-2.5 px-3 flex-col items-start text-left rounded-xl"
                    onClick={() => setGcsMotor(item.pts)}
                  >
                    <span className="font-bold text-xs">{item.pts} pts</span>
                    <span className="text-[11px] font-normal leading-tight opacity-90">{item.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Panel de Resultado */}
      <div className="space-y-4">
        <Card className="rounded-2xl border-border/80 shadow-none bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
              Puntuación Total GCS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4 bg-card rounded-2xl border border-border/70">
              <span className="text-5xl font-black text-foreground tabular-nums">{gcsTotal}</span>
              <span className="text-xl font-bold text-muted-foreground"> / 15</span>
              <div className="mt-2">
                <Badge
                  variant={getGcsInterpretacion().riesgo === "bajo" ? "default" : "destructive"}
                  className="rounded-full text-xs font-semibold px-3 py-1"
                >
                  {getGcsInterpretacion().texto}
                </Badge>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground p-3 bg-card rounded-xl border border-border/60">
              <div className="flex justify-between"><span>Ocular (E):</span><span className="font-mono font-bold text-foreground">{gcsOcular}/4</span></div>
              <div className="flex justify-between"><span>Verbal (V):</span><span className="font-mono font-bold text-foreground">{gcsVerbal}/5</span></div>
              <div className="flex justify-between"><span>Motor (M):</span><span className="font-mono font-bold text-foreground">{gcsMotor}/6</span></div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                className="w-full rounded-xl shadow-none"
                onClick={() =>
                  onGuardar(
                    "Glasgow (GCS)",
                    "Neurología / Conciencia",
                    `${gcsTotal}/15`,
                    getGcsInterpretacion().texto,
                    getGcsInterpretacion().riesgo,
                    `Ocular: ${gcsOcular}/4 | Verbal: ${gcsVerbal}/5 | Motor: ${gcsMotor}/6`
                  )
                }
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Registrar en Expediente
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() =>
                  onCopiar(
                    `Escala de Coma de Glasgow (GCS): ${gcsTotal}/15 (Ocular: ${gcsOcular}, Verbal: ${gcsVerbal}, Motor: ${gcsMotor}). Conclusión: ${getGcsInterpretacion().texto}.`
                  )
                }
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar para Evolución
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
