import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Check, X, Clock, RefreshCw, TrendingUp, MessageCircle, Calendar, Phone } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HistorialRecordatorio {
  id: string;
  tipo_cita: string;
  cita_id: string;
  paciente_id: string;
  destinatarios: string[];
  canal: string;
  estado: string;
  intentos: number;
  tipo_recordatorio: string;
  enviado_at: string;
  created_at: string;
  error_mensaje?: string;
  pacientes?: {
    nombre: string;
    apellido: string;
  };
}

export function DashboardRecordatorios() {
  const [loading, setLoading] = useState(true);
  const [historial, setHistorial] = useState<HistorialRecordatorio[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    enviados: 0,
    fallidos: 0,
    reintentando: 0,
    porEmail: 0,
    porWhatsApp: 0,
    confirmados: 0,
    tasaConfirmacion: 0,
  });
  const [chartData, setChartData] = useState({
    porEstado: [] as any[],
    porCanal: [] as any[],
    tendenciaDiaria: [] as any[],
    porTipo: [] as any[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

    // Obtener historial de recordatorios
    const { data: historialData, error: historialError } = await supabase
      .from("historial_recordatorios")
      .select(`
        *,
        pacientes(nombre, apellido)
      `)
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false })
      .limit(100);

    if (historialError) {
      console.error("Error al obtener historial:", historialError);
    }

    // Obtener citas confirmadas tras recordatorio
    const { data: llamadasConfirmadas } = await supabase
      .from("registro_llamadas")
      .select("id")
      .eq("confirmado_por_recordatorio", true)
      .gte("created_at", thirtyDaysAgo);

    const { data: visitasConfirmadas } = await supabase
      .from("control_visitas")
      .select("id")
      .eq("confirmado_por_recordatorio", true)
      .gte("created_at", thirtyDaysAgo);

    const data = historialData || [];
    setHistorial(data as HistorialRecordatorio[]);

    // Calcular estadísticas
    const enviados = data.filter(h => h.estado === "enviado").length;
    const fallidos = data.filter(h => h.estado === "fallido").length;
    const reintentando = data.filter(h => h.estado === "reintentando").length;
    const porEmail = data.filter(h => h.canal === "email").length;
    const porWhatsApp = data.filter(h => h.canal === "whatsapp").length;
    const confirmados = (llamadasConfirmadas?.length || 0) + (visitasConfirmadas?.length || 0);
    const tasaConfirmacion = enviados > 0 ? Math.round((confirmados / enviados) * 100) : 0;

    setStats({
      total: data.length,
      enviados,
      fallidos,
      reintentando,
      porEmail,
      porWhatsApp,
      confirmados,
      tasaConfirmacion,
    });

    // Preparar datos para gráficos
    const porEstado = [
      { name: "Enviados", value: enviados, color: "hsl(var(--success))" },
      { name: "Fallidos", value: fallidos, color: "hsl(var(--destructive))" },
      { name: "Reintentando", value: reintentando, color: "hsl(var(--warning))" },
    ].filter(d => d.value > 0);

    const porCanal = [
      { name: "Email", value: porEmail, color: "hsl(var(--primary))" },
      { name: "WhatsApp", value: porWhatsApp, color: "#25D366" },
    ].filter(d => d.value > 0);

    // Tendencia diaria (últimos 7 días)
    const tendenciaDiaria = [];
    for (let i = 6; i >= 0; i--) {
      const dia = subDays(new Date(), i);
      const inicio = startOfDay(dia).toISOString();
      const fin = endOfDay(dia).toISOString();
      const delDia = data.filter(h => h.created_at >= inicio && h.created_at <= fin);
      tendenciaDiaria.push({
        name: format(dia, "EEE", { locale: es }),
        enviados: delDia.filter(h => h.estado === "enviado").length,
        fallidos: delDia.filter(h => h.estado === "fallido").length,
      });
    }

    // Por tipo de recordatorio
    const porTipo = [
      { name: "3 días antes", value: data.filter(h => h.tipo_recordatorio === "3_dias").length },
      { name: "1 día antes", value: data.filter(h => h.tipo_recordatorio === "1_dia").length },
      { name: "2 horas antes", value: data.filter(h => h.tipo_recordatorio === "2_horas").length },
    ].filter(d => d.value > 0);

    setChartData({ porEstado, porCanal, tendenciaDiaria, porTipo });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de estadísticas */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Enviados</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enviados}</div>
            <p className="text-xs text-muted-foreground">
              de {stats.total} recordatorios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Tasa de Confirmación</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tasaConfirmacion}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.confirmados} citas confirmadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Fallidos</CardTitle>
            <X className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.fallidos}</div>
            <p className="text-xs text-muted-foreground">
              {stats.reintentando} en reintento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Por Canal</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span className="font-bold">{stats.porEmail}</span>
              </div>
              <div className="flex items-center gap-1">
                <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4 text-[#25D366]" />
                <span className="font-bold">{stats.porWhatsApp}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tendencia diaria */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia Semanal</CardTitle>
            <CardDescription>Recordatorios enviados por día</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData.tendenciaDiaria}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="enviados" 
                  stroke="hsl(var(--primary))" 
                  name="Enviados"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="fallidos" 
                  stroke="hsl(var(--destructive))" 
                  name="Fallidos"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Por estado */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Recordatorios</CardTitle>
            <CardDescription>Distribución por estado</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData.porEstado}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {chartData.porEstado.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Por tipo de recordatorio */}
        <Card>
          <CardHeader>
            <CardTitle>Por Anticipación</CardTitle>
            <CardDescription>Recordatorios según tiempo antes de la cita</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.porTipo} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" className="text-muted-foreground" />
                <YAxis dataKey="name" type="category" className="text-muted-foreground" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" name="Recordatorios" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Historial reciente */}
        <Card>
          <CardHeader>
            <CardTitle>Historial Reciente</CardTitle>
            <CardDescription>Últimos recordatorios enviados</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {historial.slice(0, 10).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {item.canal === "email" ? (
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4 text-[#25D366]" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {item.pacientes ? `${item.pacientes.nombre} ${item.pacientes.apellido}` : "Paciente"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.tipo_cita === "llamada" ? <Phone className="h-3 w-3 inline mr-1" /> : <Calendar className="h-3 w-3 inline mr-1" />}
                          {format(new Date(item.created_at), "dd/MM HH:mm", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      item.estado === "enviado" ? "default" :
                      item.estado === "fallido" ? "destructive" : "secondary"
                    }>
                      {item.estado === "enviado" && <Check className="h-3 w-3 mr-1" />}
                      {item.estado === "fallido" && <X className="h-3 w-3 mr-1" />}
                      {item.estado === "reintentando" && <RefreshCw className="h-3 w-3 mr-1" />}
                      {item.estado}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
