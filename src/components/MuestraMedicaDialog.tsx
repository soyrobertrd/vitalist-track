import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pill, Package } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";

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
  visitaId?: string | null;
  onComplete: () => void;
}

export function MuestraMedicaDialog({
  open,
  onOpenChange,
  medicamentos,
  pacienteId,
  pacienteNombre,
  visitaId,
  onComplete
}: MuestraMedicaDialogProps) {
  const [selectedMedicamentos, setSelectedMedicamentos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentWorkspace } = useWorkspace();

  const handleToggleMedicamento = (id: string) => {
    setSelectedMedicamentos(prev =>
      prev.includes(id)
        ? prev.filter(m => m !== id)
        : [...prev, id]
    );
  };

  const descontarStockInventario = async (medicamentosNombres: string[]) => {
    if (!currentWorkspace?.id) return { sinStock: [] as string[], descontados: [] as string[] };

    const { data: userData } = await supabase.auth.getUser();
    const sinStock: string[] = [];
    const descontados: string[] = [];

    for (const nombre of medicamentosNombres) {
      // Buscar item por nombre + workspace + categoría muestra_medica
      const { data: items } = await (supabase as any)
        .from("inventario_items")
        .select("id, stock_actual, nombre")
        .eq("workspace_id", currentWorkspace.id)
        .eq("categoria", "muestra_medica")
        .ilike("nombre", nombre)
        .limit(1);

      let itemId: string | null = items?.[0]?.id ?? null;

      // Si no existe, crear el item con stock 0 para tener trazabilidad
      if (!itemId) {
        const { data: nuevo } = await (supabase as any)
          .from("inventario_items")
          .insert({
            workspace_id: currentWorkspace.id,
            categoria: "muestra_medica",
            nombre,
            unidad_medida: "unidad",
            stock_actual: 0,
            stock_minimo: 1,
          })
          .select("id, stock_actual")
          .single();
        itemId = nuevo?.id ?? null;
        if (itemId) sinStock.push(nombre);
      } else if ((items![0].stock_actual ?? 0) < 1) {
        sinStock.push(nombre);
      }

      if (!itemId) continue;

      // Registrar movimiento de salida (trigger actualiza stock)
      const { error: movErr } = await (supabase as any)
        .from("inventario_movimientos")
        .insert({
          item_id: itemId,
          tipo: "salida",
          cantidad: 1,
          paciente_id: pacienteId,
          visita_id: visitaId ?? null,
          motivo: "Entrega de muestra médica",
          realizado_por: userData.user?.id,
        });
      if (!movErr) descontados.push(nombre);
    }

    return { sinStock, descontados };
  };

  const handleConfirm = async () => {
    if (selectedMedicamentos.length === 0) {
      onComplete();
      onOpenChange(false);
      return;
    }

    setLoading(true);

    const medicamentosSeleccionados = medicamentos
      .filter(m => selectedMedicamentos.includes(m.id))
      .map(m => m.nombre_medicamento);

    // 1. Crear registro de atención (entrega)
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
      // 2. Descontar del inventario
      const { sinStock, descontados } = await descontarStockInventario(medicamentosSeleccionados);

      if (descontados.length > 0) {
        toast.success(`Muestra registrada y ${descontados.length} ítem(s) descontado(s) del inventario`);
      } else {
        toast.success("Muestra médica registrada para entrega");
      }
      if (sinStock.length > 0) {
        toast.warning(`Sin stock previo: ${sinStock.join(", ")}. Stock quedará en negativo, regularizar en Inventario.`);
      }
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
