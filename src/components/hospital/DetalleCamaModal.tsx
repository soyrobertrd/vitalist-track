import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  BedDouble,
  User,
  Calendar,
  Sparkles,
  Move,
  LogOut,
  ShieldAlert,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export interface CamaHospitalariaDetalle {
  id: string;
  numeroCama: string;
  piso: string;
  sala: string;
  tipo: "estandar" | "uci" | "aislamiento" | "maternidad" | "cuna";
  estado: "disponible" | "ocupada" | "limpieza" | "mantenimiento" | "reservada";
  aislamiento?: "gotitas" | "aerosoles" | "contacto" | "neutropenico" | null;
  paciente?: {
    id: string;
    nombre: string;
    documento: string;
    diagnosticoIngreso: string;
    fechaIngreso: string;
    diasEstancia: number;
    medicoTratante: string;
    dieta: string;
  } | null;
}

interface DetalleCamaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cama: CamaHospitalariaDetalle | null;
  onCambiarEstado?: (camaId: string, nuevoEstado: CamaHospitalariaDetalle["estado"]) => void;
}

export const DetalleCamaModal: React.FC<DetalleCamaModalProps> = ({
  open,
  onOpenChange,
  cama,
  onCambiarEstado,
}) => {
  if (!cama) return null;

  const handleSolicitarLimpieza = () => {
    if (onCambiarEstado) onCambiarEstado(cama.id, "limpieza");
    toast.success(`Cama ${cama.numeroCama} marcada en desinfección y limpieza terminal`);
    onOpenChange(false);
  };

  const handleLiberarCama = () => {
    if (onCambiarEstado) onCambiarEstado(cama.id, "disponible");
    toast.success(`Cama ${cama.numeroCama} liberada y disponible para nueva admisión`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <BedDouble className="h-5 w-5 text-primary" />
              Cama {cama.numeroCama} ({cama.piso} · {cama.sala})
            </DialogTitle>
            <Badge variant="outline" className="text-xs uppercase font-mono">
              {cama.tipo}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-3 pt-2 text-xs">
          {/* Alerta de Aislamiento */}
          {cama.aislamiento && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-rose-700 dark:text-rose-400">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold text-xs uppercase tracking-wide">
                  Aislamiento Epidemiológico: {cama.aislamiento.toUpperCase()}
                </p>
                <p className="text-[11px] opacity-90">
                  Uso obligatorio de EPP antes de ingresar al cubículo.
                </p>
              </div>
            </div>
          )}

          {/* Información del Paciente si está ocupada */}
          {cama.estado === "ocupada" && cama.paciente ? (
            <div className="p-3 bg-muted/40 rounded-xl border border-border/70 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground">Paciente Ingresado</span>
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary" />
                    {cama.paciente.nombre}
                  </h4>
                  <p className="text-[11px] text-muted-foreground font-mono">Doc: {cama.paciente.documento}</p>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                  Estancia: {cama.paciente.diasEstancia} días
                </Badge>
              </div>

              <div className="pt-1 border-t border-border/60 text-xs space-y-1">
                <p>Diagnóstico: <strong className="text-foreground">{cama.paciente.diagnosticoIngreso}</strong></p>
                <p>Médico a cargo: <span className="text-foreground">{cama.paciente.medicoTratante}</span></p>
                <p>Régimen Dietético: <span className="text-foreground font-medium">{cama.paciente.dieta}</span></p>
                <p className="text-muted-foreground text-[11px]">
                  Fecha Ingreso: {cama.paciente.fechaIngreso}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-muted/20 rounded-xl text-center text-muted-foreground border border-dashed border-border/70">
              <p className="font-medium text-xs">Cama actualmente {cama.estado}</p>
              <p className="text-[11px] mt-0.5">Lista para recibir pacientes desde Admisión o Urgencias.</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          {cama.estado === "ocupada" && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={handleSolicitarLimpieza}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-500" />
                Pedir Limpieza
              </Button>
              <Button
                type="button"
                size="sm"
                className="w-full text-xs bg-rose-600 hover:bg-rose-700 text-white"
                onClick={handleLiberarCama}
              >
                <LogOut className="h-3.5 w-3.5 mr-1" />
                Dar de Alta / Liberar
              </Button>
            </>
          )}

          {cama.estado === "limpieza" && (
            <Button
              type="button"
              size="sm"
              className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleLiberarCama}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Certificar Desinfección OK (Disponible)
            </Button>
          )}

          {cama.estado === "disponible" && (
            <Button
              type="button"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                toast.info(`Abriendo asignación de cama ${cama.numeroCama}...`);
                onOpenChange(false);
              }}
            >
              Asignar a Paciente en Espera
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
