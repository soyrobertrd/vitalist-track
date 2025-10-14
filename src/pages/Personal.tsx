import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Personal {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  especialidad: string | null;
  contacto: string | null;
  email_contacto: string | null;
  activo: boolean;
}

const Personal = () => {
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchPersonal = async () => {
    const { data, error } = await supabase
      .from("personal_salud")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar personal");
    } else {
      setPersonal(data || []);
    }
  };

  useEffect(() => {
    fetchPersonal();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      cedula: formData.get("cedula") as string,
      nombre: formData.get("nombre") as string,
      apellido: formData.get("apellido") as string,
      especialidad: formData.get("especialidad") as string,
      contacto: formData.get("contacto") as string,
      email_contacto: formData.get("email_contacto") as string,
      activo: true,
    };

    const { error } = await supabase.from("personal_salud").insert([data]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Personal agregado exitosamente");
      setOpen(false);
      fetchPersonal();
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Personal de Salud</h1>
          <p className="text-muted-foreground">Gestión del equipo médico</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Personal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Personal de Salud</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cedula">Cédula *</Label>
                <Input id="cedula" name="cedula" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input id="nombre" name="nombre" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido *</Label>
                  <Input id="apellido" name="apellido" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="especialidad">Especialidad</Label>
                <Input id="especialidad" name="especialidad" placeholder="Ej: Cardiología, Medicina General" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contacto">Teléfono</Label>
                <Input id="contacto" name="contacto" type="tel" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_contacto">Email</Label>
                <Input id="email_contacto" name="email_contacto" type="email" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Personal"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {personal.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {p.nombre} {p.apellido}
                </CardTitle>
                <Badge variant={p.activo ? "default" : "secondary"}>
                  {p.activo ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Cédula:</span> {p.cedula}
              </p>
              {p.especialidad && (
                <p className="text-sm">
                  <span className="font-medium">Especialidad:</span>{" "}
                  <Badge variant="outline">{p.especialidad}</Badge>
                </p>
              )}
              {p.contacto && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="mr-2 h-4 w-4" />
                  {p.contacto}
                </div>
              )}
              {p.email_contacto && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="mr-2 h-4 w-4" />
                  {p.email_contacto}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {personal.length === 0 && (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            No hay personal registrado
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Personal;
