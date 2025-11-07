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
import { format, addDays } from "date-fns";
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
    const profesionalId = formData.get("profesional_id") as string;
    const fechaHoraAgendada = `${fechaAgendada}T${horaAgendada}:00`;

    const { error } = await supabase
      .from("registro_llamadas")
      .update({
        fecha_agendada: fechaHoraAgendada,
        profesional_id: profesionalId,
        estado: "agendada",
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
    const resultado = formData.get("resultado_seguimiento") as string;
    
    // Si el resultado es "no_contesta", preguntar si desea intentar en X tiempo o reagendar
    if (resultado === "no_contesta") {
      const intentarEnTiempo = formData.get("intentar_en") as string;
      if (intentarEnTiempo) {
        // Crear nueva llamada para intentar más tarde
        const minutosEspera = parseInt(intentarEnTiempo);
        const nuevaFecha = new Date(Date.now() + minutosEspera * 60 * 1000);
        
        await supabase.from("registro_llamadas").insert({
          paciente_id: llamada.paciente_id,
          profesional_id: llamada.profesional_id,
          fecha_agendada: nuevaFecha.toISOString(),
          estado: "agendada" as any,
          motivo: "Reintento - No contestó anteriormente",
          duracion_estimada: llamada.duracion_estimada,
        });
      }
    }
    
    const updateData = {
      estado: "realizada" as const,
      fecha_hora_realizada: new Date().toISOString(),
      resultado_seguimiento: resultado as any,
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
      
      // Si el resultado es "contactado" o "visita_agendada", renovar la agenda según el período del paciente
      if ((resultado === 'contactado' || resultado === 'visita_agendada') && llamada.paciente_id) {
        await renovarAgendaLlamada(llamada.paciente_id, llamada.profesional_id);
      }
      
      onSuccess();
      onOpenChange(false);
    }
    setLoading(false);
  };

  const renovarAgendaLlamada = async (pacienteId: string, profesionalId: string) => {
    try {
      // Obtener los parámetros de seguimiento del paciente
      const { data: parametros, error: parametrosError } = await supabase
        .from("parametros_seguimiento")
        .select("periodo_llamada_ciclico")
        .eq("paciente_id", pacienteId)
        .single();

      if (parametrosError && parametrosError.code !== 'PGRST116') {
        console.error("Error al obtener parámetros:", parametrosError);
        return;
      }

      // Usar el período del paciente o 30 días por defecto
      const periodo = parametros?.periodo_llamada_ciclico || 30;
      const fechaProximaLlamada = addDays(new Date(), periodo);

      // Crear nueva llamada agendada
      const { error: nuevaLlamadaError } = await supabase
        .from("registro_llamadas")
        .insert({
          paciente_id: pacienteId,
          profesional_id: profesionalId,
          fecha_agendada: fechaProximaLlamada.toISOString(),
          estado: 'agendada' as any,
          motivo: 'Seguimiento programado',
        });

      if (nuevaLlamadaError) {
        console.error("Error al crear nueva llamada:", nuevaLlamadaError);
      } else {
        toast.success(`Nueva llamada agendada para ${format(fechaProximaLlamada, "PPP", { locale: es })}`);
      }
    } catch (error) {
      console.error("Error en renovación de agenda:", error);
    }
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
                    {llamada.estado?.replace("_", " ").split(' ').map((palabra: string) => palabra.charAt(0).toUpperCase() + palabra.slice(1)).join(' ')}
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
                    {llamada.resultado_seguimiento.replace("_", " ").split(' ').map((palabra: string) => palabra.charAt(0).toUpperCase() + palabra.slice(1)).join(' ')}
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
                      <Select 
                        name="resultado_seguimiento" 
                        required
                        onValueChange={(val) => {
                          const form = document.querySelector('form');
                          const intentarEnDiv = form?.querySelector('#intentar-en-wrapper');
                          if (intentarEnDiv) {
                            (intentarEnDiv as HTMLElement).style.display = val === 'no_contesta' ? 'block' : 'none';
                          }
                        }}
                      >
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

                  {/* Campo condicional para reintentar cuando no contesta */}
                  <div id="intentar-en-wrapper" style={{ display: 'none' }} className="space-y-2">
                    <Label htmlFor="intentar_en">¿Intentar llamar nuevamente en?</Label>
                    <Select name="intentar_en">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tiempo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="90">1.5 horas</SelectItem>
                        <SelectItem value="120">2 horas</SelectItem>
                        <SelectItem value="150">2.5 horas</SelectItem>
                        <SelectItem value="180">3 horas</SelectItem>
                        <SelectItem value="210">3.5 horas</SelectItem>
                        <SelectItem value="240">4 horas</SelectItem>
                        <SelectItem value="270">4.5 horas</SelectItem>
                        <SelectItem value="300">5 horas</SelectItem>
                        <SelectItem value="330">5.5 horas</SelectItem>
                        <SelectItem value="360">6 horas</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <div className="space-y-2">
                    <Label htmlFor="profesional_id">Profesional *</Label>
                    <Select name="profesional_id" required defaultValue={llamada.profesional_id}>
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
