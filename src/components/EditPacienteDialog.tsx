import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { TELEFONO_DOMINICANO_REGEX, TELEFONO_ERROR_MESSAGE } from "@/lib/validaciones";
import { BarrioCombobox } from "@/components/BarrioCombobox";
import { useDetectarDuplicados } from "@/hooks/useDetectarDuplicados";
import { AlertaDuplicados } from "@/components/AlertaDuplicados";
import { formatPhoneDR, handlePhoneInput } from "@/lib/phoneUtils";

// Validation schema
const editPacienteSchema = z.object({
  cedula: z.string()
    .trim()
    .length(11, { message: "La cédula debe tener exactamente 11 dígitos" })
    .regex(/^\d+$/, { message: "La cédula solo debe contener números" }),
  nombre: z.string()
    .trim()
    .min(1, { message: "El nombre es requerido" })
    .max(100, { message: "El nombre debe tener menos de 100 caracteres" }),
  apellido: z.string()
    .trim()
    .min(1, { message: "El apellido es requerido" })
    .max(100, { message: "El apellido debe tener menos de 100 caracteres" }),
  contacto_px: z.string()
    .trim()
    .max(20, { message: "El contacto debe tener menos de 20 caracteres" })
    .refine(
      (val) => !val || TELEFONO_DOMINICANO_REGEX.test(val.replace(/\s+/g, '')),
      { message: TELEFONO_ERROR_MESSAGE }
    )
    .optional(),
  nombre_cuidador: z.string()
    .trim()
    .max(200, { message: "El nombre del cuidador debe tener menos de 200 caracteres" })
    .optional(),
  contacto_cuidador: z.string()
    .trim()
    .max(20, { message: "El contacto debe tener menos de 20 caracteres" })
    .refine(
      (val) => !val || TELEFONO_DOMINICANO_REGEX.test(val.replace(/\s+/g, '')),
      { message: TELEFONO_ERROR_MESSAGE }
    )
    .optional(),
  direccion_domicilio: z.string()
    .trim()
    .max(500, { message: "La dirección debe tener menos de 500 caracteres" })
    .optional(),
  barrio: z.string()
    .trim()
    .max(100, { message: "El barrio debe tener menos de 100 caracteres" })
    .optional(),
  historia_medica_basica: z.string()
    .trim()
    .max(2000, { message: "La historia médica debe tener menos de 2000 caracteres" })
    .optional(),
});

interface EditPacienteDialogProps {
  paciente: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditPacienteDialog({ paciente, open, onOpenChange, onSuccess }: EditPacienteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingCedula, setLoadingCedula] = useState(false);
  const [selectedZona, setSelectedZona] = useState<string | null>(null);
  const [selectedBarrio, setSelectedBarrio] = useState<string>("");
  const [cedulaData, setCedulaData] = useState<any>(null);
  const [personal, setPersonal] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    cedula: "",
    nombre: "",
    apellido: "",
    contacto_px: "",
    contacto_cuidador: ""
  });

  const { duplicados } = useDetectarDuplicados(
    formData.cedula,
    formData.nombre,
    formData.apellido,
    formData.contacto_px,
    formData.contacto_cuidador,
    paciente?.id
  );

  useEffect(() => {
    if (paciente && open) {
      setSelectedZona(paciente.zona || null);
      setSelectedBarrio(paciente.barrio || "");
      setFormData({
        cedula: paciente.cedula || "",
        nombre: paciente.nombre || "",
        apellido: paciente.apellido || "",
        contacto_px: paciente.contacto_px || "",
        contacto_cuidador: paciente.contacto_cuidador || ""
      });
      fetchPersonal();
    }
  }, [paciente, open]);

  const fetchPersonal = async () => {
    const { data } = await supabase
      .from("personal_salud")
      .select("*")
      .eq("activo", true)
      .in("especialidad", ["Médico", "Enfermera", "Medico Internista"])
      .order("nombre", { ascending: true });
    setPersonal(data || []);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const fetchCedulaData = async (cedula: string) => {
    const cedulaLimpia = cedula.replace(/\D/g, '');
    if (cedulaLimpia.length !== 11) return;
    
    setLoadingCedula(true);
    try {
      const { data, error } = await supabase.functions.invoke('consultar-cedula', {
        body: { cedula: cedulaLimpia }
      });

      if (error) throw error;
      if (data && data.success) {
        // Convertir formato de fecha de "9/20/1984 12:00:00 AM" a "1984-09-20"
        let formattedDate = '';
        if (data.fecha_nac) {
          const dateParts = data.fecha_nac.split(' ')[0].split('/');
          formattedDate = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`;
        }
        
        setCedulaData({
          ...data,
          fecha_nac: formattedDate
        });
        
        // Actualizar los campos del formulario automáticamente
        const nombreInput = document.getElementById('nombre') as HTMLInputElement;
        const apellidoInput = document.getElementById('apellido') as HTMLInputElement;
        const fechaNacInput = document.getElementById('fecha_nacimiento') as HTMLInputElement;
        
        if (nombreInput) nombreInput.value = data.nombres || '';
        if (apellidoInput) apellidoInput.value = `${data.apellido1} ${data.apellido2}`.trim();
        if (fechaNacInput) fechaNacInput.value = formattedDate;
        
        handleInputChange('nombre', data.nombres || '');
        handleInputChange('apellido', `${data.apellido1} ${data.apellido2}`.trim());
        
        toast.success("Datos cargados desde JCE");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("No se pudo consultar la cédula");
    } finally {
      setLoadingCedula(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    // Prepare data for validation
    const formValues = {
      cedula: (formData.get("cedula") as string || "").trim(),
      nombre: (formData.get("nombre") as string || "").trim(),
      apellido: (formData.get("apellido") as string || "").trim(),
      contacto_px: (formData.get("contacto_px") as string || "").trim() || undefined,
      nombre_cuidador: (formData.get("nombre_cuidador") as string || "").trim() || undefined,
      contacto_cuidador: (formData.get("contacto_cuidador") as string || "").trim() || undefined,
      direccion_domicilio: (formData.get("direccion_domicilio") as string || "").trim() || undefined,
      barrio: (formData.get("barrio") as string || "").trim() || undefined,
      historia_medica_basica: (formData.get("historia_medica") as string || "").trim() || undefined,
    };

    // Validate input
    try {
      editPacienteSchema.parse(formValues);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message);
        });
        setLoading(false);
        return;
      }
    }

    const updateData = {
      cedula: formValues.cedula,
      nombre: formValues.nombre,
      apellido: formValues.apellido,
      sexo: formData.get("sexo") as string || null,
      contacto_px: formValues.contacto_px ? formatPhoneDR(formValues.contacto_px) : null,
      whatsapp_px: formData.get("whatsapp_px") === "on",
      nombre_cuidador: formValues.nombre_cuidador,
      parentesco_cuidador: formData.get("parentesco_cuidador") as string || null,
      contacto_cuidador: formValues.contacto_cuidador ? formatPhoneDR(formValues.contacto_cuidador) : null,
      whatsapp_cuidador: formData.get("whatsapp_cuidador") === "on",
      numero_principal: formData.get("numero_principal") as any,
      direccion_domicilio: formValues.direccion_domicilio,
      barrio: formValues.barrio,
      historia_medica_basica: formValues.historia_medica_basica,
      zona: formData.get("zona") as any,
      grado_dificultad: formData.get("grado_dificultad") as any,
      tipo_atencion: formData.get("tipo_atencion") as string || "domiciliario",
      status_px: formData.get("status_px") as any,
    };

    const { error } = await supabase
      .from("pacientes")
      .update(updateData)
      .eq("id", paciente.id);

    if (error) {
      toast.error("Error al actualizar paciente");
    } else {
      toast.success("Paciente actualizado exitosamente");
      onSuccess();
      onOpenChange(false);
    }
    setLoading(false);
  };

  if (!paciente) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Paciente</DialogTitle>
        </DialogHeader>
        
        <AlertaDuplicados duplicados={duplicados} />
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cedula">Cédula *</Label>
              <Input 
                id="cedula" 
                name="cedula" 
                defaultValue={paciente.cedula} 
                maxLength={11}
                required
                onBlur={(e) => fetchCedulaData(e.target.value)}
                disabled={loadingCedula}
                onChange={(e) => handleInputChange("cedula", e.target.value)}
              />
              {loadingCedula && <p className="text-xs text-muted-foreground">Consultando JCE...</p>}
            </div>
          <div className="space-y-2">
            <Label htmlFor="fecha_nacimiento">Fecha Nacimiento</Label>
            <Input 
              id="fecha_nacimiento" 
              name="fecha_nacimiento" 
              type="date"
              defaultValue={paciente.fecha_nacimiento || ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input 
              id="nombre" 
              name="nombre" 
              defaultValue={paciente.nombre}
              maxLength={100}
              required
              onChange={(e) => handleInputChange("nombre", e.target.value)}
            />
          </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido *</Label>
              <Input 
                id="apellido" 
                name="apellido" 
                defaultValue={paciente.apellido}
                maxLength={100}
                required
                onChange={(e) => handleInputChange("apellido", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sexo">Sexo</Label>
              <Select name="sexo" defaultValue={paciente.sexo || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sexo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contacto_px">Contacto Paciente</Label>
              <Input 
                id="contacto_px" 
                name="contacto_px" 
                defaultValue={paciente.contacto_px || ''} 
                type="tel"
                placeholder="829-123-1234"
                maxLength={12}
                onChange={(e) => {
                  const formatted = handlePhoneInput(e.target.value);
                  e.target.value = formatted;
                  handleInputChange("contacto_px", formatted);
                }}
              />
              <p className="text-xs text-muted-foreground">Formato: 829-123-1234</p>
            </div>
            <div className="space-y-2 flex items-end pb-2">
              <Label htmlFor="whatsapp_px" className="flex items-center gap-2 cursor-pointer">
                <Checkbox 
                  id="whatsapp_px" 
                  name="whatsapp_px" 
                  defaultChecked={paciente.whatsapp_px}
                />
                Tiene WhatsApp
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contacto_cuidador">Contacto Cuidador</Label>
              <Input 
                id="contacto_cuidador" 
                name="contacto_cuidador" 
                defaultValue={paciente.contacto_cuidador || ''} 
                type="tel"
                placeholder="Ej: 809-123-4567"
                maxLength={20}
                onChange={(e) => handleInputChange("contacto_cuidador", e.target.value)}
              />
            </div>
            <div className="space-y-2 flex items-end pb-2">
              <Label htmlFor="whatsapp_cuidador" className="flex items-center gap-2 cursor-pointer">
                <Checkbox 
                  id="whatsapp_cuidador" 
                  name="whatsapp_cuidador" 
                  defaultChecked={paciente.whatsapp_cuidador}
                />
                Tiene WhatsApp
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numero_principal">Número Principal de Contacto</Label>
            <Select name="numero_principal" defaultValue={paciente.numero_principal || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar número principal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paciente">Paciente</SelectItem>
                <SelectItem value="cuidador">Cuidador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status_px">Estado</Label>
              <Select name="status_px" defaultValue={paciente.status_px}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zona">Zona</Label>
              <Select 
                name="zona" 
                defaultValue={paciente.zona || ''}
                onValueChange={(value) => {
                  setSelectedZona(value);
                  setSelectedBarrio(""); // Reset barrio cuando cambia zona
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar zona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="santo_domingo_oeste">SD Oeste</SelectItem>
                  <SelectItem value="santo_domingo_este">SD Este</SelectItem>
                  <SelectItem value="santo_domingo_norte">SD Norte</SelectItem>
                  <SelectItem value="distrito_nacional">Distrito Nacional</SelectItem>
                  <SelectItem value="san_luis">San Luis</SelectItem>
                  <SelectItem value="los_alcarrizos">Los Alcarrizos</SelectItem>
                  <SelectItem value="boca_chica">Boca Chica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barrio">Barrio</Label>
              <BarrioCombobox
                zona={selectedZona}
                value={selectedBarrio}
                onChange={setSelectedBarrio}
              />
              <input type="hidden" name="barrio" value={selectedBarrio} />
              {!selectedZona && (
                <p className="text-xs text-muted-foreground">
                  Seleccione una zona primero
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="grado_dificultad">Grado de Dificultad</Label>
              <Select name="grado_dificultad" defaultValue={paciente.grado_dificultad}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bajo">Bajo</SelectItem>
                  <SelectItem value="medio">Medio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo_atencion">Tipo de Atención</Label>
              <Select name="tipo_atencion" defaultValue={paciente.tipo_atencion || 'domiciliario'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambulatorio">Ambulatorio</SelectItem>
                  <SelectItem value="domiciliario">Domiciliario</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profesional_asignado_id">Profesional Asignado</Label>
            <Select name="profesional_asignado_id" defaultValue={paciente.profesional_asignado_id || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar profesional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin asignar</SelectItem>
                {personal.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre} {p.apellido} - {p.especialidad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre_cuidador">Nombre del Cuidador</Label>
            <Input 
              id="nombre_cuidador" 
              name="nombre_cuidador" 
              defaultValue={paciente.nombre_cuidador || ''}
              placeholder="Nombre completo del cuidador"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion_domicilio">Dirección Completa</Label>
            <Textarea
              id="direccion_domicilio" 
              name="direccion_domicilio" 
              defaultValue={paciente.direccion_domicilio || ''}
              placeholder="Calle, número, sector, referencias..."
              rows={2}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="historia_medica">Historia Médica Básica</Label>
            <Textarea 
              id="historia_medica" 
              name="historia_medica" 
              defaultValue={paciente.historia_medica_basica || ''}
              placeholder="Resumen de condiciones médicas relevantes, alergias, cirugías previas..."
              rows={3}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              Máximo 2000 caracteres
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}