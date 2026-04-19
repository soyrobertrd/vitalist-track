import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { enviarWhatsAppConPlantilla, WhatsAppCategoria } from "@/lib/whatsappService";

interface WhatsAppButtonProps {
  categoria: WhatsAppCategoria;
  telefono?: string | null;
  telefonoCuidador?: string | null;
  variables: Record<string, string | number | null | undefined>;
  pacienteId?: string | null;
  profesionalId?: string | null;
  citaId?: string | null;
  tipoCita?: "visita" | "llamada" | "factura";
  size?: "icon" | "sm" | "default";
  variant?: "default" | "outline" | "ghost";
  label?: string;
  className?: string;
}

/**
 * Botón verde de WhatsApp que abre wa.me con plantilla pre-renderizada.
 * Si hay teléfono de paciente y cuidador, muestra dropdown para elegir.
 */
export const WhatsAppButton = ({
  categoria,
  telefono,
  telefonoCuidador,
  variables,
  pacienteId,
  profesionalId,
  citaId,
  tipoCita,
  size = "icon",
  variant = "outline",
  label,
  className,
}: WhatsAppButtonProps) => {
  const tienePaciente = !!telefono;
  const tieneCuidador = !!telefonoCuidador;
  const tieneAlguno = tienePaciente || tieneCuidador;
  const tieneAmbos = tienePaciente && tieneCuidador;

  const handleSend = async (
    destinatario: "paciente" | "cuidador",
    tel: string
  ) => {
    const res = await enviarWhatsAppConPlantilla({
      categoria,
      telefono: tel,
      variables,
      pacienteId,
      profesionalId,
      citaId,
      tipoCita,
      destinatario,
    });
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo abrir WhatsApp");
    }
  };

  if (!tieneAlguno) return null;

  const baseClass =
    "bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] border-[#25D366]/30 " +
    (className ?? "");

  // Solo un destinatario → botón directo
  if (!tieneAmbos) {
    const tel = (telefono ?? telefonoCuidador) as string;
    const dest = tienePaciente ? "paciente" : "cuidador";
    return (
      <Button
        type="button"
        size={size}
        variant={variant}
        className={baseClass}
        onClick={(e) => {
          e.stopPropagation();
          handleSend(dest, tel);
        }}
        title={`Enviar WhatsApp al ${dest}`}
      >
        <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4" />
        {label && <span className="ml-2">{label}</span>}
      </Button>
    );
  }

  // Ambos → dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size={size}
          variant={variant}
          className={baseClass}
          onClick={(e) => e.stopPropagation()}
          title="Enviar WhatsApp"
        >
          <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4" />
          {label && <span className="ml-2">{label}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel>Enviar a</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleSend("paciente", telefono!)}>
          Paciente
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSend("cuidador", telefonoCuidador!)}>
          Cuidador
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
