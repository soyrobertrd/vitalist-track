import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heart, Activity, AlertTriangle, Plus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export interface PartogramaPunto {
  hora: number; // 0, 1, 2, 3... horas de trabajo de parto
  dilatacionCm: number; // 4 a 10 cm
  fcfLpm: number; // Frecuencia cardíaca fetal
  contracciones10Min: number; // número de contracciones en 10 min
  liquidoAmniotico: "I" | "C" | "M" | "S"; // Íntegras, Claro, Meconial, Sanguinolento
  planoDescenso: "I" | "II" | "III" | "IV"; // Planos de Hodge
}

interface PartogramaInteractivoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteNombre?: string;
  edadGestacional?: string;
}

const DEFAULT_PUNTOS: PartogramaPunto[] = [
  { hora: 0, dilatacionCm: 4, fcfLpm: 140, contracciones10Min: 3, liquidoAmniotico: "I", planoDescenso: "I" },
  { hora: 1, dilatacionCm: 5, fcfLpm: 138, contracciones10Min: 3, liquidoAmniotico: "I", planoDescenso: "I" },
  { hora: 2, dilatacionCm: 6.5, fcfLpm: 142, contracciones10Min: 4, liquidoAmniotico: "C", planoDescenso: "II" },
  { hora: 3, dilatacionCm: 8, fcfLpm: 136, contracciones10Min: 4, liquidoAmniotico: "C", planoDescenso: "III" },
];

export const PartogramaInteractivoModal: React.FC<PartogramaInteractivoModalProps> = ({
  open,
  onOpenChange,
  pacienteNombre = "Ana Victoria Morales (G2P1)",
  edadGestacional = "39.2 semanas",
}) => {
  const [puntos, setPuntos] = useState<PartogramaPunto[]>(DEFAULT_PUNTOS);

  // Form para nuevo tacto / registro
  const [nuevoPunto, setNuevoPunto] = useState({
    dilatacionCm: 9,
    fcfLpm: 138,
    contracciones10Min: 5,
    liquidoAmniotico: "C" as PartogramaPunto["liquidoAmniotico"],
    planoDescenso: "III" as PartogramaPunto["planoDescenso"],
  });

  const handleAgregarPunto = () => {
    const siguienteHora = puntos.length > 0 ? puntos[puntos.length - 1].hora + 1 : 0;
    const nuevo: PartogramaPunto = {
      hora: siguienteHora,
      dilatacionCm: Number(nuevoPunto.dilatacionCm),
      fcfLpm: Number(nuevoPunto.fcfLpm),
      contracciones10Min: Number(nuevoPunto.contracciones10Min),
      liquidoAmniotico: nuevoPunto.liquidoAmniotico,
      planoDescenso: nuevoPunto.planoDescenso,
    };

    setPuntos([...puntos, nuevo]);
    toast.success(`Registro de tacto vaginal a la hora ${siguienteHora} agregado al partograma`);
  };

  const ultimoPunto = puntos[puntos.length - 1];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Heart className="h-5 w-5 text-rose-500" />
            Partograma Digital OMS — Monitorización del Trabajo de Parto
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
            <span>Paciente: <strong className="text-foreground">{pacienteNombre}</strong></span>
            <span>·</span>
            <span>Edad Gestacional: <strong className="text-foreground">{edadGestacional}</strong></span>
            <span>·</span>
            <Badge variant="outline" className="text-[11px] bg-rose-50 text-rose-700 dark:bg-rose-950/30">
              Fase Activa
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Gráfico SVG del Partograma OMS */}
          <div className="p-4 bg-card rounded-2xl border border-border/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-foreground">Curva de Dilatación Cervical (Línea de Alerta y Línea de Acción)</span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-sky-600">
                  <span className="w-2.5 h-0.5 bg-sky-500 inline-block"></span> Línea de Alerta (1cm/h)
                </span>
                <span className="flex items-center gap-1 text-rose-600">
                  <span className="w-2.5 h-0.5 bg-rose-500 inline-block"></span> Línea de Acción (+4h)
                </span>
                <span className="flex items-center gap-1 text-primary font-bold">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block"></span> Paciente (▲)
                </span>
              </div>
            </div>

            {/* Canvas / SVG Grid */}
            <div className="w-full aspect-[2.2/1] bg-slate-950 rounded-xl p-3 relative overflow-hidden select-none border border-slate-800">
              <svg className="w-full h-full" viewBox="0 0 600 240">
                {/* Rejilla de Fondo */}
                {[4, 5, 6, 7, 8, 9, 10].map((d, i) => {
                  const y = 200 - (d - 4) * 30;
                  return (
                    <g key={d}>
                      <line x1="40" y1={y} x2="580" y2={y} stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" />
                      <text x="15" y={y + 4} fill="#94a3b8" fontSize="10" fontFamily="monospace">
                        {d} cm
                      </text>
                    </g>
                  );
                })}

                {/* Eje X (Horas 0 a 8) */}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((h) => {
                  const x = 50 + h * 65;
                  return (
                    <g key={h}>
                      <line x1={x} y1="20" x2={x} y2="200" stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" />
                      <text x={x - 4} y="220" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                        H{h}
                      </text>
                    </g>
                  );
                })}

                {/* Línea de Alerta (Comienza en 4cm en Hora 0 y sube a 10cm en Hora 6) */}
                <line x1="50" y1="200" x2="440" y2="20" stroke="#0284c7" strokeWidth="2.5" />

                {/* Línea de Acción (4 horas a la derecha: comienza en Hora 4 a 4cm y sube a Hora 10 a 10cm) */}
                <line x1="310" y1="200" x2="580" y2="70" stroke="#e11d48" strokeWidth="2.5" strokeDasharray="5 3" />

                {/* Trazado Real de la Paciente */}
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  points={puntos
                    .map((p) => {
                      const x = 50 + p.hora * 65;
                      const y = 200 - (p.dilatacionCm - 4) * 30;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                />

                {/* Puntos / Marcadores de la Paciente */}
                {puntos.map((p, i) => {
                  const x = 50 + p.hora * 65;
                  const y = 200 - (p.dilatacionCm - 4) * 30;
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                      <text x={x - 6} y={y - 8} fill="#34d399" fontSize="11" fontWeight="bold" fontFamily="monospace">
                        {p.dilatacionCm}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 px-1">
              <span>Interpretación:</span>
              {ultimoPunto && ultimoPunto.dilatacionCm >= 8 ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Evolución Satisfactoria a la izquierda de la Línea de Alerta
                </span>
              ) : (
                <span className="text-sky-600 font-medium">Trabajo de parto en progresión activa normal</span>
              )}
            </div>
          </div>

          {/* Tabla de Parámetros Fisiológicos y Formulario de Nuevo Registro */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-2">
              <Label className="text-xs font-semibold">Historial de Registros por Hora</Label>
              <div className="rounded-xl border border-border/70 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 border-b border-border/70 text-[11px] text-muted-foreground uppercase">
                    <tr>
                      <th className="p-2">Hora</th>
                      <th className="p-2">Dilatación</th>
                      <th className="p-2">FC Fetal</th>
                      <th className="p-2">Contracciones</th>
                      <th className="p-2">Líquido</th>
                      <th className="p-2">Hodge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {puntos.map((p) => (
                      <tr key={p.hora} className="border-b border-border/50 last:border-none font-mono">
                        <td className="p-2 font-bold text-foreground">H{p.hora}</td>
                        <td className="p-2 text-emerald-600 font-bold">{p.dilatacionCm} cm</td>
                        <td className="p-2">{p.fcfLpm} lpm</td>
                        <td className="p-2">{p.contracciones10Min}/10 min</td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-[10px]">
                            {p.liquidoAmniotico === "I" && "Íntegras"}
                            {p.liquidoAmniotico === "C" && "Claro"}
                            {p.liquidoAmniotico === "M" && "Meconial"}
                            {p.liquidoAmniotico === "S" && "Sanguinolento"}
                          </Badge>
                        </td>
                        <td className="p-2">Plano {p.planoDescenso}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Formulario rápido de tacto vaginal */}
            <div className="p-3 bg-muted/40 rounded-xl border border-border/70 space-y-2.5 text-xs">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-primary" />
                Registrar Tacto Vaginal
              </Label>

              <div>
                <Label className="text-[11px]">Dilatación Cervical (cm)</Label>
                <Input
                  type="number"
                  min="4"
                  max="10"
                  step="0.5"
                  value={nuevoPunto.dilatacionCm}
                  onChange={(e) => setNuevoPunto({ ...nuevoPunto, dilatacionCm: parseFloat(e.target.value) || 0 })}
                  className="h-7 text-xs font-mono mt-0.5"
                />
              </div>

              <div>
                <Label className="text-[11px]">FC Fetal (lpm)</Label>
                <Input
                  type="number"
                  min="80"
                  max="200"
                  value={nuevoPunto.fcfLpm}
                  onChange={(e) => setNuevoPunto({ ...nuevoPunto, fcfLpm: parseInt(e.target.value) || 0 })}
                  className="h-7 text-xs font-mono mt-0.5"
                />
              </div>

              <div>
                <Label className="text-[11px]">Contracciones / 10 min</Label>
                <Input
                  type="number"
                  min="1"
                  max="6"
                  value={nuevoPunto.contracciones10Min}
                  onChange={(e) => setNuevoPunto({ ...nuevoPunto, contracciones10Min: parseInt(e.target.value) || 0 })}
                  className="h-7 text-xs font-mono mt-0.5"
                />
              </div>

              <div>
                <Label className="text-[11px]">Líquido Amniótico</Label>
                <Select
                  value={nuevoPunto.liquidoAmniotico}
                  onValueChange={(v: any) => setNuevoPunto({ ...nuevoPunto, liquidoAmniotico: v })}
                >
                  <SelectTrigger className="h-7 text-xs mt-0.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="I">Íntegras (Sin rotura)</SelectItem>
                    <SelectItem value="C">Claro (Rotas)</SelectItem>
                    <SelectItem value="M">Meconial (Riesgo)</SelectItem>
                    <SelectItem value="S">Sanguinolento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button size="sm" onClick={handleAgregarPunto} className="w-full text-xs h-7 rounded-lg mt-1">
                Añadir al Partograma
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cerrar Partograma
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
