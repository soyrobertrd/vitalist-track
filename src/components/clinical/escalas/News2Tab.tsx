import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HeartPulse, CheckCircle2 } from "lucide-react";

interface News2TabProps {
  onGuardar: (
    nombre: string,
    categoria: string,
    puntuacion: string,
    interpretacion: string,
    riesgo: "bajo" | "moderado" | "alto" | "critico",
    detalles?: string
  ) => void;
}

export function News2Tab({ onGuardar }: News2TabProps) {
  const [newsFr, setNewsFr] = useState(0); // 0-3
  const [newsSat, setNewsSat] = useState(0); // 0-3
  const [newsOxigeno, setNewsOxigeno] = useState(0); // 0 o 2
  const [newsPas, setNewsPas] = useState(0); // 0-3
  const [newsFc, setNewsFc] = useState(0); // 0-3
  const [newsConciencia, setNewsConciencia] = useState(0); // 0 o 3

  const newsTotal = newsFr + newsSat + newsOxigeno + newsPas + newsFc + newsConciencia;

  const getNewsInterpretacion = () => {
    if (newsTotal >= 7 || newsConciencia === 3) return { texto: "Riesgo Clínico Alto (Respuesta de Emergencia)", riesgo: "critico" as const };
    if (newsTotal >= 5) return { texto: "Riesgo Clínico Medio (Valoración Urgente)", riesgo: "alto" as const };
    if (newsTotal >= 1) return { texto: "Riesgo Clínico Bajo-Medio", riesgo: "moderado" as const };
    return { texto: "Riesgo Clínico Bajo (Monitoreo Rutinario)", riesgo: "bajo" as const };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-rose-600" />
              NEWS2 (National Early Warning Score - Deterioro & Sepsis)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Herramienta de detección precoz de deterioro clínico agudo y respuesta rápida.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Frecuencia Respiratoria (rpm)</Label>
                <Select value={String(newsFr)} onValueChange={v => setNewsFr(Number(v))}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="3">≤ 8 rpm (3 pts)</SelectItem>
                    <SelectItem value="1">9 - 11 rpm (1 pt)</SelectItem>
                    <SelectItem value="0">12 - 20 rpm (0 pts - Normal)</SelectItem>
                    <SelectItem value="2">21 - 24 rpm (2 pts)</SelectItem>
                    <SelectItem value="3">≥ 25 rpm (3 pts)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Saturación de Oxígeno (SpO2 %)</Label>
                <Select value={String(newsSat)} onValueChange={v => setNewsSat(Number(v))}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="0">≥ 96% (0 pts - Normal)</SelectItem>
                    <SelectItem value="1">94 - 95% (1 pt)</SelectItem>
                    <SelectItem value="2">92 - 93% (2 pts)</SelectItem>
                    <SelectItem value="3">≤ 91% (3 pts)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Soporte de Oxígeno</Label>
                <Select value={String(newsOxigeno)} onValueChange={v => setNewsOxigeno(Number(v))}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="0">Aire ambiente (0 pts)</SelectItem>
                    <SelectItem value="2">Oxígeno suplementario (2 pts)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Presión Arterial Sistólica (mmHg)</Label>
                <Select value={String(newsPas)} onValueChange={v => setNewsPas(Number(v))}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="3">≤ 90 mmHg (3 pts)</SelectItem>
                    <SelectItem value="2">91 - 100 mmHg (2 pts)</SelectItem>
                    <SelectItem value="1">101 - 110 mmHg (1 pt)</SelectItem>
                    <SelectItem value="0">111 - 219 mmHg (0 pts - Normal)</SelectItem>
                    <SelectItem value="3">≥ 220 mmHg (3 pts)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Frecuencia Cardíaca (lpm)</Label>
                <Select value={String(newsFc)} onValueChange={v => setNewsFc(Number(v))}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="3">≤ 40 lpm (3 pts)</SelectItem>
                    <SelectItem value="1">41 - 50 lpm (1 pt)</SelectItem>
                    <SelectItem value="0">51 - 90 lpm (0 pts - Normal)</SelectItem>
                    <SelectItem value="1">91 - 110 lpm (1 pt)</SelectItem>
                    <SelectItem value="2">111 - 130 lpm (2 pts)</SelectItem>
                    <SelectItem value="3">≥ 131 lpm (3 pts)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Nivel de Conciencia (AVPU)</Label>
                <Select value={String(newsConciencia)} onValueChange={v => setNewsConciencia(Number(v))}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="0">Alerta (A) - (0 pts)</SelectItem>
                    <SelectItem value="3">Voz (V), Dolor (P) o Inconsciente (U) - (3 pts)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resultado NEWS2 */}
      <div className="space-y-4">
        <Card className="rounded-2xl border-border/80 shadow-none bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
              Puntuación NEWS2
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4 bg-card rounded-2xl border border-border/70">
              <span className="text-5xl font-black text-foreground tabular-nums">{newsTotal}</span>
              <span className="text-xl font-bold text-muted-foreground"> pts</span>
              <div className="mt-2">
                <Badge
                  className={`rounded-full text-xs font-semibold px-3 py-1 ${
                    getNewsInterpretacion().riesgo === "critico"
                      ? "bg-rose-600 text-white animate-pulse"
                      : getNewsInterpretacion().riesgo === "alto"
                      ? "bg-amber-500 text-white"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  {getNewsInterpretacion().texto}
                </Badge>
              </div>
            </div>

            <Button
              className="w-full rounded-xl shadow-none"
              onClick={() =>
                onGuardar(
                  "NEWS2",
                  "Deterioro / Sepsis",
                  `${newsTotal} pts`,
                  getNewsInterpretacion().texto,
                  getNewsInterpretacion().riesgo,
                  `FR: ${newsFr} | SpO2: ${newsSat} | O2: ${newsOxigeno} | PAS: ${newsPas} | FC: ${newsFc} | AVPU: ${newsConciencia}`
                )
              }
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Registrar en Monitor Clínico
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
