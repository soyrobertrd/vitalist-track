import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Plus, Calendar, Filter, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AgendarLlamadaDialog } from "@/components/AgendarLlamadaDialog";
import { LlamadaDetailDialog } from "@/components/LlamadaDetailDialog";
import { IndicadoresLlamadas } from "@/components/IndicadoresLlamadas";

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
      
      // Separar agendadas de historial
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

  const getEstadoColor = (estado: string) => {
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

  const getResultadoColor = (resultado: string | null) => {
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

  const renderLlamadaCard = (llamada: Llamada) => (
    <Card 
      key={llamada.id} 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleLlamadaClick(llamada)}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 flex-1">
            <Phone className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">
                {llamada.pacientes?.nombre || 'N/A'} {llamada.pacientes?.apellido || ''}
              </CardTitle>
              {llamada.personal_salud && (
                <p className="text-sm text-muted-foreground">
                  {llamada.personal_salud.nombre} {llamada.personal_salud.apellido}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Badge variant="outline" className={getEstadoColor(llamada.estado)}>
              {llamada.estado?.replace("_", " ")}
            </Badge>
            {llamada.resultado_seguimiento && (
              <Badge variant="outline" className={getResultadoColor(llamada.resultado_seguimiento)}>
                {llamada.resultado_seguimiento?.replace("_", " ")}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-4 text-sm flex-wrap">
          {llamada.fecha_agendada && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Agendada:</span>
              <span>{format(new Date(llamada.fecha_agendada), "PPp", { locale: es })}</span>
            </div>
          )}
          {llamada.duracion_minutos && (
            <div>
              <span className="font-medium">Duración:</span> {llamada.duracion_minutos} min
            </div>
          )}
        </div>
        {llamada.motivo && (
          <p className="text-sm">
            <span className="font-medium">Motivo:</span> {llamada.motivo}
          </p>
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
        <Button onClick={() => setOpenAgendar(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Agendar Llamada
        </Button>
      </div>

      {/* Indicadores de Rendimiento */}
      <IndicadoresLlamadas />

      {/* Filtros */}
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
            <div className="grid gap-4">
              {llamadasAgendadasFiltradas.map(renderLlamadaCard)}
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
              {llamadasHistorialFiltradas.map(renderLlamadaCard)}
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
