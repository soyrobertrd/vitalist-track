import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useSmartRescheduling } from "@/hooks/useSmartRescheduling";
import { Sparkles, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  profesionalId: string;
  fechaBase?: Date;
  duracionMinutos?: number;
  onSelect: (fecha: Date, horaInicio: string) => void;
}

/**
 * Panel inline que sugiere automáticamente los próximos slots disponibles
 * para un profesional. Se muestra al lado del campo fecha/hora en los diálogos
 * de agendamiento.
 */
export function SugerenciasHorarioInline({
  profesionalId,
  fechaBase,
  duracionMinutos = 30,
  onSelect,
}: Props) {
  const { findAvailableSlots, loading } = useSmartRescheduling();
  const [slots, setSlots] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && profesionalId) {
      findAvailableSlots(profesionalId, fechaBase || new Date(), 7, duracionMinutos)
        .then((s) => setSlots(s.slice(0, 6)));
    }
  }, [open, profesionalId, fechaBase, duracionMinutos, findAvailableSlots]);

  if (!profesionalId) return null;

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        Sugerir horarios disponibles
      </Button>
    );
  }

  return (
    <Card className="p-3 space-y-2 border-primary/40 bg-primary/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          Próximos slots disponibles
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Ocultar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
          <Loader2 className="h-4 w-4 animate-spin" /> Buscando horarios...
        </div>
      ) : slots.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          No hay horarios disponibles en los próximos 7 días.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {slots.map((s, i) => (
            <Button
              key={i}
              type="button"
              variant="outline"
              size="sm"
              className="justify-start h-auto py-2"
              onClick={() => {
                onSelect(s.fecha, s.horaInicio);
                setOpen(false);
              }}
            >
              <div className="text-left">
                <div className="text-xs font-medium capitalize">
                  {format(s.fecha, "EEE d MMM", { locale: es })}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {s.horaInicio}
                </div>
              </div>
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
}
