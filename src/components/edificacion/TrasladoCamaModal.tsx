import { useState } from "react";
import { CamaHospital } from "./edificacion-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeftRight, CheckCircle2, Bed } from "lucide-react";
import { toast } from "sonner";

interface TrasladoCamaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  camaOrigen: CamaHospital | null;
  camasDisponibles: CamaHospital[];
  onConfirmarTraslado: (camaOrigenId: string, camaDestinoId: string, motivo: string) => void;
}

export function TrasladoCamaModal({
  open,
  onOpenChange,
  camaOrigen,
  camasDisponibles,
  onConfirmarTraslado,
}: TrasladoCamaModalProps) {
  const [camaDestinoId, setCamaDestinoId] = useState(camasDisponibles[0]?.id || "");
  const [motivo, setMotivo] = useState("Pase a cuidados intensivos / Requerimiento de aislamiento");

  if (!camaOrigen || !camaOrigen.paciente) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!camaDestinoId) {
      toast.error("Seleccione la cama de destino");
      return;
    }
    onConfirmarTraslado(camaOrigen.id, camaDestinoId, motivo.trim());
    toast.success(`Paciente ${camaOrigen.paciente?.nombre} trasladado con éxito.`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-border/80">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            Traslado Intrahospitalario de Paciente
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Cambio de cama y ala asistencial con actualización automática del censo hospitalario
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="p-3 rounded-xl bg-muted/30 border border-border/60 text-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              Paciente a Trasladar
            </span>
            <p className="font-bold text-foreground text-sm">{camaOrigen.paciente.nombre}</p>
            <p className="text-muted-foreground">
              Ubicación Actual: <strong className="text-foreground">{camaOrigen.codigo}</strong>
            </p>
            <p className="text-muted-foreground">
              Diagnóstico: {camaOrigen.paciente.diagnostico}
            </p>
          </div>

          <div>
            <Label className="text-xs font-semibold">Cama / Habitación de Destino (Disponibles)</Label>
            <Select value={camaDestinoId} onValueChange={setCamaDestinoId}>
              <SelectTrigger className="rounded-xl mt-1 text-xs">
                <SelectValue placeholder="Seleccionar cama libre..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {camasDisponibles.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.codigo} ({c.tipoCama.replace("_", " ")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold">Justificación / Motivo del Traslado</Label>
            <Input
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              className="rounded-xl mt-1 text-xs"
              placeholder="Evolución clínica, requerimiento de UCI, aislamiento..."
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" className="rounded-xl text-xs" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="rounded-xl text-xs shadow-none gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Confirmar Traslado
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
