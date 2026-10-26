import { GlassCard } from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Calendar, Phone, MapPin, CheckCircle2 } from "lucide-react";
import { HorariosProfesionalEditor } from "@/components/HorariosProfesionalEditor";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export interface ProximaCita {
  id: string;
  tipo: "llamada" | "visita";
  fecha: string;
  paciente: { nombre: string; apellido: string } | null;
  estado: string;
}

export interface TareaPendiente {
  id: string;
  tipo: string;
  descripcion: string;
  paciente: { nombre: string; apellido: string } | null;
  fecha_programada: string | null;
}

interface ConfiguracionAgendaTabProps {
  profesionalId: string | null;
  loadingCitas: boolean;
  proximasCitas: ProximaCita[];
  tareasPendientes: TareaPendiente[];
}

export function ConfiguracionAgendaTab({
  profesionalId,
  loadingCitas,
  proximasCitas,
  tareasPendientes,
}: ConfiguracionAgendaTabProps) {
  return (
    <GlassCard className="p-6 space-y-6 shadow-none">
      <div>
        <h2 className="text-2xl font-bold mb-2">Agenda y Recordatorios</h2>
        <p className="text-muted-foreground">Calendario personal, horarios y tareas pendientes</p>
      </div>

      {/* Horarios Laborables */}
      {profesionalId ? (
        <div className="space-y-4">
          <Separator />
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Mis Horarios Laborables
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Configura tus días y horarios de trabajo
            </p>
            <HorariosProfesionalEditor profesionalId={profesionalId} />
          </div>
        </div>
      ) : (
        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-muted-foreground text-sm">
            No tienes un perfil de profesional vinculado. Contacta al administrador si crees que esto es un error.
          </p>
        </div>
      )}

      <Separator />

      {/* Próximas Citas */}
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Próximas Citas
          </h3>
          {loadingCitas ? (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : proximasCitas.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay citas programadas</p>
          ) : (
            <div className="space-y-3">
              {proximasCitas.map((cita) => (
                <div key={cita.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div
                    className={`p-2 rounded-full ${
                      cita.tipo === "llamada" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                    }`}
                  >
                    {cita.tipo === "llamada" ? <Phone className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {cita.paciente ? `${cita.paciente.nombre} ${cita.paciente.apellido}` : "Paciente no asignado"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(cita.fecha), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {cita.tipo}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tareas Pendientes */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Tareas Pendientes
          </h3>
          {loadingCitas ? (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : tareasPendientes.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay tareas pendientes</p>
          ) : (
            <div className="space-y-3">
              {tareasPendientes.map((tarea) => (
                <div key={tarea.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{tarea.descripcion}</p>
                    {tarea.paciente && (
                      <p className="text-xs text-muted-foreground">
                        Paciente: {tarea.paciente.nombre} {tarea.paciente.apellido}
                      </p>
                    )}
                    {tarea.fecha_programada && (
                      <p className="text-xs text-muted-foreground">
                        Fecha: {format(new Date(tarea.fecha_programada), "dd/MM/yyyy", { locale: es })}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline">{tarea.tipo}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
