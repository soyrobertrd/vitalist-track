import { useEffect, useState } from "react";
import { db } from "@/integrations/db/client";
import { Badge } from "@/components/ui/badge";
import { RecordatoriosDiariosWhatsApp } from "@/components/RecordatoriosDiariosWhatsApp";
import { InventarioAlertasWidget } from "@/components/InventarioAlertasWidget";
import { PlanLimitAlert } from "@/components/PlanLimitAlert";
import { OnboardingChecklistWidget } from "@/components/dashboard/OnboardingChecklistWidget";
import { AlertasAccion, type AlertaAccion } from "@/components/dashboard/AlertasAccion";
import { AgendaDiaPanel } from "@/components/dashboard/AgendaDiaPanel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays, startOfDay, endOfDay, startOfMonth, subMonths, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { useNavigate } from "react-router-dom";
import { useLocale } from "@/hooks/useLocale";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useActiveSucursal } from "@/contexts/ActiveSucursalContext";
import { useVerticalFilter } from "@/hooks/useVerticalFilter";
import { useTranslation } from "react-i18next";
import { DonutCard, type DonutDataItem as DonutSegment } from "@/components/charts/DonutCard";
import { BarCard } from "@/components/charts/BarCard";
import { TrendCard } from "@/components/charts/TrendCard";
import { calculateForecast, type TimeSeriesPoint as TrendPoint } from "@/lib/forecast";
import { VERTICAL_LABELS as verticalLabel } from "@/config/verticales";
import { VerticalMetricsWidget } from "@/components/dashboard/VerticalMetricsWidget";
import { MedicalHeroBanner } from "@/components/dashboard/MedicalHeroBanner";
import { EnhancedKPIs } from "@/components/dashboard/EnhancedKPIs";
import { QuickLinksBar } from "@/components/dashboard/QuickLinksBar";
import { ExaminationsWidget } from "@/components/dashboard/ExaminationsWidget";
import { VitalStatsCards } from "@/components/dashboard/VitalStatsCards";
import { DoctorScheduleWidget } from "@/components/dashboard/DoctorScheduleWidget";
import { TodayAppointmentsTable } from "@/components/dashboard/TodayAppointmentsTable";
import { NewPatientsWidget } from "@/components/dashboard/NewPatientsWidget";
import { PhysicianProfileCard } from "@/components/dashboard/PhysicianProfileCard";
import { HealthScoreWidget } from "@/components/dashboard/HealthScoreWidget";
import { ActiveTreatmentWidget } from "@/components/dashboard/ActiveTreatmentWidget";
import { OperationalEfficiencyCards } from "@/components/dashboard/OperationalEfficiencyCards";
import {
  CalendarDays,
  BarChart3,
  Stethoscope,
  Bell,
  ChevronDown,
  ChevronUp,
  Activity,
  ShieldAlert,
} from "lucide-react";

const Dashboard = () => {
  const { t } = useTranslation("dashboard");
  const navigate = useNavigate();
  const { timezone } = useLocale();
  const { currentWorkspace } = useWorkspace();
  const { activeSucursalId } = useActiveSucursal();
  const { verticalActiva } = useVerticalFilter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [nombreUsuario, setNombreUsuario] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("operativo");
  const [showAlertCenter, setShowAlertCenter] = useState<boolean>(false);

  const [stats, setStats] = useState({
    totalPacientes: 0,
    pacientesActivos: 0,
    llamadasPendientes: 0,
    visitasHoy: 0,
  });

  const [donutData, setDonutData] = useState<DonutSegment[]>([]);
  const [barData, setBarData] = useState<Record<string, string | number>[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [loadingCharts, setLoadingCharts] = useState(false);

  const [extraStats, setExtraStats] = useState({
    duracionPromedio: 0,
    tasaCumplimiento: 0,
    pacientesAltoRiesgo: 0,
    porcentajeAltoRiesgo: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await db.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: perfil } = await db
          .from("profiles")
          .select("nombre")
          .eq("id", user.id)
          .maybeSingle();
        setNombreUsuario((perfil as any)?.nombre ?? "");
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUserId) return;
      setLoadingCharts(true);

      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30).toISOString().split("T")[0];
      const today = now.toISOString().split("T")[0];
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();

      const { data: personalRow } = await db
        .from("personal_salud")
        .select("id")
        .eq("user_id", currentUserId)
        .maybeSingle();
      const profesionalId = personalRow?.id ?? currentUserId;

      const wsId = currentWorkspace?.id;
      const applyScope = <T extends { eq: (col: string, val: any) => T }>(q: T): T => {
        let qq = q;
        if (wsId) qq = qq.eq("workspace_id", wsId);
        if (activeSucursalId) qq = qq.eq("sucursal_id", activeSucursalId);
        if (verticalActiva && verticalActiva !== "todas") qq = qq.eq("vertical", verticalActiva);
        return qq;
      };

      try {
        const [pacientesRes, llamadas, visitas] = await Promise.all([
          applyScope(db.from("pacientes").select("id, status_px") as any),
          applyScope(
            db
              .from("registro_llamadas")
              .select("id", { count: "exact", head: true })
              .in("estado", ["agendada", "pendiente"])
              .eq("profesional_id", profesionalId)
              .gte("fecha_agendada", thirtyDaysAgo)
              .lte("fecha_agendada", `${today}T23:59:59`) as any
          ),
          applyScope(
            db
              .from("control_visitas")
              .select("id", { count: "exact", head: true })
              .eq("estado", "pendiente")
              .eq("profesional_id", profesionalId)
              .gte("fecha_hora_visita", todayStart)
              .lte("fecha_hora_visita", todayEnd) as any
          ),
        ]);

        const pacientesAll = pacientesRes.data || [];
        const totalPacientesCount = pacientesAll.length;
        const pacientesActivosCount = pacientesAll.filter((p: any) => p.status_px === "activo").length;

        setStats({
          totalPacientes: totalPacientesCount,
          pacientesActivos: pacientesActivosCount,
          llamadasPendientes: llamadas.count || 0,
          visitasHoy: visitas.count || 0,
        });

        const sevenDaysAgo = subDays(now, 7);
        const sixMonthsAgo = subMonths(startOfMonth(now), 5);

        const [callsRes, visitsRes, altoRiesgoRes, monthlyPacientesRes] = await Promise.all([
          applyScope(
            db
              .from("registro_llamadas")
              .select("estado, resultado_seguimiento, duracion_minutos, fecha_hora_realizada")
              .gte("created_at", `${thirtyDaysAgo}T00:00:00`) as any
          ),
          applyScope(
            db
              .from("control_visitas")
              .select("estado, fecha_hora_visita")
              .gte("fecha_hora_visita", `${thirtyDaysAgo}T00:00:00`) as any
          ),
          applyScope(
            db
              .from("pacientes")
              .select("id", { count: "exact", head: true })
              .eq("grado_dificultad", "alto") as any
          ),
          applyScope(
            db
              .from("pacientes")
              .select("created_at")
              .gte("created_at", sixMonthsAgo.toISOString()) as any
          ),
        ]);

        const callsData = callsRes.data || [];
        const visitsData = visitsRes.data || [];

        // 1. Donut: Distribución de Pacientes
        const countActivos = pacientesAll.filter((p: any) => p.status_px === "activo").length;
        const countSeguimiento = pacientesAll.filter(
          (p: any) => p.status_px === "seguimiento" || p.status_px === "alta"
        ).length;
        const countInactivos = pacientesAll.filter((p: any) => p.status_px === "inactivo").length;

        const donutSegments: DonutSegment[] =
          totalPacientesCount > 0
            ? [
                { name: "Activos", value: countActivos, fill: "hsl(var(--primary))" },
                { name: "Seguimiento", value: countSeguimiento, fill: "hsl(var(--warning))" },
                { name: "Inactivos", value: countInactivos, fill: "hsl(var(--muted-foreground))" },
              ]
            : [];
        setDonutData(donutSegments);

        // 2. BarCard: Volumen de Citas Semanales
        const days = eachDayOfInterval({ start: sevenDaysAgo, end: now });
        const dayLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
        const barPoints = days.map((d) => {
          const dateStr = format(d, "yyyy-MM-dd");
          const dayVisits = visitsData.filter(
            (v: any) => v.fecha_hora_visita && v.fecha_hora_visita.startsWith(dateStr)
          );
          const atendidas = dayVisits.filter(
            (v: any) => v.estado === "realizada" || v.estado === "atendido"
          ).length;
          const canceladas = dayVisits.filter(
            (v: any) =>
              v.estado === "cancelada" || v.estado === "no_show" || v.estado === "no_realizada"
          ).length;

          return { label: dayLabels[d.getDay()], atendidas, canceladas };
        });
        setBarData(barPoints);

        // 3. TrendCard: Forecast a 3 Meses
        const monthlyPacientes = monthlyPacientesRes.data || [];
        const historical: { periodo: string; valor: number }[] = [];

        for (let i = 0; i < 6; i++) {
          const monthDate = subMonths(now, 5 - i);
          const nextMonthStart = startOfMonth(subMonths(now, 4 - i));
          const count = monthlyPacientes.filter((p: any) => {
            const created = new Date(p.created_at);
            return created < (i === 5 ? now : nextMonthStart);
          }).length;

          historical.push({ periodo: format(monthDate, "MMM", { locale: es }), valor: count });
        }

        const forecastResult = calculateForecast(historical, 3, (i) => `Mes +${i + 1}`);
        setTrendData(forecastResult.points);

        // Stats adicionales
        const llamadasConDuracion = callsData.filter(
          (c: any) => c.duracion_minutos && c.duracion_minutos > 0
        );
        const duracionPromedio =
          llamadasConDuracion.length > 0
            ? llamadasConDuracion.reduce((sum: number, c: any) => sum + (c.duracion_minutos || 0), 0) /
              llamadasConDuracion.length
            : 0;

        const visitasRealizadas = visitsData.filter((v: any) => v.estado === "realizada").length;
        const visitasTotal = visitsData.filter(
          (v: any) => v.estado === "realizada" || v.estado === "cancelada" || v.estado === "no_realizada"
        ).length;
        const tasaCumplimiento = visitasTotal > 0 ? Math.round((visitasRealizadas / visitasTotal) * 100) : 0;

        const altoRiesgoCount = altoRiesgoRes.count || 0;
        const porcentajeAltoRiesgo =
          totalPacientesCount > 0 ? Math.round((altoRiesgoCount / totalPacientesCount) * 100) : 0;

        setExtraStats({
          duracionPromedio: Math.round(duracionPromedio * 10) / 10,
          tasaCumplimiento,
          pacientesAltoRiesgo: altoRiesgoCount,
          porcentajeAltoRiesgo,
        });
      } finally {
        setLoadingCharts(false);
      }
    };

    fetchStats();
  }, [currentUserId, currentWorkspace?.id, activeSucursalId, verticalActiva]);

  // Contabilizar alertas activas para el badge de cabecera
  const totalAlertas =
    (extraStats.pacientesAltoRiesgo > 0 ? 1 : 0) + (stats.llamadasPendientes > 0 ? 1 : 0);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Hero Banner Médico Interactivo */}
      <MedicalHeroBanner
        nombreUsuario={nombreUsuario}
        currentTime={currentTime}
        visitasHoy={stats.visitasHoy}
        sucursalNombre={currentWorkspace?.nombre || "Sede Central"}
        verticalActiva={verticalActiva}
      />

      {/* 2. Barra de Alertas y Centro de Notificaciones Compacto */}
      <div className="space-y-3">
        {/* Toggle sutil si existen alertas o recordatorios para no saturar visualmente */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/60 px-4 py-2.5 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Centro de Notificaciones & Avisos</p>
              <p className="text-xs text-muted-foreground">
                {totalAlertas > 0
                  ? `${totalAlertas} aviso(s) prioritario(s) y controles automáticos`
                  : "Todos los controles operativos están al día"}
              </p>
            </div>
            {totalAlertas > 0 && (
              <Badge variant="destructive" className="ml-1 rounded-full px-2 py-0.5 text-xs font-semibold">
                {totalAlertas} pendientes
              </Badge>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAlertCenter(!showAlertCenter)}
            className="h-8 rounded-xl gap-1.5 text-xs font-medium border-border/80 hover:bg-accent"
          >
            {showAlertCenter ? (
              <>
                <span>Ocultar detalles</span>
                <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <span>Ver avisos y recordatorios</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>

        {/* Panel Colapsable de Alertas & Onboarding */}
        {showAlertCenter && (
          <div className="space-y-4 rounded-2xl border border-border/80 bg-card/40 p-4 transition-all">
            <PlanLimitAlert resource="pacientes" />

            <AlertasAccion
              alertas={
                [
                  extraStats.pacientesAltoRiesgo > 0 && {
                    id: "alto-riesgo",
                    nivel: "critica",
                    titulo: "Pacientes de alto seguimiento",
                    detalle: `${extraStats.pacientesAltoRiesgo} pacientes (${extraStats.porcentajeAltoRiesgo}% del total) requieren confirmación prioritaria.`,
                    etiqueta: "Alta prioridad",
                    accion: { label: "Ver pacientes", to: "/pacientes" },
                  },
                  stats.llamadasPendientes > 0 && {
                    id: "llamadas-pendientes",
                    nivel: "aviso",
                    titulo: "Llamadas de seguimiento pendientes",
                    detalle: `Tienes ${stats.llamadasPendientes} llamadas agendadas o pendientes en los últimos 30 días.`,
                    etiqueta: "Seguimiento",
                    accion: { label: "Ir a llamadas", to: "/llamadas" },
                  },
                ].filter(Boolean) as AlertaAccion[]
              }
            />

            <div className="grid gap-4 md:grid-cols-2">
              <RecordatoriosDiariosWhatsApp />
              <InventarioAlertasWidget />
            </div>

            <OnboardingChecklistWidget />
          </div>
        )}
      </div>

      {/* 3. Tarjetas KPI Enriquecidas (Siempre visibles para orientación médica rápida) */}
      <EnhancedKPIs
        totalPacientes={stats.totalPacientes}
        pacientesActivos={stats.pacientesActivos}
        visitasHoy={stats.visitasHoy}
        llamadasPendientes={stats.llamadasPendientes}
        tasaCumplimiento={extraStats.tasaCumplimiento}
      />

      {/* 4. Sistema Estructurado de Navegación por Pestañas (Tabs) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
          <TabsList className="h-11 w-full sm:w-auto p-1 bg-muted/50 rounded-2xl border border-border/50 gap-1">
            <TabsTrigger
              value="operativo"
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs md:text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              <CalendarDays className="h-4 w-4" />
              <span>Operativo & Consultas</span>
            </TabsTrigger>
            <TabsTrigger
              value="analitica"
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs md:text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Analítica & Rendimiento</span>
            </TabsTrigger>
            <TabsTrigger
              value="especialidad"
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs md:text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              <Stethoscope className="h-4 w-4" />
              <span>Especialidad & Calidad</span>
            </TabsTrigger>
          </TabsList>

          <span className="text-xs text-muted-foreground font-medium hidden md:inline-block">
            {activeTab === "operativo" && "Vista clínica centrada en las consultas y flujo de pacientes del día"}
            {activeTab === "analitica" && "Tendencias poblacionales, tasas de asistencia y proyecciones"}
            {activeTab === "especialidad" && "Indicadores de especialidad, eficiencia y salud poblacional"}
          </span>
        </div>

        {/* TAB 1: OPERATIVO DEL DÍA (Vista Principal) */}
        <TabsContent value="operativo" className="space-y-6 focus-visible:outline-none">
          {/* Accesos Rápidos Contextualizados por Especialidad */}
          <QuickLinksBar />

          {/* Grid Operativo: 2 Columnas (Citas + Tratamientos + Exámenes vs Agenda & Médico) */}
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            {/* Columna Principal Izquierda */}
            <div className="min-w-0 space-y-6">
              {/* Citas Programadas para Hoy */}
              <TodayAppointmentsTable />

              {/* Prescripciones y Tratamientos Activos */}
              <ActiveTreatmentWidget />

              {/* Banda de Monitoreo de Exámenes Clínicos */}
              <ExaminationsWidget />
            </div>

            {/* Columna Lateral Derecha */}
            <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
              <AgendaDiaPanel />
              <PhysicianProfileCard />
              <DoctorScheduleWidget />
            </aside>
          </div>
        </TabsContent>

        {/* TAB 2: ANALÍTICA & RENDIMIENTO */}
        <TabsContent value="analitica" className="space-y-6 focus-visible:outline-none">
          {/* Fila Gráficos: Distribución Donut + Volumen de Citas Semanales */}
          <div className="grid gap-6 lg:grid-cols-2">
            <DonutCard
              title="Distribución de Pacientes por Estado"
              description="Activos, inactivos y en seguimiento continuo"
              periodo="Población General"
              data={donutData}
              centerLabel="Pacientes"
              loading={loadingCharts}
            />

            <BarCard
              title="Volumen de Citas Semanales"
              description="Asistencias efectivas vs canceladas o inasistencias"
              periodo="Últimos 7 días"
              data={barData}
              xAxisKey="label"
              stacked
              series={[
                { key: "atendidas", label: "Atendidas / Asistencias", color: "hsl(var(--primary))" },
                { key: "canceladas", label: "Canceladas / Inasistencias", color: "hsl(var(--destructive))" },
              ]}
              loading={loadingCharts}
            />
          </div>

          {/* Proyección y Forecast con intervalo */}
          <TrendCard
            title="Proyección de Pacientes y Consultas"
            periodo="Histórico 6 meses + Proyección a 3 meses con IA"
            data={trendData}
            loading={loadingCharts}
          />

          {/* Indicadores de Rendimiento y Pacientes Recientes */}
          <div className="grid gap-6 lg:grid-cols-2">
            <VitalStatsCards />
            <NewPatientsWidget />
          </div>
        </TabsContent>

        {/* TAB 3: ESPECIALIDAD & CALIDAD */}
        <TabsContent value="especialidad" className="space-y-6 focus-visible:outline-none">
          {/* Métricas Especializadas por Vertical Médica Activa */}
          <VerticalMetricsWidget />

          {/* Score Clínico de Salud */}
          <HealthScoreWidget />

          {/* Eficiencia Operativa y Seguridad del Paciente */}
          <OperationalEfficiencyCards
            duracionPromedio={extraStats.duracionPromedio}
            tasaCumplimiento={extraStats.tasaCumplimiento}
            pacientesAltoRiesgo={extraStats.pacientesAltoRiesgo}
            porcentajeAltoRiesgo={extraStats.porcentajeAltoRiesgo}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
