import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, subDays, subMonths, startOfDay, endOfDay, eachDayOfInterval, eachMonthOfInterval, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, TrendingUp,
  Save, Share2, Calendar as CalendarIcon, Download, Users, Phone, Stethoscope,
  DollarSign, Building2, Activity, Target
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar
} from "recharts";
import * as XLSX from "xlsx";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useActiveSucursal } from "@/contexts/ActiveSucursalContext";
import { ReportBuilder } from "@/components/ReportBuilder";

const COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))"
];

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export default function DashboardBI() {
  const { currentWorkspace } = useWorkspace();
  const { activeSucursalId } = useActiveSucursal();

  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 3),
    to: new Date(),
  });

  const [kpis, setKpis] = useState({
    totalPacientes: 0, pacientesActivos: 0, pacientesNuevos: 0,
    totalLlamadas: 0, llamadasRealizadas: 0, tasaContacto: 0,
    totalVisitas: 0, visitasRealizadas: 0, tasaCumplimiento: 0,
    ingresosBrutos: 0, cobrado: 0, pendienteCobro: 0,
  });

  const [trendData, setTrendData] = useState<any[]>([]);
  const [sucursalData, setSucursalData] = useState<any[]>([]);
  const [profData, setProfData] = useState<any[]>([]);
  const [zonalData, setZonalData] = useState<any[]>([]);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, [dateRange, currentWorkspace?.id, activeSucursalId]);

  const fetchAll = async () => {
    setLoading(true);
    const wsId = currentWorkspace?.id;
    if (!wsId) { setLoading(false); return; }

    const from = dateRange.from ? startOfDay(dateRange.from).toISOString() : null;
    const to = dateRange.to ? endOfDay(dateRange.to).toISOString() : null;

    const scope = (q: any) => {
      let r = q;
      if (wsId) r = r.eq("workspace_id", wsId);
      if (activeSucursalId) r = r.eq("sucursal_id", activeSucursalId);
      return r;
    };

    // Parallel data fetching
    const [pacRes, llamRes, visRes, facRes, sucRes, profRes] = await Promise.all([
      scope(supabase.from("pacientes").select("id, status_px, zona, created_at, sucursal_id")),
      scope(supabase.from("registro_llamadas").select("id, estado, resultado_seguimiento, profesional_id, created_at, sucursal_id")
        .gte("created_at", from || "2000-01-01").lte("created_at", to || "2099-12-31")),
      scope(supabase.from("control_visitas").select("id, estado, profesional_id, created_at, sucursal_id, fecha_hora_visita")
        .gte("created_at", from || "2000-01-01").lte("created_at", to || "2099-12-31")),
      scope(supabase.from("facturas").select("id, monto_total, monto_pagado, estado, sucursal_id, created_at")
        .gte("created_at", from || "2000-01-01").lte("created_at", to || "2099-12-31")),
      supabase.from("sucursales").select("id, nombre").eq("workspace_id", wsId),
      supabase.from("personal_salud").select("id, nombre, apellido").eq("workspace_id", wsId).eq("activo", true),
    ]);

    const pacientes = pacRes.data || [];
    const llamadas = llamRes.data || [];
    const visitas = visRes.data || [];
    const facturas = facRes.data || [];
    const sucursales = sucRes.data || [];
    const profesionales = profRes.data || [];

    // KPIs
    const pacActivos = pacientes.filter(p => p.status_px === "activo").length;
    const pacNuevos = from ? pacientes.filter(p => p.created_at >= from).length : 0;
    const llamRealizadas = llamadas.filter(l => l.estado === "realizada").length;
    const contactadas = llamadas.filter(l => l.resultado_seguimiento === "contactado").length;
    const visRealizadas = visitas.filter(v => v.estado === "realizada").length;
    const ingresos = facturas.reduce((s, f) => s + (f.monto_total || 0), 0);
    const cobrado = facturas.reduce((s, f) => s + (f.monto_pagado || 0), 0);

    setKpis({
      totalPacientes: pacientes.length,
      pacientesActivos: pacActivos,
      pacientesNuevos: pacNuevos,
      totalLlamadas: llamadas.length,
      llamadasRealizadas: llamRealizadas,
      tasaContacto: llamRealizadas > 0 ? Math.round((contactadas / llamRealizadas) * 100) : 0,
      totalVisitas: visitas.length,
      visitasRealizadas: visRealizadas,
      tasaCumplimiento: visitas.length > 0 ? Math.round((visRealizadas / visitas.length) * 100) : 0,
      ingresosBrutos: ingresos,
      cobrado,
      pendienteCobro: ingresos - cobrado,
    });

    // Monthly trend
    if (dateRange.from && dateRange.to) {
      const months = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
      const trend = months.map(m => {
        const ms = startOfMonth(m).toISOString();
        const me = endOfMonth(m).toISOString();
        return {
          name: format(m, "MMM yy", { locale: es }),
          llamadas: llamadas.filter(l => l.created_at >= ms && l.created_at <= me).length,
          visitas: visitas.filter(v => v.created_at >= ms && v.created_at <= me).length,
          pacientes: pacientes.filter(p => p.created_at >= ms && p.created_at <= me).length,
          ingresos: facturas.filter(f => f.created_at >= ms && f.created_at <= me).reduce((s, f) => s + (f.monto_total || 0), 0),
        };
      });
      setTrendData(trend);
    }

    // By sucursal
    const sucData = sucursales.map(s => ({
      name: s.nombre,
      pacientes: pacientes.filter(p => p.sucursal_id === s.id).length,
      llamadas: llamadas.filter(l => l.sucursal_id === s.id).length,
      visitas: visitas.filter(v => v.sucursal_id === s.id).length,
      ingresos: facturas.filter(f => f.sucursal_id === s.id).reduce((acc, f) => acc + (f.monto_total || 0), 0),
    }));
    setSucursalData(sucData);

    // By profesional (top 10)
    const profMap: Record<string, { nombre: string; llamadas: number; visitas: number }> = {};
    profesionales.forEach(p => { profMap[p.id] = { nombre: `${p.nombre} ${p.apellido}`, llamadas: 0, visitas: 0 }; });
    llamadas.forEach(l => { if (l.profesional_id && profMap[l.profesional_id]) profMap[l.profesional_id].llamadas++; });
    visitas.forEach(v => { if (v.profesional_id && profMap[v.profesional_id]) profMap[v.profesional_id].visitas++; });
    const pData = Object.values(profMap)
      .map(p => ({ ...p, total: p.llamadas + p.visitas }))
      .sort((a, b) => b.total - a.total).slice(0, 10);
    setProfData(pData);

    // By zona
    const zonas: Record<string, number> = {};
    pacientes.forEach(p => {
      const z = p.zona || "Sin zona";
      zonas[z] = (zonas[z] || 0) + 1;
    });
    setZonalData(Object.entries(zonas).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));

    // Saved reports
    const { data: reports } = await supabase
      .from("reportes_bi_guardados")
      .select("*")
      .eq("workspace_id", wsId)
      .order("created_at", { ascending: false });
    setSavedReports(reports || []);

    setLoading(false);
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([kpis]), "KPIs");
    if (trendData.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trendData), "Tendencia");
    if (sucursalData.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sucursalData), "Sucursales");
    if (profData.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(profData), "Profesionales");
    XLSX.writeFile(wb, `BI_Dashboard_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Exportado a Excel");
  };

  const KpiCard = ({ title, value, subtitle, icon: Icon, color = "primary" }: any) => (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{typeof value === "number" && title.includes("$") ? `$${value.toLocaleString()}` : value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <Icon className={`h-8 w-8 text-${color} opacity-60`} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard BI</h1>
          <p className="text-muted-foreground">Inteligencia de negocio y analítica avanzada</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {dateRange.from && dateRange.to
                  ? `${format(dateRange.from, "dd/MM/yy")} - ${format(dateRange.to, "dd/MM/yy")}`
                  : "Rango"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="range" selected={dateRange}
                onSelect={(r: any) => setDateRange(r || { from: undefined, to: undefined })}
                numberOfMonths={2} />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={exportExcel}>
            <Download className="h-4 w-4 mr-2" /> Excel
          </Button>
        </div>
      </div>

      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen">Resumen Ejecutivo</TabsTrigger>
          <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
          <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
          <TabsTrigger value="constructor">Constructor</TabsTrigger>
        </TabsList>

        {/* RESUMEN */}
        <TabsContent value="resumen" className="space-y-6">
          {/* KPIs */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Pacientes totales" value={kpis.totalPacientes} subtitle={`${kpis.pacientesActivos} activos`} icon={Users} />
            <KpiCard title="Nuevos (período)" value={kpis.pacientesNuevos} icon={TrendingUp} color="success" />
            <KpiCard title="Llamadas" value={kpis.totalLlamadas} subtitle={`${kpis.tasaContacto}% contacto`} icon={Phone} color="warning" />
            <KpiCard title="Visitas" value={kpis.totalVisitas} subtitle={`${kpis.tasaCumplimiento}% cumplimiento`} icon={Stethoscope} />
          </div>

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
            <KpiCard title="$ Ingresos brutos" value={kpis.ingresosBrutos} icon={DollarSign} color="primary" />
            <KpiCard title="$ Cobrado" value={kpis.cobrado} icon={DollarSign} color="success" />
            <KpiCard title="$ Pendiente cobro" value={kpis.pendienteCobro} icon={DollarSign} color="destructive" />
          </div>

          {/* Distribución zonal */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-lg">Distribución por zona</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={zonalData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                      {zonalData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Top profesionales</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={profData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="nombre" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="llamadas" fill="hsl(var(--chart-1))" name="Llamadas" stackId="a" />
                    <Bar dataKey="visitas" fill="hsl(var(--chart-2))" name="Visitas" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TENDENCIAS */}
        <TabsContent value="tendencias" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tendencia mensual de actividad</CardTitle>
              <CardDescription>Llamadas, visitas y pacientes nuevos por mes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="llamadas" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1) / 0.2)" name="Llamadas" />
                  <Area type="monotone" dataKey="visitas" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2) / 0.2)" name="Visitas" />
                  <Area type="monotone" dataKey="pacientes" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3) / 0.2)" name="Pacientes nuevos" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tendencia de ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                  <Line type="monotone" dataKey="ingresos" stroke="hsl(var(--primary))" strokeWidth={2} name="Ingresos" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMPARATIVO SUCURSALES */}
        <TabsContent value="comparativo" className="space-y-6">
          {sucursalData.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Comparativo por sucursal</CardTitle>
                  <CardDescription>Pacientes, llamadas, visitas e ingresos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={sucursalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="pacientes" fill="hsl(var(--chart-1))" name="Pacientes" />
                      <Bar dataKey="llamadas" fill="hsl(var(--chart-2))" name="Llamadas" />
                      <Bar dataKey="visitas" fill="hsl(var(--chart-3))" name="Visitas" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Ingresos por sucursal</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sucursalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                      <Bar dataKey="ingresos" fill="hsl(var(--primary))" name="Ingresos $" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-2 opacity-40" />
                No hay sucursales registradas para comparar
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* CONSTRUCTOR */}
        <TabsContent value="constructor">
          <ReportBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}
