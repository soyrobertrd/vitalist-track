import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { handlePhoneInput } from "@/lib/phoneUtils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

interface EditPacienteContactoSectionProps {
  formData: {
    contacto_px: string;
    contacto_cuidador: string;
  };
  handleInputChange: (field: string, value: string) => void;
  whatsappPx: boolean;
  setWhatsappPx: (val: boolean) => void;
  emailPx: string;
  setEmailPx: (val: string) => void;
  paciente: any;
  whatsappCuidador: boolean;
  setWhatsappCuidador: (val: boolean) => void;
  emailCuidador: string;
  setEmailCuidador: (val: string) => void;
}

export function EditPacienteContactoSection({
  formData,
  handleInputChange,
  whatsappPx,
  setWhatsappPx,
  emailPx,
  setEmailPx,
  paciente,
  whatsappCuidador,
  setWhatsappCuidador,
  emailCuidador,
  setEmailCuidador,
}: EditPacienteContactoSectionProps) {
  return (
    <>
      {/* Sección: Contacto del Paciente */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">
          Contacto del Paciente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="contacto_px" className="text-xs">
              Teléfono
            </Label>
            <Input
              id="contacto_px"
              name="contacto_px"
              value={formData.contacto_px}
              type="tel"
              placeholder="829-123-1234"
              maxLength={12}
              onChange={(e) => {
                const formatted = handlePhoneInput(e.target.value);
                e.target.value = formatted;
                handleInputChange("contacto_px", formatted);
              }}
            />
          </div>
          <div className="flex items-end pb-1">
            <Label htmlFor="whatsapp_px" className="flex items-center gap-2 cursor-pointer text-xs">
              <Checkbox
                id="whatsapp_px"
                checked={whatsappPx}
                onCheckedChange={(checked) => setWhatsappPx(checked as boolean)}
              />
              <FontAwesomeIcon icon={faWhatsapp} className="h-5 w-5 text-green-500" />
              WhatsApp
            </Label>
          </div>
          <div className="space-y-1">
            <Label htmlFor="numero_principal" className="text-xs">
              Número Principal
            </Label>
            <Select name="numero_principal" defaultValue={paciente.numero_principal || "paciente"}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paciente">Paciente</SelectItem>
                <SelectItem value="cuidador">Cuidador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="email_px" className="text-xs">
              Correo Electrónico del Paciente
            </Label>
            <Input
              id="email_px"
              name="email_px"
              type="email"
              value={emailPx}
              onChange={(e) => setEmailPx(e.target.value)}
              placeholder="paciente@ejemplo.com"
            />
          </div>
        </div>
      </div>

      {/* Sección: Información del Cuidador */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Cuidador</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 space-y-1">
            <Label htmlFor="nombre_cuidador" className="text-xs">
              Nombre del Cuidador
            </Label>
            <Input
              id="nombre_cuidador"
              name="nombre_cuidador"
              defaultValue={paciente.nombre_cuidador || ""}
              maxLength={200}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="parentesco_cuidador" className="text-xs">
              Parentesco
            </Label>
            <Select
              name="parentesco_cuidador"
              defaultValue={paciente.parentesco_cuidador || ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hijo/a">Hijo/a</SelectItem>
                <SelectItem value="Esposo/a">Esposo/a</SelectItem>
                <SelectItem value="Madre">Madre</SelectItem>
                <SelectItem value="Padre">Padre</SelectItem>
                <SelectItem value="Hermano/a">Hermano/a</SelectItem>
                <SelectItem value="Nieto/a">Nieto/a</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="contacto_cuidador" className="text-xs">
              Teléfono
            </Label>
            <Input
              id="contacto_cuidador"
              name="contacto_cuidador"
              value={formData.contacto_cuidador}
              type="tel"
              placeholder="829-123-1234"
              maxLength={12}
              onChange={(e) => {
                const formatted = handlePhoneInput(e.target.value);
                e.target.value = formatted;
                handleInputChange("contacto_cuidador", formatted);
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <Label
              htmlFor="whatsapp_cuidador"
              className="flex items-center gap-2 cursor-pointer text-xs"
            >
              <Checkbox
                id="whatsapp_cuidador"
                checked={whatsappCuidador}
                onCheckedChange={(checked) => setWhatsappCuidador(checked as boolean)}
              />
              <FontAwesomeIcon icon={faWhatsapp} className="h-5 w-5 text-green-500" />
              WhatsApp del Cuidador
            </Label>
          </div>
          <div className="space-y-1">
            <Label htmlFor="email_cuidador" className="text-xs">
              Correo del Cuidador
            </Label>
            <Input
              id="email_cuidador"
              name="email_cuidador"
              type="email"
              value={emailCuidador}
              onChange={(e) => setEmailCuidador(e.target.value)}
              placeholder="cuidador@ejemplo.com"
            />
          </div>
        </div>
      </div>
    </>
  );
}
