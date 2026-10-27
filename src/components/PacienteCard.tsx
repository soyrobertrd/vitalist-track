import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Calendar, PhoneCall, Pencil, Trash2, Building2 } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { SelectionCheckbox } from "@/components/SelectionCheckbox";

interface PacienteCardProps {
  paciente: {
    id: string;
    nombre: string;
    apellido: string;
    contacto_px: string | null;
    contacto_cuidador?: string | null;
    numero_principal?: string | null;
    whatsapp_px?: boolean;
    whatsapp_cuidador?: boolean;
    status_px: string;
    grado_dificultad: string;
    zona: string | null;
    direccion_domicilio?: string | null;
    historia_medica_basica?: string | null;
    profesional_asignado_id?: string | null;
    clinica_origen?: string | null;
  };
  profesionalNombre?: string;
  onViewDetail: () => void;
  onEdit: () => void;
  onAgendarLlamada: () => void;
  onAgendarVisita: () => void;
  onDelete?: () => void;
  isAdmin?: boolean;
  // Selection props
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
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
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: PacienteCardProps) => {
  const STATUS_STYLE: Record<string, { dot: string; label: string }> = {
    activo: { dot: "bg-success", label: "Activo" },
    inactivo: { dot: "bg-muted-foreground", label: "Inactivo" },
  };
  const status = STATUS_STYLE[paciente.status_px] ?? {
    dot: "bg-destructive",
    label: paciente.status_px.charAt(0).toUpperCase() + paciente.status_px.slice(1),
  };

  // Solo se resalta la dificultad cuando requiere atención (medio/alto); "bajo" no añade ruido.
  const DIFICULTAD_STYLE: Record<string, string> = {
    medio: "border-warning/30 bg-warning/10 text-warning",
    alto: "border-destructive/30 bg-destructive/10 text-destructive",
  };

  const iniciales = `${paciente.nombre?.[0] ?? ""}${paciente.apellido?.[0] ?? ""}`.toUpperCase();

  // Get the phone number to display based on priority and check if it has WhatsApp
  const getDisplayPhoneWithWhatsApp = () => {
    // If numero_principal is set, use that
    if (paciente.numero_principal) {
      // Check which contact matches numero_principal to determine WhatsApp flag
      if (paciente.numero_principal === paciente.contacto_cuidador) {
        return { phone: paciente.numero_principal, hasWhatsApp: paciente.whatsapp_cuidador };
      }
      if (paciente.numero_principal === paciente.contacto_px) {
        return { phone: paciente.numero_principal, hasWhatsApp: paciente.whatsapp_px };
      }
      // If numero_principal doesn't match either, still return it (could be a different number)
      return { phone: paciente.numero_principal, hasWhatsApp: false };
    }
    // Otherwise, prefer patient's phone, fallback to caregiver's
    if (paciente.contacto_px) {
      return { phone: paciente.contacto_px, hasWhatsApp: paciente.whatsapp_px };
    }
    if (paciente.contacto_cuidador) {
      return { phone: paciente.contacto_cuidador, hasWhatsApp: paciente.whatsapp_cuidador };
    }
    return { phone: null, hasWhatsApp: false };
  };

  const { phone: displayPhone, hasWhatsApp } = getDisplayPhoneWithWhatsApp();

  // Extraer primeras 2 enfermedades de la historia médica
  const getEnfermedades = () => {
    if (!paciente.historia_medica_basica) return null;
    const enfermedades = paciente.historia_medica_basica
      .split(/[,;\n]/)
      .map(e => e.trim())
      .filter(e => e.length > 0)
      .slice(0, 3);
    return enfermedades.length > 0 ? enfermedades : null;
  };

  const enfermedades = getEnfermedades();

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };
  const onCardActivate = selectionMode && onToggleSelect ? onToggleSelect : onViewDetail;

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`Ver ficha de ${paciente.nombre} ${paciente.apellido}`}
      onClick={onCardActivate}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onCardActivate();
        }
      }}
      className={`group relative flex h-full cursor-pointer flex-col overflow-hidden border bg-card text-card-foreground shadow-none transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isSelected ? "ring-2 ring-primary bg-primary/5" : ""
      }`}
    >
      {selectionMode && onToggleSelect && (
        <SelectionCheckbox checked={isSelected} onCheckedChange={onToggleSelect} />
      )}

      <CardHeader className={`flex flex-row items-start gap-3 space-y-0 pb-3 ${selectionMode ? "pl-10" : ""}`}>
        <div
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
        >
          {iniciales}
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="line-clamp-1 text-base font-semibold transition-colors group-hover:text-primary">
            {paciente.nombre} {paciente.apellido}
          </CardTitle>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${status.dot}`} aria-hidden="true" />
            <span>{status.label}</span>
            {profesionalNombre && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">{profesionalNombre}</span>
              </>
            )}
          </div>
        </div>
        {DIFICULTAD_STYLE[paciente.grado_dificultad] && (
          <Badge
            variant="outline"
            className={`shrink-0 text-[11px] font-medium ${DIFICULTAD_STYLE[paciente.grado_dificultad]}`}
          >
            {paciente.grado_dificultad === "alto" ? "Alta dificultad" : "Dificultad media"}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex-1 space-y-2 text-sm">
          {displayPhone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <a
                href={`tel:${displayPhone.replace(/\D/g, "")}`}
                className="tabular-nums transition-colors hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                {displayPhone}
              </a>
              {hasWhatsApp && (
                <a
                  href={`https://wa.me/${displayPhone.replace(/\D/g, "").replace(/^([89]\d{9})$/, "1$1")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="transition-opacity hover:opacity-80"
                  aria-label="Escribir por WhatsApp"
                  title="WhatsApp"
                >
                  <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4 text-success" />
                </a>
              )}
            </div>
          )}

          {(paciente.direccion_domicilio || paciente.zona) && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {paciente.direccion_domicilio ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(paciente.direccion_domicilio)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="line-clamp-1 transition-colors hover:text-foreground hover:underline"
                  title="Ver en Google Maps"
                >
                  {paciente.direccion_domicilio}
                </a>
              ) : (
                <span className="line-clamp-1">
                  {paciente.zona!.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
              )}
            </div>
          )}

          {paciente.clinica_origen && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="line-clamp-1">{paciente.clinica_origen}</span>
            </div>
          )}

          {enfermedades && (
            <div className="flex flex-wrap gap-1 pt-1">
              {enfermedades.map((e) => (
                <span key={e} className="max-w-full truncate rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {e}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="-mx-2 flex items-center gap-1 border-t px-0 pt-2">
          <Button size="sm" variant="ghost" onClick={stop(onAgendarLlamada)} className="h-8 flex-1">
            <PhoneCall className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Llamada
          </Button>
          <Button size="sm" variant="ghost" onClick={stop(onAgendarVisita)} className="h-8 flex-1">
            <Calendar className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Visita
          </Button>
          <Button size="icon" variant="ghost" onClick={stop(onEdit)} className="h-8 w-8" aria-label="Editar paciente" title="Editar">
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Button>
          {isAdmin && onDelete && (
            <Button
              size="icon"
              variant="ghost"
              onClick={stop(onDelete)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              aria-label="Eliminar paciente"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
