import { useNavigate } from "react-router-dom";
import { Users, Calendar, Phone, TrendingUp, CheckCircle2, Building, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EnhancedKPIsProps {
  totalPacientes: number;
  pacientesActivos: number;
  visitasHoy: number;
  llamadasPendientes: number;
  tasaCumplimiento: number;
}

export function EnhancedKPIs({
  totalPacientes,
  pacientesActivos,
  visitasHoy,
  llamadasPendientes,
  tasaCumplimiento,
}: EnhancedKPIsProps) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* 1. Tarjeta Destacada con Gradiente Azul Primario (Inspirada en Imagen 1 "Total doctors: 300+") */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate("/pacientes")}
        onKeyDown={(e) => e.key === "Enter" && navigate("/pacientes")}
        className="group relative cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 p-5 text-white shadow-md shadow-blue-500/15 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* Glow sutil */}
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-xl transition-transform group-hover:scale-125" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-blue-100">Total Pacientes</span>
          </div>

          <Badge className="border-0 bg-white/20 text-xs font-semibold text-white backdrop-blur-sm">
            <TrendingUp className="mr-1 h-3 w-3" />
            +12.5%
          </Badge>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <div className="text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">
              {totalPacientes}
            </div>
            <p className="mt-1 text-xs text-blue-100">
              <span className="font-semibold text-white">{pacientesActivos}</span> activos en seguimiento
            </p>
          </div>

          {/* Mini gráfico de barras decorativo blanco (estilo Imagen 1) */}
          <div className="flex items-end gap-1.5 pb-1">
            <div className="h-4 w-2 rounded-t-sm bg-white/50 group-hover:h-5 transition-all" />
            <div className="h-7 w-2 rounded-t-sm bg-white/70 group-hover:h-8 transition-all" />
            <div className="h-5 w-2 rounded-t-sm bg-white/60 group-hover:h-6 transition-all" />
            <div className="h-9 w-2 rounded-t-sm bg-white group-hover:h-10 transition-all shadow-sm" />
            <div className="h-6 w-2 rounded-t-sm bg-white/80 group-hover:h-7 transition-all" />
          </div>
        </div>

        <div className="mt-3.5 border-t border-white/15 pt-2.5 text-[11px] text-blue-100 flex items-center justify-between">
          <span>Gestionar base clínica</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-blue-200 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>

      {/* 2. Tarjeta Citas Hoy (Inspirada en Imagen 1 "Book appointment / 15.140") */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate("/calendario")}
        onKeyDown={(e) => e.key === "Enter" && navigate("/calendario")}
        className="group relative cursor-pointer rounded-3xl border border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-sm active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-foreground">Citas para Hoy</span>
          </div>

          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            En agenda
          </Badge>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground sm:text-4xl">
            {visitasHoy}
          </div>
          <span className="text-xs text-muted-foreground">Consultas médicas</span>
        </div>

        {/* Micro barra rayada de progreso de citas */}
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(visitasHoy * 15, 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Ver horarios de consulta</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>

      {/* 3. Tarjeta Llamadas & Seguimiento (Inspirada en Imagen 1 "Room availability") */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate("/llamadas")}
        onKeyDown={(e) => e.key === "Enter" && navigate("/llamadas")}
        className="group relative cursor-pointer rounded-3xl border border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-sm active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Phone className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-foreground">Seguimiento</span>
          </div>

          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
            Pendientes
          </Badge>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground sm:text-4xl">
            {llamadasPendientes}
          </div>
          <span className="text-xs text-muted-foreground">Llamadas agendadas</span>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            Por contactar
          </span>
          <span className="font-semibold text-foreground tabular-nums">Últimos 30 días</span>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Abrir registro de llamadas</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>

      {/* 4. Tarjeta Tasa de Cumplimiento (Inspirada en Imagen 1 "Overall visitor: 1.140 (+3.5%)") */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate("/calendario")}
        onKeyDown={(e) => e.key === "Enter" && navigate("/calendario")}
        className="group relative cursor-pointer rounded-3xl border border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-500/40 hover:shadow-sm active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-foreground">Asistencia a Citas</span>
          </div>

          <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
            Efectividad
          </Badge>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground sm:text-4xl">
            {tasaCumplimiento}%
          </div>
          <span className="text-xs text-muted-foreground">Tasa global</span>
        </div>

        {/* Barra de progreso de asistencia */}
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${Math.max(tasaCumplimiento, 5)}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Control de inasistencias</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </div>
  );
}
