import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer } from "lucide-react";

export interface LiquidacionHonorarioData {
  id: string;
  codigo_liquidacion: string;
  fecha_generada: string;
  fecha_pago?: string;
  medico_id?: string;
  medico_nombre: string;
  especialidad: string;
  exequatur: string;
  rnc_cedula: string;
  tipo_acto: string;
  descripcion_acto: string;
  paciente_nombre: string;
  aseguradora: string;
  monto_bruto: number;
  porcentaje_medico: number;
  honorario_bruto_medico: number;
  retencion_isr_pct: number;
  retencion_isr_monto: number;
  monto_neto_medico: number;
  estado: "pendiente" | "aprobada" | "pagada" | "anulada";
  banco_destino?: string;
  referencia_bancaria?: string;
  glosa_motivo?: string;
}

export interface VolanteLiquidacionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLiq: LiquidacionHonorarioData | null;
  formatDOP: (val: number) => string;
}

export function VolanteLiquidacionModal({
  open,
  onOpenChange,
  selectedLiq,
  formatDOP
}: VolanteLiquidacionModalProps) {
  if (!selectedLiq) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Printer className="w-5 h-5 text-emerald-600" /> Volante de Liquidación & Constancia de Retención Fiscal
          </DialogTitle>
          <DialogDescription>
            Documento tributario válido para fines de justificación de honorarios médicos y retención del 10% ISR (DGII).
          </DialogDescription>
        </DialogHeader>

        <div id="print-voucher-area" className="p-4 bg-white text-neutral-900 rounded-xl space-y-4 border border-neutral-200">
          {/* Membrete Oficial */}
          <div className="border-b pb-3 flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-neutral-950">
                CENTRO MÉDICO HOSPITALARIO VITALIST TRACK
              </h2>
              <p className="text-xs text-neutral-600">
                Av. 27 de Febrero esq. Tiradentes, Santo Domingo, D.N. · RNC: 1-31-89241-8
              </p>
              <p className="text-xs text-neutral-500 font-mono">
                Habilitación MISPAS No. 042-SNS-2024 · Tel: (809) 555-0199
              </p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="text-xs font-bold border-neutral-800 text-neutral-900">
                {selectedLiq.codigo_liquidacion}
              </Badge>
              <p className="text-[11px] text-neutral-500 mt-1">Fecha: {selectedLiq.fecha_generada}</p>
            </div>
          </div>

          {/* Datos del Facultativo */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-neutral-50 p-3 rounded-lg border border-neutral-200">
            <div>
              <span className="font-semibold text-neutral-700">Médico Especialista:</span>
              <p className="font-bold text-neutral-900">{selectedLiq.medico_nombre}</p>
            </div>
            <div>
              <span className="font-semibold text-neutral-700">Especialidad:</span>
              <p className="text-neutral-900">{selectedLiq.especialidad}</p>
            </div>
            <div>
              <span className="font-semibold text-neutral-700">Exequátur de Ley:</span>
              <p className="font-mono text-neutral-900">{selectedLiq.exequatur}</p>
            </div>
            <div>
              <span className="font-semibold text-neutral-700">Cédula / RNC:</span>
              <p className="font-mono text-neutral-900">{selectedLiq.rnc_cedula}</p>
            </div>
          </div>

          {/* Detalle del Acto Médico */}
          <div>
            <h4 className="text-xs font-bold uppercase text-neutral-700 mb-1.5">Desglose de Servicios Médicos</h4>
            <div className="border border-neutral-200 rounded-lg overflow-hidden text-xs">
              <div className="grid grid-cols-12 bg-neutral-100 p-2 font-semibold text-neutral-800">
                <span className="col-span-6">Concepto / Procedimiento</span>
                <span className="col-span-3">Paciente / ARS</span>
                <span className="col-span-3 text-right">Monto Bruto</span>
              </div>
              <div className="grid grid-cols-12 p-2.5 border-t border-neutral-200 text-neutral-800 items-center">
                <span className="col-span-6 font-medium">
                  {selectedLiq.descripcion_acto}
                  <span className="block text-[10px] text-neutral-500 font-normal">
                    Tipo de Acto: {selectedLiq.tipo_acto}
                  </span>
                </span>
                <span className="col-span-3 text-[11px]">
                  {selectedLiq.paciente_nombre}
                  <span className="block text-neutral-500">{selectedLiq.aseguradora}</span>
                </span>
                <span className="col-span-3 text-right font-semibold">
                  {formatDOP(selectedLiq.monto_bruto)}
                </span>
              </div>
            </div>
          </div>

          {/* Liquidación Financiera & Retención DGII */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-[11px] text-neutral-600 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 space-y-1">
              <div className="font-bold text-neutral-800 mb-1">Constancia de Retención Fiscal (DGII)</div>
              <p>
                Se ha retenido el <strong>{selectedLiq.retencion_isr_pct}% por concepto de ISR</strong> de conformidad con el Art. 309 del Código Tributario de la República Dominicana (Ley 11-92) sobre honorarios profesionales independientes.
              </p>
              <p className="font-mono text-[10px] text-neutral-500 mt-1">
                Comprobante fiscal de retención reportado en Formulario IR-17 DGII.
              </p>
            </div>

            <div className="space-y-1 text-xs border border-neutral-200 p-2.5 rounded-lg bg-neutral-50/50">
              <div className="flex justify-between text-neutral-700">
                <span>Monto Bruto Total:</span>
                <span>{formatDOP(selectedLiq.monto_bruto)}</span>
              </div>
              <div className="flex justify-between text-neutral-700">
                <span>Split Clínico ({selectedLiq.porcentaje_medico}%):</span>
                <span>{formatDOP(selectedLiq.honorario_bruto_medico)}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-medium">
                <span>(-) Retención ISR 10%:</span>
                <span>-{formatDOP(selectedLiq.retencion_isr_monto)}</span>
              </div>
              <hr className="border-neutral-300 my-1" />
              <div className="flex justify-between font-bold text-sm text-neutral-950">
                <span>NETO A LIQUIDAR:</span>
                <span>{formatDOP(selectedLiq.monto_neto_medico)}</span>
              </div>
            </div>
          </div>

          {/* Firmas de Conformidad */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="border-t border-neutral-300 pt-2">
              <p className="font-semibold text-neutral-800">Lic. Auditoría Médica / Tesorería</p>
              <p className="text-[10px] text-neutral-500">Dirección Financiera Hospitalaria</p>
            </div>
            <div className="border-t border-neutral-300 pt-2">
              <p className="font-semibold text-neutral-800">{selectedLiq.medico_nombre}</p>
              <p className="text-[10px] text-neutral-500">Recibido Conforme · Exeq. {selectedLiq.exequatur}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button
            onClick={() => window.print()}
            className="bg-neutral-900 text-white hover:bg-neutral-800 gap-1.5"
          >
            <Printer className="w-4 h-4" /> Imprimir Volante
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
