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
import { PersonalDetailDialog } from "@/components/PersonalDetailDialog";

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
  const [loadingCedula, setLoadingCedula] = useState(false);
  const [selectedPersonal, setSelectedPersonal] = useState<Personal | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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

  const fetchCedulaData = async (cedula: string) => {
    // Validar que solo contenga números y tenga 11 dígitos
    const cedulaLimpia = cedula.replace(/\D/g, '');
    if (cedulaLimpia.length !== 11) return;
    
    setLoadingCedula(true);
    try {
      const { data, error } = await supabase.functions.invoke('consultar-cedula', {
        body: { cedula: cedulaLimpia }
      });

      if (error) throw error;

      if (data) {
        const nombreInput = document.getElementById("nombre") as HTMLInputElement;
        const apellidoInput = document.getElementById("apellido") as HTMLInputElement;
        
        if (nombreInput && data.nombres) nombreInput.value = data.nombres;
        if (apellidoInput && data.apellido1) {
          apellidoInput.value = data.apellido2 ? `${data.apellido1} ${data.apellido2}` : data.apellido1;
        }
        
        toast.success("Datos cargados desde JCE");
      }
    } catch (error) {
      console.error("Error fetching cedula data:", error);
      toast.error("No se pudo consultar la cédula");
    } finally {
      setLoadingCedula(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email_contacto") as string;
    const password = formData.get("password") as string;
    
    const data = {
      cedula: formData.get("cedula") as string,
      nombre: formData.get("nombre") as string,
      apellido: formData.get("apellido") as string,
      especialidad: formData.get("especialidad") as string,
      contacto: formData.get("contacto") as string,
      email_contacto: email,
      activo: true,
    };

    try {
      // Create user account first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            nombre: data.nombre,
            apellido: data.apellido,
            cedula: data.cedula,
            especialidad: data.especialidad,
          }
        }
      });

      if (authError) throw authError;

      // Add to personal_salud table
      const { error: personalError } = await supabase
        .from("personal_salud")
        .insert([{ ...data, user_id: authData.user?.id }]);

      if (personalError) throw personalError;

      toast.success("Personal y usuario creados exitosamente");
      setOpen(false);
      fetchPersonal();
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
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
                <Input 
                  id="cedula" 
                  name="cedula" 
                  required 
                  maxLength={11}
                  pattern="\d{11}"
                  onBlur={(e) => fetchCedulaData(e.target.value)}
                  disabled={loadingCedula}
                  onChange={(e) => {
                    // Solo permitir números
                    e.target.value = e.target.value.replace(/\D/g, '');
                  }}
                />
                <p className="text-xs text-muted-foreground">Digitar cédula sin guiones (11 dígitos)</p>
                {loadingCedula && <p className="text-xs text-muted-foreground">Consultando JCE...</p>}
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
                <Label htmlFor="email_contacto">Email *</Label>
                <Input id="email_contacto" name="email_contacto" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input id="password" name="password" type="password" required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Guardando..." : "Crear Personal y Usuario"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {personal.map((p) => (
          <Card 
            key={p.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              setSelectedPersonal(p);
              setDetailOpen(true);
            }}
          >
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

      <PersonalDetailDialog
        personal={selectedPersonal}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
};

export default Personal;
