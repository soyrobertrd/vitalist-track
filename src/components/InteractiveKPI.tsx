import { LucideIcon, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/GlassCard";

interface InteractiveKPIProps {
  title: string;
  value: number | string;
  previousValue?: number;
  description?: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  color?: "primary" | "secondary" | "success" | "warning" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  /** Tarjeta destacada en color de la vertical (una por fila, como KPI principal) */
  highlight?: boolean;
  /** Barra de progreso 0-100 bajo el valor (ocupación, cumplimiento…) */
  progress?: number;
}

export function InteractiveKPI({
  title,
  value,
  previousValue,
  description,
  subtitle,
  icon: Icon,
  trend,
  onClick,
  color = "primary",
  size = "md",
  loading = false,
  highlight = false,
  progress,
}: InteractiveKPIProps) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary/10 text-secondary border-secondary/20",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const iconColors = {
    primary: "text-primary",
    secondary: "text-secondary",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  };

  const sizeClasses = {
    sm: "p-4",
    md: "p-5",
    lg: "p-8",
  };

  const valueSizes = {
    sm: "text-2xl",
    md: "text-3xl",
    lg: "text-4xl",
  };

  // Calculate percentage change
  const percentChange = previousValue && typeof value === 'number' 
    ? ((value - previousValue) / previousValue * 100).toFixed(1)
    : null;

  const positivo = trend?.isPositive ?? Number(percentChange) > 0;
  const mostrarTendencia = trend || percentChange;

  return (
    <GlassCard
      onClick={onClick}
      className={cn(
        sizeClasses[size],
        "group relative flex flex-col overflow-hidden transition-colors",
        highlight ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/40",
        onClick && "cursor-pointer"
      )}
    >
      <div
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={onClick ? `${title}: ${value}` : undefined}
        onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
        className="flex flex-1 flex-col rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className={cn("rounded-lg p-1.5", highlight ? "bg-primary-foreground/15" : colorClasses[color])}>
              <Icon className={cn("h-4 w-4", highlight ? "text-primary-foreground" : iconColors[color])} aria-hidden="true" />
            </div>
            <p className={cn("truncate text-sm font-medium", highlight ? "text-primary-foreground" : "text-foreground")}>{title}</p>
          </div>
          {onClick && (
            <ArrowRight
              className={cn("h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5", highlight ? "text-primary-foreground/80" : "text-muted-foreground")}
              aria-hidden="true"
            />
          )}
        </div>

        <div className="mt-4 flex items-end gap-2">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded bg-muted" />
          ) : (
            <span className={cn("font-bold leading-none tracking-tight tabular-nums", valueSizes[size])}>{value}</span>
          )}
          {mostrarTendencia && (
            <span
              className={cn(
                "mb-0.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                highlight
                  ? "bg-primary-foreground/15 text-primary-foreground"
                  : positivo ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              )}
            >
              {positivo ? <TrendingUp className="h-3 w-3" aria-hidden="true" /> : <TrendingDown className="h-3 w-3" aria-hidden="true" />}
              {trend?.value ?? percentChange}%
            </span>
          )}
        </div>

        {progress !== undefined && (
          <div
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            className={cn("mt-3 h-1.5 w-full overflow-hidden rounded-full", highlight ? "bg-primary-foreground/20" : "bg-muted")}
          >
            <div
              className={cn("h-full rounded-full", highlight ? "bg-primary-foreground" : "bg-primary")}
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        )}

        {(subtitle || description) && (
          <p className={cn("mt-2 text-xs", highlight ? "text-primary-foreground/80" : "text-muted-foreground")}>{subtitle || description}</p>
        )}
      </div>
    </GlassCard>
  );
}
