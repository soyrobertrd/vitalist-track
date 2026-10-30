import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

export interface AldreteState {
  actividad: number;
  respiracion: number;
  circulacion: number;
  consciencia: number;
  saturacion: number;
}

export interface AldreteUrpaTabProps {
  aldrete: AldreteState;
  setAldrete: React.Dispatch<React.SetStateAction<AldreteState>>;
  aldreteScoreTotal: number;
  esAptoAltaURPA: boolean;
}

export function AldreteUrpaTab({
  aldrete,
  setAldrete,
  aldreteScoreTotal,
  esAptoAltaURPA,
}: AldreteUrpaTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <Card className="lg:col-span-7 rounded-2xl border-border/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-base font-semibold">Test de Aldrete Modificado (Alta de Recuperación)</CardTitle>
          <CardDescription>Evaluación de 5 parámetros fisiológicos para egreso seguro de URPA</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* 1. Actividad */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">1. Actividad Motora</Label>
            <Select
              value={aldrete.actividad.toString()}
              onValueChange={(v) => setAldrete((p) => ({ ...p, actividad: parseInt(v) }))}
            >
              <SelectTrigger className="rounded-xl border-border/80 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">Mueve 4 extremidades voluntariamente o ante órdenes (2 pts)</SelectItem>
                <SelectItem value="1">Mueve 2 extremidades (1 pt)</SelectItem>
                <SelectItem value="0">Incapaz de mover extremidades (0 pts)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 2. Respiración */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">2. Respiración</Label>
            <Select
              value={aldrete.respiracion.toString()}
              onValueChange={(v) => setAldrete((p) => ({ ...p, respiracion: parseInt(v) }))}
            >
              <SelectTrigger className="rounded-xl border-border/80 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">Capaz de respirar profundamente y toser libremente (2 pts)</SelectItem>
                <SelectItem value="1">Disnea o respiración superficial / limitada (1 pt)</SelectItem>
                <SelectItem value="0">Apnea o requiere soporte ventilatorio mecánico (0 pts)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 3. Circulación */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">3. Presión Arterial (Circulación)</Label>
            <Select
              value={aldrete.circulacion.toString()}
              onValueChange={(v) => setAldrete((p) => ({ ...p, circulacion: parseInt(v) }))}
            >
              <SelectTrigger className="rounded-xl border-border/80 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">PA dentro del ±20% del nivel preanestésico (2 pts)</SelectItem>
                <SelectItem value="1">PA dentro del ±20% al 49% del nivel preanestésico (1 pt)</SelectItem>
                <SelectItem value="0">PA difiere en ±50% o más del nivel preanestésico (0 pts)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 4. Consciencia */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">4. Consciencia</Label>
            <Select
              value={aldrete.consciencia.toString()}
              onValueChange={(v) => setAldrete((p) => ({ ...p, consciencia: parseInt(v) }))}
            >
              <SelectTrigger className="rounded-xl border-border/80 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">Completamente despierto y orientado (2 pts)</SelectItem>
                <SelectItem value="1">Despierta al llamado auditivo (1 pt)</SelectItem>
                <SelectItem value="0">No responde al estímulo auditivo / somnolencia profunda (0 pts)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 5. Saturación O2 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">5. Saturación de Oxígeno</Label>
            <Select
              value={aldrete.saturacion.toString()}
              onValueChange={(v) => setAldrete((p) => ({ ...p, saturacion: parseInt(v) }))}
            >
              <SelectTrigger className="rounded-xl border-border/80 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">Mantiene SatO2 &gt; 92% respirando aire ambiente (2 pts)</SelectItem>
                <SelectItem value="1">Necesita O2 por cánula nasal para mantener SatO2 &gt; 90% (1 pt)</SelectItem>
                <SelectItem value="0">SatO2 &lt; 90% a pesar de oxígeno suplementario (0 pts)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-5 rounded-2xl border-border/80 shadow-xs bg-muted/20 flex flex-col justify-between">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Dictamen de Alta de URPA</CardTitle>
          <CardDescription>Puntaje total requerido para traslado a habitación o alta: ≥ 9 puntos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-6 rounded-2xl bg-background border border-border/80 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Puntaje Aldrete Total</p>
            <p className="text-5xl font-extrabold font-mono text-foreground">
              {aldreteScoreTotal} <span className="text-xl text-muted-foreground font-normal">/ 10</span>
            </p>
            <div>
              {esAptoAltaURPA ? (
                <Badge className="bg-emerald-600 text-white px-3 py-1 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> APTO PARA TRASLADO A PISO
                </Badge>
              ) : (
                <Badge variant="destructive" className="px-3 py-1 text-xs">
                  <Clock className="h-3.5 w-3.5 mr-1" /> PERMANECER EN MONITORIZACIÓN URPA
                </Badge>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border/70 space-y-2 text-xs">
            <p className="font-semibold text-foreground">Criterios de Egreso de la Sala de Recuperación:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Signos vitales estables durante al menos 30 minutos consecutivos.</li>
              <li>Ausencia de sangrado activo o expansivo en el lecho quirúrgico.</li>
              <li>Dolor postoperatorio controlado con EVA &lt; 4.</li>
              <li>Náuseas y vómitos controlados sin requerimiento de antieméticos continuos.</li>
            </ul>
          </div>
        </CardContent>
        <div className="p-4 border-t border-border/60">
          <Button
            className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
            disabled={!esAptoAltaURPA}
            onClick={() => toast.success(`Alta de URPA autorizada con Aldrete ${aldreteScoreTotal}/10`)}
          >
            Autorizar Alta de Recuperación
          </Button>
        </div>
      </Card>
    </div>
  );
}
