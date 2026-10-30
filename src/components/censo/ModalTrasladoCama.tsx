import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRightLeft } from "lucide-react";
import type { CamaDetalle } from "./types";

export interface CamaLibreOption {
  id: string;
  nombre: string;
  tipo: string;
  piso_numero: number;
  habitacion_codigo: string;
}

interface ModalTrasladoCamaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cama: CamaDetalle | null;
  camasLibres: CamaLibreOption[];
  destinoCamaId: string;
  setDestinoCamaId: (id: string) => void;
  motivo: string;
  setMotivo: (motivo: string) => void;
  onConfirmar: () => void;
}

export function ModalTrasladoCama({
  open,
  onOpenChange,
  cama,
  camasLibres,
  destinoCamaId,
  setDestinoCamaId,
  motivo,
  setMotivo,
  onConfirmar,
}: ModalTrasladoCamaProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ArrowRightLeft className="w-5 h-5 text-primary" /> Traslado Hospitalario de Paciente
          </DialogTitle>
          <DialogDescription>
            Trasladar a {cama?.paciente?.nombre} desde {cama?.codigo_cama}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="p-2.5 bg-muted/40 rounded-xl border border-border/80 space-y-1">
            <div className="font-semibold text-foreground">
              Paciente: {cama?.paciente?.nombre}
            </div>
            <div className="text-muted-foreground text-[11px]">
              Diagnóstico: {cama?.paciente?.diagnostico_cie10}
            </div>
            <div className="text-[11px] text-amber-700 dark:text-amber-400">
              Nota: La cama de origen ({cama?.codigo_cama}) pasará a limpieza terminal tras el traslado.
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Cama de Destino Disponible *</Label>
            <Select value={destinoCamaId} onValueChange={setDestinoCamaId}>
              <SelectTrigger className="rounded-xl border-border/80 text-xs">
                <SelectValue placeholder="Seleccione cama libre..." />
              </SelectTrigger>
              <SelectContent>
                {camasLibres.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No hay camas disponibles
                  </SelectItem>
                ) : (
                  camasLibres.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      Piso {c.piso_numero} · {c.habitacion_codigo} — {c.nombre} ({c.tipo})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Motivo del Traslado</Label>
            <Textarea
              placeholder="Ej. Traslado a UCI por deterioro hemodinámico, o pase a sala común por mejoría..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="rounded-xl border-border/80 text-xs"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancelar
          </Button>
          <Button
            onClick={onConfirmar}
            disabled={!destinoCamaId}
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Ejecutar Traslado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
