import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Home, Building, Calendar, Clock, User, MapPin } from "lucide-react";
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

interface CalendarEventDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewDetails?: (event: CalendarEvent) => void;
}

export function CalendarEventDialog({ event, open, onOpenChange, onViewDetails }: CalendarEventDialogProps) {
  if (!event) return null;

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

  const getEventIcon = () => {
    if (event.type === 'llamada') {
      return <Phone className="h-5 w-5 text-primary" />;
    }
    if (event.tipoVisita === 'domicilio') {
      return <Home className="h-5 w-5 text-warning" />;
    }
    return <Building className="h-5 w-5 text-secondary" />;
  };

  const getEventTypeLabel = () => {
    if (event.type === 'llamada') return 'Llamada';
    if (event.tipoVisita === 'domicilio') return 'Visita Domiciliaria';
    return 'Visita Ambulatoria';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getEventIcon()}
            {getEventTypeLabel()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Paciente */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Paciente</p>
            <p className="text-lg font-semibold">{event.title}</p>
          </div>

          {/* Estado */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Estado:</span>
            <Badge className={cn("capitalize", getStatusColor(event.status))}>
              {formatStatus(event.status)}
            </Badge>
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary/5 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Calendar className="h-4 w-4" />
                Fecha
              </div>
              <p className="font-medium">
                {format(event.date, "EEEE, d 'de' MMMM", { locale: es })}
              </p>
            </div>
            <div className="bg-primary/5 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Clock className="h-4 w-4" />
                Hora
              </div>
              <p className="font-medium">{event.time}</p>
            </div>
          </div>

          {/* Profesional */}
          {event.profesional && (
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Profesional asignado</p>
                <p className="font-medium">{event.profesional}</p>
              </div>
            </div>
          )}

          {/* Tipo de visita */}
          {event.type === 'visita' && (
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              {event.tipoVisita === 'domicilio' ? (
                <Home className="h-4 w-4 text-warning" />
              ) : (
                <Building className="h-4 w-4 text-secondary" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">Tipo de visita</p>
                <p className="font-medium capitalize">{event.tipoVisita}</p>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
            {onViewDetails && (
              <Button
                className="flex-1"
                onClick={() => {
                  onViewDetails(event);
                  onOpenChange(false);
                }}
              >
                Ver Detalles Completos
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
