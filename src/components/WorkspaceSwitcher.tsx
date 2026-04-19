import { Building2, Check, ChevronsUpDown, Crown, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface Props {
  collapsed?: boolean;
}

export function WorkspaceSwitcher({ collapsed = false }: Props) {
  const { workspaces, currentWorkspace, currentPlan, switchWorkspace } = useWorkspace();
  const navigate = useNavigate();

  if (!currentWorkspace) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`w-full ${collapsed ? "justify-center px-2" : "justify-start"} text-sidebar-foreground hover:bg-sidebar-accent h-auto py-2`}
        >
          <Building2 className={collapsed ? "h-5 w-5" : "h-4 w-4 shrink-0"} />
          {!collapsed && (
            <div className="flex-1 min-w-0 text-left ml-2">
              <p className="text-sm font-medium truncate">{currentWorkspace.nombre}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate capitalize">
                Plan {currentPlan?.nombre || currentWorkspace.plan_codigo}
              </p>
            </div>
          )}
          {!collapsed && <ChevronsUpDown className="h-4 w-4 opacity-50" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 bg-popover">
        <DropdownMenuLabel>Mis workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => switchWorkspace(ws.id)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-sm">{ws.nombre}</p>
                <p className="text-xs text-muted-foreground capitalize">{ws.role}</p>
              </div>
            </div>
            {ws.id === currentWorkspace.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/planes")}>
          <Crown className="mr-2 h-4 w-4" />
          Ver planes y precios
        </DropdownMenuItem>
        {(currentWorkspace.role === "owner" || currentWorkspace.role === "admin") && (
          <DropdownMenuItem onClick={() => navigate("/workspace/configuracion")}>
            <Settings className="mr-2 h-4 w-4" />
            Configurar workspace
          </DropdownMenuItem>
        )}
        <div className="px-2 py-1.5">
          <Badge variant="secondary" className="text-xs">
            Plan {currentPlan?.nombre || currentWorkspace.plan_codigo}
          </Badge>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
