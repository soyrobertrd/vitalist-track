import { useState, useEffect } from "react";
import { Mascota, ConsultaVeterinaria } from "./vet-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stethoscope, Thermometer, HeartPulse, Activity, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface NuevaConsultaVetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mascotas: Mascota[];
  mascotaPreseleccionada?: Mascota | null;
  onGuardar: (nuevaConsulta: ConsultaVeterinaria) => void;
}

export function NuevaConsultaVetModal({
  open,
  onOpenChange,
  mascotas,
  mascotaPreseleccionada,
  onGuardar,
}: NuevaConsultaVetModalProps) {
  const [pacienteId, setPacienteId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [veterinario, setVeterinario] = useState("Dra. Carolina Méndez (MVZ)");
  const [pesoKg, setPesoKg] = useState("10");
  const [temperaturaC, setTemperaturaC] = useState("38.5");
  const [fc, setFc] = useState("100");
  const [fr, setFr] = useState("24");
  const [tllc, setTllc] = useState("1.5");
  const [mucosas, setMucosas] = useState<ConsultaVeterinaria["mucosas"]>("rosadas");
  const [condicionCorporal, setCondicionCorporal] = useState("3/5 - Condición Óptima");
  const [hidratacion, setHidratacion] = useState("Normohidratado <5%");
  const [anamnesis, setAnamnesis] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [tratamientoReceta, setTratamientoReceta] = useState("");

  useEffect(() => {
    if (mascotaPreseleccionada) {
      setPacienteId(mascotaPreseleccionada.paciente_id);
      if (mascotaPreseleccionada.peso_kg) setPesoKg(String(mascotaPreseleccionada.peso_kg));
    } else if (mascotas.length > 0 && !pacienteId) {
      setPacienteId(mascotas[0].paciente_id);
      if (mascotas[0].peso_kg) setPesoKg(String(mascotas[0].peso_kg));
    }
  }, [mascotaPreseleccionada, mascotas]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mascota = mascotas.find(m => m.paciente_id === pacienteId) || mascotas[0];
    if (!motivo.trim() || !diagnostico.trim()) {
      toast.error("Por favor complete el motivo de consulta y el diagnóstico");
      return;
    }

    const nueva: ConsultaVeterinaria = {
      id: `cons-${Date.now()}`,
      paciente_id: pacienteId,
      mascota_nombre: mascota ? mascota.nombre : "Mascota",
      especie: mascota ? mascota.especie : "perro",
      fecha: new Date().toISOString(),
      veterinario,
      motivo: motivo.trim(),
      peso_kg: Number(pesoKg) || 10,
      temperatura_c: Number(temperaturaC) || 38.5,
      frecuencia_cardiaca_lpm: Number(fc) || 100,
      frecuencia_respiratoria_rpm: Number(fr) || 24,
      tllc_segundos: Number(tllc) || 1.5,
      mucosas,
      condicion_corporal: condicionCorporal,
      hidratacion,
      anamnesis: anamnesis.trim(),
      diagnostico: diagnostico.trim(),
      tratamiento_receta: tratamientoReceta.trim(),
      estado: "completada",
    };

    onGuardar(nueva);
    toast.success(`Consulta registrada para ${nueva.mascota_nombre}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-border/80">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-emerald-600" />
            Nueva Consulta Médica Veterinaria
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Mascota Paciente *</Label>
              <Select value={pacienteId} onValueChange={setPacienteId}>
                <SelectTrigger className="rounded-xl mt-1 text-xs">
                  <SelectValue placeholder="Seleccionar mascota..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {mascotas.map(m => (
                    <SelectItem key={m.paciente_id} value={m.paciente_id}>
                      {m.nombre} ({m.especie} - {m.tutor_nombre})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Veterinario Tratante *</Label>
              <Input
                value={veterinario}
                onChange={e => setVeterinario(e.target.value)}
                className="rounded-xl mt-1 text-xs"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Motivo de Consulta *</Label>
            <Input
              placeholder="Ej: Cojera miembro anterior, control post-quirúrgico, vómitos agudos..."
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              className="rounded-xl mt-1 text-xs"
            />
          </div>

          {/* Panel Constantes Fisiológicas */}
          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/70 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Constantes Fisiológicas & Exploración
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <Label className="text-[11px] text-muted-foreground">Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={pesoKg}
                  onChange={e => setPesoKg(e.target.value)}
                  className="rounded-xl mt-0.5 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <Label className="text-[11px] text-muted-foreground">T° Rectal (°C)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={temperaturaC}
                  onChange={e => setTemperaturaC(e.target.value)}
                  className="rounded-xl mt-0.5 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <Label className="text-[11px] text-muted-foreground">F. Cardíaca (lpm)</Label>
                <Input
                  type="number"
                  value={fc}
                  onChange={e => setFc(e.target.value)}
                  className="rounded-xl mt-0.5 text-xs font-mono"
                />
              </div>

              <div>
                <Label className="text-[11px] text-muted-foreground">F. Resp. (rpm)</Label>
                <Input
                  type="number"
                  value={fr}
                  onChange={e => setFr(e.target.value)}
                  className="rounded-xl mt-0.5 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <Label className="text-[11px] text-muted-foreground">TLLC (&lt;2 seg)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={tllc}
                  onChange={e => setTllc(e.target.value)}
                  className="rounded-xl mt-0.5 text-xs font-mono"
                />
              </div>

              <div>
                <Label className="text-[11px] text-muted-foreground">Mucosas</Label>
                <Select value={mucosas} onValueChange={(v: any) => setMucosas(v)}>
                  <SelectTrigger className="rounded-xl mt-0.5 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="rosadas">Rosadas (Normal)</SelectItem>
                    <SelectItem value="palidas">Pálidas (Anemia / Shock)</SelectItem>
                    <SelectItem value="ictericas">Ictéricas (Hepático)</SelectItem>
                    <SelectItem value="cianoticas">Cianóticas (Hipoxia)</SelectItem>
                    <SelectItem value="congestivas">Congestivas (Séptico)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[11px] text-muted-foreground">Hidratación</Label>
                <Select value={hidratacion} onValueChange={setHidratacion}>
                  <SelectTrigger className="rounded-xl mt-0.5 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Normohidratado <5%">Normohidratado (&lt;5%)</SelectItem>
                    <SelectItem value="Deshidratación Leve (5-6%)">Deshidratación Leve (5-6%)</SelectItem>
                    <SelectItem value="Deshidratación Moderada (7-8%)">Deshidratación Moderada (7-8%)</SelectItem>
                    <SelectItem value="Deshidratación Severa (>10%)">Deshidratación Severa (&gt;10%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Anamnesis & Hallazgos Físicos</Label>
            <Textarea
              placeholder="Signos clínicos reportados por el tutor, apetito, micción, defecación, palpación abdominal..."
              value={anamnesis}
              onChange={e => setAnamnesis(e.target.value)}
              className="rounded-xl mt-1 text-xs min-h-[60px]"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Diagnóstico Definitivo / Juicio Clínico *</Label>
            <Input
              placeholder="Ej: Gastroenteritis aguda bacteriana, Gingivoestomatitis felina, etc."
              value={diagnostico}
              onChange={e => setDiagnostico(e.target.value)}
              className="rounded-xl mt-1 text-xs"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Plan Terapéutico & Receta Médica</Label>
            <Textarea
              placeholder="Fármacos prescritos, posología (mg/kg o ml), frecuencia, vía y fecha de control..."
              value={tratamientoReceta}
              onChange={e => setTratamientoReceta(e.target.value)}
              className="rounded-xl mt-1 text-xs min-h-[70px] font-mono"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" className="rounded-xl text-xs" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="rounded-xl text-xs shadow-none">
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Guardar Consulta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
