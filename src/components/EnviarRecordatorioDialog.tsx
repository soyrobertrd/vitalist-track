import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send, Users, MessageCircle } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

interface EnviarRecordatorioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: "llamada" | "visita";
  citaId: string;
  pacienteNombre: string;
  emailPaciente?: string;
  emailCuidador?: string;
  telefonoPaciente?: string;
  telefonoCuidador?: string;
  fechaCita?: string;
  horaCita?: string;
}

export function EnviarRecordatorioDialog({
  open,
  onOpenChange,
  tipo,
  citaId,
  pacienteNombre,
  emailPaciente,
  emailCuidador,
  telefonoPaciente,
  telefonoCuidador,
  fechaCita,
  horaCita,
}: EnviarRecordatorioDialogProps) {
  const [loading, setLoading] = useState(false);
  const [plantillas, setPlantillas] = useState<any[]>([]);
  const [selectedPlantilla, setSelectedPlantilla] = useState<string>("");
  const [destinatarios, setDestinatarios] = useState<string[]>(["paciente"]);
  const [canal, setCanal] = useState<"email" | "whatsapp">("email");

  useEffect(() => {
    if (open) {
      fetchPlantillas();
      const defaultDestinatarios: string[] = [];
      if (emailPaciente || telefonoPaciente) defaultDestinatarios.push("paciente");
      if (emailCuidador || telefonoCuidador) defaultDestinatarios.push("cuidador");
      if (defaultDestinatarios.length === 0) defaultDestinatarios.push("paciente");
      setDestinatarios(defaultDestinatarios);
    }
  }, [open, emailPaciente, emailCuidador, telefonoPaciente, telefonoCuidador]);

  const fetchPlantillas = async () => {
    const { data, error } = await supabase
      .from("plantillas_correo")
      .select("*")
      .eq("activo", true)
      .eq("tipo", "recordatorio")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al cargar plantillas:", error);
      toast.error("Error al cargar plantillas de correo");
    } else {
      setPlantillas(data || []);
      if (data && data.length > 0) {
        setSelectedPlantilla(data[0].id);
      }
    }
  };

  const handleDestinatarioChange = (dest: string, checked: boolean) => {
    setDestinatarios(prev => 
      checked ? [...prev, dest] : prev.filter(d => d !== dest)
    );
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    // Limpiar el número de teléfono
    const cleaned = phone.replace(/\D/g, '');
    // Si no tiene código de país, agregar 1809 (República Dominicana)
    if (cleaned.length === 10) {
      return `1${cleaned}`;
    }
    return cleaned;
  };

  const generateWhatsAppMessage = () => {
    const mensaje = `Hola ${pacienteNombre}!\n\n` +
      `Le recordamos que tiene una cita programada:\n\n` +
      `📅 Fecha: ${fechaCita || 'Por confirmar'}\n` +
      `🕐 Hora: ${horaCita || 'Por confirmar'}\n` +
      `📋 Tipo: ${tipo === 'llamada' ? 'Llamada telefónica' : 'Visita'}\n\n` +
      `Por favor confirme su asistencia respondiendo a este mensaje.\n\n` +
      `¡Gracias!`;
    return encodeURIComponent(mensaje);
  };

  const handleEnviarWhatsApp = () => {
    const telefonos: { nombre: string; telefono: string }[] = [];
    
    if (destinatarios.includes("paciente") && telefonoPaciente) {
      telefonos.push({ nombre: "Paciente", telefono: telefonoPaciente });
    }
    if (destinatarios.includes("cuidador") && telefonoCuidador) {
      telefonos.push({ nombre: "Cuidador", telefono: telefonoCuidador });
    }

    if (telefonos.length === 0) {
      toast.error("No hay números de WhatsApp disponibles para los destinatarios seleccionados");
      return;
    }

    const mensaje = generateWhatsAppMessage();

    // Abrir WhatsApp para cada destinatario
    telefonos.forEach((dest, index) => {
      const formattedPhone = formatPhoneForWhatsApp(dest.telefono);
      const url = `https://wa.me/${formattedPhone}?text=${mensaje}`;
      
      // Registrar en historial
      supabase.from("historial_recordatorios").insert({
        tipo_cita: tipo,
        cita_id: citaId,
        paciente_id: null, // Se puede obtener del contexto si es necesario
        destinatarios: [dest.telefono],
        canal: "whatsapp",
        estado: "enviado",
        tipo_recordatorio: "1_dia",
      });

      // Abrir en nueva ventana con delay para múltiples destinatarios
      setTimeout(() => {
        window.open(url, '_blank');
      }, index * 500);
    });

    toast.success(`Abriendo WhatsApp para ${telefonos.length} destinatario(s)`);
    onOpenChange(false);
  };

  const handleEnviarEmail = async () => {
    if (!selectedPlantilla) {
      toast.error("Debe seleccionar una plantilla");
      return;
    }

    if (destinatarios.length === 0) {
      toast.error("Debe seleccionar al menos un destinatario");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-recordatorio-cita", {
        body: {
          tipo,
          citaId,
          plantillaId: selectedPlantilla,
          destinatarios,
          canal: "email",
        },
      });

      if (error) throw error;

      if (data?.success) {
        if (data?.skipped) {
          toast.info("El paciente tiene las notificaciones desactivadas");
        } else {
          toast.success(`Recordatorio enviado a: ${data.destinatarios?.join(", ")}`);
        }
        onOpenChange(false);
      } else {
        throw new Error(data?.error || "Error al enviar recordatorio");
      }
    } catch (error: any) {
      console.error("Error al enviar recordatorio:", error);
      toast.error(error.message || "Error al enviar el recordatorio");
    } finally {
      setLoading(false);
    }
  };

  const tieneEmailsPaciente = !!emailPaciente;
  const tieneEmailsCuidador = !!emailCuidador;
  const tieneWhatsAppPaciente = !!telefonoPaciente;
  const tieneWhatsAppCuidador = !!telefonoCuidador;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Enviar Recordatorio
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Paciente</Label>
              <p className="font-medium">{pacienteNombre}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Tipo</Label>
              <p className="font-medium capitalize">{tipo}</p>
            </div>
          </div>

          <Tabs value={canal} onValueChange={(v) => setCanal(v as "email" | "whatsapp")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4" />
                WhatsApp
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4 mt-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4" />
                  Destinatarios
                </Label>
                <div className="space-y-2 border rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email-paciente"
                      checked={destinatarios.includes("paciente")}
                      onCheckedChange={(checked) => handleDestinatarioChange("paciente", checked as boolean)}
                      disabled={!tieneEmailsPaciente}
                    />
                    <label htmlFor="email-paciente" className="text-sm font-medium leading-none">
                      Paciente {emailPaciente ? `(${emailPaciente})` : "(sin email)"}
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email-cuidador"
                      checked={destinatarios.includes("cuidador")}
                      onCheckedChange={(checked) => handleDestinatarioChange("cuidador", checked as boolean)}
                      disabled={!tieneEmailsCuidador}
                    />
                    <label htmlFor="email-cuidador" className="text-sm font-medium leading-none">
                      Cuidador {emailCuidador ? `(${emailCuidador})` : "(sin email)"}
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email-profesional"
                      checked={destinatarios.includes("profesional")}
                      onCheckedChange={(checked) => handleDestinatarioChange("profesional", checked as boolean)}
                    />
                    <label htmlFor="email-profesional" className="text-sm font-medium leading-none">
                      Profesional asignado
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <Label>Plantilla de Correo</Label>
                <Select value={selectedPlantilla} onValueChange={setSelectedPlantilla}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una plantilla" />
                  </SelectTrigger>
                  <SelectContent>
                    {plantillas.map((plantilla) => (
                      <SelectItem key={plantilla.id} value={plantilla.id}>
                        {plantilla.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {plantillas.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    No hay plantillas de recordatorio activas
                  </p>
                )}
              </div>

              <Button 
                onClick={handleEnviarEmail} 
                disabled={loading || plantillas.length === 0 || destinatarios.length === 0}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? "Enviando..." : "Enviar por Email"}
              </Button>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-4 mt-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4" />
                  Destinatarios
                </Label>
                <div className="space-y-2 border rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="wa-paciente"
                      checked={destinatarios.includes("paciente")}
                      onCheckedChange={(checked) => handleDestinatarioChange("paciente", checked as boolean)}
                      disabled={!tieneWhatsAppPaciente}
                    />
                    <label htmlFor="wa-paciente" className="text-sm font-medium leading-none">
                      Paciente {telefonoPaciente ? `(${telefonoPaciente})` : "(sin teléfono)"}
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="wa-cuidador"
                      checked={destinatarios.includes("cuidador")}
                      onCheckedChange={(checked) => handleDestinatarioChange("cuidador", checked as boolean)}
                      disabled={!tieneWhatsAppCuidador}
                    />
                    <label htmlFor="wa-cuidador" className="text-sm font-medium leading-none">
                      Cuidador {telefonoCuidador ? `(${telefonoCuidador})` : "(sin teléfono)"}
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-muted p-3 rounded-lg">
                <Label className="text-sm text-muted-foreground mb-2 block">Vista previa del mensaje</Label>
                <p className="text-sm whitespace-pre-wrap">
                  Hola {pacienteNombre}!{'\n\n'}
                  Le recordamos que tiene una cita programada:{'\n\n'}
                  📅 Fecha: {fechaCita || 'Por confirmar'}{'\n'}
                  🕐 Hora: {horaCita || 'Por confirmar'}{'\n'}
                  📋 Tipo: {tipo === 'llamada' ? 'Llamada telefónica' : 'Visita'}
                </p>
              </div>

              <Button 
                onClick={handleEnviarWhatsApp} 
                disabled={destinatarios.length === 0 || (!tieneWhatsAppPaciente && !tieneWhatsAppCuidador)}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
              >
                <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4 mr-2" />
                Abrir WhatsApp
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Se abrirá WhatsApp Web o la aplicación
              </p>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
