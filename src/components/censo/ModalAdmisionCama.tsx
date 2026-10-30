import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import type { CamaDetalle, TipoAislamiento } from "./types";

export interface FormAdmisionData {
  nombre_paciente: string;
  cedula_nss: string;
  edad_sexo: string;
  diagnostico_cie10: string;
  medico_tratante: string;
  especialidad: string;
  dieta: string;
  aislamiento: TipoAislamiento;
  alergias: string;
}

interface ModalAdmisionCamaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cama: CamaDetalle | null;
  formData: FormAdmisionData;
  setFormData: React.Dispatch<React.SetStateAction<FormAdmisionData>>;
  onConfirmar: () => void;
}

export function ModalAdmisionCama({
  open,
  onOpenChange,
  cama,
  formData,
  setFormData,
  onConfirmar,
}: ModalAdmisionCamaProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <UserPlus className="w-5 h-5 text-emerald-600" /> Ingreso de Paciente — {cama?.nombre}
          </DialogTitle>
          <DialogDescription>
            Asigne un paciente a esta cama hospitalaria completando sus datos clínicos de internamiento.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2 text-xs">
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs">Nombre Completo del Paciente *</Label>
            <Input
              placeholder="Ej. Roberto Guzmán Rosario"
              value={formData.nombre_paciente}
              onChange={(e) => setFormData({ ...formData, nombre_paciente: e.target.value })}
              className="rounded-xl border-border/80 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Cédula / NSS</Label>
            <Input
              placeholder="001-XXXXXXX-X"
              value={formData.cedula_nss}
              onChange={(e) => setFormData({ ...formData, cedula_nss: e.target.value })}
              className="rounded-xl border-border/80 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Edad / Sexo</Label>
            <Input
              placeholder="Ej. 42a / M"
              value={formData.edad_sexo}
              onChange={(e) => setFormData({ ...formData, edad_sexo: e.target.value })}
              className="rounded-xl border-border/80 text-xs"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs">Diagnóstico de Ingreso (CIE-10) *</Label>
            <Input
              placeholder="Ej. Neumonía bacteriana no especificada (J18.9)"
              value={formData.diagnostico_cie10}
              onChange={(e) => setFormData({ ...formData, diagnostico_cie10: e.target.value })}
              className="rounded-xl border-border/80 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Médico Tratante</Label>
            <Input
              value={formData.medico_tratante}
              onChange={(e) => setFormData({ ...formData, medico_tratante: e.target.value })}
              className="rounded-xl border-border/80 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Especialidad</Label>
            <Select
              value={formData.especialidad}
              onValueChange={(v) => setFormData({ ...formData, especialidad: v })}
            >
              <SelectTrigger className="rounded-xl border-border/80 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Medicina Interna">Medicina Interna</SelectItem>
                <SelectItem value="Cirugía General">Cirugía General</SelectItem>
                <SelectItem value="Cardiología">Cardiología</SelectItem>
                <SelectItem value="Neumología">Neumología</SelectItem>
                <SelectItem value="Gastroenterología">Gastroenterología</SelectItem>
                <SelectItem value="Traumatología & Ortopedia">Traumatología & Ortopedia</SelectItem>
                <SelectItem value="Urología">Urología</SelectItem>
                <SelectItem value="Dermatología">Dermatología</SelectItem>
                <SelectItem value="Pediatría">Pediatría</SelectItem>
                <SelectItem value="Ginecología & Obstetricia">Ginecología & Obstetricia</SelectItem>
                <SelectItem value="Cuidados Críticos (UCI)">Cuidados Críticos (UCI)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Tipo de Dieta Hospitalaria</Label>
            <Select
              value={formData.dieta}
              onValueChange={(v) => setFormData({ ...formData, dieta: v })}
            >
              <SelectTrigger className="rounded-xl border-border/80 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Común balanceada">Común balanceada</SelectItem>
                <SelectItem value="Blanda digestiva">Blanda digestiva</SelectItem>
                <SelectItem value="Hiposódica estricta">Hiposódica estricta</SelectItem>
                <SelectItem value="Diabética fraccionada">Diabética fraccionada</SelectItem>
                <SelectItem value="Líquida amplia">Líquida amplia</SelectItem>
                <SelectItem value="Nada por boca (NPO)">Nada por boca (NPO)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Precaución de Aislamiento</Label>
            <Select
              value={formData.aislamiento}
              onValueChange={(v: any) => setFormData({ ...formData, aislamiento: v })}
            >
              <SelectTrigger className="rounded-xl border-border/80 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ninguno">Ninguno (Estándar)</SelectItem>
                <SelectItem value="Contacto">Contacto (Enterobacterias/Clostridium)</SelectItem>
                <SelectItem value="Gotas">Gotas (Meningococo/Influenza)</SelectItem>
                <SelectItem value="Aéreo">Aéreo (TBC/Varicela/COVID)</SelectItem>
                <SelectItem value="Protector / Neutropénico">Protector / Neutropénico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs">Alergias Conocidas</Label>
            <Input
              placeholder="Ej. Alergia a Penicilina, AINEs o Ninguna"
              value={formData.alergias}
              onChange={(e) => setFormData({ ...formData, alergias: e.target.value })}
              className="rounded-xl border-border/80 text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancelar
          </Button>
          <Button
            onClick={onConfirmar}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Confirmar Ingreso en Cama
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
