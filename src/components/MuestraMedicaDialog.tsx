import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pill, Package } from "lucide-react";

interface Medicamento {
  id: string;
  nombre_medicamento: string;
  dosis: string | null;
  muestra_medica: boolean;
}

interface MuestraMedicaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicamentos: Medicamento[];
  pacienteId: string;
  pacienteNombre: string;
  onComplete: () => void;
}

export function MuestraMedicaDialog({
  open,
  onOpenChange,
  medicamentos,
  pacienteId,
  pacienteNombre,
  onComplete
}: MuestraMedicaDialogProps) {
  const [selectedMedicamentos, setSelectedMedicamentos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleToggleMedicamento = (id: string) => {
    setSelectedMedicamentos(prev =>
      prev.includes(id)
        ? prev.filter(m => m !== id)
        : [...prev, id]
    );
  };

  const handleConfirm = async () => {
    if (selectedMedicamentos.length === 0) {
      onComplete();
      onOpenChange(false);
      return;
    }

    setLoading(true);
    
    // Create atencion_paciente record for medical samples
    const medicamentosSeleccionados = medicamentos
      .filter(m => selectedMedicamentos.includes(m.id))
      .map(m => m.nombre_medicamento);

    const { error } = await supabase.from("atencion_paciente").insert({
      paciente_id: pacienteId,
      tipo: "muestra_medica",
      descripcion: `Entrega de muestras médicas: ${medicamentosSeleccionados.join(", ")}`,
      estado: "pendiente",
      fecha_programada: new Date().toISOString()
    });

    if (error) {
      toast.error("Error al registrar muestra médica");
      console.error(error);
    } else {
      toast.success("Muestra médica registrada para entrega");
    }

    setLoading(false);
    setSelectedMedicamentos([]);
    onComplete();
    onOpenChange(false);
  };

  const handleSkip = () => {
    setSelectedMedicamentos([]);
    onComplete();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Muestras Médicas
          </DialogTitle>
          <DialogDescription>
            {pacienteNombre} tiene medicamentos registrados. ¿Desea agregar entrega de muestras médicas a esta visita?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-60 overflow-y-auto py-4">
          {medicamentos.map((med) => (
            <Label
              key={med.id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={selectedMedicamentos.includes(med.id)}
                onCheckedChange={() => handleToggleMedicamento(med.id)}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-primary" />
                  <span className="font-medium">{med.nombre_medicamento}</span>
                </div>
                {med.dosis && (
                  <span className="text-xs text-muted-foreground">{med.dosis}</span>
                )}
              </div>
              {med.muestra_medica && (
                <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded">
                  Muestra previa
                </span>
              )}
            </Label>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleSkip} disabled={loading}>
            No, continuar sin muestras
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Guardando..." : selectedMedicamentos.length > 0 
              ? `Agregar ${selectedMedicamentos.length} muestra(s)` 
              : "Continuar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
