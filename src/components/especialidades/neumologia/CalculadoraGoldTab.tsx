import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Sparkles } from "lucide-react";

interface CalculadoraGoldTabProps {
  goldFev1Pct: number;
  setGoldFev1Pct: (val: number) => void;
  goldMmrc: number;
  setGoldMmrc: (val: number) => void;
  goldExacAnuales: number;
  setGoldExacAnuales: (val: number) => void;
  goldHospitalizacion: boolean;
  setGoldHospitalizacion: (val: boolean) => void;
  goldClasificacion: {
    grado: string;
    grupo: string;
    esquema: string;
  };
}

export function CalculadoraGoldTab({
  goldFev1Pct,
  setGoldFev1Pct,
  goldMmrc,
  setGoldMmrc,
  goldExacAnuales,
  setGoldExacAnuales,
  goldHospitalizacion,
  setGoldHospitalizacion,
  goldClasificacion,
}: CalculadoraGoldTabProps) {
  return (
    <Card className="rounded-2xl border-border/80 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5 text-cyan-600" />
          Estratificación EPOC según Guías GOLD 2024
        </CardTitle>
        <CardDescription>
          Clasificación de gravedad espirométrica (GOLD 1 a 4) y asignación de grupo clínico A, B o E para guiar el tratamiento farmacológico inicial.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">FEV1 % del Valor Predicho (post-broncodilatador):</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={10}
                  max={120}
                  value={goldFev1Pct}
                  onChange={(e) => setGoldFev1Pct(Number(e.target.value))}
                  className="rounded-xl border-border/80 w-32"
                />
                <span className="text-xs text-muted-foreground">% (Normal ≥ 80%)</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Grado de Disnea mMRC (0 a 4):</Label>
              <Select value={goldMmrc.toString()} onValueChange={(v) => setGoldMmrc(Number(v))}>
                <SelectTrigger className="rounded-xl border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Grado 0: Solo disnea ante ejercicio muy intenso</SelectItem>
                  <SelectItem value="1">Grado 1: Disnea al andar rápido en llano o subir ligera cuesta</SelectItem>
                  <SelectItem value="2">Grado 2: Incapacidad de mantener el paso de contemporáneos</SelectItem>
                  <SelectItem value="3">Grado 3: Debe detenerse a descansar a los 100 metros en llano</SelectItem>
                  <SelectItem value="4">Grado 4: Disnea extrema que impide salir de casa o vestirse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Exacerbaciones moderadas en el último año:</Label>
              <Input
                type="number"
                min={0}
                max={12}
                value={goldExacAnuales}
                onChange={(e) => setGoldExacAnuales(Number(e.target.value))}
                className="rounded-xl border-border/80 w-32"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="goldHosp"
                checked={goldHospitalizacion}
                onChange={(e) => setGoldHospitalizacion(e.target.checked)}
                className="rounded h-4 w-4 text-cyan-600 focus:ring-cyan-500"
              />
              <label htmlFor="goldHosp" className="text-xs font-medium cursor-pointer">
                ¿Ha requerido al menos 1 hospitalización por exacerbación aguda en los últimos 12 meses?
              </label>
            </div>
          </div>

          {/* Resultado y Recomendación */}
          <div className="p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Gravedad Espirométrica:</span>
                <Badge className="bg-cyan-600 text-white">{goldClasificacion.grado}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Grupo Clínico GOLD 2024:</span>
                <Badge variant="outline" className="border-cyan-500 text-cyan-700 dark:text-cyan-300 font-bold">
                  Grupo {goldClasificacion.grupo}
                </Badge>
              </div>

              <div className="p-3.5 bg-background rounded-xl border border-border/80 space-y-1.5 text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-cyan-600" />
                  Tratamiento Farmacológico Inicial Recomendado:
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  {goldClasificacion.esquema}
                </p>
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground border-t border-border/60 pt-2">
              * Nota clínica: En todos los grupos se recomienda cesación tabáquica estricta, vacunas (influenza, neumococo, COVID-19, VSR) y actividad física diaria.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
