import { useState, useEffect } from "react";
import { Mascota, RegistroVacunaDesparasitacion } from "./vet-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Syringe, ShieldCheck, Bug, CheckCircle2 } from "lucide-react";
import { format, addMonths, addYears } from "date-fns";
import { toast } from "sonner";

interface NuevaVacunaVetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mascotas: Mascota[];
  mascotaPreseleccionada?: Mascota | null;
  onGuardar: (nuevoRegistro: RegistroVacunaDesparasitacion) => void;
}

const PRODUCTOS_SUGERIDOS = {
  vacuna: [
    "Antirrábica Rabisin (Anual)",
    "Polivalente Séxtuple Canina (DHPPiL)",
    "Triple Felina (FVRCP)",
    "Leucemia Felina (FeLV)",
    "Tos de las Perreras (Bordetella / KC)",
    "Giardia Canina",
  ],
  desparasitacion_interna: [
    "Drontal Plus (Prazicuantel / Pirantel / Febantel)",
    "Panacur (Fenbendazol)",
    "Total F Gatos",
    "Endogard Canino",
  ],
  desparasitacion_externa: [
    "Simparica Trio (Antipulgas/Garrapatas/Parásitos)",
    "Bravecto (Protección 3 meses)",
    "Nexgard Spectra",
    "Frontline Plus Pipeta",
    "Seresto Collar Antipulgas",
  ],
};

export function NuevaVacunaVetModal({
  open,
  onOpenChange,
  mascotas,
  mascotaPreseleccionada,
  onGuardar,
}: NuevaVacunaVetModalProps) {
  const hoyStr = format(new Date(), "yyyy-MM-dd");
  const unAnioStr = format(addYears(new Date(), 1), "yyyy-MM-dd");

  const [pacienteId, setPacienteId] = useState("");
  const [tipo, setTipo] = useState<RegistroVacunaDesparasitacion["tipo"]>("vacuna");
  const [producto, setProducto] = useState("");
  const [fechaAplicada, setFechaAplicada] = useState(hoyStr);
  const [proximaDosis, setProximaDosis] = useState(unAnioStr);
  const [lote, setLote] = useState("");
  const [veterinario, setVeterinario] = useState("Dra. Carolina Méndez (MVZ)");
  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    if (mascotaPreseleccionada) {
      setPacienteId(mascotaPreseleccionada.paciente_id);
    } else if (mascotas.length > 0 && !pacienteId) {
      setPacienteId(mascotas[0].paciente_id);
    }
  }, [mascotaPreseleccionada, mascotas]);

  // Ajustar próxima dosis por defecto según tipo
  const handleCambioTipo = (t: RegistroVacunaDesparasitacion["tipo"]) => {
    setTipo(t);
    if (t === "vacuna") {
      setProximaDosis(format(addYears(new Date(), 1), "yyyy-MM-dd"));
    } else if (t === "desparasitacion_interna") {
      setProximaDosis(format(addMonths(new Date(), 3), "yyyy-MM-dd"));
    } else {
      setProximaDosis(format(addMonths(new Date(), 1), "yyyy-MM-dd"));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!producto.trim()) {
      toast.error("Por favor ingrese o seleccione el producto administrado");
      return;
    }
    const mascota = mascotas.find(m => m.paciente_id === pacienteId) || mascotas[0];

    const nuevo: RegistroVacunaDesparasitacion = {
      id: `reg-${Date.now()}`,
      paciente_id: pacienteId,
      mascota_nombre: mascota ? `${mascota.nombre} (${mascota.raza})` : "Mascota",
      tipo,
      producto: producto.trim(),
      fecha_aplicada: fechaAplicada,
      proxima_dosis: proximaDosis,
      lote: lote.trim() || undefined,
      veterinario: veterinario.trim(),
      observaciones: observaciones.trim() || undefined,
    };

    onGuardar(nuevo);
    toast.success(`Dosis de ${nuevo.producto} registrada exitosamente`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl border-border/80">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Syringe className="h-5 w-5 text-blue-600" />
            Registrar Inmunización o Desparasitación
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
              <Label className="text-xs font-semibold">Tipo de Tratamiento *</Label>
              <Select value={tipo} onValueChange={(v: any) => handleCambioTipo(v)}>
                <SelectTrigger className="rounded-xl mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="vacuna">Vacuna / Inmunización</SelectItem>
                  <SelectItem value="desparasitacion_interna">Desparasitación Interna</SelectItem>
                  <SelectItem value="desparasitacion_externa">Antipulgas / Garrapatas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Producto / Biológico *</Label>
            <Input
              placeholder="Ej: Antirrábica, Séxtuple, Bravecto, etc."
              value={producto}
              onChange={e => setProducto(e.target.value)}
              className="rounded-xl mt-1 text-xs"
            />
            {/* Sugerencias Rápidas */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {PRODUCTOS_SUGERIDOS[tipo].slice(0, 3).map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  className="text-[10px] bg-muted/60 hover:bg-muted text-foreground/80 px-2 py-0.5 rounded-md border border-border/60 transition-colors"
                  onClick={() => setProducto(sug)}
                >
                  + {sug.split("(")[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Fecha de Aplicación *</Label>
              <Input
                type="date"
                value={fechaAplicada}
                onChange={e => setFechaAplicada(e.target.value)}
                className="rounded-xl mt-1 text-xs font-mono"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Próxima Dosis / Refuerzo</Label>
              <Input
                type="date"
                value={proximaDosis}
                onChange={e => setProximaDosis(e.target.value)}
                className="rounded-xl mt-1 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Lote / Serie del Vial</Label>
              <Input
                placeholder="Ej: VAC-2024-883"
                value={lote}
                onChange={e => setLote(e.target.value)}
                className="rounded-xl mt-1 text-xs font-mono"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Veterinario Responsable</Label>
              <Input
                value={veterinario}
                onChange={e => setVeterinario(e.target.value)}
                className="rounded-xl mt-1 text-xs"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Observaciones Clínicas</Label>
            <Input
              placeholder="Tolerancia, vía de administración, peso al momento..."
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              className="rounded-xl mt-1 text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" className="rounded-xl text-xs" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="rounded-xl text-xs shadow-none">
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Registrar en Carnet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
