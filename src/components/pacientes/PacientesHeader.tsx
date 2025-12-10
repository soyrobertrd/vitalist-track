import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { DetectarDuplicadosDialog } from "@/components/DetectarDuplicadosDialog";
import type { Paciente } from "@/hooks/usePacientes";

interface PacientesHeaderProps {
  isAdmin: boolean;
  filteredPacientes: Paciente[];
  onImportClick: () => void;
  onNewPacienteClick: () => void;
}

export function PacientesHeader({ 
  isAdmin, 
  filteredPacientes, 
  onImportClick, 
  onNewPacienteClick 
}: PacientesHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold">Pacientes</h1>
        <p className="text-muted-foreground">Gestión de pacientes del programa</p>
      </div>
      <div className="flex gap-2">
        {isAdmin && (
          <>
            <Button variant="outline" onClick={onImportClick}>
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Button>
            <DetectarDuplicadosDialog />
          </>
        )}
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
        <Button onClick={onNewPacienteClick}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Paciente
        </Button>
      </div>
    </div>
  );
}
