import { useState } from "react";
import { SolicitudIntercambio, TipoTurno, CATALOGO_TURNOS } from "./turnos-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeftRight, CheckCircle2, ShieldAlert, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface IntercambioGuardiasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  solicitudes: SolicitudIntercambio[];
  onAprobar: (id: string) => void;
  onCrearSolicitud: (nueva: SolicitudIntercambio) => void;
}

export function IntercambioGuardiasModal({
  open,
  onOpenChange,
  solicitudes,
  onAprobar,
  onCrearSolicitud,
}: IntercambioGuardiasModalProps) {
  const [solicitante, setSolicitante] = useState("Dr. Carlos Mendoza (Neurología)");
  const [receptor, setReceptor] = useState("Dra. Sofía Rivas (Medicina Interna)");
  const [fechaTurno, setFechaTurno] = useState("2024-11-01");
  const [turnoOfrecido, setTurnoOfrecido] = useState<TipoTurno>("G24");
  const [turnoDeseado, setTurnoDeseado] = useState<TipoTurno>("M");
  const [motivo, setMotivo] = useState("Congreso Médico de Neurología en Santo Domingo");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nueva: SolicitudIntercambio = {
      id: `sol-${Date.now()}`,
      profesional_solicitante: solicitante,
      profesional_receptor: receptor,
      fecha_turno: fechaTurno,
      turno_ofrecido: turnoOfrecido,
      turno_deseado: turnoDeseado,
      motivo: motivo.trim(),
      estado: "pendiente",
      fecha_solicitud: new Date().toISOString(),
    };
    onCrearSolicitud(nueva);
    toast.success("Solicitud de intercambio enviada a supervisión médica");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border-border/80">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-purple-600" />
            Intercambio de Guardias & Turnos Clínicos
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Solicitudes de cambio entre colegas con validación de descansos legales obligatorios
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Solicitudes Pendientes */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Solicitudes Pendientes de Aprobación ({solicitudes.length})
            </span>
            <div className="space-y-2">
              {solicitudes.map(s => (
                <div key={s.id} className="p-3.5 rounded-2xl bg-card border border-border/70 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{s.profesional_solicitante}</span>
                    <Badge className={s.estado === "aprobado" ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}>
                      {s.estado.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    Cede su turno <strong>{s.turno_ofrecido}</strong> del {s.fecha_turno} a <strong>{s.profesional_receptor}</strong> a cambio de <strong>{s.turno_deseado}</strong>.
                  </p>
                  <p className="text-[11px] italic text-muted-foreground/80">
                    Motivo: "{s.motivo}"
                  </p>
                  {s.estado === "pendiente" && (
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        className="rounded-xl text-xs h-7 gap-1 shadow-none bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => onAprobar(s.id)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Aprobar Cambio
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Formulario de Nueva Solicitud */}
          <form onSubmit={handleSubmit} className="p-3.5 rounded-2xl bg-muted/20 border border-border/70 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Nueva Solicitud de Intercambio
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <Label className="text-[11px] text-muted-foreground">Colega Receptor</Label>
                <Input
                  value={receptor}
                  onChange={e => setReceptor(e.target.value)}
                  className="rounded-xl mt-1 text-xs"
                  required
                />
              </div>

              <div>
                <Label className="text-[11px] text-muted-foreground">Fecha del Turno</Label>
                <Input
                  type="date"
                  value={fechaTurno}
                  onChange={e => setFechaTurno(e.target.value)}
                  className="rounded-xl mt-1 text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="text-[11px] text-muted-foreground">Turno que cedo</Label>
                <Select value={turnoOfrecido} onValueChange={(v: any) => setTurnoOfrecido(v)}>
                  <SelectTrigger className="rounded-xl mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="G24">G24 (Guardia 24h)</SelectItem>
                    <SelectItem value="N">N (Noche 23-7h)</SelectItem>
                    <SelectItem value="T">T (Tarde 15-23h)</SelectItem>
                    <SelectItem value="M">M (Mañana 7-15h)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[11px] text-muted-foreground">Turno que recibo</Label>
                <Select value={turnoDeseado} onValueChange={(v: any) => setTurnoDeseado(v)}>
                  <SelectTrigger className="rounded-xl mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="M">M (Mañana 7-15h)</SelectItem>
                    <SelectItem value="T">T (Tarde 15-23h)</SelectItem>
                    <SelectItem value="N">N (Noche 23-7h)</SelectItem>
                    <SelectItem value="L">L (Descanso compensatorio)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-[11px] text-muted-foreground">Justificación / Motivo</Label>
              <Input
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                className="rounded-xl mt-1 text-xs"
                placeholder="Razón del cambio..."
                required
              />
            </div>

            <Button type="submit" className="w-full rounded-xl text-xs shadow-none">
              Enviar Solicitud
            </Button>
          </form>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" className="rounded-xl text-xs" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
