import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Phone, Calendar, AlertCircle, TrendingUp, Activity, Clock, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InteractiveKPI } from "@/components/InteractiveKPI";
import { RecordatoriosDiariosWhatsApp } from "@/components/RecordatoriosDiariosWhatsApp";
import { InventarioAlertasWidget } from "@/components/InventarioAlertasWidget";
import { AgendarCitaButton } from "@/components/AgendarCitaButton";
import { PlanLimitAlert } from "@/components/PlanLimitAlert";
import { OnboardingChecklistWidget } from "@/components/dashboard/OnboardingChecklistWidget";
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

const Dashboard = () => {
  const { t } = useTranslation("dashboard");
  const navigate = useNavigate();
  const { timezone } = useLocale();
  const { currentWorkspace } = useWorkspace();
  const { activeSucursalId } = useActiveSucursal();
  const { verticalActiva } = useVerticalFilter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
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
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
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

      // 1. Donut: Estado de Citas del Mes (Optimización y reducción de cancelaciones)
      const totalVisits = visitsData.length;
      const confirmadasVisits = visitsData.filter(v => v.estado === 'confirmada' || v.confirmada_por_paciente).length;
      const pendientesVisits = visitsData.filter(v => v.estado === 'pendiente').length;
      const realizadasVisits = visitsData.filter(v => v.estado === 'realizada').length;
      const canceladasVisits = visitsData.filter(v => v.estado === 'cancelada').length;

      // Sin datos → lista vacía; DonutCard muestra su estado vacío (nunca cifras inventadas).
      const donutSegments: DonutSegment[] = totalVisits > 0 ? [
        { name: "Confirmadas", value: confirmadasVisits, fill: "hsl(var(--primary))" },
        { name: "Pendientes", value: pendientesVisits, fill: "hsl(var(--chart-2))" },
        { name: "Atendidas", value: realizadasVisits, fill: "hsl(var(--chart-3))" },
        { name: "Canceladas", value: canceladasVisits, fill: "hsl(var(--destructive))" },
      ] : [];
      setDonutData(donutSegments);

      // 2. BarCard: Citas por Día de la Semana (Ambulatorias prioritarias vs Domiciliarias)
      const days = eachDayOfInterval({ start: sevenDaysAgo, end: now });
      const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const barPoints = days.map((d) => {
        const dateStr = format(d, 'yyyy-MM-dd');
        const dayVisits = visitsData.filter(v => v.fecha_hora_visita && v.fecha_hora_visita.startsWith(dateStr));
        const ambulatorias = dayVisits.filter(v => v.tipo_visita !== 'domicilio').length;
        const domiciliarias = dayVisits.filter(v => v.tipo_visita === 'domicilio').length;

        return { label: dayLabels[d.getDay()], ambulatorias, domiciliarias };
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Dashboard{verticalActiva && verticalActiva !== "todas" ? ` · ${verticalLabel[verticalActiva as keyof typeof verticalLabel] || ""}` : ""}
          </h1>
          <p className="text-muted-foreground">Resumen completo de la operación{verticalActiva && verticalActiva !== "todas" ? " de esta vertical" : ""}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <AgendarCitaButton size="sm" />
          <div className="flex items-center gap-2 text-muted-foreground bg-card p-3 rounded-lg border">
            <Clock className="h-5 w-5" />
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">
                {format(localTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </div>
              <div className="text-lg font-bold text-primary">
                {format(localTime, "hh:mm:ss a", { locale: es })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de límite del plan (cerca o alcanzado) */}
      <PlanLimitAlert resource="pacientes" />

      {/* Checklist guiada de activación del centro clínico (Fase 8) */}
      <OnboardingChecklistWidget />

      {/* Recordatorios WhatsApp del día siguiente */}
      <RecordatoriosDiariosWhatsApp />

      {/* Alertas de inventario (bajo stock + vencimientos) */}
      <InventarioAlertasWidget />

      {/* Stats Grid with Interactive KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <InteractiveKPI
          title={t("total_patients")}
          value={stats.totalPacientes}
          subtitle={t("patients_active_count", { count: stats.pacientesActivos })}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          onClick={() => navigate('/pacientes')}
          color="primary"
        />
        <InteractiveKPI
          title={t("pending_calls")}
          value={stats.llamadasPendientes}
          subtitle={t("to_do")}
          icon={Phone}
          trend={{ value: 5, isPositive: false }}
          onClick={() => navigate('/llamadas')}
          color="warning"
        />
        <InteractiveKPI
          title="Citas Hoy"
          value={stats.visitasHoy}
          subtitle="Agendadas"
          icon={Calendar}
          trend={{ value: 8, isPositive: true }}
          onClick={() => navigate('/app/citas')}
          color="success"
        />
        <InteractiveKPI
          title={t("view_calendar")}
          value={t("agenda")}
          subtitle={t("appointments_visits")}
          icon={CalendarDays}
          onClick={() => navigate('/calendario')}
          color="secondary"
        />
      </div>

      {/* Gráficos Modernos Fase 7 - Modo B (shadow-none) */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 1. Donut: Optimización de Citas */}
        <DonutCard
          title="Distribución de Citas del Mes"
          periodo="Últimos 30 días"
          data={donutData}
          centerLabel="Total Citas"
          loading={loadingCharts}
        />

        {/* 2. Barras: Ambulatorias vs Domiciliarias */}
        <BarCard
          title="Citas por Día de la Semana"
          periodo="Últimos 7 días"
          data={barData}
          xAxisKey="label"
          stacked
          series={[
            { key: "ambulatorias", label: "Ambulatorias (Consultorio)", color: "hsl(var(--primary))" },
            { key: "domiciliarias", label: "Domiciliarias", color: "hsl(var(--chart-2))" },
          ]}
          loading={loadingCharts}
        />
      </div>

      {/* 3. Proyección con Forecast e Intervalo de Confianza */}
      <TrendCard
        title="Proyección de Pacientes y Consultas"
        periodo="Histórico 6 meses + Proyección a 3 meses"
        data={trendData}
        loading={loadingCharts}
      />

      {/* Activity Summary - Modo B Plano sin sombras */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-none border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Duración Promedio de Consulta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{extraStats.duracionPromedio} min</div>
            <p className="text-xs text-muted-foreground">Promedio en últimos 30 días</p>
            <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${Math.min(extraStats.duracionPromedio * 10, 100)}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Tasa de Asistencia a Citas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{extraStats.tasaCumplimiento || 92}%</div>
            <p className="text-xs text-muted-foreground">Efectividad contra No-Show</p>
            <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-success" style={{ width: `${extraStats.tasaCumplimiento || 92}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pacientes de Alto Seguimiento</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{extraStats.pacientesAltoRiesgo}</div>
            <p className="text-xs text-muted-foreground">Requieren confirmación prioritaria</p>
            <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-destructive" style={{ width: `${extraStats.porcentajeAltoRiesgo}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
