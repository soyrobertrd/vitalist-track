import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calculator, HeartPulse, Flame, Copy } from "lucide-react";
import { toast } from "sonner";

export interface CalculadoraNutricionalProps {
  pesoInicial?: number;
  tallaInicial?: number;
  edadInicial?: number;
  sexoInicial?: "M" | "F";
  actividadInicial?: number;
  onAplicarCalorias?: (calorias: number) => void;
}

export function CalculadoraNutricionalDietetica({
  pesoInicial = 70,
  tallaInicial = 170,
  edadInicial = 35,
  sexoInicial = "M",
  actividadInicial = 1.375,
  onAplicarCalorias
}: CalculadoraNutricionalProps) {
  const [calcPeso, setCalcPeso] = useState<number>(pesoInicial);
  const [calcTalla, setCalcTalla] = useState<number>(tallaInicial);
  const [calcEdad, setCalcEdad] = useState<number>(edadInicial);
  const [calcSexo, setCalcSexo] = useState<"M" | "F">(sexoInicial);
  const [calcActividad, setCalcActividad] = useState<number>(actividadInicial);

  const calcResultados = useMemo(() => {
    const alturaM = calcTalla / 100;
    const imc = alturaM > 0 ? +(calcPeso / (alturaM * alturaM)).toFixed(1) : 0;
    
    let catImc = "Normal";
    let catColor = "text-emerald-600 dark:text-emerald-400";
    if (imc < 18.5) { 
      catImc = "Bajo peso"; 
      catColor = "text-amber-500"; 
    } else if (imc >= 25 && imc < 30) { 
      catImc = "Sobrepeso"; 
      catColor = "text-blue-600 dark:text-blue-400"; 
    } else if (imc >= 30 && imc < 35) { 
      catImc = "Obesidad Grado I"; 
      catColor = "text-orange-600"; 
    } else if (imc >= 35) { 
      catImc = "Obesidad Severa (Mórbida)"; 
      catColor = "text-rose-600"; 
    }

    // Peso Ideal Lorentz
    const pesoIdeal = calcSexo === "M" 
      ? +(calcTalla - 100 - ((calcTalla - 150) / 4)).toFixed(1)
      : +(calcTalla - 100 - ((calcTalla - 150) / 2.5)).toFixed(1);

    // Tasa Metabólica Basal (Mifflin-St Jeor)
    const tmb = calcSexo === "M"
      ? +(10 * calcPeso + 6.25 * calcTalla - 5 * calcEdad + 5).toFixed(0)
      : +(10 * calcPeso + 6.25 * calcTalla - 5 * calcEdad - 161).toFixed(0);

    const get = Math.round(tmb * calcActividad);

    // Distribución macronutrientes estándar (55% CHO, 20% PROT, 25% GRASAS)
    const choG = Math.round((get * 0.55) / 4);
    const protG = Math.round((get * 0.20) / 4);
    const grasaG = Math.round((get * 0.25) / 9);

    return { imc, catImc, catColor, pesoIdeal, tmb, get, choG, protG, grasaG };
  }, [calcPeso, calcTalla, calcEdad, calcSexo, calcActividad]);

  const copiarResumen = () => {
    const texto = `Resumen Nutricional: IMC: ${calcResultados.imc} (${calcResultados.catImc}) | Peso Ideal: ${calcResultados.pesoIdeal} kg | TMB: ${calcResultados.tmb} kcal | GET: ${calcResultados.get} kcal/día | CHO: ${calcResultados.choG}g, PROT: ${calcResultados.protG}g, GRASAS: ${calcResultados.grasaG}g`;
    navigator.clipboard.writeText(texto);
    toast.success("Resumen copiado al portapapeles");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Parámetros de Entrada */}
      <Card className="lg:col-span-5 rounded-2xl border-border/80 shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calculator className="h-5 w-5 text-emerald-600" />
            Parámetros del Paciente
          </CardTitle>
          <CardDescription>Ajuste los valores antropométricos para calcular los requerimientos en tiempo real</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calc-peso">Peso Actual (kg)</Label>
              <Input
                id="calc-peso"
                type="number"
                step="0.5"
                value={calcPeso}
                onChange={(e) => setCalcPeso(parseFloat(e.target.value) || 0)}
                className="border-border/80 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calc-talla">Talla (cm)</Label>
              <Input
                id="calc-talla"
                type="number"
                value={calcTalla}
                onChange={(e) => setCalcTalla(parseFloat(e.target.value) || 0)}
                className="border-border/80 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calc-edad">Edad (Años)</Label>
              <Input
                id="calc-edad"
                type="number"
                value={calcEdad}
                onChange={(e) => setCalcEdad(parseInt(e.target.value) || 0)}
                className="border-border/80 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calc-sexo">Sexo Biológico</Label>
              <Select value={calcSexo} onValueChange={(val: "M" | "F") => setCalcSexo(val)}>
                <SelectTrigger id="calc-sexo" className="border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="calc-actividad">Nivel de Actividad / Factor de Estrés</Label>
            <Select 
              value={calcActividad.toString()} 
              onValueChange={(val) => setCalcActividad(parseFloat(val))}
            >
              <SelectTrigger id="calc-actividad" className="border-border/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1.2">Sedentario / Encamado (x1.20)</SelectItem>
                <SelectItem value="1.375">Actividad Ligera / Deambula (x1.375)</SelectItem>
                <SelectItem value="1.55">Moderada / Fisioterapia activa (x1.55)</SelectItem>
                <SelectItem value="1.725">Estrés Quirúrgico / Sepsis moderada (x1.725)</SelectItem>
                <SelectItem value="1.9">Gran Quemado / Politrauma grave (x1.90)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copiarResumen}
              className="w-full text-xs"
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copiar Parámetros
            </Button>
            {onAplicarCalorias && (
              <Button
                size="sm"
                onClick={() => onAplicarCalorias(calcResultados.get)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                Aplicar al Plan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultados Calculados */}
      <Card className="lg:col-span-7 rounded-2xl border-border/80 shadow-xs bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-primary" />
            Prescripción y Resultados Calculados
          </CardTitle>
          <CardDescription>Cálculo basado en fórmulas clínicas estándar (Mifflin-St Jeor & Lorentz)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-background border border-border/70 space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Índice Masa Corp.</span>
              <p className="text-2xl font-bold font-mono text-foreground">{calcResultados.imc} kg/m²</p>
              <span className={`text-xs font-medium ${calcResultados.catColor}`}>{calcResultados.catImc}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-background border border-border/70 space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Peso Ideal (Lorentz)</span>
              <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{calcResultados.pesoIdeal} kg</p>
              <span className="text-xs text-muted-foreground">Referencia fisiológica</span>
            </div>

            <div className="p-3.5 rounded-xl bg-background border border-border/70 space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Gasto Basal (TMB)</span>
              <p className="text-2xl font-bold font-mono text-foreground">{calcResultados.tmb} kcal</p>
              <span className="text-xs text-muted-foreground">Reposo absoluto</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                Gasto Energético Total Diario (GET)
              </span>
              <p className="text-3xl font-extrabold font-mono text-emerald-700 dark:text-emerald-300">
                {calcResultados.get} <span className="text-lg font-normal">kcal/día</span>
              </p>
            </div>
            <Flame className="h-10 w-10 text-emerald-600/70" />
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Distribución de Macronutrientes Recomendada
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-background border border-border/70 text-center">
                <p className="text-xs text-muted-foreground">Carbohidratos (55%)</p>
                <p className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">{calcResultados.choG} g</p>
                <p className="text-[10px] text-muted-foreground">~{Math.round(calcResultados.choG * 4)} kcal</p>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border/70 text-center">
                <p className="text-xs text-muted-foreground">Proteínas (20%)</p>
                <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">{calcResultados.protG} g</p>
                <p className="text-[10px] text-muted-foreground">~{Math.round(calcResultados.protG * 4)} kcal</p>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border/70 text-center">
                <p className="text-xs text-muted-foreground">Lípidos (25%)</p>
                <p className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">{calcResultados.grasaG} g</p>
                <p className="text-[10px] text-muted-foreground">~{Math.round(calcResultados.grasaG * 9)} kcal</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
