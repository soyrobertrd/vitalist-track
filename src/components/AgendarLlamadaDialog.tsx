import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    const fechaAgendada = formData.get("fecha_agendada") as string;
    const horaAgendada = formData.get("hora_agendada") as string;
    const fechaHoraAgendada = `${fechaAgendada}T${horaAgendada}:00`;

    const data = {
      paciente_id: formData.get("paciente_id") as string,
      profesional_id: formData.get("profesional_id") as string,
      motivo: formData.get("motivo") as string,
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
              <Select name="paciente_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} {p.apellido} - {p.cedula}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profesional_id">Profesional Asignado *</Label>
              <Select name="profesional_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar profesional" />
                </SelectTrigger>
                <SelectContent>
                  {personal.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} {p.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Textarea
              id="motivo"
              name="motivo"
              placeholder="Ej: Seguimiento rutinario, agendar visita, verificar medicación..."
              required
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
