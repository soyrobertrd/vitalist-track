import { GlassCard } from "@/components/GlassCard";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Phone, MapPin, User, TrendingUp, Clock, MessageSquare, CheckCircle2 } from "lucide-react";

export interface EstadisticasDesempeno {
  llamadasRealizadasMes: number;
  llamadasRealizadasTotal: number;
  visitasCompletadasMes: number;
  visitasCompletadasTotal: number;
  pacientesAsignados: number;
  tasaContacto: number;
  duracionPromedioLlamadas: number;
  tareasCompletadasMes: number;
  llamadasPendientes: number;
  visitasPendientes: number;
}

interface ConfiguracionActividadTabProps {
  loading: boolean;
  profesionalId: string | null;
  estadisticas: EstadisticasDesempeno | null;
}

export function ConfiguracionActividadTab({
  loading,
  profesionalId,
  estadisticas,
}: ConfiguracionActividadTabProps) {
  return (
    <GlassCard className="p-6 space-y-6 shadow-none">
      <div>
        <h2 className="text-2xl font-bold mb-2">Resumen de Actividad y Desempeño</h2>
        <p className="text-muted-foreground">Estadísticas personalizadas basadas en tu actividad real</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg space-y-2 animate-pulse">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-8 bg-muted rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : !profesionalId ? (
        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-muted-foreground text-sm">
            No tienes un perfil de profesional vinculado. Contacta al administrador para ver tus estadísticas.
          </p>
        </div>
      ) : (
        <>
          {/* Estadísticas principales */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 border rounded-lg space-y-1 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600" />
                <Label className="text-muted-foreground text-xs">Llamadas Este Mes</Label>
              </div>
              <p className="text-3xl font-bold text-blue-600">{estadisticas?.llamadasRealizadasMes || 0}</p>
              <p className="text-xs text-muted-foreground">Total: {estadisticas?.llamadasRealizadasTotal || 0}</p>
            </div>

            <div className="p-4 border rounded-lg space-y-1 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <Label className="text-muted-foreground text-xs">Visitas Este Mes</Label>
              </div>
              <p className="text-3xl font-bold text-green-600">{estadisticas?.visitasCompletadasMes || 0}</p>
              <p className="text-xs text-muted-foreground">Total: {estadisticas?.visitasCompletadasTotal || 0}</p>
            </div>

            <div className="p-4 border rounded-lg space-y-1 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-purple-600" />
                <Label className="text-muted-foreground text-xs">Pacientes Asignados</Label>
              </div>
              <p className="text-3xl font-bold text-purple-600">{estadisticas?.pacientesAsignados || 0}</p>
              <p className="text-xs text-muted-foreground">Activos</p>
            </div>

            <div className="p-4 border rounded-lg space-y-1 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                <Label className="text-muted-foreground text-xs">Tasa de Contacto</Label>
              </div>
              <p className="text-3xl font-bold text-amber-600">{estadisticas?.tasaContacto || 0}%</p>
              <p className="text-xs text-muted-foreground">Llamadas efectivas</p>
            </div>

            <div className="p-4 border rounded-lg space-y-1 bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/30 dark:to-cyan-900/20">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-600" />
                <Label className="text-muted-foreground text-xs">Duración Promedio</Label>
              </div>
              <p className="text-3xl font-bold text-cyan-600">{estadisticas?.duracionPromedioLlamadas || 0}</p>
              <p className="text-xs text-muted-foreground">minutos/llamada</p>
            </div>
          </div>

          <Separator />

          {/* Pendientes y tareas */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Actividades Pendientes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg flex items-center gap-4 bg-orange-50/50 dark:bg-orange-950/20">
                <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/40">
                  <Phone className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{estadisticas?.llamadasPendientes || 0}</p>
                  <p className="text-sm text-muted-foreground">Llamadas pendientes</p>
                </div>
              </div>

              <div className="p-4 border rounded-lg flex items-center gap-4 bg-rose-50/50 dark:bg-rose-950/20">
                <div className="p-3 rounded-full bg-rose-100 dark:bg-rose-900/40">
                  <MapPin className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{estadisticas?.visitasPendientes || 0}</p>
                  <p className="text-sm text-muted-foreground">Visitas pendientes</p>
                </div>
              </div>

              <div className="p-4 border rounded-lg flex items-center gap-4 bg-emerald-50/50 dark:bg-emerald-950/20">
                <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{estadisticas?.tareasCompletadasMes || 0}</p>
                  <p className="text-sm text-muted-foreground">Tareas completadas (mes)</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </GlassCard>
  );
}
