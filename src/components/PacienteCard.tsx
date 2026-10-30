import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, MapPin, Calendar, PhoneCall, Pencil, Trash2, Building2, Eye, ArrowRight, UserCheck, ExternalLink } from "lucide-react";
import { AccionesMenu } from "@/components/common/AccionesMenu";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { SelectionCheckbox } from "@/components/SelectionCheckbox";
import { avatarColor, iniciales as getIniciales, tituloNombre } from "@/lib/avatar";

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
  const navigate = useNavigate();
  // Solo se resalta la dificultad cuando requiere atención (medio/alto); "bajo" no añade ruido.
  // La dificultad se comunica con el color de la tarjeta (franja y borde), no con una etiqueta.
  const DIFICULTAD_STYLE: Record<string, { franja: string; borde: string; label: string }> = {
    bajo: { franja: "bg-success", borde: "", label: "Dificultad baja" },
    medio: { franja: "bg-warning", borde: "border-warning/40", label: "Dificultad media" },
    alto: { franja: "bg-destructive", borde: "border-destructive/40 bg-destructive/[0.03]", label: "Dificultad alta" },
  };
  const dificultad = DIFICULTAD_STYLE[paciente.grado_dificultad];

  const iniciales = getIniciales(paciente.nombre, paciente.apellido);

  // Get the phone number to display based on priority and check if it has WhatsApp
  const getDisplayPhoneWithWhatsApp = () => {
    const px = { phone: paciente.contacto_px, hasWhatsApp: paciente.whatsapp_px };
    const cuidador = { phone: paciente.contacto_cuidador, hasWhatsApp: paciente.whatsapp_cuidador };
    const principal = paciente.numero_principal === "cuidador" ? cuidador : px;
    const otro = principal === px ? cuidador : px;
    return principal.phone ? principal : otro.phone ? otro : { phone: null, hasWhatsApp: false };
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
      className={`group relative flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isSelected ? "ring-2 ring-primary bg-primary/5" : dificultad?.borde ?? ""
      }`}
    >
      {dificultad && (
        <span className={`absolute inset-y-0 left-0 w-1 ${dificultad.franja}`} title={dificultad.label} aria-hidden="true" />
      )}
      {selectionMode && onToggleSelect && (
        <SelectionCheckbox checked={isSelected} onCheckedChange={onToggleSelect} />
      )}

      <CardHeader className={`flex flex-row items-start gap-3 space-y-0 pb-2.5 ${selectionMode ? "pl-10" : ""}`}>
        <div
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${avatarColor(paciente.id)}`}
        >
          {iniciales}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <CardTitle className="line-clamp-1 text-sm font-bold leading-snug transition-colors group-hover:text-primary">
              {tituloNombre(`${paciente.nombre} ${paciente.apellido}`)}
            </CardTitle>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground capitalize">
            {paciente.status_px === "activo" ? "Activo en programa" : paciente.status_px}
          </span>
          {dificultad && <span className="sr-only">{dificultad.label}</span>}
        </div>
        <AccionesMenu
          label={`Acciones de ${paciente.nombre} ${paciente.apellido}`}
          acciones={[
            { label: "Expediente Hub 360°", icon: ExternalLink, onSelect: () => navigate(`/hub-paciente/${paciente.id}`) },
            { label: "Ver ficha rápida", icon: Eye, onSelect: onViewDetail },
            { label: "Agendar llamada", icon: PhoneCall, onSelect: onAgendarLlamada },
            { label: "Agendar visita", icon: Calendar, onSelect: onAgendarVisita },
            { label: "Editar paciente", icon: Pencil, onSelect: onEdit },
            { label: "Eliminar paciente", icon: Trash2, onSelect: () => onDelete?.(), peligro: true, oculta: !(isAdmin && onDelete) },
          ]}
        />
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-3 pt-0">
        <div className="space-y-2 text-xs">
          {displayPhone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <a
                href={`tel:${displayPhone.replace(/\D/g, "")}`}
                className="tabular-nums transition-colors hover:text-foreground font-medium"
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
                  <FontAwesomeIcon icon={faWhatsapp} className="h-3.5 w-3.5 text-success" />
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
            <div className="flex flex-wrap gap-1 pt-0.5">
              {enfermedades.map((e) => (
                <span key={e} className="max-w-full truncate rounded-md bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {e}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer con enlace interactivo Ficha 360 */}
        <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2.5 text-[11px]">
          <span className="text-muted-foreground truncate max-w-[140px]">
            {profesionalNombre ? `Dr(a). ${profesionalNombre}` : "Sin médico asignado"}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
            Ficha 360 <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
