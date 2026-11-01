import { useState, useId } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Syringe, Wind, Baby, CheckCircle2, AlertCircle } from "lucide-react";
import { ConsultaPediatricaData } from "./FichaConsultaPediatricaDetalle";

interface CensoProps {
  consultas: ConsultaPediatricaData[];
  consultaSeleccionadaId: string | null;
  onSelectConsulta: (c: ConsultaPediatricaData) => void;
  tiposConsulta: { id: string; nombre: string }[];
}

export function CensoPediatricoList({
  consultas,
  consultaSeleccionadaId,
  onSelectConsulta,
  tiposConsulta,
}: CensoProps) {
  const searchId = useId();
  const [busqueda, setBusqueda] = useState("");
  const [filtroRapido, setFiltroRapido] = useState<"todos" | "vacunas" | "respiratorio" | "sano">("todos");

  const filtradas = consultas.filter((c) => {
    const matchBusqueda =
      c.paciente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.tutor_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.diagnostico.toLowerCase().includes(busqueda.toLowerCase());

    if (!matchBusqueda) return false;

    if (filtroRapido === "vacunas") return !c.vacunas_al_dia;
    if (filtroRapido === "respiratorio") return (c.score_wood_downes ?? 0) >= 4 || c.tipo_consulta === "respiratorio_asma";
    if (filtroRapido === "sano") return c.tipo_consulta === "nino_sano";
    return true;
  });

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Buscador y Filtros Rápidos */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            id={searchId}
            placeholder="Buscar por infante, tutor o diagnóstico..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>

        {/* Chips de Filtro Rápido de Un Toque */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <Button
            size="sm"
            variant={filtroRapido === "todos" ? "default" : "outline"}
            onClick={() => setFiltroRapido("todos")}
            className="h-6 px-2.5 text-[11px] rounded-full shrink-0"
          >
            Todos ({consultas.length})
          </Button>
          <Button
            size="sm"
            variant={filtroRapido === "sano" ? "default" : "outline"}
            onClick={() => setFiltroRapido("sano")}
            className="h-6 px-2.5 text-[11px] rounded-full shrink-0"
          >
            Niño Sano
          </Button>
          <Button
            size="sm"
            variant={filtroRapido === "respiratorio" ? "default" : "outline"}
            onClick={() => setFiltroRapido("respiratorio")}
            className="h-6 px-2.5 text-[11px] rounded-full shrink-0 text-rose-600 dark:text-rose-400 border-rose-500/30"
          >
            Respiratorios
          </Button>
          <Button
            size="sm"
            variant={filtroRapido === "vacunas" ? "default" : "outline"}
            onClick={() => setFiltroRapido("vacunas")}
            className="h-6 px-2.5 text-[11px] rounded-full shrink-0 text-amber-600 dark:text-amber-400 border-amber-500/30"
          >
            Vacunas Pendientes
          </Button>
        </div>
      </div>

      {/* Lista de Infantes */}
      <div className="space-y-2 overflow-y-auto max-h-[600px] pr-1">
        {filtradas.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
            No se encontraron pacientes pediátricos con este criterio.
          </div>
        ) : (
          filtradas.map((c) => {
            const isSelected = c.id === consultaSeleccionadaId;
            const tipoInfo = tiposConsulta.find((t) => t.id === c.tipo_consulta);

            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectConsulta(c)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectConsulta(c);
                  }
                }}
                className={`p-3 rounded-xl border transition-all text-left cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20"
                    : "border-border/80 bg-card hover:bg-muted/30 hover:border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.paciente_nombre.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-foreground truncate">
                        {c.paciente_nombre}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <span>{c.edad_meses} meses</span>
                        <span>·</span>
                        <span>{c.sexo === "M" ? "M" : "F"}</span>
                        <span>·</span>
                        <span className="truncate">{c.tutor_nombre}</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges de Estado Compactos */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {c.score_wood_downes !== undefined && c.score_wood_downes >= 4 ? (
                      <Badge className="h-4 px-1.5 text-[9px] bg-rose-600 text-white">
                        WD: {c.score_wood_downes}p
                      </Badge>
                    ) : !c.vacunas_al_dia ? (
                      <Badge variant="outline" className="h-4 px-1.5 text-[9px] border-amber-500/40 text-amber-600">
                        Vacunas P.
                      </Badge>
                    ) : (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {c.peso_kg} kg
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="truncate max-w-[200px] font-medium text-foreground/80">
                    {tipoInfo?.nombre?.split("/")[0] || c.tipo_consulta}
                  </span>
                  <span className="font-mono">{c.percentil_peso_edad}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
