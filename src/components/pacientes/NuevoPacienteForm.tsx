import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2 } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { addDays, format, isWeekend, differenceInYears } from "date-fns";

import { useCedulaLookup } from "@/hooks/useCedulaLookup";
import { useDetectarDuplicados } from "@/hooks/useDetectarDuplicados";
import { AlertaDuplicados } from "@/components/AlertaDuplicados";
import { ZonaSelect } from "@/components/ZonaSelect";
import { BarrioCombobox } from "@/components/BarrioCombobox";
import { DiasRestriccionPaciente } from "@/components/DiasRestriccionPaciente";
import { formatPhoneDR, handlePhoneInput } from "@/lib/phoneUtils";
import { TELEFONO_DOMINICANO_REGEX, TELEFONO_ERROR_MESSAGE } from "@/lib/validaciones";
import type { Personal } from "@/hooks/usePersonal";

// Validation schema
const pacienteSchema = z.object({
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
  fecha_nacimiento: z.string().optional(),
  contacto_px: z.string()
    .trim()
    .max(20, { message: "El contacto debe tener menos de 20 caracteres" })
    .refine(
      (val) => !val || TELEFONO_DOMINICANO_REGEX.test(val.replace(/\s+/g, '')),
      { message: TELEFONO_ERROR_MESSAGE }
    )
    .optional(),
});

interface NuevoPacienteFormProps {
  personal: Personal[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function NuevoPacienteForm({ personal, onSuccess, onCancel }: NuevoPacienteFormProps) {
  const [loading, setLoading] = useState(false);
  const { loading: loadingCedula, data: cedulaData, lookup: lookupCedula } = useCedulaLookup();
  
  const [formData, setFormData] = useState({
    cedula: "",
    nombre: "",
    apellido: "",
    contacto_px: "",
    contacto_cuidador: "",
    email_px: "",
    email_cuidador: ""
  });
  const [selectedZona, setSelectedZona] = useState<string | null>(null);
  const [selectedBarrio, setSelectedBarrio] = useState<string>("");
  const [selectedSexo, setSelectedSexo] = useState<string>("");
  const [diasNoVisita, setDiasNoVisita] = useState<number[]>([]);
  const [medicamentos, setMedicamentos] = useState<{nombre: string, dosis: string, frecuencia: string}[]>([{nombre: "", dosis: "", frecuencia: ""}]);
  const [notificacionesActivas, setNotificacionesActivas] = useState(true);
  
  // Auto-disable notifications if no email
  const hasAnyEmail = !!(formData.email_px.trim() || formData.email_cuidador.trim());

  const { duplicados } = useDetectarDuplicados(
    formData.cedula,
    formData.nombre,
    formData.apellido,
    formData.contacto_px,
    formData.contacto_cuidador
  );

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calcularFechaLlamada = (fechaBase: Date): Date => {
    let fecha = addDays(fechaBase, 2);
    while (isWeekend(fecha)) {
      fecha = addDays(fecha, 1);
    }
    return fecha;
  };

  const handleCedulaBlur = async (cedula: string) => {
    const result = await lookupCedula(cedula);
    if (result) {
      handleInputChange('nombre', result.nombres || '');
      handleInputChange('apellido', `${result.apellido1 || ''} ${result.apellido2 || ''}`.trim());
      if (result.sexo) setSelectedSexo(result.sexo);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formElement = e.currentTarget;
    const formDataObj = new FormData(formElement);
    
    const formValues = {
      cedula: (formDataObj.get("cedula") as string || "").trim(),
      nombre: (formDataObj.get("nombre") as string || "").trim(),
      apellido: (formDataObj.get("apellido") as string || "").trim(),
      fecha_nacimiento: formDataObj.get("fecha_nacimiento") as string || undefined,
      contacto_px: (formDataObj.get("contacto_px") as string || "").trim() || undefined,
    };

    try {
      pacienteSchema.parse(formValues);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => toast.error(err.message));
        setLoading(false);
        return;
      }
    }

    const gradoDificultad = (formDataObj.get("grado_dificultad") as string) || "medio";
    // zona is stored as string - cast to any to allow new municipalities not in enum yet
    const zonaValue = (selectedZona as any) || null;
    
    const latitudStr = (formDataObj.get("latitud") as string || "").trim();
    const longitudStr = (formDataObj.get("longitud") as string || "").trim();
    const latitudNum = latitudStr && !isNaN(parseFloat(latitudStr)) ? parseFloat(latitudStr) : null;
    const longitudNum = longitudStr && !isNaN(parseFloat(longitudStr)) ? parseFloat(longitudStr) : null;
    
    const dataPaciente = {
      cedula: formValues.cedula,
      nombre: formValues.nombre,
      apellido: formValues.apellido,
      fecha_nacimiento: formValues.fecha_nacimiento || null,
      sexo: formDataObj.get("sexo") as string || null,
      foto_url: cedulaData?.foto_encoded ? `data:image/jpeg;base64,${cedulaData.foto_encoded}` : null,
      contacto_px: formData.contacto_px ? formatPhoneDR(formData.contacto_px) : null,
      whatsapp_px: formDataObj.get("whatsapp_px") === "on",
      email_px: formData.email_px.trim() || null,
      nombre_cuidador: (formDataObj.get("nombre_cuidador") as string || "").trim() || null,
      parentesco_cuidador: formDataObj.get("parentesco_cuidador") as string || null,
      contacto_cuidador: formData.contacto_cuidador ? formatPhoneDR(formData.contacto_cuidador) : null,
      whatsapp_cuidador: formDataObj.get("whatsapp_cuidador") === "on",
      email_cuidador: formData.email_cuidador.trim() || null,
      numero_principal: formDataObj.get("numero_principal") as string || "paciente",
      direccion_domicilio: (formDataObj.get("direccion_domicilio") as string || "").trim() || null,
      zona: zonaValue,
      barrio: selectedBarrio || null,
      latitud: latitudNum,
      longitud: longitudNum,
      historia_medica_basica: (formDataObj.get("historia_medica_basica") as string || "").trim() || null,
      grado_dificultad: gradoDificultad as "bajo" | "medio" | "alto",
      tipo_atencion: formDataObj.get("tipo_atencion") as string || "domiciliario",
      profesional_asignado_id: formDataObj.get("profesional_asignado_id") as string || null,
      es_sospechoso: formDataObj.get("es_sospechoso") === "on",
      notificaciones_activas: hasAnyEmail ? notificacionesActivas : false,
      status_px: "activo" as const,
      dias_no_visita: diasNoVisita,
    };

    const { data: paciente, error: pacienteError } = await supabase
      .from("pacientes")
      .insert([dataPaciente])
      .select()
      .single();

    if (pacienteError) {
      toast.error(pacienteError.message);
      setLoading(false);
      return;
    }

    // Insert medications
    const medicamentosValidos = medicamentos.filter(m => m.nombre.trim() !== "");
    if (medicamentosValidos.length > 0 && paciente) {
      await supabase.from("medicamentos_paciente").insert(
        medicamentosValidos.map(med => ({
          paciente_id: paciente.id,
          nombre_medicamento: med.nombre.trim(),
          dosis: med.dosis.trim() || null,
          frecuencia: med.frecuencia.trim() || null,
        }))
      );
    }

    // Insert follow-up parameters
    const periodoLlamada = parseInt(formDataObj.get("periodo_llamada") as string) || 30;
    const periodoVisita = parseInt(formDataObj.get("periodo_visita") as string) || 90;
    
    if (paciente) {
      await supabase.from("parametros_seguimiento").insert([{
        paciente_id: paciente.id,
        periodo_llamada_ciclico: periodoLlamada,
        periodo_visita_ciclico: periodoVisita,
        fecha_proxima_llamada_prog: format(calcularFechaLlamada(new Date()), "yyyy-MM-dd"),
        fecha_proxima_visita_prog: format(addDays(new Date(), periodoVisita), "yyyy-MM-dd"),
      }]);

      // Schedule initial call
      await supabase.from("registro_llamadas").insert([{
        paciente_id: paciente.id,
        profesional_id: "b00bbfd7-6854-478f-a082-cf4b23ada61e", // Juana Reyes Feliz
        fecha_agendada: calcularFechaLlamada(new Date()).toISOString(),
        estado: "agendada",
        motivo: "Llamada inicial de seguimiento",
        duracion_estimada: 15,
      }]);
    }

    setLoading(false);
    onSuccess();
  };

  const addMedicamento = () => {
    setMedicamentos([...medicamentos, { nombre: "", dosis: "", frecuencia: "" }]);
  };

  const updateMedicamento = (index: number, field: string, value: string) => {
    const updated = [...medicamentos];
    updated[index] = { ...updated[index], [field]: value };
    setMedicamentos(updated);
  };

  const removeMedicamento = (index: number) => {
    if (medicamentos.length > 1) {
      setMedicamentos(medicamentos.filter((_, i) => i !== index));
    }
  };

  return (
    <>
      <AlertaDuplicados duplicados={duplicados} />
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identification Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Datos de Identificación</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label htmlFor="cedula" className="text-xs">Cédula *</Label>
              <div className="relative">
                <Input 
                  id="cedula" 
                  name="cedula" 
                  required 
                  maxLength={11}
                  pattern="\d{11}"
                  onBlur={(e) => handleCedulaBlur(e.target.value)}
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
                {!loadingCedula && cedulaData && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2" title="Validado con JCE">
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
              {cedulaData && !loadingCedula && (
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Datos validados con JCE
                </div>
              )}
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label htmlFor="nombre" className="text-xs">Nombre *</Label>
              <Input 
                id="nombre" 
                name="nombre" 
                required 
                value={cedulaData?.nombres || formData.nombre}
                readOnly={!!cedulaData}
                className={cedulaData ? 'bg-muted' : ''}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="apellido" className="text-xs">Apellido *</Label>
              <Input 
                id="apellido" 
                name="apellido" 
                required 
                value={cedulaData ? `${cedulaData.apellido1} ${cedulaData.apellido2}`.trim() : formData.apellido}
                readOnly={!!cedulaData}
                className={cedulaData ? 'bg-muted' : ''}
                onChange={(e) => handleInputChange("apellido", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label htmlFor="sexo" className="text-xs">Sexo</Label>
              <Select name="sexo" value={selectedSexo} onValueChange={setSelectedSexo} disabled={!!cedulaData}>
                <SelectTrigger className={cedulaData ? 'bg-muted' : ''}>
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
                defaultValue={cedulaData?.fecha_nac || ''}
                readOnly={!!cedulaData}
                className={cedulaData ? 'bg-muted' : ''}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Edad</Label>
              <Input 
                readOnly
                className="bg-muted"
                value={cedulaData?.fecha_nac ? `${differenceInYears(new Date(), new Date(cedulaData.fecha_nac))} años` : ''}
              />
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Contacto del Paciente</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="contacto_px" className="text-xs">Teléfono</Label>
              <Input 
                id="contacto_px" 
                name="contacto_px" 
                type="tel"
                placeholder="829-123-1234"
                maxLength={12}
                value={formData.contacto_px}
                onChange={(e) => {
                  const formatted = handlePhoneInput(e.target.value);
                  handleInputChange("contacto_px", formatted);
                }}
              />
            </div>
            <div className="flex items-end pb-1">
              <Label htmlFor="whatsapp_px" className="flex items-center gap-2 cursor-pointer text-xs">
                <Input id="whatsapp_px" name="whatsapp_px" type="checkbox" className="w-4 h-4" />
                <FontAwesomeIcon icon={faWhatsapp} className="h-5 w-5 text-green-500" />
                WhatsApp
              </Label>
            </div>
            <div className="space-y-1">
              <Label htmlFor="numero_principal" className="text-xs">Número Principal</Label>
              <Select name="numero_principal" defaultValue="paciente">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paciente">Paciente</SelectItem>
                  <SelectItem value="cuidador">Cuidador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="email_px" className="text-xs">Correo Electrónico</Label>
            <Input 
              id="email_px" 
              name="email_px" 
              type="email" 
              placeholder="paciente@ejemplo.com"
              value={formData.email_px}
              onChange={(e) => handleInputChange("email_px", e.target.value)}
            />
          </div>
        </div>

        {/* Caregiver Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Cuidador</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-1">
              <Label htmlFor="nombre_cuidador" className="text-xs">Nombre del Cuidador</Label>
              <Input id="nombre_cuidador" name="nombre_cuidador" maxLength={200} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="parentesco_cuidador" className="text-xs">Parentesco</Label>
              <Select name="parentesco_cuidador">
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
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
                type="tel"
                placeholder="829-123-1234"
                maxLength={12}
                value={formData.contacto_cuidador}
                onChange={(e) => {
                  const formatted = handlePhoneInput(e.target.value);
                  handleInputChange("contacto_cuidador", formatted);
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Label htmlFor="whatsapp_cuidador" className="flex items-center gap-2 cursor-pointer text-xs">
              <Input id="whatsapp_cuidador" name="whatsapp_cuidador" type="checkbox" className="w-4 h-4" />
              <FontAwesomeIcon icon={faWhatsapp} className="h-5 w-5 text-green-500" />
              WhatsApp
            </Label>
          </div>
          <div className="space-y-1">
            <Label htmlFor="email_cuidador" className="text-xs">Correo del Cuidador</Label>
            <Input 
              id="email_cuidador" 
              name="email_cuidador" 
              type="email" 
              placeholder="cuidador@ejemplo.com"
              value={formData.email_cuidador}
              onChange={(e) => handleInputChange("email_cuidador", e.target.value)}
            />
          </div>
        </div>

        {/* Address Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Dirección</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="zona" className="text-xs">Municipio (zona)</Label>
              <ZonaSelect
                value={selectedZona}
                onValueChange={(value) => {
                  setSelectedZona(value);
                  setSelectedBarrio("");
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="barrio" className="text-xs">Barrio</Label>
              <BarrioCombobox zona={selectedZona} value={selectedBarrio} onChange={setSelectedBarrio} />
              <input type="hidden" name="barrio" value={selectedBarrio} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="direccion_domicilio" className="text-xs">Dirección Completa</Label>
            <Textarea id="direccion_domicilio" name="direccion_domicilio" maxLength={500} className="min-h-[60px]" placeholder="Calle, número, sector, referencias..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="latitud" className="text-xs">Latitud (coordenada)</Label>
              <Input 
                id="latitud" 
                name="latitud" 
                type="number" 
                step="0.00000001"
                placeholder="ej: 18.4861"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="longitud" className="text-xs">Longitud (coordenada)</Label>
              <Input 
                id="longitud" 
                name="longitud" 
                type="number" 
                step="0.00000001"
                placeholder="ej: -69.9312"
              />
            </div>
          </div>
        </div>

        {/* Medical Info Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Información Médica</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label htmlFor="grado_dificultad" className="text-xs">Grado de Dificultad *</Label>
              <Select name="grado_dificultad" defaultValue="medio">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bajo">Bajo</SelectItem>
                  <SelectItem value="medio">Medio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="tipo_atencion" className="text-xs">Tipo de Atención *</Label>
              <Select name="tipo_atencion" defaultValue="domiciliario">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambulatorio">Ambulatorio</SelectItem>
                  <SelectItem value="domiciliario">Domiciliario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="profesional_asignado_id" className="text-xs">Profesional Asignado</Label>
              <Select name="profesional_asignado_id">
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {personal.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.nombre} {prof.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end pb-1">
              <Label htmlFor="es_sospechoso" className="flex items-center gap-2 cursor-pointer text-xs">
                <Input id="es_sospechoso" name="es_sospechoso" type="checkbox" className="w-4 h-4" />
                Paciente Sospechoso
              </Label>
            </div>
            <div className="flex items-end pb-1">
              <Label htmlFor="notificaciones_activas" className={`flex items-center gap-2 text-xs ${hasAnyEmail ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                <Input 
                  id="notificaciones_activas" 
                  name="notificaciones_activas" 
                  type="checkbox" 
                  className="w-4 h-4" 
                  checked={hasAnyEmail ? notificacionesActivas : false}
                  onChange={(e) => hasAnyEmail && setNotificacionesActivas(e.target.checked)}
                  disabled={!hasAnyEmail}
                />
                Notificaciones
                <span className="text-muted-foreground">
                  {hasAnyEmail ? "" : "(Requiere email)"}
                </span>
              </Label>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="historia_medica_basica" className="text-xs">Historia Médica</Label>
            <Textarea id="historia_medica_basica" name="historia_medica_basica" maxLength={2000} className="min-h-[80px]" placeholder="Diagnósticos, condiciones crónicas, alergias..." />
          </div>
        </div>

        {/* Medications Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Medicamentos</h3>
          {medicamentos.map((med, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
              <Input placeholder="Medicamento" value={med.nombre} onChange={(e) => updateMedicamento(index, 'nombre', e.target.value)} />
              <Input placeholder="Dosis" value={med.dosis} onChange={(e) => updateMedicamento(index, 'dosis', e.target.value)} />
              <Input placeholder="Frecuencia" value={med.frecuencia} onChange={(e) => updateMedicamento(index, 'frecuencia', e.target.value)} />
              <Button type="button" variant="outline" size="sm" onClick={() => removeMedicamento(index)} disabled={medicamentos.length === 1}>Quitar</Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addMedicamento}>+ Agregar Medicamento</Button>
        </div>

        {/* Follow-up Config Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Configuración de Seguimiento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="periodo_llamada" className="text-xs">Período de Llamadas (días)</Label>
              <Input id="periodo_llamada" name="periodo_llamada" type="number" defaultValue={30} min={1} max={365} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="periodo_visita" className="text-xs">Período de Visitas (días)</Label>
              <Input id="periodo_visita" name="periodo_visita" type="number" defaultValue={90} min={1} max={730} />
            </div>
          </div>
          <DiasRestriccionPaciente diasNoVisita={diasNoVisita} onChange={setDiasNoVisita} />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Paciente
          </Button>
        </div>
      </form>
    </>
  );
}
