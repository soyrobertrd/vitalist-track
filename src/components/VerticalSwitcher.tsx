import { Eye, SmilePlus, Sparkles, BedDouble, Stethoscope, Layers, Settings2, Brain, PawPrint, Dumbbell, Apple, HeartHandshake, Baby } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useVertical, VerticalTipo } from "@/contexts/VerticalContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { db } from "@/integrations/db/client";
import { toast } from "sonner";

const META: Record<VerticalTipo, { label: string; icon: any; color: string; grupo: "humana" | "independiente" }> = {
  clinica:      { label: "Hospital / Policlínica",     icon: Stethoscope, color: "text-blue-600",   grupo: "humana" },
  dental:       { label: "Odontología Pro",            icon: SmilePlus,   color: "text-cyan-600",   grupo: "humana" },
  aesthetic:    { label: "Aesthetic Pro & Spa",        icon: Sparkles,    color: "text-pink-600",   grupo: "humana" },
  vision:       { label: "VisionCare / Óptica",        icon: Eye,         color: "text-indigo-600", grupo: "humana" },
  psicologia:   { label: "Psicología & Salud Mental",  icon: Brain,       color: "text-purple-600", grupo: "humana" },
  fisioterapia: { label: "Fisioterapia & Kinesiología",icon: Dumbbell,    color: "text-teal-600",   grupo: "humana" },
  nutricion:    { label: "Nutrición & Dietética",      icon: Apple,       color: "text-emerald-600",grupo: "humana" },
  ginecologia:  { label: "Ginecología & Obstetricia",  icon: HeartHandshake, color: "text-rose-600",grupo: "humana" },
  pediatria:    { label: "Pediatría & Puericultura",   icon: Baby,        color: "text-sky-600",    grupo: "humana" },
  recovery:     { label: "Recovery Home (Postquirúrgico)", icon: BedDouble, color: "text-purple-600", grupo: "independiente" },
  veterinaria:  { label: "Clínica Veterinaria (Mascotas)", icon: PawPrint,  color: "text-amber-600",  grupo: "independiente" },
};

interface Props { collapsed?: boolean; }

export function VerticalSwitcher({ collapsed = false }: Props) {
  const { verticalesActivas, verticalActiva, setVerticalActiva, refresh } = useVertical();
  const { currentWorkspace } = useWorkspace();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();

  if (verticalesActivas.length <= 1 && !isAdmin) return null;

  const actual = verticalActiva === "todas"
    ? { label: "Todas las Especialidades", icon: Layers, color: "text-primary" }
    : (META[verticalActiva] || { label: verticalActiva, icon: Layers, color: "text-primary" });

  const Icon = actual.icon;

  const activar = async (v: VerticalTipo) => {
    if (!currentWorkspace) return;
    const { error } = await (db.from("workspace_verticales") as any).upsert(
      { workspace_id: currentWorkspace.id, vertical: v, activa: true },
      { onConflict: "workspace_id,vertical" }
    );
    if (error) {
      toast.error(
        error.message.includes("invalid input value for enum")
          ? `${META[v]?.label || v} pendiente de sincronización en BD.`
          : `No se pudo habilitar: ${error.message}`
      );
      return;
    }
    await refresh();
    setVerticalActiva(v);
    toast.success(`${META[v]?.label || v} habilitada`);
  };

  const todas: VerticalTipo[] = [
    "clinica", "dental", "aesthetic", "vision", "psicologia",
    "fisioterapia", "nutricion", "ginecologia", "pediatria",
    "recovery", "veterinaria"
  ];
  const inactivas = todas.filter((v) => !verticalesActivas.includes(v));

  // Agrupación de activas
  const activasHumanas = verticalesActivas.filter((v) => META[v]?.grupo === "humana");
  const activasIndependientes = verticalesActivas.filter((v) => META[v]?.grupo === "independiente");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={collapsed ? "w-9 h-9 p-0" : "gap-2 w-full justify-start"}>
          <Icon className={`h-4 w-4 ${actual.color}`} />
          {!collapsed && <span className="truncate">{actual.label}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 bg-popover rounded-2xl p-2">
        <DropdownMenuLabel className="flex items-center justify-between text-xs">
          <span>Módulo / Especialidad Activa</span>
          <Badge variant="secondary" className="text-[10px]">{verticalesActivas.length} activas</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isAdmin && (
          <DropdownMenuItem onClick={() => setVerticalActiva("todas")} className="rounded-xl text-xs py-2">
            <Layers className="mr-2 h-4 w-4 text-primary" />
            Todas las Especialidades (Policlínica)
          </DropdownMenuItem>
        )}

        {/* 1. Especialidades Clínicas Humanas */}
        {activasHumanas.length > 0 && (
          <>
            <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-2 pb-1">
              Salud Humana & Policlínica
            </DropdownMenuLabel>
            {activasHumanas.map((v) => {
              const m = META[v];
              if (!m) return null;
              const I = m.icon;
              return (
                <DropdownMenuItem key={v} onClick={() => setVerticalActiva(v)} className="rounded-xl text-xs py-1.5">
                  <I className={`mr-2 h-4 w-4 ${m.color}`} /> {m.label}
                  {verticalActiva === v && <Badge variant="outline" className="ml-auto text-[10px]">activa</Badge>}
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        {/* 2. Módulos Separados Independientes (Veterinaria & Recovery Home) */}
        {activasIndependientes.length > 0 && (
          <>
            <DropdownMenuSeparator className="my-1.5" />
            <DropdownMenuLabel className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider px-2 pt-1 pb-1">
              Entidades Separadas
            </DropdownMenuLabel>
            {activasIndependientes.map((v) => {
              const m = META[v];
              if (!m) return null;
              const I = m.icon;
              return (
                <DropdownMenuItem key={v} onClick={() => setVerticalActiva(v)} className="rounded-xl text-xs py-1.5">
                  <I className={`mr-2 h-4 w-4 ${m.color}`} /> {m.label}
                  {verticalActiva === v && <Badge variant="outline" className="ml-auto text-[10px]">activa</Badge>}
                </DropdownMenuItem>
              );
            })}
          </>
        )}
        {isAdmin && inactivas.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">No habilitadas</DropdownMenuLabel>
            {inactivas.map((v) => {
              const m = META[v]; const I = m.icon;
              return (
                <DropdownMenuItem key={v} onClick={() => activar(v)} className="opacity-70">
                  <I className={`mr-2 h-4 w-4 ${m.color}`} />
                  <span className="flex-1">{m.label}</span>
                  <span className="text-[10px] text-primary">Habilitar</span>
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
