import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Plus, Calendar, Filter, TrendingUp, Clock, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AgendarLlamadaDialog } from "@/components/AgendarLlamadaDialog";
import { LlamadaDetailDialog } from "@/components/LlamadaDetailDialog";
import { IndicadoresLlamadas } from "@/components/IndicadoresLlamadas";
import { ImportLlamadasDialog } from "@/components/ImportLlamadasDialog";

interface Llamada {
  id: string;
  fecha_agendada: string | null;
  fecha_hora_realizada: string | null;
  estado: string;
  motivo: string | null;
  comentarios_resultados: string | null;
  resultado_seguimiento: string | null;
  duracion_minutos: number | null;
  duracion_estimada: number | null;
  requiere_seguimiento: boolean;
  notas_adicionales: string | null;
  pacientes: { nombre: string; apellido: string } | null;
  personal_salud: { nombre: string; apellido: string } | null;
}

const Llamadas = () => {
  const [llamadas, setLlamadas] = useState<Llamada[]>([]);
  const [llamadasAgendadas, setLlamadasAgendadas] = useState<Llamada[]>([]);
  const [llamadasHistorial, setLlamadasHistorial] = useState<Llamada[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [personal, setPersonal] = useState<any[]>([]);
  const [openAgendar, setOpenAgendar] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedLlamada, setSelectedLlamada] = useState<Llamada | null>(null);
  
  // Filtros
  const [filtrosVisible, setFiltrosVisible] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroResultado, setFiltroResultado] = useState<string>("todos");
  const [filtroProfesional, setFiltroProfesional] = useState<string>("todos");
  const [filtroFechaInicio, setFiltroFechaInicio] = useState<string>("");
  const [filtroFechaFin, setFiltroFechaFin] = useState<string>("");
  const [busquedaPaciente, setBusquedaPaciente] = useState<string>("");

  const fetchData = async () => {
    const [llamadasRes, pacientesRes, personalRes] = await Promise.all([
      supabase
        .from("registro_llamadas")
        .select("*, pacientes!registro_llamadas_paciente_id_fkey(nombre, apellido), personal_salud!registro_llamadas_profesional_id_fkey(nombre, apellido)")
        .order("fecha_agendada", { ascending: true }),
      supabase.from("pacientes").select("*").eq("status_px", "activo"),
      supabase.from("personal_salud").select("*").eq("activo", true),
    ]);

    if (llamadasRes.data) {
      const todasLlamadas = llamadasRes.data as any[];
      setLlamadas(todasLlamadas);
      
      // Separar agendadas de historial - excluir realizadas
      const agendadas = todasLlamadas.filter(
        l => l.estado === 'agendada' || l.estado === 'pendiente'
      );
      const historial = todasLlamadas.filter(
        l => l.estado === 'realizada' || l.estado === 'cancelada' || l.estado === 'no_contesta'
      );
      
      setLlamadasAgendadas(agendadas);
      setLlamadasHistorial(historial);
    }
    if (pacientesRes.data) setPacientes(pacientesRes.data);
    if (personalRes.data) setPersonal(personalRes.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatearTexto = (texto: string | null) => {
    if (!texto) return 'N/A';
    return texto
      .split('_')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ');
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "agendada":
      case "pendiente":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "realizada":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
      case "cancelada":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
      case "reagendada":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
      case "no_contesta":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getResultadoBadgeColor = (resultado: string | null) => {
    switch (resultado) {
      case "contactado":
        return "bg-success/10 text-success border-success/20";
      case "no_contesta":
      case "no_contestada":
        return "bg-warning/10 text-warning border-warning/20";
      case "visita_agendada":
        return "bg-primary/10 text-primary border-primary/20";
      case "requiere_seguimiento":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  const aplicarFiltros = (llamadasList: Llamada[]) => {
    let filtradas = [...llamadasList];

    if (filtroEstado !== "todos") {
      filtradas = filtradas.filter(l => l.estado === filtroEstado);
    }

    if (filtroResultado !== "todos") {
      filtradas = filtradas.filter(l => l.resultado_seguimiento === filtroResultado);
    }

    if (filtroProfesional !== "todos") {
      filtradas = filtradas.filter(l => l.personal_salud && personal.find(p => p.id === filtroProfesional));
    }

    if (filtroFechaInicio) {
      filtradas = filtradas.filter(l => {
        const fecha = l.fecha_agendada || l.fecha_hora_realizada;
        return fecha && new Date(fecha) >= new Date(filtroFechaInicio);
      });
    }

    if (filtroFechaFin) {
      filtradas = filtradas.filter(l => {
        const fecha = l.fecha_agendada || l.fecha_hora_realizada;
        return fecha && new Date(fecha) <= new Date(filtroFechaFin);
      });
    }

    if (busquedaPaciente) {
      filtradas = filtradas.filter(l => 
        l.pacientes && 
        `${l.pacientes.nombre} ${l.pacientes.apellido}`.toLowerCase().includes(busquedaPaciente.toLowerCase())
      );
    }

    return filtradas;
  };

  const handleLlamadaClick = (llamada: Llamada) => {
    setSelectedLlamada(llamada);
    setOpenDetail(true);
  };

  const isCallOverdue = (llamada: Llamada) => {
    if (llamada.fecha_agendada && (llamada.estado === 'agendada' || llamada.estado === 'pendiente')) {
      return new Date(llamada.fecha_agendada) < new Date();
    }
    return false;
  };

  const renderLlamadaCardAgendada = (llamada: Llamada) => {
    const overdue = isCallOverdue(llamada);
    
    return (
      <Card 
        key={llamada.id}
        className={`cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] flex flex-col h-full ${
          overdue ? 'border-destructive border-2 bg-destructive/5' : ''
        }`}
        onClick={() => handleLlamadaClick(llamada)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base line-clamp-2 flex-1">
              {llamada.pacientes?.nombre} {llamada.pacientes?.apellido}
              {overdue && <span className="text-destructive ml-2">⚠️ Retrasada</span>}
            </CardTitle>
            <Badge className={getEstadoBadgeColor(llamada.estado)} variant="secondary">
              {formatearTexto(llamada.estado)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3 flex-1 flex flex-col">
          {llamada.fecha_agendada && (
            <div className="bg-primary/5 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Fecha y Hora</p>
              <p className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                {format(new Date(llamada.fecha_agendada), "dd/MM/yyyy")}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(llamada.fecha_agendada), "HH:mm")}
              </p>
            </div>
          )}
          
          {llamada.personal_salud && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Profesional Asignado</p>
              <p className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                {llamada.personal_salud.nombre} {llamada.personal_salud.apellido}
              </p>
            </div>
          )}
          
          {llamada.duracion_estimada && (
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Duración: {llamada.duracion_estimada} min
            </p>
          )}
          
          {llamada.resultado_seguimiento && (
            <Badge variant="outline" className={`${getResultadoBadgeColor(llamada.resultado_seguimiento)} w-full justify-center`}>
              {formatearTexto(llamada.resultado_seguimiento)}
            </Badge>
          )}
          
          {llamada.motivo && (
            <p className="text-xs text-muted-foreground line-clamp-2 pt-2 border-t mt-auto">
              {llamada.motivo}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderLlamadaCardHistorial = (llamada: Llamada) => (
    <Card 
      key={llamada.id} 
      className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.01] border-l-4"
      style={{
        borderLeftColor: llamada.estado === 'realizada' 
          ? 'hsl(var(--success))' 
          : llamada.estado === 'cancelada'
          ? 'hsl(var(--destructive))'
          : 'hsl(var(--muted))'
      }}
      onClick={() => handleLlamadaClick(llamada)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1 p-2 rounded-lg bg-primary/10">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg mb-1">
                {llamada.pacientes?.nombre || 'N/A'} {llamada.pacientes?.apellido || ''}
              </CardTitle>
              {llamada.personal_salud && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <span className="font-medium">Profesional:</span>
                  {llamada.personal_salud.nombre} {llamada.personal_salud.apellido}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge variant="outline" className={getEstadoBadgeColor(llamada.estado)}>
              {formatearTexto(llamada.estado)}
            </Badge>
            {llamada.resultado_seguimiento && (
              <Badge variant="outline" className={getResultadoBadgeColor(llamada.resultado_seguimiento)}>
                {formatearTexto(llamada.resultado_seguimiento)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {llamada.fecha_hora_realizada && (
            <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
              <Calendar className="h-4 w-4 text-primary mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Fecha Realizada</p>
                <p className="text-sm font-semibold">
                  {format(new Date(llamada.fecha_hora_realizada), "PPP", { locale: es })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(llamada.fecha_hora_realizada), "p", { locale: es })}
                </p>
              </div>
            </div>
          )}
          {llamada.duracion_minutos && (
            <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
              <Phone className="h-4 w-4 text-success mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">Duración</p>
                <p className="text-sm font-semibold">{llamada.duracion_minutos} minutos</p>
              </div>
            </div>
          )}
        </div>
        {llamada.motivo && (
          <div className="pt-2 border-t">
            <p className="text-sm">
              <span className="font-medium text-muted-foreground">Motivo:</span>{' '}
              <span className="text-foreground">{llamada.motivo}</span>
            </p>
          </div>
        )}
        {llamada.requiere_seguimiento && (
          <Badge variant="destructive" className="mt-2">
            Requiere Seguimiento
          </Badge>
        )}
      </CardContent>
    </Card>
  );

  const llamadasAgendadasFiltradas = aplicarFiltros(llamadasAgendadas);
  const llamadasHistorialFiltradas = aplicarFiltros(llamadasHistorial);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Llamadas</h1>
          <p className="text-muted-foreground">Agendamiento y seguimiento telefónico</p>
        </div>
        <div className="flex gap-2">
          <ImportLlamadasDialog onSuccess={fetchData} />
          <Button onClick={() => setOpenAgendar(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Agendar Llamada
          </Button>
        </div>
      </div>

      {/* Indicadores de Rendimiento */}
      <IndicadoresLlamadas />

      {/* Toggle Filtros */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={() => setFiltrosVisible(!filtrosVisible)}
        >
          <Filter className="mr-2 h-4 w-4" />
          {filtrosVisible ? "Ocultar Filtros" : "Mostrar Filtros"}
        </Button>
      </div>

      {/* Filtros */}
      {filtrosVisible && (
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar Paciente</label>
              <Input
                placeholder="Nombre del paciente..."
                value={busquedaPaciente}
                onChange={(e) => setBusquedaPaciente(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="agendada">Agendada</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="realizada">Realizada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="reagendada">Reagendada</SelectItem>
                  <SelectItem value="no_contesta">No Contesta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Resultado</label>
              <Select value={filtroResultado} onValueChange={setFiltroResultado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="contactado">Contactado</SelectItem>
                  <SelectItem value="no_contesta">No Contesta</SelectItem>
                  <SelectItem value="mensaje_dejado">Mensaje Dejado</SelectItem>
                  <SelectItem value="llamada_fallida">Llamada Fallida</SelectItem>
                  <SelectItem value="requiere_seguimiento">Requiere Seguimiento</SelectItem>
                  <SelectItem value="visita_agendada">Visita Agendada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Profesional</label>
              <Select value={filtroProfesional} onValueChange={setFiltroProfesional}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {personal.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} {p.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Inicio</label>
              <Input
                type="date"
                value={filtroFechaInicio}
                onChange={(e) => setFiltroFechaInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Fin</label>
              <Input
                type="date"
                value={filtroFechaFin}
                onChange={(e) => setFiltroFechaFin(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Tabs de Agendadas vs Historial */}
      <Tabs defaultValue="agendadas">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="agendadas">
            <Calendar className="mr-2 h-4 w-4" />
            Llamadas Agendadas ({llamadasAgendadasFiltradas.length})
          </TabsTrigger>
          <TabsTrigger value="historial">
            <TrendingUp className="mr-2 h-4 w-4" />
            Historial ({llamadasHistorialFiltradas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agendadas" className="space-y-4 mt-4">
          {llamadasAgendadasFiltradas.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                No hay llamadas agendadas
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {llamadasAgendadasFiltradas.map(renderLlamadaCardAgendada)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="historial" className="space-y-4 mt-4">
          {llamadasHistorialFiltradas.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                No hay llamadas en el historial
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {llamadasHistorialFiltradas.map(renderLlamadaCardHistorial)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AgendarLlamadaDialog
        open={openAgendar}
        onOpenChange={setOpenAgendar}
        pacientes={pacientes}
        personal={personal}
        onSuccess={fetchData}
      />

      <LlamadaDetailDialog
        open={openDetail}
        onOpenChange={setOpenDetail}
        llamada={selectedLlamada}
        onSuccess={fetchData}
        pacientes={pacientes}
        personal={personal}
      />
    </div>
  );
};

export default Llamadas;
