import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TELEFONO_ERROR_MESSAGE } from "@/lib/validaciones";

interface Personal {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  especialidad: string | null;
  contacto: string | null;
  email_contacto: string | null;
  activo: boolean;
  user_id?: string;
}

interface EditPersonalDialogProps {
  personal: Personal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditPersonalDialog({ personal, open, onOpenChange, onSuccess }: EditPersonalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState<string>("");
  const [formData, setFormData] = useState({
    especialidad: "",
    contacto: "",
    email_contacto: "",
    activo: true,
  });

  useEffect(() => {
    if (personal && open) {
      setFormData({
        especialidad: personal.especialidad || "",
        contacto: personal.contacto || "",
        email_contacto: personal.email_contacto || "",
        activo: personal.activo,
      });
      
      // Fetch current role
      const fetchRole = async () => {
        if (personal.user_id) {
          const { data } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", personal.user_id)
            .single();
          
          if (data) {
            setCurrentRole(data.role);
          }
        }
      };
      fetchRole();
    }
  }, [personal, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personal) return;

    setLoading(true);
    try {
      // Update personal_salud table
      const { error: updateError } = await supabase
        .from("personal_salud")
        .update(formData)
        .eq("id", personal.id);

      if (updateError) throw updateError;

      // Update role if changed and user_id exists
      if (personal.user_id && currentRole) {
        // Delete old role
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", personal.user_id);

        // Insert new role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert([{ 
            user_id: personal.user_id, 
            role: currentRole as any 
          }]);

        if (roleError) throw roleError;
      }

      toast.success("Personal actualizado exitosamente");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  if (!personal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Personal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre Completo</Label>
            <Input value={`${personal.nombre} ${personal.apellido}`} disabled />
          </div>
          <div className="space-y-2">
            <Label>Cédula</Label>
            <Input value={personal.cedula} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="especialidad">Especialidad</Label>
            <Input
              id="especialidad"
              value={formData.especialidad}
              onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
              placeholder="Ej: Cardiología, Enfermería"
            />
          </div>
              <div className="space-y-2">
                <Label htmlFor="contacto">Teléfono</Label>
                <Input
                  id="contacto"
                  name="contacto"
                  type="tel"
                  value={formData.contacto}
                  onChange={(e) => {
                    const { handlePhoneInput } = require("@/lib/phoneUtils");
                    const formatted = handlePhoneInput(e.target.value);
                    setFormData({ ...formData, contacto: formatted });
                  }}
                  placeholder="829-123-1234"
                />
                <p className="text-xs text-muted-foreground">Formato: 829-123-1234 (10 dígitos)</p>
              </div>
          <div className="space-y-2">
            <Label htmlFor="email_contacto">Email</Label>
            <Input
              id="email_contacto"
              type="email"
              value={formData.email_contacto}
              onChange={(e) => setFormData({ ...formData, email_contacto: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Rol del Usuario</Label>
            <Select value={currentRole} onValueChange={setCurrentRole}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="moderator">Moderador</SelectItem>
                <SelectItem value="user">Usuario</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="activo" className="cursor-pointer">
              Personal activo
            </Label>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
