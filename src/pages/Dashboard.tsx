import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Phone, Calendar, AlertCircle, TrendingUp, Activity, Clock, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InteractiveKPI } from "@/components/InteractiveKPI";
import { format, subDays, startOfDay, endOfDay, startOfMonth, subMonths, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalPacientes: 0,
    pacientesActivos: 0,
    llamadasPendientes: 0,
    visitasHoy: 0,
  });

  const [chartData, setChartData] = useState({
    weeklyActivity: [] as any[],
    callsDistribution: [] as any[],
    visitsStatus: [] as any[],
    monthlyTrend: [] as any[],
  });

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

      const [pacientesRes, llamadas, visitas] = await Promise.all([
        supabase.from("pacientes").select("id, status_px"),
        supabase.from("registro_llamadas").select("id", { count: "exact", head: true }).in("estado", ["agendada", "pendiente"]).eq("profesional_id", profesionalId).gte("fecha_agendada", thirtyDaysAgo).lte("fecha_agendada", `${today}T23:59:59`),
        supabase.from("control_visitas").select("id", { count: "exact", head: true }).eq("estado", "pendiente").eq("profesional_id", profesionalId).gte("fecha_hora_visita", todayStart).lte("fecha_hora_visita", todayEnd),
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
        supabase
          .from("registro_llamadas")
          .select("estado, resultado_seguimiento, duracion_minutos, fecha_hora_realizada")
          .gte("created_at", `${thirtyDaysAgo}T00:00:00`),
        supabase
          .from("control_visitas")
          .select("estado, fecha_hora_visita")
          .gte("fecha_hora_visita", `${thirtyDaysAgo}T00:00:00`),
        supabase
          .from("registro_llamadas")
          .select("fecha_agendada")
          .gte("fecha_agendada", sevenDaysAgo.toISOString())
          .lte("fecha_agendada", todayEnd),
        supabase
          .from("control_visitas")
          .select("fecha_hora_visita")
          .gte("fecha_hora_visita", sevenDaysAgo.toISOString())
          .lte("fecha_hora_visita", todayEnd),
        supabase
          .from("pacientes")
          .select("id", { count: "exact", head: true })
          .eq("grado_dificultad", "alto"),
        supabase
          .from("pacientes")
          .select("created_at")
          .gte("created_at", sixMonthsAgo.toISOString()),
      ]);

      const callsData = callsRes.data || [];
      const visitsData = visitsRes.data || [];

      // Distribución de llamadas
      const totalCalls = callsData.length;
      const contactadas = callsData.filter(c => c.resultado_seguimiento === 'contactado').length;
      const noContactadas = callsData.filter(c => c.resultado_seguimiento === 'no_contestada').length;
      const pendientesCalls = callsData.filter(c => c.estado === 'pendiente' || c.estado === 'agendada').length;

      // Actividad semanal (últimos 7 días)
      const days = eachDayOfInterval({ start: sevenDaysAgo, end: now });
      const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const weeklyActivity = days.map(d => {
        const dateStr = format(d, 'yyyy-MM-dd');
        const llamadasCount = (weekCallsRes.data || []).filter(c =>
          c.fecha_agendada && c.fecha_agendada.startsWith(dateStr)
        ).length;
        const visitasCount = (weekVisitsRes.data || []).filter(v =>
          v.fecha_hora_visita && v.fecha_hora_visita.startsWith(dateStr)
        ).length;
        return { name: dayLabels[d.getDay()], llamadas: llamadasCount, visitas: visitasCount };
      });

      // Tendencia mensual de pacientes (acumulado por mes)
      const monthlyPacientes = monthlyPacientesRes.data || [];
      const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
        const monthDate = subMonths(now, 5 - i);
        const monthStart = startOfMonth(monthDate);
        const nextMonthStart = startOfMonth(subMonths(now, 4 - i));
        const count = monthlyPacientes.filter(p => {
          const created = new Date(p.created_at);
          return created < (i === 5 ? now : nextMonthStart);
        }).length;
        return { name: format(monthDate, 'MMM', { locale: es }), pacientes: count };
      });

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

      setChartData({
        weeklyActivity,
        callsDistribution: [
          { name: "Contestadas", value: totalCalls > 0 ? Math.round((contactadas / totalCalls) * 100) : 0, color: "hsl(var(--success))" },
          { name: "No Contestadas", value: totalCalls > 0 ? Math.round((noContactadas / totalCalls) * 100) : 0, color: "hsl(var(--warning))" },
          { name: "Pendientes", value: totalCalls > 0 ? Math.round((pendientesCalls / totalCalls) * 100) : 0, color: "hsl(var(--muted))" },
        ],
        visitsStatus: [
          { name: "Realizadas", value: visitsData.filter(v => v.estado === 'realizada').length },
          { name: "Pendientes", value: visitsData.filter(v => v.estado === 'pendiente').length },
          { name: "Canceladas", value: visitsData.filter(v => v.estado === 'cancelada').length },
        ],
        monthlyTrend,
      });
    };

    fetchStats();
  }, [currentUserId]);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--warning))"];
  const dominicanTime = toZonedTime(currentTime, "America/Santo_Domingo");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Resumen completo del seguimiento de pacientes</p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground bg-card p-3 rounded-lg border">
          <Clock className="h-5 w-5" />
          <div className="text-right">
            <div className="text-sm font-medium text-foreground">
              {format(dominicanTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </div>
            <div className="text-lg font-bold text-primary">
              {format(dominicanTime, "hh:mm:ss a", { locale: es })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid with Interactive KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <InteractiveKPI
          title="Total Pacientes"
          value={stats.totalPacientes}
          subtitle={`${stats.pacientesActivos} activos`}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          onClick={() => navigate('/pacientes')}
          color="primary"
        />
        <InteractiveKPI
          title="Llamadas Pendientes"
          value={stats.llamadasPendientes}
          subtitle="Por realizar"
          icon={Phone}
          trend={{ value: 5, isPositive: false }}
          onClick={() => navigate('/llamadas')}
          color="warning"
        />
        <InteractiveKPI
          title="Visitas Hoy"
          value={stats.visitasHoy}
          subtitle="Programadas"
          icon={Calendar}
          trend={{ value: 8, isPositive: true }}
          onClick={() => navigate('/visitas')}
          color="success"
        />
        <InteractiveKPI
          title="Ver Calendario"
          value="Agenda"
          subtitle="Citas y visitas"
          icon={CalendarDays}
          onClick={() => navigate('/calendario')}
          color="secondary"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Semanal</CardTitle>
            <CardDescription>Llamadas y visitas por día</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip />
                <Legend />
                <Bar dataKey="llamadas" fill="hsl(var(--primary))" name="Llamadas" />
                <Bar dataKey="visitas" fill="hsl(var(--secondary))" name="Visitas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Calls Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Llamadas</CardTitle>
            <CardDescription>Estado de las llamadas del mes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.callsDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {chartData.callsDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Visits Status */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Visitas</CardTitle>
            <CardDescription>Resumen mensual de visitas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.visitsStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" className="text-muted-foreground" />
                <YAxis dataKey="name" type="category" className="text-muted-foreground" />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Pacientes</CardTitle>
            <CardDescription>Últimos 5 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="pacientes"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
                  name="Pacientes"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Tiempo Promedio de Llamada</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{extraStats.duracionPromedio} min</div>
            <p className="text-xs text-muted-foreground">Promedio últimos 30 días</p>
            <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${Math.min(extraStats.duracionPromedio * 10, 100)}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Visitas Completadas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{extraStats.tasaCumplimiento}%</div>
            <p className="text-xs text-muted-foreground">Tasa de cumplimiento</p>
            <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-success" style={{ width: `${extraStats.tasaCumplimiento}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pacientes de Alto Riesgo</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{extraStats.pacientesAltoRiesgo}</div>
            <p className="text-xs text-muted-foreground">Requieren atención urgente</p>
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
