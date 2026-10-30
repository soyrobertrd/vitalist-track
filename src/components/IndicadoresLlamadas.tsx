import { useEffect, useState } from "react";
import { db } from "@/integrations/db/client";
import { Phone, CheckCircle2, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Indicadores {
  total_llamadas: number;
  llamadas_realizadas: number;
  llamadas_contactadas: number;
  tasa_contacto: number;
  duracion_promedio: number;
  requieren_seguimiento: number;
  llamadas_pendientes: number;
  llamadas_canceladas: number;
}

export function IndicadoresLlamadas() {
  const [indicadores, setIndicadores] = useState<Indicadores | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIndicadores();
  }, []);

  const fetchIndicadores = async () => {
    try {
      const { data, error } = await db.rpc("calcular_indicadores_llamadas", {
        profesional_uuid: null,
        fecha_inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_fin: new Date().toISOString(),
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setIndicadores(data[0]);
      }
    } catch (error) {
      console.error("Error al obtener indicadores:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/80 bg-card p-4 space-y-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-8 w-16 rounded" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!indicadores) return null;

  return (
    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
      {/* 1. Total Llamadas */}
      <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Llamadas</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-foreground">{indicadores.total_llamadas}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Últimos 30 días</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
          <Phone className="h-5 w-5" />
        </div>
      </div>

      {/* 2. Realizadas & Contactadas */}
      <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Realizadas</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{indicadores.llamadas_realizadas}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">{indicadores.llamadas_contactadas}</span> contactadas
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
        </div>
      </div>

      {/* 3. Tasa de Contacto */}
      <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tasa Contacto</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-indigo-600 dark:text-indigo-400">{indicadores.tasa_contacto || 0}%</p>
          <p className="mt-1 text-[11px] text-muted-foreground">De llamadas salientes</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
          <TrendingUp className="h-5 w-5" />
        </div>
      </div>

      {/* 4. Duración Promedio */}
      <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Duración Prom.</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
            {indicadores.duracion_promedio || 0} <span className="text-xs font-medium text-muted-foreground">min</span>
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Tiempo de orientación</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
          <Clock className="h-5 w-5" />
        </div>
      </div>

      {/* 5. Seguimiento Pendiente */}
      <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Seguimiento</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">{indicadores.requieren_seguimiento}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">{indicadores.llamadas_pendientes}</span> agendadas
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
          <AlertCircle className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
