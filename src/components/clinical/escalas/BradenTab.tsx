import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, CheckCircle2 } from "lucide-react";

interface BradenTabProps {
  onGuardar: (
    nombre: string,
    categoria: string,
    puntuacion: string,
    interpretacion: string,
    riesgo: "bajo" | "moderado" | "alto" | "critico",
    detalles?: string
  ) => void;
}

export function BradenTab({ onGuardar }: BradenTabProps) {
  const [brSensorial, setBrSensorial] = useState(3);
  const [brHumedad, setBrHumedad] = useState(3);
  const [brActividad, setBrActividad] = useState(3);
  const [brMovilidad, setBrMovilidad] = useState(3);
  const [brNutricion, setBrNutricion] = useState(3);
  const [brFriccion, setBrFriccion] = useState(2);

  const bradenTotal = brSensorial + brHumedad + brActividad + brMovilidad + brNutricion + brFriccion;

  const getBradenInterpretacion = () => {
    if (bradenTotal <= 9) return { texto: "Riesgo Muy Alto de UPP", riesgo: "critico" as const };
    if (bradenTotal <= 12) return { texto: "Alto Riesgo de UPP", riesgo: "alto" as const };
    if (bradenTotal <= 14) return { texto: "Riesgo Moderado de UPP", riesgo: "moderado" as const };
    if (bradenTotal <= 18) return { texto: "Riesgo Bajo de UPP", riesgo: "bajo" as const };
    return { texto: "Sin Riesgo de UPP", riesgo: "bajo" as const };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              Escala de Braden (Riesgo de Úlceras por Presión)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Valoración predictiva para prevención de escaras en pacientes hospitalizados o en cama.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "1. Percepción Sensorial", val: brSensorial, set: setBrSensorial, opts: ["Completamente limitada (1)", "Muy limitada (2)", "Ligeramente limitada (3)", "Sin limitaciones (4)"] },
              { label: "2. Exposición a la Humedad", val: brHumedad, set: setBrHumedad, opts: ["Constantemente húmeda (1)", "A menudo húmeda (2)", "Ocasionalmente húmeda (3)", "Raramente húmeda (4)"] },
              { label: "3. Actividad Física", val: brActividad, set: setBrActividad, opts: ["Encamado (1)", "En silla (2)", "Deambula ocasionalmente (3)", "Deambula frecuentemente (4)"] },
              { label: "4. Movilidad", val: brMovilidad, set: setBrMovilidad, opts: ["Completamente inmóvil (1)", "Muy limitada (2)", "Ligeramente limitada (3)", "Sin limitaciones (4)"] },
              { label: "5. Nutrición", val: brNutricion, set: setBrNutricion, opts: ["Muy pobre (1)", "Probablemente inadecuada (2)", "Adecuada (3)", "Excelente (4)"] },
              { label: "6. Fricción y Cizallamiento", val: brFriccion, set: setBrFriccion, opts: ["Problema constante (1)", "Problema potencial (2)", "No existe problema aparente (3)"] },
            ].map((grupo, idx) => (
              <div key={idx} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                <Label className="text-xs font-semibold text-foreground mb-2 block">{grupo.label}</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {grupo.opts.map((opt, oIdx) => {
                    const pts = oIdx + 1;
                    return (
                      <Button
                        key={pts}
                        type="button"
                        variant={grupo.val === pts ? "default" : "outline"}
                        className="h-auto py-2 px-2.5 text-xs text-left justify-start rounded-xl font-normal"
                        onClick={() => grupo.set(pts)}
                      >
                        <span className="font-bold mr-1.5">{pts} pt</span> {opt.split("(")[0]}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Resultado Braden */}
      <div className="space-y-4">
        <Card className="rounded-2xl border-border/80 shadow-none bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
              Puntuación Braden
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4 bg-card rounded-2xl border border-border/70">
              <span className="text-5xl font-black text-foreground tabular-nums">{bradenTotal}</span>
              <span className="text-xl font-bold text-muted-foreground"> / 23</span>
              <div className="mt-2">
                <Badge
                  className={`rounded-full text-xs font-semibold px-3 py-1 ${
                    getBradenInterpretacion().riesgo === "critico"
                      ? "bg-rose-500 text-white"
                      : getBradenInterpretacion().riesgo === "alto"
                      ? "bg-amber-500 text-white"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  {getBradenInterpretacion().texto}
                </Badge>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              * Puntuación menor indica mayor riesgo. Puntuación ≤ 12 requiere cambios posturales cada 2h y colchón antiescaras.
            </p>

            <Button
              className="w-full rounded-xl shadow-none"
              onClick={() =>
                onGuardar(
                  "Braden",
                  "Enfermería / Úlceras",
                  `${bradenTotal}/23`,
                  getBradenInterpretacion().texto,
                  getBradenInterpretacion().riesgo,
                  `Sensorial: ${brSensorial} | Humedad: ${brHumedad} | Actividad: ${brActividad} | Movilidad: ${brMovilidad} | Nutrición: ${brNutricion} | Fricción: ${brFriccion}`
                )
              }
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Registrar en Enfermería
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
