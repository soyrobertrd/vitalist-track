import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Users, Stethoscope } from "lucide-react";
import { useOGTICZonas } from "@/hooks/useOGTICZonas";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', '#8884d8', '#82ca9d', '#ffc658'];

export default function DashboardGeografico() {
  const { zonas } = useOGTICZonas();

  const { data: distribucionPacientes, isLoading: loadingPacientes } = useQuery({
    queryKey: ["distribucion-pacientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pacientes")
        .select("zona, status_px")
        .eq("status_px", "activo");

      if (error) throw error;

      const distribution: Record<string, number> = {};
      data?.forEach((p) => {
        if (p.zona) {
          distribution[p.zona] = (distribution[p.zona] || 0) + 1;
        }
      });

      return Object.entries(distribution).map(([zona, count]) => {
        const zonaData = zonas.find(z => z.value === zona);
        return {
          zona: zonaData?.label || zona.replace(/_/g, " "),
          pacientes: count,
        };
      });
    },
  });

  const { data: distribucionProfesionales, isLoading: loadingProfesionales } = useQuery({
    queryKey: ["distribucion-profesionales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("personal_salud")
        .select("zona, especialidad")
        .eq("activo", true);

      if (error) throw error;

      const distribution: Record<string, number> = {};
      data?.forEach((p) => {
        if (p.zona) {
          distribution[p.zona] = (distribution[p.zona] || 0) + 1;
        }
      });

      return Object.entries(distribution).map(([zona, count]) => {
        const zonaData = zonas.find(z => z.value === zona);
        return {
          zona: zonaData?.label || zona.replace(/_/g, " "),
          profesionales: count,
        };
      });
    },
  });

  const { data: asignaciones } = useQuery({
    queryKey: ["asignaciones-por-zona"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pacientes")
        .select(`
          zona,
          profesional_asignado_id,
          profesional:personal_salud!profesional_asignado_id(nombre, apellido)
        `)
        .eq("status_px", "activo")
        .not("profesional_asignado_id", "is", null);

      if (error) throw error;

      const zonasSet = new Set(data?.map(p => p.zona) || []);
      return Array.from(zonasSet).map(zona => {
        const pacientesZona = data?.filter(p => p.zona === zona) || [];
        const profesionalesUnicos = new Set(pacientesZona.map(p => p.profesional_asignado_id));
        const zonaData = zonas.find(z => z.value === zona);
        
        return {
          zona: zonaData?.label || zona?.replace(/_/g, " ") || "Sin zona",
          pacientes: pacientesZona.length,
          profesionales: profesionalesUnicos.size,
          ratio: (pacientesZona.length / profesionalesUnicos.size).toFixed(1),
        };
      });
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["stats-geograficas"],
    queryFn: async () => {
      const { count: totalPacientes } = await supabase
        .from("pacientes")
        .select("*", { count: "exact", head: true })
        .eq("status_px", "activo");

      const { count: totalProfesionales } = await supabase
        .from("personal_salud")
        .select("*", { count: "exact", head: true })
        .eq("activo", true);

      const { data: zonasData } = await supabase
        .from("pacientes")
        .select("zona")
        .eq("status_px", "activo");

      const zonasUnicas = new Set(zonasData?.map(p => p.zona).filter(Boolean));

      return {
        totalPacientes,
        totalProfesionales,
        zonasActivas: zonasUnicas.size,
      };
    },
  });

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Geográfico</h1>
            <p className="text-muted-foreground">
              Distribución de pacientes y profesionales por zona
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Zonas Activas</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.zonasActivas || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalPacientes || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Profesionales</CardTitle>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalProfesionales || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Pacientes por Zona</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPacientes ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={distribucionPacientes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="zona" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="pacientes" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución de Profesionales por Zona</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingProfesionales ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distribucionProfesionales}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.zona}: ${entry.profesionales}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="profesionales"
                    >
                      {distribucionProfesionales?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ratio Pacientes/Profesionales por Zona</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={asignaciones}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="zona" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pacientes" fill="hsl(var(--primary))" name="Pacientes" />
                <Bar dataKey="profesionales" fill="hsl(var(--secondary))" name="Profesionales" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
