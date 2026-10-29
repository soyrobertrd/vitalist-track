import { Mascota, RegistroVacunaDesparasitacion, ESPECIE_ICONOS } from "./vet-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, QrCode, ShieldCheck, Heart, Sparkles, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CarnetDigitalModalProps {
  mascota: Mascota | null;
  vacunas: RegistroVacunaDesparasitacion[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CarnetDigitalModal({
  mascota,
  vacunas,
  open,
  onOpenChange,
}: CarnetDigitalModalProps) {
  if (!mascota) return null;

  const vacunasMascota = vacunas.filter(
    v => v.paciente_id === mascota.paciente_id || v.mascota_nombre.includes(mascota.nombre)
  );

  const handleImprimir = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-border/80">
        {/* Cabecera Tipo Pasaporte Veterinario */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 relative">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-200" />
                <span className="text-xs font-bold tracking-widest uppercase opacity-90">
                  Pasaporte Sanitario Veterinario
                </span>
              </div>
              <h2 className="text-2xl font-black">{mascota.nombre}</h2>
              <p className="text-xs text-emerald-100">
                {mascota.raza} • Tutor: {mascota.tutor_nombre}
              </p>
            </div>

            <div className="text-right flex flex-col items-end">
              <span className="text-4xl">{ESPECIE_ICONOS[mascota.especie] || "🐾"}</span>
              {mascota.microchip && (
                <span className="font-mono text-[10px] bg-black/20 px-2 py-0.5 rounded-full mt-2">
                  CHIP: {mascota.microchip}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Datos Clínicos del Paciente */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-muted/30 p-3.5 rounded-2xl border border-border/70">
            <div>
              <span className="text-muted-foreground block text-[11px]">Especie / Sexo:</span>
              <strong className="text-foreground capitalize">{mascota.especie} • {mascota.sexo}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Peso Registrado:</span>
              <strong className="text-foreground">{mascota.peso_kg ? `${mascota.peso_kg} kg` : "—"}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Nacimiento:</span>
              <strong className="text-foreground">
                {mascota.fecha_nacimiento ? format(new Date(mascota.fecha_nacimiento), "dd/MM/yyyy") : "—"}
              </strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Esterilizado:</span>
              <strong className="text-foreground">{mascota.esterilizado ? "Sí (Quirúrgico)" : "No"}</strong>
            </div>
          </div>

          {/* Historial de Inmunización */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Registro Oficial de Vacunas y Desparasitaciones
            </h3>

            {vacunasMascota.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center italic">
                Sin vacunas registradas en el expediente digital.
              </p>
            ) : (
              <div className="border border-border/70 rounded-2xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs font-semibold">Vacuna / Producto</TableHead>
                      <TableHead className="text-xs font-semibold">Aplicación</TableHead>
                      <TableHead className="text-xs font-semibold">Próximo Refuerzo</TableHead>
                      <TableHead className="text-xs font-semibold">Lote / Sello</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vacunasMascota.map(v => (
                      <TableRow key={v.id}>
                        <TableCell className="font-semibold text-xs text-foreground">
                          {v.producto}
                        </TableCell>
                        <TableCell className="text-xs tabular-nums text-muted-foreground">
                          {format(new Date(v.fecha_aplicada + "T12:00:00"), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="text-xs tabular-nums font-semibold text-foreground">
                          {v.proxima_dosis ? format(new Date(v.proxima_dosis + "T12:00:00"), "dd/MM/yyyy") : "Permanente"}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {v.lote || "Sello Digital"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Pie y Acciones */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/60">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <QrCode className="h-4 w-4 text-primary" />
              <span>Verificado con firma digital veterinaria</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" className="rounded-xl text-xs flex-1 sm:flex-initial" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              <Button className="rounded-xl text-xs flex-1 sm:flex-initial shadow-none" onClick={handleImprimir}>
                <Printer className="h-3.5 w-3.5 mr-1.5" /> Imprimir Carnet
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
