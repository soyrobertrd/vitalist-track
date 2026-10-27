import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, ChevronLeft, ChevronRight, Clock, Phone, 
  MapPin, Plus, User, CheckCircle2, AlertCircle
} from "lucide-react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

interface AgendaMobileListaProps {
  visitas: any[];
  onSelectVisita: (visita: any) => void;
  onOpenNuevaCita: () => void;
  className?: string;
}

export function AgendaMobileLista({
  visitas,
  onSelectVisita,
  onOpenNuevaCita,
  className = "",
}: AgendaMobileListaProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handlePrevDay = () => setSelectedDate((d) => subDays(d, 1));
  const handleNextDay = () => setSelectedDate((d) => addDays(d, 1));
  const handleToday = () => setSelectedDate(new Date());

  const isToday = isSameDay(selectedDate, new Date());

  // Filtrar citas del día seleccionado ordenadas por hora
  const citasDelDia = useMemo(() => {
    return visitas
      .filter((v) => {
        if (!v.fecha_hora_visita) return false;
        const vDate = new Date(v.fecha_hora_visita);
        return isSameDay(vDate, selectedDate);
      })
      .sort((a, b) => new Date(a.fecha_hora_visita).getTime() - new Date(b.fecha_hora_visita).getTime());
  }, [visitas, selectedDate]);

  const estadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case "realizada":
      case "atendida":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
      case "cancelada":
      case "no_realizada":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Navegador de Fecha Móvil */}
      <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between gap-2 shadow-none">
        <Button variant="ghost" size="icon" onClick={handlePrevDay} className="h-9 w-9 shrink-0">
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="text-center min-w-0 flex-1">
          <div className="flex items-center justify-center gap-1.5">
            <span className="font-bold text-sm text-foreground capitalize truncate">
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </span>
            {isToday && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                Hoy
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {citasDelDia.length} {citasDelDia.length === 1 ? "cita agendada" : "citas agendadas"}
          </p>
        </div>

        <Button variant="ghost" size="icon" onClick={handleNextDay} className="h-9 w-9 shrink-0">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {!isToday && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={handleToday} className="h-7 text-xs px-2.5">
            <Calendar className="h-3.5 w-3.5 mr-1" /> Ir al día de hoy
          </Button>
        </div>
      )}

      {/* Lista Diaria Compacta */}
      <div className="space-y-2.5">
        {citasDelDia.map((visita) => {
          const vDate = new Date(visita.fecha_hora_visita);
          const horaStr = format(vDate, "hh:mm a");
          const esAmbulatorio = visita.tipo_visita === "ambulatorio" || !visita.tipo_visita;
          const telefono = visita.pacientes?.contacto_px || visita.pacientes?.contacto_cuidador;

          return (
            <div
              key={visita.id}
              onClick={() => onSelectVisita(visita)}
              className="p-3.5 bg-card border border-border rounded-xl flex items-start gap-3 active:scale-[0.99] transition-transform cursor-pointer"
            >
              {/* Bloque de hora */}
              <div className="w-16 shrink-0 text-center py-1 px-1.5 bg-muted/50 rounded-lg border border-border/50">
                <Clock className="h-3 w-3 mx-auto text-muted-foreground mb-0.5" />
                <span className="text-xs font-bold text-foreground tabular-nums">{horaStr}</span>
              </div>

              {/* Información de la cita */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-semibold text-sm text-foreground truncate">
                    {visita.pacientes?.nombre} {visita.pacientes?.apellido}
                  </h4>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${estadoBadgeVariant(visita.estado)}`}>
                    {visita.estado || "pendiente"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-medium">
                    <span className={`h-2 w-2 rounded-full ${esAmbulatorio ? "bg-primary" : "bg-purple-500"}`} />
                    {esAmbulatorio ? "Ambulatorio" : "Domiciliario"}
                  </span>

                  {visita.personal_salud && (
                    <span className="truncate">
                      · Dr(a). {visita.personal_salud.nombre}
                    </span>
                  )}
                </div>

                {visita.motivo_visita && (
                  <p className="text-xs text-muted-foreground line-clamp-1 italic">
                    {visita.motivo_visita}
                  </p>
                )}
              </div>

              {/* Botón de llamada rápida */}
              {telefono && (
                <a
                  href={`tel:${telefono.replace(/\D/g, "")}`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 shrink-0 self-center"
                  title="Llamar"
                  aria-label="Llamar al paciente"
                >
                  <Phone className="h-4 w-4" />
                </a>
              )}
            </div>
          );
        })}

        {citasDelDia.length === 0 && (
          <div className="text-center py-10 px-4 border border-dashed rounded-xl bg-card/50 space-y-2">
            <Calendar className="h-8 w-8 mx-auto text-muted-foreground/60" />
            <p className="text-sm font-medium text-foreground">No hay citas para este día</p>
            <p className="text-xs text-muted-foreground">Usa el botón inferior para agendar una cita rápidamente.</p>
          </div>
        )}
      </div>

      {/* Botón Flotante (FAB) de Cita Rápida para Móviles */}
      <button
        type="button"
        onClick={onOpenNuevaCita}
        aria-label="Nueva Cita Rápida"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
