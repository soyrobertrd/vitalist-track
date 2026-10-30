import React from "react";
import { useLocation } from "react-router-dom";
import { varianteDeRuta } from "@/lib/categoriaColor";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

export type KpiVariant = "primary" | "emerald" | "purple" | "amber" | "rose" | "blue" | "teal" | "indigo";

/** Acepta un componente de icono (Heart) o un elemento ya creado (<Heart />). */
export type IconoProp = LucideIcon | React.ReactElement;

export function renderIcono(Icon: IconoProp | undefined, className: string) {
  if (!Icon) return null;
  if (React.isValidElement(Icon)) return Icon;
  const Componente = Icon as LucideIcon;
  return <Componente className={className} aria-hidden="true" />;
}

/** Variante explícita (variant o color); si no hay, el color de la categoría del menú de la ruta actual. */
export function useVarianteCategoria(variant?: string, color?: string): KpiVariant {
  const { pathname } = useLocation();
  const v = variant ?? color;
  return v && v in VARIANT_STYLES ? (v as KpiVariant) : varianteDeRuta(pathname);
}

export interface ClinicalKpiCardProps {
  title?: string;
  /** Alias de title. */
  label?: string;
  value: string | number;
  subtitle?: string;
  icon: IconoProp;
  variant?: KpiVariant;
  /** Alias de variant. */
  color?: string;
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
  indigo: {
    iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    text: "text-foreground",
    hoverBorder: "hover:border-indigo-500/40",
  },
};

export const ClinicalKpiCard: React.FC<ClinicalKpiCardProps> = ({
  title,
  label,
  value,
  subtitle,
  icon,
  variant,
  color,
  alert = false,
  trend,
  onClick,
  className = "",
}) => {
  const styles = VARIANT_STYLES[useVarianteCategoria(variant, color)];

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
          {renderIcono(icon, "h-5 w-5")}
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
          <p className="text-xs text-muted-foreground mt-1 truncate">{title ?? label}</p>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground/80 truncate">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
