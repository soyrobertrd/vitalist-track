import { Heart, Activity, CheckCircle, Pill, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function VitalStatsCards() {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Indicadores de Calidad y Signos Vitales
        </h2>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Frecuencia Cardíaca */}
        <div className="flex flex-col justify-between rounded-3xl border border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                <Heart className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">Ritmo Cardíaco</span>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              Normal
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-bold tabular-nums text-foreground">
              74 <span className="text-xs font-medium text-muted-foreground">bpm</span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">Promedio en pacientes evaluados</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/pacientes")}
            className="mt-3.5 h-8 w-full rounded-xl text-xs font-semibold"
          >
            Ver Registro
          </Button>
        </div>

        {/* 2. Presión Arterial */}
        <div className="flex flex-col justify-between rounded-3xl border border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">Presión Arterial</span>
            </div>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              Óptima
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-bold tabular-nums text-foreground">
              120/80 <span className="text-xs font-medium text-muted-foreground">mmHg</span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">Rango normotenso registrado</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/pacientes")}
            className="mt-3.5 h-8 w-full rounded-xl text-xs font-semibold"
          >
            Historial PA
          </Button>
        </div>

        {/* 3. Tasa de Asistencia */}
        <div className="flex flex-col justify-between rounded-3xl border border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CheckCircle className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">Cumplimiento Citas</span>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              Alto
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-bold tabular-nums text-foreground">
              92.4% <span className="text-xs font-medium text-muted-foreground">asistencia</span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">Efectividad con recordatorios</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/calendario")}
            className="mt-3.5 h-8 w-full rounded-xl text-xs font-semibold"
          >
            Ver Agenda
          </Button>
        </div>

        {/* 4. Adherencia a Prescripciones */}
        <div className="flex flex-col justify-between rounded-3xl border border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                <Pill className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">Adherencia Rx</span>
            </div>
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
              Excelente
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-bold tabular-nums text-foreground">
              88.7% <span className="text-xs font-medium text-muted-foreground">adherencia</span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">Cumplimiento de recetas y tomas</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/app/citas")}
            className="mt-3.5 h-8 w-full rounded-xl text-xs font-semibold"
          >
            Recetas Activas
          </Button>
        </div>
      </div>
    </div>
  );
}
