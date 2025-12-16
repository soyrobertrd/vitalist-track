import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Calendar, Clock, User, Mail } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { format } from "date-fns";
import { EnviarRecordatorioDialog } from "@/components/EnviarRecordatorioDialog";
import { SelectionCheckbox } from "@/components/SelectionCheckbox";

interface Llamada {
  id: string;
  fecha_agendada: string | null;
  fecha_hora_realizada: string | null;
  estado: string;
  motivo: string | null;
  comentarios_resultados: string | null;
  resultado_seguimiento: string | null;
  duracion_minutos: number | null;
  duracion_estimada: number | null;
  requiere_seguimiento: boolean;
  notas_adicionales: string | null;
  paciente_id?: string;
  pacientes: { nombre: string; apellido: string } | null;
  personal_salud: { nombre: string; apellido: string } | null;
}

interface LlamadaCardAgendadaProps {
  llamada: Llamada;
  onLlamadaClick: (llamada: Llamada) => void;
  isCallOverdue: (llamada: Llamada) => boolean;
  isCallToday?: (llamada: Llamada) => boolean;
  getEstadoBadgeColor: (estado: string) => string;
  getResultadoBadgeColor: (resultado: string | null) => string;
  formatearTexto: (texto: string | null) => string;
  // Selection props
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export const LlamadaCardAgendada = ({
  llamada,
  onLlamadaClick,
  isCallOverdue,
  isCallToday,
  getEstadoBadgeColor,
  getResultadoBadgeColor,
  formatearTexto,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: LlamadaCardAgendadaProps) => {
  const [pacienteData, setPacienteData] = useState<any>(null);
  const [recordatorioOpen, setRecordatorioOpen] = useState(false);
  const overdue = isCallOverdue(llamada);
  const today = isCallToday ? isCallToday(llamada) : false;

  useEffect(() => {
    if (llamada.pacientes) {
      supabase
        .from("pacientes")
        .select("id, contacto_px, whatsapp_px, contacto_cuidador, whatsapp_cuidador, numero_principal")
        .eq("nombre", llamada.pacientes.nombre)
        .eq("apellido", llamada.pacientes.apellido)
        .single()
        .then(({ data }) => {
          setPacienteData(data);
        });
    }
  }, [llamada]);

  const getMainPhone = () => {
    if (!pacienteData) return null;
    // Priority: numero_principal > contacto_px > contacto_cuidador
    if (pacienteData.numero_principal) {
      return pacienteData.numero_principal;
    }
    if (pacienteData.contacto_px) {
      return pacienteData.contacto_px;
    }
    return pacienteData.contacto_cuidador;
  };

  const hasWhatsApp = () => {
    if (!pacienteData) return false;
    // If numero_principal matches contacto_cuidador, use cuidador's whatsapp flag
    if (pacienteData.numero_principal && pacienteData.numero_principal === pacienteData.contacto_cuidador) {
      return pacienteData.whatsapp_cuidador;
    }
    // If numero_principal matches contacto_px or is set, use px's whatsapp flag
    if (pacienteData.numero_principal && pacienteData.numero_principal === pacienteData.contacto_px) {
      return pacienteData.whatsapp_px;
    }
    // Fallback: check which contact we're using
    if (pacienteData.contacto_px) return pacienteData.whatsapp_px;
    return pacienteData.whatsapp_cuidador;
  };

  const getWhatsAppLink = () => {
    const phone = getMainPhone();
    if (!phone) return null;
    const cleanPhone = phone.replace(/\D/g, '');
    // Add country code if not present (Dominican Republic)
    const fullPhone = cleanPhone.startsWith('1') ? cleanPhone : `1${cleanPhone}`;
    return `https://wa.me/${fullPhone}`;
  };

  const mainPhone = getMainPhone();
  const whatsAppEnabled = hasWhatsApp();
  const whatsAppLink = getWhatsAppLink();

  return (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] flex flex-col h-full relative ${
        isSelected 
          ? 'ring-2 ring-primary bg-primary/5' 
          : overdue 
            ? 'border-destructive border-2 bg-destructive/5' 
            : today 
              ? 'border-green-500 border-2 bg-green-500/5' 
              : ''
      }`}
      onClick={() => !selectionMode && onLlamadaClick(llamada)}
    >
      {/* Selection checkbox */}
      {selectionMode && onToggleSelect && (
        <SelectionCheckbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
        />
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-2 flex-1">
            {llamada.pacientes?.nombre} {llamada.pacientes?.apellido}
          </CardTitle>
          <div className="flex gap-1 flex-wrap justify-end items-center">
            {mainPhone && (
              <a
                href={`tel:${mainPhone.replace(/\D/g, '')}`}
                onClick={(e) => e.stopPropagation()}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                aria-label="Llamar al paciente"
                title="Llamar"
              >
                <Phone className="h-4 w-4" />
              </a>
            )}
            {whatsAppEnabled && whatsAppLink && (
              <a
                href={whatsAppLink}
                onClick={(e) => e.stopPropagation()}
                target="_blank"
                rel="noopener noreferrer"
                className="md:hidden inline-flex items-center justify-center p-2 rounded-full bg-green-500 text-white hover:bg-green-600"
                aria-label="Enviar mensaje por WhatsApp"
                title="WhatsApp"
              >
                <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4" />
              </a>
            )}
            {overdue && (
              <Badge variant="destructive" className="text-xs">
                Atrasada
              </Badge>
            )}
            {today && !overdue && (
              <Badge className="bg-green-500 text-white text-xs">
                Hoy
              </Badge>
            )}
            <Badge className={getEstadoBadgeColor(llamada.estado)} variant="secondary">
              {formatearTexto(llamada.estado)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 flex-1 flex flex-col">
        {llamada.fecha_agendada && (
          <div className="bg-primary/5 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Fecha y Hora</p>
            <p className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              {format(new Date(llamada.fecha_agendada), "dd/MM/yyyy")}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(llamada.fecha_agendada), "HH:mm")}
            </p>
          </div>
        )}
        
        {llamada.personal_salud && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Profesional Asignado</p>
            <p className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              {llamada.personal_salud.nombre} {llamada.personal_salud.apellido}
            </p>
          </div>
        )}
        
        {llamada.duracion_estimada && (
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Clock className="h-3 w-3" />
            Duración: {llamada.duracion_estimada} min
          </p>
        )}
        
        {llamada.resultado_seguimiento && (
          <Badge variant="outline" className={`${getResultadoBadgeColor(llamada.resultado_seguimiento)} w-full justify-center`}>
            {formatearTexto(llamada.resultado_seguimiento)}
          </Badge>
        )}
        
        {llamada.motivo && (
          <p className="text-xs text-muted-foreground line-clamp-2 pt-2 border-t">
            {llamada.motivo}
          </p>
        )}
        
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={(e) => {
            e.stopPropagation();
            setRecordatorioOpen(true);
          }}
        >
          <Mail className="h-4 w-4 mr-2" />
          Enviar Recordatorio
        </Button>
      </CardContent>

      <EnviarRecordatorioDialog
        open={recordatorioOpen}
        onOpenChange={setRecordatorioOpen}
        tipo="llamada"
        citaId={llamada.id}
        pacienteNombre={`${llamada.pacientes?.nombre} ${llamada.pacientes?.apellido}`}
      />
    </Card>
  );
};
