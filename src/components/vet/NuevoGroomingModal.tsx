import { useState } from "react";
import { Mascota, GroomingServicio } from "./vet-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scissors, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface NuevoGroomingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mascotas: Mascota[];
  onGuardar: (nuevoServicio: GroomingServicio) => void;
}

const SERVICIOS_EXTRAS = [
  "Corte de uñas",
  "Limpieza de oídos",
  "Vaciado de glándulas anales",
  "Deslanado profundo",
  "Perfume hipoalergénico",
  "Cepillado dental preventivo",
];

export function NuevoGroomingModal({
  open,
  onOpenChange,
  mascotas,
  onGuardar,
}: NuevoGroomingModalProps) {
  const [pacienteId, setPacienteId] = useState(mascotas[0]?.paciente_id || "");
  const [tipoServicio, setTipoServicio] = useState<GroomingServicio["tipo_servicio"]>("bano_corte");
  const [estilista, setEstilista] = useState("Yomaira Santos (Estilista Canina)");
  const [temperamento, setTemperamento] = useState<GroomingServicio["temperamento"]>("docil");
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<string[]>([
    "Corte de uñas",
    "Limpieza de oídos",
  ]);
  const [fechaHora, setFechaHora] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [observaciones, setObservaciones] = useState("");

  const toggleExtra = (extra: string) => {
    if (serviciosSeleccionados.includes(extra)) {
      setServiciosSeleccionados(serviciosSeleccionados.filter(s => s !== extra));
    } else {
      setServiciosSeleccionados([...serviciosSeleccionados, extra]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mascota = mascotas.find(m => m.paciente_id === pacienteId) || mascotas[0];

    const nuevo: GroomingServicio = {
      id: `gr-${Date.now()}`,
      paciente_id: pacienteId,
      mascota_nombre: mascota ? `${mascota.nombre} (${mascota.raza})` : "Mascota",
      tipo_servicio: tipoServicio,
      estilista,
      temperamento,
      servicios_adicionales: serviciosSeleccionados,
      fecha_hora: fechaHora,
      estado: "espera",
      observaciones: observaciones.trim() || undefined,
    };

    onGuardar(nuevo);
    toast.success(`Cita de estética agendada para ${nuevo.mascota_nombre}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl border-border/80">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Scissors className="h-5 w-5 text-purple-600" />
            Agendar Servicio de Estética & Grooming
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
              <Label className="text-xs font-semibold">Tipo de Servicio *</Label>
              <Select value={tipoServicio} onValueChange={(v: any) => setTipoServicio(v)}>
                <SelectTrigger className="rounded-xl mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="bano_corte">Baño & Corte de Raza</SelectItem>
                  <SelectItem value="bano_medicado">Baño Medicado Dermatológico</SelectItem>
                  <SelectItem value="corte_higienico">Corte Higiénico</SelectItem>
                  <SelectItem value="deslanado">Deslanado & Cepillado</SelectItem>
                  <SelectItem value="spa_completo">Spa Canino/Felino Completo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Estilista Asignado</Label>
              <Input
                value={estilista}
                onChange={e => setEstilista(e.target.value)}
                className="rounded-xl mt-1 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Temperamento de la Mascota</Label>
              <Select value={temperamento} onValueChange={(v: any) => setTemperamento(v)}>
                <SelectTrigger className="rounded-xl mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="docil">Dócil & Tranquilo</SelectItem>
                  <SelectItem value="nervioso">Nervioso / Inquieto</SelectItem>
                  <SelectItem value="miedoso">Miedoso (Trato suave)</SelectItem>
                  <SelectItem value="reactivo">Reactivo (Requiere precaución)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold block mb-1.5">Servicios Adicionales Incluidos</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {SERVICIOS_EXTRAS.map(extra => {
                const isSelected = serviciosSeleccionados.includes(extra);
                return (
                  <button
                    key={extra}
                    type="button"
                    onClick={() => toggleExtra(extra)}
                    className={`text-left p-2 rounded-xl text-xs border transition-all ${
                      isSelected
                        ? "bg-primary/10 border-primary text-primary font-semibold"
                        : "bg-muted/30 border-border/70 text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    {isSelected ? "✓ " : "+ "} {extra}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Fecha y Hora de Cita</Label>
              <Input
                type="datetime-local"
                value={fechaHora}
                onChange={e => setFechaHora(e.target.value)}
                className="rounded-xl mt-1 text-xs font-mono"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Observaciones Especiales</Label>
              <Input
                placeholder="Nudos difíciles, verrugas, secado tibio..."
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                className="rounded-xl mt-1 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" className="rounded-xl text-xs" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="rounded-xl text-xs shadow-none">
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Agendar Servicio
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
