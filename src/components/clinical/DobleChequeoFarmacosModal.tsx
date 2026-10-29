import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldAlert, CheckCircle2, UserCheck, AlertTriangle, Lock } from "lucide-react";
import { toast } from "sonner";

export interface DatosDobleChequeo {
  farmaco: string;
  concentracion: string;
  velocidadMlHora: number;
  dosisCalculada: string;
  paciente: string;
  enfermero1: string;
  enfermero2: string;
  codigoTestigo: string;
}

interface DobleChequeoFarmacosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmaco: string;
  concentracion: string;
  velocidadActual: number;
  pacienteNombre: string;
  onConfirmarChequeo: (datos: DatosDobleChequeo) => void;
}

export function DobleChequeoFarmacosModal({
  open,
  onOpenChange,
  farmaco,
  concentracion,
  velocidadActual,
  pacienteNombre,
  onConfirmarChequeo,
}: DobleChequeoFarmacosModalProps) {
  const [nuevaVelocidad, setNuevaVelocidad] = useState<number>(velocidadActual);
  const [dosisTexto, setDosisTexto] = useState("0.15 mcg/kg/min");
  const [enfermero1, setEnfermero1] = useState("Lic. Laura Peña (Enf. Preparador)");
  const [enfermero2, setEnfermero2] = useState("Lic. Marcos Tavárez (Enf. Testigo)");
  const [codigoTestigo, setCodigoTestigo] = useState("");

  const [verificoPaciente, setVerificoPaciente] = useState(false);
  const [verificoFarmacoDosis, setVerificoFarmacoDosis] = useState(false);
  const [verificoLeyoBomba, setVerificoLeyoBomba] = useState(false);

  const todoVerificado =
    verificoPaciente &&
    verificoFarmacoDosis &&
    verificoLeyoBomba &&
    codigoTestigo.trim().length >= 4;

  const handleConfirmar = () => {
    if (!todoVerificado) {
      toast.error("Debe completar todos los chequeos de seguridad y el código del segundo enfermero.");
      return;
    }

    onConfirmarChequeo({
      farmaco,
      concentracion,
      velocidadMlHora: nuevaVelocidad,
      dosisCalculada: dosisTexto,
      paciente: pacienteNombre,
      enfermero1,
      enfermero2,
      codigoTestigo,
    });

    toast.success("Doble chequeo validado con éxito. Bomba programada con certificación cruzada.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="gap-1 text-[11px] font-bold">
              <ShieldAlert className="h-3.5 w-3.5" /> Medicación de Alto Riesgo (ISMP)
            </Badge>
          </div>
          <DialogTitle className="text-base font-bold text-foreground mt-2">
            Doble Chequeo Independiente de Seguridad
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Protocolo obligatorio de dos enfermeros calificados previo a la infusión o modificación de bomba.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Tarjeta del Paciente y Fármaco */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paciente:</span>
              <strong className="text-foreground">{pacienteNombre}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fármaco:</span>
              <strong className="text-red-600 dark:text-red-400 font-semibold">{farmaco}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Concentración:</span>
              <span className="font-mono">{concentracion}</span>
            </div>
          </div>

          {/* Ajuste de Bomba */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px]">Velocidad Bomba (mL/h)</Label>
              <Input
                type="number"
                step="0.1"
                value={nuevaVelocidad}
                onChange={e => setNuevaVelocidad(parseFloat(e.target.value) || 0)}
                className="h-8 text-xs font-mono font-bold rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-[11px]">Dosis Calculada</Label>
              <Input
                value={dosisTexto}
                onChange={e => setDosisTexto(e.target.value)}
                className="h-8 text-xs font-mono rounded-xl mt-1"
              />
            </div>
          </div>

          {/* Checklist de Doble Chequeo Independiente */}
          <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-2">
            <span className="font-bold text-amber-900 dark:text-amber-300 block">
              Verificaciones de Seguridad Obligatorias:
            </span>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="c1"
                checked={verificoPaciente}
                onCheckedChange={c => setVerificoPaciente(!!c)}
              />
              <label htmlFor="c1" className="text-[11px] leading-tight cursor-pointer">
                1. Identidad del paciente confirmada con pulsera y dos identificadores.
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="c2"
                checked={verificoFarmacoDosis}
                onCheckedChange={c => setVerificoFarmacoDosis(!!c)}
              />
              <label htmlFor="c2" className="text-[11px] leading-tight cursor-pointer">
                2. Fármaco, dilución y cálculo matemático recalculado de forma independiente.
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="c3"
                checked={verificoLeyoBomba}
                onCheckedChange={c => setVerificoLeyoBomba(!!c)}
              />
              <label htmlFor="c3" className="text-[11px] leading-tight cursor-pointer">
                3. Pantalla de la bomba de infusión y canal de vía central verificados físicamente.
              </label>
            </div>
          </div>

          {/* Testigo de Segundo Enfermero */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border/80 space-y-2">
            <div className="flex items-center gap-1.5 text-foreground font-semibold">
              <UserCheck className="h-4 w-4 text-primary" />
              Firmas de Acreditación Cruzada
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-muted-foreground block">Enfermero Preparador:</span>
                <span className="font-bold">{enfermero1}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Segundo Enfermero (Testigo):</span>
                <span className="font-bold">{enfermero2}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60">
              <Label className="text-[10px] text-muted-foreground">
                PIN / Código de Acreditación del Testigo (min 4 dígitos):
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="password"
                  maxLength={6}
                  placeholder="PIN testigo (ej. 4821)"
                  value={codigoTestigo}
                  onChange={e => setCodigoTestigo(e.target.value)}
                  className="h-8 text-xs font-mono rounded-xl w-44"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-xl text-xs">
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleConfirmar}
            disabled={!todoVerificado}
            className="rounded-xl text-xs bg-red-600 hover:bg-red-700 text-white gap-1.5"
          >
            <CheckCircle2 className="h-4 w-4" />
            Certificar Doble Chequeo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
