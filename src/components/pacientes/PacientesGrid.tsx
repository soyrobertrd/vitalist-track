import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PacienteCard } from "@/components/PacienteCard";
import { CheckSquare, Square } from "lucide-react";
import type { Paciente } from "@/hooks/usePacientes";
import type { Personal } from "@/hooks/usePersonal";

interface PacientesGridProps {
  pacientes: Paciente[];
  personal: Personal[];
  isAdmin: boolean;
  onViewDetail: (id: string) => void;
  onEdit: (paciente: Paciente) => void;
  onAgendarLlamada: (id: string) => void;
  onAgendarVisita: (id: string) => void;
  onDelete?: (id: string) => void;
  // Selection props
  selectionMode?: boolean;
  isSelected?: (id: string) => boolean;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  isAllSelected?: boolean;
  isSomeSelected?: boolean;
}

export function PacientesGrid({
  pacientes,
  personal,
  isAdmin,
  onViewDetail,
  onEdit,
  onAgendarLlamada,
  onAgendarVisita,
  onDelete,
  selectionMode = false,
  isSelected,
  onToggleSelect,
  onToggleSelectAll,
  isAllSelected,
  isSomeSelected,
}: PacientesGridProps) {
  if (pacientes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12 text-muted-foreground">
          No se encontraron pacientes
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Select All header when in selection mode */}
      {selectionMode && onToggleSelectAll && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={onToggleSelectAll}
            className="h-5 w-5"
          />
          <span className="text-sm text-muted-foreground">
            {isAllSelected ? "Deseleccionar todos" : isSomeSelected ? "Seleccionar todos" : "Seleccionar todos"}
          </span>
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pacientes.map((paciente) => {
          const profesional = personal.find(p => p.id === paciente.profesional_asignado_id);
          return (
            <PacienteCard
              key={paciente.id}
              paciente={paciente}
              profesionalNombre={profesional ? `${profesional.nombre} ${profesional.apellido}` : undefined}
              onViewDetail={() => onViewDetail(paciente.id)}
              onEdit={() => onEdit(paciente)}
              onAgendarLlamada={() => onAgendarLlamada(paciente.id)}
              onAgendarVisita={() => onAgendarVisita(paciente.id)}
              onDelete={isAdmin && onDelete ? () => onDelete(paciente.id) : undefined}
              isAdmin={isAdmin}
              selectionMode={selectionMode}
              isSelected={isSelected ? isSelected(paciente.id) : false}
              onToggleSelect={onToggleSelect ? () => onToggleSelect(paciente.id) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
