import { useEffect, useState } from "react";
import { CalendarView } from "@/components/CalendarView";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GeolocationMap } from "@/components/GeolocationMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  CheckCircle2,
  Video,
  UserCheck,
  CalendarDays,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";
import { AgendarCitaButton } from "@/components/AgendarCitaButton";
import { useVertical } from "@/contexts/VerticalContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useActiveSucursal } from "@/contexts/ActiveSucursalContext";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { DoctorScheduleWidget } from "@/components/dashboard/DoctorScheduleWidget";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

const VERTICALES_DOMICILIO = new Set(["clinica", "recovery", "todas"]);

export default function Calendario() {
  const { verticalActiva } = useVertical();
  const { currentWorkspace } = useWorkspace();
  const { activeSucursalId } = useActiveSucursal();
  const mostrarMapa = VERTICALES_DOMICILIO.has(verticalActiva);

  const [metrics, setMetrics] = useState({
    hoy: 0,
    pendientes: 0,
    enSala: 0,
    completadas: 0,
  });

  useEffect(() => {
    async function loadTodayStats() {
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();

      try {
        let query = supabase
          .from("control_visitas")
          .select("id, estado", { count: "exact" })
          .gte("fecha_hora_visita", todayStart)
          .lte("fecha_hora_visita", todayEnd);

        if (currentWorkspace?.id) {
          query = query.eq("workspace_id", currentWorkspace.id);
        }
        if (activeSucursalId) {
          query = query.eq("sucursal_id", activeSucursalId);
        }

        const { data, count } = await query;
        const total = count || 0;
        const rows = data || [];
        const pendientes = rows.filter((r) => (r.estado as string) === "pendiente" || (r.estado as string) === "agendada").length;
        const enSala = rows.filter((r) => (r.estado as string) === "en_sala" || (r.estado as string) === "en_curso").length;
        const completadas = rows.filter((r) => (r.estado as string) === "realizada" || (r.estado as string) === "completada").length;

        setMetrics({
          hoy: total,
          pendientes,
          enSala,
          completadas,
        });
      } catch (err) {
        console.error("Error loading calendar metrics:", err);
      }
    }

    loadTodayStats();
  }, [currentWorkspace?.id, activeSucursalId]);

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <ClinicalPageHeader
        title="Agenda & Citas Médicas"
        subtitle="Control de turnos clínicos, citas ambulatorias, teleconsultas y visitas domiciliarias en tiempo real"
        icon={CalendarIcon}
        variant="blue"
        badge="En Vivo"
        action={<AgendarCitaButton />}
      />

      {/* Barra de Métricas Rápidas del Día */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ClinicalKpiCard
          title="Citas para Hoy"
          value={metrics.hoy}
          subtitle="Agendadas en jornada activa"
          icon={CalendarDays}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Por Atender"
          value={metrics.pendientes}
          subtitle={metrics.pendientes > 0 ? "Pacientes por ingresar" : "Al día"}
          icon={Clock}
          variant="amber"
          alert={metrics.pendientes > 0}
        />
        <ClinicalKpiCard
          title="En Sala / Espera"
          value={metrics.enSala}
          subtitle="Check-in completado"
          icon={UserCheck}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Completadas"
          value={metrics.completadas}
          subtitle="Atenciones efectivas del día"
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* 3. Pestañas de Vista de Agenda */}
      <Tabs defaultValue="calendario" className="w-full space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="w-full sm:w-auto flex justify-start gap-1 p-1.5 bg-muted/40 rounded-2xl border border-border/70 h-auto">
            <TabsTrigger value="calendario" className="rounded-xl text-xs font-semibold px-4 py-2 gap-2">
              <CalendarIcon className="h-4 w-4" />
              Calendario General
            </TabsTrigger>
            {mostrarMapa && (
              <TabsTrigger value="mapa" className="rounded-xl text-xs font-semibold px-4 py-2 gap-2">
                <MapPin className="h-4 w-4" />
                Mapa de Rutas y Visitas
              </TabsTrigger>
            )}
            <TabsTrigger value="disponibilidad" className="rounded-xl text-xs font-semibold px-4 py-2 gap-2">
              <UserCheck className="h-4 w-4" />
              Disponibilidad Médica
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Calendario Principal */}
        <TabsContent value="calendario" className="mt-0">
          <CalendarView
            onEventClick={(event) => {
              console.log("Evento seleccionado:", event);
            }}
          />
        </TabsContent>

        {/* Tab 2: Mapa Georreferenciado */}
        {mostrarMapa && (
          <TabsContent value="mapa" className="mt-0">
            <GeolocationMap />
          </TabsContent>
        )}

        {/* Tab 3: Disponibilidad y Médicos de Guardia */}
        <TabsContent value="disponibilidad" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <DoctorScheduleWidget />
            </div>
            <div className="rounded-2xl border border-border/80 bg-card p-5">
              <h3 className="text-sm font-bold text-foreground">Reglas de Asignación Automática</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                El sistema asigna citas basadas en la especialidad médica, carga horaria disponible y sede activa.
              </p>
              <div className="mt-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Intervalo estándar de consulta:</span>
                  <span className="font-semibold text-foreground">30 minutos</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Tiempo de preparación de sala:</span>
                  <span className="font-semibold text-foreground">10 minutos</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Bloqueos de emergencia:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Habilitados</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
