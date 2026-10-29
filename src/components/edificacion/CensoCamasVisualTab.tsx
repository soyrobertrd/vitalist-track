import { useState } from "react";
import { CamaHospital, EstadoCama } from "./edificacion-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bed, ArrowLeftRight, Sparkles, User, Wrench, ShieldAlert, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface CensoCamasVisualTabProps {
  camas: CamaHospital[];
  onIniciarTraslado: (cama: CamaHospital) => void;
  onCambiarEstadoCama: (camaId: string, nuevoEstado: EstadoCama) => void;
}

const ESTADOS_CONFIG: Record<EstadoCama, { label: string; colorBadge: string; borderCard: string; icon: any }> = {
  libre: { label: "Libre / Lista", colorBadge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30", borderCard: "border-emerald-500/30 hover:border-emerald-500", icon: CheckCircle2 },
  ocupada: { label: "Ocupada", colorBadge: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30", borderCard: "border-blue-500/30 hover:border-blue-500", icon: User },
  aislamiento: { label: "Aislamiento", colorBadge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold", borderCard: "border-amber-500/50 bg-amber-500/[0.02]", icon: ShieldAlert },
  desinfeccion: { label: "En Desinfección", colorBadge: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30", borderCard: "border-purple-500/30", icon: Sparkles },
  mantenimiento: { label: "Mantenimiento", colorBadge: "bg-muted text-muted-foreground border-border/60", borderCard: "border-border/60 opacity-70", icon: Wrench },
};

export function CensoCamasVisualTab({
  camas,
  onIniciarTraslado,
  onCambiarEstadoCama,
}: CensoCamasVisualTabProps) {
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");

  const filtradas = camas.filter(c => filtroEstado === "todos" || c.estado === filtroEstado);

  // Estadísticas rápidas
  const total = camas.length;
  const libres = camas.filter(c => c.estado === "libre").length;
  const ocupadas = camas.filter(c => c.estado === "ocupada" || c.estado === "aislamiento").length;
  const porcentajeOcupacion = total > 0 ? Math.round((ocupadas / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Barra de Filtros de Estados */}
      <Card className="rounded-2xl border-border/80 shadow-none">
        <CardContent className="p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Filtro Estado:</span>
            <Button
              size="sm"
              variant={filtroEstado === "todos" ? "default" : "outline"}
              className="rounded-xl text-xs h-8 px-3"
              onClick={() => setFiltroEstado("todos")}
            >
              Todas ({total})
            </Button>
            {(Object.keys(ESTADOS_CONFIG) as EstadoCama[]).map(est => {
              const cfg = ESTADOS_CONFIG[est];
              const cant = camas.filter(c => c.estado === est).length;
              return (
                <Button
                  key={est}
                  size="sm"
                  variant={filtroEstado === est ? "default" : "outline"}
                  className="rounded-xl text-xs h-8 px-2.5 gap-1"
                  onClick={() => setFiltroEstado(est)}
                >
                  <span className="capitalize">{cfg.label}</span>
                  <span className="font-mono text-[10px] opacity-80">({cant})</span>
                </Button>
              );
            })}
          </div>

          <div className="text-xs text-muted-foreground font-medium">
            Ocupación General: <strong className="text-foreground">{porcentajeOcupacion}%</strong>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Camas Interactivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtradas.map(c => {
          const cfg = ESTADOS_CONFIG[c.estado];
          const Icon = cfg.icon;

          return (
            <Card
              key={c.id}
              className={`rounded-2xl border shadow-none transition-all flex flex-col justify-between overflow-hidden ${cfg.borderCard}`}
            >
              <div>
                <CardHeader className="bg-muted/15 pb-2.5 pt-3.5 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-sm text-foreground block">{c.codigo}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">
                        {c.tipoCama.replace("_", " ")}
                      </span>
                    </div>
                    <Badge className={`text-[10px] rounded-full border ${cfg.colorBadge}`}>
                      <Icon className="h-3 w-3 mr-1" />
                      {cfg.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-2 text-xs">
                  {c.paciente ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-primary shrink-0" />
                        <strong className="text-foreground font-semibold truncate">
                          {c.paciente.nombre}
                        </strong>
                        <span className="text-muted-foreground text-[11px]">({c.paciente.edad})</span>
                      </div>

                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {c.paciente.diagnostico}
                      </p>

                      {c.paciente.tipoAislamiento && (
                        <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-[10px] uppercase flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3 shrink-0" />
                          Aislamiento por {c.paciente.tipoAislamiento}
                        </div>
                      )}

                      <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                        Médico: <strong className="text-foreground">{c.paciente.medicoTratante}</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-muted-foreground space-y-1">
                      <Bed className="h-8 w-8 mx-auto opacity-30" />
                      <p className="text-[11px]">
                        {c.estado === "libre"
                          ? "Cama higienizada y lista para asignación"
                          : c.estado === "desinfeccion"
                          ? "Personal de limpieza realizando desinfección terminal"
                          : "Bloqueada por mantenimiento técnico"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </div>

              {/* Botones de Acción Rápida de la Cama */}
              <div className="p-3 bg-muted/20 border-t border-border/60 flex items-center justify-between gap-2 text-xs">
                {c.paciente ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full rounded-xl text-xs h-7.5 gap-1.5 border-border/80"
                    onClick={() => onIniciarTraslado(c)}
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5 text-purple-600" /> Trasladar Cama
                  </Button>
                ) : c.estado === "desinfeccion" ? (
                  <Button
                    size="sm"
                    className="w-full rounded-xl text-xs h-7.5 gap-1.5 shadow-none bg-emerald-600 text-white"
                    onClick={() => {
                      onCambiarEstadoCama(c.id, "libre");
                      toast.success(`Cama ${c.codigo} liberada y lista para uso.`);
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Marcar como Lista / Libre
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full rounded-xl text-xs h-7.5 gap-1.5"
                    onClick={() => {
                      onCambiarEstadoCama(c.id, "desinfeccion");
                      toast.info(`Cama ${c.codigo} enviada a desinfección terminal.`);
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-purple-600" /> Enviar a Limpieza
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
