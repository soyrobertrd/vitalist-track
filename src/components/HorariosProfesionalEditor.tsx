import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";

const DIAS_SEMANA = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
];

const TANDAS = [
  { value: "matutina", label: "Matutina (8:00 - 12:00)", horaInicio: "08:00", horaFin: "12:00" },
  { value: "vespertina", label: "Vespertina (14:00 - 18:00)", horaInicio: "14:00", horaFin: "18:00" },
  { value: "completa", label: "Completa (8:00 - 18:00)", horaInicio: "08:00", horaFin: "18:00" },
];

interface HorariosProfesionalEditorProps {
  profesionalId: string;
  readOnly?: boolean;
}

interface Horario {
  id?: string;
  dia_semana: number;
  activo: boolean;
  tipo: string;
  hora_inicio: string;
  hora_fin: string;
}

export function HorariosProfesionalEditor({ profesionalId, readOnly = false }: HorariosProfesionalEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [horarios, setHorarios] = useState<Horario[]>([]);

  useEffect(() => {
    if (profesionalId) {
      fetchHorarios();
    }
  }, [profesionalId]);

  const fetchHorarios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("horarios_profesionales")
      .select("*")
      .eq("profesional_id", profesionalId)
      .is("fecha_especifica", null);

    if (error) {
      toast.error("Error al cargar horarios");
      setLoading(false);
      return;
    }

    // Initialize with default values if no horarios exist
    if (!data || data.length === 0) {
      const defaultHorarios = DIAS_SEMANA.map(dia => ({
        dia_semana: dia.value,
        activo: true,
        tipo: "completa",
        hora_inicio: "08:00",
        hora_fin: "18:00"
      }));
      setHorarios(defaultHorarios);
    } else {
      // Map existing horarios
      const mappedHorarios = DIAS_SEMANA.map(dia => {
        const existing = data.find(h => h.dia_semana === dia.value);
        if (existing) {
          return {
            id: existing.id,
            dia_semana: existing.dia_semana,
            activo: existing.activo ?? true,
            tipo: existing.tipo || "completa",
            hora_inicio: existing.hora_inicio,
            hora_fin: existing.hora_fin
          };
        }
        return {
          dia_semana: dia.value,
          activo: true,
          tipo: "completa",
          hora_inicio: "08:00",
          hora_fin: "18:00"
        };
      });
      setHorarios(mappedHorarios);
    }
    setLoading(false);
  };

  const updateHorario = (diaSemana: number, field: keyof Horario, value: any) => {
    setHorarios(prev => prev.map(h => {
      if (h.dia_semana === diaSemana) {
        if (field === "tipo") {
          const tanda = TANDAS.find(t => t.value === value);
          if (tanda) {
            return { ...h, tipo: value, hora_inicio: tanda.horaInicio, hora_fin: tanda.horaFin };
          }
        }
        return { ...h, [field]: value };
      }
      return h;
    }));
  };

  const saveHorarios = async () => {
    setSaving(true);
    try {
      // Delete existing horarios
      await supabase
        .from("horarios_profesionales")
        .delete()
        .eq("profesional_id", profesionalId)
        .is("fecha_especifica", null);

      // Insert new horarios
      const { error } = await supabase
        .from("horarios_profesionales")
        .insert(
          horarios.map(h => ({
            profesional_id: profesionalId,
            dia_semana: h.dia_semana,
            activo: h.activo,
            tipo: h.tipo,
            hora_inicio: h.hora_inicio,
            hora_fin: h.hora_fin
          }))
        );

      if (error) throw error;
      toast.success("Horarios guardados correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al guardar horarios");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {horarios.map(horario => {
          const diaLabel = DIAS_SEMANA.find(d => d.value === horario.dia_semana)?.label || "";
          return (
            <div key={horario.dia_semana} className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="w-24">
                <Label className="font-medium">{diaLabel}</Label>
              </div>
              <Switch
                checked={horario.activo}
                onCheckedChange={(checked) => updateHorario(horario.dia_semana, "activo", checked)}
                disabled={readOnly}
              />
              <div className="flex-1">
                <Select
                  value={horario.tipo}
                  onValueChange={(value) => updateHorario(horario.dia_semana, "tipo", value)}
                  disabled={!horario.activo || readOnly}
                >
                  <SelectTrigger className={!horario.activo ? "opacity-50" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TANDAS.map(tanda => (
                      <SelectItem key={tanda.value} value={tanda.value}>
                        {tanda.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
      </div>
      
      {!readOnly && (
        <Button onClick={saveHorarios} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Horarios
            </>
          )}
        </Button>
      )}
    </div>
  );
}
