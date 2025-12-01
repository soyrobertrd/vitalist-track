import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, MapPin, Upload, Filter, Calendar, PhoneCall, Loader2, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PacienteDetailDialog } from "@/components/PacienteDetailDialog";
import { ImportPacientesDialog } from "@/components/ImportPacientesDialog";
import { EditPacienteDialog } from "@/components/EditPacienteDialog";
import { NearbyPatientsRecommendation } from "@/components/NearbyPatientsRecommendation";
import { DetectarDuplicadosDialog } from "@/components/DetectarDuplicadosDialog";
import { addDays, format, isWeekend, differenceInYears } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { z } from "zod";
import { TELEFONO_DOMINICANO_REGEX, TELEFONO_ERROR_MESSAGE } from "@/lib/validaciones";
import { BarrioCombobox } from "@/components/BarrioCombobox";
import { ZonaSelect } from "@/components/ZonaSelect";
import { useDetectarDuplicados } from "@/hooks/useDetectarDuplicados";
import { AlertaDuplicados } from "@/components/AlertaDuplicados";
import { AgendarLlamadaDialog } from "@/components/AgendarLlamadaDialog";
import { MobileFilters } from "@/components/MobileFilters";
import { formatPhoneDR, handlePhoneInput } from "@/lib/phoneUtils";
import { useOGTICZonas } from "@/hooks/useOGTICZonas";
import { useIsMobile } from "@/hooks/use-mobile";

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
  whatsapp_px: z.boolean().optional(),
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
  whatsapp_cuidador: z.boolean().optional(),
  numero_principal: z.enum(["paciente", "cuidador"]).optional(),
  direccion_domicilio: z.string()
    .trim()
    .max(500, { message: "La dirección debe tener menos de 500 caracteres" })
    .optional(),
  zona: z.enum(["santo_domingo_oeste", "santo_domingo_este", "santo_domingo_norte", "distrito_nacional"]).optional(),
  barrio: z.string()
    .trim()
    .max(100, { message: "El barrio debe tener menos de 100 caracteres" })
    .optional(),
  grado_dificultad: z.enum(["bajo", "medio", "alto"]),
  historia_medica_basica: z.string()
    .trim()
    .max(2000, { message: "La historia médica debe tener menos de 2000 caracteres" })
    .optional(),
  periodo_llamada_ciclico: z.number().min(1).max(365),
  periodo_visita_ciclico: z.number().min(1).max(730),
});

interface Paciente {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string | null;
  contacto_px: string | null;
  status_px: string;
  grado_dificultad: string;
  zona: string | null;
  barrio: string | null;
}

const Pacientes = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);
  const [selectedPaciente, setSelectedPaciente] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCedula, setLoadingCedula] = useState(false);
  const { zonas, loading: zonasLoading } = useOGTICZonas();
  const { isAdmin } = useUserRole();
  const isMobile = useIsMobile();
  const [cedulaData, setCedulaData] = useState<{
    nombres?: string;
    apellido1?: string;
    apellido2?: string;
    fecha_nac?: string;
    sexo?: string;
    foto_encoded?: string;
  } | null>(null);
  const [medicamentos, setMedicamentos] = useState<string[]>([""]);
  const [selectedZona, setSelectedZona] = useState<string | null>(null);
  const [selectedBarrio, setSelectedBarrio] = useState<string>("");
  const [selectedSexo, setSelectedSexo] = useState<string>("");
  const [filters, setFilters] = useState({
    status: "todos",
    zona: "todos",
    grado: "todos",
    busqueda: "",
    barrio: "todos",
    tipo: "todos" // todos, regulares, sospechosos
  });
  const [agendarLlamadaOpen, setAgendarLlamadaOpen] = useState(false);
  const [agendarVisitaOpen, setAgendarVisitaOpen] = useState(false);
  const [pacienteParaAgendar, setPacienteParaAgendar] = useState<string | null>(null);
  const [personal, setPersonal] = useState<any[]>([]);
  const [newPacienteData, setNewPacienteData] = useState({
    cedula: "",
    nombre: "",
    apellido: "",
    contacto_px: "",
    contacto_cuidador: ""
  });

  const { duplicados } = useDetectarDuplicados(
    newPacienteData.cedula,
    newPacienteData.nombre,
    newPacienteData.apellido,
    newPacienteData.contacto_px,
    newPacienteData.contacto_cuidador
  );

  const handleNewPacienteInputChange = (field: string, value: string) => {
    setNewPacienteData(prev => ({ ...prev, [field]: value }));
  };

  const fetchPacientes = async () => {
    const { data, error } = await supabase
      .from("pacientes")
      .select("*")
      .neq("status_px", "inactivo") // Excluir pacientes inactivos por defecto
      .order("nombre", { ascending: true });

    if (error) {
      toast.error("Error al cargar pacientes");
    } else {
      setPacientes(data || []);
    }
  };

  const filteredPacientes = pacientes.filter((p: any) => {
    if (filters.status !== "todos" && p.status_px !== filters.status) return false;
    if (filters.zona !== "todos" && p.zona !== filters.zona) return false;
    if (filters.grado !== "todos" && p.grado_dificultad !== filters.grado) return false;
    if (filters.barrio !== "todos" && p.barrio !== filters.barrio) return false;
    if (filters.tipo === "sospechosos" && !p.es_sospechoso) return false;
    if (filters.tipo === "regulares" && p.es_sospechoso) return false;
    if (filters.busqueda) {
      const busqueda = filters.busqueda.toLowerCase();
      const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase();
      const cedula = p.cedula.toLowerCase();
      if (!nombreCompleto.includes(busqueda) && !cedula.includes(busqueda)) return false;
    }
    return true;
  });

  useEffect(() => {
    fetchPacientes();
    fetchPersonal();
  }, []);
  
  const fetchPersonal = async () => {
    const { data } = await supabase
      .from("personal_salud")
      .select("*")
      .eq("activo", true)
      .in("especialidad", ["Médico", "Enfermera", "Medico Internista", "Enfermera"]) // Excluir administradores
      .order("nombre", { ascending: true });
    setPersonal(data || []);
  };

  const fetchCedulaData = async (cedula: string) => {
    // Validar que solo contenga números y tenga 11 dígitos
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
          
          // Auto-fill form fields
          if (data.nombres) {
            handleNewPacienteInputChange('nombre', data.nombres);
          }
          if (data.apellido1) {
            handleNewPacienteInputChange('apellido', `${data.apellido1} ${data.apellido2 || ''}`.trim());
          }
          
          // Mapear sexo de la API ("M" o "F") al valor del formulario
          if (data.sexo) {
            setSelectedSexo(data.sexo);
          }
          
          toast.success("Datos cargados desde JCE");
        } else if (data.message) {
          // API unavailable or no data - allow manual entry
          toast.info(data.message);
        }
      }
    } catch (error) {
      console.error("Error fetching cedula data:", error);
      toast.info("Servicio de consulta no disponible. Ingrese los datos manualmente.");
    } finally {
      setLoadingCedula(false);
    }
  };

  const calcularFechaLlamada = (fechaBase: Date): Date => {
    let fecha = addDays(fechaBase, 2);
    
    // Si cae en fin de semana, mover al lunes
    while (isWeekend(fecha)) {
      fecha = addDays(fecha, 1);
    }
    
    return fecha;
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
      fecha_nacimiento: formData.get("fecha_nacimiento") as string || undefined,
      contacto_px: (formData.get("contacto_px") as string || "").trim() || undefined,
      whatsapp_px: formData.get("whatsapp_px") === "on",
      nombre_cuidador: (formData.get("nombre_cuidador") as string || "").trim() || undefined,
      contacto_cuidador: (formData.get("contacto_cuidador") as string || "").trim() || undefined,
      whatsapp_cuidador: formData.get("whatsapp_cuidador") === "on",
      numero_principal: (formData.get("numero_principal") as any) || undefined,
      direccion_domicilio: (formData.get("direccion_domicilio") as string || "").trim() || undefined,
      zona: (formData.get("zona") as any) || undefined,
      barrio: (formData.get("barrio") as string || "").trim() || undefined,
      grado_dificultad: (formData.get("grado_dificultad") as any) || "medio",
      historia_medica_basica: (formData.get("historia_medica") as string || "").trim() || undefined,
      periodo_llamada_ciclico: parseInt(formData.get("periodo_llamada") as string) || 30,
      periodo_visita_ciclico: parseInt(formData.get("periodo_visita") as string) || 90,
    };

    // Validate input
    try {
      pacienteSchema.parse(formValues);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message);
        });
        setLoading(false);
        return;
      }
    }

    const dataPaciente = {
      cedula: formValues.cedula,
      nombre: formValues.nombre,
      apellido: formValues.apellido,
      fecha_nacimiento: formValues.fecha_nacimiento,
      sexo: formData.get("sexo") as string || null,
      foto_url: cedulaData?.foto_encoded ? `data:image/jpeg;base64,${cedulaData.foto_encoded}` : null,
      contacto_px: formValues.contacto_px ? formatPhoneDR(formValues.contacto_px) : null,
      whatsapp_px: formValues.whatsapp_px,
      nombre_cuidador: formValues.nombre_cuidador,
      parentesco_cuidador: formData.get("parentesco_cuidador") as string || null,
      contacto_cuidador: formValues.contacto_cuidador ? formatPhoneDR(formValues.contacto_cuidador) : null,
      whatsapp_cuidador: formValues.whatsapp_cuidador,
      numero_principal: formValues.numero_principal,
      direccion_domicilio: formValues.direccion_domicilio,
      zona: formValues.zona,
      barrio: formValues.barrio,
      historia_medica_basica: formValues.historia_medica_basica,
      grado_dificultad: formValues.grado_dificultad,
      tipo_atencion: formData.get("tipo_atencion") as string || "domiciliario",
      profesional_asignado_id: formData.get("profesional_asignado_id") as string || null,
      es_sospechoso: formData.get("es_sospechoso") === "on",
      status_px: "activo" as any,
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

    // Insertar medicamentos
    const medicamentosValidos = medicamentos.filter(m => m.trim() !== "");
    if (medicamentosValidos.length > 0 && paciente) {
      const medicamentosData = medicamentosValidos.map(med => ({
        paciente_id: paciente.id,
        nombre_medicamento: med,
      }));
      
      await supabase.from("medicamentos_paciente").insert(medicamentosData);
    }

    // Insertar parámetros de seguimiento
    if (paciente) {
      await supabase.from("parametros_seguimiento").insert([{
        paciente_id: paciente.id,
        periodo_llamada_ciclico: formValues.periodo_llamada_ciclico,
        periodo_visita_ciclico: formValues.periodo_visita_ciclico,
        fecha_proxima_llamada_prog: format(calcularFechaLlamada(new Date()), "yyyy-MM-dd"),
        fecha_proxima_visita_prog: format(addDays(new Date(), formValues.periodo_visita_ciclico), "yyyy-MM-dd"),
      }]);

      // Agendar llamada automáticamente y asignarla a Juana Reyes Feliz
      const fechaLlamada = calcularFechaLlamada(new Date());
      await supabase.from("registro_llamadas").insert([{
        paciente_id: paciente.id,
        profesional_id: "b00bbfd7-6854-478f-a082-cf4b23ada61e", // Juana Reyes Feliz
        fecha_agendada: fechaLlamada.toISOString(),
        estado: "agendada" as any,
        motivo: "Llamada inicial de seguimiento",
        duracion_estimada: 15,
      }]);

      toast.success("Paciente agregado exitosamente con llamada agendada");
    }

    setOpen(false);
    fetchPacientes();
    setMedicamentos([""]);
    (e.target as HTMLFormElement).reset();
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "activo":
        return "bg-success text-success-foreground";
      case "inactivo":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-destructive text-destructive-foreground";
    }
  };

  const capitalizeStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getDificultadColor = (dificultad: string) => {
    switch (dificultad) {
      case "bajo":
        return "bg-secondary text-secondary-foreground";
      case "medio":
        return "bg-warning text-warning-foreground";
      case "alto":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground">Gestión de pacientes del programa</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Importar
              </Button>
              <DetectarDuplicadosDialog />
            </>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Paciente</DialogTitle>
              </DialogHeader>
              
              <AlertaDuplicados duplicados={duplicados} />
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sección: Información de JCE */}
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
                          onBlur={(e) => fetchCedulaData(e.target.value)}
                          disabled={loadingCedula}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            e.target.value = value;
                            handleNewPacienteInputChange("cedula", value);
                          }}
                          className="pr-8"
                        />
                        {loadingCedula && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          </div>
                        )}
                        {!loadingCedula && newPacienteData.cedula.length === 11 && (
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
                        required 
                        value={cedulaData?.nombres || ''}
                        readOnly={!!cedulaData}
                        className={cedulaData ? 'bg-muted' : ''}
                        onChange={(e) => handleNewPacienteInputChange("nombre", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="apellido" className="text-xs">Apellido *</Label>
                      <Input 
                        id="apellido" 
                        name="apellido" 
                        required 
                        value={cedulaData ? `${cedulaData.apellido1} ${cedulaData.apellido2}`.trim() : ''}
                        readOnly={!!cedulaData}
                        className={cedulaData ? 'bg-muted' : ''}
                        onChange={(e) => handleNewPacienteInputChange("apellido", e.target.value)}
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
                        disabled={!!cedulaData}
                      >
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
                        value={cedulaData?.fecha_nac || ''}
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
                    <div className="space-y-1 invisible">
                      {/* Placeholder para alinear */}
                    </div>
                  </div>
                </div>

                {/* Sección: Información de Contacto */}
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
                        value={newPacienteData.contacto_px}
                        onChange={(e) => {
                          const formatted = handlePhoneInput(e.target.value);
                          e.target.value = formatted;
                          handleNewPacienteInputChange("contacto_px", formatted);
                        }}
                      />
                    </div>
                    <div className="flex items-end pb-1">
                      <Label htmlFor="whatsapp_px" className="flex items-center gap-2 cursor-pointer text-xs">
                        <Input 
                          id="whatsapp_px" 
                          name="whatsapp_px" 
                          type="checkbox" 
                          className="w-4 h-4"
                        />
                        <FontAwesomeIcon icon={faWhatsapp} className="h-5 w-5 text-green-500" />
                        WhatsApp
                      </Label>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="numero_principal" className="text-xs">Número Principal</Label>
                      <Select name="numero_principal" defaultValue="paciente">
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
                        maxLength={200}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="parentesco_cuidador" className="text-xs">Parentesco</Label>
                      <Select name="parentesco_cuidador">
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
                      <div className="flex gap-2">
                        <Input 
                          id="contacto_cuidador" 
                          name="contacto_cuidador" 
                          type="tel"
                          placeholder="829-123-1234"
                          maxLength={12}
                          value={newPacienteData.contacto_cuidador}
                          onChange={(e) => {
                            const formatted = handlePhoneInput(e.target.value);
                            e.target.value = formatted;
                            handleNewPacienteInputChange("contacto_cuidador", formatted);
                          }}
                          className="flex-1"
                        />
                      </div>
                      <div className="flex items-end pb-1">
                        <Label htmlFor="whatsapp_cuidador" className="flex items-center gap-2 cursor-pointer text-xs">
                          <Input 
                            id="whatsapp_cuidador" 
                            name="whatsapp_cuidador" 
                            type="checkbox" 
                            className="w-4 h-4"
                          />
                          <FontAwesomeIcon icon={faWhatsapp} className="h-5 w-5 text-green-500" />
                          WhatsApp
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección: Ubicación */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Dirección</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="zona" className="text-xs">Zona</Label>
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
                      <Select name="grado_dificultad" defaultValue="medio">
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
                      <Select name="tipo_atencion" defaultValue="domiciliario">
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
                      <Label htmlFor="profesional_asignado_id" className="text-xs">Profesional Asignado</Label>
                      <Select name="profesional_asignado_id">
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
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
                        <Input 
                          id="es_sospechoso" 
                          name="es_sospechoso" 
                          type="checkbox" 
                          className="w-4 h-4"
                        />
                        Paciente Sospechoso
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="historia_medica_basica" className="text-xs">Historia Médica</Label>
                    <Textarea 
                      id="historia_medica_basica" 
                      name="historia_medica_basica"
                      maxLength={2000}
                      className="min-h-[80px]"
                      placeholder="Diagnósticos, tratamientos, observaciones..."
                    />
                  </div>
                </div>

                {/* Sección: Configuración de Seguimiento */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Configuración de Seguimiento</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="periodo_llamada" className="text-xs">Llamadas cada (días) *</Label>
                      <Input 
                        id="periodo_llamada" 
                        name="periodo_llamada" 
                        type="number" 
                        defaultValue="30"
                        min="1"
                        max="365"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="periodo_visita" className="text-xs">Visitas cada (días) *</Label>
                      <Input 
                        id="periodo_visita" 
                        name="periodo_visita" 
                        type="number" 
                        defaultValue="90"
                        min="1"
                        max="730"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Medicamentos</Label>
                  {medicamentos.map((med, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={med}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length <= 200) {
                            const newMeds = [...medicamentos];
                            newMeds[index] = value;
                            setMedicamentos(newMeds);
                          }
                        }}
                        placeholder="Nombre del medicamento"
                        maxLength={200}
                      />
                      {index === medicamentos.length - 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setMedicamentos([...medicamentos, ""])}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar Paciente"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <div className="lg:block hidden">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Búsqueda</label>
                <Input
                  placeholder="Nombre o cédula..."
                  value={filters.busqueda}
                  onChange={(e) => setFilters({ ...filters, busqueda: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select value={filters.tipo} onValueChange={(v) => setFilters({ ...filters, tipo: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="regulares">Regulares</SelectItem>
                    <SelectItem value="sospechosos">Sospechosos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="fallecido">Fallecido</SelectItem>
                    <SelectItem value="renuncio">Renunció</SelectItem>
                    <SelectItem value="cambio_ars">Cambió ARS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Zona</label>
                <Select value={filters.zona} onValueChange={(v) => setFilters({ ...filters, zona: v })} disabled={zonasLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={zonasLoading ? "Cargando..." : "Seleccionar"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    {zonas.map((zona) => (
                      <SelectItem key={zona.value} value={zona.value}>
                        {zona.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Grado Dificultad</label>
                <Select value={filters.grado} onValueChange={(v) => setFilters({ ...filters, grado: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="bajo">Bajo</SelectItem>
                    <SelectItem value="medio">Medio</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Barrio</label>
                <Select value={filters.barrio} onValueChange={(v) => setFilters({ ...filters, barrio: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {[...new Set(pacientes.map(p => p.barrio).filter(Boolean))].sort().map(barrio => (
                      <SelectItem key={barrio} value={barrio!}>{barrio}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros móviles */}
      <div className="lg:hidden">
        <MobileFilters title="Filtros de Pacientes">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Búsqueda</label>
              <Input
                placeholder="Nombre o cédula..."
                value={filters.busqueda}
                onChange={(e) => setFilters({ ...filters, busqueda: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="fallecido">Fallecido</SelectItem>
                  <SelectItem value="renuncio">Renunció</SelectItem>
                  <SelectItem value="cambio_ars">Cambió ARS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Zona</label>
              <Select value={filters.zona} onValueChange={(v) => setFilters({ ...filters, zona: v })} disabled={zonasLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={zonasLoading ? "Cargando..." : "Seleccionar"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {zonas.map((zona) => (
                    <SelectItem key={zona.value} value={zona.value}>
                      {zona.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Grado Dificultad</label>
              <Select value={filters.grado} onValueChange={(v) => setFilters({ ...filters, grado: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="bajo">Bajo</SelectItem>
                  <SelectItem value="medio">Medio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Barrio</label>
              <Select value={filters.barrio} onValueChange={(v) => setFilters({ ...filters, barrio: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {[...new Set(pacientes.map(p => p.barrio).filter(Boolean))].sort().map(barrio => (
                    <SelectItem key={barrio} value={barrio!}>{barrio}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </MobileFilters>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPacientes.map((paciente) => (
          <Card 
            key={paciente.id} 
            className="hover:bg-accent transition-colors flex flex-col h-full"
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle 
                  className="text-lg cursor-pointer flex-1"
                  onClick={() => {
                    setSelectedPacienteId(paciente.id);
                    setDetailOpen(true);
                  }}
                >
                  {paciente.nombre} {paciente.apellido}
                </CardTitle>
                <div className="flex gap-2 items-center">
                  <Badge className={getStatusColor(paciente.status_px)}>
                    {capitalizeStatus(paciente.status_px)}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPacienteParaAgendar(paciente.id);
                      setAgendarLlamadaOpen(true);
                    }}
                    title="Agendar llamada"
                  >
                    <PhoneCall className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPacienteParaAgendar(paciente.id);
                      setAgendarVisitaOpen(true);
                    }}
                    title="Agendar visita"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPaciente(paciente);
                      setEditOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {isAdmin && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`¿Está seguro de eliminar a ${paciente.nombre} ${paciente.apellido}? Esta acción no se puede deshacer.`)) {
                          const { error } = await supabase
                            .from("pacientes")
                            .delete()
                            .eq("id", paciente.id);
                          if (error) {
                            toast.error("Error al eliminar paciente");
                          } else {
                            toast.success("Paciente eliminado");
                            fetchPacientes();
                          }
                        }
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Cédula:</span> {paciente.cedula}
              </p>
              {paciente.contacto_px && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <a
                    href={`tel:${(paciente.contacto_px || '').replace(/\D/g, '')}`}
                    className="no-underline hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Llamar a ${paciente.nombre} ${paciente.apellido}`}
                  >
                    {paciente.contacto_px}
                  </a>
                  <a
                    href={`https://wa.me/${(paciente.contacto_px || '').replace(/\D/g, '').replace(/^([89]\d{9})$/, '1$1')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center p-1 rounded hover:bg-accent"
                    aria-label={`Enviar WhatsApp a ${paciente.nombre} ${paciente.apellido}`}
                    title="Enviar mensaje por WhatsApp"
                  >
                    <FontAwesomeIcon icon={faWhatsapp} className="h-6 w-6 text-green-600" />
                  </a>
                </div>
              )}
              {paciente.zona && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  {paciente.zona.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </p>
              )}
              <Badge className={getDificultadColor(paciente.grado_dificultad)}>
                Dificultad: {paciente.grado_dificultad}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPacientes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            No se encontraron pacientes
          </CardContent>
        </Card>
      )}

      <PacienteDetailDialog
        pacienteId={selectedPacienteId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <EditPacienteDialog
        paciente={selectedPaciente}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={fetchPacientes}
      />

      <ImportPacientesDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={fetchPacientes}
      />

      {pacienteParaAgendar && (
        <>
          <AgendarLlamadaDialog
            open={agendarLlamadaOpen}
            onOpenChange={setAgendarLlamadaOpen}
            pacientes={pacientes.map(p => ({ ...p, id: p.id }))}
            personal={personal}
            onSuccess={() => {
              toast.success("Llamada agendada");
              setPacienteParaAgendar(null);
            }}
          />
        </>
      )}
    </div>
  );
};

export default Pacientes;
