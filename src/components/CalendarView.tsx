import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Phone, Home, Building } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, startOfWeek, endOfWeek, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  type: 'visita' | 'llamada';
  title: string;
  date: Date;
  status: string;
  profesional?: string;
  tipoVisita?: string;
}

interface CalendarViewProps {
  onEventClick?: (event: CalendarEvent) => void;
}

export function CalendarView({ onEventClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week'>('month');

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    setLoading(true);
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);

    try {
      // Fetch visitas
      const { data: visitas } = await supabase
        .from("control_visitas")
        .select(`
          id,
          fecha_hora_visita,
          tipo_visita,
          estado,
          pacientes!control_visitas_paciente_id_fkey(nombre, apellido),
          personal_salud!control_visitas_profesional_id_fkey(nombre, apellido)
        `)
        .gte("fecha_hora_visita", startDate.toISOString())
        .lte("fecha_hora_visita", endDate.toISOString());

      // Fetch llamadas
      const { data: llamadas } = await supabase
        .from("registro_llamadas")
        .select(`
          id,
          fecha_agendada,
          estado,
          pacientes!fk_registro_llamadas_paciente(nombre, apellido),
          personal_salud!fk_registro_llamadas_profesional(nombre, apellido)
        `)
        .gte("fecha_agendada", startDate.toISOString())
        .lte("fecha_agendada", endDate.toISOString());

      const calendarEvents: CalendarEvent[] = [];

      if (visitas) {
        visitas.forEach((v: any) => {
          calendarEvents.push({
            id: v.id,
            type: 'visita',
            title: `${v.pacientes?.nombre} ${v.pacientes?.apellido}`,
            date: new Date(v.fecha_hora_visita),
            status: v.estado,
            profesional: v.personal_salud ? `${v.personal_salud.nombre} ${v.personal_salud.apellido}` : undefined,
            tipoVisita: v.tipo_visita,
          });
        });
      }

      if (llamadas) {
        llamadas.forEach((l: any) => {
          if (l.fecha_agendada) {
            calendarEvents.push({
              id: l.id,
              type: 'llamada',
              title: `${l.pacientes?.nombre} ${l.pacientes?.apellido}`,
              date: new Date(l.fecha_agendada),
              status: l.estado,
              profesional: l.personal_salud ? `${l.personal_salud.nombre} ${l.personal_salud.apellido}` : undefined,
            });
          }
        });
      }

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(event.date, day));
  };

  const getEventColor = (event: CalendarEvent) => {
    if (event.type === 'llamada') {
      return event.status === 'realizada' ? 'bg-success/20 text-success border-success/30' : 
             event.status === 'agendada' ? 'bg-primary/20 text-primary border-primary/30' :
             'bg-muted text-muted-foreground border-muted';
    }
    return event.status === 'realizada' ? 'bg-secondary/20 text-secondary border-secondary/30' :
           event.status === 'pendiente' ? 'bg-warning/20 text-warning border-warning/30' :
           'bg-destructive/20 text-destructive border-destructive/30';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendario
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant={view === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('month')}
              >
                Mes
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('week')}
              >
                Semana
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[150px] text-center capitalize">
              {format(currentDate, "MMMM yyyy", { locale: es })}
            </span>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Hoy
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Llamadas</span>
          </div>
          <div className="flex items-center gap-1">
            <Home className="h-3 w-3 text-secondary" />
            <span className="text-muted-foreground">Visitas Domicilio</span>
          </div>
          <div className="flex items-center gap-1">
            <Building className="h-3 w-3 text-accent" />
            <span className="text-muted-foreground">Visitas Ambulatorio</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-px mb-2">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[100px] bg-card p-1 transition-colors hover:bg-accent/30",
                  !isCurrentMonth && "bg-muted/30",
                  isToday(day) && "ring-2 ring-primary ring-inset"
                )}
              >
                <div className={cn(
                  "text-sm font-medium mb-1",
                  !isCurrentMonth && "text-muted-foreground",
                  isToday(day) && "text-primary"
                )}>
                  {format(day, "d")}
                </div>
                
                <div className="space-y-1 overflow-y-auto max-h-[70px]">
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className={cn(
                        "w-full text-left text-xs p-1 rounded border truncate transition-all hover:scale-[1.02]",
                        getEventColor(event)
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {event.type === 'llamada' ? (
                          <Phone className="h-2.5 w-2.5 flex-shrink-0" />
                        ) : event.tipoVisita === 'domicilio' ? (
                          <Home className="h-2.5 w-2.5 flex-shrink-0" />
                        ) : (
                          <Building className="h-2.5 w-2.5 flex-shrink-0" />
                        )}
                        <span className="truncate">{event.title}</span>
                      </div>
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayEvents.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
