import { calcularNEWS2, ParametrosNEWS2 } from "@/lib/clinical/news2-calculator";
import { AlertTriangle, ShieldCheck, Activity } from "lucide-react";

interface News2BadgeProps {
  params: ParametrosNEWS2;
  compact?: boolean;
}

export function News2Badge({ params, compact = false }: News2BadgeProps) {
  const res = calcularNEWS2(params);

  const bgClasses = {
    bajo: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
    medio: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    alto: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-300 dark:border-red-800 animate-pulse",
  }[res.nivelRiesgo];

  if (compact) {
    return (
      <span
        title={`NEWS2 Score: ${res.scoreTotal} | ${res.respuestaClinica}`}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${bgClasses}`}
      >
        <Activity className="h-3 w-3" />
        NEWS2: {res.scoreTotal}
      </span>
    );
  }

  return (
    <div className={`p-3 rounded-2xl border ${bgClasses} space-y-1.5 transition-all`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {res.nivelRiesgo === "alto" ? (
            <AlertTriangle className="h-4 w-4 text-red-600 animate-bounce" />
          ) : (
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          )}
          <span className="font-semibold text-xs tracking-wide">
            Escala de Alerta Temprana (NEWS2)
          </span>
        </div>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-background/80 shadow-xs border">
          Score: {res.scoreTotal}
        </span>
      </div>

      <p className="text-[11px] leading-relaxed">
        <strong>Acción clínica:</strong> {res.respuestaClinica}
      </p>

      <div className="flex items-center justify-between text-[10px] opacity-80 pt-1 border-t border-current/10">
        <span>Frecuencia recomendada: {res.frecuenciaMonitoreo}</span>
        <span className="uppercase font-semibold tracking-wider">{res.badgeLabel}</span>
      </div>
    </div>
  );
}
