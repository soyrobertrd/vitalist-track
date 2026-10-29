import React from "react";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { KpiVariant } from "./ClinicalKpiCard";

export interface ClinicalPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: KpiVariant;
  badge?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const ICON_VARIANTS: Record<KpiVariant, string> = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

export const ClinicalPageHeader: React.FC<ClinicalPageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  variant = "primary",
  badge,
  action,
  children,
  className = "",
}) => {
  const contentActions = action || children;
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl shrink-0 ${ICON_VARIANTS[variant]}`}
          >
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
            {badge && (
              <Badge variant="outline" className="rounded-full text-xs font-normal">
                {badge}
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {contentActions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {contentActions}
        </div>
      )}
    </div>
  );
};
