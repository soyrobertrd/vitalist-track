import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2 } from "lucide-react";

interface BarthelTabProps {
  onGuardar: (
    nombre: string,
    categoria: string,
    puntuacion: string,
    interpretacion: string,
    riesgo: "bajo" | "moderado" | "alto" | "critico",
    detalles?: string
  ) => void;
}

export function BarthelTab({ onGuardar }: BarthelTabProps) {
  const [barthelValores, setBarthelValores] = useState<Record<string, number>>({
    comer: 10,
    lavarse: 5,
    vestirse: 10,
    arreglarse: 5,
    retrete: 10,
    traslado: 15,
    deambulacion: 15,
  });

  const barthelTotal = Object.values(barthelValores).reduce((a, b) => a + b, 0);

  const getBarthelInterpretacion = () => {
    if (barthelTotal >= 90) return { texto: "Totalmente Independiente", riesgo: "bajo" as const };
    if (barthelTotal >= 60) return { texto: "Dependencia Leve", riesgo: "bajo" as const };
    if (barthelTotal >= 40) return { texto: "Dependencia Moderada", riesgo: "moderado" as const };
    if (barthelTotal >= 20) return { texto: "Dependencia Severa", riesgo: "alto" as const };
    return { texto: "Dependencia Total", riesgo: "critico" as const };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              Índice de Barthel (Actividades Básicas de la Vida Diaria)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Evaluación de la autonomía funcional física y necesidad de asistencia en rehabilitación y geriatría.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: "comer", label: "Comer", max: 10, opts: [{ p: 10, l: "Independiente" }, { p: 5, l: "Necesita ayuda" }, { p: 0, l: "Dependiente" }] },
              { key: "lavarse", label: "Lavarse / Baño", max: 5, opts: [{ p: 5, l: "Independiente" }, { p: 0, l: "Dependiente" }] },
              { key: "vestirse", label: "Vestirse", max: 10, opts: [{ p: 10, l: "Independiente" }, { p: 5, l: "Necesita ayuda" }, { p: 0, l: "Dependiente" }] },
              { key: "arreglarse", label: "Arreglarse / Aseo", max: 5, opts: [{ p: 5, l: "Independiente" }, { p: 0, l: "Dependiente" }] },
              { key: "retrete", label: "Uso del Retrete", max: 10, opts: [{ p: 10, l: "Independiente" }, { p: 5, l: "Necesita ayuda" }, { p: 0, l: "Dependiente" }] },
              { key: "traslado", label: "Traslado cama-sillón", max: 15, opts: [{ p: 15, l: "Independiente" }, { p: 10, l: "Mínima ayuda" }, { p: 5, l: "Gran ayuda" }, { p: 0, l: "Dependiente" }] },
              { key: "deambulacion", label: "Deambulación", max: 15, opts: [{ p: 15, l: "Independiente (>50m)" }, { p: 10, l: "Con ayuda" }, { p: 5, l: "En silla de ruedas" }, { p: 0, l: "Inmóvil" }] },
            ].map(item => (
              <div key={item.key} className="border-b border-border/60 pb-2.5 last:border-0 last:pb-0">
                <div className="flex justify-between items-center mb-1.5">
                  <Label className="text-xs font-semibold">{item.label}</Label>
                  <span className="font-mono text-xs text-primary font-bold">{barthelValores[item.key] || 0} pts</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.opts.map(o => (
                    <Button
                      key={o.p}
                      type="button"
                      variant={barthelValores[item.key] === o.p ? "default" : "outline"}
                      className="rounded-xl h-8 text-xs font-normal px-3"
                      onClick={() => setBarthelValores({ ...barthelValores, [item.key]: o.p })}
                    >
                      {o.l} ({o.p} pts)
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Resultado Barthel */}
      <div className="space-y-4">
        <Card className="rounded-2xl border-border/80 shadow-none bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
              Total Índice Barthel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4 bg-card rounded-2xl border border-border/70">
              <span className="text-5xl font-black text-foreground tabular-nums">{barthelTotal}</span>
              <span className="text-xl font-bold text-muted-foreground"> / 70</span>
              <div className="mt-2">
                <Badge className="rounded-full text-xs font-semibold px-3 py-1 bg-emerald-600 text-white">
                  {getBarthelInterpretacion().texto}
                </Badge>
              </div>
            </div>

            <Button
              className="w-full rounded-xl shadow-none"
              onClick={() =>
                onGuardar(
                  "Índice de Barthel",
                  "Rehabilitación / ABVD",
                  `${barthelTotal}/70`,
                  getBarthelInterpretacion().texto,
                  getBarthelInterpretacion().riesgo,
                  "ABVD: Alimentación, baño, vestido, arreglo, retrete, transferencias y deambulación"
                )
              }
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Registrar en Fisioterapia/Rehab
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
