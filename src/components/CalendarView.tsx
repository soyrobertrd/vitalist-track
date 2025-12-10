import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Phone, 
  Home, 
  Building,
  Filter
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths, 
  isToday, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth,
  addWeeks,
  subWeeks
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface CalendarViewProps {
  onEventClick?: (event: CalendarEvent) => void;
}

type FilterType = 'all' | 'visitas' | 'llamadas';

export function CalendarView({ onEventClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week'>('month');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showVisitas, setShowVisitas] = useState(true);
  const [showLlamadas, setShowLlamadas] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [currentDate, view]);

  const fetchEvents = async () => {
    setLoading(true);
    
    let startDate: Date;
    let endDate: Date;
    
    if (view === 'week') {
      startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
      endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
    } else {
      startDate = startOfMonth(currentDate);
      endDate = endOfMonth(currentDate);
    }

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
          const eventDate = new Date(v.fecha_hora_visita);
          calendarEvents.push({
            id: v.id,
            type: 'visita',
            title: `${v.pacientes?.nombre || ''} ${v.pacientes?.apellido || ''}`.trim(),
            date: eventDate,
            time: format(eventDate, "HH:mm"),
            status: v.estado,
            profesional: v.personal_salud ? `${v.personal_salud.nombre} ${v.personal_salud.apellido}` : undefined,
            tipoVisita: v.tipo_visita,
          });
        });
      }

      if (llamadas) {
        llamadas.forEach((l: any) => {
          if (l.fecha_agendada) {
            const eventDate = new Date(l.fecha_agendada);
            calendarEvents.push({
              id: l.id,
              type: 'llamada',
              title: `${l.pacientes?.nombre || ''} ${l.pacientes?.apellido || ''}`.trim(),
              date: eventDate,
              time: format(eventDate, "HH:mm"),
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

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (!showVisitas && event.type === 'visita') return false;
      if (!showLlamadas && event.type === 'llamada') return false;
      return true;
    });
  }, [events, showVisitas, showLlamadas]);

  const days = useMemo(() => {
    if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    } else {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }
  }, [currentDate, view]);

  const getEventsForDay = (day: Date) => {
    return filteredEvents
      .filter((event) => isSameDay(event.date, day))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
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

  const navigatePrevious = () => {
    if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const getDateRangeLabel = () => {
    if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(weekStart, "d MMM", { locale: es })} - ${format(weekEnd, "d MMM yyyy", { locale: es })}`;
    }
    return format(currentDate, "MMMM yyyy", { locale: es });
  };

  const maxEventsPerDay = useMemo(() => {
    let max = 0;
    days.forEach(day => {
      const count = getEventsForDay(day).length;
      if (count > max) max = count;
    });
    return max;
  }, [days, filteredEvents]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
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
            {/* Filter dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filtrar
                  {(!showVisitas || !showLlamadas) && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                      {showVisitas && !showLlamadas ? 'Visitas' : !showVisitas && showLlamadas ? 'Llamadas' : ''}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                  checked={showVisitas}
                  onCheckedChange={setShowVisitas}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Visitas
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showLlamadas}
                  onCheckedChange={setShowLlamadas}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Llamadas
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="icon" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[180px] text-center capitalize">
              {getDateRangeLabel()}
            </span>
            <Button variant="outline" size="icon" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Hoy
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-sm flex-wrap">
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Llamadas</span>
          </div>
          <div className="flex items-center gap-1">
            <Home className="h-3 w-3 text-warning" />
            <span className="text-muted-foreground">Visitas Domicilio</span>
          </div>
          <div className="flex items-center gap-1">
            <Building className="h-3 w-3 text-secondary" />
            <span className="text-muted-foreground">Visitas Ambulatorio</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Badge variant="outline" className="bg-success/10 text-success border-success/30">Realizada</Badge>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Pendiente</Badge>
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Cancelada</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-px mb-2">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid - dynamic height based on events */}
            <div 
              className={cn(
                "grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden",
                view === 'week' && "min-h-[300px]"
              )}
            >
              {days.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = view === 'week' || isSameMonth(day, currentDate);

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "bg-card p-2 transition-colors hover:bg-accent/30 flex flex-col",
                      !isCurrentMonth && "bg-muted/30",
                      isToday(day) && "ring-2 ring-primary ring-inset",
                      view === 'week' ? "min-h-[300px]" : "min-h-[100px]"
                    )}
                    style={{
                      minHeight: view === 'month' 
                        ? `${Math.max(100, 50 + dayEvents.length * 28)}px`
                        : undefined
                    }}
                  >
                    <div className={cn(
                      "text-sm font-medium mb-2 flex items-center justify-between",
                      !isCurrentMonth && "text-muted-foreground",
                      isToday(day) && "text-primary"
                    )}>
                      <span>{format(day, view === 'week' ? "d MMM" : "d", { locale: es })}</span>
                      {dayEvents.length > 0 && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {dayEvents.length}
                        </Badge>
                      )}
                    </div>
                    
                    <div className={cn(
                      "space-y-1 flex-1 overflow-y-auto",
                      view === 'week' ? "max-h-[260px]" : "max-h-none"
                    )}>
                      {(view === 'week' ? dayEvents : dayEvents.slice(0, 5)).map((event) => (
                        <button
                          key={event.id}
                          onClick={() => onEventClick?.(event)}
                          className={cn(
                            "w-full text-left text-xs p-1.5 rounded border truncate transition-all hover:scale-[1.02] hover:shadow-sm",
                            getEventColor(event)
                          )}
                        >
                          <div className="flex items-center gap-1">
                            {event.type === 'llamada' ? (
                              <Phone className="h-3 w-3 flex-shrink-0" />
                            ) : event.tipoVisita === 'domicilio' ? (
                              <Home className="h-3 w-3 flex-shrink-0" />
                            ) : (
                              <Building className="h-3 w-3 flex-shrink-0" />
                            )}
                            <span className="font-medium">{event.time}</span>
                            <span className="truncate">{event.title}</span>
                          </div>
                          {view === 'week' && event.profesional && (
                            <div className="text-[10px] text-muted-foreground mt-0.5 truncate pl-4">
                              {event.profesional}
                            </div>
                          )}
                        </button>
                      ))}
                      {view === 'month' && dayEvents.length > 5 && (
                        <div className="text-xs text-muted-foreground text-center py-1 bg-muted/50 rounded">
                          +{dayEvents.length - 5} más
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>
                  Total: <strong className="text-foreground">{filteredEvents.length}</strong> eventos
                </span>
                {showLlamadas && (
                  <span>
                    <Phone className="h-3 w-3 inline mr-1" />
                    {filteredEvents.filter(e => e.type === 'llamada').length} llamadas
                  </span>
                )}
                {showVisitas && (
                  <span>
                    <Home className="h-3 w-3 inline mr-1" />
                    {filteredEvents.filter(e => e.type === 'visita').length} visitas
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
