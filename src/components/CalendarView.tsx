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
  Check,
  Clock,
  X
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
  subWeeks,
  isWeekend,
  getDay
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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

export function CalendarView({ onEventClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week'>('week');
  
  // Toggle filters for type
  const [activeTypes, setActiveTypes] = useState<string[]>(['llamadas', 'domicilio', 'ambulatorio']);
  // Toggle filters for status  
  const [activeStatuses, setActiveStatuses] = useState<string[]>(['pendiente', 'realizada', 'cancelada']);

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
          if (v.fecha_hora_visita) {
            try {
              const eventDate = new Date(v.fecha_hora_visita);
              if (!isNaN(eventDate.getTime())) {
                calendarEvents.push({
                  id: v.id,
                  type: 'visita',
                  title: `${v.pacientes?.nombre || ''} ${v.pacientes?.apellido || ''}`.trim() || 'Sin nombre',
                  date: eventDate,
                  time: format(eventDate, "HH:mm"),
                  status: v.estado || 'pendiente',
                  profesional: v.personal_salud ? `${v.personal_salud.nombre} ${v.personal_salud.apellido}` : undefined,
                  tipoVisita: v.tipo_visita,
                });
              }
            } catch (e) {
              console.warn("Error parsing visita date:", v.fecha_hora_visita);
            }
          }
        });
      }

      if (llamadas) {
        llamadas.forEach((l: any) => {
          if (l.fecha_agendada) {
            try {
              const eventDate = new Date(l.fecha_agendada);
              if (!isNaN(eventDate.getTime())) {
                calendarEvents.push({
                  id: l.id,
                  type: 'llamada',
                  title: `${l.pacientes?.nombre || ''} ${l.pacientes?.apellido || ''}`.trim() || 'Sin nombre',
                  date: eventDate,
                  time: format(eventDate, "HH:mm"),
                  status: l.estado || 'pendiente',
                  profesional: l.personal_salud ? `${l.personal_salud.nombre} ${l.personal_salud.apellido}` : undefined,
                });
              }
            } catch (e) {
              console.warn("Error parsing llamada date:", l.fecha_agendada);
            }
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

  const normalizeStatus = (status: string): string => {
    if (['realizada'].includes(status)) return 'realizada';
    if (['cancelada'].includes(status)) return 'cancelada';
    return 'pendiente'; // agendada, pendiente, etc.
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Filter by type
      if (event.type === 'llamada' && !activeTypes.includes('llamadas')) return false;
      if (event.type === 'visita' && event.tipoVisita === 'domicilio' && !activeTypes.includes('domicilio')) return false;
      if (event.type === 'visita' && event.tipoVisita === 'ambulatorio' && !activeTypes.includes('ambulatorio')) return false;
      
      // Filter by status
      const normalizedStatus = normalizeStatus(event.status);
      if (!activeStatuses.includes(normalizedStatus)) return false;
      
      return true;
    });
  }, [events, activeTypes, activeStatuses]);

  const days = useMemo(() => {
    try {
      if (!currentDate || isNaN(currentDate.getTime())) {
        return [];
      }
      
      if (view === 'week') {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        if (!weekStart || !weekEnd || isNaN(weekStart.getTime()) || isNaN(weekEnd.getTime())) {
          return [];
        }
        return eachDayOfInterval({ start: weekStart, end: weekEnd });
      } else {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        if (!monthStart || !monthEnd || isNaN(monthStart.getTime()) || isNaN(monthEnd.getTime())) {
          return [];
        }
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        if (!calendarStart || !calendarEnd || isNaN(calendarStart.getTime()) || isNaN(calendarEnd.getTime())) {
          return [];
        }
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
      }
    } catch (error) {
      console.error("Error calculating days:", error);
      return [];
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
             event.status === 'agendada' || event.status === 'pendiente' ? 'bg-primary/20 text-primary border-primary/30' :
             'bg-muted text-muted-foreground border-muted';
    }
    return event.status === 'realizada' ? 'bg-secondary/20 text-secondary border-secondary/30' :
           event.status === 'pendiente' ? 'bg-warning/20 text-warning border-warning/30' :
           'bg-destructive/20 text-destructive border-destructive/30';
  };

  const navigatePrevious = () => {
    try {
      if (view === 'week') {
        const newDate = subWeeks(currentDate, 1);
        if (newDate && !isNaN(newDate.getTime())) {
          setCurrentDate(newDate);
        }
      } else {
        const newDate = subMonths(currentDate, 1);
        if (newDate && !isNaN(newDate.getTime())) {
          setCurrentDate(newDate);
        }
      }
    } catch (error) {
      console.error("Error navigating previous:", error);
    }
  };

  const navigateNext = () => {
    try {
      if (view === 'week') {
        const newDate = addWeeks(currentDate, 1);
        if (newDate && !isNaN(newDate.getTime())) {
          setCurrentDate(newDate);
        }
      } else {
        const newDate = addMonths(currentDate, 1);
        if (newDate && !isNaN(newDate.getTime())) {
          setCurrentDate(newDate);
        }
      }
    } catch (error) {
      console.error("Error navigating next:", error);
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

  const isWeekendDay = (day: Date) => {
    const dayOfWeek = getDay(day);
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
  };

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

        {/* Type Toggle Buttons */}
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Tipo:</span>
            <ToggleGroup 
              type="multiple" 
              value={activeTypes} 
              onValueChange={(value) => value.length > 0 && setActiveTypes(value)}
              className="gap-1"
            >
              <ToggleGroupItem value="llamadas" aria-label="Llamadas" className="gap-1 data-[state=on]:bg-primary/20">
                <Phone className="h-4 w-4" />
                Llamadas
              </ToggleGroupItem>
              <ToggleGroupItem value="domicilio" aria-label="Visitas Domicilio" className="gap-1 data-[state=on]:bg-warning/20">
                <Home className="h-4 w-4" />
                Domicilio
              </ToggleGroupItem>
              <ToggleGroupItem value="ambulatorio" aria-label="Visitas Ambulatorio" className="gap-1 data-[state=on]:bg-secondary/20">
                <Building className="h-4 w-4" />
                Ambulatorio
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Estado:</span>
            <ToggleGroup 
              type="multiple" 
              value={activeStatuses} 
              onValueChange={(value) => value.length > 0 && setActiveStatuses(value)}
              className="gap-1"
            >
              <ToggleGroupItem value="pendiente" aria-label="Pendientes" className="gap-1 data-[state=on]:bg-primary/20">
                <Clock className="h-4 w-4" />
                Pendientes
              </ToggleGroupItem>
              <ToggleGroupItem value="realizada" aria-label="Realizadas" className="gap-1 data-[state=on]:bg-success/20">
                <Check className="h-4 w-4" />
                Realizadas
              </ToggleGroupItem>
              <ToggleGroupItem value="cancelada" aria-label="Canceladas" className="gap-1 data-[state=on]:bg-destructive/20">
                <X className="h-4 w-4" />
                Canceladas
              </ToggleGroupItem>
            </ToggleGroup>
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
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day, index) => (
                <div 
                  key={day} 
                  className={cn(
                    "text-center text-sm font-medium py-2",
                    index >= 5 ? "text-destructive/70" : "text-muted-foreground"
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid - fixed size */}
            <div 
              className={cn(
                "grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden"
              )}
            >
              {days.length > 0 ? days.map((day, index) => {
                // Validate day is a valid Date object
                if (!day || !(day instanceof Date) || isNaN(day.getTime())) {
                  return (
                    <div key={`invalid-${index}`} className="bg-card p-2 min-h-[120px]" />
                  );
                }
                
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = view === 'week' || isSameMonth(day, currentDate);
                const isWeekendDayFlag = isWeekendDay(day);
                const dayKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;

                return (
                  <div
                    key={dayKey}
                    className={cn(
                      "bg-card p-2 transition-colors flex flex-col",
                      !isCurrentMonth && "bg-muted/30",
                      isToday(day) && "ring-2 ring-primary ring-inset",
                      isWeekendDayFlag && "bg-destructive/5",
                      view === 'week' ? "min-h-[300px]" : "min-h-[120px]"
                    )}
                  >
                    <div className={cn(
                      "text-sm font-medium mb-2 flex items-center justify-between",
                      !isCurrentMonth && "text-muted-foreground",
                      isToday(day) && "text-primary",
                      isWeekendDayFlag && "text-destructive/70"
                    )}>
                      <span>{format(day, view === 'week' ? "d MMM" : "d", { locale: es })}</span>
                      <div className="flex items-center gap-1">
                        {dayEvents.length > 0 && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            {dayEvents.length}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className={cn(
                      "space-y-1 flex-1 overflow-y-auto",
                      view === 'week' ? "max-h-[260px]" : "max-h-[80px]"
                    )}>
                      {(view === 'week' ? dayEvents : dayEvents.slice(0, 3)).map((event) => (
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
                      {view === 'month' && dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center py-1 bg-muted/50 rounded">
                          +{dayEvents.length - 3} más
                        </div>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-7 flex items-center justify-center h-32 text-muted-foreground">
                  No se pueden mostrar los días
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>
                  Total: <strong className="text-foreground">{filteredEvents.length}</strong> eventos
                </span>
                {activeTypes.includes('llamadas') && (
                  <span>
                    <Phone className="h-3 w-3 inline mr-1" />
                    {filteredEvents.filter(e => e.type === 'llamada').length} llamadas
                  </span>
                )}
                {(activeTypes.includes('domicilio') || activeTypes.includes('ambulatorio')) && (
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
