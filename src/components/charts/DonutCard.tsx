import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { GlassCard } from "@/components/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export interface DonutDataItem {
  name: string;
  value: number;
  fill?: string;
}

interface DonutCardProps {
  title: string;
  description?: string;
  data: DonutDataItem[];
  config?: ChartConfig;
  loading?: boolean;
  periodo?: string;
  centerLabel?: string;
}

const DEFAULT_CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function DonutCard({
  title,
  description,
  data = [],
  config,
  loading = false,
  periodo,
  centerLabel = "Total",
}: DonutCardProps) {
  const total = React.useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data]);

  // Consolidar a máximo 5 segmentos más "Otros"
  const processedData = React.useMemo(() => {
    if (data.length <= 5) {
      return data.map((item, idx) => ({
        ...item,
        fill: item.fill || DEFAULT_CHART_COLORS[idx % DEFAULT_CHART_COLORS.length],
      }));
    }
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const top4 = sorted.slice(0, 4);
    const otrosValue = sorted.slice(4).reduce((acc, cur) => acc + cur.value, 0);
    return [
      ...top4.map((item, idx) => ({
        ...item,
        fill: item.fill || DEFAULT_CHART_COLORS[idx],
      })),
      { name: "Otros", value: otrosValue, fill: DEFAULT_CHART_COLORS[4] },
    ];
  }, [data]);

  const chartConfig: ChartConfig =
    config ||
    processedData.reduce((acc, curr, idx) => {
      acc[curr.name] = {
        label: curr.name,
        color: curr.fill || DEFAULT_CHART_COLORS[idx % DEFAULT_CHART_COLORS.length],
      };
      return acc;
    }, {} as ChartConfig);

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
        <div className="py-8 flex flex-col items-center justify-center space-y-3">
          <Skeleton className="h-32 w-32 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      ) : total === 0 ? (
        <div className="py-12 text-center text-xs text-muted-foreground">
          Sin datos en este periodo
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center">
          <div className="relative h-44 w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <PieChart>
                <Tooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={processedData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={68}
                  paddingAngle={3}
                  stroke="none"
                >
                  {processedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold tabular-nums tracking-tight">{total}</span>
              <span className="text-[10px] text-muted-foreground uppercase">{centerLabel}</span>
            </div>
          </div>

          {/* Leyenda con porcentaje */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {processedData.map((item) => {
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={item.name} className="flex items-center justify-between gap-1 text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="truncate text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="tabular-nums font-semibold">{pct}%</span>
                </div>
              );
            })}
          </div>

          <div className="sr-only">
            Resumen: {processedData.map((d) => `${d.name}: ${d.value}`).join(", ")}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
