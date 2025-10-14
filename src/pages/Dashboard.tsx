import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Phone, Calendar, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPacientes: 0,
    pacientesActivos: 0,
    llamadasPendientes: 0,
    visitasHoy: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [pacientes, activos, llamadas, visitas] = await Promise.all([
        supabase.from("pacientes").select("id", { count: "exact", head: true }),
        supabase.from("pacientes").select("id", { count: "exact", head: true }).eq("status_px", "activo"),
        supabase.from("parametros_seguimiento").select("id", { count: "exact", head: true }).lte("fecha_proxima_llamada_prog", new Date().toISOString().split("T")[0]),
        supabase.from("control_visitas").select("id", { count: "exact", head: true }).eq("estado", "pendiente").gte("fecha_hora_visita", new Date().toISOString().split("T")[0]).lte("fecha_hora_visita", new Date(new Date().setHours(23, 59, 59)).toISOString()),
      ]);

      setStats({
        totalPacientes: pacientes.count || 0,
        pacientesActivos: activos.count || 0,
        llamadasPendientes: llamadas.count || 0,
        visitasHoy: visitas.count || 0,
      });
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Pacientes",
      value: stats.totalPacientes,
      description: `${stats.pacientesActivos} activos`,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Llamadas Pendientes",
      value: stats.llamadasPendientes,
      description: "Por realizar hoy",
      icon: Phone,
      color: "text-warning",
    },
    {
      title: "Visitas Hoy",
      value: stats.visitasHoy,
      description: "Programadas",
      icon: Calendar,
      color: "text-secondary",
    },
    {
      title: "Alertas",
      value: 0,
      description: "Pacientes sin contacto",
      icon: AlertCircle,
      color: "text-destructive",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Resumen del seguimiento de pacientes</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Llamadas Prioritarias</CardTitle>
            <CardDescription>Seguimientos urgentes y reprogramaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              No hay llamadas prioritarias pendientes
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visitas Próximas</CardTitle>
            <CardDescription>Citas programadas en los próximos días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              No hay visitas próximas programadas
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
