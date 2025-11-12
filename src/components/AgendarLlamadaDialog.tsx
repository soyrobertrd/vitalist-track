import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PacienteCombobox } from "@/components/PacienteCombobox";
import { ProfesionalCombobox } from "@/components/ProfesionalCombobox";

const MOTIVOS_LLAMADA = [
  "Seguimiento rutinario",
  "Agendar visita",
  "Verificar medicación",
  "Control post-visita",
  "Recordatorio de cita",
  "Consulta sobre síntomas",
  "Actualización de datos",
  "Otro"
] as const;

interface AgendarLlamadaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacientes: any[];
  personal: any[];
  onSuccess: () => void;
}

export function AgendarLlamadaDialog({
  open,
  onOpenChange,
  pacientes,
  personal,
  onSuccess,
}: AgendarLlamadaDialogProps) {
  const [loading, setLoading] = useState(false);
  const [pacienteId, setPacienteId] = useState<string>("");
  const [profesionalId, setProfesionalId] = useState<string>("");
  const [motivo, setMotivo] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    const fechaAgendada = formData.get("fecha_agendada") as string;
    const horaAgendada = formData.get("hora_agendada") as string;
    const fechaHoraAgendada = `${fechaAgendada}T${horaAgendada}:00`;

    // Validar si ya existe una llamada agendada para este paciente
    const { data: existingLlamadas } = await supabase
      .from("registro_llamadas")
      .select("id")
      .eq("paciente_id", pacienteId)
      .in("estado", ["agendada", "pendiente"]);

    if (existingLlamadas && existingLlamadas.length > 0) {
      toast.error("Este paciente ya tiene una llamada agendada o pendiente");
      setLoading(false);
      return;
    }

    const comentarios = formData.get("comentarios") as string;
    const motivoFinal = comentarios ? `${motivo} - ${comentarios}` : motivo;

    const data = {
      paciente_id: pacienteId,
      profesional_id: profesionalId,
      motivo: motivoFinal,
      duracion_estimada: parseInt(formData.get("duracion_estimada") as string) || null,
      fecha_agendada: fechaHoraAgendada,
      estado: "agendada" as const,
      recordatorio_enviado: false,
    };

    const { error } = await supabase.from("registro_llamadas").insert([data]);

    if (error) {
      console.error("Error al agendar llamada:", error);
      toast.error("Error al agendar la llamada");
    } else {
      toast.success("Llamada agendada exitosamente");
      setPacienteId("");
      setProfesionalId("");
      setMotivo("");
      onOpenChange(false);
      onSuccess();
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agendar Nueva Llamada</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paciente_id">Paciente *</Label>
              <PacienteCombobox
                pacientes={pacientes}
                value={pacienteId}
                onValueChange={setPacienteId}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profesional_id">Profesional Asignado *</Label>
              <ProfesionalCombobox
                profesionales={personal}
                value={profesionalId}
                onValueChange={setProfesionalId}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_agendada">Fecha *</Label>
              <Input
                type="date"
                id="fecha_agendada"
                name="fecha_agendada"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora_agendada">Hora *</Label>
              <Input
                type="time"
                id="hora_agendada"
                name="hora_agendada"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duracion_estimada">Duración (min)</Label>
              <Input
                type="number"
                id="duracion_estimada"
                name="duracion_estimada"
                placeholder="15"
                min="1"
                defaultValue="15"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo de la Llamada *</Label>
            <Select value={motivo} onValueChange={setMotivo} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un motivo" />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS_LLAMADA.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comentarios">Comentarios Adicionales</Label>
            <Textarea
              id="comentarios"
              name="comentarios"
              placeholder="Detalles adicionales sobre la llamada..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Agendando..." : "Agendar Llamada"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
