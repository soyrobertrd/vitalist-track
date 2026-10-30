import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stethoscope } from "lucide-react";
import { toast } from "sonner";

interface MeldTabProps {
  meldCr: number;
  setMeldCr: (v: number) => void;
  meldBili: number;
  setMeldBili: (v: number) => void;
  meldInr: number;
  setMeldInr: (v: number) => void;
  meldNa: number;
  setMeldNa: (v: number) => void;
  calcMeldNa: number;
  meldMortalidad: string;
  onTransferir: (score: number) => void;
}

export function MeldTab({
  meldCr,
  setMeldCr,
  meldBili,
  setMeldBili,
  meldInr,
  setMeldInr,
  meldNa,
  setMeldNa,
  calcMeldNa,
  meldMortalidad,
  onTransferir,
}: MeldTabProps) {
  return (
    <Card className="rounded-2xl border-border/80 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-amber-600" />
          Calculadora MELD-Na (UNOS / OPTN)
        </CardTitle>
        <CardDescription>
          Predicción objetiva de mortalidad a 90 días en pacientes con falla hepática terminal y asignación de órganos para trasplante.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Creatinina (mg/dL):</Label>
              <Input
                type="number"
                step="0.1"
                value={meldCr}
                onChange={(e) => setMeldCr(Number(e.target.value))}
                className="rounded-xl border-border/80"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Bilirrubina (mg/dL):</Label>
              <Input
                type="number"
                step="0.1"
                value={meldBili}
                onChange={(e) => setMeldBili(Number(e.target.value))}
                className="rounded-xl border-border/80"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">INR:</Label>
              <Input
                type="number"
                step="0.05"
                value={meldInr}
                onChange={(e) => setMeldInr(Number(e.target.value))}
                className="rounded-xl border-border/80"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Sodio Sérico (mEq/L):</Label>
              <Input
                type="number"
                value={meldNa}
                onChange={(e) => setMeldNa(Number(e.target.value))}
                className="rounded-xl border-border/80"
              />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-muted/20 border border-border/80 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Score MELD-Na:</span>
                <span className="text-4xl font-extrabold text-foreground">{calcMeldNa}</span>
              </div>

              <div className="p-3.5 bg-background rounded-xl border border-border/80 space-y-1 text-xs">
                <strong className="text-foreground block">Mortalidad Estimada a 90 días:</strong>
                <p className="text-muted-foreground font-medium">{meldMortalidad}</p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full rounded-xl text-xs"
              onClick={() => {
                onTransferir(calcMeldNa);
                toast.info(`MELD-Na (${calcMeldNa}) transferido.`);
              }}
            >
              Transferir a Nueva Consulta
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
