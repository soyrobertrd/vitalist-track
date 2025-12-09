import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Pill } from "lucide-react";

interface Medicamento {
  id?: string;
  nombre_medicamento: string;
  dosis: string;
  frecuencia: string;
  muestra_medica: boolean;
}

interface MedicamentosPacienteProps {
  pacienteId: string;
}

export function MedicamentosPaciente({ pacienteId }: MedicamentosPacienteProps) {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [nuevoMedicamento, setNuevoMedicamento] = useState<Medicamento>({
    nombre_medicamento: "",
    dosis: "",
    frecuencia: "",
    muestra_medica: false
  });

  useEffect(() => {
    if (pacienteId) {
      fetchMedicamentos();
    }
  }, [pacienteId]);

  const fetchMedicamentos = async () => {
    const { data, error } = await supabase
      .from("medicamentos_paciente")
      .select("*")
      .eq("paciente_id", pacienteId)
      .order("nombre_medicamento");

    if (error) {
      console.error("Error fetching medicamentos:", error);
    } else {
      setMedicamentos(data || []);
    }
  };

  const handleAddMedicamento = async () => {
    if (!nuevoMedicamento.nombre_medicamento.trim()) {
      toast.error("El nombre del medicamento es requerido");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("medicamentos_paciente")
      .insert({
        paciente_id: pacienteId,
        nombre_medicamento: nuevoMedicamento.nombre_medicamento.trim(),
        dosis: nuevoMedicamento.dosis.trim() || null,
        frecuencia: nuevoMedicamento.frecuencia.trim() || null,
        muestra_medica: nuevoMedicamento.muestra_medica
      });

    if (error) {
      toast.error("Error al agregar medicamento");
      console.error(error);
    } else {
      toast.success("Medicamento agregado");
      setNuevoMedicamento({
        nombre_medicamento: "",
        dosis: "",
        frecuencia: "",
        muestra_medica: false
      });
      fetchMedicamentos();
    }
    setLoading(false);
  };

  const handleDeleteMedicamento = async (id: string) => {
    const { error } = await supabase
      .from("medicamentos_paciente")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error al eliminar medicamento");
    } else {
      toast.success("Medicamento eliminado");
      fetchMedicamentos();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Pill className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">Medicamentos</h4>
      </div>

      {/* Lista de medicamentos existentes */}
      {medicamentos.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {medicamentos.map((med) => (
            <div key={med.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
              <div className="flex-1">
                <span className="font-medium">{med.nombre_medicamento}</span>
                {med.dosis && <span className="text-muted-foreground ml-2">({med.dosis})</span>}
                {med.frecuencia && <span className="text-muted-foreground ml-1">- {med.frecuencia}</span>}
                {med.muestra_medica && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 rounded">Muestra</span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                onClick={() => med.id && handleDeleteMedicamento(med.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Formulario para agregar nuevo medicamento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 border rounded-lg bg-background">
        <div className="space-y-1">
          <Label className="text-xs">Medicamento *</Label>
          <Input
            placeholder="Nombre"
            value={nuevoMedicamento.nombre_medicamento}
            onChange={(e) => setNuevoMedicamento(prev => ({ ...prev, nombre_medicamento: e.target.value }))}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Dosis</Label>
          <Input
            placeholder="Ej: 500mg"
            value={nuevoMedicamento.dosis}
            onChange={(e) => setNuevoMedicamento(prev => ({ ...prev, dosis: e.target.value }))}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Frecuencia</Label>
          <Input
            placeholder="Ej: 2 veces/día"
            value={nuevoMedicamento.frecuencia}
            onChange={(e) => setNuevoMedicamento(prev => ({ ...prev, frecuencia: e.target.value }))}
            className="h-8 text-sm"
          />
        </div>
        <div className="flex items-end gap-2">
          <Label className="flex items-center gap-1 cursor-pointer text-xs pb-1">
            <Checkbox
              checked={nuevoMedicamento.muestra_medica}
              onCheckedChange={(checked) => setNuevoMedicamento(prev => ({ ...prev, muestra_medica: checked as boolean }))}
            />
            Muestra
          </Label>
          <Button
            type="button"
            size="sm"
            onClick={handleAddMedicamento}
            disabled={loading}
            className="h-8"
          >
            <Plus className="h-3 w-3 mr-1" />
            Agregar
          </Button>
        </div>
      </div>
    </div>
  );
}
