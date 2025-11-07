import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditPacienteDialogProps {
  paciente: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditPacienteDialog({ paciente, open, onOpenChange, onSuccess }: EditPacienteDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const updateData = {
      contacto_px: formData.get("contacto_px") as string,
      nombre_cuidador: formData.get("nombre_cuidador") as string,
      contacto_cuidador: formData.get("contacto_cuidador") as string,
      direccion_domicilio: formData.get("direccion_domicilio") as string,
      historia_medica_basica: formData.get("historia_medica") as string,
      zona: formData.get("zona") as any,
      grado_dificultad: formData.get("grado_dificultad") as any,
      status_px: formData.get("status_px") as any,
    };

    const { error } = await supabase
      .from("pacientes")
      .update(updateData)
      .eq("id", paciente.id);

    if (error) {
      toast.error("Error al actualizar paciente");
    } else {
      toast.success("Paciente actualizado exitosamente");
      onSuccess();
      onOpenChange(false);
    }
    setLoading(false);
  };

  if (!paciente) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Paciente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cédula</Label>
              <Input value={paciente.cedula} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Nombre Completo</Label>
              <Input value={`${paciente.nombre} ${paciente.apellido}`} disabled className="bg-muted" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contacto_px">Contacto Paciente</Label>
              <Input 
                id="contacto_px" 
                name="contacto_px" 
                defaultValue={paciente.contacto_px || ''} 
                type="tel" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status_px">Estado</Label>
              <Select name="status_px" defaultValue={paciente.status_px}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zona">Zona</Label>
              <Select name="zona" defaultValue={paciente.zona || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar zona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="santo_domingo_oeste">SD Oeste</SelectItem>
                  <SelectItem value="santo_domingo_este">SD Este</SelectItem>
                  <SelectItem value="santo_domingo_norte">SD Norte</SelectItem>
                  <SelectItem value="distrito_nacional">Distrito Nacional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grado_dificultad">Grado Dificultad</Label>
              <Select name="grado_dificultad" defaultValue={paciente.grado_dificultad}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bajo">Bajo</SelectItem>
                  <SelectItem value="medio">Medio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre_cuidador">Nombre Cuidador</Label>
            <Input 
              id="nombre_cuidador" 
              name="nombre_cuidador" 
              defaultValue={paciente.nombre_cuidador || ''} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contacto_cuidador">Contacto Cuidador</Label>
            <Input 
              id="contacto_cuidador" 
              name="contacto_cuidador" 
              defaultValue={paciente.contacto_cuidador || ''} 
              type="tel" 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion_domicilio">Dirección</Label>
            <Input 
              id="direccion_domicilio" 
              name="direccion_domicilio" 
              defaultValue={paciente.direccion_domicilio || ''} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="historia_medica">Historia Médica</Label>
            <Textarea 
              id="historia_medica" 
              name="historia_medica" 
              defaultValue={paciente.historia_medica_basica || ''}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
