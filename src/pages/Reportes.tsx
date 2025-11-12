import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Phone, Calendar, Users, TrendingUp, Activity } from "lucide-react";
import { toast } from "sonner";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart,
  Bar,
  PieChart,
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
import * as XLSX from "xlsx";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const Reportes = () => {
  const [profesionalId, setProfesionalId] = useState<string>("todos");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [dataLlamadas, setDataLlamadas] = useState<any[]>([]);
  const [dataVisitas, setDataVisitas] = useState<any[]>([]);
  const [dataPacientes, setDataPacientes] = useState<any[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const [recomendaciones, setRecomendaciones] = useState("");

  useEffect(() => {
    fetchData();
  }, [profesionalId, dateRange]);

  const fetchData = async () => {
    const fromDate = dateRange.from ? startOfDay(dateRange.from).toISOString() : null;
    const toDate = dateRange.to ? endOfDay(dateRange.to).toISOString() : null;

    let llamadasQuery = supabase
      .from("registro_llamadas")
      .select("*, personal_salud(nombre, apellido), pacientes(nombre, apellido, sexo, fecha_nacimiento, grado_dificultad)");
    
    let visitasQuery = supabase
      .from("control_visitas")
      .select("*, personal_salud(nombre, apellido), pacientes(nombre, apellido, sexo, fecha_nacimiento, grado_dificultad)");

    if (profesionalId !== "todos") {
      llamadasQuery = llamadasQuery.eq("profesional_id", profesionalId);
      visitasQuery = visitasQuery.eq("profesional_id", profesionalId);
    }

    if (fromDate) {
      llamadasQuery = llamadasQuery.gte("created_at", fromDate);
      visitasQuery = visitasQuery.gte("created_at", fromDate);
    }

    if (toDate) {
      llamadasQuery = llamadasQuery.lte("created_at", toDate);
      visitasQuery = visitasQuery.lte("created_at", toDate);
    }

    const [profRes, llamadasRes, visitasRes, pacientesRes] = await Promise.all([
      supabase.from("personal_salud").select("*").eq("activo", true),
      llamadasQuery,
      visitasQuery,
      supabase.from("pacientes").select("*"),
    ]);

    if (profRes.data) setProfesionales(profRes.data);
    if (llamadasRes.data) setDataLlamadas(llamadasRes.data);
    if (visitasRes.data) setDataVisitas(visitasRes.data);
    if (pacientesRes.data) setDataPacientes(pacientesRes.data);
  };

  const calcularEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) return 0;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const getGrupoEdad = (edad: number) => {
    if (edad <= 12) return "Niños (0-12)";
    if (edad <= 17) return "Adolescentes (13-17)";
    if (edad <= 64) return "Adultos (18-64)";
    return "Mayores (65+)";
  };

  // KPIs Calculation
  const totalLlamadas = dataLlamadas.length;
  const llamadasRealizadas = dataLlamadas.filter(l => l.estado === 'realizada').length;
  const llamadasContactadas = dataLlamadas.filter(l => l.resultado_seguimiento === 'contactado').length;
  const tasaContacto = llamadasRealizadas > 0 ? ((llamadasContactadas / llamadasRealizadas) * 100).toFixed(2) : "0";
  const duracionPromedio = dataLlamadas.filter(l => l.duracion_minutos).length > 0
    ? (dataLlamadas.reduce((acc, l) => acc + (l.duracion_minutos || 0), 0) / dataLlamadas.filter(l => l.duracion_minutos).length).toFixed(2)
    : "0";
  
  const totalVisitas = dataVisitas.length;
  const visitasRealizadas = dataVisitas.filter(v => v.estado === 'realizada').length;
  const visitasProgramadas = dataVisitas.length;
  const tasaCumplimientoVisitas = visitasProgramadas > 0 ? ((visitasRealizadas / visitasProgramadas) * 100).toFixed(2) : "0";
  
  const pacientesUnicos = new Set(dataLlamadas.map(l => l.paciente_id).concat(dataVisitas.map(v => v.paciente_id))).size;
  const pacientesRecurrentes = dataLlamadas.filter(l => {
    const llamadasPaciente = dataLlamadas.filter(ll => ll.paciente_id === l.paciente_id);
    return llamadasPaciente.length > 1;
  }).length;

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // KPIs Sheet
    const kpisData = [
      { Indicador: "Total de llamadas realizadas", Valor: totalLlamadas },
      { Indicador: "% de contacto efectivo", Valor: `${tasaContacto}%` },
      { Indicador: "Promedio de duración de llamadas (min)", Valor: duracionPromedio },
      { Indicador: "Total de visitas realizadas", Valor: visitasRealizadas },
      { Indicador: "% de cumplimiento de visitas", Valor: `${tasaCumplimientoVisitas}%` },
      { Indicador: "Total de pacientes atendidos", Valor: pacientesUnicos },
    ];
    const wsKpis = XLSX.utils.json_to_sheet(kpisData);
    XLSX.utils.book_append_sheet(wb, wsKpis, "KPIs");

    // Llamadas Detail Sheet
    const llamadasData = dataLlamadas.map(l => ({
      Fecha: l.fecha_hora_realizada || l.fecha_agendada,
      Hora: l.fecha_hora_realizada ? format(new Date(l.fecha_hora_realizada), "HH:mm") : "-",
      Paciente: l.pacientes ? `${l.pacientes.nombre} ${l.pacientes.apellido}` : 'N/A',
      Edad: l.pacientes?.fecha_nacimiento ? calcularEdad(l.pacientes.fecha_nacimiento) : "N/A",
      Sexo: l.pacientes?.sexo || "N/A",
      Motivo: l.motivo || "N/A",
      Resultado: l.resultado_seguimiento || 'N/A',
      Duración: l.duracion_minutos ? `${l.duracion_minutos} min` : "N/A",
      Responsable: l.personal_salud ? `${l.personal_salud.nombre} ${l.personal_salud.apellido}` : 'N/A',
      Observaciones: l.comentarios_resultados || "",
      Estado: l.estado,
    }));
    const wsLlamadas = XLSX.utils.json_to_sheet(llamadasData);
    XLSX.utils.book_append_sheet(wb, wsLlamadas, "Llamadas");

    // Visitas Detail Sheet
    const visitasData = dataVisitas.map(v => ({
      Fecha: v.fecha_hora_visita,
      Tipo: v.tipo_visita,
      Paciente: v.pacientes ? `${v.pacientes.nombre} ${v.pacientes.apellido}` : 'N/A',
      Edad: v.pacientes?.fecha_nacimiento ? calcularEdad(v.pacientes.fecha_nacimiento) : "N/A",
      Sexo: v.pacientes?.sexo || "N/A",
      Gravedad: v.pacientes?.grado_dificultad || "N/A",
      Resultado: v.estado,
      Responsable: v.personal_salud ? `${v.personal_salud.nombre} ${v.personal_salud.apellido}` : 'N/A',
      Observaciones: v.notas_visita || "",
      Estado: v.estado,
    }));
    const wsVisitas = XLSX.utils.json_to_sheet(visitasData);
    XLSX.utils.book_append_sheet(wb, wsVisitas, "Visitas");

    XLSX.writeFile(wb, `Reporte_Completo_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Reporte completo exportado a Excel");
  };

  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Reporte de Control de Llamadas y Visitas</h1>
            <p className="text-muted-foreground mt-1">
              Período: {dateRange.from && format(dateRange.from, "dd 'de' MMMM yyyy", { locale: es })} - {dateRange.to && format(dateRange.to, "dd 'de' MMMM yyyy", { locale: es })}
            </p>
          </div>
          <Button onClick={exportToExcel}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Reporte Completo
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Profesional</label>
                <Select value={profesionalId} onValueChange={setProfesionalId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los profesionales</SelectItem>
                    {profesionales.map(prof => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.nombre} {prof.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Rango de Fechas</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange.from && dateRange.to
                        ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
                        : "Seleccionar rango"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="range"
                      selected={dateRange}
                      onSelect={(range: any) => setDateRange(range || { from: undefined, to: undefined })}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="resumen" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="resumen">Resumen Ejecutivo</TabsTrigger>
          <TabsTrigger value="llamadas">Control de Llamadas</TabsTrigger>
          <TabsTrigger value="visitas">Control de Visitas</TabsTrigger>
          <TabsTrigger value="analisis">Análisis</TabsTrigger>
          <TabsTrigger value="observaciones">Observaciones</TabsTrigger>
        </TabsList>

        {/* 1. RESUMEN EJECUTIVO */}
        <TabsContent value="resumen" className="space-y-6">
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Total Llamadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLlamadas}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  % Contacto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{tasaContacto}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Duración Prom.
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{duracionPromedio} min</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Visitas Realizadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{visitasRealizadas}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  % Cumplimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{tasaCumplimientoVisitas}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Pacientes Atendidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pacientesUnicos}</div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Llamadas por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Seguimiento', value: dataLlamadas.filter(l => l.motivo === 'seguimiento').length },
                        { name: 'Primera Consulta', value: dataLlamadas.filter(l => l.motivo === 'primera_consulta').length },
                        { name: 'Recordatorio', value: dataLlamadas.filter(l => l.motivo === 'recordatorio').length },
                        { name: 'Resultados', value: dataLlamadas.filter(l => l.motivo === 'resultados').length },
                        { name: 'Otro', value: dataLlamadas.filter(l => l.motivo === 'otro').length },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.value > 0 ? `${entry.name}: ${entry.value}` : ""}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución de Pacientes por Sexo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Masculino', value: dataPacientes.filter((p: any) => p.sexo === 'Masculino').length },
                        { name: 'Femenino', value: dataPacientes.filter((p: any) => p.sexo === 'Femenino').length },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      <Cell fill={COLORS[0]} />
                      <Cell fill={COLORS[1]} />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Distribución por Edad</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Niños (0-12)', value: dataPacientes.filter((p: any) => calcularEdad(p.fecha_nacimiento) <= 12).length },
                    { name: 'Adolescentes (13-17)', value: dataPacientes.filter((p: any) => calcularEdad(p.fecha_nacimiento) > 12 && calcularEdad(p.fecha_nacimiento) <= 17).length },
                    { name: 'Adultos (18-64)', value: dataPacientes.filter((p: any) => calcularEdad(p.fecha_nacimiento) > 17 && calcularEdad(p.fecha_nacimiento) <= 64).length },
                    { name: 'Mayores (65+)', value: dataPacientes.filter((p: any) => calcularEdad(p.fecha_nacimiento) > 64).length },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Bar dataKey="value" fill="hsl(var(--chart-3))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Análisis Narrativo */}
          <Card>
            <CardHeader>
              <CardTitle>Análisis del Período</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                En el periodo analizado ({dateRange.from && format(dateRange.from, "dd/MM/yyyy")} - {dateRange.to && format(dateRange.to, "dd/MM/yyyy")}), 
                se realizaron <strong>{totalLlamadas} llamadas de seguimiento</strong> y <strong>{visitasRealizadas} visitas médicas</strong>. 
                El <strong>{tasaContacto}% de los pacientes fueron contactados con éxito</strong>, con un tiempo promedio de llamada de {duracionPromedio} minutos.
                Se atendieron <strong>{pacientesUnicos} pacientes únicos</strong> durante este período.
                La tasa de cumplimiento de visitas fue del <strong>{tasaCumplimientoVisitas}%</strong>.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. CONTROL DE LLAMADAS */}
        <TabsContent value="llamadas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Llamadas</CardTitle>
              <CardDescription>Registro completo de todas las llamadas del período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Edad</TableHead>
                      <TableHead>Sexo</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Responsable</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataLlamadas.map((llamada) => (
                      <TableRow key={llamada.id}>
                        <TableCell>{llamada.fecha_hora_realizada ? format(new Date(llamada.fecha_hora_realizada), "dd/MM/yyyy") : "-"}</TableCell>
                        <TableCell>{llamada.fecha_hora_realizada ? format(new Date(llamada.fecha_hora_realizada), "HH:mm") : "-"}</TableCell>
                        <TableCell>{llamada.pacientes ? `${llamada.pacientes.nombre} ${llamada.pacientes.apellido}` : 'N/A'}</TableCell>
                        <TableCell>{llamada.pacientes?.fecha_nacimiento ? calcularEdad(llamada.pacientes.fecha_nacimiento) : "N/A"}</TableCell>
                        <TableCell>{llamada.pacientes?.sexo || "N/A"}</TableCell>
                        <TableCell className="capitalize">{llamada.motivo?.replace(/_/g, ' ') || "N/A"}</TableCell>
                        <TableCell className="capitalize">{llamada.resultado_seguimiento?.replace(/_/g, ' ') || 'N/A'}</TableCell>
                        <TableCell>{llamada.duracion_minutos ? `${llamada.duracion_minutos} min` : "N/A"}</TableCell>
                        <TableCell>{llamada.personal_salud ? `${llamada.personal_salud.nombre} ${llamada.personal_salud.apellido}` : 'N/A'}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            llamada.estado === 'realizada' && "bg-success/10 text-success",
                            llamada.estado === 'pendiente' && "bg-warning/10 text-warning",
                            llamada.estado === 'cancelada' && "bg-destructive/10 text-destructive"
                          )}>
                            {llamada.estado}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. CONTROL DE VISITAS */}
        <TabsContent value="visitas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Visitas</CardTitle>
              <CardDescription>Registro completo de todas las visitas del período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo de Visita</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Edad</TableHead>
                      <TableHead>Sexo</TableHead>
                      <TableHead>Gravedad</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Responsable</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataVisitas.map((visita) => (
                      <TableRow key={visita.id}>
                        <TableCell>{format(new Date(visita.fecha_hora_visita), "dd/MM/yyyy HH:mm")}</TableCell>
                        <TableCell className="capitalize">{visita.tipo_visita}</TableCell>
                        <TableCell>{visita.pacientes ? `${visita.pacientes.nombre} ${visita.pacientes.apellido}` : 'N/A'}</TableCell>
                        <TableCell>{visita.pacientes?.fecha_nacimiento ? calcularEdad(visita.pacientes.fecha_nacimiento) : "N/A"}</TableCell>
                        <TableCell>{visita.pacientes?.sexo || "N/A"}</TableCell>
                        <TableCell className="capitalize">{visita.pacientes?.grado_dificultad || "N/A"}</TableCell>
                        <TableCell className="capitalize">{visita.estado}</TableCell>
                        <TableCell>{visita.personal_salud ? `${visita.personal_salud.nombre} ${visita.personal_salud.apellido}` : 'N/A'}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            visita.estado === 'realizada' && "bg-success/10 text-success",
                            visita.estado === 'pendiente' && "bg-warning/10 text-warning",
                            visita.estado === 'cancelada' && "bg-destructive/10 text-destructive"
                          )}>
                            {visita.estado}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. ANÁLISIS */}
        <TabsContent value="analisis" className="space-y-6">
          {/* Análisis por Profesional */}
          <Card>
            <CardHeader>
              <CardTitle>Análisis por Profesional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profesionales.map(prof => {
                  const llamadasProf = dataLlamadas.filter(l => l.profesional_id === prof.id);
                  const visitasProf = dataVisitas.filter(v => v.profesional_id === prof.id);
                  const contactoProf = llamadasProf.filter(l => l.resultado_seguimiento === 'contactado').length;
                  const tasaContactoProf = llamadasProf.length > 0 ? ((contactoProf / llamadasProf.length) * 100).toFixed(1) : "0";
                  
                  return (
                    <div key={prof.id} className="p-4 border rounded-lg space-y-2">
                      <h4 className="font-semibold">{prof.nombre} {prof.apellido}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Llamadas</div>
                          <div className="text-xl font-bold">{llamadasProf.length}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Visitas</div>
                          <div className="text-xl font-bold">{visitasProf.length}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">% Contacto</div>
                          <div className="text-xl font-bold text-success">{tasaContactoProf}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Duración Prom.</div>
                          <div className="text-xl font-bold">
                            {llamadasProf.filter(l => l.duracion_minutos).length > 0
                              ? (llamadasProf.reduce((acc, l) => acc + (l.duracion_minutos || 0), 0) / llamadasProf.filter(l => l.duracion_minutos).length).toFixed(1)
                              : "0"} min
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Indicadores de Desempeño */}
          <Card>
            <CardHeader>
              <CardTitle>Indicadores de Desempeño</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Indicador</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Meta</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Tasa de contacto exitoso</TableCell>
                      <TableCell>% de llamadas efectivas sobre el total</TableCell>
                      <TableCell>90%</TableCell>
                      <TableCell>{tasaContacto}%</TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          parseFloat(tasaContacto) >= 90 ? "bg-success/10 text-success" : parseFloat(tasaContacto) >= 75 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
                        )}>
                          {parseFloat(tasaContacto) >= 90 ? "Excelente" : parseFloat(tasaContacto) >= 75 ? "Bueno" : "Mejorar"}
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Cumplimiento de visitas</TableCell>
                      <TableCell>% de visitas realizadas sobre programadas</TableCell>
                      <TableCell>95%</TableCell>
                      <TableCell>{tasaCumplimientoVisitas}%</TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          parseFloat(tasaCumplimientoVisitas) >= 95 ? "bg-success/10 text-success" : parseFloat(tasaCumplimientoVisitas) >= 80 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
                        )}>
                          {parseFloat(tasaCumplimientoVisitas) >= 95 ? "Excelente" : parseFloat(tasaCumplimientoVisitas) >= 80 ? "Bueno" : "Mejorar"}
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Duración promedio de llamada</TableCell>
                      <TableCell>Tiempo medio invertido por llamada</TableCell>
                      <TableCell>≤ 10 min</TableCell>
                      <TableCell>{duracionPromedio} min</TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          parseFloat(duracionPromedio) <= 10 ? "bg-success/10 text-success" : parseFloat(duracionPromedio) <= 15 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
                        )}>
                          {parseFloat(duracionPromedio) <= 10 ? "Óptimo" : parseFloat(duracionPromedio) <= 15 ? "Aceptable" : "Revisar"}
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. OBSERVACIONES Y RECOMENDACIONES */}
        <TabsContent value="observaciones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Observaciones Generales</CardTitle>
              <CardDescription>Comentarios cualitativos sobre el período analizado</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Añada observaciones sobre el período, patrones identificados, situaciones destacadas..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={6}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recomendaciones y Acciones Sugeridas</CardTitle>
              <CardDescription>Propuestas de mejora basadas en los resultados</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Necesidades de seguimiento adicional, casos que requieren intervención urgente, propuestas de mejora..."
                value={recomendaciones}
                onChange={(e) => setRecomendaciones(e.target.value)}
                rows={6}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reportes;
