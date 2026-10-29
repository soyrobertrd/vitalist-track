import { useState } from "react";
import { EdificioHospital, PisoHospital, CamaHospital, EstadoCama } from "./edificacion-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layers, ArrowLeftRight, Bed, User, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface MapaEsquematicoPisosTabProps {
  edificio: EdificioHospital;
  onIniciarTraslado: (cama: CamaHospital) => void;
}

export function MapaEsquematicoPisosTab({
  edificio,
  onIniciarTraslado,
}: MapaEsquematicoPisosTabProps) {
  const [pisoSeleccionadoId, setPisoSeleccionadoId] = useState<string>(edificio.pisos[0]?.id || "");

  const pisoActivo = edificio.pisos.find(p => p.id === pisoSeleccionadoId) || edificio.pisos[0];

  return (
    <div className="space-y-4">
      {/* Selector de Niveles / Pisos */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground mr-1">Nivel Arquitectónico:</span>
        {edificio.pisos.map(p => (
          <Button
            key={p.id}
            size="sm"
            variant={p.id === pisoActivo?.id ? "default" : "outline"}
            className="rounded-xl text-xs h-9 px-3 gap-1.5"
            onClick={() => setPisoSeleccionadoId(p.id)}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Piso {p.numero}</span>
          </Button>
        ))}
      </div>

      {/* Plano Esquemático del Piso */}
      {pisoActivo && (
        <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden bg-muted/10">
          <CardHeader className="bg-muted/20 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">{pisoActivo.nombre}</CardTitle>
                <p className="text-xs text-muted-foreground">Plano esquemático intrahospitalario por alas asistenciales</p>
              </div>
              <Badge variant="outline" className="text-xs rounded-full">
                {edificio.nombre}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {pisoActivo.alas.map(ala => (
              <div
                key={ala.id}
                className="p-5 rounded-2xl bg-card border-2 border-dashed border-border/80 space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div>
                    <span className="font-bold text-sm text-foreground block">{ala.nombre}</span>
                    <span className="text-xs text-muted-foreground">
                      Jefe: {ala.jefeServicio} • {ala.telefonoInterno}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs rounded-full self-start capitalize">
                    {ala.tipo} ({ala.camas.length} Camas)
                  </Badge>
                </div>

                {/* Distribución Espacial de Camas / Boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {ala.camas.map(c => {
                    const esOcupada = c.estado === "ocupada" || c.estado === "aislamiento";
                    return (
                      <div
                        key={c.id}
                        className={`p-3 rounded-xl border transition-all text-xs space-y-2 ${
                          c.estado === "libre"
                            ? "border-emerald-500/40 bg-emerald-500/[0.03]"
                            : c.estado === "aislamiento"
                            ? "border-amber-500/50 bg-amber-500/[0.04]"
                            : c.estado === "desinfeccion"
                            ? "border-purple-500/40 bg-purple-500/[0.03]"
                            : "border-blue-500/40 bg-blue-500/[0.03]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <strong className="font-mono text-xs">{c.codigo}</strong>
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              c.estado === "libre"
                                ? "bg-emerald-500"
                                : c.estado === "aislamiento"
                                ? "bg-amber-500"
                                : c.estado === "desinfeccion"
                                ? "bg-purple-500"
                                : "bg-blue-500"
                            }`}
                          />
                        </div>

                        {c.paciente ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-foreground truncate block">
                              {c.paciente.nombre}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate block">
                              {c.paciente.diagnostico}
                            </span>
                            {c.paciente.tipoAislamiento && (
                              <span className="text-[10px] text-amber-600 font-bold block">
                                ⚠ Aislamiento: {c.paciente.tipoAislamiento}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground italic">
                            {c.estado === "libre" ? "Cama disponible" : "En desinfección"}
                          </p>
                        )}

                        {esOcupada && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full h-7 rounded-lg text-[11px] gap-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                            onClick={() => onIniciarTraslado(c)}
                          >
                            <ArrowLeftRight className="h-3 w-3" /> Trasladar
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
