import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lock, Plus, ShieldAlert, CheckCircle2, FileSignature, Printer } from "lucide-react";
import { toast } from "sonner";

export interface MovimientoControlado {
  id: string;
  fecha: string;
  medicamento: string;
  numeroRecetaRetenida: string;
  paciente: string;
  medicoPrescriptor: string;
  exequaturMedico: string;
  cantidadDespachada: number;
  remanenteCajaFuerte: number;
  enfermeroReceptor: string;
  farmaceuticoEntrega: string;
}

const DEFAULT_CONTROLADOS: MovimientoControlado[] = [
  {
    id: "ctrl-1",
    fecha: "2026-10-29 08:30",
    medicamento: "Fentanilo 0.5 mg / 10 ml (Ampollas)",
    numeroRecetaRetenida: "RET-2026-00441",
    paciente: "Carlos Domínguez (UCI)",
    medicoPrescriptor: "Dr. Jorge Castillo (Anestesiólogo)",
    exequaturMedico: "EX-39102-RD",
    cantidadDespachada: 5,
    remanenteCajaFuerte: 45,
    enfermeroReceptor: "Lic. Carmen Ortiz (Enf. UCI)",
    farmaceuticoEntrega: "Dra. Laura Batista",
  },
  {
    id: "ctrl-2",
    fecha: "2026-10-28 14:15",
    medicamento: "Morfina Clorhidrato 10 mg / 1 ml",
    numeroRecetaRetenida: "RET-2026-00438",
    paciente: "Elena Vásquez Ramos (Quirófano 1)",
    medicoPrescriptor: "Dra. Sofía Mendoza Peña",
    exequaturMedico: "EX-48910-RD",
    cantidadDespachada: 2,
    remanenteCajaFuerte: 28,
    enfermeroReceptor: "Lic. Miguel Ángel Sosa",
    farmaceuticoEntrega: "Dra. Laura Batista",
  },
  {
    id: "ctrl-3",
    fecha: "2026-10-28 10:00",
    medicamento: "Midazolam 15 mg / 3 ml (Ampollas)",
    numeroRecetaRetenida: "RET-2026-00432",
    paciente: "Ramón Arturo Gómez",
    medicoPrescriptor: "Dr. Marco Aurelio Pérez",
    exequaturMedico: "EX-28901-RD",
    cantidadDespachada: 3,
    remanenteCajaFuerte: 62,
    enfermeroReceptor: "Lic. Carmen Ortiz",
    farmaceuticoEntrega: "Dra. Laura Batista",
  },
];

export const LibroControladosTab: React.FC = () => {
  const [movimientos, setMovimientos] = useState<MovimientoControlado[]>(DEFAULT_CONTROLADOS);
  const [openModal, setOpenModal] = useState(false);

  const [form, setForm] = useState({
    medicamento: "Fentanilo 0.5 mg / 10 ml (Ampollas)",
    numeroRecetaRetenida: "",
    paciente: "",
    medicoPrescriptor: "",
    exequaturMedico: "",
    cantidadDespachada: 2,
    remanenteCajaFuerte: 43,
    enfermeroReceptor: "",
    farmaceuticoEntrega: "Dra. Laura Batista",
  });

  const handleCrear = () => {
    if (!form.numeroRecetaRetenida || !form.paciente || !form.medicoPrescriptor) {
      toast.error("Por favor completa los datos obligatorios de la receta retenida");
      return;
    }

    const nuevo: MovimientoControlado = {
      id: `ctrl-${Date.now()}`,
      fecha: new Date().toISOString().replace("T", " ").substring(0, 16),
      medicamento: form.medicamento,
      numeroRecetaRetenida: form.numeroRecetaRetenida,
      paciente: form.paciente,
      medicoPrescriptor: form.medicoPrescriptor,
      exequaturMedico: form.exequaturMedico || "EX-OFICIAL",
      cantidadDespachada: Number(form.cantidadDespachada),
      remanenteCajaFuerte: Number(form.remanenteCajaFuerte),
      enfermeroReceptor: form.enfermeroReceptor || "Enfermería de Turno",
      farmaceuticoEntrega: form.farmaceuticoEntrega,
    };

    setMovimientos([nuevo, ...movimientos]);
    toast.success("Despacho de sustancia controlada asentado en libro oficial");
    setOpenModal(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-rose-600" />
            Libro Oficial Digital de Estupefacientes y Psicotrópicos
          </h3>
          <p className="text-xs text-muted-foreground">
            Custodia y trazabilidad de sustancias controladas conforme a la Ley General de Salud y DNCD
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => window.print()} className="h-8 text-xs rounded-xl">
            <Printer className="h-3.5 w-3.5 mr-1" /> Imprimir Folio
          </Button>

          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl h-8 bg-rose-600 hover:bg-rose-700 text-white text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Asentar Despacho
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base font-bold">
                  <ShieldAlert className="h-4 w-4 text-rose-600" />
                  Asiento en Libro de Controlados
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <Label className="text-xs">Sustancia Controlada</Label>
                  <Select
                    value={form.medicamento}
                    onValueChange={(v) => setForm({ ...form, medicamento: v })}
                  >
                    <SelectTrigger className="text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fentanilo 0.5 mg / 10 ml (Ampollas)">Fentanilo 0.5 mg / 10 ml</SelectItem>
                      <SelectItem value="Morfina Clorhidrato 10 mg / 1 ml">Morfina Clorhidrato 10 mg / 1 ml</SelectItem>
                      <SelectItem value="Midazolam 15 mg / 3 ml (Ampollas)">Midazolam 15 mg / 3 ml</SelectItem>
                      <SelectItem value="Remifentanilo 2 mg (Vial)">Remifentanilo 2 mg</SelectItem>
                      <SelectItem value="Oxicodona 10 mg (Comprimidos)">Oxicodona 10 mg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">No. Receta Retenida</Label>
                    <Input
                      placeholder="RET-2026-00445"
                      value={form.numeroRecetaRetenida}
                      onChange={(e) => setForm({ ...form, numeroRecetaRetenida: e.target.value })}
                      className="text-xs mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Paciente Receptor</Label>
                    <Input
                      placeholder="Nombre del paciente"
                      value={form.paciente}
                      onChange={(e) => setForm({ ...form, paciente: e.target.value })}
                      className="text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Médico Prescriptor</Label>
                    <Input
                      placeholder="Dr. Prescriptor"
                      value={form.medicoPrescriptor}
                      onChange={(e) => setForm({ ...form, medicoPrescriptor: e.target.value })}
                      className="text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Exequátur / Colegiatura</Label>
                    <Input
                      placeholder="EX-00000-RD"
                      value={form.exequaturMedico}
                      onChange={(e) => setForm({ ...form, exequaturMedico: e.target.value })}
                      className="text-xs mt-1 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Cantidad Entregada</Label>
                    <Input
                      type="number"
                      min="1"
                      value={form.cantidadDespachada}
                      onChange={(e) => setForm({ ...form, cantidadDespachada: parseInt(e.target.value) || 1 })}
                      className="text-xs mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Remanente Caja Seguridad</Label>
                    <Input
                      type="number"
                      value={form.remanenteCajaFuerte}
                      onChange={(e) => setForm({ ...form, remanenteCajaFuerte: parseInt(e.target.value) || 0 })}
                      className="text-xs mt-1 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Enfermero(a) que Recibe</Label>
                  <Input
                    placeholder="Lic. Enfermero(a)"
                    value={form.enfermeroReceptor}
                    onChange={(e) => setForm({ ...form, enfermeroReceptor: e.target.value })}
                    className="text-xs mt-1"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button size="sm" onClick={handleCrear} className="w-full bg-rose-600 hover:bg-rose-700">
                  Firmar y Asentar en Libro
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabla Oficial de Movimientos de Controlados */}
      <div className="rounded-2xl border border-border/80 overflow-hidden text-xs bg-card shadow-none">
        <table className="w-full text-left">
          <thead className="bg-muted/50 border-b border-border/80 text-[11px] text-muted-foreground uppercase">
            <tr>
              <th className="p-3">Fecha</th>
              <th className="p-3">Sustancia Controlada</th>
              <th className="p-3">Receta Retenida</th>
              <th className="p-3">Paciente & Médico</th>
              <th className="p-3 text-center">Cant.</th>
              <th className="p-3 text-center">Remanente</th>
              <th className="p-3">Custodia</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((m) => (
              <tr key={m.id} className="border-b border-border/50 last:border-none hover:bg-muted/20">
                <td className="p-3 font-mono text-[11px] text-muted-foreground">{m.fecha}</td>
                <td className="p-3">
                  <span className="font-bold text-foreground block">{m.medicamento}</span>
                </td>
                <td className="p-3 font-mono text-primary font-semibold">
                  {m.numeroRecetaRetenida}
                </td>
                <td className="p-3 space-y-0.5">
                  <span className="text-foreground font-medium block">{m.paciente}</span>
                  <span className="text-[11px] text-muted-foreground">{m.medicoPrescriptor} ({m.exequaturMedico})</span>
                </td>
                <td className="p-3 text-center font-mono font-bold text-rose-600">
                  -{m.cantidadDespachada}
                </td>
                <td className="p-3 text-center font-mono font-bold text-emerald-600">
                  {m.remanenteCajaFuerte}
                </td>
                <td className="p-3 text-[11px] text-muted-foreground">
                  <span className="block">Recibió: <strong className="text-foreground">{m.enfermeroReceptor}</strong></span>
                  <span className="block text-[10px]">Entregó: {m.farmaceuticoEntrega}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
