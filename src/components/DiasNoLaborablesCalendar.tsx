import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2, Plus } from "lucide-react";

interface DiaNoLaborable {
  fecha: string;
  descripcion: string;
}

export function DiasNoLaborablesCalendar() {
  const [diasNoLaborables, setDiasNoLaborables] = useState<DiaNoLaborable[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDiasNoLaborables();
  }, []);

  const fetchDiasNoLaborables = async () => {
    const { data, error } = await supabase
      .from("dias_no_laborables")
      .select("*")
      .order("fecha", { ascending: true });

    if (error) {
      toast.error("Error al cargar días no laborables");
    } else {
      setDiasNoLaborables(data || []);
    }
  };

  const handleAddDia = async () => {
    if (!selectedDate || !descripcion.trim()) {
      toast.error("Seleccione una fecha y agregue una descripción");
      return;
    }

    setLoading(true);
    const fechaStr = format(selectedDate, "yyyy-MM-dd");

    const { error } = await supabase
      .from("dias_no_laborables")
      .insert([{ fecha: fechaStr, descripcion: descripcion.trim() }]);

    if (error) {
      toast.error("Error al agregar día no laborable");
    } else {
      toast.success("Día no laborable agregado");
      setDialogOpen(false);
      setDescripcion("");
      setSelectedDate(undefined);
      fetchDiasNoLaborables();
    }
    setLoading(false);
  };

  const handleDeleteDia = async (fecha: string) => {
    const { error } = await supabase
      .from("dias_no_laborables")
      .delete()
      .eq("fecha", fecha);

    if (error) {
      toast.error("Error al eliminar día no laborable");
    } else {
      toast.success("Día no laborable eliminado");
      fetchDiasNoLaborables();
    }
  };

  const diasNoLaborablesSet = new Set(
    diasNoLaborables.map((d) => d.fecha)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Días No Laborables</h3>
          <p className="text-sm text-muted-foreground">
            Gestione los días feriados y no laborables del sistema
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Día
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={{
              noLaborable: (date) => {
                const dateStr = format(date, "yyyy-MM-dd");
                return diasNoLaborablesSet.has(dateStr);
              },
            }}
            modifiersStyles={{
              noLaborable: {
                backgroundColor: "hsl(var(--destructive))",
                color: "hsl(var(--destructive-foreground))",
                fontWeight: "bold",
              },
            }}
            locale={es}
          />
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold">Días Registrados</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {diasNoLaborables.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay días no laborables registrados
              </p>
            ) : (
              diasNoLaborables.map((dia) => (
                <div
                  key={dia.fecha}
                  className="flex justify-between items-center p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {format(new Date(dia.fecha), "PPP", { locale: es })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {dia.descripcion}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteDia(dia.fecha)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Día No Laborable</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={es}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Navidad, Año Nuevo, etc."
                maxLength={200}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddDia} disabled={loading} className="flex-1">
                {loading ? "Guardando..." : "Guardar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setDescripcion("");
                  setSelectedDate(undefined);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
