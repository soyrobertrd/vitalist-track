import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, User, Mail, Ticket, Building2, CheckCircle2 } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { EnviarRecordatorioDialog } from "@/components/EnviarRecordatorioDialog";
import { SelectionCheckbox } from "@/components/SelectionCheckbox";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CitaTicketDialog } from "@/components/CitaTicketDialog";

const ESTADO_ACENTO: Record<string, string> = {
  pendiente: "bg-primary",
  realizada: "bg-success",
  cancelada: "bg-destructive",
  no_realizada: "bg-destructive",
  postpuesta: "bg-warning",
};

interface Visita {
  id: string;
  fecha_hora_visita: string;
  tipo_visita: string;
  motivo_visita: string | null;
  estado: string;
  notas_visita: string | null;
  paciente_id?: string;
  confirmada_por_paciente?: boolean;
  // Reservas por enlace público (planes Gratis / Solo doctor): sin paciente, solo contacto
  solicitante_nombre?: string | null;
  solicitante_telefono?: string | null;
  pendiente_registro?: boolean;
  origen?: string;
  pacientes: { 
    nombre: string; 
    apellido: string;
    contacto_px?: string | null;
    contacto_cuidador?: string | null;
    numero_principal?: string | null;
    whatsapp_px?: boolean | null;
    whatsapp_cuidador?: boolean | null;
    clinica_origen?: string | null;
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
  const [ticketOpen, setTicketOpen] = useState(false);
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
        return "border-primary/30 bg-primary/10 text-primary";
      case "realizada":
        return "border-success/30 bg-success/10 text-success";
      case "cancelada":
      case "no_realizada":
        return "border-destructive/30 bg-destructive/10 text-destructive";
      case "postpuesta":
        return "border-warning/30 bg-warning/10 text-warning";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTipoIcon = (tipo: string) => {
    return tipo === "domicilio" ? "🏠" : "🏥";
  };

  // numero_principal indica cuál contacto es el principal ("paciente" | "cuidador"), no es un teléfono
  const usaCuidador = () =>
    visita.pacientes?.numero_principal === "cuidador" ? !!visita.pacientes.contacto_cuidador : !visita.pacientes?.contacto_px;

  const getMainPhone = () => {
    if (!visita.pacientes) return visita.solicitante_telefono ?? null;
    return usaCuidador() ? visita.pacientes.contacto_cuidador ?? null : visita.pacientes.contacto_px ?? null;
  };

  const hasWhatsApp = () => {
    if (!visita.pacientes) return false;
    return usaCuidador() ? visita.pacientes.whatsapp_cuidador : visita.pacientes.whatsapp_px;
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

  const nombre = visita.pacientes
    ? `${visita.pacientes.nombre} ${visita.pacientes.apellido}`
    : visita.solicitante_nombre ?? "Sin paciente";
  const fechaCita = visita.fecha_hora_visita ? new Date(visita.fecha_hora_visita) : null;
  // Franja lateral de color: atrasada > hoy > estado
  const acento = overdue ? "bg-destructive" : today ? "bg-success" : ESTADO_ACENTO[visita.estado] ?? "bg-border";

  return (
    <Card
      className={`group relative flex h-full cursor-pointer flex-col overflow-hidden transition-colors hover:border-primary/40 ${
        isSelected ? "ring-2 ring-primary bg-primary/5" : ""
      }`}
      onClick={() => !selectionMode && onVisitaClick(visita)}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${acento}`} aria-hidden="true" />

      {selectionMode && onToggleSelect && (
        <SelectionCheckbox checked={isSelected} onCheckedChange={onToggleSelect} />
      )}

      <CardHeader className={`flex flex-row items-start gap-3 space-y-0 pb-3 ${selectionMode ? "pl-10" : "pl-5"}`}>
        {/* Bloque de hora, como en las agendas de las referencias */}
        {fechaCita && (
          <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-primary/10 py-1.5 text-primary">
            <span className="text-base font-bold leading-none tabular-nums">{format(fechaCita, "HH:mm")}</span>
            <span className="mt-1 text-[10px] font-medium uppercase">{format(fechaCita, "d MMM", { locale: es })}</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <CardTitle className="line-clamp-1 text-base font-semibold">{nombre}</CardTitle>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <User className="h-3 w-3 shrink-0" aria-hidden="true" />
            {visita.personal_salud ? `${visita.personal_salud.nombre} ${visita.personal_salud.apellido}` : "Sin profesional"}
            {visita.profesionales_adicionales && visita.profesionales_adicionales.length > 0 && (
              <span className="shrink-0">+{visita.profesionales_adicionales.length}</span>
            )}
          </p>
        </div>
        <Badge variant="outline" className={`shrink-0 text-[11px] ${getEstadoBadgeColor(visita.estado)}`}>
          {formatearTexto(visita.estado)}
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 pl-5">
        <div className="flex flex-wrap items-center gap-1.5">
          {overdue && <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-[11px] text-destructive">Atrasada</Badge>}
          {today && !overdue && <Badge variant="outline" className="border-success/30 bg-success/10 text-[11px] text-success">Hoy</Badge>}
          <Badge variant="outline" className="text-[11px] font-normal">
            {visita.tipo_visita === "domicilio" ? "Domiciliaria" : "Consultorio"}
          </Badge>
          {visita.confirmada_por_paciente && (
            <Badge variant="outline" className="gap-1 border-success/30 bg-success/10 text-[11px] text-success">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Confirmada
            </Badge>
          )}
          {visita.origen === "enlace_publico" && (
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-[11px] text-primary">
              {visita.pendiente_registro ? "Pendiente de registrar" : "Reserva en línea"}
            </Badge>
          )}
          {visita.pacientes?.clinica_origen && (
            <Badge variant="outline" className="gap-1 text-[11px] font-normal text-muted-foreground">
              <Building2 className="h-3 w-3" aria-hidden="true" />
              {visita.pacientes.clinica_origen}
            </Badge>
          )}
        </div>

        {visita.motivo_visita && (
          <p className="line-clamp-2 flex-1 text-xs text-muted-foreground">{visita.motivo_visita}</p>
        )}

        <div className="mt-auto flex items-center gap-1.5 border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 flex-1 rounded-full bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
            onClick={(e) => { e.stopPropagation(); setRecordatorioOpen(true); }}
          >
            <Mail className="mr-1.5 h-4 w-4" aria-hidden="true" /> Recordatorio
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 flex-1 rounded-full bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
            onClick={(e) => { e.stopPropagation(); setTicketOpen(true); }}
          >
            <Ticket className="mr-1.5 h-4 w-4" aria-hidden="true" /> Ticket
          </Button>
          {mainPhone && (
            <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full">
              <a href={`tel:${mainPhone.replace(/\D/g, "")}`} onClick={(e) => e.stopPropagation()} aria-label="Llamar al paciente" title="Llamar">
                <Phone className="h-4 w-4" />
              </a>
            </Button>
          )}
          {whatsAppEnabled && whatsAppLink && (
            <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full text-success hover:text-success">
              <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} aria-label="Enviar mensaje por WhatsApp" title="WhatsApp">
                <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>

      <EnviarRecordatorioDialog
        open={recordatorioOpen}
        onOpenChange={setRecordatorioOpen}
        tipo="visita"
        citaId={visita.id}
        pacienteNombre={visita.pacientes ? `${visita.pacientes.nombre} ${visita.pacientes.apellido}` : visita.solicitante_nombre ?? ""}
      />

      {visita.paciente_id && (
        <CitaTicketDialog
          open={ticketOpen}
          onOpenChange={setTicketOpen}
          tipo="visita"
          citaId={visita.id}
          pacienteId={visita.paciente_id}
          pacienteNombre={`${visita.pacientes?.nombre || ""} ${visita.pacientes?.apellido || ""}`}
          pacienteTelefono={mainPhone}
          whatsappEnabled={!!whatsAppEnabled}
          fechaCita={visita.fecha_hora_visita}
          profesionalNombre={visita.personal_salud ? `${visita.personal_salud.nombre} ${visita.personal_salud.apellido}` : undefined}
          motivoCita={visita.motivo_visita || undefined}
          tipoVisita={visita.tipo_visita}
        />
      )}
    </Card>
  );
};
