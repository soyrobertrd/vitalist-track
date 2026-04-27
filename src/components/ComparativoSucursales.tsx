/**
 * Dashboard comparativo por sucursal: KPIs lado a lado.
 * Se muestra dentro de Reportes como nueva pestaña.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { Building2, Users, Phone, Calendar, Activity } from "lucide-react";
import { subDays } from "date-fns";

interface SucursalKPI {
  id: string;
  nombre: string;
  pacientes: number;
  visitasRealizadas: number;
  llamadasRealizadas: number;
  tasaContacto: number;
}

export function ComparativoSucursales() {
  const { currentWorkspace } = useWorkspace();
  const [data, setData] = useState<SucursalKPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspace?.id) return;
    load();
  }, [currentWorkspace?.id]);

  const load = async () => {
    setLoading(true);
    try {
      const { data: sucursales } = await supabase
        .from("sucursales" as any)
        .select("id,nombre")
        .eq("workspace_id", currentWorkspace!.id)
        .eq("activo", true);

      if (!sucursales) {
        setData([]);
        return;
      }

      const fromDate = subDays(new Date(), 30).toISOString();

      const results: SucursalKPI[] = await Promise.all(
        (sucursales as any[]).map(async (s) => {
          const [pacRes, visRes, llamRes, llamContactRes] = await Promise.all([
            supabase.from("pacientes").select("id", { count: "exact", head: true }).eq("sucursal_id", s.id),
            supabase
              .from("control_visitas")
              .select("id", { count: "exact", head: true })
              .eq("sucursal_id", s.id)
              .eq("estado", "realizada")
              .gte("fecha_hora_visita", fromDate),
            supabase
              .from("registro_llamadas")
              .select("id", { count: "exact", head: true })
              .eq("sucursal_id", s.id as any)
              .eq("estado", "realizada")
              .gte("created_at", fromDate),
            supabase
              .from("registro_llamadas")
              .select("id", { count: "exact", head: true })
              .eq("sucursal_id", s.id as any)
              .eq("resultado_seguimiento", "contactado")
              .gte("created_at", fromDate),
          ]);

          const realizadas = llamRes.count ?? 0;
          const contactadas = llamContactRes.count ?? 0;
          return {
            id: s.id,
            nombre: s.nombre,
            pacientes: pacRes.count ?? 0,
            visitasRealizadas: visRes.count ?? 0,
            llamadasRealizadas: realizadas,
            tasaContacto: realizadas > 0 ? Math.round((contactadas / realizadas) * 100) : 0,
          };
        })
      );

      setData(results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-center text-muted-foreground py-8">Cargando comparativo…</p>;
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sin sucursales configuradas</CardTitle>
          <CardDescription>Crea sucursales en Organizaciones para ver este comparativo.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totales = data.reduce(
    (acc, s) => ({
      pacientes: acc.pacientes + s.pacientes,
      visitas: acc.visitas + s.visitasRealizadas,
      llamadas: acc.llamadas + s.llamadasRealizadas,
    }),
    { pacientes: 0, visitas: 0, llamadas: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sucursales</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> {data.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pacientes (total)</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> {totales.pacientes}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Visitas realizadas (30d)</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Calendar className="h-5 w-5 text-success" /> {totales.visitas}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Llamadas realizadas (30d)</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Phone className="h-5 w-5 text-warning" /> {totales.llamadas}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparativo por sucursal (últimos 30 días)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="pacientes" fill="hsl(var(--primary))" name="Pacientes activos" />
              <Bar dataKey="visitasRealizadas" fill="hsl(var(--success))" name="Visitas realizadas" />
              <Bar dataKey="llamadasRealizadas" fill="hsl(var(--warning))" name="Llamadas realizadas" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasa de contacto telefónico por sucursal</CardTitle>
          <CardDescription>% de llamadas realizadas que terminaron en contacto efectivo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.map((s) => (
              <div key={s.id}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{s.nombre}</span>
                  <Badge variant={s.tasaContacto >= 70 ? "default" : s.tasaContacto >= 40 ? "secondary" : "destructive"}>
                    <Activity className="h-3 w-3 mr-1" />{s.tasaContacto}%
                  </Badge>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(s.tasaContacto, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
