import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CalendarOff, Plus, Wand2 } from "lucide-react";
import { PacienteCombobox } from "@/components/PacienteCombobox";
import { NearbyPatientsRecommendation } from "@/components/NearbyPatientsRecommendation";
import { VideoConsultaFields } from "@/components/VideoConsultaFields";
import { SucursalSelect } from "@/components/SucursalSelect";
import type { Paciente, Personal } from "@/types/db";
import type { VideoProveedor } from "@/lib/videoLinks";
import { toast } from "sonner";

interface ProgramarVisitaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacientes: Paciente[];
  personal: Personal[];
  loading: boolean;
  selectedPatientId: string | null;
  selectedPatientData: any;
  onPatientChange: (patientId: string) => void;
  diasNoVisitaPaciente: number[];
  selectedProfesionalId: string;
  setSelectedProfesionalId: (id: string) => void;
  onAutoAssignClick: () => void;
  selectedFechaHora: string;
  setSelectedFechaHora: (val: string) => void;
  modalidad: "presencial" | "virtual";
  setModalidad: (val: "presencial" | "virtual") => void;
  videoCfg: { proveedor: VideoProveedor | null; enlace: string; notas: string };
  setVideoCfg: React.Dispatch<
    React.SetStateAction<{ proveedor: VideoProveedor | null; enlace: string; notas: string }>
  >;
  workspaceSlug: string | null;
  selectedProfessionals: string[];
  setSelectedProfessionals: (ids: string[]) => void;
  sucursalId: string | null;
  setSucursalId: (id: string | null) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function ProgramarVisitaDialog({
  open,
  onOpenChange,
  pacientes,
  personal,
  loading,
  selectedPatientId,
  selectedPatientData,
  onPatientChange,
  diasNoVisitaPaciente,
  selectedProfesionalId,
  setSelectedProfesionalId,
  onAutoAssignClick,
  selectedFechaHora,
  setSelectedFechaHora,
  modalidad,
  setModalidad,
  videoCfg,
  setVideoCfg,
  workspaceSlug,
  selectedProfessionals,
  setSelectedProfessionals,
  sucursalId,
  setSucursalId,
  onSubmit,
}: ProgramarVisitaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Programar Visita
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Programar Nueva Visita</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paciente_id">Paciente *</Label>
            <PacienteCombobox
              pacientes={pacientes.map((p) => ({
                id: p.id,
                nombre: p.nombre,
                apellido: p.apellido,
                cedula: p.cedula,
              }))}
              value={selectedPatientId || ""}
              onValueChange={onPatientChange}
              required
              showCedula={false}
            />
          </div>

          {selectedPatientId && !selectedPatientData?.zona && !selectedPatientData?.barrio && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este paciente no tiene zona ni barrio configurados. Actualiza sus datos para optimizar rutas.
              </AlertDescription>
            </Alert>
          )}

          {diasNoVisitaPaciente.length > 0 && (
            <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
              <CalendarOff className="h-4 w-4 text-orange-500" />
              <AlertDescription className="text-orange-700 dark:text-orange-300">
                Este paciente no tiene disponibilidad los:{" "}
                {diasNoVisitaPaciente
                  .map((d) => ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"][d])
                  .join(", ")}
              </AlertDescription>
            </Alert>
          )}

          {selectedPatientId && selectedPatientData?.zona && (
            <NearbyPatientsRecommendation
              currentPatientId={selectedPatientId}
              barrio={selectedPatientData?.barrio}
              zona={selectedPatientData?.zona}
              onSelectPatient={() => {
                toast.info("Paciente cercano recomendado. Considere planificar visita conjunta.");
              }}
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="profesional_id">Profesional *</Label>
            <div className="flex gap-2">
              <Select
                name="profesional_id"
                required
                value={selectedProfesionalId}
                onValueChange={setSelectedProfesionalId}
              >
                <SelectTrigger className="flex-1">
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
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onAutoAssignClick}
                disabled={!selectedPatientId || !selectedFechaHora}
                title="Asignación automática"
              >
                <Wand2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha_hora_visita">Fecha y Hora *</Label>
            <Input
              id="fecha_hora_visita"
              name="fecha_hora_visita"
              type="datetime-local"
              required
              value={selectedFechaHora}
              onChange={(e) => setSelectedFechaHora(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo_visita">Tipo de Visita *</Label>
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
            <Label>Modalidad *</Label>
            <Select
              value={modalidad}
              onValueChange={(v) => setModalidad(v as "presencial" | "virtual")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="virtual">Virtual (videoconsulta)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {modalidad === "virtual" && (
            <VideoConsultaFields
              proveedor={videoCfg.proveedor}
              enlace={videoCfg.enlace}
              notas={videoCfg.notas}
              workspaceSlug={workspaceSlug}
              onChange={setVideoCfg}
            />
          )}

          <div className="space-y-2">
            <Label>Profesionales Adicionales (Opcional)</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
              {personal.map((p) => (
                <div key={p.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`prof-${p.id}`}
                    checked={selectedProfessionals.includes(p.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProfessionals([...selectedProfessionals, p.id]);
                      } else {
                        setSelectedProfessionals(
                          selectedProfessionals.filter((id) => id !== p.id)
                        );
                      }
                    }}
                    className="rounded"
                  />
                  <Label htmlFor={`prof-${p.id}`} className="cursor-pointer text-sm">
                    {p.nombre} {p.apellido} - {p.especialidad}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo_visita">Motivo</Label>
            <Textarea
              id="motivo_visita"
              name="motivo_visita"
              placeholder="Motivo de la visita"
            />
          </div>

          <SucursalSelect value={sucursalId} onChange={setSucursalId} />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Programando..." : "Programar Visita"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
