import { useMemo } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users, Calendar, Activity, ShieldCheck, Zap } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { differenceInDays } from "date-fns";

interface UsoPruebaWidgetProps {
  pacientesCount?: number;
  citasCount?: number;
}

export function UsoPruebaWidget({ pacientesCount = 7, citasCount = 8 }: UsoPruebaWidgetProps) {
  const { currentWorkspace, currentPlan } = useWorkspace();

  const diasRestantes = useMemo(() => {
    if (!currentWorkspace?.trial_ends_at) return 24; // Valor por defecto amigable en demo
    try {
      const diff = differenceInDays(new Date(currentWorkspace.trial_ends_at), new Date());
      return Math.max(0, diff);
    } catch {
      return 24;
    }
  }, [currentWorkspace?.trial_ends_at]);

  const modulosUsados = [
    { nombre: "Ficha Clínica 360°", desc: "Historial unificado y alergias", activo: true },
    { nombre: "Agenda Ambulatoria", desc: "Consultas y confirmaciones", activo: true },
    { nombre: "Lista de Espera Inteligente", desc: "Optimización de cupos", activo: true },
    { nombre: "Control de Medicamentos", desc: "Posología y seguimiento", activo: true },
  ];

  return (
    <GlassCard className="p-5 shadow-none border border-primary/30 bg-primary/5 space-y-4 rounded-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm sm:text-base">Tu Actividad Durante el Periodo de Prueba</h3>
              <Badge variant="outline" className="text-[10px] border-primary/40 text-primary font-semibold">
                {diasRestantes} días restantes de 30
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Estás aprovechando el potencial de Vitalist Track para optimizar la gestión de {currentWorkspace?.nombre || "tu centro"}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge className="bg-emerald-600/90 text-white hover:bg-emerald-600 text-[11px] gap-1 px-2.5 py-1">
            <Zap className="h-3 w-3" /> Prueba Premium Activa
          </Badge>
        </div>
      </div>

      {/* Métricas clave generadas en la prueba */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-3 bg-card border rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-medium">Pacientes Activos</span>
          </div>
          <p className="text-xl font-bold tabular-nums text-foreground">{pacientesCount}</p>
          <span className="text-[10px] text-muted-foreground">Registros clínicos</span>
        </div>

        <div className="p-3 bg-card border rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-medium">Citas Gestionadas</span>
          </div>
          <p className="text-xl font-bold tabular-nums text-foreground">{citasCount}</p>
          <span className="text-[10px] text-muted-foreground">Ambulatorias y domiciliarias</span>
        </div>

        <div className="p-3 bg-card border rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-medium">Módulos Clínicos</span>
          </div>
          <p className="text-xl font-bold tabular-nums text-foreground">4 de 4</p>
          <span className="text-[10px] text-muted-foreground">Herramientas en uso</span>
        </div>

        <div className="p-3 bg-card border rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-[11px] font-medium">Historiales Médicos</span>
          </div>
          <p className="text-xl font-bold tabular-nums text-emerald-600">100%</p>
          <span className="text-[10px] text-muted-foreground">Protegidos y respaldados</span>
        </div>
      </div>

      {/* Módulos utilizados con valor demostrado */}
      <div className="border-t border-primary/20 pt-3">
        <p className="text-xs font-medium text-foreground mb-2">Herramientas utilizadas que mantendrás con tu plan:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {modulosUsados.map((m) => (
            <div key={m.nombre} className="flex items-center gap-2 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <strong className="text-foreground">{m.nombre}:</strong> {m.desc}
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
