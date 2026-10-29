import { useState } from "react";
import { Mascota, ESPECIES_VET, ESPECIE_ICONOS, EspecieVet } from "./vet-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PawPrint, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface NuevaMascotaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuardar: (nuevaMascota: Mascota) => void;
}

export function NuevaMascotaModal({ open, onOpenChange, onGuardar }: NuevaMascotaModalProps) {
  const [nombre, setNombre] = useState("");
  const [especie, setEspecie] = useState<EspecieVet>("perro");
  const [raza, setRaza] = useState("");
  const [sexo, setSexo] = useState<"macho" | "hembra">("macho");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [pesoKg, setPesoKg] = useState("");
  const [esterilizado, setEsterilizado] = useState(false);
  const [microchip, setMicrochip] = useState("");
  const [colorPelaje, setColorPelaje] = useState("");
  const [tutorNombre, setTutorNombre] = useState("");
  const [tutorTelefono, setTutorTelefono] = useState("");
  const [tutorEmail, setTutorEmail] = useState("");
  const [alergias, setAlergias] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !tutorNombre.trim()) {
      toast.error("El nombre de la mascota y del tutor son requeridos");
      return;
    }

    const nueva: Mascota = {
      id: `m-${Date.now()}`,
      paciente_id: `px-vet-${Date.now()}`,
      nombre: nombre.trim(),
      especie,
      raza: raza.trim() || "Mestizo",
      sexo,
      fecha_nacimiento: fechaNacimiento || new Date().toISOString().split("T")[0],
      peso_kg: pesoKg ? Number(pesoKg) : 0,
      esterilizado,
      microchip: microchip.trim() || undefined,
      color_pelaje: colorPelaje.trim() || undefined,
      tutor_nombre: tutorNombre.trim(),
      tutor_telefono: tutorTelefono.trim(),
      tutor_email: tutorEmail.trim() || undefined,
      alergias_condiciones: alergias.trim() || undefined,
    };

    onGuardar(nueva);
    toast.success(`Mascota ${nueva.nombre} registrada exitosamente`);
    onOpenChange(false);

    // Reset
    setNombre("");
    setRaza("");
    setPesoKg("");
    setTutorNombre("");
    setTutorTelefono("");
    setMicrochip("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border-border/80">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-emerald-600" />
            Registro de Nueva Mascota Paciente
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Nombre de la Mascota *</Label>
              <Input
                placeholder="Ej: Max, Luna, Toby..."
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="rounded-xl mt-1 text-xs"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Especie *</Label>
              <Select value={especie} onValueChange={(v: EspecieVet) => setEspecie(v)}>
                <SelectTrigger className="rounded-xl mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {ESPECIES_VET.map(esp => (
                    <SelectItem key={esp} value={esp} className="capitalize">
                      {ESPECIE_ICONOS[esp]} {esp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-semibold">Raza</Label>
              <Input
                placeholder="Ej: Golden, Poodle, Siamés..."
                value={raza}
                onChange={e => setRaza(e.target.value)}
                className="rounded-xl mt-1 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Sexo</Label>
              <Select value={sexo} onValueChange={(v: any) => setSexo(v)}>
                <SelectTrigger className="rounded-xl mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="macho">Macho</SelectItem>
                  <SelectItem value="hembra">Hembra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Peso (kg)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Ej: 14.5"
                value={pesoKg}
                onChange={e => setPesoKg(e.target.value)}
                className="rounded-xl mt-1 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-semibold">Fecha de Nacimiento</Label>
              <Input
                type="date"
                value={fechaNacimiento}
                onChange={e => setFechaNacimiento(e.target.value)}
                className="rounded-xl mt-1 text-xs font-mono"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">N° Microchip / ID</Label>
              <Input
                placeholder="15 dígitos ISO..."
                value={microchip}
                onChange={e => setMicrochip(e.target.value)}
                className="rounded-xl mt-1 text-xs font-mono"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Color / Pelaje</Label>
              <Input
                placeholder="Ej: Blanco con manchas café"
                value={colorPelaje}
                onChange={e => setColorPelaje(e.target.value)}
                className="rounded-xl mt-1 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/60">
            <Switch
              id="switch-esteril"
              checked={esterilizado}
              onCheckedChange={setEsterilizado}
            />
            <Label htmlFor="switch-esteril" className="text-xs font-medium cursor-pointer">
              Mascota Esterilizada / Castrada quirúrgicamente
            </Label>
          </div>

          <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/70 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Datos del Tutor / Dueño
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <Label className="text-[11px] text-muted-foreground">Nombre Completo *</Label>
                <Input
                  placeholder="Ej: Carmen Peña"
                  value={tutorNombre}
                  onChange={e => setTutorNombre(e.target.value)}
                  className="rounded-xl mt-0.5 text-xs"
                  required
                />
              </div>

              <div>
                <Label className="text-[11px] text-muted-foreground">Teléfono / WhatsApp *</Label>
                <Input
                  type="tel"
                  placeholder="809-555-0000"
                  value={tutorTelefono}
                  onChange={e => setTutorTelefono(e.target.value)}
                  className="rounded-xl mt-0.5 text-xs font-mono"
                  required
                />
              </div>

              <div>
                <Label className="text-[11px] text-muted-foreground">Correo Electrónico</Label>
                <Input
                  type="email"
                  placeholder="tutor@correo.com"
                  value={tutorEmail}
                  onChange={e => setTutorEmail(e.target.value)}
                  className="rounded-xl mt-0.5 text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Alergias o Condiciones Clínicas Previas</Label>
            <Input
              placeholder="Ej: Alérgico a penicilina, displasia de cadera, etc."
              value={alergias}
              onChange={e => setAlergias(e.target.value)}
              className="rounded-xl mt-1 text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" className="rounded-xl text-xs" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="rounded-xl text-xs shadow-none">
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Registrar Mascota
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
