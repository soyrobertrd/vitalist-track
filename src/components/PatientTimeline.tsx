import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Calendar, FileText, Pill, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TimelineEvent {
  id: string;
  type: 'visita' | 'llamada' | 'atencion' | 'medicamento';
  title: string;
  description?: string;
  date: Date;
  status?: string;
  icon: React.ReactNode;
  color: string;
}

interface PatientTimelineProps {
  pacienteId: string;
  maxItems?: number;
}

export function PatientTimeline({ pacienteId, maxItems = 20 }: PatientTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pacienteId) return;
    fetchTimeline();
  }, [pacienteId]);

  const fetchTimeline = async () => {
    setLoading(true);
    const timelineEvents: TimelineEvent[] = [];

    try {
      // Fetch visitas
      const { data: visitas } = await supabase
        .from("control_visitas")
        .select("id, fecha_hora_visita, tipo_visita, estado, notas_visita, personal_salud!control_visitas_profesional_id_fkey(nombre, apellido)")
        .eq("paciente_id", pacienteId)
        .order("fecha_hora_visita", { ascending: false })
        .limit(10);

      if (visitas) {
        visitas.forEach((v: any) => {
          timelineEvents.push({
            id: `visita-${v.id}`,
            type: 'visita',
            title: `Visita ${v.tipo_visita === 'domicilio' ? 'Domiciliaria' : 'Ambulatoria'}`,
            description: v.personal_salud ? `${v.personal_salud.nombre} ${v.personal_salud.apellido}` : undefined,
            date: new Date(v.fecha_hora_visita),
            status: v.estado,
            icon: <Calendar className="h-4 w-4" />,
            color: v.estado === 'realizada' ? 'bg-success' : v.estado === 'pendiente' ? 'bg-warning' : 'bg-destructive',
          });
        });
      }

      // Fetch llamadas
      const { data: llamadas } = await supabase
        .from("registro_llamadas")
        .select("id, fecha_agendada, fecha_hora_realizada, estado, resultado_seguimiento, personal_salud!fk_registro_llamadas_profesional(nombre, apellido)")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (llamadas) {
        llamadas.forEach((l: any) => {
          timelineEvents.push({
            id: `llamada-${l.id}`,
            type: 'llamada',
            title: `Llamada de seguimiento`,
            description: l.resultado_seguimiento || l.estado,
            date: new Date(l.fecha_hora_realizada || l.fecha_agendada),
            status: l.estado,
            icon: <Phone className="h-4 w-4" />,
            color: l.estado === 'realizada' ? 'bg-success' : l.estado === 'agendada' ? 'bg-primary' : 'bg-muted',
          });
        });
      }

      // Fetch atenciones
      const { data: atenciones } = await supabase
        .from("atencion_paciente")
        .select("id, tipo, descripcion, fecha_realizada, estado")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (atenciones) {
        atenciones.forEach((a: any) => {
          timelineEvents.push({
            id: `atencion-${a.id}`,
            type: 'atencion',
            title: a.tipo,
            description: a.descripcion,
            date: new Date(a.fecha_realizada || a.fecha_programada),
            status: a.estado,
            icon: <FileText className="h-4 w-4" />,
            color: a.estado === 'realizada' ? 'bg-secondary' : 'bg-accent',
          });
        });
      }

      // Sort by date
      timelineEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
      setEvents(timelineEvents.slice(0, maxItems));
    } catch (error) {
      console.error("Error fetching timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'realizada':
        return <CheckCircle className="h-3 w-3 text-success" />;
      case 'cancelada':
      case 'no_realizada':
        return <XCircle className="h-3 w-3 text-destructive" />;
      case 'pendiente':
      case 'agendada':
        return <Clock className="h-3 w-3 text-warning" />;
      default:
        return <AlertCircle className="h-3 w-3 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Historial de Interacciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {events.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-6">
                {events.map((event, index) => (
                  <div key={event.id} className="relative flex gap-4 group">
                    {/* Icon */}
                    <div className={cn(
                      "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 border-background transition-transform group-hover:scale-110",
                      event.color
                    )}>
                      <span className="text-white">{event.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-6">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground flex items-center gap-2">
                            {event.title}
                            {getStatusIcon(event.status)}
                          </p>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {event.description}
                            </p>
                          )}
                        </div>
                        {event.status && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {event.status.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(event.date, "dd MMM yyyy, HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No hay interacciones registradas</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
