import React from "react";
import { Badge } from "@/components/ui/badge";

export type StatusType =
  | "completada"
  | "realizada"
  | "al_dia"
  | "pagada"
  | "aprobado"
  | "activo"
  | "operativo"
  | "pendiente"
  | "agendada"
  | "en_sala"
  | "en_progreso"
  | "proxima"
  | "borrador"
  | "cancelada"
  | "no_show"
  | "vencida"
  | "inactivo"
  | "urgente"
  | "critico"
  | "alerta";

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  // Positivos / Al día / Completados (Verde)
  completada: { label: "Completada", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  realizada: { label: "Realizada", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  al_dia: { label: "Al día", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  pagado: { label: "Pagado", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  pagada: { label: "Pagada", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  aprobado: { label: "Aprobado", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  activo: { label: "Activo", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  operativo: { label: "Operativo", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },

  // En progreso / Pendientes / Próximos (Azul o Ámbar)
  pendiente: { label: "Pendiente", className: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  agendada: { label: "Agendada", className: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  en_sala: { label: "En sala", className: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  en_progreso: { label: "En progreso", className: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  proxima: { label: "Próxima", className: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  borrador: { label: "Borrador", className: "border-border bg-muted/50 text-muted-foreground" },

  // Alerta / Cancelados / Vencidos (Rojo)
  cancelada: { label: "Cancelada", className: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  no_show: { label: "No asistió", className: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  vencida: { label: "Vencida", className: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  inactivo: { label: "Inactivo", className: "border-border bg-muted/40 text-muted-foreground" },
  urgente: { label: "Urgente", className: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium" },
  critico: { label: "Crítico", className: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium" },
  alerta: { label: "Alerta", className: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium" },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = "" }) => {
  const normKey = (status || "").toLowerCase().trim().replace(/\s+/g, "_");
  const config = STATUS_MAP[normKey] || {
    label: label || status?.replace(/_/g, " ") || "—",
    className: "border-border bg-muted/40 text-muted-foreground",
  };

  return (
    <Badge
      variant="outline"
      className={`rounded-full text-[11px] px-2.5 py-0.5 font-normal capitalize whitespace-nowrap ${config.className} ${className}`}
    >
      {label || config.label}
    </Badge>
  );
};
