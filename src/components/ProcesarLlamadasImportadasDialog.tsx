import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calendar } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { addDays, format } from "date-fns";

interface ProcesarLlamadasImportadasDialogProps {
  onSuccess: () => void;
}

export const ProcesarLlamadasImportadasDialog = ({ onSuccess }: ProcesarLlamadasImportadasDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ procesadas: number; reagendadas: number } | null>(null);

  const procesarLlamadas = async () => {
    setLoading(true);
    try {
      // Obtener todas las llamadas que tienen frecuencia en las notas
      const { data: llamadasConFrecuencia, error: fetchError } = await supabase
        .from("registro_llamadas")
        .select("*")
        .like("notas_adicionales", "%Frecuencia programada:%")
        .or("estado.eq.realizada,estado.eq.agendada");

      if (fetchError) throw fetchError;
      if (!llamadasConFrecuencia || llamadasConFrecuencia.length === 0) {
        toast.info("No se encontraron llamadas con frecuencia programada para procesar");
        return;
      }

      const llamadasNuevas: any[] = [];
      let procesadas = 0;

      for (const llamada of llamadasConFrecuencia) {
        // Extraer la frecuencia de las notas
        const match = llamada.notas_adicionales?.match(/Frecuencia programada: (\d+) días/);
        if (!match) continue;

        const frecuenciaDias = parseInt(match[1]);
        
        // Determinar la fecha base (última llamada realizada o agendada)
        let fechaBase = new Date();
        if (llamada.fecha_hora_realizada) {
          fechaBase = new Date(llamada.fecha_hora_realizada);
        } else if (llamada.fecha_agendada) {
          fechaBase = new Date(llamada.fecha_agendada);
        }

        // Calcular la próxima fecha
        const proximaFecha = addDays(fechaBase, frecuenciaDias);

        // Solo crear nueva llamada si es en el futuro o si es hoy y la llamada original fue realizada
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const proximaFechaSinHora = new Date(proximaFecha);
        proximaFechaSinHora.setHours(0, 0, 0, 0);

        if (proximaFechaSinHora >= hoy && llamada.estado === 'realizada') {
          llamadasNuevas.push({
            paciente_id: llamada.paciente_id,
            profesional_id: llamada.profesional_id,
            fecha_agendada: format(proximaFecha, "yyyy-MM-dd HH:mm:ss"),
            estado: "agendada",
            motivo: llamada.motivo?.replace(/Seguimiento - /i, '').replace(/Frecuencia:.+/, '').trim() || "Seguimiento",
            duracion_estimada: 15,
            notas_adicionales: `Reagendada automáticamente. ${llamada.notas_adicionales}`,
          });
          procesadas++;
        }
      }

      if (llamadasNuevas.length === 0) {
        toast.info("No se encontraron llamadas para reagendar");
        setStats({ procesadas: 0, reagendadas: 0 });
        return;
      }

      // Insertar las nuevas llamadas agendadas
      const { error: insertError } = await supabase
        .from("registro_llamadas")
        .insert(llamadasNuevas);

      if (insertError) throw insertError;

      setStats({ procesadas, reagendadas: llamadasNuevas.length });
      toast.success(`${llamadasNuevas.length} llamadas reagendadas exitosamente según su frecuencia`);
      onSuccess();
    } catch (error: any) {
      console.error("Error al procesar llamadas:", error);
      toast.error(error.message || "Error al procesar las llamadas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Procesar Llamadas Importadas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Procesar Llamadas Importadas</DialogTitle>
          <DialogDescription>
            Este proceso analizará todas las llamadas importadas que tengan una frecuencia programada y
            creará nuevas llamadas agendadas según esa frecuencia.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              ¿Qué hace este proceso?
            </h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Busca llamadas marcadas como "realizadas" con frecuencia programada</li>
              <li>Calcula la próxima fecha según la frecuencia indicada (ej: cada 30 días)</li>
              <li>Crea nuevas llamadas agendadas para esas fechas</li>
              <li>Asigna las llamadas al mismo paciente y profesional</li>
            </ul>
          </div>

          {stats && (
            <div className="bg-success/10 border border-success/20 p-4 rounded-lg">
              <p className="font-medium text-success">Proceso completado:</p>
              <ul className="text-sm text-success space-y-1 mt-2">
                <li>• {stats.procesadas} llamadas analizadas</li>
                <li>• {stats.reagendadas} nuevas llamadas agendadas creadas</li>
              </ul>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={procesarLlamadas} disabled={loading}>
              {loading ? "Procesando..." : "Procesar Llamadas"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
