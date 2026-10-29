import { useState } from "react";
import { HospitalizacionCirugia } from "./vet-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Bed, Activity, ShieldCheck, HeartPulse, Droplets, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface HospitalizacionCirugiaTabProps {
  casos: HospitalizacionCirugia[];
  onNuevoIngreso: () => void;
}

export function HospitalizacionCirugiaTab({ casos, onNuevoIngreso }: HospitalizacionCirugiaTabProps) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");

  const filtrados = casos.filter(c => {
    const coincideTexto =
      c.mascota_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.jaula_box && c.jaula_box.toLowerCase().includes(busqueda.toLowerCase()));

    const coincideTipo = filtroTipo === "todos" || c.tipo_procedimiento === filtroTipo;

    return coincideTexto && coincideTipo;
  });

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-border/80 shadow-none">
        <CardHeader className="bg-muted/15 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">Cirugías, Procedimientos & Hospitalización</CardTitle>
              <p className="text-xs text-muted-foreground">
                Monitoreo quirúrgico pre/intra/post-operatorio, jaulas activas y fluidoterapia
              </p>
            </div>
            <Button size="sm" className="rounded-xl shadow-none gap-1.5" onClick={onNuevoIngreso}>
              <Plus className="h-4 w-4" /> Ingresar Paciente
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente, procedimiento o box..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl border-border/80"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant={filtroTipo === "todos" ? "default" : "outline"}
                className="rounded-xl text-xs h-9 px-3"
                onClick={() => setFiltroTipo("todos")}
              >
                Todos
              </Button>
              <Button
                type="button"
                size="sm"
                variant={filtroTipo === "cirugia" ? "default" : "outline"}
                className="rounded-xl text-xs h-9 px-3 gap-1"
                onClick={() => setFiltroTipo("cirugia")}
              >
                <HeartPulse className="h-3.5 w-3.5 text-rose-500" />
                Quirófano
              </Button>
              <Button
                type="button"
                size="sm"
                variant={filtroTipo === "hospitalizacion" ? "default" : "outline"}
                className="rounded-xl text-xs h-9 px-3 gap-1"
                onClick={() => setFiltroTipo("hospitalizacion")}
              >
                <Bed className="h-3.5 w-3.5 text-blue-500" />
                Hospitalizados
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {filtrados.length === 0 ? (
        <Card className="rounded-2xl border-border/80 p-8 text-center text-sm text-muted-foreground">
          No hay ingresos quirúrgicos ni hospitalizaciones en este momento.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtrados.map(c => (
            <Card key={c.id} className="rounded-2xl border-border/80 shadow-none overflow-hidden">
              <CardHeader className="bg-muted/20 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-foreground">{c.mascota_nombre}</span>
                      <Badge variant="outline" className="text-[10px] rounded-full uppercase">
                        {c.tipo_procedimiento}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-semibold text-primary mt-1">
                      {c.titulo}
                    </CardTitle>
                  </div>
                  <Badge
                    className={`text-[10px] rounded-full capitalize font-medium ${
                      c.estado === "en_quirofano"
                        ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40 animate-pulse"
                        : c.estado === "pre-quirurgico"
                        ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
                    }`}
                  >
                    {c.estado.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>
                    <span className="block text-[11px]">Ubicación / Box:</span>
                    <strong className="text-foreground">{c.jaula_box || "Sin box asignado"}</strong>
                  </div>
                  <div>
                    <span className="block text-[11px]">Veterinario a cargo:</span>
                    <strong className="text-foreground">{c.cirujano_veterinario}</strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                  {c.clasificacion_asa && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Riesgo Anestésico:</span>
                      <span className="font-bold text-foreground">{c.clasificacion_asa}</span>
                    </div>
                  )}
                  {c.tipo_anestesia && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Protocolo Anestesia:</span>
                      <span className="text-foreground">{c.tipo_anestesia}</span>
                    </div>
                  )}
                  {c.fluidoterapia && (
                    <div className="flex justify-between items-center text-blue-600 dark:text-blue-400">
                      <span className="flex items-center gap-1 font-medium">
                        <Droplets className="h-3 w-3" /> Fluidoterapia:
                      </span>
                      <span className="font-mono font-bold">{c.fluidoterapia}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">Evolución & Cuidados:</span>
                  <p className="text-foreground leading-relaxed bg-card p-2 rounded-lg border border-border/50">
                    {c.notas_evolucion}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                  <span>Ingreso: {format(new Date(c.fecha_ingreso), "dd/MM HH:mm")}</span>
                  {c.fecha_alta_estimada && (
                    <span className="text-emerald-600 font-medium">
                      Alta estimada: {format(new Date(c.fecha_alta_estimada), "dd/MM HH:mm")}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
