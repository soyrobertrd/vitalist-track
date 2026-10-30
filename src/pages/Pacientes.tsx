import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Users, UserX, Search, RotateCcw, Pencil, Eye, Calendar, ExternalLink } from "lucide-react";
import { db } from "@/integrations/db/client";
import { DataTable, ColumnDef } from "@/components/common/DataTable";

// Hooks
import { usePacientes } from "@/hooks/usePacientes";
import { usePersonal } from "@/hooks/usePersonal";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { useEnforcePlanLimit } from "@/hooks/useEnforcePlanLimit";

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
import { BulkActionsToolbar, PACIENTE_BULK_ACTIONS, BulkActionType } from "@/components/BulkActionsToolbar";
import { AgendarCitaButton } from "@/components/AgendarCitaButton";
import { PlanLimitAlert } from "@/components/PlanLimitAlert";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";

const MOTIVO_LABELS: Record<string, string> = {
  viaje: "De viaje",
  cambio_ars: "Cambió ARS",
  referido_paliativo: "Referido a paliativo",
  referido_otro_programa: "Referido a otro programa",
  decision_paciente: "Decisión del paciente",
  otro: "Otro motivo",
  sin_motivo: "Sin motivo especificado"
};

const Pacientes = () => {
  const navigate = useNavigate();
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
  const { canCreate } = useEnforcePlanLimit();

  // Bulk selection
  const bulkSelection = useBulkSelection(filteredPacientesActivos);
  const [selectionMode, setSelectionMode] = useState(false);

  // Dialog states
  // ?nuevo=1 (p. ej. desde el dashboard) abre directamente el formulario de nuevo paciente
  const [open, setOpen] = useState(() => new URLSearchParams(window.location.search).get("nuevo") === "1");
  const [importOpen, setImportOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [agendarLlamadaOpen, setAgendarLlamadaOpen] = useState(false);
  const [agendarVisitaOpen, setAgendarVisitaOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Selected states
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);
  const [selectedPaciente, setSelectedPaciente] = useState<any>(null);
  const [pacienteParaAgendar, setPacienteParaAgendar] = useState<string | null>(null);

  // Get unique barrios and clinicas for filter
  const barriosActivos = useMemo(() => {
    return [...new Set(pacientesActivos.map(p => p.barrio).filter(Boolean))].sort() as string[];
  }, [pacientesActivos]);

  const clinicasActivas = useMemo(() => {
    return [...new Set(pacientesActivos.map(p => p.clinica_origen).filter(Boolean))].sort() as string[];
  }, [pacientesActivos]);

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

  const handleReactivar = async (pacienteId: string, nombre: string) => {
    const { error } = await db
      .from("pacientes")
      .update({ status_px: "activo", motivo_inactividad: null })
      .eq("id", pacienteId);

    if (error) {
      toast.error("Error al reactivar paciente");
    } else {
      toast.success(`${nombre} ha sido reactivado`);
      fetchPacientesActivos();
      fetchPacientesInactivos();
    }
  };

  // Contador por motivo de inactividad
  const contadoresPorMotivo = useMemo(() => {
    const contadores: Record<string, number> = {};
    pacientesInactivos.forEach((p) => {
      const motivo = p.motivo_inactividad || "sin_motivo";
      contadores[motivo] = (contadores[motivo] || 0) + 1;
    });
    return contadores;
  }, [pacientesInactivos]);

  // Handle bulk actions
  const handleBulkAction = async (action: BulkActionType, value?: string) => {
    if (bulkSelection.selectedCount === 0) return;

    const selectedIds = Array.from(bulkSelection.selectedIds);

    try {
      if (action === "assign_professional" && value) {
        const { error } = await db
          .from("pacientes")
          .update({ profesional_asignado_id: value })
          .in("id", selectedIds);

        if (error) throw error;
        toast.success(`${selectedIds.length} paciente(s) asignados al profesional`);
      } else if (action === "change_status" && value) {
        const updateData: any = { status_px: value };
        if (value === "activo") {
          updateData.motivo_inactividad = null;
        }
        
        const { error } = await db
          .from("pacientes")
          .update(updateData)
          .in("id", selectedIds);

        if (error) throw error;
        toast.success(`${selectedIds.length} paciente(s) actualizados a ${value}`);
      }

      bulkSelection.clearSelection();
      setSelectionMode(false);
      fetchPacientesActivos();
      fetchPacientesInactivos();
    } catch (error) {
      toast.error("Error al ejecutar acción masiva");
    }
  };
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <ClinicalPageHeader title="Pacientes" subtitle="Gestión de pacientes del programa" />
            {/* Acciones principales agrupadas a la derecha del título */}
            <div className="flex flex-wrap items-center gap-2">
              <AgendarCitaButton size="sm" variant="outline" className="rounded-full" />
              <Button size="sm" className="rounded-full" onClick={() => { if (canCreate("pacientes")) setOpen(true); }}>
                <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Nuevo paciente
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
              <TabsList>
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
              {activeTab === "activos" && (
                <PacientesHeader
                  isAdmin={isAdmin}
                  filteredPacientes={filteredPacientesActivos}
                  onImportClick={() => { if (canCreate("pacientes")) setImportOpen(true); }}
                  onToggleFilters={() => setShowFilters(!showFilters)}
                  showFilters={showFilters}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  selectionMode={selectionMode}
                  onToggleSelection={() => {
                    setSelectionMode(!selectionMode);
                    if (selectionMode) bulkSelection.clearSelection();
                  }}
                />
              )}
          </div>
        </div>

        <TabsContent value="activos" className="mt-6 space-y-6">
          <PlanLimitAlert resource="pacientes" />
          {showFilters && (
            <>
              <div className="lg:block hidden">
                <PacienteFiltersCard
                  filters={filtersActivos}
                  onFilterChange={updateFilterActivos}
                  barrios={barriosActivos}
                  clinicas={clinicasActivas}
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

          {viewMode === "cards" ? (
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
              selectionMode={selectionMode}
              isSelected={bulkSelection.isSelected}
              onToggleSelect={bulkSelection.toggleSelection}
              onToggleSelectAll={bulkSelection.toggleSelectAll}
              isAllSelected={bulkSelection.isAllSelected}
              isSomeSelected={bulkSelection.isSomeSelected}
            />
          ) : (
            <DataTable
              data={filteredPacientesActivos}
              columns={[
                {
                  key: "nombre",
                  header: "Paciente",
                  sortable: true,
                  render: (p) => (
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs uppercase shrink-0">
                        {(p.nombre?.[0] || "") + (p.apellido?.[0] || "")}
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          className="font-medium text-foreground truncate hover:text-primary hover:underline text-left"
                          onClick={() => {
                            setSelectedPacienteId(p.id);
                            setDetailOpen(true);
                          }}
                        >
                          {p.nombre} {p.apellido}
                        </button>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {p.cedula || "Sin doc."}
                        </p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "contacto_px",
                  header: "Contacto",
                  render: (p) => (
                    <span className="tabular-nums text-xs">
                      {p.contacto_px || p.contacto_cuidador || "—"}
                    </span>
                  ),
                },
                {
                  key: "zona",
                  header: "Municipio / Sector",
                  sortable: true,
                  render: (p) => (
                    <div className="truncate max-w-[150px]">
                      <p className="truncate font-medium">{p.zona || "—"}</p>
                      {p.barrio && <p className="text-[11px] text-muted-foreground truncate">{p.barrio}</p>}
                    </div>
                  ),
                },
                {
                  key: "tipo_atencion",
                  header: "Modalidad",
                  sortable: true,
                  render: (p) => (
                    <Badge
                      variant={p.tipo_atencion === "domiciliario" ? "outline" : "secondary"}
                      className="text-[10px] capitalize font-medium"
                    >
                      {p.tipo_atencion || "ambulatorio"}
                    </Badge>
                  ),
                },
                {
                  key: "clinica_origen",
                  header: "Clínica Origen",
                  sortable: true,
                  render: (p) => p.clinica_origen ? (
                    <Badge variant="outline" className="text-[10px] truncate max-w-[120px]">
                      {p.clinica_origen}
                    </Badge>
                  ) : <span className="text-muted-foreground/60 text-xs">—</span>,
                },
                {
                  key: "grado_dificultad",
                  header: "Dificultad",
                  sortable: true,
                  render: (p) => {
                    const dif = p.grado_dificultad || "medio";
                    return (
                      <Badge
                        variant={dif === "alto" ? "destructive" : dif === "medio" ? "secondary" : "outline"}
                        className="text-[10px] capitalize"
                      >
                        {dif}
                      </Badge>
                    );
                  },
                },
              ]}
              searchPlaceholder="Buscar por nombre, documento o zona..."
              pageSize={10}
              emptyMessage="No hay pacientes activos que coincidan con la búsqueda."
              actions={(p) => (
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => navigate(`/hub-paciente/${p.id}`)}
                    title="Expediente Hub 360°"
                    aria-label="Expediente Hub 360°"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-primary hover:text-primary/80" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      setSelectedPacienteId(p.id);
                      setDetailOpen(true);
                    }}
                    title="Ver Ficha Rápida"
                    aria-label="Ver Ficha Rápida"
                  >
                    <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      setPacienteParaAgendar(p.id);
                      setAgendarVisitaOpen(true);
                    }}
                    title="Agendar Cita"
                    aria-label="Agendar Cita"
                  >
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      setSelectedPaciente(p);
                      setEditOpen(true);
                    }}
                    title="Editar"
                    aria-label="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </Button>
                </div>
              )}
            />
          )}

          {/* Bulk Actions Toolbar */}
          <BulkActionsToolbar
            selectedCount={bulkSelection.selectedCount}
            onClearSelection={() => {
              bulkSelection.clearSelection();
              setSelectionMode(false);
            }}
            onAction={handleBulkAction}
            actions={PACIENTE_BULK_ACTIONS(personal)}
          />
        </TabsContent>

        <TabsContent value="inactivos" className="mt-6 space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg border">
            <h3 className="font-medium mb-2">Pacientes Inactivos</h3>
            <p className="text-sm text-muted-foreground">
              Pacientes que han salido del programa temporalmente. Puedes reactivarlos directamente con el botón o editar su registro.
            </p>
          </div>

          {/* Contadores por motivo */}
          {Object.keys(contadoresPorMotivo).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(contadoresPorMotivo).map(([motivo, count]) => (
                <Badge 
                  key={motivo} 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => updateFilterInactivos("motivo_inactividad", motivo === "sin_motivo" ? "todos" : motivo)}
                >
                  {MOTIVO_LABELS[motivo] || motivo}: {count}
                </Badge>
              ))}
            </div>
          )}

          {/* Filtros para inactivos */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o cédula..."
                value={filtersInactivos.busqueda}
                onChange={(e) => updateFilterInactivos("busqueda", e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filtersInactivos.motivo_inactividad}
              onValueChange={(value) => updateFilterInactivos("motivo_inactividad", value)}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Motivo de inactividad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los motivos</SelectItem>
                <SelectItem value="viaje">De viaje</SelectItem>
                <SelectItem value="cambio_ars">Cambió ARS</SelectItem>
                <SelectItem value="referido_paliativo">Referido a paliativo</SelectItem>
                <SelectItem value="referido_otro_programa">Referido a otro programa</SelectItem>
                <SelectItem value="decision_paciente">Decisión del paciente</SelectItem>
                <SelectItem value="otro">Otro motivo</SelectItem>
              </SelectContent>
            </Select>
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
                  className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium">{paciente.nombre} {paciente.apellido}</h4>
                      <p className="text-sm text-muted-foreground">Cédula: {paciente.cedula}</p>
                      {paciente.zona && (
                        <p className="text-sm text-muted-foreground">Municipio: {paciente.zona.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                      {paciente.motivo_inactividad && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800">
                          {MOTIVO_LABELS[paciente.motivo_inactividad] || paciente.motivo_inactividad}
                        </Badge>
                      )}
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPaciente(paciente);
                            setEditOpen(true);
                          }}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleReactivar(paciente.id, `${paciente.nombre} ${paciente.apellido}`)}
                          className="gap-1"
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span className="hidden sm:inline">Reactivar</span>
                        </Button>
                      </div>
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
