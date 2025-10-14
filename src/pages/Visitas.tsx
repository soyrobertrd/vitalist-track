import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Visita {
  id: string;
  fecha_hora_visita: string;
  tipo_visita: string;
  motivo_visita: string | null;
  estado: string;
  notas_visita: string | null;
  pacientes: { nombre: string; apellido: string };
  personal_salud: { nombre: string; apellido: string };
}

const Visitas = () => {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [personal, setPersonal] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const [visitasRes, pacientesRes, personalRes] = await Promise.all([
      supabase
        .from("control_visitas")
        .select("*, pacientes(nombre, apellido), personal_salud(nombre, apellido)")
        .order("fecha_hora_visita", { ascending: false }),
      supabase.from("pacientes").select("*").eq("status_px", "activo"),
      supabase.from("personal_salud").select("*").eq("activo", true),
    ]);

    if (visitasRes.data) setVisitas(visitasRes.data);
    if (pacientesRes.data) setPacientes(pacientesRes.data);
    if (personalRes.data) setPersonal(personalRes.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      paciente_id: formData.get("paciente_id") as string,
      profesional_id: formData.get("profesional_id") as string,
      fecha_hora_visita: formData.get("fecha_hora_visita") as string,
      tipo_visita: formData.get("tipo_visita") as any,
      motivo_visita: formData.get("motivo_visita") as string,
      estado: "pendiente" as any,
    };

    const { error } = await supabase.from("control_visitas").insert([data]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Visita programada exitosamente");
      setOpen(false);
      fetchData();
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "realizada":
        return "bg-success text-success-foreground";
      case "pendiente":
        return "bg-primary text-primary-foreground";
      case "cancelada":
      case "no_realizada":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-warning text-warning-foreground";
    }
  };

  const getTipoIcon = (tipo: string) => {
    return tipo === "domicilio" ? "🏠" : "🏥";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Control de Visitas</h1>
          <p className="text-muted-foreground">Citas ambulatorias y domiciliarias</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Programar Visita
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Programar Nueva Visita</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paciente_id">Paciente *</Label>
                <Select name="paciente_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre} {p.apellido} - {p.cedula}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profesional_id">Profesional *</Label>
                <Select name="profesional_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar profesional" />
                  </SelectTrigger>
                  <SelectContent>
                    {personal.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre} {p.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_hora_visita">Fecha y Hora *</Label>
                <Input
                  id="fecha_hora_visita"
                  name="fecha_hora_visita"
                  type="datetime-local"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo_visita">Tipo de Visita *</Label>
                <Select name="tipo_visita" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ambulatorio">Ambulatorio (Consultorio)</SelectItem>
                    <SelectItem value="domicilio">Domicilio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="motivo_visita">Motivo</Label>
                <Textarea id="motivo_visita" name="motivo_visita" placeholder="Motivo de la visita" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Programando..." : "Programar Visita"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {visitas.map((visita) => (
          <Card key={visita.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getTipoIcon(visita.tipo_visita)}</span>
                  <div>
                    <CardTitle className="text-lg">
                      {visita.pacientes.nombre} {visita.pacientes.apellido}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground capitalize">
                      Visita {visita.tipo_visita}
                    </p>
                  </div>
                </div>
                <Badge className={getEstadoColor(visita.estado)}>
                  {visita.estado.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-2 h-4 w-4" />
                {new Date(visita.fecha_hora_visita).toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Profesional:</span>{" "}
                {visita.personal_salud.nombre} {visita.personal_salud.apellido}
              </p>
              {visita.motivo_visita && (
                <p className="text-sm">
                  <span className="font-medium">Motivo:</span> {visita.motivo_visita}
                </p>
              )}
              {visita.notas_visita && (
                <p className="text-sm">
                  <span className="font-medium">Notas:</span> {visita.notas_visita}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {visitas.length === 0 && (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            No hay visitas programadas
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Visitas;
