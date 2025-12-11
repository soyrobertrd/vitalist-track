import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone, Home, Building, Calendar, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  type: 'visita' | 'llamada';
  title: string;
  date: Date;
  time: string;
  status: string;
  profesional?: string;
  tipoVisita?: string;
}

interface DayAgendaDialogProps {
  date: Date | null;
  events: CalendarEvent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export function DayAgendaDialog({ date, events, open, onOpenChange, onEventClick }: DayAgendaDialogProps) {
  if (!date) return null;

  const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'realizada':
        return 'bg-success/20 text-success border-success/30';
      case 'cancelada':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'pendiente':
      case 'agendada':
        return 'bg-warning/20 text-warning border-warning/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  };

  const getEventIcon = (event: CalendarEvent) => {
    if (event.type === 'llamada') {
      return <Phone className="h-4 w-4 text-primary" />;
    }
    if (event.tipoVisita === 'domicilio') {
      return <Home className="h-4 w-4 text-warning" />;
    }
    return <Building className="h-4 w-4 text-secondary" />;
  };

  const getEventTypeLabel = (event: CalendarEvent) => {
    if (event.type === 'llamada') return 'Llamada';
    if (event.tipoVisita === 'domicilio') return 'Domicilio';
    return 'Ambulatorio';
  };

  const getEventBgColor = (event: CalendarEvent) => {
    if (event.type === 'llamada') return 'border-l-primary';
    if (event.tipoVisita === 'domicilio') return 'border-l-warning';
    return 'border-l-secondary';
  };

  // Group events by type
  const llamadas = sortedEvents.filter(e => e.type === 'llamada');
  const visitasDomicilio = sortedEvents.filter(e => e.type === 'visita' && e.tipoVisita === 'domicilio');
  const visitasAmbulatorio = sortedEvents.filter(e => e.type === 'visita' && e.tipoVisita === 'ambulatorio');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Agenda del {format(date, "EEEE d 'de' MMMM", { locale: es })}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          {sortedEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No hay citas programadas para este día</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Phone className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-xl font-bold text-primary">{llamadas.length}</p>
                  <p className="text-xs text-muted-foreground">Llamadas</p>
                </div>
                <div className="bg-warning/10 p-3 rounded-lg">
                  <Home className="h-5 w-5 mx-auto mb-1 text-warning" />
                  <p className="text-xl font-bold text-warning">{visitasDomicilio.length}</p>
                  <p className="text-xs text-muted-foreground">Domicilio</p>
                </div>
                <div className="bg-secondary/10 p-3 rounded-lg">
                  <Building className="h-5 w-5 mx-auto mb-1 text-secondary" />
                  <p className="text-xl font-bold text-secondary">{visitasAmbulatorio.length}</p>
                  <p className="text-xs text-muted-foreground">Ambulatorio</p>
                </div>
              </div>

              {/* Events List */}
              <div className="space-y-2">
                {sortedEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border border-l-4 hover:bg-accent/50 transition-colors",
                      getEventBgColor(event)
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getEventIcon(event)}
                        <div className="min-w-0">
                          <p className="font-medium truncate">{event.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {event.time}
                            <span className="text-xs">•</span>
                            <span className="text-xs">{getEventTypeLabel(event)}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={cn("shrink-0 text-xs", getStatusColor(event.status))}>
                        {formatStatus(event.status)}
                      </Badge>
                    </div>
                    {event.profesional && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {event.profesional}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
