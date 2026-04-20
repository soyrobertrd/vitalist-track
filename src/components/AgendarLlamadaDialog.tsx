import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PacienteCombobox } from "./PacienteCombobox";
import { ProfesionalCombobox } from "./ProfesionalCombobox";
import { ConflictoAgendamientoDialog } from "./ConflictoAgendamientoDialog";
import { AutoAssignDialog } from "./AutoAssignDialog";
import { SugerenciasHorarioInline } from "./SugerenciasHorarioInline";
import { AlertaConflictoEnVivo } from "./AlertaConflictoEnVivo";
import { useConflictoEnVivo } from "@/hooks/useConflictoEnVivo";
import { useDiasLaborables } from "@/hooks/useDiasLaborables";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, Wand2 } from "lucide-react";

const MOTIVOS_LLAMADA = [
  "Seguimiento rutinario",
  "Recordatorio de cita",
  "Verificación de medicamentos",
  "Control post-visita",
  "Consulta telefónica",
  "Reagendamiento",
  "Otro"
];

interface AgendarLlamadaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacientes: any[];
  personal: any[];
  onSuccess: () => void;
}

export function AgendarLlamadaDialog({ open, onOpenChange, pacientes, personal, onSuccess }: AgendarLlamadaDialogProps) {
  const [loading, setLoading] = useState(false);
  const [pacienteId, setPacienteId] = useState<string>("");
  const [profesionalId, setProfesionalId] = useState<string>("");
  const [motivo, setMotivo] = useState<string>("");
  const [conflictoOpen, setConflictoOpen] = useState(false);
  const [llamadaExistente, setLlamadaExistente] = useState<any>(null);
  const [pendingSubmit, setPendingSubmit] = useState<any>(null);
  const [fechaAlerta, setFechaAlerta] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedHora, setSelectedHora] = useState<string>("");
  const [selectedDuracion, setSelectedDuracion] = useState<string>("15");
  const [autoAssignOpen, setAutoAssignOpen] = useState(false);
  const [selectedPacienteData, setSelectedPacienteData] = useState<any>(null);
  
  const { validarFechaAgendamiento, siguienteDiaLaborable } = useDiasLaborables();
  const { conflictos, checking } = useConflictoEnVivo(
    profesionalId,
    selectedDate,
    selectedHora,
    parseInt(selectedDuracion) || 15
  );

  const handlePacienteChange = async (id: string) => {
    setPacienteId(id);
    if (id) {
      const { data } = await supabase
        .from("pacientes")
        .select("zona, barrio, nombre, apellido")
        .eq("id", id)
        .single();
      setSelectedPacienteData(data);
    } else {
      setSelectedPacienteData(null);
    }
  };

  const handleDateChange = (fecha: string) => {
    setSelectedDate(fecha);
    if (fecha) {
      const fechaDate = new Date(fecha + "T12:00:00");
      const validacion = validarFechaAgendamiento(fechaDate);
      if (!validacion.valido) {
        setFechaAlerta(validacion.mensaje || null);
      } else {
        setFechaAlerta(null);
      }
    } else {
      setFechaAlerta(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, forceCreate = false) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const fecha = formData.get("fecha") as string;
    const hora = formData.get("hora") as string;
    let fechaAgendada = new Date(`${fecha}T${hora}`);

    // Validar día laborable
    const validacion = validarFechaAgendamiento(fechaAgendada);
    if (!validacion.valido) {
      const sugerencia = siguienteDiaLaborable(fechaAgendada);
      toast.error("Fecha no disponible", {
        description: `No se puede agendar en esta fecha. Próximo día disponible: ${format(sugerencia, "dd/MM/yyyy")}`
      });
      setLoading(false);
      return;
    }

    // Verificar si ya existe una llamada agendada para este paciente
    if (!forceCreate) {
      const { data: existente, error: checkError } = await supabase
        .from("registro_llamadas")
        .select("*, personal_salud!registro_llamadas_profesional_id_fkey(nombre, apellido)")
        .eq("paciente_id", pacienteId)
        .in("estado", ["agendada", "pendiente"])
        .maybeSingle();

      if (existente && !checkError) {
        const paciente = pacientes.find(p => p.id === pacienteId);
        setLlamadaExistente({
          id: existente.id,
          fecha: existente.fecha_agendada,
          profesional: existente.personal_salud,
          motivo: existente.motivo,
          duracion_estimada: existente.duracion_estimada,
        });
        setPendingSubmit({ formData, fechaAgendada });
        setConflictoOpen(true);
        setLoading(false);
        return;
      }
    }

    const llamadaData = {
      paciente_id: pacienteId,
      profesional_id: profesionalId || null,
      fecha_agendada: fechaAgendada.toISOString(),
      estado: "agendada" as any,
      motivo: motivo,
      duracion_estimada: parseInt(formData.get("duracion_estimada") as string) || null,
      notas_adicionales: formData.get("notas_adicionales") as string,
    };

    const { error } = await supabase
      .from("registro_llamadas")
      .insert([llamadaData]);

    if (error) {
      toast.error("Error al agendar llamada");
    } else {
      toast.success("Llamada agendada exitosamente");
      onSuccess();
      onOpenChange(false);
      (e.target as HTMLFormElement).reset();
      setPacienteId("");
      setProfesionalId("");
      setMotivo("");
    }
    setLoading(false);
  };

  const handleConfirmConflict = () => {
    if (pendingSubmit) {
      const form = document.getElementById("agendar-llamada-form") as HTMLFormElement;
      if (form) {
        handleSubmit({ preventDefault: () => {}, currentTarget: form } as any, true);
      }
    }
    setConflictoOpen(false);
    setPendingSubmit(null);
  };

  const paciente = pacientes.find(p => p.id === pacienteId);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agendar Llamada</DialogTitle>
          </DialogHeader>
          <form id="agendar-llamada-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paciente">Paciente *</Label>
                <PacienteCombobox
                  pacientes={pacientes}
                  value={pacienteId}
                  onValueChange={handlePacienteChange}
                  required
                  showCedula={false}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profesional">Profesional Asignado</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <ProfesionalCombobox
                      profesionales={personal}
                      value={profesionalId}
                      onValueChange={setProfesionalId}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setAutoAssignOpen(true)}
                    disabled={!pacienteId || !selectedDate}
                    title="Asignación automática"
                  >
                    <Wand2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  name="fecha"
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora">Hora *</Label>
                <Input
                  id="hora"
                  name="hora"
                  type="time"
                  required
                  value={selectedHora}
                  onChange={(e) => setSelectedHora(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duracion_estimada">Duración (min)</Label>
                <Input
                  id="duracion_estimada"
                  name="duracion_estimada"
                  type="number"
                  min="5"
                  max="120"
                  value={selectedDuracion}
                  onChange={(e) => setSelectedDuracion(e.target.value)}
                />
              </div>
            </div>

            {profesionalId && (
              <SugerenciasHorarioInline
                profesionalId={profesionalId}
                fechaBase={selectedDate ? new Date(`${selectedDate}T12:00:00`) : new Date()}
                duracionMinutos={parseInt(selectedDuracion) || 15}
                onSelect={(fecha, hora) => {
                  setSelectedDate(format(fecha, "yyyy-MM-dd"));
                  setSelectedHora(hora);
                }}
              />
            )}

            <AlertaConflictoEnVivo conflictos={conflictos} checking={checking} />

            {fechaAlerta && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{fechaAlerta}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo de la Llamada *</Label>
              <Select value={motivo} onValueChange={setMotivo} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un motivo" />
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
              <Label htmlFor="notas_adicionales">Comentarios Adicionales</Label>
              <Textarea
                id="notas_adicionales"
                name="notas_adicionales"
                placeholder="Detalles adicionales sobre la llamada..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Agendando..." : "Agendar Llamada"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      <ConflictoAgendamientoDialog
        open={conflictoOpen}
        onOpenChange={setConflictoOpen}
        onConfirm={handleConfirmConflict}
        tipo="llamada"
        eventoExistente={llamadaExistente}
        pacienteNombre={paciente ? `${paciente.nombre} ${paciente.apellido}` : ""}
      />

      <AutoAssignDialog
        open={autoAssignOpen}
        onOpenChange={setAutoAssignOpen}
        pacienteId={pacienteId}
        pacienteNombre={selectedPacienteData ? `${selectedPacienteData.nombre} ${selectedPacienteData.apellido}` : ""}
        pacienteZona={selectedPacienteData?.zona || null}
        pacienteBarrio={selectedPacienteData?.barrio || null}
        fecha={selectedDate ? new Date(`${selectedDate}T12:00:00`) : new Date()}
        onSelect={(profId) => setProfesionalId(profId)}
      />
    </>
  );
}
