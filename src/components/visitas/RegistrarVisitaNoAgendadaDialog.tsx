import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SucursalSelect } from "@/components/SucursalSelect";
import type { Paciente, Personal } from "@/types/db";

interface RegistrarVisitaNoAgendadaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacientes: Paciente[];
  personal: Personal[];
  loading: boolean;
  sucursalId: string | null;
  onSucursalChange: (id: string | null) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function RegistrarVisitaNoAgendadaDialog({
  open,
  onOpenChange,
  pacientes,
  personal,
  loading,
  sucursalId,
  onSucursalChange,
  onSubmit,
}: RegistrarVisitaNoAgendadaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Registrar Visita No Agendada</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Visita No Agendada (Espontánea)</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paciente_unscheduled">Paciente *</Label>
            <Select name="paciente_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar paciente" />
              </SelectTrigger>
              <SelectContent>
                {pacientes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre} {p.apellido} - {p.cedula}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="profesional_unscheduled">Profesional *</Label>
            <Select name="profesional_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar profesional" />
              </SelectTrigger>
              <SelectContent>
                {personal.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre} {p.apellido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo_visita_unscheduled">Tipo de Visita *</Label>
            <Select name="tipo_visita" required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ambulatorio">Ambulatorio (Consultorio)</SelectItem>
                <SelectItem value="domicilio">Domicilio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="razon">Razón de visita no agendada</Label>
            <Textarea
              id="razon"
              name="razon"
              placeholder="Ej: Paciente se confundió de fecha, estaba cerca y se atendió"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motivo_visita_unscheduled">Motivo</Label>
            <Textarea
              id="motivo_visita_unscheduled"
              name="motivo_visita"
              placeholder="Motivo de la visita"
            />
          </div>
          <SucursalSelect value={sucursalId} onChange={onSucursalChange} />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Registrando..." : "Registrar Visita"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
