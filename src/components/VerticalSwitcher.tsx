import { Building2, Eye, SmilePlus, Sparkles, BedDouble, Stethoscope, Layers, Settings2, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useVertical, VerticalTipo } from "@/contexts/VerticalContext";
import { useUserRole } from "@/hooks/useUserRole";

const META: Record<VerticalTipo, { label: string; icon: any; color: string }> = {
  clinica:    { label: "Clínica / Hospital", icon: Stethoscope, color: "text-blue-600" },
  dental:     { label: "Odontología",        icon: SmilePlus,   color: "text-cyan-600" },
  aesthetic:  { label: "Estética",           icon: Sparkles,    color: "text-pink-600" },
  recovery:   { label: "Recovery Care",      icon: BedDouble,   color: "text-purple-600" },
  vision:     { label: "Visión / Óptica",    icon: Eye,         color: "text-emerald-600" },
  psicologia: { label: "Psicología / Psiquiatría", icon: Brain, color: "text-indigo-600" },
};

interface Props { collapsed?: boolean; }

export function VerticalSwitcher({ collapsed = false }: Props) {
  const { verticalesActivas, verticalActiva, setVerticalActiva } = useVertical();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();

  if (verticalesActivas.length <= 1 && !isAdmin) return null;

  const actual = verticalActiva === "todas"
    ? { label: "Todas las verticales", icon: Layers, color: "text-primary" }
    : META[verticalActiva];

  const Icon = actual.icon;

  // Verticales no activadas (sólo admin)
  const todas: VerticalTipo[] = ["clinica", "dental", "aesthetic", "recovery", "vision", "psicologia"];
  const inactivas = todas.filter((v) => !verticalesActivas.includes(v));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={collapsed ? "w-9 h-9 p-0" : "gap-2 w-full justify-start"}>
          <Icon className={`h-4 w-4 ${actual.color}`} />
          {!collapsed && <span className="truncate">{actual.label}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-popover">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Vertical activa</span>
          <Badge variant="secondary" className="text-[10px]">{verticalesActivas.length} activas</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin && (
          <DropdownMenuItem onClick={() => setVerticalActiva("todas")}>
            <Layers className="mr-2 h-4 w-4 text-primary" />
            Todas las verticales
          </DropdownMenuItem>
        )}
        {verticalesActivas.map((v) => {
          const m = META[v]; const I = m.icon;
          return (
            <DropdownMenuItem key={v} onClick={() => setVerticalActiva(v)}>
              <I className={`mr-2 h-4 w-4 ${m.color}`} /> {m.label}
              {verticalActiva === v && <Badge variant="outline" className="ml-auto text-[10px]">activa</Badge>}
            </DropdownMenuItem>
          );
        })}
        {isAdmin && inactivas.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">No habilitadas</DropdownMenuLabel>
            {inactivas.map((v) => {
              const m = META[v]; const I = m.icon;
              return (
                <DropdownMenuItem key={v} onClick={() => navigate("/verticales")} className="opacity-60">
                  <I className={`mr-2 h-4 w-4 ${m.color}`} />
                  <span className="flex-1">{m.label}</span>
                  <span className="text-[10px] text-muted-foreground">activar →</span>
                </DropdownMenuItem>
              );
            })}
          </>
        )}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/verticales")}>
              <Settings2 className="mr-2 h-4 w-4" />
              Gestionar verticales del centro
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
