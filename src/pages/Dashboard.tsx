import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Phone, Calendar, AlertCircle, TrendingUp, Activity, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/StatsCard";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
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
  const [currentTime, setCurrentTime] = useState(new Date());
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

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      const [pacientes, activos, llamadas, visitas] = await Promise.all([
        supabase.from("pacientes").select("id", { count: "exact", head: true }),
        supabase.from("pacientes").select("id", { count: "exact", head: true }).eq("status_px", "activo"),
        supabase.from("registro_llamadas").select("id", { count: "exact", head: true }).in("estado", ["agendada", "pendiente"]),
        supabase.from("control_visitas").select("id", { count: "exact", head: true }).eq("estado", "pendiente").gte("fecha_hora_visita", new Date().toISOString().split("T")[0]).lte("fecha_hora_visita", new Date(new Date().setHours(23, 59, 59)).toISOString()),
      ]);

      setStats({
        totalPacientes: pacientes.count || 0,
        pacientesActivos: activos.count || 0,
        llamadasPendientes: llamadas.count || 0,
        visitasHoy: visitas.count || 0,
      });

      // Mock data for charts
      setChartData({
        weeklyActivity: [
          { name: "Lun", llamadas: 12, visitas: 8 },
          { name: "Mar", llamadas: 19, visitas: 12 },
          { name: "Mié", llamadas: 15, visitas: 10 },
          { name: "Jue", llamadas: 22, visitas: 15 },
          { name: "Vie", llamadas: 18, visitas: 11 },
        ],
        callsDistribution: [
          { name: "Contestadas", value: 75, color: "hsl(var(--success))" },
          { name: "No Contestadas", value: 15, color: "hsl(var(--warning))" },
          { name: "Pendientes", value: 10, color: "hsl(var(--muted))" },
        ],
        visitsStatus: [
          { name: "Realizadas", value: 45 },
          { name: "Pendientes", value: 20 },
          { name: "Canceladas", value: 8 },
        ],
        monthlyTrend: [
          { name: "Ene", pacientes: 120 },
          { name: "Feb", pacientes: 135 },
          { name: "Mar", pacientes: 148 },
          { name: "Abr", pacientes: 162 },
          { name: "May", pacientes: 175 },
        ],
      });
    };

    fetchStats();
  }, []);

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

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Pacientes"
          value={stats.totalPacientes}
          description={`${stats.pacientesActivos} activos`}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Llamadas Pendientes"
          value={stats.llamadasPendientes}
          description="Por realizar hoy"
          icon={Phone}
          trend={{ value: 5, isPositive: false }}
        />
        <StatsCard
          title="Visitas Hoy"
          value={stats.visitasHoy}
          description="Programadas"
          icon={Calendar}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Tasa de Respuesta"
          value="87%"
          description="Última semana"
          icon={TrendingUp}
          trend={{ value: 3, isPositive: true }}
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
            <div className="text-2xl font-bold">8.5 min</div>
            <p className="text-xs text-muted-foreground">+2.1 min desde el mes pasado</p>
            <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: "75%" }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Visitas Completadas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">Tasa de cumplimiento</p>
            <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-success" style={{ width: "92%" }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pacientes de Alto Riesgo</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Requieren atención urgente</p>
            <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-destructive" style={{ width: "15%" }} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
