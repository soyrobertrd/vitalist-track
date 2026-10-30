import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator } from "lucide-react";
import { toast } from "sonner";

interface ChildPughTabProps {
  cpBilirrubina: number;
  setCpBilirrubina: (v: number) => void;
  cpAlbumina: number;
  setCpAlbumina: (v: number) => void;
  cpInr: number;
  setCpInr: (v: number) => void;
  cpAscitis: number;
  setCpAscitis: (v: number) => void;
  cpEncefalopatia: number;
  setCpEncefalopatia: (v: number) => void;
  childPughPuntos: number;
  childPughResultado: {
    clase: string;
    sobrevida1: string;
    sobrevida2: string;
    riesgoQuirurgico: string;
    badge: string;
  };
  onUsarClase: (clase: string) => void;
}

export function ChildPughTab({
  cpBilirrubina,
  setCpBilirrubina,
  cpAlbumina,
  setCpAlbumina,
  cpInr,
  setCpInr,
  cpAscitis,
  setCpAscitis,
  cpEncefalopatia,
  setCpEncefalopatia,
  childPughPuntos,
  childPughResultado,
  onUsarClase,
}: ChildPughTabProps) {
  return (
    <Card className="rounded-2xl border-border/80 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5 text-amber-600" />
          Score de Child-Turcotte-Pugh para Cirrosis Hepática
        </CardTitle>
        <CardDescription>
          Evaluación del pronóstico, sobrevida a 1 y 2 años y estratificación del riesgo quirúrgico en hepatopatía crónica.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Bilirrubina Total (mg/dL):</Label>
              <Input
                type="number"
                step="0.1"
                value={cpBilirrubina}
                onChange={(e) => setCpBilirrubina(Number(e.target.value))}
                className="rounded-xl border-border/80"
              />
              <span className="text-[11px] text-muted-foreground block">
                &lt; 2 mg/dL (1 pt) | 2 - 3 mg/dL (2 pts) | &gt; 3 mg/dL (3 pts)
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Albúmina Sérica (g/dL):</Label>
              <Input
                type="number"
                step="0.1"
                value={cpAlbumina}
                onChange={(e) => setCpAlbumina(Number(e.target.value))}
                className="rounded-xl border-border/80"
              />
              <span className="text-[11px] text-muted-foreground block">
                &gt; 3.5 g/dL (1 pt) | 2.8 - 3.5 g/dL (2 pts) | &lt; 2.8 g/dL (3 pts)
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">INR (Tiempo de Protrombina):</Label>
              <Input
                type="number"
                step="0.05"
                value={cpInr}
                onChange={(e) => setCpInr(Number(e.target.value))}
                className="rounded-xl border-border/80"
              />
              <span className="text-[11px] text-muted-foreground block">
                &lt; 1.7 (1 pt) | 1.7 - 2.3 (2 pts) | &gt; 2.3 (3 pts)
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Ascitis Clínica / Ecográfica:</Label>
              <Select value={cpAscitis.toString()} onValueChange={(v) => setCpAscitis(Number(v))}>
                <SelectTrigger className="rounded-xl border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Ausente (1 punto)</SelectItem>
                  <SelectItem value="2">Leve o controlada con diuréticos (2 puntos)</SelectItem>
                  <SelectItem value="3">Moderada a grave o refractaria (3 puntos)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Encefalopatía Hepática (Criterios West-Haven):</Label>
              <Select value={cpEncefalopatia.toString()} onValueChange={(v) => setCpEncefalopatia(Number(v))}>
                <SelectTrigger className="rounded-xl border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Grado 0: Ausente (1 punto)</SelectItem>
                  <SelectItem value="2">Grado I - II: Confusión leve o asterixis (2 puntos)</SelectItem>
                  <SelectItem value="3">Grado III - IV: Somnolencia profunda o coma (3 puntos)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resultado Child-Pugh */}
          <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Puntuación Total:</span>
                <span className="text-3xl font-extrabold text-foreground">{childPughPuntos} / 15 pts</span>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">Clase Child-Pugh:</span>
                <Badge className={`w-full justify-center py-1.5 text-xs font-bold ${childPughResultado.badge}`}>
                  {childPughResultado.clase}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-background rounded-xl border border-border/80">
                  <span className="text-muted-foreground block text-[10px]">Sobrevida 1 año:</span>
                  <span className="text-base font-bold text-foreground">{childPughResultado.sobrevida1}</span>
                </div>
                <div className="p-3 bg-background rounded-xl border border-border/80">
                  <span className="text-muted-foreground block text-[10px]">Sobrevida 2 años:</span>
                  <span className="text-base font-bold text-foreground">{childPughResultado.sobrevida2}</span>
                </div>
              </div>

              <div className="p-3.5 bg-background rounded-xl border border-border/80 text-xs space-y-1">
                <strong className="text-foreground block">Riesgo Quirúrgico Perioperatorio:</strong>
                <p className="text-muted-foreground leading-relaxed">{childPughResultado.riesgoQuirurgico}</p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full rounded-xl text-xs"
              onClick={() => {
                onUsarClase(childPughResultado.clase);
                toast.info(`Clase Child-Pugh (${childPughResultado.clase}) copiada.`);
              }}
            >
              Usar clase en formulario
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
