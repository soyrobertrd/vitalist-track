import { ArrowUpRight, Heart, Activity, Pill, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function HealthScoreWidget() {
  const navigate = useNavigate();

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-none transition-all hover:border-primary/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-black text-white shadow-md shadow-blue-500/20 tabular-nums">
            92
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">Score Clínico del Centro</h3>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                Óptimo
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Basado en indicadores de seguimiento, asistencia a citas y adherencia médica.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/pacientes")}
          className="rounded-xl text-xs font-semibold gap-1 self-start sm:self-auto"
        >
          Ver Analíticas <ArrowUpRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Grid de 4 micro tarjetas pastel con ondas de salud (Inspiradas en AI Healthcare) */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Ritmo Cardíaco */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-200/80 bg-blue-50/70 p-3.5 dark:border-blue-900/40 dark:bg-blue-950/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-950 dark:text-blue-200">Ritmo Cardíaco</span>
            <Heart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold tabular-nums text-blue-950 dark:text-blue-100">74.5</span>
            <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300">bpm prom</span>
          </div>
          {/* Mini trazo de onda ECG decorativo */}
          <div className="mt-2.5 h-6 w-full text-blue-500 dark:text-blue-400">
            <svg viewBox="0 0 100 24" className="h-full w-full overflow-visible" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M0,12 L20,12 L25,12 L30,4 L35,20 L40,8 L45,14 L50,12 L70,12 L75,7 L80,17 L85,12 L100,12" />
            </svg>
          </div>
        </div>

        {/* Card 2: Presión Arterial */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-200/80 bg-rose-50/70 p-3.5 dark:border-rose-900/40 dark:bg-rose-950/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-950 dark:text-rose-200">Presión Arterial</span>
            <Activity className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold tabular-nums text-rose-950 dark:text-rose-100">120/80</span>
            <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300">mmHg</span>
          </div>
          {/* Mini trazo de onda suave */}
          <div className="mt-2.5 h-6 w-full text-rose-500 dark:text-rose-400">
            <svg viewBox="0 0 100 24" className="h-full w-full overflow-visible" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M0,16 Q25,4 50,14 T100,10" />
            </svg>
          </div>
        </div>

        {/* Card 3: Adherencia a Tratamiento */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-950 dark:text-emerald-200">Adherencia Rx</span>
            <Pill className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold tabular-nums text-emerald-950 dark:text-emerald-100">96.2%</span>
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">tomas al día</span>
          </div>
          {/* Mini barra segmentada */}
          <div className="mt-3.5 flex gap-1">
            <div className="h-2 flex-1 rounded-full bg-emerald-500" />
            <div className="h-2 flex-1 rounded-full bg-emerald-500" />
            <div className="h-2 flex-1 rounded-full bg-emerald-500" />
            <div className="h-2 w-3 rounded-full bg-emerald-200 dark:bg-emerald-800" />
          </div>
        </div>

        {/* Card 4: Seguridad y Controles */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-950 dark:text-amber-200">Controles al Día</span>
            <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold tabular-nums text-amber-950 dark:text-amber-100">90.4%</span>
            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">al día</span>
          </div>
          {/* Mini trazo de control */}
          <div className="mt-2.5 h-6 w-full text-amber-500 dark:text-amber-400">
            <svg viewBox="0 0 100 24" className="h-full w-full overflow-visible" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M0,18 L30,14 L60,8 L100,5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
