import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle2, AlertTriangle, ArrowRight, TrendingUp, ShieldAlert, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface OperationalEfficiencyCardsProps {
  duracionPromedio: number;
  tasaCumplimiento: number;
  pacientesAltoRiesgo: number;
  porcentajeAltoRiesgo: number;
}

export function OperationalEfficiencyCards({
  duracionPromedio,
  tasaCumplimiento,
  pacientesAltoRiesgo,
  porcentajeAltoRiesgo,
}: OperationalEfficiencyCardsProps) {
  const navigate = useNavigate();

  // Cálculo de circunferencia para gauges circulares SVG (radio = 34, perímetro ≈ 213.6)
  const radius = 34;
  const circumference = 2 * Math.PI * radius;

  // Gauge 1: Duración promedio (normalizada en escala 0-60 min)
  const duracionOffset = circumference - (Math.min(duracionPromedio, 60) / 60) * circumference;
  const duracionOptima = duracionPromedio >= 15 && duracionPromedio <= 35;

  // Gauge 2: Cumplimiento (0-100%)
  const cumplimientoOffset = circumference - (Math.min(tasaCumplimiento, 100) / 100) * circumference;

  // Gauge 3: Alto riesgo (0-25%)
  const riesgoOffset = circumference - (Math.min(porcentajeAltoRiesgo * 4, 100) / 100) * circumference;

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Resumen Operativo y Calidad Clínica
          </h2>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">
          Benchmarks últimos 30 días
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* 1. Duración Promedio de Consulta */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Tiempo de Consulta</h3>
                <p className="text-[11px] text-muted-foreground">Promedio por paciente</p>
              </div>
            </div>

            <Badge
              variant="outline"
              className={
                duracionOptima
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
              }
            >
              {duracionOptima ? "Rango óptimo" : "En seguimiento"}
            </Badge>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground sm:text-4xl">
                {duracionPromedio}{" "}
                <span className="text-sm font-medium text-muted-foreground">min</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Estándar clínico: <span className="font-semibold text-foreground">20 - 30 min</span>
              </p>
            </div>

            {/* Gauge Circular SVG */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="stroke-muted"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="stroke-blue-600 transition-all duration-700 ease-out dark:stroke-blue-500"
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={duracionOffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] font-bold text-muted-foreground">
                <span>{Math.round((duracionPromedio / 30) * 100)}%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
            <span>Fluidez en sala de espera</span>
            <span className="font-medium text-foreground">Excelente</span>
          </div>
        </div>

        {/* 2. Tasa de Asistencia Global */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Asistencia a Citas</h3>
                <p className="text-[11px] text-muted-foreground">Efectividad contra no-show</p>
              </div>
            </div>

            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              <TrendingUp className="mr-1 h-3 w-3" />
              {tasaCumplimiento >= 80 ? "Alta retención" : "Estándar"}
            </Badge>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground sm:text-4xl">
                {tasaCumplimiento}
                <span className="text-sm font-medium text-muted-foreground">%</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Inasistencias reducidas con recordatorios
              </p>
            </div>

            {/* Gauge Circular SVG */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="stroke-muted"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="stroke-emerald-500 transition-all duration-700 ease-out"
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={cumplimientoOffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <span>{tasaCumplimiento}%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
            <span>Canal activo</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">WhatsApp Bot</span>
          </div>
        </div>

        {/* 3. Pacientes de Alto Seguimiento */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Alto Seguimiento</h3>
                <p className="text-[11px] text-muted-foreground">Requieren confirmación</p>
              </div>
            </div>

            <Badge
              variant="outline"
              className={
                pacientesAltoRiesgo > 0
                  ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                  : "border-border/60 bg-muted/40 text-muted-foreground"
              }
            >
              {pacientesAltoRiesgo > 0 ? "Prioritario" : "Al día"}
            </Badge>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground sm:text-4xl">
                {pacientesAltoRiesgo}
                <span className="text-sm font-medium text-muted-foreground"> pacientes</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Representa el <span className="font-semibold text-foreground">{porcentajeAltoRiesgo}%</span> de la base activa
              </p>
            </div>

            {/* Gauge Circular SVG */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="stroke-muted"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="stroke-rose-500 transition-all duration-700 ease-out"
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={riesgoOffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] font-bold text-rose-600 dark:text-rose-400">
                <span>{porcentajeAltoRiesgo}%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-[11px]">
            <span className="text-muted-foreground">Protocolo activo</span>
            <button
              type="button"
              onClick={() => navigate("/pacientes")}
              className="flex items-center gap-1 font-semibold text-primary hover:underline transition-all"
            >
              Ver pacientes <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
