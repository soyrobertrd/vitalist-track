import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UtensilsCrossed } from "lucide-react";

export interface NuevaDietaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacientes: Array<{ id: string; nombre: string; apellido: string; cedula?: string | null }>;
  tiposDieta: Array<{ value: string; label: string }>;
  isPending: boolean;
  onSubmit: (data: {
    paciente_id: string;
    tipo_dieta: string;
    calorias_objetivo: string;
    alergias_alimentarias: string;
    indicaciones_especiales: string;
  }) => void;
}

export function NuevaDietaModal({
  open,
  onOpenChange,
  pacientes,
  tiposDieta,
  isPending,
  onSubmit
}: NuevaDietaModalProps) {
  const [formData, setFormData] = useState({
    paciente_id: "",
    tipo_dieta: "normal",
    calorias_objetivo: "2000",
    alergias_alimentarias: "",
    indicaciones_especiales: ""
  });

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-emerald-600" />
            Prescribir Dieta Hospitalaria
          </DialogTitle>
          <DialogDescription>
            Asigne un régimen alimenticio clínico estructurado y meta calórica.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="dieta-paciente">Paciente *</Label>
            <Select 
              value={formData.paciente_id} 
              onValueChange={(val) => setFormData(p => ({ ...p, paciente_id: val }))}
            >
              <SelectTrigger id="dieta-paciente" className="border-border/80">
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
              <Label htmlFor="dieta-tipo">Tipo de Dieta *</Label>
              <Select 
                value={formData.tipo_dieta} 
                onValueChange={(val) => setFormData(p => ({ ...p, tipo_dieta: val }))}
              >
                <SelectTrigger id="dieta-tipo" className="border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {tiposDieta.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dieta-calorias">Objetivo Calórico (kcal)</Label>
              <Input
                id="dieta-calorias"
                type="number"
                placeholder="Ej. 2000"
                className="border-border/80 font-mono"
                value={formData.calorias_objetivo}
                onChange={(e) => setFormData(p => ({ ...p, calorias_objetivo: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dieta-alergias">Alergias o Intolerancias Alimentarias</Label>
            <Input
              id="dieta-alergias"
              placeholder="Ej. Marisco, frutos secos, huevo, soya..."
              className="border-border/80"
              value={formData.alergias_alimentarias}
              onChange={(e) => setFormData(p => ({ ...p, alergias_alimentarias: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dieta-indicaciones">Indicaciones Especiales para Cocina / Enfermería</Label>
            <Textarea
              id="dieta-indicaciones"
              placeholder="Ej. Textura papilla, sin sal añadida, fraccionar en 5 tomas..."
              className="border-border/80 resize-none h-20"
              value={formData.indicaciones_especiales}
              onChange={(e) => setFormData(p => ({ ...p, indicaciones_especiales: e.target.value }))}
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
            disabled={isPending || !formData.paciente_id}
          >
            {isPending ? "Prescribiendo..." : "Prescribir Dieta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
