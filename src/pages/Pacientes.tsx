import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { addDays, format, isWeekend } from "date-fns";

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

const Pacientes = () => {
  const { 
    pacientes, 
    filteredPacientes, 
    filters, 
    updateFilter, 
    fetchPacientes,
    deletePaciente 
  } = usePacientes();
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
  const barrios = useMemo(() => {
    return [...new Set(pacientes.map(p => p.barrio).filter(Boolean))].sort() as string[];
  }, [pacientes]);

  const handlePacienteCreated = () => {
    setOpen(false);
    fetchPacientes();
    toast.success("Paciente agregado exitosamente con llamada agendada");
  };

  const handleDelete = async (id: string) => {
    const paciente = pacientes.find(p => p.id === id);
    if (paciente && confirm(`¿Está seguro de eliminar a ${paciente.nombre} ${paciente.apellido}? Esta acción no se puede deshacer.`)) {
      await deletePaciente(id);
    }
  };

  return (
    <div className="space-y-6">
      <PacientesHeader
        isAdmin={isAdmin}
        filteredPacientes={filteredPacientes}
        onImportClick={() => setImportOpen(true)}
        onNewPacienteClick={() => setOpen(true)}
        onToggleFilters={() => setShowFilters(!showFilters)}
        showFilters={showFilters}
      />

      {/* Filters - Toggle visibility */}
      {showFilters && (
        <>
          {/* Desktop Filters */}
          <div className="lg:block hidden">
            <PacienteFiltersCard
              filters={filters}
              onFilterChange={updateFilter}
              barrios={barrios}
            />
          </div>

          {/* Mobile Filters */}
          <div className="lg:hidden">
            <PacientesMobileFilters
              filters={filters}
              onFilterChange={updateFilter}
              barrios={barrios}
            />
          </div>
        </>
      )}

      {/* Patient Grid */}
      <PacientesGrid
        pacientes={filteredPacientes}
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
        onSuccess={fetchPacientes}
      />

      <ImportPacientesDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={fetchPacientes}
      />

      {pacienteParaAgendar && (
        <AgendarLlamadaDialog
          open={agendarLlamadaOpen}
          onOpenChange={setAgendarLlamadaOpen}
          pacientes={pacientes.map(p => ({ ...p, id: p.id }))}
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
