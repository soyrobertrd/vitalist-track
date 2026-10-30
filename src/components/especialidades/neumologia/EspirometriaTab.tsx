import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wind, CheckCircle2, AlertTriangle } from "lucide-react";

interface EspirometriaTabProps {
  espFvcBasal: number;
  setEspFvcBasal: (val: number) => void;
  espFev1Basal: number;
  setEspFev1Basal: (val: number) => void;
  espFev1Post: number;
  setEspFev1Post: (val: number) => void;
  espRatioBasal: number;
  espCambioAbsolutoMl: number;
  espCambioPorcentual: number;
  espPruebaPositiva: boolean;
}

export function EspirometriaTab({
  espFvcBasal,
  setEspFvcBasal,
  espFev1Basal,
  setEspFev1Basal,
  espFev1Post,
  setEspFev1Post,
  espRatioBasal,
  espCambioAbsolutoMl,
  espCambioPorcentual,
  espPruebaPositiva,
}: EspirometriaTabProps) {
  return (
    <Card className="rounded-2xl border-border/80 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wind className="h-5 w-5 text-cyan-600" />
          Cálculo de Reversibilidad Espirométrica (Criterios ATS / ERS)
        </CardTitle>
        <CardDescription>
          Evaluación objetiva del cambio en el FEV1 tras la administración de 400 µg de Salbutamol inhalado para diferenciar asma y componentes reversibles en EPOC.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">FVC Basal (Litros):</Label>
            <Input
              type="number"
              step="0.05"
              value={espFvcBasal}
              onChange={(e) => setEspFvcBasal(Number(e.target.value))}
              className="rounded-xl border-border/80"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">FEV1 Basal (Litros):</Label>
            <Input
              type="number"
              step="0.05"
              value={espFev1Basal}
              onChange={(e) => setEspFev1Basal(Number(e.target.value))}
              className="rounded-xl border-border/80"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">FEV1 Post-Broncodilatador (Litros):</Label>
            <Input
              type="number"
              step="0.05"
              value={espFev1Post}
              onChange={(e) => setEspFev1Post(Number(e.target.value))}
              className="rounded-xl border-border/80"
            />
          </div>
        </div>

        {/* Métricas Resultantes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-border/80 bg-muted/30">
            <span className="text-xs text-muted-foreground block">Relación FEV1/FVC Basal</span>
            <span className={`text-xl font-bold ${espRatioBasal < 0.70 ? "text-rose-600" : "text-foreground"}`}>
              {espRatioBasal} {espRatioBasal < 0.70 ? "(Patrón Obstructivo)" : "(No obstructivo)"}
            </span>
          </div>
          <div className="p-4 rounded-xl border border-border/80 bg-muted/30">
            <span className="text-xs text-muted-foreground block">Incremento Absoluto</span>
            <span className="text-xl font-bold text-foreground">
              +{espCambioAbsolutoMl} mL
            </span>
            <span className="text-[11px] text-muted-foreground block">Criterio ATS: ≥ 200 mL</span>
          </div>
          <div className="p-4 rounded-xl border border-border/80 bg-muted/30">
            <span className="text-xs text-muted-foreground block">Incremento Porcentual</span>
            <span className="text-xl font-bold text-foreground">
              +{espCambioPorcentual}%
            </span>
            <span className="text-[11px] text-muted-foreground block">Criterio ATS: ≥ 12%</span>
          </div>
        </div>

        {/* Dictamen */}
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 ${
            espPruebaPositiva
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              : "bg-muted/40 border-border/80 text-muted-foreground"
          }`}
        >
          {espPruebaPositiva ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <h5 className="font-bold text-sm text-foreground">
              {espPruebaPositiva
                ? "Prueba Broncodilatadora POSITIVA (Respuesta Significativa)"
                : "Prueba Broncodilatadora NEGATIVA (Sin respuesta significativa)"}
            </h5>
            <p className="text-xs mt-1 leading-relaxed">
              {espPruebaPositiva
                ? "Cumple con ambos criterios internacionales (aumento ≥ 12% y ≥ 200 mL en FEV1). Altamente sugestivo de asma bronquial o componente asmático superpuesto en paciente con EPOC (ACO)."
                : "No alcanza los criterios simultáneos de 12% y 200 mL. Típico de limitación fija al flujo aéreo (EPOC clásica o remodelado de la vía aérea)."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
