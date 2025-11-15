import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send } from "lucide-react";

interface EnviarRecordatorioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: "llamada" | "visita";
  citaId: string;
  pacienteNombre: string;
}

export function EnviarRecordatorioDialog({
  open,
  onOpenChange,
  tipo,
  citaId,
  pacienteNombre,
}: EnviarRecordatorioDialogProps) {
  const [loading, setLoading] = useState(false);
  const [plantillas, setPlantillas] = useState<any[]>([]);
  const [selectedPlantilla, setSelectedPlantilla] = useState<string>("");

  useEffect(() => {
    if (open) {
      fetchPlantillas();
    }
  }, [open]);

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

  const handleEnviar = async () => {
    if (!selectedPlantilla) {
      toast.error("Debe seleccionar una plantilla");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-recordatorio-cita", {
        body: {
          tipo,
          citaId,
          plantillaId: selectedPlantilla,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Recordatorio enviado exitosamente");
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
            <Button onClick={handleEnviar} disabled={loading || plantillas.length === 0}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Enviando..." : "Enviar Recordatorio"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
