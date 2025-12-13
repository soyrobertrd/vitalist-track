import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Calendar, PhoneCall, Pencil, Trash2, User } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

interface PacienteCardProps {
  paciente: {
    id: string;
    nombre: string;
    apellido: string;
    contacto_px: string | null;
    contacto_cuidador?: string | null;
    numero_principal?: string | null;
    status_px: string;
    grado_dificultad: string;
    zona: string | null;
    direccion_domicilio?: string | null;
    historia_medica_basica?: string | null;
    profesional_asignado_id?: string | null;
  };
  profesionalNombre?: string;
  onViewDetail: () => void;
  onEdit: () => void;
  onAgendarLlamada: () => void;
  onAgendarVisita: () => void;
  onDelete?: () => void;
  isAdmin?: boolean;
}

export const PacienteCard = ({
  paciente,
  profesionalNombre,
  onViewDetail,
  onEdit,
  onAgendarLlamada,
  onAgendarVisita,
  onDelete,
  isAdmin = false,
}: PacienteCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "activo":
        return "bg-green-500 text-white";
      case "inactivo":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-destructive text-destructive-foreground";
    }
  };

  const getDificultadColor = (dificultad: string) => {
    switch (dificultad) {
      case "bajo":
        return "bg-secondary text-secondary-foreground";
      case "medio":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
      case "alto":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const capitalizeStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Get the phone number to display based on priority
  const getDisplayPhone = () => {
    // If numero_principal is set, use that
    if (paciente.numero_principal) {
      return paciente.numero_principal;
    }
    // Otherwise, prefer patient's phone, fallback to caregiver's
    if (paciente.contacto_px) {
      return paciente.contacto_px;
    }
    if (paciente.contacto_cuidador) {
      return paciente.contacto_cuidador;
    }
    return null;
  };

  const displayPhone = getDisplayPhone();

  // Extraer primeras 2 enfermedades de la historia médica
  const getEnfermedades = () => {
    if (!paciente.historia_medica_basica) return null;
    const enfermedades = paciente.historia_medica_basica
      .split(/[,;\n]/)
      .map(e => e.trim())
      .filter(e => e.length > 0)
      .slice(0, 2);
    return enfermedades.length > 0 ? enfermedades.join(", ") : null;
  };

  const enfermedades = getEnfermedades();

  return (
    <Card className="hover:shadow-lg transition-all hover:scale-[1.01] flex flex-col h-full group relative overflow-hidden">
      {/* Badge de estado en esquina superior */}
      <div className="absolute top-3 right-3 z-10">
        <Badge className={`${getStatusColor(paciente.status_px)} text-xs`}>
          {capitalizeStatus(paciente.status_px)}
        </Badge>
      </div>

      <CardHeader className="pb-2">
        <CardTitle 
          className="text-lg font-semibold cursor-pointer hover:text-primary transition-colors pr-16 line-clamp-1"
          onClick={onViewDetail}
        >
          {paciente.nombre} {paciente.apellido}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 flex-1 flex flex-col">
        {/* Información del paciente */}
        <div className="space-y-2 text-sm flex-1">
          {/* Teléfono */}
          {displayPhone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <a
                href={`tel:${displayPhone.replace(/\D/g, '')}`}
                className="hover:text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {displayPhone}
              </a>
              <a
                href={`https://wa.me/${displayPhone.replace(/\D/g, '').replace(/^([89]\d{9})$/, '1$1')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="hover:opacity-80 transition-opacity"
                title="WhatsApp"
              >
                <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4 text-green-600" />
              </a>
            </div>
          )}

          {/* Dirección */}
          {paciente.direccion_domicilio && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(paciente.direccion_domicilio)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="line-clamp-1 hover:text-foreground hover:underline transition-colors"
                title="Ver en Google Maps"
              >
                {paciente.direccion_domicilio}
              </a>
            </div>
          )}

          {/* Zona (si no hay dirección) */}
          {!paciente.direccion_domicilio && paciente.zona && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">
                {paciente.zona.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            </div>
          )}

          {/* Enfermedades */}
          {enfermedades && (
            <div className="text-muted-foreground line-clamp-1 text-xs bg-muted/50 px-2 py-1 rounded">
              {enfermedades}
            </div>
          )}

          {/* Profesional asignado */}
          {profesionalNombre && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">{profesionalNombre}</span>
            </div>
          )}
        </div>

        {/* Badge de dificultad */}
        <Badge variant="outline" className={`${getDificultadColor(paciente.grado_dificultad)} w-fit`}>
          Dificultad: {paciente.grado_dificultad}
        </Badge>

        {/* Botones de acción */}
        <div className="flex items-center gap-1 pt-2 border-t">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onAgendarLlamada();
            }}
            title="Agendar llamada"
            className="flex-1 h-8"
          >
            <PhoneCall className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Llamada</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onAgendarVisita();
            }}
            title="Agendar visita"
            className="flex-1 h-8"
          >
            <Calendar className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Visita</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Editar"
            className="h-8 px-2"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {isAdmin && onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="h-8 px-2 text-destructive hover:text-destructive"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
