import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Phone, Calendar, User } from "lucide-react";

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

interface Llamada {
  id: string;
  fecha_agendada: string | null;
  fecha_hora_realizada: string | null;
  estado: string;
  duracion_minutos: number | null;
  paciente_id: string;
  pacientes: {
    nombre: string;
    apellido: string;
  } | null;
}

interface Visita {
  id: string;
  fecha_hora_visita: string;
  estado: string;
  tipo_visita: string;
  paciente_id: string;
  pacientes: {
    nombre: string;
    apellido: string;
  } | null;
}

interface PersonalDetailDialogProps {
  personal: Personal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PersonalDetailDialog({ personal, open, onOpenChange }: PersonalDetailDialogProps) {
  const [llamadasHoy, setLlamadasHoy] = useState<Llamada[]>([]);
  const [visitasHoy, setVisitasHoy] = useState<Visita[]>([]);

  useEffect(() => {
    if (personal && open) {
      fetchLlamadasHoy();
      fetchVisitasHoy();
    }
  }, [personal, open]);

  const fetchLlamadasHoy = async () => {
    if (!personal) return;
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const { data } = await supabase
      .from("registro_llamadas")
      .select(`
        *,
        pacientes!registro_llamadas_paciente_id_fkey(nombre, apellido)
      `)
      .eq("profesional_id", personal.id)
      .gte("fecha_agendada", hoy.toISOString())
      .lt("fecha_agendada", manana.toISOString())
      .order("fecha_agendada", { ascending: true });

    setLlamadasHoy(data || []);
  };

  const fetchVisitasHoy = async () => {
    if (!personal) return;
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const { data } = await supabase
      .from("control_visitas")
      .select(`
        *,
        pacientes!control_visitas_paciente_id_fkey(nombre, apellido)
      `)
      .eq("profesional_id", personal.id)
      .gte("fecha_hora_visita", hoy.toISOString())
      .lt("fecha_hora_visita", manana.toISOString())
      .order("fecha_hora_visita", { ascending: true });

    setVisitasHoy(data || []);
  };

  if (!personal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="h-5 w-5" />
            {personal.nombre} {personal.apellido}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cédula</p>
                  <p className="font-medium">{personal.cedula}</p>
                </div>
                {personal.especialidad && (
                  <div>
                    <p className="text-sm text-muted-foreground">Especialidad</p>
                    <Badge variant="outline">{personal.especialidad}</Badge>
                  </div>
                )}
                {personal.contacto && (
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{personal.contacto}</p>
                  </div>
                )}
                {personal.email_contacto && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{personal.email_contacto}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="llamadas">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="llamadas">
                <Phone className="mr-2 h-4 w-4" />
                Llamadas Hoy ({llamadasHoy.length})
              </TabsTrigger>
              <TabsTrigger value="visitas">
                <Calendar className="mr-2 h-4 w-4" />
                Visitas Hoy ({visitasHoy.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="llamadas" className="space-y-3">
              {llamadasHoy.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8 text-muted-foreground">
                    No hay llamadas programadas para hoy
                  </CardContent>
                </Card>
              ) : (
                llamadasHoy.map((llamada) => (
                  <Card key={llamada.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {llamada.pacientes?.nombre} {llamada.pacientes?.apellido}
                          </p>
                          {llamada.fecha_agendada && (
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(llamada.fecha_agendada), "h:mm a", { locale: es })}
                            </p>
                          )}
                          {llamada.duracion_minutos && (
                            <p className="text-sm text-muted-foreground">
                              Duración: {llamada.duracion_minutos} min
                            </p>
                          )}
                        </div>
                        <Badge variant={llamada.estado === "realizada" ? "default" : "secondary"}>
                          {llamada.estado}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="visitas" className="space-y-3">
              {visitasHoy.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8 text-muted-foreground">
                    No hay visitas programadas para hoy
                  </CardContent>
                </Card>
              ) : (
                visitasHoy.map((visita) => (
                  <Card key={visita.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {visita.pacientes?.nombre} {visita.pacientes?.apellido}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(visita.fecha_hora_visita), "h:mm a", { locale: es })}
                          </p>
                          <Badge variant="outline">{visita.tipo_visita}</Badge>
                        </div>
                        <Badge variant={visita.estado === "realizada" ? "default" : "secondary"}>
                          {visita.estado}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
