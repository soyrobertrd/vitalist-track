import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Filter } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { DetectarDuplicadosDialog } from "@/components/DetectarDuplicadosDialog";
import type { Paciente } from "@/hooks/usePacientes";

interface PacientesHeaderProps {
  isAdmin: boolean;
  filteredPacientes: Paciente[];
  onImportClick: () => void;
  onNewPacienteClick: () => void;
  onToggleFilters?: () => void;
  showFilters?: boolean;
  hideTitle?: boolean;
}

export function PacientesHeader({ 
  isAdmin, 
  filteredPacientes, 
  onImportClick, 
  onNewPacienteClick,
  onToggleFilters,
  showFilters = false,
  hideTitle = false
}: PacientesHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Header - Título y descripción */}
      {!hideTitle && (
        <div>
          <h1 className="text-3xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground">Gestión de pacientes del programa</p>
        </div>
      )}

      {/* Botones principales en una fila */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onNewPacienteClick}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Paciente
        </Button>
        
        <ExportButton
          data={filteredPacientes.map((p) => ({
            cedula: p.cedula,
            nombre: p.nombre,
            apellido: p.apellido,
            contacto: p.contacto_px || '',
            zona: p.zona || '',
            barrio: p.barrio || '',
            estado: p.status_px,
            dificultad: p.grado_dificultad || ''
          }))}
          filename="pacientes"
          title="Reporte de Pacientes"
        />

        {onToggleFilters && (
          <Button 
            variant={showFilters ? "secondary" : "outline"} 
            size="sm" 
            onClick={onToggleFilters}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        )}

        {isAdmin && (
          <>
            <Button variant="outline" size="sm" onClick={onImportClick}>
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Button>
            <DetectarDuplicadosDialog />
          </>
        )}
      </div>
    </div>
  );
}
