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
    md: "p-6",
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

  return (
    <GlassCard
      onClick={onClick}
      className={cn(
        sizeClasses[size],
        "group relative overflow-hidden transition-all duration-300",
        "hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1",
        onClick && "cursor-pointer"
      )}
    >
      {/* Background decoration */}
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 -mr-10 -mt-10 transition-all group-hover:opacity-10 group-hover:scale-110",
        colorClasses[color]
      )} />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "p-2.5 rounded-xl transition-all group-hover:scale-110",
            colorClasses[color]
          )}>
            <Icon className={cn("h-5 w-5", iconColors[color])} />
          </div>
          
          {onClick && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Value */}
        <div className="space-y-1">
          {loading ? (
            <div className={cn("animate-pulse bg-muted rounded h-9 w-24", valueSizes[size])} />
          ) : (
            <div className={cn("font-bold text-foreground tracking-tight", valueSizes[size])}>
              {value}
            </div>
          )}
          
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
        </div>

        {/* Footer with trend and description */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground">{subtitle || description}</p>
          
          {(trend || percentChange) && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              (trend?.isPositive ?? Number(percentChange) > 0) 
                ? "bg-success/10 text-success" 
                : "bg-destructive/10 text-destructive"
            )}>
              {(trend?.isPositive ?? Number(percentChange) > 0) ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend?.value ?? percentChange}%
            </div>
          )}
        </div>
      </div>

      {/* Animated border effect on hover */}
      <div className={cn(
        "absolute inset-0 rounded-lg border-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
        `border-${color}/30`
      )} />
    </GlassCard>
  );
}
