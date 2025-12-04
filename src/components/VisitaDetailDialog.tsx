import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, User, Home, Building, Mail } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { GlassCard } from "@/components/GlassCard";
import { EnviarRecordatorioDialog } from "@/components/EnviarRecordatorioDialog";

interface VisitaDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visita: any | null;
  onSuccess: () => void;
  pacientes: any[];
  personal: any[];
}

export function VisitaDetailDialog({
  open,
  onOpenChange,
  visita,
  onSuccess,
  pacientes,
  personal,
}: VisitaDetailDialogProps) {
  const [loading, setLoading] = useState(false);
  const [showRecordatorioDialog, setShowRecordatorioDialog] = useState(false);

  const handleReagendar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const fechaHoraVisita = formData.get("nueva_fecha_hora") as string;
    const profesionalId = formData.get("profesional_id") as string;
    const motivo = formData.get("motivo_reagendar") as string;

    const { error } = await supabase
      .from("control_visitas")
      .update({
        fecha_hora_visita: fechaHoraVisita,
        profesional_id: profesionalId,
        motivo_visita: motivo,
        estado: "pendiente",
      })
      .eq("id", visita.id);

    if (error) {
      toast.error("Error al reagendar la visita");
    } else {
      toast.success("Visita reagendada exitosamente");
      onSuccess();
    }
    setLoading(false);
  };

  const handleCancelar = async () => {
    setLoading(true);

    const { error } = await supabase
      .from("control_visitas")
      .update({ estado: "cancelada" })
      .eq("id", visita.id);

    if (error) {
      toast.error("Error al cancelar la visita");
    } else {
      // Crear llamada de seguimiento 2-3 días después
      await createFollowUpCall(2);
      toast.success("Visita cancelada y llamada de seguimiento programada");
      onSuccess();
      onOpenChange(false);
    }
    setLoading(false);
  };

  const handlePosponer = async (dias: number) => {
    setLoading(true);

    const nuevaFecha = new Date(visita.fecha_hora_visita);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);

    const { error } = await supabase
      .from("control_visitas")
      .update({ 
        fecha_hora_visita: nuevaFecha.toISOString(),
        estado: "pendiente" 
      })
      .eq("id", visita.id);

    if (error) {
      toast.error("Error al posponer la visita");
    } else {
      // Crear llamada de seguimiento 2-3 días después
      await createFollowUpCall(2);
      toast.success(`Visita pospuesta ${dias} días y llamada de seguimiento programada`);
      onSuccess();
      onOpenChange(false);
    }
    setLoading(false);
  };

  const createFollowUpCall = async (diasDespues: number) => {
    const fechaLlamada = new Date();
    fechaLlamada.setDate(fechaLlamada.getDate() + diasDespues);

    await supabase.from("registro_llamadas").insert({
      paciente_id: visita.paciente_id,
      profesional_id: visita.profesional_id,
      fecha_agendada: fechaLlamada.toISOString(),
      estado: "agendada",
      motivo: `Seguimiento por ${visita.estado === "cancelada" ? "cancelación" : "posposición"} de visita`,
      duracion_estimada: 10,
    });
  };

  const handleMarcarRealizada = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    const updateData = {
      estado: "realizada" as const,
      notas_visita: formData.get("notas_visita") as string,
    };

    const { error } = await supabase
      .from("control_visitas")
      .update(updateData)
      .eq("id", visita.id);

    if (error) {
      toast.error("Error al registrar la visita");
      console.error(error);
    } else {
      toast.success("Visita registrada como realizada");
      onSuccess();
      onOpenChange(false);
    }
    setLoading(false);
  };

  const puedeReagendar = visita.estado === "pendiente";
  const puedeMarcarRealizada = visita.estado === "pendiente";
  const esRealizada = visita.estado === "realizada";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {visita.tipo_visita === "domicilio" ? <Home className="h-5 w-5" /> : <Building className="h-5 w-5" />}
            Detalle de Visita
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información General */}
          <GlassCard className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Paciente</span>
                </div>
                <p className="font-medium">
                  {visita.pacientes?.nombre} {visita.pacientes?.apellido}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Profesional</span>
                </div>
                <p className="font-medium">
                  {visita.personal_salud?.nombre} {visita.personal_salud?.apellido}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Fecha y Hora</span>
                </div>
                {visita.fecha_hora_visita && (
                  <p className="font-medium">
                    {format(new Date(visita.fecha_hora_visita), "PPp", { locale: es })}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Estado</span>
                </div>
                <Badge variant="outline">
                  {visita.estado?.charAt(0).toUpperCase() + visita.estado?.slice(1)}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {visita.tipo_visita === "domicilio" ? <Home className="h-4 w-4" /> : <Building className="h-4 w-4" />}
                <span>Tipo de Visita</span>
              </div>
              <Badge variant="secondary">
                {visita.tipo_visita === "domicilio" ? "Domicilio" : "Ambulatorio"}
              </Badge>
            </div>

            {visita.motivo_visita && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Motivo</div>
                <p className="text-sm">{visita.motivo_visita}</p>
              </div>
            )}

            {visita.notas_visita && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Notas</div>
                <p className="text-sm">{visita.notas_visita}</p>
              </div>
            )}

            {/* Botón Enviar Recordatorio */}
            {!esRealizada && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowRecordatorioDialog(true)}
              >
                <Mail className="h-4 w-4 mr-2" />
                Enviar Recordatorio
              </Button>
            )}
          </GlassCard>

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
                  <div className="space-y-2">
                    <Label htmlFor="notas_visita">Notas de la Visita</Label>
                    <Textarea
                      id="notas_visita"
                      name="notas_visita"
                      placeholder="Detalles importantes de la visita..."
                      rows={6}
                    />
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
                    <Select name="profesional_id" required defaultValue={visita.profesional_id}>
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
                    <Label htmlFor="nueva_fecha_hora">Nueva Fecha y Hora *</Label>
                    <Input
                      type="datetime-local"
                      id="nueva_fecha_hora"
                      name="nueva_fecha_hora"
                      required
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motivo_reagendar">Motivo del Reagendamiento *</Label>
                    <Select name="motivo_reagendar" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar motivo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Paciente solicitó cambio">Paciente solicitó cambio</SelectItem>
                        <SelectItem value="Conflicto de horarios">Conflicto de horarios</SelectItem>
                        <SelectItem value="Profesional no disponible">Profesional no disponible</SelectItem>
                        <SelectItem value="Emergencia del paciente">Emergencia del paciente</SelectItem>
                        <SelectItem value="Condiciones climáticas">Condiciones climáticas</SelectItem>
                        <SelectItem value="Otro motivo">Otro motivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Reagendando..." : "Reagendar Visita"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}

          {/* Botones de Cancelar y Posponer */}
          {puedeReagendar && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePosponer(7)}
                  disabled={loading}
                >
                  Posponer 1 Semana
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePosponer(14)}
                  disabled={loading}
                >
                  Posponer 2 Semanas
                </Button>
              </div>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleCancelar}
                disabled={loading}
              >
                Cancelar Visita
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Al cancelar o posponer se programará una llamada de seguimiento en 2 días
              </p>
            </div>
          )}
        </div>

        {/* Dialog de Enviar Recordatorio */}
        <EnviarRecordatorioDialog
          open={showRecordatorioDialog}
          onOpenChange={setShowRecordatorioDialog}
          tipo="visita"
          citaId={visita.id}
          pacienteNombre={`${visita.pacientes?.nombre} ${visita.pacientes?.apellido}`}
          emailPaciente={visita.pacientes?.email_px}
          emailCuidador={visita.pacientes?.email_cuidador}
        />
      </DialogContent>
    </Dialog>
  );
}
