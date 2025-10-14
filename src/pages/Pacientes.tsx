import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Paciente {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string | null;
  contacto_px: string | null;
  status_px: string;
  grado_dificultad: string;
}

const Pacientes = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchPacientes = async () => {
    const { data, error } = await supabase
      .from("pacientes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar pacientes");
    } else {
      setPacientes(data || []);
    }
  };

  useEffect(() => {
    fetchPacientes();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      cedula: formData.get("cedula") as string,
      nombre: formData.get("nombre") as string,
      apellido: formData.get("apellido") as string,
      fecha_nacimiento: formData.get("fecha_nacimiento") as string,
      contacto_px: formData.get("contacto_px") as string,
      nombre_cuidador: formData.get("nombre_cuidador") as string,
      contacto_cuidador: formData.get("contacto_cuidador") as string,
      direccion_domicilio: formData.get("direccion_domicilio") as string,
      grado_dificultad: formData.get("grado_dificultad") as any,
      status_px: "activo" as any,
    };

    const { error } = await supabase.from("pacientes").insert([data]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Paciente agregado exitosamente");
      setOpen(false);
      fetchPacientes();
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  };

  const filteredPacientes = pacientes.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.apellido.toLowerCase().includes(search.toLowerCase()) ||
      p.cedula.includes(search)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "activo":
        return "bg-success text-success-foreground";
      case "inactivo":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-destructive text-destructive-foreground";
    }
  };

  const getDificultadColor = (dificultad: string) => {
    switch (dificultad) {
      case "bajo":
        return "bg-secondary text-secondary-foreground";
      case "medio":
        return "bg-warning text-warning-foreground";
      case "alto":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground">Gestión de pacientes del centro</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Paciente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cedula">Cédula *</Label>
                  <Input id="cedula" name="cedula" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_nacimiento">Fecha Nacimiento</Label>
                  <Input id="fecha_nacimiento" name="fecha_nacimiento" type="date" />
                </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contacto_px">Contacto Paciente</Label>
                  <Input id="contacto_px" name="contacto_px" type="tel" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grado_dificultad">Grado Dificultad</Label>
                  <Select name="grado_dificultad" defaultValue="medio">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre_cuidador">Nombre Cuidador</Label>
                  <Input id="nombre_cuidador" name="nombre_cuidador" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contacto_cuidador">Contacto Cuidador</Label>
                  <Input id="contacto_cuidador" name="contacto_cuidador" type="tel" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion_domicilio">Dirección</Label>
                <Input id="direccion_domicilio" name="direccion_domicilio" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Paciente"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, apellido o cédula..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPacientes.map((paciente) => (
          <Card key={paciente.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {paciente.nombre} {paciente.apellido}
                </CardTitle>
                <Badge className={getStatusColor(paciente.status_px)}>
                  {paciente.status_px}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Cédula:</span> {paciente.cedula}
              </p>
              {paciente.contacto_px && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Contacto:</span> {paciente.contacto_px}
                </p>
              )}
              <Badge className={getDificultadColor(paciente.grado_dificultad)}>
                Dificultad: {paciente.grado_dificultad}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPacientes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            No se encontraron pacientes
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Pacientes;
