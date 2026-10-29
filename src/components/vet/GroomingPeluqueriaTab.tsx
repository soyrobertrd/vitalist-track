import { useState } from "react";
import { GroomingServicio } from "./vet-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Sparkles, Scissors, Bath, CheckCircle2, Clock, Smile, Frown, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface GroomingPeluqueriaTabProps {
  servicios: GroomingServicio[];
  onNuevoServicio: () => void;
  onCambiarEstado?: (id: string, nuevoEstado: GroomingServicio["estado"]) => void;
}

const TEMPERAMENTO_BADGES = {
  docil: { label: "Dócil & Tranquilo", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  nervioso: { label: "Nervioso / Inquieto", color: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  miedoso: { label: "Miedoso (Trato suave)", color: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  reactivo: { label: "Reactivo (Precaución)", color: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30" },
};

export function GroomingPeluqueriaTab({
  servicios,
  onNuevoServicio,
  onCambiarEstado,
}: GroomingPeluqueriaTabProps) {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = servicios.filter(s =>
    s.mascota_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.estilista.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-border/80 shadow-none">
        <CardHeader className="bg-muted/15 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">Peluquería, Estética & Grooming</CardTitle>
              <p className="text-xs text-muted-foreground">
                Control de baños medicados/cosméticos, cortes de raza, deslanado y estado de entrega
              </p>
            </div>
            <Button size="sm" className="rounded-xl shadow-none gap-1.5" onClick={onNuevoServicio}>
              <Plus className="h-4 w-4" /> Agendar Grooming
            </Button>
          </div>

          <div className="relative pt-2">
            <Search className="absolute left-3 top-4.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por mascota o estilista..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl border-border/80"
            />
          </div>
        </CardHeader>
      </Card>

      {filtrados.length === 0 ? (
        <Card className="rounded-2xl border-border/80 p-8 text-center text-sm text-muted-foreground">
          No hay servicios de estética agendados actualmente.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map(s => {
            const temp = TEMPERAMENTO_BADGES[s.temperamento];
            return (
              <Card key={s.id} className="rounded-2xl border-border/80 shadow-none overflow-hidden flex flex-col justify-between">
                <div>
                  <CardHeader className="bg-muted/15 pb-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-sm text-foreground block">{s.mascota_nombre}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {s.tipo_servicio.replace("_", " ")}
                        </span>
                      </div>
                      <Badge className={`text-[10px] rounded-full border ${temp.color}`}>
                        {temp.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3 text-xs">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Estilista:</span>
                      <strong className="text-foreground">{s.estilista}</strong>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-muted-foreground block">
                        Servicios incluidos:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {s.servicios_adicionales.map((srv, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px] rounded-md font-normal bg-card">
                            {srv}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {s.observaciones && (
                      <p className="p-2 rounded-xl bg-muted/40 text-[11px] text-muted-foreground italic">
                        "{s.observaciones}"
                      </p>
                    )}
                  </CardContent>
                </div>

                <div className="p-3 bg-muted/20 border-t border-border/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{format(new Date(s.fecha_hora), "dd/MM HH:mm")}</span>
                  </div>

                  <Badge
                    className={`rounded-full text-[10px] font-semibold capitalize ${
                      s.estado === "listo_para_entrega"
                        ? "bg-emerald-500 text-white animate-bounce"
                        : s.estado === "en_corte"
                        ? "bg-purple-600 text-white"
                        : s.estado === "en_bano"
                        ? "bg-blue-600 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s.estado.replace(/_/g, " ")}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
