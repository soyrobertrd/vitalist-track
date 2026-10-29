import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Baby, Sun, Calculator, Heart, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function EnfermeriaPediatricaNeonatalTab() {
  const [pesoPediatrico, setPesoPediatrico] = useState("8.5"); // kg
  const [fototerapiaHoras, setFototerapiaHoras] = useState(14);
  const [fototerapiaActiva, setFototerapiaActiva] = useState(true);

  // Escala FLACC de Dolor Pediátrico (Face, Legs, Activity, Cry, Consolability)
  const [flaccScores, setFlaccScores] = useState({
    face: 1, // 0-2
    legs: 1, // 0-2
    activity: 0, // 0-2
    cry: 1, // 0-2
    consolability: 1, // 0-2
  });

  const totalFlacc = Object.values(flaccScores).reduce((a, b) => a + b, 0);

  // Cálculo de Líquidos Holiday-Segar (Pediátrico)
  // 1-10kg: 100ml/kg
  // 11-20kg: 1000ml + 50ml/kg por cada kg > 10
  // >20kg: 1500ml + 20ml/kg por cada kg > 20
  const peso = Math.max(1, Number(pesoPediatrico) || 1);
  let volumenDia = 0;
  if (peso <= 10) {
    volumenDia = peso * 100;
  } else if (peso <= 20) {
    volumenDia = 1000 + (peso - 10) * 50;
  } else {
    volumenDia = 1500 + (peso - 20) * 20;
  }
  const goteoMlHora = Number((volumenDia / 24).toFixed(1));
  const microgotasMin = goteoMlHora; // 1 ml/h = 1 microgota/min (factor 60)

  return (
    <div className="space-y-6">
      {/* Cabecera Pediátrica */}
      <div className="p-4 rounded-2xl bg-muted/20 border border-border/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Enfermería Pediátrica & Cuidados Neonatales
          </span>
          <h3 className="text-lg font-bold text-foreground">Cuna 02 — Neonato García (RNT 38 semanas)</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-600 text-white rounded-full text-xs font-semibold">
            Fototerapia Intensiva Activa
          </Badge>
          <Badge variant="outline" className="rounded-full text-xs font-mono">
            Peso actual: {pesoPediatrico} kg
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fototerapia Neonatal */}
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardHeader className="pb-3 bg-muted/15">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sun className="h-5 w-5 text-amber-500" />
              Fototerapia por Hiperbilirrubinemia
            </CardTitle>
            <p className="text-xs text-muted-foreground">Monitoreo de horas de luz azul y protección ocular</p>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="p-4 rounded-2xl bg-card border border-border/70 text-center space-y-1">
              <span className="text-muted-foreground block text-[11px] uppercase font-semibold">
                Horas Acumuladas
              </span>
              <strong className="text-4xl font-black text-amber-500 font-mono tabular-nums">
                {fototerapiaHoras}h
              </strong>
              <span className="text-muted-foreground text-xs block">de 24h programadas</span>
            </div>

            <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border/60">
              <div className="flex justify-between items-center">
                <span>Protección Ocular:</span>
                <strong className="text-emerald-600">✓ Antifaz colocado y fijo</strong>
              </div>
              <div className="flex justify-between items-center">
                <span>Protección Genital:</span>
                <strong className="text-emerald-600">✓ Pañal opaco colocado</strong>
              </div>
              <div className="flex justify-between items-center">
                <span>Distancia lámpara:</span>
                <strong className="font-mono">35 cm (Estándar)</strong>
              </div>
            </div>

            <Button
              className="w-full rounded-xl text-xs shadow-none gap-1.5"
              onClick={() => {
                setFototerapiaHoras(h => h + 1);
                toast.success("Hora de fototerapia registrada.");
              }}
            >
              <CheckCircle2 className="h-4 w-4" /> Registrar 1 Hora de Fototerapia
            </Button>
          </CardContent>
        </Card>

        {/* Calculadora de Goteo Pediátrico Holiday-Segar */}
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardHeader className="pb-3 bg-muted/15">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              Líquidos Holliday-Segar
            </CardTitle>
            <p className="text-xs text-muted-foreground">Cálculo de volumen de mantenimiento por peso</p>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div>
              <Label className="text-xs font-semibold">Peso del Paciente (kg)</Label>
              <Input
                type="number"
                step="0.1"
                min="1"
                value={pesoPediatrico}
                onChange={e => setPesoPediatrico(e.target.value)}
                className="rounded-xl mt-1 text-xs font-mono font-bold"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-2 text-center">
              <span className="text-muted-foreground block text-[11px] uppercase font-semibold">
                Volumen Total Diario
              </span>
              <p className="text-2xl font-black text-blue-600 font-mono tabular-nums">{volumenDia} ml/día</p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Velocidad Infusión:</span>
                  <strong className="font-mono text-foreground text-sm">{goteoMlHora} ml/h</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Microgotero:</span>
                  <strong className="font-mono text-foreground text-sm">{microgotasMin} µgtt/min</strong>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              * Regla clásica: 100 ml/kg para los primeros 10 kg + 50 ml/kg de 11 a 20 kg.
            </p>
          </CardContent>
        </Card>

        {/* Escala FLACC de Dolor */}
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardHeader className="pb-3 bg-muted/15">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Baby className="h-5 w-5 text-purple-600" />
              Escala FLACC (Dolor Pediátrico)
            </CardTitle>
            <p className="text-xs text-muted-foreground">Evaluación conductual para niños de 0 a 7 años</p>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="text-center py-2 bg-card rounded-xl border border-border/70">
              <span className="text-3xl font-black text-purple-600 font-mono tabular-nums">{totalFlacc} / 10</span>
              <div className="mt-1">
                <Badge className="text-[10px] rounded-full">
                  {totalFlacc === 0
                    ? "Relax / Sin dolor"
                    : totalFlacc <= 3
                    ? "Molestia leve"
                    : totalFlacc <= 6
                    ? "Dolor moderado"
                    : "Dolor severo"}
                </Badge>
              </div>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {[
                { k: "face", l: "Rostro", opts: ["Sin expresión (0)", "Muecas ocasionales (1)", "Ceño fruncido constante (2)"] },
                { k: "legs", l: "Piernas", opts: ["Relajadas (0)", "Inquietas (1)", "Pataleo / Tensión (2)"] },
                { k: "activity", l: "Actividad", opts: ["Tranquilo (0)", "Se retuerce (1)", "Rígido / Arqueado (2)"] },
                { k: "cry", l: "Llanto", opts: ["Sin llanto (0)", "Quejidos ocasionales (1)", "Llanto inconsolable (2)"] },
                { k: "consolability", l: "Consolabilidad", opts: ["Tranquilo (0)", "Se distrae con contacto (1)", "Difícil de consolar (2)"] },
              ].map(item => (
                <div key={item.k} className="flex justify-between items-center text-[11px] p-1.5 bg-muted/30 rounded-lg">
                  <span className="font-semibold">{item.l}:</span>
                  <select
                    className="bg-card text-foreground border border-border/70 rounded-md text-[10px] px-1 py-0.5"
                    value={flaccScores[item.k as keyof typeof flaccScores]}
                    onChange={e => setFlaccScores({ ...flaccScores, [item.k]: Number(e.target.value) })}
                  >
                    <option value={0}>{item.opts[0]}</option>
                    <option value={1}>{item.opts[1]}</option>
                    <option value={2}>{item.opts[2]}</option>
                  </select>
                </div>
              ))}
            </div>

            <Button
              className="w-full rounded-xl text-xs shadow-none"
              onClick={() => toast.success(`Puntuación FLACC ${totalFlacc}/10 registrada en ficha pediátrica.`)}
            >
              Registrar Evaluación FLACC
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
