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
import { differenceInYears } from "date-fns";
import { Loader2, CheckCircle2 } from "lucide-react";
import { TELEFONO_DOMINICANO_REGEX, TELEFONO_ERROR_MESSAGE } from "@/lib/validaciones";
import { BarrioCombobox } from "@/components/BarrioCombobox";
import { ZonaSelect } from "@/components/ZonaSelect";
import { useDetectarDuplicados } from "@/hooks/useDetectarDuplicados";
import { AlertaDuplicados } from "@/components/AlertaDuplicados";
import { formatPhoneDR, handlePhoneInput } from "@/lib/phoneUtils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { MedicamentosPaciente } from "@/components/MedicamentosPaciente";
import { DiasRestriccionPaciente } from "@/components/DiasRestriccionPaciente";

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
  const [selectedSexo, setSelectedSexo] = useState<string>("");
  const [fechaNacimiento, setFechaNacimiento] = useState<string>("");
  const [cedulaData, setCedulaData] = useState<any>(null);
  const [personal, setPersonal] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    cedula: "",
    nombre: "",
    apellido: "",
    contacto_px: "",
    contacto_cuidador: ""
  });
  const [esSospechoso, setEsSospechoso] = useState(false);
  const [notificacionesActivas, setNotificacionesActivas] = useState(true);
  const [whatsappPx, setWhatsappPx] = useState(false);
  const [whatsappCuidador, setWhatsappCuidador] = useState(false);
  const [diasNoVisita, setDiasNoVisita] = useState<number[]>([]);

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
      setSelectedSexo(paciente.sexo || "");
      setFechaNacimiento(paciente.fecha_nacimiento || "");
      setCedulaData(null);
      setFormData({
        cedula: paciente.cedula || "",
        nombre: paciente.nombre || "",
        apellido: paciente.apellido || "",
        contacto_px: paciente.contacto_px || "",
        contacto_cuidador: paciente.contacto_cuidador || ""
      });
      setEsSospechoso(paciente.es_sospechoso || false);
      setNotificacionesActivas(paciente.notificaciones_activas ?? true);
      setWhatsappPx(paciente.whatsapp_px || false);
      setWhatsappCuidador(paciente.whatsapp_cuidador || false);
      setDiasNoVisita(paciente.dias_no_visita || []);
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
      
      if (data) {
        if (data.success && data.nombres) {
          // La fecha ya viene formateada del edge function como "YYYY-MM-DD"
          setCedulaData(data);
          
          if (data.nombres) {
            handleInputChange('nombre', data.nombres);
          }
          if (data.apellido1) {
            handleInputChange('apellido', `${data.apellido1} ${data.apellido2 || ''}`.trim());
          }
          if (data.sexo) {
            setSelectedSexo(data.sexo);
          }
          if (data.fecha_nac) {
            setFechaNacimiento(data.fecha_nac);
          }
          
          toast.success("Datos cargados desde JCE");
        } else if (data.message) {
          toast.info(data.message);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.info("Servicio de consulta no disponible.");
    } finally {
      setLoadingCedula(false);
    }
  };

  const calculateAge = () => {
    if (!fechaNacimiento) return '';
    try {
      const years = differenceInYears(new Date(), new Date(fechaNacimiento));
      return `${years} años`;
    } catch {
      return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formDataObj = new FormData(e.currentTarget);
    
    const formValues = {
      cedula: (formDataObj.get("cedula") as string || "").trim(),
      nombre: formData.nombre.trim(),
      apellido: formData.apellido.trim(),
      contacto_px: formData.contacto_px.trim() || undefined,
      nombre_cuidador: (formDataObj.get("nombre_cuidador") as string || "").trim() || undefined,
      contacto_cuidador: formData.contacto_cuidador.trim() || undefined,
      direccion_domicilio: (formDataObj.get("direccion_domicilio") as string || "").trim() || undefined,
      barrio: selectedBarrio || undefined,
      historia_medica_basica: (formDataObj.get("historia_medica") as string || "").trim() || undefined,
    };

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

    const profesionalId = formDataObj.get("profesional_asignado_id") as string;

    const updateData = {
      cedula: formValues.cedula,
      nombre: formValues.nombre,
      apellido: formValues.apellido,
      fecha_nacimiento: fechaNacimiento || null,
      sexo: selectedSexo || null,
      contacto_px: formValues.contacto_px ? formatPhoneDR(formValues.contacto_px) : null,
      whatsapp_px: whatsappPx,
      email_px: (formDataObj.get("email_px") as string || "").trim() || null,
      nombre_cuidador: formValues.nombre_cuidador,
      parentesco_cuidador: formDataObj.get("parentesco_cuidador") as string || null,
      contacto_cuidador: formValues.contacto_cuidador ? formatPhoneDR(formValues.contacto_cuidador) : null,
      whatsapp_cuidador: whatsappCuidador,
      email_cuidador: (formDataObj.get("email_cuidador") as string || "").trim() || null,
      numero_principal: formDataObj.get("numero_principal") as any,
      direccion_domicilio: formValues.direccion_domicilio,
      zona: selectedZona as any,
      barrio: selectedBarrio,
      historia_medica_basica: formValues.historia_medica_basica,
      grado_dificultad: formDataObj.get("grado_dificultad") as any,
      tipo_atencion: formDataObj.get("tipo_atencion") as string || "domiciliario",
      profesional_asignado_id: profesionalId === 'sin-asignar' ? null : profesionalId || null,
      es_sospechoso: esSospechoso,
      notificaciones_activas: notificacionesActivas,
      status_px: formDataObj.get("status_px") as any,
      dias_no_visita: diasNoVisita,
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
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sección: Datos de Identificación */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Datos de Identificación</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label htmlFor="cedula" className="text-xs">Cédula *</Label>
                <div className="relative">
                  <Input 
                    id="cedula" 
                    name="cedula" 
                    value={formData.cedula}
                    maxLength={11}
                    required
                    onBlur={(e) => fetchCedulaData(e.target.value)}
                    disabled={loadingCedula}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      e.target.value = value;
                      handleInputChange("cedula", value);
                    }}
                    className="pr-8"
                  />
                  {loadingCedula && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  )}
                  {!loadingCedula && formData.cedula.length === 11 && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                </div>
                {loadingCedula && (
                  <div className="flex items-center gap-2 text-xs text-primary">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Consultando datos de la JCE...
                  </div>
                )}
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label htmlFor="nombre" className="text-xs">Nombre *</Label>
                <Input 
                  id="nombre" 
                  name="nombre" 
                  value={formData.nombre}
                  maxLength={100}
                  required
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="apellido" className="text-xs">Apellido *</Label>
                <Input 
                  id="apellido" 
                  name="apellido" 
                  value={formData.apellido}
                  maxLength={100}
                  required
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label htmlFor="sexo" className="text-xs">Sexo</Label>
                <Select 
                  name="sexo" 
                  value={selectedSexo}
                  onValueChange={setSelectedSexo}
                  disabled
                >
                  <SelectTrigger className="bg-muted">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="fecha_nacimiento" className="text-xs">Fecha Nacimiento</Label>
                <Input 
                  id="fecha_nacimiento" 
                  name="fecha_nacimiento" 
                  type="date"
                  value={fechaNacimiento}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Edad</Label>
                <Input 
                  readOnly
                  className="bg-muted"
                  value={calculateAge()}
                />
              </div>
              <div className="space-y-1 invisible">
                {/* Placeholder para alinear */}
              </div>
            </div>
          </div>

          {/* Sección: Contacto del Paciente */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Contacto del Paciente</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="contacto_px" className="text-xs">Teléfono</Label>
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
                <Label htmlFor="numero_principal" className="text-xs">Número Principal</Label>
                <Select name="numero_principal" defaultValue={paciente.numero_principal || 'paciente'}>
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
                <Label htmlFor="email_px" className="text-xs">Correo Electrónico del Paciente</Label>
                <Input 
                  id="email_px" 
                  name="email_px" 
                  type="email"
                  defaultValue={paciente.email_px || ''}
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
                <Label htmlFor="nombre_cuidador" className="text-xs">Nombre del Cuidador</Label>
                <Input 
                  id="nombre_cuidador" 
                  name="nombre_cuidador"
                  defaultValue={paciente.nombre_cuidador || ''}
                  maxLength={200}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="parentesco_cuidador" className="text-xs">Parentesco</Label>
                <Select name="parentesco_cuidador" defaultValue={paciente.parentesco_cuidador || ''}>
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
                <Label htmlFor="contacto_cuidador" className="text-xs">Teléfono</Label>
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
                <Label htmlFor="whatsapp_cuidador" className="flex items-center gap-2 cursor-pointer text-xs">
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
                <Label htmlFor="email_cuidador" className="text-xs">Correo del Cuidador</Label>
                <Input 
                  id="email_cuidador" 
                  name="email_cuidador" 
                  type="email"
                  defaultValue={paciente.email_cuidador || ''}
                  placeholder="cuidador@ejemplo.com"
                />
              </div>
            </div>
          </div>

          {/* Sección: Dirección */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Dirección</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="zona" className="text-xs">Municipio (zona)</Label>
                <ZonaSelect
                  value={selectedZona || ''}
                  onValueChange={(value) => {
                    setSelectedZona(value);
                    setSelectedBarrio("");
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="barrio" className="text-xs">Barrio</Label>
                <BarrioCombobox
                  zona={selectedZona}
                  value={selectedBarrio}
                  onChange={setSelectedBarrio}
                />
                <input type="hidden" name="barrio" value={selectedBarrio} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="direccion_domicilio" className="text-xs">Dirección Completa</Label>
              <Textarea 
                id="direccion_domicilio" 
                name="direccion_domicilio"
                defaultValue={paciente.direccion_domicilio || ''}
                maxLength={500}
                className="min-h-[60px]"
                placeholder="Calle, número, sector, referencias..."
              />
            </div>
          </div>

          {/* Sección: Información Médica */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Información Médica</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label htmlFor="grado_dificultad" className="text-xs">Grado de Dificultad *</Label>
                <Select name="grado_dificultad" defaultValue={paciente.grado_dificultad || 'medio'}>
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
              <div className="space-y-1">
                <Label htmlFor="tipo_atencion" className="text-xs">Tipo de Atención *</Label>
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
              <div className="space-y-1">
                <Label htmlFor="status_px" className="text-xs">Estado *</Label>
                <Select name="status_px" defaultValue={paciente.status_px || 'activo'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="fallecido">Fallecido</SelectItem>
                    <SelectItem value="renuncio">Renunció</SelectItem>
                    <SelectItem value="cambio_ars">Cambió ARS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="profesional_asignado_id" className="text-xs">Profesional</Label>
                <Select name="profesional_asignado_id" defaultValue={paciente.profesional_asignado_id || 'sin-asignar'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin-asignar">Sin asignar</SelectItem>
                    {personal.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre} {p.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="historia_medica" className="text-xs">Historia Médica</Label>
              <Textarea 
                id="historia_medica" 
                name="historia_medica"
                defaultValue={paciente.historia_medica_basica || ''}
                maxLength={2000}
                className="min-h-[80px]"
                placeholder="Diagnósticos, tratamientos, observaciones..."
              />
            </div>

            {/* Medicamentos del paciente */}
            <MedicamentosPaciente pacienteId={paciente.id} />

            {/* Días de restricción para visitas */}
            <DiasRestriccionPaciente
              diasNoVisita={diasNoVisita}
              onChange={setDiasNoVisita}
            />
          </div>

          {/* Sección: Opciones */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <Label htmlFor="es_sospechoso" className="flex items-center gap-2 cursor-pointer">
              <Checkbox 
                id="es_sospechoso" 
                checked={esSospechoso}
                onCheckedChange={(checked) => setEsSospechoso(checked as boolean)}
              />
              <span className="font-medium">Paciente Sospechoso</span>
              <span className="text-xs text-muted-foreground">
                (No ha entrado al programa pero requiere seguimiento)
              </span>
            </Label>
            <Label htmlFor="notificaciones_activas" className="flex items-center gap-2 cursor-pointer">
              <Checkbox 
                id="notificaciones_activas" 
                checked={notificacionesActivas}
                onCheckedChange={(checked) => setNotificacionesActivas(checked as boolean)}
              />
              <span className="font-medium">Recibir notificaciones por correo</span>
              <span className="text-xs text-muted-foreground">
                (Recordatorios y encuestas)
              </span>
            </Label>
          </div>

          <div className="flex gap-2 pt-4">
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
