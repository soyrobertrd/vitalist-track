import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { GlassCard } from "@/components/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export interface BarSeriesConfig {
  key: string;
  label: string;
  color?: string;
}

interface BarCardProps {
  title: string;
  description?: string;
  data: any[];
  xAxisKey: string;
  series: BarSeriesConfig[];
  periodo?: string;
  loading?: boolean;
  stacked?: boolean;
}

export function BarCard({
  title,
  description,
  data = [],
  xAxisKey,
  series,
  periodo,
  loading = false,
  stacked = false,
}: BarCardProps) {
  const chartConfig: ChartConfig = React.useMemo(() => {
    return series.reduce((acc, s, idx) => {
      acc[s.key] = {
        label: s.label,
        color: s.color || `hsl(var(--chart-${(idx % 5) + 1}))`,
      };
      return acc;
    }, {} as ChartConfig);
  }, [series]);

  const isEmpty = data.length === 0 || data.every((d) => series.every((s) => !d[s.key]));

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
      ) : isEmpty ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          Sin datos en este periodo
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center">
          <div className="h-48 w-full mt-2">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                <XAxis
                  dataKey={xAxisKey}
                  tickLine={false}
                  axisLine={false}
                  className="text-[10px] text-muted-foreground font-mono"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  className="text-[10px] text-muted-foreground tabular-nums"
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltipContent />} />
                {series.map((s, idx) => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    name={s.label}
                    fill={s.color || `hsl(var(--chart-${(idx % 5) + 1}))`}
                    stackId={stacked ? "stack" : undefined}
                    radius={stacked ? (idx === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]) : [4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ChartContainer>
          </div>

          {/* Leyenda accesible */}
          <div className="flex items-center justify-center gap-4 mt-2 text-xs">
            {series.map((s, idx) => (
              <div key={s.key} className="flex items-center gap-1.5 text-[11px]">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.color || `hsl(var(--chart-${(idx % 5) + 1}))` }}
                />
                <span className="text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="sr-only">
            Resumen de barras: {data.map((d) => `${d[xAxisKey]}: ${series.map((s) => `${s.label} ${d[s.key]}`).join(", ")}`).join(" | ")}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
