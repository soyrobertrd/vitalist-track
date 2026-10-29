import { useState } from "react";
import { ConsultaVeterinaria } from "./vet-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Stethoscope, Plus, Search, Thermometer, HeartPulse, Activity, Droplets, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ConsultaClinicaVetTabProps {
  consultas: ConsultaVeterinaria[];
  onNuevaConsulta: () => void;
}

export function ConsultaClinicaVetTab({ consultas, onNuevaConsulta }: ConsultaClinicaVetTabProps) {
  const [busqueda, setBusqueda] = useState("");
  const [expandidaId, setExpandidaId] = useState<string | null>(consultas[0]?.id || null);

  const filtradas = consultas.filter(c =>
    c.mascota_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.motivo.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.diagnostico.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-border/80 shadow-none">
        <CardHeader className="bg-muted/15 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">Consultas Clínicas Veterinarias</CardTitle>
              <p className="text-xs text-muted-foreground">
                Exploración física sistemática, constantes fisiológicas y tratamiento médico veterinario
              </p>
            </div>
            <Button size="sm" className="rounded-xl shadow-none gap-1.5" onClick={onNuevaConsulta}>
              <Plus className="h-4 w-4" /> Nueva Consulta
            </Button>
          </div>

          <div className="relative pt-2">
            <Search className="absolute left-3 top-4.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por mascota, motivo de consulta o diagnóstico..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl border-border/80"
            />
          </div>
        </CardHeader>
      </Card>

      {filtradas.length === 0 ? (
        <Card className="rounded-2xl border-border/80 p-8 text-center text-sm text-muted-foreground">
          No hay consultas veterinarias registradas con ese criterio.
        </Card>
      ) : (
        <div className="space-y-3">
          {filtradas.map(c => {
            const isExpanded = expandidaId === c.id;
            return (
              <Card key={c.id} className="rounded-2xl border-border/80 shadow-none overflow-hidden transition-all">
                <div
                  className="p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandidaId(isExpanded ? null : c.id)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-foreground">{c.mascota_nombre}</span>
                      <Badge variant="outline" className="text-[10px] rounded-full uppercase">
                        {c.especie}
                      </Badge>
                      <Badge className="text-[10px] rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        {c.estado.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Motivo: <strong className="text-foreground font-medium">{c.motivo}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs font-semibold text-foreground block">{c.veterinario}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {format(new Date(c.fecha), "dd MMM yyyy HH:mm", { locale: es })}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Constantes Fisiológicas Banner */}
                <div className="px-4 py-2 bg-muted/20 border-t border-b border-border/60 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
                  <div className="p-1.5 rounded-xl bg-card border border-border/50">
                    <span className="text-[10px] text-muted-foreground block">Peso</span>
                    <strong className="text-foreground font-mono">{c.peso_kg} kg</strong>
                  </div>
                  <div className="p-1.5 rounded-xl bg-card border border-border/50">
                    <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                      <Thermometer className="h-3 w-3 text-rose-500" /> T° Rectal
                    </span>
                    <strong className="text-foreground font-mono">{c.temperatura_c} °C</strong>
                  </div>
                  <div className="p-1.5 rounded-xl bg-card border border-border/50">
                    <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                      <HeartPulse className="h-3 w-3 text-red-500" /> FC
                    </span>
                    <strong className="text-foreground font-mono">{c.frecuencia_cardiaca_lpm} lpm</strong>
                  </div>
                  <div className="p-1.5 rounded-xl bg-card border border-border/50">
                    <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                      <Activity className="h-3 w-3 text-blue-500" /> FR
                    </span>
                    <strong className="text-foreground font-mono">{c.frecuencia_respiratoria_rpm} rpm</strong>
                  </div>
                  <div className="p-1.5 rounded-xl bg-card border border-border/50">
                    <span className="text-[10px] text-muted-foreground block">TLLC</span>
                    <strong className="text-foreground font-mono">{c.tllc_segundos}s (&lt;2s)</strong>
                  </div>
                  <div className="p-1.5 rounded-xl bg-card border border-border/50">
                    <span className="text-[10px] text-muted-foreground block">Mucosas</span>
                    <strong className="text-foreground capitalize">{c.mucosas}</strong>
                  </div>
                  <div className="p-1.5 rounded-xl bg-card border border-border/50">
                    <span className="text-[10px] text-muted-foreground block">Condición</span>
                    <strong className="text-foreground text-[11px]">{c.condicion_corporal.split("-")[0]}</strong>
                  </div>
                </div>

                {/* Contenido Extendido */}
                {isExpanded && (
                  <CardContent className="p-4 space-y-4 bg-card">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 p-3 rounded-xl bg-muted/20 border border-border/60">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                          Anamnesis & Hallazgos
                        </span>
                        <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                          {c.anamnesis}
                        </p>
                      </div>

                      <div className="space-y-1.5 p-3 rounded-xl bg-muted/20 border border-border/60">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                          Diagnóstico Definitivo
                        </span>
                        <p className="text-xs font-semibold text-foreground leading-relaxed">
                          {c.diagnostico}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Estado de hidratación: <strong>{c.hidratacion}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" /> Plan Terapéutico & Receta Médica
                      </span>
                      <p className="text-xs font-mono text-foreground leading-relaxed whitespace-pre-line">
                        {c.tratamiento_receta}
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
