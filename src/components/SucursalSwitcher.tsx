import { Building2, Check, ChevronsUpDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSucursales } from "@/hooks/useSucursales";
import { useActiveSucursal } from "@/contexts/ActiveSucursalContext";

interface Props {
  /** Compact icon-only mode for mobile */
  compact?: boolean;
}

/**
 * Global selector for the active branch (sucursal). Hidden if the workspace has no branches.
 * "Todas" = no filter applied.
 */
export function SucursalSwitcher({ compact = false }: Props) {
  const { sucursales } = useSucursales();
  const { activeSucursalId, setActiveSucursalId } = useActiveSucursal();

  if (sucursales.length === 0) return null;

  const active = sucursales.find((s) => s.id === activeSucursalId) ?? null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "icon" : "sm"}
          className={compact ? "h-9 w-9" : "gap-2 max-w-[200px]"}
          title={active ? `Sucursal: ${active.nombre}` : "Todas las sucursales"}
        >
          {active ? (
            <Building2 className="h-4 w-4 shrink-0" />
          ) : (
            <Globe className="h-4 w-4 shrink-0" />
          )}
          {!compact && (
            <>
              <span className="truncate text-xs">
                {active ? active.nombre : "Todas las sucursales"}
              </span>
              <ChevronsUpDown className="h-3 w-3 opacity-50" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 bg-popover">
        <DropdownMenuLabel>Filtrar por sucursal</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setActiveSucursalId(null)}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span>Todas las sucursales</span>
          </div>
          {activeSucursalId === null && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {sucursales.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onClick={() => setActiveSucursalId(s.id)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {s.nombre}
                {s.es_principal ? " (principal)" : ""}
              </span>
            </div>
            {activeSucursalId === s.id && <Check className="h-4 w-4 shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
