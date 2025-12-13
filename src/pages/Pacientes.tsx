import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Hooks
import { usePacientes } from "@/hooks/usePacientes";
import { usePersonal } from "@/hooks/usePersonal";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";

// Components
import { PacientesHeader } from "@/components/pacientes/PacientesHeader";
import { PacienteFiltersCard } from "@/components/pacientes/PacienteFilters";
import { PacientesMobileFilters } from "@/components/pacientes/PacientesMobileFilters";
import { PacientesGrid } from "@/components/pacientes/PacientesGrid";
import { PacienteDetailDialog } from "@/components/PacienteDetailDialog";
import { EditPacienteDialog } from "@/components/EditPacienteDialog";
import { ImportPacientesDialog } from "@/components/ImportPacientesDialog";
import { AgendarLlamadaDialog } from "@/components/AgendarLlamadaDialog";
import { NuevoPacienteForm } from "@/components/pacientes/NuevoPacienteForm";
import { Badge } from "@/components/ui/badge";

const MOTIVO_LABELS: Record<string, string> = {
  viaje: "De viaje",
  cambio_ars: "Cambió ARS",
  referido_paliativo: "Referido a paliativo",
  referido_otro_programa: "Referido a otro programa",
  decision_paciente: "Decisión del paciente",
  otro: "Otro motivo"
};

const Pacientes = () => {
  const [activeTab, setActiveTab] = useState<string>("activos");
  
  // Pacientes activos
  const { 
    pacientes: pacientesActivos, 
    filteredPacientes: filteredPacientesActivos, 
    filters: filtersActivos, 
    updateFilter: updateFilterActivos, 
    fetchPacientes: fetchPacientesActivos,
    deletePaciente: deletePacienteActivo 
  } = usePacientes(false);
  
  // Pacientes inactivos
  const { 
    pacientes: pacientesInactivos, 
    filteredPacientes: filteredPacientesInactivos, 
    filters: filtersInactivos, 
    updateFilter: updateFilterInactivos, 
    fetchPacientes: fetchPacientesInactivos,
  } = usePacientes(true);
  
  const { personal } = usePersonal();
  const { isAdmin } = useUserRole();
  const isMobile = useIsMobile();

  // Dialog states
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [agendarLlamadaOpen, setAgendarLlamadaOpen] = useState(false);
  const [agendarVisitaOpen, setAgendarVisitaOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Selected states
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);
  const [selectedPaciente, setSelectedPaciente] = useState<any>(null);
  const [pacienteParaAgendar, setPacienteParaAgendar] = useState<string | null>(null);

  // Get unique barrios for filter
  const barriosActivos = useMemo(() => {
    return [...new Set(pacientesActivos.map(p => p.barrio).filter(Boolean))].sort() as string[];
  }, [pacientesActivos]);

  const barriosInactivos = useMemo(() => {
    return [...new Set(pacientesInactivos.map(p => p.barrio).filter(Boolean))].sort() as string[];
  }, [pacientesInactivos]);

  const handlePacienteCreated = () => {
    setOpen(false);
    fetchPacientesActivos();
    toast.success("Paciente agregado exitosamente con llamada agendada");
  };

  const handleDelete = async (id: string) => {
    const paciente = pacientesActivos.find(p => p.id === id);
    if (paciente && confirm(`¿Está seguro de eliminar a ${paciente.nombre} ${paciente.apellido}? Esta acción no se puede deshacer.`)) {
      await deletePacienteActivo(id);
    }
  };

  const handleEditSuccess = () => {
    fetchPacientesActivos();
    fetchPacientesInactivos();
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Pacientes</h1>
              <p className="text-muted-foreground text-sm">Gestión de pacientes del programa</p>
            </div>
            <TabsList className="grid w-full sm:w-auto grid-cols-2">
              <TabsTrigger value="activos" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Activos</span>
                <Badge variant="secondary" className="ml-1">{pacientesActivos.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="inactivos" className="flex items-center gap-2">
                <UserX className="h-4 w-4" />
                <span>Inactivos</span>
                <Badge variant="outline" className="ml-1">{pacientesInactivos.length}</Badge>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="activos" className="mt-6 space-y-6">
          <PacientesHeader
            isAdmin={isAdmin}
            filteredPacientes={filteredPacientesActivos}
            onImportClick={() => setImportOpen(true)}
            onNewPacienteClick={() => setOpen(true)}
            onToggleFilters={() => setShowFilters(!showFilters)}
            showFilters={showFilters}
            hideTitle
          />

          {showFilters && (
            <>
              <div className="lg:block hidden">
                <PacienteFiltersCard
                  filters={filtersActivos}
                  onFilterChange={updateFilterActivos}
                  barrios={barriosActivos}
                />
              </div>
              <div className="lg:hidden">
                <PacientesMobileFilters
                  filters={filtersActivos}
                  onFilterChange={updateFilterActivos}
                  barrios={barriosActivos}
                />
              </div>
            </>
          )}

          <PacientesGrid
            pacientes={filteredPacientesActivos}
            personal={personal}
            isAdmin={isAdmin}
            onViewDetail={(id) => {
              setSelectedPacienteId(id);
              setDetailOpen(true);
            }}
            onEdit={(paciente) => {
              setSelectedPaciente(paciente);
              setEditOpen(true);
            }}
            onAgendarLlamada={(id) => {
              setPacienteParaAgendar(id);
              setAgendarLlamadaOpen(true);
            }}
            onAgendarVisita={(id) => {
              setPacienteParaAgendar(id);
              setAgendarVisitaOpen(true);
            }}
            onDelete={isAdmin ? handleDelete : undefined}
          />
        </TabsContent>

        <TabsContent value="inactivos" className="mt-6 space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg border">
            <h3 className="font-medium mb-2">Pacientes Inactivos</h3>
            <p className="text-sm text-muted-foreground">
              Pacientes que han salido del programa temporalmente. Puedes reactivarlos editando su registro.
            </p>
          </div>

          {showFilters && (
            <>
              <div className="lg:block hidden">
                <PacienteFiltersCard
                  filters={filtersInactivos}
                  onFilterChange={updateFilterInactivos}
                  barrios={barriosInactivos}
                />
              </div>
              <div className="lg:hidden">
                <PacientesMobileFilters
                  filters={filtersInactivos}
                  onFilterChange={updateFilterInactivos}
                  barrios={barriosInactivos}
                />
              </div>
            </>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
            </Button>
          </div>

          {filteredPacientesInactivos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay pacientes inactivos
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPacientesInactivos.map((paciente) => (
                <div 
                  key={paciente.id} 
                  className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedPaciente(paciente);
                    setEditOpen(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{paciente.nombre} {paciente.apellido}</h4>
                      <p className="text-sm text-muted-foreground">Cédula: {paciente.cedula}</p>
                      {paciente.zona && (
                        <p className="text-sm text-muted-foreground">Zona: {paciente.zona}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {paciente.motivo_inactividad && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          {MOTIVO_LABELS[paciente.motivo_inactividad] || paciente.motivo_inactividad}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">Click para editar</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Paciente</DialogTitle>
          </DialogHeader>
          <NuevoPacienteForm
            personal={personal}
            onSuccess={handlePacienteCreated}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <PacienteDetailDialog
        pacienteId={selectedPacienteId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <EditPacienteDialog
        paciente={selectedPaciente}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={handleEditSuccess}
      />

      <ImportPacientesDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={fetchPacientesActivos}
      />

      {pacienteParaAgendar && (
        <AgendarLlamadaDialog
          open={agendarLlamadaOpen}
          onOpenChange={setAgendarLlamadaOpen}
          pacientes={pacientesActivos.map(p => ({ ...p, id: p.id }))}
          personal={personal}
          onSuccess={() => {
            toast.success("Llamada agendada");
            setPacienteParaAgendar(null);
          }}
        />
      )}
    </div>
  );
};

export default Pacientes;
