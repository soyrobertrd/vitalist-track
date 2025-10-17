import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Llamada {
  id: string;
  fecha_hora_realizada: string;
  motivo: string | null;
  comentarios_resultados: string | null;
  resultado_seguimiento: string | null;
  pacientes: { nombre: string; apellido: string } | null;
  personal_salud: { nombre: string; apellido: string } | null;
}

const Llamadas = () => {
  const [llamadas, setLlamadas] = useState<Llamada[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [personal, setPersonal] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const [llamadasRes, pacientesRes, personalRes] = await Promise.all([
      supabase
        .from("registro_llamadas")
        .select("*, pacientes!registro_llamadas_paciente_id_fkey(nombre, apellido), personal_salud!registro_llamadas_profesional_id_fkey(nombre, apellido)")
        .order("fecha_hora_realizada", { ascending: false }),
      supabase.from("pacientes").select("*").eq("status_px", "activo"),
      supabase.from("personal_salud").select("*").eq("activo", true),
    ]);

    if (llamadasRes.data) setLlamadas(llamadasRes.data as any);
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
      motivo: formData.get("motivo") as string,
      comentarios_resultados: formData.get("comentarios_resultados") as string,
      resultado_seguimiento: formData.get("resultado_seguimiento") as any,
      fecha_hora_realizada: new Date().toISOString(),
    };

    const { error } = await supabase.from("registro_llamadas").insert([data]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Llamada registrada exitosamente");
      setOpen(false);
      fetchData();
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  };

  const getResultadoColor = (resultado: string | null) => {
    switch (resultado) {
      case "contactado":
        return "bg-success text-success-foreground";
      case "no_contestada":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Registro de Llamadas</h1>
          <p className="text-muted-foreground">Seguimiento telefónico de pacientes</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Llamada
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nueva Llamada</DialogTitle>
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
                <Label htmlFor="motivo">Motivo</Label>
                <Textarea id="motivo" name="motivo" placeholder="Motivo de la llamada" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resultado_seguimiento">Resultado *</Label>
                <Select name="resultado_seguimiento" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contactado">Contactado</SelectItem>
                    <SelectItem value="no_contestada">No Contestada</SelectItem>
                    <SelectItem value="mensaje_dejado">Mensaje Dejado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="comentarios_resultados">Comentarios</Label>
                <Textarea id="comentarios_resultados" name="comentarios_resultados" placeholder="Detalles de la conversación o resultados" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Guardando..." : "Registrar Llamada"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {llamadas.map((llamada) => (
          <Card key={llamada.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    {llamada.pacientes?.nombre || 'N/A'} {llamada.pacientes?.apellido || ''}
                  </CardTitle>
                </div>
                <Badge className={getResultadoColor(llamada.resultado_seguimiento)}>
                  {llamada.resultado_seguimiento?.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Fecha:</span>{" "}
                {new Date(llamada.fecha_hora_realizada).toLocaleString()}
              </p>
              {llamada.personal_salud && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Profesional:</span>{" "}
                  {llamada.personal_salud.nombre} {llamada.personal_salud.apellido}
                </p>
              )}
              {llamada.motivo && (
                <p className="text-sm">
                  <span className="font-medium">Motivo:</span> {llamada.motivo}
                </p>
              )}
              {llamada.comentarios_resultados && (
                <p className="text-sm">
                  <span className="font-medium">Comentarios:</span> {llamada.comentarios_resultados}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {llamadas.length === 0 && (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            No hay llamadas registradas
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Llamadas;
