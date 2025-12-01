import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2, Plus, Calendar, AlertTriangle } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

interface Ausencia {
  id: string;
  profesional_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo: string;
  descripcion: string | null;
  aprobado: boolean;
}

interface CitaConflicto {
  id: string;
  tipo: "llamada" | "visita";
  fecha: string;
  paciente_nombre: string;
  paciente_id: string;
}

interface AusenciasProfesionalDialogProps {
  profesionalId: string;
  profesionalNombre: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIPOS_AUSENCIA = [
  { value: "vacaciones", label: "Vacaciones" },
  { value: "licencia", label: "Licencia médica" },
  { value: "permiso", label: "Permiso personal" },
  { value: "ausencia", label: "Ausencia" },
  { value: "enfermedad", label: "Enfermedad" },
];

export function AusenciasProfesionalDialog({
  profesionalId,
  profesionalNombre,
  open,
  onOpenChange,
}: AusenciasProfesionalDialogProps) {
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fecha_inicio: "",
    fecha_fin: "",
    tipo: "permiso",
    descripcion: "",
  });
  const [conflictos, setConflictos] = useState<CitaConflicto[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [pendingAusencia, setPendingAusencia] = useState<typeof formData | null>(null);
  const [profesionalesDisponibles, setProfesionalesDisponibles] = useState<any[]>([]);
  const { isAdmin } = useUserRole();

  useEffect(() => {
    if (open) {
      fetchAusencias();
      fetchProfesionales();
    }
  }, [open, profesionalId]);

  const fetchAusencias = async () => {
    const { data, error } = await supabase
      .from("ausencias_profesionales")
      .select("*")
      .eq("profesional_id", profesionalId)
      .order("fecha_inicio", { ascending: false });

    if (error) {
      toast.error("Error al cargar ausencias");
    } else {
      setAusencias(data || []);
    }
  };

  const fetchProfesionales = async () => {
    const { data } = await supabase
      .from("personal_salud")
      .select("*")
      .eq("activo", true)
      .neq("id", profesionalId)
      .order("nombre", { ascending: true });
    setProfesionalesDisponibles(data || []);
  };

  const checkConflicts = async (fechaInicio: string, fechaFin: string): Promise<CitaConflicto[]> => {
    const conflictosList: CitaConflicto[] = [];

    // Check calls
    const { data: llamadas } = await supabase
      .from("registro_llamadas")
      .select(`
        id,
        fecha_agendada,
        paciente:pacientes(id, nombre, apellido)
      `)
      .eq("profesional_id", profesionalId)
      .eq("estado", "agendada")
      .gte("fecha_agendada", fechaInicio)
      .lte("fecha_agendada", fechaFin + "T23:59:59");

    if (llamadas) {
      llamadas.forEach((l: any) => {
        if (l.paciente) {
          conflictosList.push({
            id: l.id,
            tipo: "llamada",
            fecha: l.fecha_agendada,
            paciente_nombre: `${l.paciente.nombre} ${l.paciente.apellido}`,
            paciente_id: l.paciente.id,
          });
        }
      });
    }

    // Check visits
    const { data: visitas } = await supabase
      .from("control_visitas")
      .select(`
        id,
        fecha_hora_visita,
        paciente:pacientes(id, nombre, apellido)
      `)
      .eq("profesional_id", profesionalId)
      .eq("estado", "pendiente")
      .gte("fecha_hora_visita", fechaInicio)
      .lte("fecha_hora_visita", fechaFin + "T23:59:59");

    if (visitas) {
      visitas.forEach((v: any) => {
        if (v.paciente) {
          conflictosList.push({
            id: v.id,
            tipo: "visita",
            fecha: v.fecha_hora_visita,
            paciente_nombre: `${v.paciente.nombre} ${v.paciente.apellido}`,
            paciente_id: v.paciente.id,
          });
        }
      });
    }

    return conflictosList;
  };

  const handleSubmit = async () => {
    if (!formData.fecha_inicio || !formData.fecha_fin) {
      toast.error("Seleccione las fechas de inicio y fin");
      return;
    }

    if (new Date(formData.fecha_fin) < new Date(formData.fecha_inicio)) {
      toast.error("La fecha de fin debe ser posterior a la fecha de inicio");
      return;
    }

    // Check for conflicts
    const conflictosList = await checkConflicts(formData.fecha_inicio, formData.fecha_fin);

    if (conflictosList.length > 0) {
      setConflictos(conflictosList);
      setPendingAusencia(formData);
      setShowConflictDialog(true);
      return;
    }

    await saveAusencia(formData);
  };

  const saveAusencia = async (data: typeof formData) => {
    setLoading(true);
    const { error } = await supabase.from("ausencias_profesionales").insert([
      {
        profesional_id: profesionalId,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        tipo: data.tipo,
        descripcion: data.descripcion || null,
        aprobado: isAdmin,
      },
    ]);

    if (error) {
      toast.error("Error al registrar ausencia");
    } else {
      toast.success("Ausencia registrada exitosamente");
      setShowForm(false);
      setFormData({
        fecha_inicio: "",
        fecha_fin: "",
        tipo: "permiso",
        descripcion: "",
      });
      fetchAusencias();
    }
    setLoading(false);
  };

  const handleDeleteAusencia = async (id: string) => {
    const { error } = await supabase.from("ausencias_profesionales").delete().eq("id", id);

    if (error) {
      toast.error("Error al eliminar ausencia");
    } else {
      toast.success("Ausencia eliminada");
      fetchAusencias();
    }
  };

  const handleConfirmWithConflicts = async (action: "reasignar" | "reagendar") => {
    if (!pendingAusencia) return;

    setLoading(true);

    if (action === "reagendar") {
      // Just mark them as needing rescheduling - for now we'll cancel them
      for (const conflicto of conflictos) {
        if (conflicto.tipo === "llamada") {
          await supabase
            .from("registro_llamadas")
            .update({ estado: "reagendada", notas_adicionales: `Reagendada por ausencia del profesional` })
            .eq("id", conflicto.id);
        } else {
          await supabase
            .from("control_visitas")
            .update({ estado: "postpuesta", notas_visita: `Pospuesta por ausencia del profesional` })
            .eq("id", conflicto.id);
        }
      }
      toast.info("Las citas han sido marcadas para reagendar");
    }

    // Save the ausencia
    await saveAusencia(pendingAusencia);

    setShowConflictDialog(false);
    setPendingAusencia(null);
    setConflictos([]);
    setLoading(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Ausencias - {profesionalNombre}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!showForm ? (
              <Button onClick={() => setShowForm(true)} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Registrar Ausencia
              </Button>
            ) : (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha Inicio</Label>
                    <Input
                      type="date"
                      value={formData.fecha_inicio}
                      onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Fin</Label>
                    <Input
                      type="date"
                      value={formData.fecha_fin}
                      onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Ausencia</Label>
                  <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_AUSENCIA.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Descripción (opcional)</Label>
                  <Textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Motivo o detalles adicionales..."
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? "Guardando..." : "Guardar"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Ausencias Registradas</h4>
              {ausencias.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay ausencias registradas</p>
              ) : (
                <div className="space-y-2">
                  {ausencias.map((ausencia) => (
                    <div
                      key={ausencia.id}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {format(parseISO(ausencia.fecha_inicio), "dd/MM/yyyy", { locale: es })}
                            {ausencia.fecha_inicio !== ausencia.fecha_fin &&
                              ` - ${format(parseISO(ausencia.fecha_fin), "dd/MM/yyyy", { locale: es })}`}
                          </span>
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded capitalize">
                            {TIPOS_AUSENCIA.find((t) => t.value === ausencia.tipo)?.label || ausencia.tipo}
                          </span>
                        </div>
                        {ausencia.descripcion && (
                          <p className="text-xs text-muted-foreground mt-1">{ausencia.descripcion}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAusencia(ausencia.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Citas programadas encontradas
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Se encontraron {conflictos.length} cita(s) programada(s) durante este período de ausencia:
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {conflictos.map((c) => (
                  <div key={c.id} className="text-sm p-2 bg-muted rounded">
                    <span className="font-medium capitalize">{c.tipo}</span> -{" "}
                    {format(parseISO(c.fecha), "dd/MM/yyyy HH:mm", { locale: es })} - {c.paciente_nombre}
                  </div>
                ))}
              </div>
              <p className="font-medium">¿Qué desea hacer con estas citas?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleConfirmWithConflicts("reagendar")}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Marcar para Reagendar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
