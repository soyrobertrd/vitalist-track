import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Plus, Calendar, Filter, TrendingUp, Clock, User, AlertTriangle, CheckSquare } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { ProcesarLlamadasImportadasDialog } from "@/components/ProcesarLlamadasImportadasDialog";
import { useUserRole } from "@/hooks/useUserRole";
import { LlamadaCardAgendada } from "@/components/LlamadaCardAgendada";
import { PacientesSinCitasDialog } from "@/components/PacientesSinCitasDialog";
import { AlertaSobrecargaProfesional } from "@/components/AlertaSobrecargaProfesional";
import { ExportButton } from "@/components/ExportButton";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { BulkActionsToolbar, LLAMADA_BULK_ACTIONS, BulkActionType } from "@/components/BulkActionsToolbar";
import { Checkbox } from "@/components/ui/checkbox";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useActiveSucursal } from "@/contexts/ActiveSucursalContext";

import type { Paciente, Personal } from "@/types/db";

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
  const { currentWorkspace } = useWorkspace();
  const { activeSucursalId } = useActiveSucursal();
  const [llamadas, setLlamadas] = useState<Llamada[]>([]);
  const [llamadasAgendadas, setLlamadasAgendadas] = useState<Llamada[]>([]);
  const [llamadasHistorial, setLlamadasHistorial] = useState<Llamada[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [openAgendar, setOpenAgendar] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedLlamada, setSelectedLlamada] = useState<Llamada | null>(null);
  const { isAdmin } = useUserRole();
  
  // Filtros
  const [filtrosVisible, setFiltrosVisible] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroResultado, setFiltroResultado] = useState<string>("todos");
  const [filtroProfesional, setFiltroProfesional] = useState<string>("todos");
  const [filtroFechaInicio, setFiltroFechaInicio] = useState<string>("");
  const [filtroFechaFin, setFiltroFechaFin] = useState<string>("");
  const [busquedaPaciente, setBusquedaPaciente] = useState<string>("");
  const [showAllLlamadas, setShowAllLlamadas] = useState(false);
  const [pacientesSinLlamada, setPacientesSinLlamada] = useState<number>(0);
  const [listaPacientesSinLlamada, setListaPacientesSinLlamada] = useState<any[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const fetchData = async () => {
    const wsId = currentWorkspace?.id;
    let llamadasQuery = supabase
      .from("registro_llamadas")
      .select("*, pacientes!registro_llamadas_paciente_id_fkey(nombre, apellido), personal_salud!registro_llamadas_profesional_id_fkey(nombre, apellido)")
      .order("fecha_agendada", { ascending: true });
    let pacientesQuery = supabase.from("pacientes").select("*").eq("status_px", "activo");
    let personalQuery = supabase.from("personal_salud").select("*").eq("activo", true);
    if (wsId) {
      llamadasQuery = llamadasQuery.eq("workspace_id", wsId);
      pacientesQuery = pacientesQuery.eq("workspace_id", wsId);
      personalQuery = personalQuery.eq("workspace_id", wsId);
    }
    if (activeSucursalId) {
      llamadasQuery = llamadasQuery.eq("sucursal_id", activeSucursalId);
      pacientesQuery = pacientesQuery.eq("sucursal_id", activeSucursalId);
      personalQuery = personalQuery.eq("sucursal_id", activeSucursalId);
    }
    const [llamadasRes, pacientesRes, personalRes] = await Promise.all([
      llamadasQuery,
      pacientesQuery,
      personalQuery,
    ]);

    if (llamadasRes.data) {
      const todasLlamadas = llamadasRes.data as any[];
      setLlamadas(todasLlamadas);
      
      // Separar agendadas de historial
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      const agendadas = todasLlamadas.filter(
        l => {
          if (l.estado === 'agendada' || l.estado === 'pendiente') {
            return true;
          }
          // Include today's completed calls
          if ((l.estado === 'realizada' || l.estado === 'cancelada' || l.estado === 'no_contesta') && l.fecha_hora_realizada) {
            const fechaLlamada = new Date(l.fecha_hora_realizada);
            fechaLlamada.setHours(0, 0, 0, 0);
            return fechaLlamada.getTime() === hoy.getTime();
          }
          return false;
        }
      );
      
      const historial = todasLlamadas.filter(
        l => {
          if (l.estado === 'realizada' || l.estado === 'cancelada' || l.estado === 'no_contesta') {
            if (l.fecha_hora_realizada) {
              const fechaLlamada = new Date(l.fecha_hora_realizada);
              fechaLlamada.setHours(0, 0, 0, 0);
              return fechaLlamada.getTime() !== hoy.getTime();
            }
            return true;
          }
          return false;
        }
      );
      
      setLlamadasAgendadas(agendadas);
      setLlamadasHistorial(historial);
    }
    if (pacientesRes.data) {
      setPacientes(pacientesRes.data);
      
      // Calcular pacientes sin llamadas agendadas
      if (llamadasRes.data) {
        const pacientesConLlamada = new Set(
          (llamadasRes.data as any[])
            .filter(l => l.estado === 'agendada' || l.estado === 'pendiente')
            .map(l => l.paciente_id)
        );
        const sinLlamada = pacientesRes.data.filter(p => !pacientesConLlamada.has(p.id));
        setPacientesSinLlamada(sinLlamada.length);
        setListaPacientesSinLlamada(sinLlamada);
      }
    }
    if (personalRes.data) setPersonal(personalRes.data);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?.id, activeSucursalId]);

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
      const fechaLlamada = new Date(llamada.fecha_agendada);
      fechaLlamada.setHours(0, 0, 0, 0);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      // Si la fecha de hoy es al menos +1 día después de la fecha agendada, está atrasada
      return hoy.getTime() > fechaLlamada.getTime();
    }
    return false;
  };

  const isCallToday = (llamada: Llamada) => {
    if (llamada.fecha_agendada && (llamada.estado === 'agendada' || llamada.estado === 'pendiente')) {
      const fechaLlamada = new Date(llamada.fecha_agendada);
      fechaLlamada.setHours(0, 0, 0, 0);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      return hoy.getTime() === fechaLlamada.getTime();
    }
    return false;
  };


  const renderLlamadaCardHistorial = (llamada: Llamada) => (
    <div 
      key={llamada.id} 
      className="flex items-center gap-4 p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => handleLlamadaClick(llamada)}
    >
      <div 
        className="w-1 h-12 rounded-full"
        style={{
          backgroundColor: llamada.estado === 'realizada' 
            ? 'hsl(var(--success))' 
            : llamada.estado === 'cancelada'
            ? 'hsl(var(--destructive))'
            : 'hsl(var(--muted))'
        }}
      />
      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
        <Phone className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {llamada.pacientes?.nombre || 'N/A'} {llamada.pacientes?.apellido || ''}
        </p>
        <p className="text-sm text-muted-foreground">
          {llamada.fecha_hora_realizada 
            ? format(new Date(llamada.fecha_hora_realizada), "dd/MM/yyyy HH:mm", { locale: es })
            : llamada.fecha_agendada
            ? format(new Date(llamada.fecha_agendada), "dd/MM/yyyy HH:mm", { locale: es })
            : 'Sin fecha'}
          {llamada.duracion_minutos && ` • ${llamada.duracion_minutos} min`}
        </p>
      </div>
      <div className="flex flex-col gap-1 items-end shrink-0">
        <Badge variant="outline" className={`text-xs ${getEstadoBadgeColor(llamada.estado)}`}>
          {formatearTexto(llamada.estado)}
        </Badge>
        {llamada.resultado_seguimiento && (
          <Badge variant="outline" className={`text-xs ${getResultadoBadgeColor(llamada.resultado_seguimiento)}`}>
            {formatearTexto(llamada.resultado_seguimiento)}
          </Badge>
        )}
      </div>
    </div>
  );

  const llamadasAgendadasFiltradas = aplicarFiltros(llamadasAgendadas);
  const llamadasHistorialFiltradas = showAllLlamadas 
    ? aplicarFiltros(llamadasHistorial) 
    : [];

  // Bulk selection - use the filtered agendadas list
  const bulkSelection = useBulkSelection(llamadasAgendadasFiltradas);

  // Handle bulk actions for llamadas
  const handleBulkAction = async (action: BulkActionType, value?: string) => {
    if (bulkSelection.selectedCount === 0) return;

    const selectedIds = Array.from(bulkSelection.selectedIds);

    try {
      if (action === "assign_professional" && value) {
        const { error } = await supabase
          .from("registro_llamadas")
          .update({ profesional_id: value })
          .in("id", selectedIds);

        if (error) throw error;
        toast.success(`${selectedIds.length} llamada(s) reasignadas`);
      } else if (action === "change_status" && value) {
        const updateData: any = { estado: value };
        if (value === "realizada") {
          updateData.fecha_hora_realizada = new Date().toISOString();
        }
        
        const { error } = await supabase
          .from("registro_llamadas")
          .update(updateData)
          .in("id", selectedIds);

        if (error) throw error;
        toast.success(`${selectedIds.length} llamada(s) actualizadas`);
      }

      bulkSelection.clearSelection();
      setSelectionMode(false);
      fetchData();
    } catch (error) {
      toast.error("Error al ejecutar acción masiva");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - Solo título y descripción */}
      <div>
        <h1 className="text-3xl font-bold">Gestión de Llamadas</h1>
        <p className="text-muted-foreground">Agendamiento y seguimiento telefónico</p>
      </div>

      {/* Botón principal de acción */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setOpenAgendar(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Agendar Llamada
        </Button>
        <Button
          variant={selectionMode ? "default" : "outline"}
          onClick={() => {
            setSelectionMode(!selectionMode);
            if (selectionMode) bulkSelection.clearSelection();
          }}
        >
          <CheckSquare className="h-4 w-4 mr-2" />
          {selectionMode ? "Cancelar" : "Selección múltiple"}
        </Button>
      </div>

      {/* Alerta de sobrecarga de profesionales */}
      <AlertaSobrecargaProfesional />

      {/* Alerta de pacientes sin llamadas */}
      {pacientesSinLlamada > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atención</AlertTitle>
          <AlertDescription className="flex items-center gap-2">
            Hay {pacientesSinLlamada} paciente{pacientesSinLlamada > 1 ? 's' : ''} activo{pacientesSinLlamada > 1 ? 's' : ''} sin llamadas agendadas.
            <PacientesSinCitasDialog 
              pacientes={listaPacientesSinLlamada}
              tipo="llamadas"
              onAgendar={(pacienteId) => {
                setOpenAgendar(true);
              }}
            />
          </AlertDescription>
        </Alert>
      )}

      {/* Indicadores de Rendimiento - Hidden on Mobile */}
      <div className="hidden md:block">
        <IndicadoresLlamadas />
      </div>

      {/* Botones secundarios - Debajo de stats, solo desktop */}
      <div className="hidden md:flex gap-2">
        {isAdmin && (
          <>
            <ImportLlamadasDialog onSuccess={fetchData} />
            <ProcesarLlamadasImportadasDialog onSuccess={fetchData} />
          </>
        )}
        <ExportButton
          data={llamadas.map(l => ({
            paciente: `${l.pacientes?.nombre || ''} ${l.pacientes?.apellido || ''}`,
            profesional: `${l.personal_salud?.nombre || ''} ${l.personal_salud?.apellido || ''}`,
            fecha_agendada: l.fecha_agendada || '',
            estado: l.estado,
            motivo: l.motivo || '',
            resultado: l.resultado_seguimiento || ''
          }))}
          filename="llamadas"
          title="Reporte de Llamadas"
        />
        <Button variant="outline" size="sm" onClick={() => setFiltrosVisible(!filtrosVisible)}>
          <Filter className="mr-2 h-4 w-4" />
          {filtrosVisible ? "Ocultar Filtros" : "Filtros"}
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
            <>
              {/* Select All header when in selection mode */}
              {selectionMode && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <Checkbox
                    checked={bulkSelection.isAllSelected}
                    onCheckedChange={bulkSelection.toggleSelectAll}
                    className="h-5 w-5"
                  />
                  <span className="text-sm text-muted-foreground">
                    {bulkSelection.isAllSelected ? "Deseleccionar todos" : "Seleccionar todos"}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {llamadasAgendadasFiltradas.map((llamada) => (
                  <LlamadaCardAgendada
                    key={llamada.id}
                    llamada={llamada}
                    onLlamadaClick={handleLlamadaClick}
                    isCallOverdue={isCallOverdue}
                    isCallToday={isCallToday}
                    getEstadoBadgeColor={getEstadoBadgeColor}
                    getResultadoBadgeColor={getResultadoBadgeColor}
                    formatearTexto={formatearTexto}
                    selectionMode={selectionMode}
                    isSelected={bulkSelection.isSelected(llamada.id)}
                    onToggleSelect={() => bulkSelection.toggleSelection(llamada.id)}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="historial" className="space-y-4 mt-4">
          {!showAllLlamadas ? (
            <div className="text-center py-12">
              <Phone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Mostrando solo llamadas pendientes y del día de hoy
              </p>
              <Button onClick={() => setShowAllLlamadas(true)} variant="outline">
                Ver Más Llamadas
              </Button>
            </div>
          ) : llamadasHistorialFiltradas.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                No hay llamadas en el historial
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Button onClick={() => setShowAllLlamadas(false)} variant="outline">
                  Ocultar Historial
                </Button>
              </div>
              <Card>
                <CardContent className="p-0 divide-y">
                  {llamadasHistorialFiltradas.map(renderLlamadaCardHistorial)}
                </CardContent>
              </Card>
            </>
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

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={bulkSelection.selectedCount}
        onClearSelection={() => {
          bulkSelection.clearSelection();
          setSelectionMode(false);
        }}
        onAction={handleBulkAction}
        actions={LLAMADA_BULK_ACTIONS(personal)}
      />
    </div>
  );
};

export default Llamadas;
