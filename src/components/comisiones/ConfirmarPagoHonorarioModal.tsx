import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard } from "lucide-react";
import { LiquidacionHonorarioData } from "./VolanteLiquidacionModal";

export interface ConfirmarPagoHonorarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLiq: LiquidacionHonorarioData | null;
  pagoForm: {
    metodo_pago: string;
    banco: string;
    referencia: string;
  };
  setPagoForm: (form: { metodo_pago: string; banco: string; referencia: string }) => void;
  formatDOP: (val: number) => string;
  onConfirmar: () => void;
}

export function ConfirmarPagoHonorarioModal({
  open,
  onOpenChange,
  selectedLiq,
  pagoForm,
  setPagoForm,
  formatDOP,
  onConfirmar
}: ConfirmarPagoHonorarioModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CreditCard className="w-5 h-5 text-emerald-600" /> Liquidar Pago de Honorarios
          </DialogTitle>
          <DialogDescription>
            Emisión de pago bancario para {selectedLiq?.medico_nombre} ({selectedLiq?.codigo_liquidacion}).
          </DialogDescription>
        </DialogHeader>

        {selectedLiq && (
          <div className="space-y-3 py-2 text-xs">
            <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
              <div className="text-muted-foreground">Monto Neto a Transferir:</div>
              <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                {formatDOP(selectedLiq.monto_neto_medico)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                Retención ISR DGII aplicada: {formatDOP(selectedLiq.retencion_isr_monto)} (10%)
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Método de Desembolso</Label>
              <Select
                value={pagoForm.metodo_pago}
                onValueChange={(v) => setPagoForm({ ...pagoForm, metodo_pago: v })}
              >
                <SelectTrigger className="border-border/80 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Transferencia ACH">Transferencia ACH Interbancaria</SelectItem>
                  <SelectItem value="Cheque de Gerencia">Cheque de Gerencia / Administración</SelectItem>
                  <SelectItem value="Crédito en Cuenta">Crédito en Cuenta Directa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Banco Emisor / Destino</Label>
              <Input
                value={pagoForm.banco}
                onChange={(e) => setPagoForm({ ...pagoForm, banco: e.target.value })}
                className="border-border/80 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">No. de Referencia / Lote ACH *</Label>
              <Input
                placeholder="Ej. ACH-98214-2026"
                value={pagoForm.referencia}
                onChange={(e) => setPagoForm({ ...pagoForm, referencia: e.target.value })}
                className="border-border/80 text-xs font-mono"
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirmar}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Confirmar & Marcar como Pagado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
