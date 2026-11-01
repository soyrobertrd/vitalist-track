import { useState, useId } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Baby, Heart, AlertTriangle, ShieldCheck } from "lucide-react";
import { ConsultaGinecoData } from "./FichaConsultaObstetricaDetalle";

interface CensoProps {
  consultas: ConsultaGinecoData[];
  consultaSeleccionadaId: string | null;
  onSelectConsulta: (c: ConsultaGinecoData) => void;
  tiposConsulta: { id: string; nombre: string }[];
}

export function CensoObstetricoList({
  consultas,
  consultaSeleccionadaId,
  onSelectConsulta,
  tiposConsulta,
}: CensoProps) {
  const searchId = useId();
  const [busqueda, setBusqueda] = useState("");
  const [filtroRapido, setFiltroRapido] = useState<"todas" | "riesgo" | "tercer_trimestre" | "ginecologia">("todas");

  const filtradas = consultas.filter((c) => {
    const matchBusqueda =
      c.paciente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.diagnostico.toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.ta && c.ta.includes(busqueda));

    if (!matchBusqueda) return false;

    const [sis, dia] = (c.ta || "120/80").split("/").map((v) => parseInt(v.trim()) || 0);
    const isRiesgo = sis >= 140 || dia >= 90 || c.tipo_consulta === "amenaza_preeclampsia";

    if (filtroRapido === "riesgo") return isRiesgo;
    if (filtroRapido === "tercer_trimestre") return (c.edad_gestacional_semanas ?? 0) >= 28;
    if (filtroRapido === "ginecologia") return c.tipo_consulta === "ginecologia_anual" || c.tipo_consulta === "menopausia_climaterio";
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
            placeholder="Buscar por paciente, TA o diagnóstico..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>

        {/* Chips de Filtro Rápido */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <Button
            size="sm"
            variant={filtroRapido === "todas" ? "default" : "outline"}
            onClick={() => setFiltroRapido("todas")}
            className="h-6 px-2.5 text-[11px] rounded-full shrink-0"
          >
            Todas ({consultas.length})
          </Button>
          <Button
            size="sm"
            variant={filtroRapido === "riesgo" ? "default" : "outline"}
            onClick={() => setFiltroRapido("riesgo")}
            className="h-6 px-2.5 text-[11px] rounded-full shrink-0 text-rose-600 dark:text-rose-400 border-rose-500/30"
          >
            Alto Riesgo / Preeclampsia
          </Button>
          <Button
            size="sm"
            variant={filtroRapido === "tercer_trimestre" ? "default" : "outline"}
            onClick={() => setFiltroRapido("tercer_trimestre")}
            className="h-6 px-2.5 text-[11px] rounded-full shrink-0"
          >
            3er Trimestre (≥28s)
          </Button>
          <Button
            size="sm"
            variant={filtroRapido === "ginecologia" ? "default" : "outline"}
            onClick={() => setFiltroRapido("ginecologia")}
            className="h-6 px-2.5 text-[11px] rounded-full shrink-0"
          >
            Ginecología
          </Button>
        </div>
      </div>

      {/* Lista de Pacientes */}
      <div className="space-y-2 overflow-y-auto max-h-[600px] pr-1">
        {filtradas.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
            No se encontraron pacientes gineco-obstétricas con este criterio.
          </div>
        ) : (
          filtradas.map((c) => {
            const isSelected = c.id === consultaSeleccionadaId;
            const [sis, dia] = (c.ta || "120/80").split("/").map((v) => parseInt(v.trim()) || 0);
            const isRiesgo = sis >= 140 || dia >= 90 || c.tipo_consulta === "amenaza_preeclampsia";
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
                    ? "border-rose-500 bg-rose-500/5 shadow-xs ring-1 ring-rose-500/20"
                    : "border-border/80 bg-card hover:bg-muted/30 hover:border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected
                          ? "bg-rose-500 text-white"
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
                        {c.edad_gestacional_semanas !== undefined ? (
                          <span className="font-mono text-rose-600 dark:text-rose-400 font-medium">
                            {c.edad_gestacional_semanas} sem
                          </span>
                        ) : (
                          <span>Ginecología</span>
                        )}
                        <span>·</span>
                        <span>TA: {c.ta}</span>
                        {c.fcf_lpm && (
                          <>
                            <span>·</span>
                            <span>{c.fcf_lpm} lpm</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Alerta de Riesgo Compacta */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {isRiesgo ? (
                      <Badge className="h-4 px-1.5 text-[9px] bg-rose-600 text-white">
                        HTA / Riesgo
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
                  {c.fpp && <span className="font-mono">FPP: {c.fpp}</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
