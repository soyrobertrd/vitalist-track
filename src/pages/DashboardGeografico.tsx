import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Users, Stethoscope, Activity, PieChart as PieChartIcon, BarChart3, AlertCircle } from "lucide-react";
import { useOGTICZonas } from "@/hooks/useOGTICZonas";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

const PALETTE = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#6366f1", // Indigo
  "#14b8a6", // Teal
];

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
        const zonaData = zonas.find((z) => z.value === zona);
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
        const zonaData = zonas.find((z) => z.value === zona);
        return {
          zona: zonaData?.label || zona.replace(/_/g, " "),
          profesionales: count,
        };
      });
    },
  });

  const { data: asignaciones, isLoading: loadingAsignaciones } = useQuery({
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

      const zonasSet = new Set(data?.map((p) => p.zona) || []);
      return Array.from(zonasSet).map((zona) => {
        const pacientesZona = data?.filter((p) => p.zona === zona) || [];
        const profesionalesUnicos = new Set(pacientesZona.map((p) => p.profesional_asignado_id));
        const zonaData = zonas.find((z) => z.value === zona);
        const cantProf = profesionalesUnicos.size || 1;
        const cantPx = pacientesZona.length;

        return {
          zona: zonaData?.label || zona?.replace(/_/g, " ") || "Sin zona",
          pacientes: cantPx,
          profesionales: cantProf,
          ratio: Number((cantPx / cantProf).toFixed(1)),
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

      const zonasUnicas = new Set(zonasData?.map((p) => p.zona).filter(Boolean));

      return {
        totalPacientes: totalPacientes || 0,
        totalProfesionales: totalProfesionales || 0,
        zonasActivas: zonasUnicas.size,
      };
    },
  });

  const ratioPromedio = useMemo(() => {
    if (!stats?.totalProfesionales || stats.totalProfesionales === 0) return 0;
    return Number(((stats?.totalPacientes || 0) / stats.totalProfesionales).toFixed(1));
  }, [stats]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Modo B */}
      <ClinicalPageHeader
        title="Dashboard Geográfico & Cobertura Territorial"
        subtitle="Distribución demográfica de pacientes activos, presencia de personal de salud y carga asistencial por zona"
        icon={MapPin}
        badge="GeoSalud"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Demarcaciones Activas"
          value={stats?.zonasActivas || 0}
          subtitle="Zonas territoriales con cobertura"
          icon={MapPin}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Pacientes Activos"
          value={stats?.totalPacientes || 0}
          subtitle="Población adscrita al sistema"
          icon={Users}
          variant="primary"
        />
        <ClinicalKpiCard
          title="Personal en Territorio"
          value={stats?.totalProfesionales || 0}
          subtitle="Especialistas y personal asistencial"
          icon={Stethoscope}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="Ratio Asistencial Medio"
          value={`${ratioPromedio} px/médico`}
          subtitle="Carga de atención promedio"
          icon={Activity}
          variant={ratioPromedio > 25 ? "amber" : "teal"}
        />
      </div>

      {/* Grilla Principal de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Barras de Pacientes por Zona */}
        <Card className="rounded-2xl border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Densidad Poblacional por Zona
            </CardTitle>
            <CardDescription>Volumen de pacientes activos registrados según su ubicación</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {loadingPacientes ? (
              <Skeleton className="h-[280px] w-full rounded-xl" />
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribucionPacientes} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis
                      dataKey="zona"
                      angle={-30}
                      textAnchor="end"
                      height={60}
                      interval={0}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid rgba(0,0,0,0.1)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      }}
                    />
                    <Bar dataKey="pacientes" name="Pacientes Activos" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico 2: Donut Chart de Personal por Zona */}
        <Card className="rounded-2xl border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-emerald-600" /> Despliegue de Profesionales de Salud
            </CardTitle>
            <CardDescription>Distribución porcentual de especialistas y médicos por sector</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {loadingProfesionales ? (
              <Skeleton className="h-[280px] w-full rounded-xl" />
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribucionProfesionales}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="profesionales"
                      nameKey="zona"
                    >
                      {distribucionProfesionales?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico 3: Comparativa Pacientes vs Profesionales */}
      <Card className="rounded-2xl border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-600" /> Balance de Capacidad Asistencial por Zona
          </CardTitle>
          <CardDescription>
            Relación directa entre la demanda poblacional y los profesionales disponibles
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {loadingAsignaciones ? (
            <Skeleton className="h-[280px] w-full rounded-xl" />
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={asignaciones} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="zona"
                    angle={-30}
                    textAnchor="end"
                    height={60}
                    interval={0}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="pacientes" fill="#3b82f6" name="Pacientes" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profesionales" fill="#10b981" name="Profesionales" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de Cobertura y Saturación Territorial */}
      <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" /> Semáforo de Carga y Saturación Asistencial
          </CardTitle>
          <CardDescription>
            Índice de pacientes por cada profesional asignado con nivel de saturación
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Zona Territorial</TableHead>
                <TableHead className="text-right">Pacientes Asignados</TableHead>
                <TableHead className="text-right">Médicos / Especialistas</TableHead>
                <TableHead className="text-right">Ratio Asistencial</TableHead>
                <TableHead className="text-center w-36">Estado de Saturación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(asignaciones || []).map((row, idx) => {
                const ratioNum = Number(row.ratio);
                const esCritico = ratioNum >= 30;
                const esAlerta = ratioNum >= 15 && ratioNum < 30;

                return (
                  <TableRow key={idx} className="hover:bg-muted/30">
                    <TableCell className="font-semibold text-foreground flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      {row.zona}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">{row.pacientes}</TableCell>
                    <TableCell className="text-right font-mono font-medium">{row.profesionales}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-foreground">
                      {ratioNum} px/médico
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          esCritico
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30"
                            : esAlerta
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {esCritico ? "Sobrecarga Alta" : esAlerta ? "Carga Moderada" : "Óptimo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!asignaciones?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No hay datos de asignaciones territoriales disponibles.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

