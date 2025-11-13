import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";

interface Restriccion {
  id: string;
  dia_semana: number;
  hora_inicio: string | null;
  hora_fin: string | null;
  motivo: string | null;
  activo: boolean;
}

interface RestriccionesVisitasPacienteProps {
  pacienteId: string;
}

const DIAS_SEMANA = [
  "Domingo",
  "Lunes", 
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado"
];

export const RestriccionesVisitasPaciente = ({ pacienteId }: RestriccionesVisitasPacienteProps) => {
  const { toast } = useToast();
  const [restricciones, setRestricciones] = useState<Restriccion[]>([]);
  const [nuevaRestriccion, setNuevaRestriccion] = useState({
    dia_semana: 0,
    hora_inicio: "",
    hora_fin: "",
    motivo: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRestricciones();
  }, [pacienteId]);

  const fetchRestricciones = async () => {
    const { data, error } = await (supabase as any)
      .from("restricciones_visitas_paciente")
      .select("*")
      .eq("paciente_id", pacienteId)
      .eq("activo", true)
      .order("dia_semana");

    if (error) {
      console.error("Error al cargar restricciones:", error);
      return;
    }

    setRestricciones((data as any[]) || []);
  };

  const handleAgregarRestriccion = async () => {
    if (!nuevaRestriccion.motivo.trim()) {
      toast({
        title: "Error",
        description: "Debe especificar el motivo de la restricción",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const { error } = await (supabase as any)
      .from("restricciones_visitas_paciente")
      .insert({
        paciente_id: pacienteId,
        dia_semana: nuevaRestriccion.dia_semana,
        hora_inicio: nuevaRestriccion.hora_inicio || null,
        hora_fin: nuevaRestriccion.hora_fin || null,
        motivo: nuevaRestriccion.motivo
      });

    if (error) {
      toast({
        title: "Error",
        description: "Error al agregar restricción",
        variant: "destructive"
      });
      console.error(error);
    } else {
      toast({
        title: "Éxito",
        description: "Restricción agregada correctamente"
      });
      setNuevaRestriccion({
        dia_semana: 0,
        hora_inicio: "",
        hora_fin: "",
        motivo: ""
      });
      fetchRestricciones();
    }
    setLoading(false);
  };

  const handleEliminarRestriccion = async (id: string) => {
    const { error } = await (supabase as any)
      .from("restricciones_visitas_paciente")
      .update({ activo: false })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Error al eliminar restricción",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Éxito",
        description: "Restricción eliminada correctamente"
      });
      fetchRestricciones();
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Restricciones de Visitas</h3>
      <p className="text-sm text-muted-foreground">
        Configure los días y horarios en los que el paciente NO puede recibir visitas (ej: días de diálisis)
      </p>

      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <Label>Día de la semana</Label>
            <select
              className="w-full mt-1 p-2 border rounded-md"
              value={nuevaRestriccion.dia_semana}
              onChange={(e) => setNuevaRestriccion({ ...nuevaRestriccion, dia_semana: parseInt(e.target.value) })}
            >
              {DIAS_SEMANA.map((dia, index) => (
                <option key={index} value={index}>{dia}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Hora inicio (opcional)</Label>
              <Input
                type="time"
                value={nuevaRestriccion.hora_inicio}
                onChange={(e) => setNuevaRestriccion({ ...nuevaRestriccion, hora_inicio: e.target.value })}
              />
            </div>
            <div>
              <Label>Hora fin (opcional)</Label>
              <Input
                type="time"
                value={nuevaRestriccion.hora_fin}
                onChange={(e) => setNuevaRestriccion({ ...nuevaRestriccion, hora_fin: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Motivo</Label>
            <Textarea
              placeholder="Ej: Diálisis, Consulta en otro centro, etc."
              value={nuevaRestriccion.motivo}
              onChange={(e) => setNuevaRestriccion({ ...nuevaRestriccion, motivo: e.target.value })}
            />
          </div>

          <Button onClick={handleAgregarRestriccion} disabled={loading} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Restricción
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        {restricciones.map((restriccion) => (
          <Card key={restriccion.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{DIAS_SEMANA[restriccion.dia_semana]}</p>
                {restriccion.hora_inicio && restriccion.hora_fin && (
                  <p className="text-sm text-muted-foreground">
                    {restriccion.hora_inicio} - {restriccion.hora_fin}
                  </p>
                )}
                <p className="text-sm mt-1">{restriccion.motivo}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEliminarRestriccion(restriccion.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </Card>
        ))}
        {restricciones.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay restricciones configuradas
          </p>
        )}
      </div>
    </div>
  );
};
