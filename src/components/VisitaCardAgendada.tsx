import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Calendar, User, Mail } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { EnviarRecordatorioDialog } from "@/components/EnviarRecordatorioDialog";
import { SelectionCheckbox } from "@/components/SelectionCheckbox";
import { WhatsAppButton } from "@/components/WhatsAppButton";

interface Visita {
  id: string;
  fecha_hora_visita: string;
  tipo_visita: string;
  motivo_visita: string | null;
  estado: string;
  notas_visita: string | null;
  paciente_id?: string;
  pacientes: { 
    nombre: string; 
    apellido: string;
    contacto_px?: string | null;
    contacto_cuidador?: string | null;
    numero_principal?: string | null;
    whatsapp_px?: boolean | null;
    whatsapp_cuidador?: boolean | null;
  } | null;
  personal_salud: { nombre: string; apellido: string } | null;
  profesionales_adicionales?: any[];
}

interface VisitaCardAgendadaProps {
  visita: Visita;
  onVisitaClick: (visita: Visita) => void;
  isVisitOverdue: (visita: Visita) => boolean;
  isVisitToday?: (visita: Visita) => boolean;
  // Selection props
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export const VisitaCardAgendada = ({
  visita,
  onVisitaClick,
  isVisitOverdue,
  isVisitToday,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: VisitaCardAgendadaProps) => {
  const [recordatorioOpen, setRecordatorioOpen] = useState(false);
  const overdue = isVisitOverdue(visita);
  const today = isVisitToday ? isVisitToday(visita) : false;

  const formatearTexto = (texto: string | null) => {
    if (!texto) return 'N/A';
    return texto
      .split('_')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ');
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "realizada":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
      case "cancelada":
      case "no_realizada":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
      case "postpuesta":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTipoIcon = (tipo: string) => {
    return tipo === "domicilio" ? "🏠" : "🏥";
  };

  const getMainPhone = () => {
    if (!visita.pacientes) return null;
    // Priority: numero_principal > contacto_px > contacto_cuidador
    if (visita.pacientes.numero_principal) {
      return visita.pacientes.numero_principal;
    }
    if (visita.pacientes.contacto_px) {
      return visita.pacientes.contacto_px;
    }
    return visita.pacientes.contacto_cuidador;
  };

  const hasWhatsApp = () => {
    if (!visita.pacientes) return false;
    // If numero_principal matches contacto_cuidador, use cuidador's whatsapp flag
    if (visita.pacientes.numero_principal && visita.pacientes.numero_principal === visita.pacientes.contacto_cuidador) {
      return visita.pacientes.whatsapp_cuidador;
    }
    // If numero_principal matches contacto_px or is set, use px's whatsapp flag
    if (visita.pacientes.numero_principal && visita.pacientes.numero_principal === visita.pacientes.contacto_px) {
      return visita.pacientes.whatsapp_px;
    }
    // Fallback: check which contact we're using
    if (visita.pacientes.contacto_px) return visita.pacientes.whatsapp_px;
    return visita.pacientes.whatsapp_cuidador;
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
      onClick={() => !selectionMode && onVisitaClick(visita)}
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
            {visita.pacientes?.nombre} {visita.pacientes?.apellido}
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
            <Badge className={getEstadoBadgeColor(visita.estado)} variant="secondary">
              {formatearTexto(visita.estado)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 flex-1 flex flex-col">
        {visita.fecha_hora_visita && (
          <div className="bg-primary/5 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Fecha y Hora</p>
            <p className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              {format(new Date(visita.fecha_hora_visita), "dd/MM/yyyy")}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(visita.fecha_hora_visita), "HH:mm")}
            </p>
          </div>
        )}
        
        {visita.personal_salud && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Profesional Asignado</p>
            <p className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              {visita.personal_salud.nombre} {visita.personal_salud.apellido}
            </p>
          </div>
        )}

        {visita.profesionales_adicionales && visita.profesionales_adicionales.length > 0 && (
          <p className="text-xs text-muted-foreground">
            +{visita.profesionales_adicionales.length} profesional(es) más
          </p>
        )}

        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {getTipoIcon(visita.tipo_visita)} {formatearTexto(visita.tipo_visita)}
          </Badge>
        </div>
        
        {visita.motivo_visita && (
          <p className="text-xs text-muted-foreground line-clamp-2 pt-2 border-t">
            {visita.motivo_visita}
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
        tipo="visita"
        citaId={visita.id}
        pacienteNombre={`${visita.pacientes?.nombre} ${visita.pacientes?.apellido}`}
      />
    </Card>
  );
};
