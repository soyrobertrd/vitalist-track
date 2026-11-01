import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

export interface NuevoHonorarioFormData {
  medico_id: string;
  medico_nombre: string;
  especialidad: string;
  exequatur: string;
  rnc_cedula: string;
  tipo_acto: string;
  descripcion_acto: string;
  paciente_nombre: string;
  aseguradora: string;
  cobertura_ars: number;
  copago_paciente: number;
  porcentaje_medico: number;
  banco_destino: string;
}

export interface NuevoHonorarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: NuevoHonorarioFormData;
  setForm: (form: NuevoHonorarioFormData) => void;
  formatDOP: (val: number) => string;
  onSubmit: () => void;
}

export function NuevoHonorarioSplitModal({
  open,
  onOpenChange,
  form,
  setForm,
  formatDOP,
  onSubmit
}: NuevoHonorarioModalProps) {
  const montoTotal = form.cobertura_ars + form.copago_paciente;
  const honorarioBruto = (montoTotal * form.porcentaje_medico) / 100;
  const retencionISR = honorarioBruto * 0.1;
  const netoMedico = honorarioBruto * 0.9;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Plus className="w-5 h-5 text-emerald-600" /> Registrar Liquidación de Honorario Médico
          </DialogTitle>
          <DialogDescription>
            Cálculo de honorarios por acto clínico, retención del 10% ISR DGII (Art. 309) y split de clínica.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs">Nombre Completo del Médico Especialista *</Label>
            <Input
              placeholder="Ej. Dr. Carlos Fernández"
              value={form.medico_nombre}
              onChange={(e) => setForm({ ...form, medico_nombre: e.target.value })}
              className="border-border/80 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Especialidad Médica *</Label>
            <Select
              value={form.especialidad}
              onValueChange={(v) => setForm({ ...form, especialidad: v })}
            >
              <SelectTrigger className="border-border/80 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cardiología">Cardiología</SelectItem>
                <SelectItem value="Pediatría">Pediatría</SelectItem>
                <SelectItem value="Diabetes & Endocrinología">Diabetes & Endocrinología</SelectItem>
                <SelectItem value="Cirugía General">Cirugía General</SelectItem>
                <SelectItem value="Ginecología & Obstetricia">Ginecología & Obstetricia</SelectItem>
                <SelectItem value="Ortopedia & Traumatología">Ortopedia & Traumatología</SelectItem>
                <SelectItem value="Medicina Interna">Medicina Interna</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Exequátur MISPAS</Label>
            <Input
              placeholder="Ej. 14209-20"
              value={form.exequatur}
              onChange={(e) => setForm({ ...form, exequatur: e.target.value })}
              className="border-border/80 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">RNC o Cédula Profesional</Label>
            <Input
              placeholder="Ej. 001-1829401-2"
              value={form.rnc_cedula}
              onChange={(e) => setForm({ ...form, rnc_cedula: e.target.value })}
              className="border-border/80 text-xs"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs">Tipo de Acto / Procedimiento *</Label>
            <Input
              placeholder="Ej. Consulta cardiológica + ECG de 12 derivaciones"
              value={form.descripcion_acto}
              onChange={(e) => setForm({ ...form, descripcion_acto: e.target.value })}
              className="border-border/80 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Paciente</Label>
            <Input
              placeholder="Nombre del paciente"
              value={form.paciente_nombre}
              onChange={(e) => setForm({ ...form, paciente_nombre: e.target.value })}
              className="border-border/80 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Aseguradora (ARS)</Label>
            <Select
              value={form.aseguradora}
              onValueChange={(v) => setForm({ ...form, aseguradora: v })}
            >
              <SelectTrigger className="border-border/80 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS Primera">ARS Primera</SelectItem>
                <SelectItem value="SeNaSa Contributivo">SeNaSa Contributivo</SelectItem>
                <SelectItem value="Mapfre Salud ARS">Mapfre Salud ARS</SelectItem>
                <SelectItem value="Humano Seguros">Humano Seguros</SelectItem>
                <SelectItem value="Privado / Particular">Privado / Particular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Cobertura ARS (DOP$)</Label>
            <Input
              type="number"
              value={form.cobertura_ars}
              onChange={(e) => setForm({ ...form, cobertura_ars: Number(e.target.value) })}
              className="border-border/80 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Copago Paciente (DOP$)</Label>
            <Input
              type="number"
              value={form.copago_paciente}
              onChange={(e) => setForm({ ...form, copago_paciente: Number(e.target.value) })}
              className="border-border/80 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">% Split para el Médico</Label>
            <Select
              value={String(form.porcentaje_medico)}
              onValueChange={(v) => setForm({ ...form, porcentaje_medico: Number(v) })}
            >
              <SelectTrigger className="border-border/80 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="80">80% Médico / 20% Clínica</SelectItem>
                <SelectItem value="75">75% Médico / 25% Clínica</SelectItem>
                <SelectItem value="70">70% Médico / 30% Clínica</SelectItem>
                <SelectItem value="65">65% Médico / 35% Clínica</SelectItem>
                <SelectItem value="60">60% Médico / 40% Clínica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Banco & Cuenta Destino</Label>
            <Input
              placeholder="Banco Popular · Cuenta Corriente"
              value={form.banco_destino}
              onChange={(e) => setForm({ ...form, banco_destino: e.target.value })}
              className="border-border/80 text-xs"
            />
          </div>
        </div>

        {/* Resumen del cálculo en vivo */}
        <div className="bg-muted/40 p-3 rounded-xl border border-border/80 space-y-1.5 text-xs">
          <div className="font-semibold text-foreground flex justify-between">
            <span>Monto Total Facturado:</span>
            <span className="font-mono">{formatDOP(montoTotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Honorario Bruto Médico ({form.porcentaje_medico}%):</span>
            <span className="font-mono">{formatDOP(honorarioBruto)}</span>
          </div>
          <div className="flex justify-between text-rose-600">
            <span>Retención Fiscal 10% ISR DGII (Art. 309):</span>
            <span className="font-mono">-{formatDOP(retencionISR)}</span>
          </div>
          <hr className="border-border/80 my-1" />
          <div className="flex justify-between font-bold text-emerald-700 dark:text-emerald-400 text-sm">
            <span>Neto a Percibir por el Médico:</span>
            <span className="font-mono">{formatDOP(netoMedico)}</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={onSubmit}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Guardar & Enviar a Auditoría
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
