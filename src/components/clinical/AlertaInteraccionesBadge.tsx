import { ResultadoFarmacovigilancia } from "@/lib/clinical/drug-interaction-checker";
import { AlertTriangle, ShieldCheck, ShieldAlert, Pill } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AlertaInteraccionesBadgeProps {
  resultado: ResultadoFarmacovigilancia;
}

export function AlertaInteraccionesBadge({ resultado }: AlertaInteraccionesBadgeProps) {
  if (!resultado.tieneRiesgo) {
    return (
      <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
        <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
        <span>Sin interacciones medicamentosas mayores ni alergias cruzadas detectadas.</span>
      </div>
    );
  }

  const esCritico = resultado.scoreMaximo === "critica";

  return (
    <div
      className={`p-3.5 rounded-2xl border space-y-2.5 transition-all ${
        esCritico
          ? "bg-red-50/70 dark:bg-red-950/30 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200"
          : "bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {esCritico ? (
            <ShieldAlert className="h-4 w-4 text-red-600 animate-bounce" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          )}
          <span className="font-bold text-xs uppercase tracking-wide">
            {esCritico ? "Alerta de Farmacovigilancia Crítica" : "Advertencia de Interacción Medicamentosa"}
          </span>
        </div>
        <Badge
          className={
            esCritico
              ? "bg-red-600 text-white text-[10px]"
              : "bg-amber-600 text-white text-[10px]"
          }
        >
          {resultado.scoreMaximo.toUpperCase()}
        </Badge>
      </div>

      {/* Alertas de Alergias */}
      {resultado.alertasAlergias.map((al, idx) => (
        <div
          key={`al-${idx}`}
          className="p-2.5 rounded-xl bg-background/80 border border-red-200 dark:border-red-900 text-xs space-y-1"
        >
          <strong className="text-red-600 dark:text-red-400 block font-semibold">
            🚨 Alergia Cruzada Detectada:
          </strong>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{al.mensaje}</p>
        </div>
      ))}

      {/* Interacciones Farmacológicas */}
      {resultado.interacciones.map((it, idx) => (
        <div
          key={`it-${idx}`}
          className="p-2.5 rounded-xl bg-background/80 border border-current/20 text-xs space-y-1"
        >
          <div className="flex items-center gap-1.5 font-bold">
            <Pill className="h-3.5 w-3.5 text-primary" />
            <span className="capitalize">{it.farmacoA}</span> + <span className="capitalize">{it.farmacoB}</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <strong>Efecto:</strong> {it.efectoClinico}
          </p>
          <p className="text-[11px] text-primary/90 font-medium">
            <strong>Recomendación:</strong> {it.recomendacion}
          </p>
        </div>
      ))}
    </div>
  );
}
