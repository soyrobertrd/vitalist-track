import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSmartRescheduling } from "@/hooks/useSmartRescheduling";
import { Calendar, Clock, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SmartRescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profesionalId: string;
  profesionalNombre: string;
  fechaOriginal: Date;
  duracionMinutos?: number;
  onSelect: (fecha: Date, horaInicio: string) => void;
}

export function SmartRescheduleDialog({
  open,
  onOpenChange,
  profesionalId,
  profesionalNombre,
  fechaOriginal,
  duracionMinutos = 30,
  onSelect,
}: SmartRescheduleDialogProps) {
  const { suggestReschedule, conflicts, loading } = useSmartRescheduling();
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (open && profesionalId) {
      loadSuggestions();
    }
  }, [open, profesionalId, fechaOriginal]);

  const loadSuggestions = async () => {
    const result = await suggestReschedule(
      profesionalId,
      fechaOriginal,
      duracionMinutos
    );
    setSuggestions(result);
  };

  const handleSelect = (slot: any) => {
    onSelect(slot.fecha, slot.horaInicio);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Reagendamiento Inteligente
          </DialogTitle>
          <DialogDescription>
            Sugerencias de horarios disponibles para {profesionalNombre}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original date */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Fecha original</p>
            <p className="font-medium">
              {format(fechaOriginal, "EEEE d 'de' MMMM, HH:mm", { locale: es })}
            </p>
          </div>

          {/* Conflicts warning */}
          {conflicts.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">
                  {conflicts.length} conflicto(s) detectado(s)
                </span>
              </div>
              <ul className="mt-2 space-y-1">
                {conflicts.map((c) => (
                  <li key={c.id} className="text-sm text-muted-foreground">
                    • {c.tipo}: {c.paciente} - {format(c.fecha, "HH:mm")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          <div>
            <p className="text-sm font-medium mb-2">Horarios sugeridos</p>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : suggestions.length > 0 ? (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <Card
                      key={index}
                      className="hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleSelect(suggestion.slot)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg">
                              <Calendar className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {format(
                                  suggestion.slot.fecha,
                                  "EEEE d 'de' MMMM",
                                  { locale: es }
                                )}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {suggestion.slot.horaInicio} -{" "}
                                  {suggestion.slot.horaFin}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-xs ml-2"
                                >
                                  {suggestion.reason}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No hay horarios disponibles en los próximos días
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button variant="ghost" onClick={loadSuggestions} disabled={loading}>
              Recalcular
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
