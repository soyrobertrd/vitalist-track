import { Card, CardContent } from "@/components/ui/card";
import { PacienteCard } from "@/components/PacienteCard";
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
}

export function PacientesGrid({
  pacientes,
  personal,
  isAdmin,
  onViewDetail,
  onEdit,
  onAgendarLlamada,
  onAgendarVisita,
  onDelete
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
          />
        );
      })}
    </div>
  );
}
