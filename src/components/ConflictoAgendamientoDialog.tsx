import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ConflictoAgendamientoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  tipo: "llamada" | "visita";
  eventoExistente: {
    id: string;
    fecha: string;
    profesional: { nombre: string; apellido: string } | null;
    motivo?: string;
    duracion_estimada?: number;
    tipo_visita?: string;
  } | null;
  pacienteNombre: string;
}

const MOTIVOS_LLAMADA = [
  "Seguimiento rutinario",
  "Recordatorio de cita",
  "Verificación de medicamentos",
  "Control post-visita",
  "Consulta telefónica",
  "Reagendamiento",
  "Otro"
];

const TIPOS_VISITA = ["Domicilio", "Hospital", "Consultorio"];

export function ConflictoAgendamientoDialog({
  open,
  onOpenChange,
  onConfirm,
  tipo,
  eventoExistente,
  pacienteNombre,
}: ConflictoAgendamientoDialogProps) {
  const [modoEdicion, setModoEdicion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [motivo, setMotivo] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [duracion, setDuracion] = useState("");
  const [tipoVisita, setTipoVisita] = useState("");

  const handleOpenEditMode = () => {
    if (eventoExistente) {
      const fechaObj = new Date(eventoExistente.fecha);
      setFecha(format(fechaObj, "yyyy-MM-dd"));
      setHora(format(fechaObj, "HH:mm"));
      setMotivo(eventoExistente.motivo || "");
      setDuracion(eventoExistente.duracion_estimada?.toString() || "");
      setTipoVisita(eventoExistente.tipo_visita || "");
    }
    setModoEdicion(true);
  };

  const handleSaveEdit = async () => {
    if (!eventoExistente) return;

    setLoading(true);
    const fechaHora = new Date(`${fecha}T${hora}`);

    const updateData =
      tipo === "llamada"
        ? {
            fecha_agendada: fechaHora.toISOString(),
            motivo,
            duracion_estimada: parseInt(duracion) || null,
            notas_adicionales: comentarios,
          }
        : {
            fecha_hora_visita: fechaHora.toISOString(),
            motivo_visita: motivo,
            tipo_visita: tipoVisita,
            notas_visita: comentarios,
          };

    const tabla = tipo === "llamada" ? "registro_llamadas" : "control_visitas";

    const { error } = await supabase
      .from(tabla)
      .update(updateData)
      .eq("id", eventoExistente.id);

    if (error) {
      toast.error(`Error al actualizar ${tipo}`);
    } else {
      toast.success(`${tipo === "llamada" ? "Llamada" : "Visita"} actualizada`);
      onOpenChange(false);
      setModoEdicion(false);
    }
    setLoading(false);
  };

  if (!eventoExistente) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {modoEdicion
              ? `Editar ${tipo === "llamada" ? "Llamada" : "Visita"} Existente`
              : `${tipo === "llamada" ? "Llamada" : "Visita"} Ya Agendada`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {!modoEdicion && (
              <>
                El paciente <strong>{pacienteNombre}</strong> ya tiene una{" "}
                {tipo} agendada:
                <div className="mt-3 p-4 border rounded-lg bg-muted space-y-2">
                  <p>
                    <strong>Fecha:</strong>{" "}
                    {format(new Date(eventoExistente.fecha), "PPP 'a las' p", {
                      locale: es,
                    })}
                  </p>
                  {eventoExistente.profesional && (
                    <p>
                      <strong>Profesional:</strong>{" "}
                      {eventoExistente.profesional.nombre}{" "}
                      {eventoExistente.profesional.apellido}
                    </p>
                  )}
                  {eventoExistente.motivo && (
                    <p>
                      <strong>Motivo:</strong> {eventoExistente.motivo}
                    </p>
                  )}
                  {tipo === "llamada" && eventoExistente.duracion_estimada && (
                    <p>
                      <strong>Duración:</strong> {eventoExistente.duracion_estimada}{" "}
                      minutos
                    </p>
                  )}
                  {tipo === "visita" && eventoExistente.tipo_visita && (
                    <p>
                      <strong>Tipo:</strong> {eventoExistente.tipo_visita}
                    </p>
                  )}
                </div>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {modoEdicion ? (
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora">Hora</Label>
                <Input
                  id="hora"
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                />
              </div>
            </div>

            {tipo === "llamada" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="motivo">Motivo</Label>
                  <Select value={motivo} onValueChange={setMotivo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOTIVOS_LLAMADA.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duracion">Duración Estimada (minutos)</Label>
                  <Input
                    id="duracion"
                    type="number"
                    value={duracion}
                    onChange={(e) => setDuracion(e.target.value)}
                    min="5"
                    max="120"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="tipoVisita">Tipo de Visita</Label>
                  <Select value={tipoVisita} onValueChange={setTipoVisita}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_VISITA.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motivoVisita">Motivo de Visita</Label>
                  <Input
                    id="motivoVisita"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Motivo de la visita"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="comentarios">Comentarios Adicionales</Label>
              <Textarea
                id="comentarios"
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                placeholder="Notas adicionales..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveEdit} disabled={loading} className="flex-1">
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setModoEdicion(false)}
              >
                Volver
              </Button>
            </div>
          </div>
        ) : (
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant="outline" onClick={handleOpenEditMode}>
              Modificar Existente
            </Button>
            <AlertDialogAction onClick={onConfirm}>
              Confirmar de Todas Formas
            </AlertDialogAction>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
