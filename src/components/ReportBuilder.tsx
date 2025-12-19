import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Settings2, BarChart3, PieChart, LineChart as LineChartIcon, Table2, Calendar as CalendarIcon } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ReportConfig {
  dataSource: "llamadas" | "visitas" | "pacientes";
  fields: string[];
  groupBy: string | null;
  chartType: "bar" | "pie" | "line" | "table";
  dateRange: { from: Date | undefined; to: Date | undefined };
  profesionalFilter: string;
  statusFilter: string;
}

const FIELD_OPTIONS = {
  llamadas: [
    { value: "fecha_agendada", label: "Fecha" },
    { value: "estado", label: "Estado" },
    { value: "motivo", label: "Motivo" },
    { value: "duracion_minutos", label: "Duración" },
    { value: "resultado_seguimiento", label: "Resultado" },
    { value: "profesional", label: "Profesional" },
    { value: "paciente", label: "Paciente" },
  ],
  visitas: [
    { value: "fecha_hora_visita", label: "Fecha" },
    { value: "estado", label: "Estado" },
    { value: "tipo_visita", label: "Tipo" },
    { value: "motivo_visita", label: "Motivo" },
    { value: "profesional", label: "Profesional" },
    { value: "paciente", label: "Paciente" },
  ],
  pacientes: [
    { value: "nombre", label: "Nombre" },
    { value: "status_px", label: "Estado" },
    { value: "zona", label: "Zona" },
    { value: "barrio", label: "Barrio" },
    { value: "grado_dificultad", label: "Grado" },
    { value: "profesional", label: "Profesional Asignado" },
  ],
};

const GROUP_BY_OPTIONS = {
  llamadas: [
    { value: "estado", label: "Estado" },
    { value: "motivo", label: "Motivo" },
    { value: "resultado_seguimiento", label: "Resultado" },
    { value: "profesional_id", label: "Profesional" },
    { value: "day", label: "Día" },
  ],
  visitas: [
    { value: "estado", label: "Estado" },
    { value: "tipo_visita", label: "Tipo" },
    { value: "profesional_id", label: "Profesional" },
    { value: "day", label: "Día" },
  ],
  pacientes: [
    { value: "status_px", label: "Estado" },
    { value: "zona", label: "Zona" },
    { value: "grado_dificultad", label: "Grado" },
  ],
};

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function ReportBuilder() {
  const [config, setConfig] = useState<ReportConfig>({
    dataSource: "llamadas",
    fields: ["fecha_agendada", "estado", "paciente"],
    groupBy: "estado",
    chartType: "bar",
    dateRange: { from: subDays(new Date(), 30), to: new Date() },
    profesionalFilter: "todos",
    statusFilter: "todos",
  });

  const [data, setData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfesionales();
  }, []);

  useEffect(() => {
    fetchData();
  }, [config.dataSource, config.dateRange, config.profesionalFilter, config.statusFilter]);

  useEffect(() => {
    processChartData();
  }, [data, config.groupBy]);

  const fetchProfesionales = async () => {
    const { data } = await supabase
      .from("personal_salud")
      .select("id, nombre, apellido")
      .eq("activo", true);
    setProfesionales(data || []);
  };

  const fetchData = async () => {
    setLoading(true);
    const fromDate = config.dateRange.from ? startOfDay(config.dateRange.from).toISOString() : null;
    const toDate = config.dateRange.to ? endOfDay(config.dateRange.to).toISOString() : null;

    let query;

    switch (config.dataSource) {
      case "llamadas":
        query = supabase
          .from("registro_llamadas")
          .select("*, personal_salud(nombre, apellido), pacientes(nombre, apellido)");
        if (fromDate) query = query.gte("created_at", fromDate);
        if (toDate) query = query.lte("created_at", toDate);
        if (config.profesionalFilter !== "todos") {
          query = query.eq("profesional_id", config.profesionalFilter);
        }
        if (config.statusFilter !== "todos") {
          query = query.eq("estado", config.statusFilter);
        }
        break;
      case "visitas":
        query = supabase
          .from("control_visitas")
          .select("*, personal_salud(nombre, apellido), pacientes(nombre, apellido)");
        if (fromDate) query = query.gte("created_at", fromDate);
        if (toDate) query = query.lte("created_at", toDate);
        if (config.profesionalFilter !== "todos") {
          query = query.eq("profesional_id", config.profesionalFilter);
        }
        if (config.statusFilter !== "todos") {
          query = query.eq("estado", config.statusFilter);
        }
        break;
      case "pacientes":
        query = supabase
          .from("pacientes")
          .select("*, personal_salud:profesional_asignado_id(nombre, apellido)");
        if (config.statusFilter !== "todos") {
          query = query.eq("status_px", config.statusFilter);
        }
        break;
    }

    const { data: result } = await query!;
    setData(result || []);
    setLoading(false);
  };

  const processChartData = () => {
    if (!config.groupBy || data.length === 0) {
      setChartData([]);
      return;
    }

    const groups: Record<string, number> = {};

    data.forEach((item) => {
      let key: string;

      if (config.groupBy === "day") {
        const dateField = config.dataSource === "llamadas" ? "fecha_agendada" : "fecha_hora_visita";
        const date = item[dateField];
        key = date ? format(new Date(date), "dd/MM") : "Sin fecha";
      } else if (config.groupBy === "profesional_id") {
        key = item.personal_salud
          ? `${item.personal_salud.nombre} ${item.personal_salud.apellido}`
          : "Sin asignar";
      } else {
        key = item[config.groupBy!] || "Sin definir";
      }

      groups[key] = (groups[key] || 0) + 1;
    });

    const processed = Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    setChartData(processed);
  };

  const toggleField = (field: string) => {
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.includes(field)
        ? prev.fields.filter((f) => f !== field)
        : [...prev.fields, field],
    }));
  };

  const exportToExcel = () => {
    const exportData = data.map((item) => {
      const row: Record<string, any> = {};
      config.fields.forEach((field) => {
        if (field === "profesional") {
          row["Profesional"] = item.personal_salud
            ? `${item.personal_salud.nombre} ${item.personal_salud.apellido}`
            : "Sin asignar";
        } else if (field === "paciente") {
          row["Paciente"] = item.pacientes
            ? `${item.pacientes.nombre} ${item.pacientes.apellido}`
            : "N/A";
        } else {
          row[field] = item[field] || "";
        }
      });
      return row;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, `Reporte_${config.dataSource}_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No hay datos para mostrar
        </div>
      );
    }

    switch (config.chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))">
                {chartData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPie>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {chartData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPie>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  const renderTable = () => (
    <ScrollArea className="h-[400px]">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-background">
          <tr className="border-b">
            {config.fields.map((field) => (
              <th key={field} className="text-left p-2 font-medium">
                {FIELD_OPTIONS[config.dataSource].find((f) => f.value === field)?.label || field}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 100).map((item, index) => (
            <tr key={index} className="border-b hover:bg-muted/50">
              {config.fields.map((field) => (
                <td key={field} className="p-2">
                  {field === "profesional"
                    ? item.personal_salud
                      ? `${item.personal_salud.nombre} ${item.personal_salud.apellido}`
                      : "Sin asignar"
                    : field === "paciente"
                    ? item.pacientes
                      ? `${item.pacientes.nombre} ${item.pacientes.apellido}`
                      : "N/A"
                    : field.includes("fecha")
                    ? item[field]
                      ? format(new Date(item[field]), "dd/MM/yyyy HH:mm")
                      : "-"
                    : item[field] || "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  );

  return (
    <div className="space-y-6">
      {/* Config Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Configuración del Reporte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Data Source */}
            <div className="space-y-2">
              <Label>Fuente de datos</Label>
              <Select
                value={config.dataSource}
                onValueChange={(v: any) => setConfig((prev) => ({ ...prev, dataSource: v, fields: [], groupBy: null }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="llamadas">Llamadas</SelectItem>
                  <SelectItem value="visitas">Visitas</SelectItem>
                  <SelectItem value="pacientes">Pacientes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Professional Filter */}
            <div className="space-y-2">
              <Label>Profesional</Label>
              <Select
                value={config.profesionalFilter}
                onValueChange={(v) => setConfig((prev) => ({ ...prev, profesionalFilter: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {profesionales.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} {p.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Rango de fechas</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {config.dateRange.from && config.dateRange.to
                      ? `${format(config.dateRange.from, "dd/MM")} - ${format(config.dateRange.to, "dd/MM")}`
                      : "Seleccionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={config.dateRange}
                    onSelect={(range: any) =>
                      setConfig((prev) => ({
                        ...prev,
                        dateRange: range || { from: undefined, to: undefined },
                      }))
                    }
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Group By */}
            <div className="space-y-2">
              <Label>Agrupar por</Label>
              <Select
                value={config.groupBy || "none"}
                onValueChange={(v) => setConfig((prev) => ({ ...prev, groupBy: v === "none" ? null : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin agrupación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin agrupación</SelectItem>
                  {GROUP_BY_OPTIONS[config.dataSource].map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fields */}
          <div className="mt-4 space-y-2">
            <Label>Campos a mostrar</Label>
            <div className="flex flex-wrap gap-3">
              {FIELD_OPTIONS[config.dataSource].map((field) => (
                <div key={field.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.value}
                    checked={config.fields.includes(field.value)}
                    onCheckedChange={() => toggleField(field.value)}
                  />
                  <label htmlFor={field.value} className="text-sm cursor-pointer">
                    {field.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Chart Type */}
          <div className="mt-4 flex items-center gap-4">
            <Label>Tipo de gráfico:</Label>
            <div className="flex gap-2">
              <Button
                variant={config.chartType === "bar" ? "default" : "outline"}
                size="sm"
                onClick={() => setConfig((prev) => ({ ...prev, chartType: "bar" }))}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant={config.chartType === "pie" ? "default" : "outline"}
                size="sm"
                onClick={() => setConfig((prev) => ({ ...prev, chartType: "pie" }))}
              >
                <PieChart className="h-4 w-4" />
              </Button>
              <Button
                variant={config.chartType === "line" ? "default" : "outline"}
                size="sm"
                onClick={() => setConfig((prev) => ({ ...prev, chartType: "line" }))}
              >
                <LineChartIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={config.chartType === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setConfig((prev) => ({ ...prev, chartType: "table" }))}
              >
                <Table2 className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={exportToExcel} className="ml-auto">
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Resultados ({data.length} registros)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : config.chartType === "table" ? (
            renderTable()
          ) : (
            renderChart()
          )}
        </CardContent>
      </Card>
    </div>
  );
}
