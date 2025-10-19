import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, User, Phone, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

interface LlamadaDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  llamada: any | null;
  onSuccess: () => void;
  pacientes: any[];
  personal: any[];
}

export function LlamadaDetailDialog({
  open,
  onOpenChange,
  llamada,
  onSuccess,
  pacientes,
  personal,
}: LlamadaDetailDialogProps) {
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  if (!llamada) return null;

  const handleReagendar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const fechaAgendada = formData.get("nueva_fecha") as string;
    const horaAgendada = formData.get("nueva_hora") as string;
    const fechaHoraAgendada = `${fechaAgendada}T${horaAgendada}:00`;

    const { error } = await supabase
      .from("registro_llamadas")
      .update({
        fecha_agendada: fechaHoraAgendada,
        estado: "reagendada",
      })
      .eq("id", llamada.id);

    if (error) {
      toast.error("Error al reagendar la llamada");
    } else {
      toast.success("Llamada reagendada exitosamente");
      onSuccess();
      setEditMode(false);
    }
    setLoading(false);
  };

  const handleCancelar = async () => {
    setLoading(true);

    const { error } = await supabase
      .from("registro_llamadas")
      .update({ estado: "cancelada" })
      .eq("id", llamada.id);

    if (error) {
      toast.error("Error al cancelar la llamada");
    } else {
      toast.success("Llamada cancelada");
      onSuccess();
      onOpenChange(false);
    }
    setLoading(false);
  };

  const handleMarcarRealizada = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    const updateData = {
      estado: "realizada" as const,
      fecha_hora_realizada: new Date().toISOString(),
      resultado_seguimiento: formData.get("resultado_seguimiento") as any,
      duracion_minutos: parseInt(formData.get("duracion_minutos") as string) || null,
      comentarios_resultados: formData.get("comentarios_resultados") as string,
      notas_adicionales: formData.get("notas_adicionales") as string,
      requiere_seguimiento: formData.get("requiere_seguimiento") === "true",
    };

    const { error } = await supabase
      .from("registro_llamadas")
      .update(updateData)
      .eq("id", llamada.id);

    if (error) {
      toast.error("Error al registrar la llamada");
      console.error(error);
    } else {
      toast.success("Llamada registrada como realizada");
      onSuccess();
      onOpenChange(false);
    }
    setLoading(false);
  };

  const puedeReagendar = llamada.estado === "agendada" || llamada.estado === "pendiente";
  const puedeMarcarRealizada = llamada.estado === "agendada" || llamada.estado === "pendiente";
  const esRealizada = llamada.estado === "realizada";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Detalle de Llamada
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información General */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Paciente</span>
                  </div>
                  <p className="font-medium">
                    {llamada.pacientes?.nombre} {llamada.pacientes?.apellido}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Profesional</span>
                  </div>
                  <p className="font-medium">
                    {llamada.personal_salud?.nombre} {llamada.personal_salud?.apellido}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Fecha Agendada</span>
                  </div>
                  {llamada.fecha_agendada && (
                    <p className="font-medium">
                      {format(new Date(llamada.fecha_agendada), "PPp", { locale: es })}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Estado</span>
                  </div>
                  <Badge variant="outline">
                    {llamada.estado?.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              {llamada.motivo && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Motivo</span>
                  </div>
                  <p className="text-sm">{llamada.motivo}</p>
                </div>
              )}

              {llamada.resultado_seguimiento && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Resultado</span>
                  </div>
                  <Badge variant="outline">
                    {llamada.resultado_seguimiento.replace("_", " ")}
                  </Badge>
                </div>
              )}

              {llamada.duracion_minutos && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Duración Real</div>
                  <p className="font-medium">{llamada.duracion_minutos} minutos</p>
                </div>
              )}

              {llamada.comentarios_resultados && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Comentarios</div>
                  <p className="text-sm">{llamada.comentarios_resultados}</p>
                </div>
              )}

              {llamada.notas_adicionales && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Notas Adicionales</div>
                  <p className="text-sm">{llamada.notas_adicionales}</p>
                </div>
              )}

              {llamada.requiere_seguimiento && (
                <Badge variant="destructive">Requiere Seguimiento</Badge>
              )}
            </CardContent>
          </Card>

          {/* Acciones según estado */}
          {!esRealizada && (
            <Tabs defaultValue={puedeMarcarRealizada ? "registrar" : "reagendar"}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="registrar" disabled={!puedeMarcarRealizada}>
                  Registrar Realizada
                </TabsTrigger>
                <TabsTrigger value="reagendar" disabled={!puedeReagendar}>
                  Reagendar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="registrar" className="space-y-4">
                <form onSubmit={handleMarcarRealizada} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="resultado_seguimiento">Resultado *</Label>
                      <Select name="resultado_seguimiento" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar resultado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contactado">Contactado</SelectItem>
                          <SelectItem value="no_contesta">No Contesta</SelectItem>
                          <SelectItem value="mensaje_dejado">Mensaje Dejado</SelectItem>
                          <SelectItem value="llamada_fallida">Llamada Fallida</SelectItem>
                          <SelectItem value="visita_agendada">Visita Agendada</SelectItem>
                          <SelectItem value="paciente_decline">Paciente Decline</SelectItem>
                          <SelectItem value="no_disponible">No Disponible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duracion_minutos">Duración (minutos)</Label>
                      <Input
                        type="number"
                        id="duracion_minutos"
                        name="duracion_minutos"
                        placeholder="Ej: 15"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comentarios_resultados">Resumen de la Conversación</Label>
                    <Textarea
                      id="comentarios_resultados"
                      name="comentarios_resultados"
                      placeholder="Detalles importantes de la llamada..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notas_adicionales">Notas Adicionales</Label>
                    <Textarea
                      id="notas_adicionales"
                      name="notas_adicionales"
                      placeholder="Información adicional relevante..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requiere_seguimiento">¿Requiere Seguimiento?</Label>
                    <Select name="requiere_seguimiento">
                      <SelectTrigger>
                        <SelectValue placeholder="No" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">No</SelectItem>
                        <SelectItem value="true">Sí</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Guardando..." : "Marcar como Realizada"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="reagendar" className="space-y-4">
                <form onSubmit={handleReagendar} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nueva_fecha">Nueva Fecha *</Label>
                      <Input
                        type="date"
                        id="nueva_fecha"
                        name="nueva_fecha"
                        required
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nueva_hora">Nueva Hora *</Label>
                      <Input
                        type="time"
                        id="nueva_hora"
                        name="nueva_hora"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Reagendando..." : "Reagendar Llamada"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}

          {/* Botón de Cancelar */}
          {puedeReagendar && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleCancelar}
              disabled={loading}
            >
              Cancelar Llamada
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
