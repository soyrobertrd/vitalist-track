import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

export type KpiVariant = "primary" | "emerald" | "purple" | "amber" | "rose" | "blue" | "teal";

export interface ClinicalKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: KpiVariant;
  alert?: boolean;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
  className?: string;
}

const VARIANT_STYLES: Record<KpiVariant, { iconBg: string; text: string; hoverBorder: string }> = {
  primary: {
    iconBg: "bg-primary/10 text-primary",
    text: "text-foreground",
    hoverBorder: "hover:border-primary/40",
  },
  emerald: {
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    text: "text-foreground",
    hoverBorder: "hover:border-emerald-500/40",
  },
  purple: {
    iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    text: "text-foreground",
    hoverBorder: "hover:border-purple-500/40",
  },
  amber: {
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    text: "text-foreground",
    hoverBorder: "hover:border-amber-500/40",
  },
  rose: {
    iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    text: "text-rose-600 dark:text-rose-400",
    hoverBorder: "hover:border-rose-500/40",
  },
  blue: {
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    text: "text-foreground",
    hoverBorder: "hover:border-blue-500/40",
  },
  teal: {
    iconBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    text: "text-foreground",
    hoverBorder: "hover:border-teal-500/40",
  },
};

export const ClinicalKpiCard: React.FC<ClinicalKpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "primary",
  alert = false,
  trend,
  onClick,
  className = "",
}) => {
  const styles = VARIANT_STYLES[variant];

  return (
    <Card
      onClick={onClick}
      className={`rounded-2xl border transition-all duration-200 shadow-none ${
        alert
          ? "border-rose-500/40 bg-rose-500/[0.03]"
          : `border-border/80 ${styles.hoverBorder}`
      } ${onClick ? "cursor-pointer active:scale-[0.99]" : ""} ${className}`}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
            alert ? "bg-rose-500/20 text-rose-600 dark:text-rose-400" : styles.iconBg
          }`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p
              className={`text-2xl font-bold tabular-nums leading-none truncate ${
                alert ? "text-rose-600 dark:text-rose-400" : styles.text
              }`}
            >
              {value}
            </p>
            {trend && (
              <span
                className={`text-[11px] font-medium tabular-nums ${
                  trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {trend.value}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">{title}</p>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground/80 truncate">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
