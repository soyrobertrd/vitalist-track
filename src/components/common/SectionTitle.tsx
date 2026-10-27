import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionTitleProps {
  children: ReactNode;
  /** Acciones o filtros alineados a la derecha */
  actions?: ReactNode;
  className?: string;
}

/** Título de sección con barra de acento a la izquierda (estilo ficha clínica limpia). */
export function SectionTitle({ children, actions, className }: SectionTitleProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <h2 className="flex items-center gap-3 text-lg font-semibold tracking-tight">
        <span className="h-5 w-1 rounded-full bg-primary" aria-hidden="true" />
        {children}
      </h2>
      {actions}
    </div>
  );
}
