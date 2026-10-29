import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { InteractiveKPI } from "@/components/InteractiveKPI";
import { RecordatoriosDiariosWhatsApp } from "@/components/RecordatoriosDiariosWhatsApp";
import { InventarioAlertasWidget } from "@/components/InventarioAlertasWidget";
import { AgendarCitaButton } from "@/components/AgendarCitaButton";
import { PlanLimitAlert } from "@/components/PlanLimitAlert";
import { OnboardingChecklistWidget } from "@/components/dashboard/OnboardingChecklistWidget";
import { AlertasAccion, type AlertaAccion } from "@/components/dashboard/AlertasAccion";
import { AgendaDiaPanel } from "@/components/dashboard/AgendaDiaPanel";
import { Button } from "@/components/ui/button";
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
    // Basta con refrescar cada minuto (antes re-renderizaba todo el dashboard cada segundo)
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: perfil } = await supabase.from("profiles").select("nombre").eq("id", user.id).maybeSingle();
        setNombreUsuario((perfil as any)?.nombre ?? "");
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUserId) return;

      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30).toISOString().split('T')[0];
      const today = now.toISOString().split('T')[0];
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();

      // Determinar el id de personal_salud relacionado al usuario actual (para filtros de citas)
      const { data: personalRow } = await supabase
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

      const [pacientesRes, llamadas, visitas] = await Promise.all([
        applyScope(supabase.from("pacientes").select("id, status_px") as any),
        applyScope(supabase.from("registro_llamadas").select("id", { count: "exact", head: true }).in("estado", ["agendada", "pendiente"]).eq("profesional_id", profesionalId).gte("fecha_agendada", thirtyDaysAgo).lte("fecha_agendada", `${today}T23:59:59`) as any),
        applyScope(supabase.from("control_visitas").select("id", { count: "exact", head: true }).eq("estado", "pendiente").eq("profesional_id", profesionalId).gte("fecha_hora_visita", todayStart).lte("fecha_hora_visita", todayEnd) as any),
      ]);

      const pacientesAll = pacientesRes.data || [];
      const totalPacientesCount = pacientesAll.length;
      const pacientesActivosCount = pacientesAll.filter(p => p.status_px === 'activo').length;

      setStats({
        totalPacientes: totalPacientesCount,
        pacientesActivos: pacientesActivosCount,
        llamadasPendientes: llamadas.count || 0,
        visitasHoy: visitas.count || 0,
      });

      // Fetch real chart data - últimos 30 días (TODOS los registros, no solo del profesional)
      const sevenDaysAgo = subDays(now, 7);
      const sixMonthsAgo = subMonths(startOfMonth(now), 5);

      const [callsRes, visitsRes, weekCallsRes, weekVisitsRes, altoRiesgoRes, monthlyPacientesRes] = await Promise.all([
        applyScope(
          supabase
            .from("registro_llamadas")
            .select("estado, resultado_seguimiento, duracion_minutos, fecha_hora_realizada")
            .gte("created_at", `${thirtyDaysAgo}T00:00:00`) as any
        ),
        applyScope(
          supabase
            .from("control_visitas")
            .select("estado, fecha_hora_visita")
            .gte("fecha_hora_visita", `${thirtyDaysAgo}T00:00:00`) as any
        ),
        applyScope(
          supabase
            .from("registro_llamadas")
            .select("fecha_agendada")
            .gte("fecha_agendada", sevenDaysAgo.toISOString())
            .lte("fecha_agendada", todayEnd) as any
        ),
        applyScope(
          supabase
            .from("control_visitas")
            .select("fecha_hora_visita")
            .gte("fecha_hora_visita", sevenDaysAgo.toISOString())
            .lte("fecha_hora_visita", todayEnd) as any
        ),
        applyScope(
          supabase
            .from("pacientes")
            .select("id", { count: "exact", head: true })
            .eq("grado_dificultad", "alto") as any
        ),
        applyScope(
          supabase
            .from("pacientes")
            .select("created_at")
            .gte("created_at", sixMonthsAgo.toISOString()) as any
        ),
      ]);

      const callsData = callsRes.data || [];
      const visitsData = visitsRes.data || [];

      // Distribución de llamadas
      const totalCalls = callsData.length;
      const contactadas = callsData.filter(c => c.resultado_seguimiento === 'contactado').length;
      const noContactadas = callsData.filter(c => c.resultado_seguimiento === 'no_contestada').length;
      const pendientesCalls = callsData.filter(c => c.estado === 'pendiente' || c.estado === 'agendada').length;

      // 1. Donut: Distribución de Pacientes por Estado (activo, inactivo, seguimiento)
      const countActivos = pacientesAll.filter(p => p.status_px === 'activo').length;
      const countSeguimiento = pacientesAll.filter(p => p.status_px === 'seguimiento' || p.status_px === 'alta').length;
      const countInactivos = pacientesAll.filter(p => p.status_px === 'inactivo').length;

      const donutSegments: DonutSegment[] = totalPacientesCount > 0 ? [
        { name: "Activos", value: countActivos, fill: "hsl(var(--primary))" },
        { name: "Seguimiento", value: countSeguimiento, fill: "hsl(var(--warning))" },
        { name: "Inactivos", value: countInactivos, fill: "hsl(var(--muted-foreground))" },
      ] : [];
      setDonutData(donutSegments);

      // 2. BarCard: Volumen de Citas Semanales (Atendidas vs Canceladas / Inasistencias)
      const days = eachDayOfInterval({ start: sevenDaysAgo, end: now });
      const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const barPoints = days.map((d) => {
        const dateStr = format(d, 'yyyy-MM-dd');
        const dayVisits = visitsData.filter(v => v.fecha_hora_visita && v.fecha_hora_visita.startsWith(dateStr));
        const atendidas = dayVisits.filter(v => v.estado === 'realizada' || v.estado === 'atendido').length;
        const canceladas = dayVisits.filter(v => v.estado === 'cancelada' || v.estado === 'no_show' || v.estado === 'no_realizada').length;

        return { label: dayLabels[d.getDay()], atendidas, canceladas };
      });
      setBarData(barPoints);

      // 3. TrendCard: Tendencia Histórica de Pacientes y Forecast a 3 Meses
      const monthlyPacientes = monthlyPacientesRes.data || [];
      const historical: { periodo: string; valor: number }[] = [];

      for (let i = 0; i < 6; i++) {
        const monthDate = subMonths(now, 5 - i);
        const nextMonthStart = startOfMonth(subMonths(now, 4 - i));
        const count = monthlyPacientes.filter(p => {
          const created = new Date(p.created_at);
          return created < (i === 5 ? now : nextMonthStart);
        }).length;

        historical.push({ periodo: format(monthDate, 'MMM', { locale: es }), valor: count });
      }

      const forecastResult = calculateForecast(historical, 3, (i) => `Mes +${i + 1}`);
      setTrendData(forecastResult.points);

      // Stats adicionales
      const llamadasConDuracion = callsData.filter(c => c.duracion_minutos && c.duracion_minutos > 0);
      const duracionPromedio = llamadasConDuracion.length > 0
        ? llamadasConDuracion.reduce((sum, c) => sum + (c.duracion_minutos || 0), 0) / llamadasConDuracion.length
        : 0;

      const visitasRealizadas = visitsData.filter(v => v.estado === 'realizada').length;
      const visitasTotal = visitsData.filter(v => v.estado === 'realizada' || v.estado === 'cancelada' || v.estado === 'no_realizada').length;
      const tasaCumplimiento = visitasTotal > 0 ? Math.round((visitasRealizadas / visitasTotal) * 100) : 0;

      const altoRiesgoCount = altoRiesgoRes.count || 0;
      const porcentajeAltoRiesgo = totalPacientesCount > 0 ? Math.round((altoRiesgoCount / totalPacientesCount) * 100) : 0;

      setExtraStats({
        duracionPromedio: Math.round(duracionPromedio * 10) / 10,
        tasaCumplimiento,
        pacientesAltoRiesgo: altoRiesgoCount,
        porcentajeAltoRiesgo,
      });
    };

    fetchStats();
  }, [currentUserId, currentWorkspace?.id, activeSucursalId, verticalActiva]);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--warning))"];
  const localTime = toZonedTime(currentTime, timezone);

  const hora = localTime.getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="space-y-6">
      {/* 1. Hero Banner Médico Interactivo (Inspirado en MediCore AI, Youcare y DocuCare) */}
      <MedicalHeroBanner
        nombreUsuario={nombreUsuario}
        currentTime={currentTime}
        visitasHoy={stats.visitasHoy}
        sucursalNombre={currentWorkspace?.nombre || "Sede Central"}
        verticalActiva={verticalActiva}
      />

      {/* Alerta de límite del plan (cerca o alcanzado) */}
      <PlanLimitAlert resource="pacientes" />

      {/* Alertas accionables con datos reales del centro */}
      <AlertasAccion
        alertas={[
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
        ].filter(Boolean) as AlertaAccion[]}
      />

      {/* Checklist guiada de activación del centro clínico (Fase 8) */}
      <OnboardingChecklistWidget />

      {/* Recordatorios WhatsApp del día siguiente */}
      <RecordatoriosDiariosWhatsApp />

      {/* Alertas de inventario (bajo stock + vencimientos) */}
      <InventarioAlertasWidget />

      {/* 2. Tarjetas KPI Enriquecidas (Inspiradas en Imagen 1 Careline y CareSpace) */}
      <EnhancedKPIs
        totalPacientes={stats.totalPacientes}
        pacientesActivos={stats.pacientesActivos}
        visitasHoy={stats.visitasHoy}
        llamadasPendientes={stats.llamadasPendientes}
        tasaCumplimiento={extraStats.tasaCumplimiento}
      />

      {/* 3. Barra de Accesos Rápidos Clínicos (Inspirada en MediCore AI y Youcare) */}
      <QuickLinksBar />

      {/* 4. Banda de Monitoreo Clínico Pastel (Inspirada en Examinations de la tableta) */}
      <ExaminationsWidget />

      {/* 5. Contenido principal (2 Columnas: Clínico & Agenda / Equipo) */}
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* Columna Izquierda: Citas de Hoy + Gráficos Analíticos */}
        <div className="min-w-0 space-y-6">
          {/* Citas Programadas para Hoy (Inspirada en Careline) */}
          <TodayAppointmentsTable />

          <div className="grid gap-6 md:grid-cols-2">
            {/* Donut: Distribución de Pacientes por Estado */}
            <DonutCard
              title="Distribución de Pacientes por Estado"
              description="Activo, inactivo y en seguimiento"
              periodo="Total Pacientes"
              data={donutData}
              centerLabel="Pacientes"
              loading={loadingCharts}
            />

            {/* Barras: Volumen de Citas Semanales */}
            <BarCard
              title="Volumen de Citas Semanales"
              description="Atendidas vs. canceladas / inasistencias"
              periodo="Últimos 7 días"
              data={barData}
              xAxisKey="label"
              stacked
              series={[
                { key: "atendidas", label: "Atendidas / Asistencias", color: "hsl(var(--primary))" },
                { key: "canceladas", label: "Canceladas / No-Show", color: "hsl(var(--destructive))" },
              ]}
              loading={loadingCharts}
            />
          </div>

          {/* Proyección con Forecast e Intervalo de Confianza */}
          <TrendCard
            title="Proyección de Pacientes y Consultas"
            periodo="Histórico 6 meses + Proyección a 3 meses"
            data={trendData}
            loading={loadingCharts}
          />

          {/* Métricas Especializadas por Vertical Médica */}
          <VerticalMetricsWidget className="pt-2" />
        </div>

        {/* Columna Derecha: Agenda del Día + Médico Activo + Disponibilidad de Equipo */}
        <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
          <AgendaDiaPanel />
          <PhysicianProfileCard />
          <DoctorScheduleWidget />
        </aside>
      </div>

      {/* 6. Score Clínico de Salud y Ondas de Salud (Inspirado en AI Healthcare 88) */}
      <HealthScoreWidget />

      {/* 7. Prescripciones y Tratamientos Activos (Inspirado en MediApp Pro) */}
      <ActiveTreatmentWidget />

      {/* 8. Indicadores de Calidad y Signos Vitales (Inspirado en Today's Achievement) */}
      <VitalStatsCards />

      {/* 9. Pacientes Recientes (Inspirado en CareSpace) */}
      <NewPatientsWidget />

      {/* 10. Resumen Operativo y Calidad Clínica (Inspirado en DocuCare y Healthence) */}
      <OperationalEfficiencyCards
        duracionPromedio={extraStats.duracionPromedio}
        tasaCumplimiento={extraStats.tasaCumplimiento}
        pacientesAltoRiesgo={extraStats.pacientesAltoRiesgo}
        porcentajeAltoRiesgo={extraStats.porcentajeAltoRiesgo}
      />
    </div>
  );
};

export default Dashboard;

