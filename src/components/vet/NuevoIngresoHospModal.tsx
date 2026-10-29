import { useState } from "react";
import { Mascota, HospitalizacionCirugia } from "./vet-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bed, HeartPulse, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface NuevoIngresoHospModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mascotas: Mascota[];
  onGuardar: (nuevoIngreso: HospitalizacionCirugia) => void;
}

export function NuevoIngresoHospModal({
  open,
  onOpenChange,
  mascotas,
  onGuardar,
}: NuevoIngresoHospModalProps) {
  const [pacienteId, setPacienteId] = useState(mascotas[0]?.paciente_id || "");
  const [tipoProcedimiento, setTipoProcedimiento] = useState<HospitalizacionCirugia["tipo_procedimiento"]>("cirugia");
  const [titulo, setTitulo] = useState("");
  const [jaulaBox, setJaulaBox] = useState("Box Quirófano 01");
  const [cirujano, setCirujano] = useState("Dr. Marcos Tavárez (Cirujano)");
  const [clasificacionAsa, setClasificacionAsa] = useState<HospitalizacionCirugia["clasificacion_asa"]>("ASA I");
  const [tipoAnestesia, setTipoAnestesia] = useState("Inhalatoria Isoflurano + Premedicación");
  const [fluidoterapia, setFluidoterapia] = useState("Ringer Lactato 30 ml/h");
  const [notasEvolucion, setNotasEvolucion] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      toast.error("Por favor ingrese el nombre del procedimiento o causa del ingreso");
      return;
    }
    const mascota = mascotas.find(m => m.paciente_id === pacienteId) || mascotas[0];

    const nuevo: HospitalizacionCirugia = {
      id: `hosp-${Date.now()}`,
      paciente_id: pacienteId,
      mascota_nombre: mascota ? `${mascota.nombre} (${mascota.raza})` : "Mascota",
      tipo_procedimiento: tipoProcedimiento,
      titulo: titulo.trim(),
      jaula_box: jaulaBox.trim(),
      fecha_ingreso: new Date().toISOString(),
      cirujano_veterinario: cirujano.trim(),
      clasificacion_asa: tipoProcedimiento === "cirugia" ? clasificacionAsa : undefined,
      tipo_anestesia: tipoProcedimiento === "cirugia" ? tipoAnestesia.trim() : undefined,
      fluidoterapia: fluidoterapia.trim() || undefined,
      estado: tipoProcedimiento === "cirugia" ? "pre-quirurgico" : "hospitalizado_estable",
      notas_evolucion: notasEvolucion.trim() || "Ingreso registrado. Signos vitales estables.",
    };

    onGuardar(nuevo);
    toast.success(`Ingreso registrado para ${nuevo.mascota_nombre}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border-border/80">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Bed className="h-5 w-5 text-purple-600" />
            Ingreso a Hospitalización o Quirófano
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
              <Label className="text-xs font-semibold">Tipo de Procedimiento *</Label>
              <Select value={tipoProcedimiento} onValueChange={(v: any) => setTipoProcedimiento(v)}>
                <SelectTrigger className="rounded-xl mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="cirugia">Cirugía Mayor / Menor</SelectItem>
                  <SelectItem value="hospitalizacion">Hospitalización / UCI</SelectItem>
                  <SelectItem value="procedimiento">Procedimiento / Curación</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Título / Cirugía Programada *</Label>
            <Input
              placeholder="Ej: Ovariohisterectomía, Sondaje FLUTD, Profilaxis dental..."
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              className="rounded-xl mt-1 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Jaula / Box de Internamiento</Label>
              <Input
                value={jaulaBox}
                onChange={e => setJaulaBox(e.target.value)}
                className="rounded-xl mt-1 text-xs font-mono"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Veterinario / Cirujano</Label>
              <Input
                value={cirujano}
                onChange={e => setCirujano(e.target.value)}
                className="rounded-xl mt-1 text-xs"
              />
            </div>
          </div>

          {tipoProcedimiento === "cirugia" && (
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/70 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Evaluación Pre-Quirúrgica
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Riesgo ASA</Label>
                  <Select value={clasificacionAsa} onValueChange={(v: any) => setClasificacionAsa(v)}>
                    <SelectTrigger className="rounded-xl mt-0.5 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="ASA I">ASA I (Paciente sano)</SelectItem>
                      <SelectItem value="ASA II">ASA II (Enfermedad sistémica leve)</SelectItem>
                      <SelectItem value="ASA III">ASA III (Enfermedad sistémica severa)</SelectItem>
                      <SelectItem value="ASA IV">ASA IV (Amenaza constante para la vida)</SelectItem>
                      <SelectItem value="ASA V">ASA V (Moribundo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[11px] text-muted-foreground">Protocolo Anestésico</Label>
                  <Input
                    value={tipoAnestesia}
                    onChange={e => setTipoAnestesia(e.target.value)}
                    className="rounded-xl mt-0.5 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold">Fluidoterapia / Velocidad</Label>
            <Input
              placeholder="Ej: Ringer Lactato 40 ml/h"
              value={fluidoterapia}
              onChange={e => setFluidoterapia(e.target.value)}
              className="rounded-xl mt-1 text-xs font-mono"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Órdenes Médicas / Cuidados Iniciales</Label>
            <Textarea
              placeholder="Monitoreo de micción, analgesia pautada, control de apósito..."
              value={notasEvolucion}
              onChange={e => setNotasEvolucion(e.target.value)}
              className="rounded-xl mt-1 text-xs min-h-[60px]"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" className="rounded-xl text-xs" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="rounded-xl text-xs shadow-none">
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Registrar Ingreso
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
