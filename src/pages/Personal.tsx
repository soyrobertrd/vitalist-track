import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Phone, Edit, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PersonalDetailDialog } from "@/components/PersonalDetailDialog";
import { EditPersonalDialog } from "@/components/EditPersonalDialog";
import { AusenciasProfesionalDialog } from "@/components/AusenciasProfesionalDialog";
import { MobileFilters } from "@/components/MobileFilters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ZonaSelect } from "@/components/ZonaSelect";
import { BarrioCombobox } from "@/components/BarrioCombobox";
import { IntlPhoneInput } from "@/components/IntlPhoneInput";
import { Switch } from "@/components/ui/switch";

interface Personal {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  especialidad: string | null;
  contacto: string | null;
  email_contacto: string | null;
  zona: string | null;
  barrio: string | null;
  direccion: string | null;
  activo: boolean;
}

const Personal = () => {
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCedula, setLoadingCedula] = useState(false);
  const [cedulaData, setCedulaData] = useState<{
    nombres?: string;
    apellido1?: string;
    apellido2?: string;
    foto_encoded?: string;
  } | null>(null);
  const [selectedPersonal, setSelectedPersonal] = useState<Personal | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [ausenciasOpen, setAusenciasOpen] = useState(false);
  const [filters, setFilters] = useState({
    especialidad: "todos",
    estado: "todos",
    busqueda: "",
  });
  const [selectedZona, setSelectedZona] = useState<string>("");
  const [selectedBarrio, setSelectedBarrio] = useState<string>("");
  const [createUserAccount, setCreateUserAccount] = useState(true);
  const [contacto, setContacto] = useState("");

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

      if (data && data.success) {
        setCedulaData(data);
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
      zona: selectedZona || null,
      barrio: selectedBarrio || null,
      direccion: formData.get("direccion") as string || null,
      activo: true,
    };

    try {
      let userId = null;

      if (createUserAccount) {
        if (!password || password.length < 6) {
          toast.error("La contraseña debe tener al menos 6 caracteres");
          setLoading(false);
          return;
        }
        
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
        userId = authData.user?.id;
      }

      // Add to personal_salud table
      const { error: personalError } = await supabase
        .from("personal_salud")
        .insert([{ ...data, user_id: userId }]);

      if (personalError) throw personalError;

      toast.success(createUserAccount ? "Personal y usuario creados exitosamente" : "Personal creado exitosamente");
      setOpen(false);
      fetchPersonal();
      setCedulaData(null);
      setSelectedZona("");
      setSelectedBarrio("");
      setCreateUserAccount(true);
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
          <DialogContent className="max-h-[90vh] overflow-y-auto">
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
                  <Input 
                    id="nombre" 
                    name="nombre" 
                    required 
                    value={cedulaData?.nombres || ''}
                    readOnly={!!cedulaData}
                    className={cedulaData ? 'bg-muted' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido *</Label>
                  <Input 
                    id="apellido" 
                    name="apellido" 
                    required 
                    value={cedulaData ? `${cedulaData.apellido1} ${cedulaData.apellido2}`.trim() : ''}
                    readOnly={!!cedulaData}
                    className={cedulaData ? 'bg-muted' : ''}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="especialidad">Especialidad</Label>
                <Input id="especialidad" name="especialidad" placeholder="Ej: Cardiología, Medicina General" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contacto">Teléfono</Label>
                <IntlPhoneInput
                  id="contacto"
                  name="contacto"
                  value={contacto}
                  onChange={setContacto}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_contacto">Email {createUserAccount ? "*" : ""}</Label>
                <Input id="email_contacto" name="email_contacto" type="email" required={createUserAccount} />
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="createUser"
                  checked={createUserAccount}
                  onCheckedChange={setCreateUserAccount}
                />
                <Label htmlFor="createUser" className="cursor-pointer">
                  Crear cuenta de usuario (permite acceso al sistema)
                </Label>
              </div>
              
              {createUserAccount && (
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input id="password" name="password" type="password" minLength={6} />
                  <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
                </div>
              )}
              
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium">Dirección del Profesional</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zona">Municipio (zona)</Label>
                    <ZonaSelect
                      value={selectedZona}
                      onValueChange={(value) => {
                        setSelectedZona(value);
                        setSelectedBarrio("");
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barrio">Barrio</Label>
                    <BarrioCombobox
                      zona={selectedZona}
                      value={selectedBarrio}
                      onChange={setSelectedBarrio}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección Completa</Label>
                  <Textarea
                    id="direccion"
                    name="direccion"
                    placeholder="Calle, número, referencias..."
                    rows={2}
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Guardando..." : createUserAccount ? "Crear Personal y Usuario" : "Crear Solo Profesional"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {personal.map((p) => (
          <Card key={p.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {p.nombre} {p.apellido}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPersonal(p);
                      setAusenciasOpen(true);
                    }}
                    title="Gestionar ausencias"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPersonal(p);
                      setEditOpen(true);
                    }}
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Badge variant={p.activo ? "default" : "secondary"}>
                    {p.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent 
              className="space-y-3 cursor-pointer"
              onClick={() => {
                setSelectedPersonal(p);
                setDetailOpen(true);
              }}
            >
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
                  <a href={`tel:${p.contacto.replace(/[^\d+]/g, '')}`} className="hover:text-primary">
                    {p.contacto}
                  </a>
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
      
      <EditPersonalDialog
        personal={selectedPersonal}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={fetchPersonal}
      />
      
      {selectedPersonal && (
        <AusenciasProfesionalDialog
          profesionalId={selectedPersonal.id}
          profesionalNombre={`${selectedPersonal.nombre} ${selectedPersonal.apellido}`}
          open={ausenciasOpen}
          onOpenChange={setAusenciasOpen}
        />
      )}
    </div>
  );
};

export default Personal;
