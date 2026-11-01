import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDays, addMonths, addYears, differenceInWeeks, differenceInDays, format } from "date-fns";
import { Calculator, Calendar, Baby, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

interface CalculadoraProps {
  onAplicarAConsulta?: (data: { fpp: string; fum: string; edadGestacional: number }) => void;
}

export function CalculadoraObstetricaNaegele({ onAplicarAConsulta }: CalculadoraProps) {
  // Estado FUM
  const [fumInput, setFumInput] = useState("2026-03-10");

  // Estado Score de Bishop
  const [dilatacion, setDilatacion] = useState(1);
  const [borramiento, setBorramiento] = useState(1);
  const [estacion, setEstacion] = useState(1);
  const [consistencia, setConsistencia] = useState(1);
  const [posicion, setPosicion] = useState(1);

  // Cálculo Naegele
  const calculoGestacional = useMemo(() => {
    try {
      const fechaFum = new Date(fumInput);
      if (isNaN(fechaFum.getTime())) return null;

      // Regla de Naegele: + 7 días, - 3 meses, + 1 año
      const fppDate = addDays(addMonths(addYears(fechaFum, 1), -3), 7);
      const hoy = new Date();

      const totalDias = differenceInDays(hoy, fechaFum);
      const semanas = differenceInWeeks(hoy, fechaFum);
      const diasRestantes = totalDias % 7;

      let trimestre = "Primer Trimestre (1 - 13 sem)";
      if (semanas >= 14 && semanas <= 27) trimestre = "Segundo Trimestre (14 - 27 sem)";
      if (semanas >= 28) trimestre = "Tercer Trimestre (≥ 28 sem)";

      // Altura uterina estimada (McDonald: semanas aprox ± 2cm a partir de las 20 sem)
      const auEsperada = semanas >= 20 && semanas <= 36 ? `${semanas - 2} a ${semanas + 2} cm` : "No valorable";

      return {
        fppStr: format(fppDate, "yyyy-MM-dd"),
        fppFormateada: format(fppDate, "dd 'de' MMMM, yyyy"),
        semanas,
        diasRestantes,
        trimestre,
        auEsperada,
      };
    } catch {
      return null;
    }
  }, [fumInput]);

  // Score de Bishop
  const bishopTotal = dilatacion + borramiento + estacion + consistencia + posicion;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Calculadora Gestacional Naegele */}
      <Card className="rounded-2xl border-border/80 shadow-none">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-rose-500" />
            Gestograma & Regla de Naegele (FPP)
          </CardTitle>
          <CardDescription>
            Cálculo de la Fecha Probable de Parto y semanas de amenorrea según ACOG / SEGO.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Fecha de Última Menstruación (FUM) *</Label>
            <Input
              type="date"
              value={fumInput}
              onChange={(e) => setFumInput(e.target.value)}
              className="h-9 text-xs font-mono max-w-xs"
            />
          </div>

          {calculoGestacional ? (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-border/70 bg-card">
                  <span className="text-[11px] text-muted-foreground">Edad Gestacional</span>
                  <div className="text-lg font-bold font-mono text-foreground mt-0.5">
                    {calculoGestacional.semanas} sem + {calculoGestacional.diasRestantes}d
                  </div>
                  <span className="text-[10px] text-muted-foreground">{calculoGestacional.trimestre}</span>
                </div>

                <div className="p-3 rounded-xl border border-rose-500/25 bg-rose-500/5">
                  <span className="text-[11px] text-rose-700 dark:text-rose-400">Fecha Probable de Parto</span>
                  <div className="text-sm font-bold text-foreground mt-0.5">
                    {calculoGestacional.fppFormateada}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">FPP: {calculoGestacional.fppStr}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-border/70 bg-muted/20 text-xs flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground">Altura Uterina Esperada (McDonald):</span>
                  <span className="font-bold font-mono ml-2 text-foreground">{calculoGestacional.auEsperada}</span>
                </div>
                {onAplicarAConsulta && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onAplicarAConsulta({
                        fpp: calculoGestacional.fppStr,
                        fum: fumInput,
                        edadGestacional: calculoGestacional.semanas,
                      })
                    }
                    className="h-7 text-xs rounded-lg"
                  >
                    Usar en Consulta <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
              Ingrese una fecha válida de FUM para calcular.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test de Bishop (Maduración Cervical para Inducción) */}
      <Card className="rounded-2xl border-border/80 shadow-none">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-purple-600" />
              Puntuación de Bishop (Maduración Cervical)
            </CardTitle>
            <Badge
              className={`text-xs ${
                bishopTotal >= 7 ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
              }`}
            >
              {bishopTotal >= 7 ? "Cérvix Favorable (≥7)" : "Cérvix Desfavorable (<7)"}
            </Badge>
          </div>
          <CardDescription>
            Predicción clínica del éxito de la inducción del trabajo de parto (0 a 13 puntos).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Dilatación Cervical</Label>
              <Select value={dilatacion.toString()} onValueChange={(v) => setDilatacion(parseInt(v))}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 pts: Cerrado (0 cm)</SelectItem>
                  <SelectItem value="1">1 pto: 1 - 2 cm</SelectItem>
                  <SelectItem value="2">2 pts: 3 - 4 cm</SelectItem>
                  <SelectItem value="3">3 pts: ≥ 5 cm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Borramiento Cervical</Label>
              <Select value={borramiento.toString()} onValueChange={(v) => setBorramiento(parseInt(v))}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 pts: 0 - 30%</SelectItem>
                  <SelectItem value="1">1 pto: 40 - 50%</SelectItem>
                  <SelectItem value="2">2 pts: 60 - 70%</SelectItem>
                  <SelectItem value="3">3 pts: ≥ 80%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Estación Fetal (Hodge / De Lee)</Label>
              <Select value={estacion.toString()} onValueChange={(v) => setEstacion(parseInt(v))}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 pts: -3</SelectItem>
                  <SelectItem value="1">1 pto: -2</SelectItem>
                  <SelectItem value="2">2 pts: -1 / 0</SelectItem>
                  <SelectItem value="3">3 pts: +1 / +2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Consistencia Cervical</Label>
              <Select value={consistencia.toString()} onValueChange={(v) => setConsistencia(parseInt(v))}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 pts: Firme</SelectItem>
                  <SelectItem value="1">1 pto: Media</SelectItem>
                  <SelectItem value="2">2 pts: Blanda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[11px] text-muted-foreground">Posición del Cérvix</Label>
              <Select value={posicion.toString()} onValueChange={(v) => setPosicion(parseInt(v))}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 pts: Posterior</SelectItem>
                  <SelectItem value="1">1 pto: Intermedia / Media</SelectItem>
                  <SelectItem value="2">2 pts: Anterior</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
            <div>
              <span className="font-bold text-foreground">Score Total de Bishop: </span>
              <span className="font-mono text-base font-bold text-primary">{bishopTotal} / 13 pts</span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {bishopTotal >= 7
                ? "Alta probabilidad de éxito con oxitocina directa."
                : "Requiere maduración previa con prostaglandinas (Dinoprostona / Misoprostol)."}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
