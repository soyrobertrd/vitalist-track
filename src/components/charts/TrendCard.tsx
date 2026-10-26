import React from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { GlassCard } from "@/components/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { TimeSeriesPoint } from "@/lib/forecast";

interface TrendCardProps {
  title: string;
  description?: string;
  data: TimeSeriesPoint[];
  periodo?: string;
  loading?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
}

export function TrendCard({
  title,
  description,
  data = [],
  periodo,
  loading = false,
  valuePrefix = "",
  valueSuffix = "",
}: TrendCardProps) {
  const chartConfig: ChartConfig = {
    real: {
      label: "Real histórico",
      color: "hsl(var(--chart-1))",
    },
    proyeccion: {
      label: "Proyección futura",
      color: "hsl(var(--chart-2))",
    },
  };

  const hasData = data && data.length > 0;
  // Localizar el punto de corte (donde empieza la proyección)
  const hoyIndex = data.findIndex((d) => d.esProyeccion);
  const corteLabel = hoyIndex > 0 ? data[hoyIndex - 1]?.periodo : undefined;

  return (
    <GlassCard className="p-5 flex flex-col justify-between shadow-none border bg-card">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h4 className="text-sm font-semibold tracking-tight text-foreground">{title}</h4>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {periodo && (
          <span className="text-[11px] font-medium text-muted-foreground border px-2 py-0.5 rounded-md bg-muted/30">
            {periodo}
          </span>
        )}
      </div>

      {loading ? (
        <div className="py-8 space-y-3">
          <Skeleton className="h-44 w-full rounded-lg" />
          <div className="flex justify-between gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ) : !hasData ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          Sin datos suficientes para proyectar
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center">
          <div className="h-48 w-full mt-2">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                <XAxis
                  dataKey="periodo"
                  tickLine={false}
                  axisLine={false}
                  className="text-[10px] text-muted-foreground font-mono"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  className="text-[10px] text-muted-foreground tabular-nums"
                  tickFormatter={(val) => `${valuePrefix}${val}${valueSuffix}`}
                />
                <Tooltip content={<ChartTooltipContent />} />

                {/* Banda de confianza para los puntos proyectados */}
                <Area
                  type="monotone"
                  dataKey="rangoMax"
                  stroke="none"
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.12}
                />

                {corteLabel && (
                  <ReferenceLine
                    x={corteLabel}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="2 2"
                    label={{ value: "Hoy", position: "top", fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                  />
                )}

                {/* Línea histórica sólida */}
                <Line
                  type="monotone"
                  dataKey="real"
                  name="Datos reales"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "hsl(var(--chart-1))" }}
                  activeDot={{ r: 5 }}
                />

                {/* Línea de proyección punteada */}
                <Line
                  type="monotone"
                  dataKey="proyeccion"
                  name="Proyección (estimada)"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: "hsl(var(--chart-2))" }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ChartContainer>
          </div>

          {/* Leyenda accesible */}
          <div className="flex items-center justify-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="h-0.5 w-4 bg-primary inline-block" />
              <span className="text-muted-foreground">Datos Reales</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="h-0.5 w-4 border-t-2 border-dashed border-primary inline-block" />
              <span className="text-muted-foreground">Proyección (+3m)</span>
            </div>
          </div>

          <div className="sr-only">
            Serie con proyección: {data.map((d) => `${d.periodo}: ${d.real ?? d.proyeccion}`).join(", ")}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
