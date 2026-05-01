import { Building2, Eye, SmilePlus, Sparkles, BedDouble, Stethoscope, Layers, Settings2 } from "lucide-react";
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
  clinica:   { label: "Clínica / Hospital", icon: Stethoscope, color: "text-blue-600" },
  dental:    { label: "Odontología",        icon: SmilePlus,   color: "text-cyan-600" },
  aesthetic: { label: "Estética",           icon: Sparkles,    color: "text-pink-600" },
  recovery:  { label: "Recovery Care",      icon: BedDouble,   color: "text-purple-600" },
  vision:    { label: "Visión / Óptica",    icon: Eye,         color: "text-emerald-600" },
};

interface Props { collapsed?: boolean; }

export function VerticalSwitcher({ collapsed = false }: Props) {
  const { verticalesActivas, verticalActiva, setVerticalActiva } = useVertical();
  const { isAdmin } = useUserRole();

  if (verticalesActivas.length <= 1 && !isAdmin) return null;

  const actual = verticalActiva === "todas"
    ? { label: "Todas las verticales", icon: Layers, color: "text-primary" }
    : META[verticalActiva];

  const Icon = actual.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={collapsed ? "w-9 h-9 p-0" : "gap-2"}>
          <Icon className={`h-4 w-4 ${actual.color}`} />
          {!collapsed && <span className="hidden md:inline">{actual.label}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover">
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
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="text-xs text-muted-foreground">
          {isAdmin
            ? "Como admin, puedes ver todas o filtrar por una."
            : "Tu acceso se limita a tu vertical asignada."}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
