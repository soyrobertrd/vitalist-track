import type { LucideIcon } from "lucide-react";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface Accion {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  /** Acción destructiva (se muestra en rojo y separada al final) */
  peligro?: boolean;
  oculta?: boolean;
}

interface AccionesMenuProps {
  acciones: Accion[];
  /** Texto accesible del botón, p. ej. "Acciones de Juan Pérez" */
  label: string;
  titulo?: string;
  /** "icono" = botón ⋮ compacto (tarjetas/filas); "boton" = botón grande con texto (barra de página) */
  variante?: "icono" | "boton";
  textoBoton?: string;
  iconoBoton?: LucideIcon;
  className?: string;
}

/** Menú de acciones con tres puntos: agrupa acciones secundarias para no llenar la UI de botones. */
export function AccionesMenu({
  acciones,
  label,
  titulo,
  variante = "icono",
  textoBoton = "Acciones",
  iconoBoton: IconoBoton = MoreVertical,
  className,
}: AccionesMenuProps) {
  const visibles = acciones.filter((a) => !a.oculta);
  const normales = visibles.filter((a) => !a.peligro);
  const peligrosas = visibles.filter((a) => a.peligro);
  if (visibles.length === 0) return null;

  const item = (a: Accion) => {
    const Icon = a.icon;
    return (
      <DropdownMenuItem
        key={a.label}
        onSelect={a.onSelect}
        className={cn("gap-2.5 py-2", a.peligro && "text-destructive focus:bg-destructive/10 focus:text-destructive")}
      >
        {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
        {a.label}
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variante === "icono" ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            className={cn("h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground", className)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" aria-label={label} className={cn("rounded-full", className)}>
            <IconoBoton className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {textoBoton}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48" onClick={(e) => e.stopPropagation()}>
        {titulo && (
          <>
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{titulo}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        {normales.map(item)}
        {peligrosas.length > 0 && normales.length > 0 && <DropdownMenuSeparator />}
        {peligrosas.map(item)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
