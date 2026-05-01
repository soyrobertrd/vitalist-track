import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import { AgendarLlamadaDialog } from "@/components/AgendarLlamadaDialog";
import { usePacientes } from "@/hooks/usePacientes";
import { usePersonal } from "@/hooks/usePersonal";
import { toast } from "sonner";

interface Props {
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "secondary" | "ghost";
  label?: string;
  pacienteId?: string;
  className?: string;
}

/**
 * Botón unificado para agendar una cita rápidamente.
 * Disponible en Agenda, Calendario, Pacientes y Ficha del paciente.
 */
export function AgendarCitaButton({ size = "default", variant = "default", label = "Agendar cita", pacienteId, className }: Props) {
  const [open, setOpen] = useState(false);
  const { pacientes } = usePacientes();
  const { personal } = usePersonal();

  return (
    <>
      <Button size={size} variant={variant} onClick={() => setOpen(true)} className={className}>
        <CalendarPlus className="h-4 w-4 mr-2" />
        {label}
      </Button>
      <AgendarLlamadaDialog
        open={open}
        onOpenChange={setOpen}
        pacientes={pacientes.map((p) => ({ ...p, id: p.id }))}
        personal={personal}
        onSuccess={() => {
          toast.success("Cita agendada");
          setOpen(false);
        }}
      />
    </>
  );
}
