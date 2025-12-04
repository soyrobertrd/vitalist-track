import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send, Users } from "lucide-react";

interface EnviarRecordatorioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: "llamada" | "visita";
  citaId: string;
  pacienteNombre: string;
  emailPaciente?: string;
  emailCuidador?: string;
}

export function EnviarRecordatorioDialog({
  open,
  onOpenChange,
  tipo,
  citaId,
  pacienteNombre,
  emailPaciente,
  emailCuidador,
}: EnviarRecordatorioDialogProps) {
  const [loading, setLoading] = useState(false);
  const [plantillas, setPlantillas] = useState<any[]>([]);
  const [selectedPlantilla, setSelectedPlantilla] = useState<string>("");
  const [destinatarios, setDestinatarios] = useState<string[]>(["paciente"]);

  useEffect(() => {
    if (open) {
      fetchPlantillas();
      // Reset destinatarios based on available emails
      const defaultDestinatarios: string[] = [];
      if (emailPaciente) defaultDestinatarios.push("paciente");
      if (emailCuidador) defaultDestinatarios.push("cuidador");
      if (defaultDestinatarios.length === 0) defaultDestinatarios.push("paciente");
      setDestinatarios(defaultDestinatarios);
    }
  }, [open, emailPaciente, emailCuidador]);

  const fetchPlantillas = async () => {
    const { data, error } = await supabase
      .from("plantillas_correo")
      .select("*")
      .eq("activo", true)
      .eq("tipo", "recordatorio")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al cargar plantillas:", error);
      toast.error("Error al cargar plantillas de correo");
    } else {
      setPlantillas(data || []);
      if (data && data.length > 0) {
        setSelectedPlantilla(data[0].id);
      }
    }
  };

  const handleDestinatarioChange = (dest: string, checked: boolean) => {
    setDestinatarios(prev => 
      checked ? [...prev, dest] : prev.filter(d => d !== dest)
    );
  };

  const handleEnviar = async () => {
    if (!selectedPlantilla) {
      toast.error("Debe seleccionar una plantilla");
      return;
    }

    if (destinatarios.length === 0) {
      toast.error("Debe seleccionar al menos un destinatario");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-recordatorio-cita", {
        body: {
          tipo,
          citaId,
          plantillaId: selectedPlantilla,
          destinatarios,
        },
      });

      if (error) throw error;

      if (data?.success) {
        if (data?.skipped) {
          toast.info("El paciente tiene las notificaciones desactivadas");
        } else {
          toast.success(`Recordatorio enviado a: ${data.destinatarios?.join(", ")}`);
        }
        onOpenChange(false);
      } else {
        throw new Error(data?.error || "Error al enviar recordatorio");
      }
    } catch (error: any) {
      console.error("Error al enviar recordatorio:", error);
      toast.error(error.message || "Error al enviar el recordatorio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar Recordatorio
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Paciente</Label>
            <p className="text-sm text-muted-foreground mt-1">{pacienteNombre}</p>
          </div>

          <div>
            <Label>Tipo</Label>
            <p className="text-sm text-muted-foreground mt-1 capitalize">{tipo}</p>
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4" />
              Destinatarios
            </Label>
            <div className="space-y-2 border rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dest-paciente"
                  checked={destinatarios.includes("paciente")}
                  onCheckedChange={(checked) => handleDestinatarioChange("paciente", checked as boolean)}
                  disabled={!emailPaciente}
                />
                <label htmlFor="dest-paciente" className="text-sm font-medium leading-none">
                  Paciente {emailPaciente ? `(${emailPaciente})` : "(sin email)"}
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dest-cuidador"
                  checked={destinatarios.includes("cuidador")}
                  onCheckedChange={(checked) => handleDestinatarioChange("cuidador", checked as boolean)}
                  disabled={!emailCuidador}
                />
                <label htmlFor="dest-cuidador" className="text-sm font-medium leading-none">
                  Cuidador {emailCuidador ? `(${emailCuidador})` : "(sin email)"}
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dest-profesional"
                  checked={destinatarios.includes("profesional")}
                  onCheckedChange={(checked) => handleDestinatarioChange("profesional", checked as boolean)}
                />
                <label htmlFor="dest-profesional" className="text-sm font-medium leading-none">
                  Profesional asignado
                </label>
              </div>
            </div>
          </div>

          <div>
            <Label>Plantilla de Correo</Label>
            <Select value={selectedPlantilla} onValueChange={setSelectedPlantilla}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una plantilla" />
              </SelectTrigger>
              <SelectContent>
                {plantillas.map((plantilla) => (
                  <SelectItem key={plantilla.id} value={plantilla.id}>
                    {plantilla.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {plantillas.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                No hay plantillas de recordatorio activas
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleEnviar} disabled={loading || plantillas.length === 0 || destinatarios.length === 0}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Enviando..." : "Enviar Recordatorio"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}