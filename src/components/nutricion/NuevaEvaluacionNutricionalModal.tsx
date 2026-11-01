import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Scale } from "lucide-react";

export interface NuevaEvaluacionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacientes: Array<{ id: string; nombre: string; apellido: string; cedula?: string | null }>;
  diagnosticos: Array<{ value: string; label: string }>;
  isPending: boolean;
  onSubmit: (data: {
    paciente_id: string;
    peso_kg: string;
    talla_cm: string;
    diagnostico_nutricional: string;
    observaciones: string;
  }) => void;
}

export function NuevaEvaluacionNutricionalModal({
  open,
  onOpenChange,
  pacientes,
  diagnosticos,
  isPending,
  onSubmit
}: NuevaEvaluacionModalProps) {
  const [formData, setFormData] = useState({
    paciente_id: "",
    peso_kg: "",
    talla_cm: "",
    diagnostico_nutricional: "normal",
    observaciones: ""
  });

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-emerald-600" />
            Nueva Evaluación Nutricional
          </DialogTitle>
          <DialogDescription>
            Registre el peso, talla y diagnóstico nutricional del paciente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="eval-paciente">Paciente *</Label>
            <Select 
              value={formData.paciente_id} 
              onValueChange={(val) => setFormData(p => ({ ...p, paciente_id: val }))}
            >
              <SelectTrigger id="eval-paciente" className="border-border/80">
                <SelectValue placeholder="Seleccione un paciente" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {pacientes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre} {p.apellido} {p.cedula ? `(${p.cedula})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="eval-peso">Peso (kg) *</Label>
              <Input
                id="eval-peso"
                type="number"
                step="0.1"
                placeholder="Ej. 68.5"
                className="border-border/80 font-mono"
                value={formData.peso_kg}
                onChange={(e) => setFormData(p => ({ ...p, peso_kg: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eval-talla">Talla (cm) *</Label>
              <Input
                id="eval-talla"
                type="number"
                placeholder="Ej. 172"
                className="border-border/80 font-mono"
                value={formData.talla_cm}
                onChange={(e) => setFormData(p => ({ ...p, talla_cm: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="eval-diag">Diagnóstico Nutricional</Label>
            <Select 
              value={formData.diagnostico_nutricional} 
              onValueChange={(val) => setFormData(p => ({ ...p, diagnostico_nutricional: val }))}
            >
              <SelectTrigger id="eval-diag" className="border-border/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {diagnosticos.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="eval-obs">Observaciones Clínicas</Label>
            <Textarea
              id="eval-obs"
              placeholder="Apetito, pérdida de peso involuntaria, disfagia, etc."
              className="border-border/80 resize-none h-20"
              value={formData.observaciones}
              onChange={(e) => setFormData(p => ({ ...p, observaciones: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white" 
            onClick={handleSubmit}
            disabled={isPending || !formData.paciente_id || !formData.peso_kg}
          >
            {isPending ? "Guardando..." : "Guardar Evaluación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
