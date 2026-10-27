import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Sparkles, Building2, Stethoscope, ArrowRight, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { VERTICAL_LABELS } from "@/config/verticales";

interface MedicalHeroBannerProps {
  nombreUsuario?: string;
  currentTime: Date;
  visitasHoy: number;
  sucursalNombre?: string;
  verticalActiva?: string;
}

export function MedicalHeroBanner({
  nombreUsuario,
  currentTime,
  visitasHoy,
  sucursalNombre = "Sede Central",
  verticalActiva = "todas",
}: MedicalHeroBannerProps) {
  const navigate = useNavigate();
  const hora = currentTime.getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  const verticalNombre = verticalActiva !== "todas" ? (VERTICAL_LABELS as any)[verticalActiva] : null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-blue-200/60 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-cyan-500/10 p-6 sm:p-7 dark:border-blue-900/40 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-cyan-950/20">
      {/* Fondo decorativo radial */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-400/15 blur-3xl dark:bg-blue-600/10" />
      <div className="pointer-events-none absolute -bottom-16 right-48 h-48 w-48 rounded-full bg-indigo-400/15 blur-2xl dark:bg-indigo-600/10" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Lado izquierdo: Saludo y contexto clínico */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-blue-300/80 bg-white/80 text-blue-700 shadow-sm backdrop-blur-sm dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
              <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <Clock className="mr-1 h-3.5 w-3.5" />
              {format(currentTime, "HH:mm")} · {format(currentTime, "EEEE d 'de' MMMM", { locale: es }).replace(/^./, (c) => c.toUpperCase())}
            </Badge>

            <Badge variant="outline" className="border-border/60 bg-white/60 text-muted-foreground backdrop-blur-sm dark:bg-slate-900/50">
              <Building2 className="mr-1 h-3 w-3 text-blue-600 dark:text-blue-400" />
              {sucursalNombre}
            </Badge>

            {verticalNombre && (
              <Badge variant="outline" className="border-indigo-200 bg-indigo-50/80 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300">
                <Stethoscope className="mr-1 h-3 w-3" />
                {verticalNombre}
              </Badge>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              ¡{saludo}{nombreUsuario ? `, Dr. ${nombreUsuario}` : ""}! <span className="inline-block animate-wave">👋</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              {visitasHoy > 0 ? (
                <>
                  Tienes <span className="font-semibold text-foreground tabular-nums">{visitasHoy}</span> {visitasHoy === 1 ? "cita médica programada" : "citas médicas programadas"} para el día de hoy.
                </>
              ) : (
                "Todo despejado por el momento. Tu agenda clínica está lista para nuevas consultas."
              )}
            </p>
          </div>
        </div>

        {/* Lado derecho: Tarjeta de Asistente Clínico Inteligente */}
        <div className="flex shrink-0 flex-col gap-2 rounded-2xl border border-blue-200/80 bg-white/85 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:gap-4 dark:border-blue-900/60 dark:bg-slate-900/80 lg:max-w-md">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Bot className="h-6 w-6" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground">Asistente Clínico IA</span>
              <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Beta
              </span>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              Resumen clínico de pacientes y apoyo diagnóstico rápido.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => navigate("/pacientes")}
            className="shrink-0 bg-blue-600 text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Explorar
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
